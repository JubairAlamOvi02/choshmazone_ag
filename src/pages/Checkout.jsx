import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Button from '../components/Button';
import Input from '../components/Input';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { orderParams } from '../lib/api/orders';
import { supabase } from '../lib/supabaseClient';
import { getDistricts, getThanas, calculateDeliveryCharge } from '../data/bangladeshLocations';
import { sendTelegramOrderNotification } from '../lib/telegramNotifier';
import { settingsParams, DEFAULT_CHECKOUT_FIELD_SETTINGS } from '../lib/api/settings';
import { trackEvent } from '../lib/tracker';
import { compressImage } from '../lib/imageCompressor';

// Bangladesh 11-digit phone validation helpers
export const normalizeBDPhone = (input) => {
    if (!input) return '';
    let digits = String(input).replace(/[^\d+]/g, '');
    if (digits.startsWith('+880')) digits = digits.slice(3);
    else if (digits.startsWith('+88')) digits = digits.slice(3);
    else if (digits.startsWith('880')) digits = digits.slice(2);
    else if (digits.startsWith('88')) digits = digits.slice(2);
    return digits.replace(/\D/g, '');
};

export const isValidBDPhone = (phone) => {
    const cleaned = normalizeBDPhone(phone);
    // Standard Bangladesh 11-digit mobile format: 013, 014, 015, 016, 017, 018, 019 followed by 8 digits
    return /^01[3-9]\d{8}$/.test(cleaned);
};

