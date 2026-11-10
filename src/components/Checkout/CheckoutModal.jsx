import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    X, 
    User, 
    Phone, 
    Mail, 
    MapPin, 
    Building2, 
    Navigation, 
    FileText, 
    ShoppingCart, 
    Plus, 
    Minus, 
    CheckCircle2, 
    AlertCircle, 
    Loader2, 
    Sparkles, 
    Check,
    Truck,
    ShieldCheck
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { orderParams } from '../../lib/api/orders';
import { supabase } from '../../lib/supabaseClient';
import { getDistricts, getThanas } from '../../data/bangladeshLocations';
import { sendTelegramOrderNotification } from '../../lib/telegramNotifier';
import { sendNtfyOrderNotification } from '../../lib/ntfyNotifier';
import { trackEvent } from '../../lib/tracker';
import { trackMetaPurchase } from '../../lib/metaPixel';
import { compressImage } from '../../lib/imageCompressor';
import { normalizeBDPhone, isValidBDPhone } from '../../lib/phoneValidation';

const DHAKA_SUB_URBAN_AREAS = [
    'savar', 'keraniganj', 'dhamrai', 'ashulia', 'tongi', 'gazipur', 'narayanganj'
];

const CheckoutModal = () => {
    const { 
        isCheckoutModalOpen, 
        closeCheckoutModal, 
        cartItems, 
        cartTotal, 
        updateQuantity, 
        removeFromCart, 
        clearCart 
    } = useCart();
    const { user } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: user?.email || '',
        address: '',
        district: 'Dhaka',
        thana: '',
        notes: ''
    });

    const [formErrors, setFormErrors] = useState({});
    const [phoneError, setPhoneError] = useState('');
    const [availableThanas, setAvailableThanas] = useState([]);
    const [selectedDeliveryZone, setSelectedDeliveryZone] = useState('inside'); // 'inside' (70), 'sub' (100), 'outside' (120)
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [stockError, setStockError] = useState(null);

    // Sync logged in user info
    useEffect(() => {
        if (user?.email && !formData.email) {
            setFormData(prev => ({ ...prev, email: user.email }));
        }
    }, [user]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isCheckoutModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
            setStockError(null);
            setFormErrors({});
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isCheckoutModalOpen]);

    // Update Thanas when district changes
    useEffect(() => {
        if (formData.district) {
            const thanas = getThanas(formData.district);
            setAvailableThanas(thanas);
            
            // Auto set first thana if current thana isn't in list
            if (!thanas.includes(formData.thana)) {
                setFormData(prev => ({ ...prev, thana: thanas[0] || '' }));
            }

            // Intelligent delivery zone default based on district
            const lowerDistrict = formData.district.toLowerCase();
            if (lowerDistrict === 'dhaka') {
                setSelectedDeliveryZone(prev => (prev === 'sub' ? 'sub' : 'inside'));
            } else if (lowerDistrict === 'gazipur' || lowerDistrict === 'narayanganj') {
                setSelectedDeliveryZone('sub');
            } else {
                setSelectedDeliveryZone('outside');
            }
        } else {
            setAvailableThanas([]);
        }
    }, [formData.district]);

    // Watch Thana to refine Dhaka Sub-Urban
    useEffect(() => {
        if (formData.district?.toLowerCase() === 'dhaka' && formData.thana) {
            const lowerThana = formData.thana.toLowerCase();
            const isSubUrban = DHAKA_SUB_URBAN_AREAS.some(area => lowerThana.includes(area));
            if (isSubUrban) {
                setSelectedDeliveryZone('sub');
            } else {
                setSelectedDeliveryZone('inside');
            }
        }
    }, [formData.thana, formData.district]);

    // Total items count and free delivery calculation
    const totalItemsCount = useMemo(() => {
        return cartItems.reduce((acc, item) => acc + (Number(item.quantity) || 1), 0);
    }, [cartItems]);

    // Requirement: "if anyone selects 3 products then the delivery charge should be free"
    const isFreeDelivery = totalItemsCount >= 3;

    // Delivery fee based on selected zone
    const baseDeliveryCharge = useMemo(() => {
        switch (selectedDeliveryZone) {
            case 'inside':
                return 70;
            case 'sub':
                return 100;
            case 'outside':
                return 120;
            default:
                return 70;
        }
    }, [selectedDeliveryZone]);

    const effectiveDeliveryCharge = isFreeDelivery ? 0 : baseDeliveryCharge;
    const finalTotal = cartTotal + effectiveDeliveryCharge;

    const handleFieldChange = (e) => {
        const { name, value } = e.target;

        setFormErrors(prev => {
            if (!prev[name]) return prev;
            const updated = { ...prev };
            delete updated[name];
            return updated;
        });

        if (name === 'phone') {
            const cleaned = normalizeBDPhone(value);
            if (!value.trim()) {
                setPhoneError('');
            } else if (cleaned.length > 11) {
                setPhoneError('ফোন নম্বর সর্বোচ্চ ১১ ডিজিট হতে হবে');
            } else if (cleaned.length === 11) {
                if (!isValidBDPhone(value)) {
                    setPhoneError('সঠিক মোবাইল নম্বর দিন (০১৩-০১৯ দিয়ে শুরু)');
                } else {
                    setPhoneError('');
                }
            } else {
                setPhoneError('');
            }
            setFormData(prev => ({ ...prev, [name]: value }));
            return;
        }

        if (name === 'district') {
            setFormData(prev => ({ ...prev, district: value, thana: '' }));
            return;
        }

        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleZoneSelect = (zone) => {
        setSelectedDeliveryZone(zone);
    };

    const handleSubmitOrder = async (e) => {
        e.preventDefault();

        if (cartItems.length === 0) {
            showToast('আপনার কার্ট খালি! অনুগ্রহ করে পণ্য যুক্ত করুন।', 'warning');
            return;
        }

        const errors = {};

        // 1. Name validation
        if (!formData.name.trim()) {
            errors.name = 'আপনার নাম লিখুন';
        }

        // 2. Phone validation (BD 11-digit format)
        const cleanPhone = normalizeBDPhone(formData.phone);
        if (!formData.phone.trim()) {
            errors.phone = 'মোবাইল নাম্বার আবশ্যক';
        } else if (!isValidBDPhone(formData.phone)) {
            if (cleanPhone.length !== 11) {
                errors.phone = `ফোন নম্বর অবশ্যই ১১ ডিজিটের হতে হবে (বর্তমানে ${cleanPhone.length} ডিজিট)`;
            } else {
                errors.phone = 'সঠিক মোবাইল নম্বর দিন (০১৩-০১৯ দিয়ে শুরু)';
            }
        }

        // 3. Optional Email validation (Only validated if user entered something!)
        if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
            errors.email = 'সঠিক ইমেইল অ্যাড্রেস লিখুন অথবা খালি রাখুন';
        }

        // 4. Address validation
        if (!formData.address.trim()) {
            errors.address = 'আপনার সম্পূর্ণ ঠিকানা লিখুন';
        }

        // 5. District & Thana validation
        if (!formData.district.trim()) {
            errors.district = 'জেলা নির্বাচন করুন';
        }
        if (!formData.thana.trim()) {
            errors.thana = 'থানা নির্বাচন করুন';
        }

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            setPhoneError(errors.phone || '');
            const firstErrorKey = Object.keys(errors)[0];
            showToast(errors[firstErrorKey], 'error');
            return;
        }

        setFormErrors({});
        setPhoneError('');
        setStockError(null);
        setIsSubmitting(true);

        try {
            // Verify real-time stock from Supabase
            const itemIds = cartItems.map(item => item.id).filter(Boolean);
            if (itemIds.length > 0) {
                const { data: latestProducts, error: productsError } = await supabase
                    .from('products')
                    .select('id, name, stock_quantity, variants, is_active')
                    .in('id', itemIds);

                if (productsError) throw productsError;

                const outOfStockList = [];

                for (const item of cartItems) {
                    const dbProduct = latestProducts?.find(p => String(p.id) === String(item.id));

                    if (!dbProduct || dbProduct.is_active === false) {
                        outOfStockList.push({ ...item, currentStock: 0 });
                        continue;
                    }

                    let dbVariant = null;
                    const variantId = item.variant_id || item.variant?.id;

                    if (variantId && variantId !== 'base' && Array.isArray(dbProduct.variants)) {
                        dbVariant = dbProduct.variants.find(v => String(v.id) === String(variantId));
                    }

                    if (!dbVariant && (item.selected_color || item.variant?.color) && Array.isArray(dbProduct.variants)) {
                        const targetColor = String(item.selected_color || item.variant?.color || '').trim().toLowerCase();
                        const targetSize = String(item.selected_size || item.variant?.size || '').trim().toLowerCase();
                        dbVariant = dbProduct.variants.find(v => {
                            const vColor = String(v.color || '').trim().toLowerCase();
                            const vSize = String(v.size || '').trim().toLowerCase();
                            return vColor === targetColor && (!targetSize || targetSize === 'standard' || !vSize || vSize === targetSize);
                        });
                    }

                    let availableStock = 0;
                    if (dbVariant && dbVariant.stock_quantity !== undefined && dbVariant.stock_quantity !== null && dbVariant.stock_quantity !== '') {
                        availableStock = Number(dbVariant.stock_quantity);
                    } else {
                        availableStock = Number(dbProduct.stock_quantity ?? 0);
                    }

                    const requestedQty = Number(item.quantity) || 1;
                    if (availableStock <= 0 || requestedQty > availableStock) {
                        outOfStockList.push({
                            ...item,
                            currentStock: availableStock
                        });
                    }
                }

                if (outOfStockList.length > 0) {
                    setStockError(outOfStockList);
                    showToast('কিছু পণ্যের পর্যাপ্ত স্টক নেই। অনুগ্রহ করে পরিমাণ কমান।', 'error');
                    setIsSubmitting(false);
                    return;
                }
            }

            const nameParts = formData.name.trim().split(' ');
            const fName = nameParts[0] || (formData.name.trim() || 'Valued');
            const lName = nameParts.slice(1).join(' ') || (formData.name.trim() ? '' : 'Customer');

            const supabaseOrderData = {
                user_id: user?.id || null,
                total_amount: finalTotal,
                status: 'pending',
                payment_method: 'cod',
                shipping_address: {
                    first_name: fName,
                    last_name: lName,
                    email: formData.email.trim() || '',
                    phone: cleanPhone || formData.phone,
                    address: formData.address.trim(),
                    district: formData.district,
                    thana: formData.thana,
                    notes: formData.notes.trim(),
                    country: 'Bangladesh',
                    delivery_zone: selectedDeliveryZone,
                    free_delivery_applied: isFreeDelivery
                },
                payment_details: {}
            };

            // Handle prescription upload if any lens option was chosen
            const preparedItems = await Promise.all(cartItems.map(async (item) => {
                let uploadedPrescriptionUrl = '';
                if (item.lensOption?.prescriptionFile) {
                    try {
                        const originalFile = item.lensOption.prescriptionFile;
                        const compressedFile = await compressImage(originalFile, {
                            maxWidth: 1400,
                            maxHeight: 1400,
                            maxSizeBytes: 120 * 1024
                        });
                        const fileName = `rx_${Date.now()}_${Math.random().toString(36).substring(7)}-${compressedFile.name}`;
                        const { data: uploadData, error: uploadErr } = await supabase.storage
                            .from('products')
                            .upload(`prescriptions/${fileName}`, compressedFile, {
                                contentType: compressedFile.type || 'image/webp',
                                cacheControl: '31536000, public',
                                upsert: false
                            });

                        if (!uploadErr && uploadData) {
                            const { data: publicUrlData } = supabase.storage
                                .from('products')
                                .getPublicUrl(`prescriptions/${fileName}`);
                            uploadedPrescriptionUrl = publicUrlData?.publicUrl || '';
                        }
                    } catch (e) {
                        console.warn('Prescription upload skipped:', e);
                    }
                }
                return {
                    ...item,
                    uploadedPrescriptionUrl: uploadedPrescriptionUrl || (typeof item.lensOption?.previewUrl === 'string' && item.lensOption?.previewUrl.startsWith('http') ? item.lensOption.previewUrl : '')
                };
            }));

            // Insert into Supabase Orders table
            const createdOrder = await orderParams.create(supabaseOrderData, preparedItems);

            const now = new Date();
            const orderDisplayId = createdOrder?.id ? createdOrder.id.slice(0, 8).toUpperCase() : `ORD-${Date.now()}`;

            const legacyOrderData = {
                orderId: orderDisplayId,
                orderDate: now.toLocaleDateString(),
                orderTime: now.toLocaleTimeString(),
                name: formData.name,
                email: formData.email,
                phone: cleanPhone || formData.phone,
                address: formData.address,
                district: formData.district,
                thana: formData.thana,
                notes: formData.notes,
                paymentMethod: 'cod',
                items: preparedItems.map(item => ({
                    title: item.title || item.name,
                    quantity: item.quantity,
                    price: item.price,
                    style: item.style || (item.variant ? [item.variant.color, item.variant.size].filter(Boolean).join(', ') : ''),
                    lens: item.lensOption ? item.lensOption.name : 'Frame Only'
                })),
                deliveryCharge: effectiveDeliveryCharge.toFixed(2),
                totalAmount: finalTotal.toFixed(2)
            };

            // 1. Real-time Telegram notification
            sendTelegramOrderNotification({
                orderId: orderDisplayId,
                customerName: formData.name.trim() || 'Valued Customer',
                phone: cleanPhone || formData.phone,
                email: formData.email,
                address: formData.address,
                district: formData.district,
                thana: formData.thana,
                notes: formData.notes || '',
                paymentMethod: 'cod',
                items: preparedItems.map(item => ({
                    title: item.title || item.name,
                    quantity: item.quantity,
                    price: item.price,
                    style: item.style || (item.variant ? [item.variant.color, item.variant.size].filter(Boolean).join(', ') : ''),
                    lensOption: item.lensOption,
                    uploadedPrescriptionUrl: item.uploadedPrescriptionUrl
                })),
                deliveryCharge: effectiveDeliveryCharge,
                totalAmount: finalTotal,
                orderDate: now.toLocaleDateString(),
                orderTime: now.toLocaleTimeString()
            }).catch(err => console.error("Telegram alert failed:", err));

            // 2. Real-time ntfy notification
            sendNtfyOrderNotification({
                orderId: orderDisplayId,
                customerName: formData.name.trim() || 'Valued Customer',
                phone: cleanPhone || formData.phone,
                address: formData.address,
                district: formData.district,
                thana: formData.thana,
                totalAmount: finalTotal,
                paymentMethod: 'cod',
                items: preparedItems
            }).catch(err => console.error("ntfy alert failed:", err));

            // 3. Google Sheets synchronization
            if (import.meta.env.VITE_GOOGLE_SCRIPT_URL) {
                fetch(import.meta.env.VITE_GOOGLE_SCRIPT_URL, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: { 'Content-Type': 'text/plain' },
                    body: JSON.stringify(legacyOrderData)
                }).catch(err => console.error("Google Sheets sync failed:", err));
            }

            // 4. Meta Pixel Purchase Event
            trackMetaPurchase({
                orderId: createdOrder?.id || orderDisplayId,
                totalAmount: finalTotal,
                items: preparedItems.map(item => ({
                    id: item.id,
                    quantity: item.quantity
                }))
            }, {
                userId: user?.id,
                phone: cleanPhone || formData.phone,
                email: formData.email,
                name: formData.name,
                district: formData.district
            });

            // 5. Web Log Analytics
            trackEvent('purchase', {
                order_id: createdOrder?.id || orderDisplayId,
                total_amount: Number(finalTotal.toFixed(2)),
                delivery_charge: effectiveDeliveryCharge,
                payment_method: 'cod',
                customer_name: formData.name,
                customer_phone: cleanPhone || formData.phone,
                customer_district: formData.district,
                num_items: preparedItems.reduce((acc, item) => acc + item.quantity, 0),
                free_delivery: isFreeDelivery,
                items: preparedItems.map(item => ({
                    id: item.id,
                    title: item.title || item.name,
                    price: item.price,
                    quantity: item.quantity
                }))
            });

            clearCart();
            closeCheckoutModal();
            showToast('আপনার অর্ডার সফলভাবে গ্রহণ করা হয়েছে!', 'success');
            navigate('/order-success');
        } catch (error) {
            console.error('Checkout error:', error);
            showToast('অর্ডার প্রসেস করতে সমস্যা হয়েছে: ' + (error.message || 'আবার চেষ্টা করুন'), 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isCheckoutModalOpen) return null;

    const districtList = getDistricts();

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
                onClick={closeCheckoutModal}
                aria-hidden="true"
            />

            {/* Modal Box */}
            <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto z-10 animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
                
                {/* Modal Header */}
                <div className="relative px-5 pt-5 pb-3 border-b border-slate-100 text-center shrink-0">
                    <button 
                        type="button" 
                        onClick={closeCheckoutModal}
                        className="absolute right-4 top-4 w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        title="বন্ধ করুন"
                        aria-label="Close Modal"
                    >
                        <X size={20} />
                    </button>
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center justify-center gap-2">
                        <span>অর্ডার করার জন্য নিচের ফর্মটি পূরণ করুন</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">ক্যাশ অন ডেলিভারিতে অর্ডার কনফার্ম করতে তথ্যগুলো দিন</p>
                </div>

                {/* Free Delivery Dynamic Progress Banner */}
                <div className="px-5 pt-3 shrink-0">
                    {isFreeDelivery ? (
                        <div className="p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between bg-emerald-50 border border-emerald-300 text-emerald-950 transition-all">
                            <div className="flex items-center gap-2">
                                <span className="text-base">🎉</span>
                                <span>অভিনন্দন! <strong>৩টি পণ্য নেওয়ায় ডেলিভারি চার্জ সম্পূর্ণ ফ্রি!</strong></span>
                            </div>
                            <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-emerald-600 text-white shrink-0">
                                ফ্রি ডেলিভারি একটিভ
                            </span>
                        </div>
                    ) : (
                        <div className="p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between bg-amber-50 border border-amber-200 text-amber-900 transition-all">
                            <div className="flex items-center gap-2">
                                <span className="text-base">🚚</span>
                                <span>
                                    আরও <strong>{3 - totalItemsCount === 1 ? '১টি' : `${3 - totalItemsCount}টি`} পণ্য যোগ করলেই</strong> পাচ্ছেন সম্পূর্ণ ফ্রি ডেলিভারি!
                                </span>
                            </div>
                            <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-amber-200/80 text-amber-900 shrink-0 font-outfit">
                                {totalItemsCount}/3 Products
                            </span>
                        </div>
                    )}
                </div>

                {/* Stock Warning Box if any item failed check */}
                {stockError && stockError.length > 0 && (
                    <div className="mx-5 mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 shrink-0">
                        <div className="flex items-center gap-2 font-bold mb-1">
                            <AlertCircle size={16} />
                            <span>স্টক স্বল্পতা দেখা দিয়েছে:</span>
                        </div>
                        <ul className="list-disc list-inside space-y-0.5">
                            {stockError.map((item, idx) => (
                                <li key={idx}>
                                    {item.title || item.name}: স্টকে আছে {item.currentStock || 0}টি
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Modal Scrollable Body */}
                <div className="p-5 overflow-y-auto space-y-4 flex-1">
                    <form id="checkout-modal-form" onSubmit={handleSubmitOrder} className="space-y-3.5">
                        
                        {/* 1. Full Name */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                আপনার নাম <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative flex items-center">
                                <span className="absolute left-3.5 text-slate-400 pointer-events-none">
                                    <User size={16} />
                                </span>
                                <input 
                                    type="text"
                                    name="name"
                                    placeholder="Full Name"
                                    value={formData.name}
                                    onChange={handleFieldChange}
                                    className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white transition-all ${
                                        formErrors.name ? 'border-rose-500 bg-rose-50/50 ring-1 ring-rose-400' : 'border-slate-200 focus:border-slate-800'
                                    }`}
                                />
                            </div>
                            {formErrors.name && (
                                <span className="text-[11px] font-bold text-rose-500 mt-1 block">{formErrors.name}</span>
                            )}
                        </div>

                        {/* 2. Mobile Number */}
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="text-xs font-bold text-slate-700">
                                    মোবাইল নাম্বার <span className="text-rose-500">*</span>
                                </label>
                                {formData.phone && (
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-all font-outfit ${
                                        isValidBDPhone(formData.phone)
                                            ? 'bg-emerald-100 text-emerald-700'
                                            : normalizeBDPhone(formData.phone).length === 11
                                                ? 'bg-amber-100 text-amber-700'
                                                : 'bg-slate-100 text-slate-600'
                                    }`}>
                                        {normalizeBDPhone(formData.phone).length}/11 digits {isValidBDPhone(formData.phone) && '✓'}
                                    </span>
                                )}
                            </div>
                            <div className="relative flex items-center">
                                <span className="absolute left-3.5 text-slate-400 pointer-events-none">
                                    <Phone size={16} />
                                </span>
                                <input 
                                    type="tel"
                                    name="phone"
                                    placeholder="01XXXXXXXXX"
                                    value={formData.phone}
                                    onChange={handleFieldChange}
                                    className={`w-full pl-10 pr-10 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white transition-all font-outfit ${
                                        (phoneError || formErrors.phone) ? 'border-rose-500 bg-rose-50/50 ring-1 ring-rose-400' : 'border-slate-200 focus:border-slate-800'
                                    }`}
                                />
                                {isValidBDPhone(formData.phone) && (
                                    <CheckCircle2 size={18} className="absolute right-3.5 text-emerald-600 pointer-events-none" />
                                )}
                            </div>
                            {(phoneError || formErrors.phone) ? (
                                <span className="text-[11px] font-bold text-rose-500 mt-1 block">{phoneError || formErrors.phone}</span>
                            ) : (
                                <span className="text-[11px] text-slate-400 mt-0.5 block">১১ ডিজিটের বাংলাদেশি নাম্বার দিন (যেমন: 01712345678)</span>
                            )}
                        </div>

                        {/* 3. Optional Email Address */}
                        <div className="p-2.5 rounded-xl bg-blue-50/40 border border-blue-100">
                            <div className="flex items-center justify-between mb-1">
                                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                    <span>আপনার ইমেইল</span>
                                    <span className="text-[10px] font-semibold text-blue-600 bg-blue-100/70 px-1.5 py-0.2 rounded">
                                        ঐচ্ছিক / Optional
                                    </span>
                                </label>
                                <span className="text-[10px] text-slate-500">ইনভয়েস ও ট্র্যাকিং ইমেইল পাবেন</span>
                            </div>
                            <div className="relative flex items-center">
                                <span className="absolute left-3.5 text-slate-400 pointer-events-none">
                                    <Mail size={16} />
                                </span>
                                <input 
                                    type="email"
                                    name="email"
                                    placeholder="example@gmail.com (না দিলেও চলবে)"
                                    value={formData.email}
                                    onChange={handleFieldChange}
                                    className={`w-full pl-10 pr-4 py-2 bg-white border rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 transition-all font-outfit ${
                                        formErrors.email ? 'border-rose-500 bg-rose-50/50' : 'border-slate-200'
                                    }`}
                                />
                            </div>
                            {formErrors.email && (
                                <span className="text-[11px] font-bold text-rose-500 mt-1 block">{formErrors.email}</span>
                            )}
                        </div>

                        {/* 4. Full Address */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                আপনার ফুল ঠিকানা <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative flex items-center">
                                <span className="absolute left-3.5 text-slate-400 pointer-events-none">
                                    <MapPin size={16} />
                                </span>
                                <input 
                                    type="text"
                                    name="address"
                                    placeholder="বাসা নং, রোড নং, এলাকা..."
                                    value={formData.address}
                                    onChange={handleFieldChange}
                                    className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white transition-all ${
                                        formErrors.address ? 'border-rose-500 bg-rose-50/50 ring-1 ring-rose-400' : 'border-slate-200 focus:border-slate-800'
                                    }`}
                                />
                            </div>
                            {formErrors.address && (
                                <span className="text-[11px] font-bold text-rose-500 mt-1 block">{formErrors.address}</span>
                            )}
                        </div>

                        {/* 5. District & Thana Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    আপনার জেলা <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative flex items-center">
                                    <span className="absolute left-3.5 text-slate-400 pointer-events-none">
                                        <Building2 size={16} />
                                    </span>
                                    <select 
                                        name="district"
                                        value={formData.district}
                                        onChange={handleFieldChange}
                                        className="w-full pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-slate-800 focus:bg-white appearance-none cursor-pointer"
                                    >
                                        <option value="">জেলা নির্বাচন করুন</option>
                                        {districtList.map(dist => (
                                            <option key={dist} value={dist}>{dist}</option>
                                        ))}
                                    </select>
                                    <span className="absolute right-3 text-slate-400 pointer-events-none">
                                        ▼
                                    </span>
                                </div>
                                {formErrors.district && (
                                    <span className="text-[11px] font-bold text-rose-500 mt-1 block">{formErrors.district}</span>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    আপনার থানা <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative flex items-center">
                                    <span className="absolute left-3.5 text-slate-400 pointer-events-none">
                                        <Navigation size={16} />
                                    </span>
                                    <select 
                                        name="thana"
                                        value={formData.thana}
                                        onChange={handleFieldChange}
                                        disabled={availableThanas.length === 0}
                                        className="w-full pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-slate-800 focus:bg-white appearance-none cursor-pointer disabled:opacity-50"
                                    >
                                        <option value="">থানা নির্বাচন করুন</option>
                                        {availableThanas.map(th => (
                                            <option key={th} value={th}>{th}</option>
                                        ))}
                                    </select>
                                    <span className="absolute right-3 text-slate-400 pointer-events-none">
                                        ▼
                                    </span>
                                </div>
                                {formErrors.thana && (
                                    <span className="text-[11px] font-bold text-rose-500 mt-1 block">{formErrors.thana}</span>
                                )}
                            </div>
                        </div>

                        {/* 6. Products in Order Card */}
                        <div className="space-y-2 pt-1">
                            <label className="block text-xs font-bold text-slate-700">পণ্য তালিকা ({cartItems.length})</label>
                            
                            {cartItems.length === 0 ? (
                                <div className="p-4 text-center bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500">
                                    কার্টে কোনো পণ্য নেই।
                                </div>
                            ) : (
                                <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                                    {cartItems.map((item) => {
                                        const itemId = item.cartItemId || item.id;
                                        const itemQty = Number(item.quantity) || 1;
                                        const unitPrice = Number(item.price) || 0;
                                        const itemTotal = unitPrice * itemQty;
                                        const regularPrice = item.compare_price || item.regular_price || (unitPrice * 1.35);

                                        return (
                                            <div 
                                                key={itemId}
                                                className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3 shadow-2xs"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    {/* Product Thumbnail with badge */}
                                                    <div className="relative w-14 h-14 bg-white rounded-xl border border-slate-200 p-1 flex items-center justify-center shrink-0">
                                                        <span className="absolute -top-1.5 -left-1.5 w-5 h-5 bg-slate-900 text-white text-[11px] font-bold rounded-full flex items-center justify-center font-outfit shadow-xs">
                                                            {itemQty}
                                                        </span>
                                                        <img 
                                                            src={item.image || item.image_url || '/placeholder-product.png'} 
                                                            alt={item.title || item.name} 
                                                            className="w-full h-full object-contain mix-blend-multiply"
                                                        />
                                                    </div>

                                                    <div className="min-w-0">
                                                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate font-outfit">
                                                            {item.title || item.name}
                                                        </h4>
                                                        <p className="text-[11px] text-slate-500 truncate font-outfit">
                                                            {item.style || item.selected_color || (item.variant ? [item.variant.color, item.variant.size].filter(Boolean).join(', ') : 'Standard')}
                                                            {item.lensOption && item.lensOption.id !== 'frame_only' && (
                                                                <span> • {item.lensOption.name}</span>
                                                            )}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            {regularPrice > unitPrice && (
                                                                <span className="text-[11px] text-slate-400 line-through font-outfit">
                                                                    Tk {(regularPrice * itemQty).toLocaleString()}
                                                                </span>
                                                            )}
                                                            <span className="text-xs sm:text-sm font-bold text-slate-900 font-outfit">
                                                                Tk {itemTotal.toLocaleString()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Stepper */}
                                                <div className="flex items-center border border-slate-200 bg-white rounded-xl p-0.5 shrink-0 shadow-2xs">
                                                    <button 
                                                        type="button"
                                                        onClick={() => {
                                                            if (itemQty > 1) {
                                                                updateQuantity(itemId, -1);
                                                            } else {
                                                                removeFromCart(itemId);
                                                            }
                                                        }}
                                                        className="w-7 h-7 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors font-bold text-sm"
                                                        title={itemQty === 1 ? 'মুছে ফেলুন' : 'কমান'}
                                                    >
                                                        −
                                                    </button>
                                                    <span className="w-7 text-center font-bold text-xs font-outfit text-slate-900">
                                                        {itemQty}
                                                    </span>
                                                    <button 
                                                        type="button"
                                                        onClick={() => updateQuantity(itemId, 1)}
                                                        className="w-7 h-7 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors font-bold text-sm"
                                                        title="বাড়ান"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* 7. Delivery Options */}
                        <div className="space-y-2 pt-1">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-slate-800">ডেলিভারি অপশন</label>
                                {isFreeDelivery && (
                                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                                        <Check size={12} strokeWidth={3} />
                                        ফ্রি ডেলিভারি প্রযোজ্য
                                    </span>
                                )}
                            </div>

                            {/* When Free delivery is active (>= 3 products): Exact screenshot 2 look */}
                            {isFreeDelivery ? (
                                <div className="border-2 border-blue-500 bg-blue-50/30 rounded-2xl p-3 sm:p-3.5 flex items-center justify-between transition-all">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                                            <div className="w-2 h-2 rounded-full bg-white"></div>
                                        </div>
                                        <span className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                                            🚚 ফ্রি ডেলিভারি
                                        </span>
                                    </div>
                                    <span className="text-xs sm:text-sm font-bold text-slate-900 bg-white px-3 py-1 rounded-lg border border-slate-200">
                                        ফ্রি
                                    </span>
                                </div>
                            ) : (
                                /* When Normal ( < 3 products): 3 radio options */
                                <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 bg-white">
                                    <label 
                                        onClick={() => handleZoneSelect('inside')}
                                        className={`flex items-center justify-between p-3 cursor-pointer transition-colors ${
                                            selectedDeliveryZone === 'inside' ? 'bg-blue-50/40' : 'hover:bg-slate-50'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <input 
                                                type="radio" 
                                                name="delivery-zone" 
                                                checked={selectedDeliveryZone === 'inside'} 
                                                onChange={() => handleZoneSelect('inside')}
                                                className="w-4 h-4 text-slate-900 accent-slate-900 cursor-pointer" 
                                            />
                                            <span className="text-xs font-medium text-slate-800">🚚 ঢাকার ভিতরে</span>
                                        </div>
                                        <span className="text-xs font-bold text-slate-900 font-outfit">Tk 70.00</span>
                                    </label>

                                    <label 
                                        onClick={() => handleZoneSelect('sub')}
                                        className={`flex items-center justify-between p-3 cursor-pointer transition-colors ${
                                            selectedDeliveryZone === 'sub' ? 'bg-blue-50/40' : 'hover:bg-slate-50'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <input 
                                                type="radio" 
                                                name="delivery-zone" 
                                                checked={selectedDeliveryZone === 'sub'} 
                                                onChange={() => handleZoneSelect('sub')}
                                                className="w-4 h-4 text-slate-900 accent-slate-900 cursor-pointer" 
                                            />
                                            <span className="text-xs font-medium text-slate-800">🚚 ঢাকা উপশহর</span>
                                        </div>
                                        <span className="text-xs font-bold text-slate-900 font-outfit">Tk 100.00</span>
                                    </label>

                                    <label 
                                        onClick={() => handleZoneSelect('outside')}
                                        className={`flex items-center justify-between p-3 cursor-pointer transition-colors ${
                                            selectedDeliveryZone === 'outside' ? 'bg-blue-50/40' : 'hover:bg-slate-50'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <input 
                                                type="radio" 
                                                name="delivery-zone" 
                                                checked={selectedDeliveryZone === 'outside'} 
                                                onChange={() => handleZoneSelect('outside')}
                                                className="w-4 h-4 text-slate-900 accent-slate-900 cursor-pointer" 
                                            />
                                            <span className="text-xs font-medium text-slate-800">🚚 ঢাকার বাহিরে</span>
                                        </div>
                                        <span className="text-xs font-bold text-slate-900 font-outfit">Tk 120.00</span>
                                    </label>
                                </div>
                            )}
                        </div>

                        {/* 8. Pricing Summary */}
                        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                            <div className="flex justify-between items-center text-xs text-slate-600">
                                <span>সাব টোটাল</span>
                                <span className="font-bold text-slate-900 font-outfit">
                                    Tk {cartTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-xs text-slate-600">
                                <span>ডেলিভারি চার্জ</span>
                                {isFreeDelivery ? (
                                    <span className="font-bold text-emerald-600 font-outfit flex items-center gap-1.5">
                                        <span>Free</span>
                                        <span className="text-[10px] text-slate-400 line-through">
                                            Tk {baseDeliveryCharge.toFixed(2)}
                                        </span>
                                    </span>
                                ) : (
                                    <span className="font-bold text-slate-900 font-outfit">
                                        Tk {effectiveDeliveryCharge.toFixed(2)}
                                    </span>
                                )}
                            </div>
                            <div className="border-t border-slate-200 pt-2 flex justify-between items-center">
                                <span className="text-sm font-bold text-slate-900">টোটাল</span>
                                <span className="text-base sm:text-lg font-bold text-slate-900 font-outfit">
                                    Tk {finalTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>

                        {/* 9. Order Note */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">নোট</label>
                            <div className="relative flex items-center">
                                <span className="absolute left-3.5 text-slate-400 pointer-events-none">
                                    <FileText size={16} />
                                </span>
                                <input 
                                    type="text"
                                    name="notes"
                                    placeholder="ডেলিভারির সময় বা কোনো বিশেষ নির্দেশনা থাকলে লিখুন।"
                                    value={formData.notes}
                                    onChange={handleFieldChange}
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-800 focus:bg-white transition-all"
                                />
                            </div>
                        </div>

                        {/* 10. Main Submit Button */}
                        <button 
                            type="submit"
                            disabled={isSubmitting || cartItems.length === 0}
                            className="w-full py-3.5 px-6 rounded-2xl bg-slate-950 hover:bg-slate-800 active:scale-[0.99] disabled:opacity-50 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-lg shadow-slate-950/20 transition-all cursor-pointer"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    <span>অর্ডার প্রসেস হচ্ছে...</span>
                                </>
                            ) : (
                                <>
                                    <ShoppingCart size={18} />
                                    <span>
                                        অর্ডার করুন - Tk {finalTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                </>
                            )}
                        </button>

                        {/* Trust Badges */}
                        <div className="flex items-center justify-center gap-3 text-[10px] text-slate-500 pt-1">
                            <span className="flex items-center gap-1">
                                <ShieldCheck size={13} className="text-emerald-600" />
                                ক্যাশ অন ডেলিভারি
                            </span>
                            <span>•</span>
                            <span>১০০% অরিজিনাল প্রডাক্ট</span>
                            <span>•</span>
                            <span>চেক করে নেওয়ার সুবিধা</span>
                        </div>
                    </form>
                </div>

            </div>
        </div>
    );
};

export default CheckoutModal;