const Checkout = () => {
    const { cartItems, cartTotal, clearCart, updateQuantity, resetQuantities, removeFromCart } = useCart();
    const { user } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();

    const [showStockModal, setShowStockModal] = useState(false);
    const [outOfStockItems, setOutOfStockItems] = useState([]);
    const [fieldSettings, setFieldSettings] = useState(DEFAULT_CHECKOUT_FIELD_SETTINGS);
    const [phoneError, setPhoneError] = useState('');
    const [formErrors, setFormErrors] = useState({});

    // Fetch dynamic field settings from Admin Panel
    useEffect(() => {
        const loadFields = async () => {
            try {
                const settings = await settingsParams.getCheckoutFieldSettings();
                setFieldSettings(settings);
            } catch (e) {
                console.warn('Using default checkout field settings', e);
            }
        };
        loadFields();
    }, []);

    // Reset quantities to 1 when entering the checkout page
    useEffect(() => {
        resetQuantities();

        // Track Initiate Checkout
        if (cartItems.length > 0) {
            if (typeof window !== 'undefined' && window.fbq) {
                window.fbq('track', 'InitiateCheckout', {
                    value: cartTotal,
                    currency: 'BDT',
                    num_items: cartItems.length
                });
            }

            // Web Log Analytics Initiate Checkout
            trackEvent('initiate_checkout', {
                cart_count: cartItems.length,
                total_value: cartTotal,
                items: cartItems.map(item => ({
                    id: item.id,
                    title: item.title || item.name,
                    price: item.price,
                    quantity: item.quantity
                }))
            });
        }
    }, [resetQuantities]);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        email: user?.email || '',
        phone: '',
        name: '',
        address: '',
        district: '',
        thana: '',
        city: '',
        zip: '',
        notes: '',
        country: 'Bangladesh',
        paymentMethod: 'cod', // 'bkash' or 'cod'
        bkashNumber: '',
        bkashTrxId: ''
    });
    const [deliveryCharge, setDeliveryCharge] = useState(0);
    const [availableThanas, setAvailableThanas] = useState([]);

    // Update thanas and delivery charge when district changes
    useEffect(() => {
        if (formData.district) {
            setAvailableThanas(getThanas(formData.district));
            setDeliveryCharge(calculateDeliveryCharge(formData.district));
        } else {
            setAvailableThanas([]);
            setDeliveryCharge(0);
        }
    }, [formData.district]);

    const focusAndScrollToField = (elementId) => {
        const el = document.getElementById(elementId);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => {
                try {
                    el.focus({ preventScroll: true });
                } catch {
                    el.focus();
                }
            }, 350);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        // Clear errors on change
        setFormErrors(prev => {
            if (!prev[name]) return prev;
            const updated = { ...prev };
            delete updated[name];
            return updated;
        });

        if (name === 'phone') {
            const rawVal = value;
            const cleaned = normalizeBDPhone(rawVal);
            if (rawVal.trim() === '') {
                setPhoneError('');
            } else if (cleaned.length > 11) {
                setPhoneError('Phone number must not exceed 11 digits');
            } else if (cleaned.length === 11) {
                if (!isValidBDPhone(rawVal)) {
                    setPhoneError('Invalid prefix. Valid BD mobile starts with 013-019');
                } else {
                    setPhoneError('');
                }
            } else {
                setPhoneError('');
            }
            setFormData(prev => ({ ...prev, [name]: value }));
            return;
        }

        // If district changes, reset thana
        if (name === 'district') {
            setFormData(prev => ({ ...prev, [name]: value, thana: '' }));
            setFormErrors(prev => {
                const updated = { ...prev };
                delete updated.district;
                delete updated.thana;
                return updated;
            });
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const errors = {};
        let firstInvalid = null;

        const recordError = (fieldKey, elementId, message) => {
            if (!errors[fieldKey]) {
                errors[fieldKey] = message;
            }
            if (!firstInvalid) {
                firstInvalid = { key: fieldKey, id: elementId, message };
            }
        };

        const isFieldRequired = (key, defaultRequired = false) => {
            const field = fieldSettings[key];
            if (field?.enabled === false) return false;
            if (field?.required !== undefined) return Boolean(field.required);
            return defaultRequired;
        };

        // 1. Phone number validation
        const cleanPhone = normalizeBDPhone(formData.phone);
        if (isFieldRequired('phone', true)) {
            if (!formData.phone.trim()) {
                recordError('phone', 'field-phone', 'Please enter your phone number');
            } else if (!isValidBDPhone(formData.phone)) {
                if (cleanPhone.length !== 11) {
                    recordError('phone', 'field-phone', `Phone number must be exactly 11 digits (currently ${cleanPhone.length})`);
                } else {
                    recordError('phone', 'field-phone', 'Please enter a valid Bangladesh mobile number starting with 01');
                }
            }
        } else if (formData.phone.trim() && !isValidBDPhone(formData.phone)) {
            recordError('phone', 'field-phone', 'Please enter a valid Bangladesh mobile number starting with 01');
        }

        // 2. Email Address
        if (isFieldRequired('email', false)) {
            if (!formData.email.trim()) {
                recordError('email', 'field-email', 'Please enter your email address');
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
                recordError('email', 'field-email', 'Please enter a valid email address');
            }
        } else if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
            recordError('email', 'field-email', 'Please enter a valid email address');
        }

        // 3. Full Name
        if (isFieldRequired('name', true) && !formData.name.trim()) {
            recordError('name', 'field-name', 'Please enter your full name');
        }

        // 4. Street Address
        if (isFieldRequired('address', true) && !formData.address.trim()) {
            recordError('address', 'field-address', 'Please enter your street address');
        }

        // 5. District
        if (isFieldRequired('district', true) && !formData.district.trim()) {
            recordError('district', 'field-district', 'Please select your delivery district');
        }

        // 6. Thana / Upazila
        if (isFieldRequired('thana', false) && !formData.thana.trim()) {
            recordError('thana', 'field-thana', 'Please select your Thana / Upazila');
        }

        // 7. City
        if (isFieldRequired('city', false) && !formData.city.trim()) {
            recordError('city', 'field-city', 'Please enter your city');
        }

        // 8. Zip / Postal Code
        if (isFieldRequired('zip', false) && !formData.zip.trim()) {
            recordError('zip', 'field-zip', 'Please enter your postal / zip code');
        }

        // 9. Order Notes
        if (isFieldRequired('notes', false) && !formData.notes?.trim()) {
            recordError('notes', 'field-notes', 'Please enter order notes');
        }

        // 10. Payment Method (bKash)
        if (formData.paymentMethod === 'bkash') {
            if (!formData.bkashNumber.trim()) {
                recordError('bkashNumber', 'field-bkashNumber', 'Please enter your bKash mobile number');
            }
            if (!formData.bkashTrxId.trim()) {
                recordError('bkashTrxId', 'field-bkashTrxId', 'Please enter the bKash Transaction ID (TrxID)');
            }
        }

        if (firstInvalid) {
            setFormErrors(errors);
            setPhoneError(errors.phone || '');
            showToast(firstInvalid.message, 'error');
            focusAndScrollToField(firstInvalid.id);
            return;
        }

        setFormErrors({});
        setPhoneError('');

        setIsSubmitting(true);

        try {
            const itemIds = cartItems.map(item => item.id);
            if (itemIds.length > 0) {
                const { data: latestProducts, error: productsError } = await supabase
                    .from('products')
                    .select('id, name, stock_quantity, variants')
                    .in('id', itemIds);

                if (productsError) throw productsError;

                const outOfStock = cartItems.filter(item => {
                    const dbProduct = latestProducts.find(p => p.id === item.id);
                    if (!dbProduct) return true;
                    
                    if (item.variant) {
                        const dbVariant = dbProduct.variants?.find(v => v.id === item.variant.id);
                        if (!dbVariant || dbVariant.stock_quantity <= 0) return true;
                    } else {
                        if (dbProduct.stock_quantity <= 0) return true;
                    }
                    return false;
                });

                if (outOfStock.length > 0) {
                    setOutOfStockItems(outOfStock);
                    setShowStockModal(true);
                    setIsSubmitting(false);
                    return;
                }
            }

            const totalWithDelivery = cartTotal + deliveryCharge;

            const nameParts = formData.name.trim().split(' ');
            const fName = nameParts[0] || (formData.name.trim() || 'Valued');
            const lName = nameParts.slice(1).join(' ') || (formData.name.trim() ? '' : 'Customer');

            const supabaseOrderData = {
                user_id: user?.id || null,
                total_amount: totalWithDelivery,
                status: 'pending',
                payment_method: formData.paymentMethod,
                shipping_address: {
                    first_name: fName,
                    last_name: lName,
                    email: formData.email || '',
                    phone: cleanPhone || formData.phone,
                    address: formData.address || '',
                    district: formData.district || '',
                    thana: formData.thana || '',
                    city: formData.city || '',
                    zip: formData.zip || '',
                    notes: formData.notes || '',
                    country: formData.country
                },
                payment_details: formData.paymentMethod === 'bkash' ? {
                    bkash_number: formData.bkashNumber,
                    transaction_id: formData.bkashTrxId
                } : {}
            };

            // Upload prescription files if any
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
                        console.warn('Prescription image upload skipped or failed:', e);
                    }
                }
                return {
                    ...item,
                    uploadedPrescriptionUrl: uploadedPrescriptionUrl || (typeof item.lensOption?.previewUrl === 'string' && item.lensOption?.previewUrl.startsWith('http') ? item.lensOption.previewUrl : '')
                };
            }));

            const createdOrder = await orderParams.create(supabaseOrderData, preparedItems);

            const now = new Date();
            const orderDisplayId = createdOrder?.id ? createdOrder.id.slice(0, 8).toUpperCase() : `ORD-${Date.now()}`;

            const legacyOrderData = {
                orderId: orderDisplayId,
                orderDate: now.toLocaleDateString(),
                orderTime: now.toLocaleTimeString(),
                ...formData,
                phone: cleanPhone || formData.phone,
                firstName: fName,
                lastName: lName,
                items: preparedItems.map(item => ({
                    title: item.title,
                    quantity: item.quantity,
                    price: item.price,
                    style: item.style || (item.variant ? [item.variant.color, item.variant.size].filter(Boolean).join(', ') : ''),
                    lens: item.lensOption ? item.lensOption.name : 'Frame Only'
                })),
                deliveryCharge: deliveryCharge.toFixed(2),
                totalAmount: totalWithDelivery.toFixed(2)
            };

            // Send real-time order alert to your Telegram Bot (Phone notification)
            sendTelegramOrderNotification({
                orderId: orderDisplayId,
                customerName: formData.name.trim() || 'Valued Customer',
                phone: cleanPhone || formData.phone,
                email: formData.email,
                address: formData.address,
                district: formData.district,
                thana: formData.thana,
                notes: formData.notes || '',
                paymentMethod: formData.paymentMethod,
                bkashNumber: formData.bkashNumber,
                bkashTrxId: formData.bkashTrxId,
                items: preparedItems.map(item => ({
                    title: item.title,
                    quantity: item.quantity,
                    price: item.price,
                    style: item.style || (item.variant ? [item.variant.color, item.variant.size].filter(Boolean).join(', ') : ''),
                    lensOption: item.lensOption,
                    uploadedPrescriptionUrl: item.uploadedPrescriptionUrl
                })),
                deliveryCharge: deliveryCharge,
                totalAmount: totalWithDelivery,
                orderDate: now.toLocaleDateString(),
                orderTime: now.toLocaleTimeString()
            }).catch(err => console.error("Telegram notification failed:", err));

            fetch(import.meta.env.VITE_GOOGLE_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'text/plain',
                },
                body: JSON.stringify(legacyOrderData)
            }).catch(err => console.error("Google Sheets Sync Failed:", err));

            // Track Purchase event with Facebook Pixel
            if (typeof window !== 'undefined' && window.fbq) {
                window.fbq('track', 'Purchase', {
                    value: Number(totalWithDelivery.toFixed(2)),
                    currency: 'BDT',
                    content_ids: cartItems.map(item => String(item.id)),
                    content_type: 'product',
                    num_items: cartItems.reduce((acc, item) => acc + item.quantity, 0)
                });
            }

            // Web Log Analytics Purchase event
            trackEvent('purchase', {
                order_id: createdOrder?.id || orderDisplayId,
                total_amount: Number(totalWithDelivery.toFixed(2)),
                delivery_charge: deliveryCharge,
                payment_method: formData.paymentMethod,
                customer_name: formData.name,
                customer_phone: cleanPhone || formData.phone,
                customer_district: formData.district,
                num_items: preparedItems.reduce((acc, item) => acc + item.quantity, 0),
                items: preparedItems.map(item => ({
                    id: item.id,
                    title: item.title,
                    price: item.price,
                    quantity: item.quantity,
                    style: item.style
                }))
            });

            clearCart();
            navigate('/order-success');
        } catch (error) {
            console.error('Error placing order:', error);
            showToast('There was an issue processing your order: ' + error.message, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (cartItems.length === 0) {
        return (
            <div className="min-h-screen bg-white">
                <Navbar />
                <div className="container mx-auto px-4 py-20 text-center">
                    <h2 className="text-3xl font-bold mb-4 font-outfit uppercase tracking-wider">Your cart is empty</h2>
                    <p className="text-text-muted mb-8 font-outfit">Add some products to your cart before checking out.</p>
                    <Link to="/shop">
                        <Button variant="primary">Shop Collection</Button>
                    </Link>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            <Navbar />

            {/* Out of Stock Modal */}
            {showStockModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-in zoom-in slide-in-from-bottom-4 duration-300">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3 text-red-500">
                                <AlertCircle size={24} />
                                <h3 className="text-xl font-bold font-outfit uppercase tracking-wider text-text-main">Stock Issue</h3>
                            </div>
                            <button onClick={() => setShowStockModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <p className="text-sm text-text-muted font-outfit mb-6">
                            We're sorry, but the following items in your cart are currently out of stock. Please remove them to proceed with your order.
                        </p>
                        <div className="space-y-3 mb-6 max-h-[250px] overflow-y-auto pr-2 scrollbar-thin">
                            {outOfStockItems.map(item => (
                                <div key={item.cartItemId || item.id} className="flex items-center justify-between gap-3 p-3 bg-red-50/50 rounded-xl border border-red-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-white rounded-lg p-1 shrink-0">
                                            <img src={item.image} alt={item.title} className="w-full h-full object-contain mix-blend-multiply" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-text-main truncate font-outfit max-w-[120px]">{item.title}</p>
                                            <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest mt-1">Out of Stock</p>
                                        </div>
                                    </div>
                                    <button
                                        className="text-xs font-bold text-red-500 hover:text-white bg-white hover:bg-red-500 px-3 py-1.5 rounded-lg border border-red-200 hover:border-red-500 transition-all shadow-sm"
                                        type="button"
                                        onClick={() => {
                                            removeFromCart(item.cartItemId || item.id);
                                            setOutOfStockItems(prev => prev.filter(i => (i.cartItemId || i.id) !== (item.cartItemId || item.id)));
                                            if (outOfStockItems.length === 1) setShowStockModal(false);
                                        }}
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-end pt-4 border-t border-border">
                            <Button variant="outline" type="button" onClick={() => setShowStockModal(false)} className="w-full">
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <main className="container mx-auto px-4 py-12 md:py-16">
                <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-12 lg:gap-20">
                    {/* Left Column: Forms */}
                    <form noValidate onSubmit={handleSubmit} className="flex flex-col">
                        {/* Contact Information */}
                        {(fieldSettings.phone?.enabled !== false || fieldSettings.email?.enabled !== false) && (
                            <div className="mb-12">
                                <h2 className="text-xl font-bold mb-6 pb-2 border-b border-border font-outfit uppercase tracking-wider text-text-main">
                                    Contact Information
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Phone Number Field with 11-digit validation */}
                                    {fieldSettings.phone?.enabled !== false && (
                                        <div className="flex flex-col gap-1.5 w-full">
                                            <div className="flex items-center justify-between ml-1">
                                                <label htmlFor="field-phone" className="text-xs font-bold text-text-muted uppercase tracking-widest font-outfit">
                                                    {fieldSettings.phone?.label || 'Phone Number'}
                                                    {fieldSettings.phone?.required !== false ? (
                                                        <span className="text-error ml-1">*</span>
                                                    ) : (
                                                        <span className="text-text-muted/60 text-[10px] font-normal lowercase tracking-normal ml-1">(Optional)</span>
                                                    )}
                                                </label>
                                                {formData.phone && (
                                                    <span className={`text-[10px] font-bold font-outfit tracking-wider px-2 py-0.5 rounded-full transition-all ${
                                                        isValidBDPhone(formData.phone) 
                                                            ? 'bg-emerald-100 text-emerald-700' 
                                                            : normalizeBDPhone(formData.phone).length === 11 
                                                                ? 'bg-amber-100 text-amber-700'
                                                                : 'bg-gray-100 text-gray-600'
                                                    }`}>
                                                        {normalizeBDPhone(formData.phone).length}/11 digits {isValidBDPhone(formData.phone) && '✓'}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="relative">
                                                <input
                                                    id="field-phone"
                                                    type="tel"
                                                    name="phone"
                                                    placeholder={fieldSettings.phone?.placeholder || '01XXXXXXXXX (11 digits)'}
                                                    value={formData.phone}
                                                    onChange={handleChange}
                                                    className={`
                                                        w-full bg-gray-50 border px-4 py-3 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-outfit text-sm
                                                        ${(phoneError || formErrors.phone) ? 'border-red-500 bg-red-50/50 ring-2 ring-red-400/30' : 'border-border/50'}
                                                    `}
                                                />
                                                {isValidBDPhone(formData.phone) && (
                                                    <CheckCircle2 size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-600 pointer-events-none" />
                                                )}
                                            </div>
                                            {(phoneError || formErrors.phone) ? (
                                                <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider ml-1 font-outfit">{phoneError || formErrors.phone}</span>
                                            ) : (
                                                <span className="text-[11px] text-text-muted font-outfit ml-1">Must be 11 digits (e.g. 01712345678)</span>
                                            )}
                                        </div>
                                    )}

                                    {/* Email Field */}
                                    {fieldSettings.email?.enabled !== false && (
                                        <div className="flex flex-col gap-1.5 w-full">
                                            <label htmlFor="field-email" className="text-xs font-bold text-text-muted uppercase tracking-widest font-outfit ml-1">
                                                {fieldSettings.email?.label || 'Email Address'}
                                                {fieldSettings.email?.required ? (
                                                    <span className="text-error ml-1">*</span>
                                                ) : (
                                                    <span className="text-red-600 font-bold text-[10px] normal-case tracking-normal ml-1">
                                                        (Optional - Required for order tracking)
                                                    </span>
                                                )}
                                            </label>
                                            <input
                                                id="field-email"
                                                type="email"
                                                name="email"
                                                placeholder={fieldSettings.email?.placeholder || '(Required for order tracking)'}
                                                value={formData.email}
                                                onChange={handleChange}
                                                className={`w-full bg-gray-50 border px-4 py-3 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-outfit text-sm ${
                                                    formErrors.email ? 'border-red-500 bg-red-50/50 ring-2 ring-red-400/30' : 'border-border/50'
                                                }`}
                                            />
                                            {formErrors.email && (
                                                <span className="text-[10px] font-bold text-red-500 font-outfit ml-1">{formErrors.email}</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Shipping Address */}
                        <div className="mb-12">
                            <h2 className="text-xl font-bold mb-6 pb-2 border-b border-border font-outfit uppercase tracking-wider text-text-main">
                                Shipping Address
                            </h2>

                            {/* Full Name */}
                            {fieldSettings.name?.enabled !== false && (
                                <div className="mb-6 flex flex-col gap-1.5 w-full">
                                    <label htmlFor="field-name" className="text-xs font-bold text-text-muted uppercase tracking-widest font-outfit ml-1">
                                        {fieldSettings.name?.label || 'Full Name'}
                                        {fieldSettings.name?.required !== false ? (
                                            <span className="text-error ml-1">*</span>
                                        ) : (
                                            <span className="text-text-muted/60 text-[10px] font-normal lowercase tracking-normal ml-1">(Optional)</span>
                                        )}
                                    </label>
                                    <input
                                        id="field-name"
                                        type="text"
                                        name="name"
                                        placeholder={fieldSettings.name?.placeholder || 'Enter your full name'}
                                        value={formData.name}
                                        onChange={handleChange}
                                        className={`w-full bg-gray-50 border px-4 py-3 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-outfit text-sm ${
                                            formErrors.name ? 'border-red-500 bg-red-50/50 ring-2 ring-red-400/30' : 'border-border/50'
                                        }`}
                                    />
                                    {formErrors.name && (
                                        <span className="text-[10px] font-bold text-red-500 font-outfit ml-1">{formErrors.name}</span>
                                    )}
                                </div>
                            )}

                            {/* Address */}
                            {fieldSettings.address?.enabled !== false && (
                                <div className="mb-6 flex flex-col gap-1.5 w-full">
                                    <label htmlFor="field-address" className="text-xs font-bold text-text-muted uppercase tracking-widest font-outfit ml-1">
                                        {fieldSettings.address?.label || 'Address'}
                                        {fieldSettings.address?.required !== false ? (
                                            <span className="text-error ml-1">*</span>
                                        ) : (
                                            <span className="text-text-muted/60 text-[10px] font-normal lowercase tracking-normal ml-1">(Optional)</span>
                                        )}
                                    </label>
                                    <input
                                        id="field-address"
                                        type="text"
                                        name="address"
                                        placeholder={fieldSettings.address?.placeholder || 'Street address, apartment, etc.'}
                                        value={formData.address}
                                        onChange={handleChange}
                                        className={`w-full bg-gray-50 border px-4 py-3 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-outfit text-sm ${
                                            formErrors.address ? 'border-red-500 bg-red-50/50 ring-2 ring-red-400/30' : 'border-border/50'
                                        }`}
                                    />
                                    {formErrors.address && (
                                        <span className="text-[10px] font-bold text-red-500 font-outfit ml-1">{formErrors.address}</span>
                                    )}
                                </div>
                            )}

                            {/* District & Thana */}
                            {(fieldSettings.district?.enabled !== false || fieldSettings.thana?.enabled !== false) && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    {fieldSettings.district?.enabled !== false && (
                                        <div className="flex flex-col gap-1.5">
                                            <label htmlFor="field-district" className="text-xs font-bold text-text-muted uppercase tracking-widest font-outfit ml-1">
                                                {fieldSettings.district?.label || 'District'}
                                                {fieldSettings.district?.required !== false ? (
                                                    <span className="text-error ml-1">*</span>
                                                ) : (
                                                    <span className="text-text-muted/60 text-[10px] font-normal lowercase tracking-normal ml-1">(Optional)</span>
                                                )}
                                            </label>
                                            <select
                                                id="field-district"
                                                name="district"
                                                value={formData.district}
                                                onChange={handleChange}
                                                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-outfit text-sm ${
                                                    formErrors.district ? 'border-red-500 bg-red-50/50 ring-2 ring-red-400/30' : 'border-border/50 bg-gray-50'
                                                }`}
                                            >
                                                <option value="">{fieldSettings.district?.placeholder || 'Select District'}</option>
                                                {getDistricts().map(district => (
                                                    <option key={district} value={district}>{district}</option>
                                                ))}
                                            </select>
                                            {formErrors.district && (
                                                <span className="text-[10px] font-bold text-red-500 font-outfit ml-1">{formErrors.district}</span>
                                            )}
                                        </div>
                                    )}

                                    {fieldSettings.thana?.enabled !== false && (
                                        <div className="flex flex-col gap-1.5">
                                            <label htmlFor="field-thana" className="text-xs font-bold text-text-muted uppercase tracking-widest font-outfit ml-1">
                                                {fieldSettings.thana?.label || 'Thana'}
                                                {fieldSettings.thana?.required ? (
                                                    <span className="text-error ml-1">*</span>
                                                ) : (
                                                    <span className="text-text-muted/60 text-[10px] font-normal lowercase tracking-normal ml-1">(Optional)</span>
                                                )}
                                            </label>
                                            <select
                                                id="field-thana"
                                                name="thana"
                                                value={formData.thana}
                                                onChange={handleChange}
                                                disabled={!formData.district}
                                                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-outfit text-sm disabled:bg-gray-100 disabled:cursor-not-allowed ${
                                                    formErrors.thana ? 'border-red-500 bg-red-50/50 ring-2 ring-red-400/30' : 'border-border/50 bg-gray-50'
                                                }`}
                                            >
                                                <option value="">{fieldSettings.thana?.placeholder || 'Select Thana'}</option>
                                                {availableThanas.map(thana => (
                                                    <option key={thana} value={thana}>{thana}</option>
                                                ))}
                                            </select>
                                            {formErrors.thana && (
                                                <span className="text-[10px] font-bold text-red-500 font-outfit ml-1">{formErrors.thana}</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* City & Zip */}
                            {(fieldSettings.city?.enabled !== false || fieldSettings.zip?.enabled !== false) && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    {fieldSettings.city?.enabled !== false && (
                                        <div className="flex flex-col gap-1.5 w-full">
                                            <label htmlFor="field-city" className="text-xs font-bold text-text-muted uppercase tracking-widest font-outfit ml-1">
                                                {fieldSettings.city?.label || 'City'}
                                                {fieldSettings.city?.required ? (
                                                    <span className="text-error ml-1">*</span>
                                                ) : (
                                                    <span className="text-text-muted/60 text-[10px] font-normal lowercase tracking-normal ml-1">(Optional)</span>
                                                )}
                                            </label>
                                            <input
                                                id="field-city"
                                                type="text"
                                                name="city"
                                                placeholder={fieldSettings.city?.placeholder || 'City / Area'}
                                                value={formData.city}
                                                onChange={handleChange}
                                                className={`w-full bg-gray-50 border px-4 py-3 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-outfit text-sm ${
                                                    formErrors.city ? 'border-red-500 bg-red-50/50 ring-2 ring-red-400/30' : 'border-border/50'
                                                }`}
                                            />
                                            {formErrors.city && (
                                                <span className="text-[10px] font-bold text-red-500 font-outfit ml-1">{formErrors.city}</span>
                                            )}
                                        </div>
                                    )}

                                    {fieldSettings.zip?.enabled !== false && (
                                        <div className="flex flex-col gap-1.5 w-full">
                                            <label htmlFor="field-zip" className="text-xs font-bold text-text-muted uppercase tracking-widest font-outfit ml-1">
                                                {fieldSettings.zip?.label || 'Zip / Postal Code'}
                                                {fieldSettings.zip?.required ? (
                                                    <span className="text-error ml-1">*</span>
                                                ) : (
                                                    <span className="text-text-muted/60 text-[10px] font-normal lowercase tracking-normal ml-1">(Optional)</span>
                                                )}
                                            </label>
                                            <input
                                                id="field-zip"
                                                type="text"
                                                name="zip"
                                                placeholder={fieldSettings.zip?.placeholder || 'Postal code'}
                                                value={formData.zip}
                                                onChange={handleChange}
                                                className={`w-full bg-gray-50 border px-4 py-3 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-outfit text-sm ${
                                                    formErrors.zip ? 'border-red-500 bg-red-50/50 ring-2 ring-red-400/30' : 'border-border/50'
                                                }`}
                                            />
                                            {formErrors.zip && (
                                                <span className="text-[10px] font-bold text-red-500 font-outfit ml-1">{formErrors.zip}</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Order Notes */}
                            {fieldSettings.notes?.enabled !== false && (
                                <div className="flex flex-col gap-1.5 w-full">
                                    <label htmlFor="field-notes" className="text-xs font-bold text-text-muted uppercase tracking-widest font-outfit ml-1">
                                        {fieldSettings.notes?.label || 'Order Notes'}
                                        {fieldSettings.notes?.required ? (
                                            <span className="text-error ml-1">*</span>
                                        ) : (
                                            <span className="text-text-muted/60 text-[10px] font-normal lowercase tracking-normal ml-1">(Optional)</span>
                                        )}
                                    </label>
                                    <textarea
                                        id="field-notes"
                                        name="notes"
                                        rows={2}
                                        placeholder={fieldSettings.notes?.placeholder || 'Notes about your order (e.g. special delivery instructions)'}
                                        value={formData.notes || ''}
                                        onChange={handleChange}
                                        className={`w-full bg-gray-50 border px-4 py-3 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-outfit text-sm resize-none ${
                                            formErrors.notes ? 'border-red-500 bg-red-50/50 ring-2 ring-red-400/30' : 'border-border/50'
                                        }`}
                                    />
                                    {formErrors.notes && (
                                        <span className="text-[10px] font-bold text-red-500 font-outfit ml-1">{formErrors.notes}</span>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="mb-8">
                            <h2 className="text-xl font-bold mb-6 pb-2 border-b border-border font-outfit uppercase tracking-wider text-text-main">
                                Payment Method
                            </h2>
                            <div className="flex flex-col gap-4 mb-6">
                                <label className={`
                                    flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-all duration-200
                                    ${formData.paymentMethod === 'bkash' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:border-primary/50'}
                                `}>
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="bkash"
                                        checked={formData.paymentMethod === 'bkash'}
                                        onChange={handleChange}
                                        className="w-5 h-5 accent-primary"
                                    />
                                    <div className="flex flex-col">
                                        <span className="font-bold font-outfit text-text-main">bKash Payment</span>
                                        <span className="text-xs text-text-muted">Pay via bKash mobile banking</span>
                                    </div>
                                </label>

                                <label className={`
                                    flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-all duration-200
                                    ${formData.paymentMethod === 'cod' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:border-primary/50'}
                                `}>
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="cod"
                                        checked={formData.paymentMethod === 'cod'}
                                        onChange={handleChange}
                                        className="w-5 h-5 accent-primary"
                                    />
                                    <div className="flex flex-col">
                                        <span className="font-bold font-outfit text-text-main">Cash on Delivery</span>
                                        <span className="text-xs text-text-muted">Pay upon receiving your order</span>
                                    </div>
                                </label>
                            </div>

                            <div className="bg-gray-50 p-6 rounded-xl border border-border/50 animate-in fade-in slide-in-from-top-2">
                                {formData.paymentMethod === 'bkash' ? (
                                    <div className="space-y-6">
                                        <p className="text-sm text-text-muted font-outfit">
                                            Please send <strong className="text-primary font-bold text-lg">৳{(cartTotal + deliveryCharge).toFixed(2)}</strong> to <strong>017XXXXXXXX</strong> and enter the Transaction ID below.
                                        </p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <Input
                                                id="field-bkashNumber"
                                                label="bKash Number"
                                                name="bkashNumber"
                                                placeholder="017XXXXXXXX"
                                                value={formData.bkashNumber}
                                                onChange={handleChange}
                                                error={formErrors.bkashNumber}
                                            />
                                            <Input
                                                id="field-bkashTrxId"
                                                label="Transaction ID (TrxID)"
                                                name="bkashTrxId"
                                                placeholder="8N7..."
                                                value={formData.bkashTrxId}
                                                onChange={handleChange}
                                                error={formErrors.bkashTrxId}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-text-muted font-outfit">
                                        You can pay in cash when our courier delivers your package.
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col-reverse md:flex-row justify-between items-center gap-4 mt-8 pt-8 border-t border-border">
                            <Link to="/shop" className="w-full md:w-auto">
                                <Button variant="outline" className="w-full md:w-auto">Back to Shop</Button>
                            </Link>
                            <Button variant="primary" size="large" type="submit" className="w-full md:w-auto min-w-[240px]" disabled={isSubmitting}>
                                {isSubmitting ? 'Processing Order...' : 'Confirm Order'}
                            </Button>
                        </div>
                    </form>

                    {/* Right Column: Order Summary */}
                    <div className="lg:sticky lg:top-24 h-fit">
                        <div className="bg-gray-50 p-6 md:p-8 rounded-xl border border-border shadow-sm">
                            <h3 className="text-lg font-bold mb-6 font-outfit uppercase tracking-widest text-text-main">
                                Order Summary
                            </h3>
                            <div className="space-y-4 mb-6 pb-6 border-b border-border max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
                                {cartItems.map(item => (
                                    <div key={item.cartItemId || item.id} className="flex gap-4 items-start relative pb-4 border-b border-border/40 last:border-0 last:pb-0">
                                        <div className="w-16 h-16 bg-white rounded-lg border border-border flex items-center justify-center shrink-0 relative p-1 mt-0.5">
                                            <img src={item.image} alt={item.title} className="w-full h-full object-contain mix-blend-multiply" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start gap-2 mb-1">
                                                <p className="text-sm font-bold text-text-main font-outfit leading-tight">{item.title}</p>
                                                <button
                                                    type="button"
                                                    onClick={() => removeFromCart(item.cartItemId || item.id)}
                                                    className="text-text-muted hover:text-red-600 hover:bg-red-50 p-1 rounded-md transition-colors shrink-0 -mt-1 -mr-1 cursor-pointer"
                                                    title="Remove item"
                                                    aria-label="Remove item"
                                                >
                                                    <X size={15} />
                                                </button>
                                            </div>
                                            {item.style && item.style !== 'Default' && (
                                                <p className="text-xs text-text-muted font-outfit opacity-80 mb-1">{item.style}</p>
                                            )}
                                            {item.lensOption && item.lensOption.id !== 'frame_only' && (
                                                <div className="flex flex-wrap items-center gap-1.5 mb-2">
                                                    <span className="text-[10px] font-bold px-2 py-0.5 bg-primary/5 text-primary rounded-md border border-primary/15 font-outfit">
                                                        👓 {item.lensOption.name}
                                                    </span>
                                                    {item.lensOption.isPrescription && (
                                                        <span className="text-[9px] font-bold px-1.5 py-0.5 bg-green-50 text-green-700 rounded border border-green-200 font-outfit">
                                                            {item.lensOption.method === 'upload' && 'Rx Slip Attached'}
                                                            {item.lensOption.method === 'manual' && 'Manual Power'}
                                                            {item.lensOption.method === 'whatsapp' && 'WhatsApp Rx'}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                            <div className="flex items-center justify-between gap-2 mt-2">
                                                <div className="flex items-center gap-2 border border-border rounded-lg px-2 py-1 w-fit bg-white">
                                                    <button
                                                        type="button"
                                                        onClick={() => updateQuantity(item.cartItemId || item.id, -1)}
                                                        className="text-text-muted hover:text-primary transition-colors disabled:opacity-50"
                                                        disabled={item.quantity <= 1}
                                                    >
                                                        <Minus size={14} />
                                                    </button>
                                                    <span className="text-sm font-bold w-6 text-center font-outfit">{item.quantity}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => updateQuantity(item.cartItemId || item.id, 1)}
                                                        className="text-text-muted hover:text-primary transition-colors"
                                                    >
                                                        <Plus size={14} />
                                                    </button>
                                                </div>
                                                <div className="text-sm font-bold text-text-main font-outfit">
                                                    ৳{(item.price * item.quantity).toFixed(2)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="space-y-3 font-outfit">
                                <div className="flex justify-between text-sm text-text-muted">
                                    <span>Subtotal</span>
                                    <span className="font-bold text-text-main">৳{cartTotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-text-muted">
                                    <span>Delivery Charge</span>
                                    {formData.district ? (
                                        <span className="font-bold text-text-main">
                                            ৳{deliveryCharge.toFixed(2)}
                                            <span className="text-xs ml-1 text-secondary">({formData.district})</span>
                                        </span>
                                    ) : (
                                        <span className="italic text-xs">Select district</span>
                                    )}
                                </div>
                                <div className="flex justify-between text-xl font-bold text-text-main pt-4 mt-4 border-t border-border uppercase tracking-wide">
                                    <span>Total</span>
                                    <span>৳{(cartTotal + deliveryCharge).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Checkout;
