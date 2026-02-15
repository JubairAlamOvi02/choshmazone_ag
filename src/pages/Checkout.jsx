import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Button from '../components/Button';
import Input from '../components/Input';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { orderParams } from '../lib/api/orders';
import { getDistricts, getThanas, calculateDeliveryCharge } from '../data/bangladeshLocations';

const Checkout = () => {
    const { cartItems, cartTotal, clearCart } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        email: user?.email || '',
        phone: '',
        firstName: '',
        lastName: '',
        address: '',
        district: '',
        thana: '',
        city: '',
        zip: '',
        country: 'Bangladesh',
        paymentMethod: 'bkash', // 'bkash' or 'cod'
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

    const handleChange = (e) => {
        const { name, value } = e.target;

        // If district changes, reset thana
        if (name === 'district') {
            setFormData(prev => ({ ...prev, [name]: value, thana: '' }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.paymentMethod === 'bkash') {
            if (!formData.bkashNumber || !formData.bkashTrxId) {
                alert('Please enter bKash details');
                return;
            }
        }

        setIsSubmitting(true);

        try {
            const totalWithDelivery = cartTotal + deliveryCharge;

            const supabaseOrderData = {
                user_id: user?.id || null,
                total_amount: totalWithDelivery,
                status: 'pending',
                payment_method: formData.paymentMethod,
                shipping_address: {
                    first_name: formData.firstName,
                    last_name: formData.lastName,
                    email: formData.email,
                    phone: formData.phone,
                    address: formData.address,
                    district: formData.district,
                    thana: formData.thana,
                    city: formData.city,
                    zip: formData.zip,
                    country: formData.country
                },
                payment_details: formData.paymentMethod === 'bkash' ? {
                    bkash_number: formData.bkashNumber,
                    transaction_id: formData.bkashTrxId
                } : {}
            };

            await orderParams.create(supabaseOrderData, cartItems);

            const now = new Date();
            const legacyOrderData = {
                orderId: `ORD-${Date.now()}`,
                orderDate: now.toLocaleDateString(),
                orderTime: now.toLocaleTimeString(),
                ...formData,
                items: cartItems.map(item => ({
                    title: item.title,
                    quantity: item.quantity,
                    price: item.price,
                    style: item.style
                })),
                deliveryCharge: deliveryCharge.toFixed(2),
                totalAmount: totalWithDelivery.toFixed(2)
            };

            fetch(import.meta.env.VITE_GOOGLE_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'text/plain',
                },
                body: JSON.stringify(legacyOrderData)
            }).catch(err => console.error("Google Sheets Sync Failed:", err));

            clearCart();
            navigate('/order-success');
        } catch (error) {
            console.error('Error placing order:', error);
            alert('There was an issue processing your order: ' + error.message);
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
            <main className="container mx-auto px-4 py-12 md:py-16">
                <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-12 lg:gap-20">
                    {/* Left Column: Forms */}
                    <form onSubmit={handleSubmit} className="flex flex-col">
                        <div className="mb-12">
                            <h2 className="text-xl font-bold mb-6 pb-2 border-b border-border font-outfit uppercase tracking-wider text-text-main">
                                Contact Information
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Input
                                    label="Email Address"
                                    type="email"
                                    name="email"
                                    placeholder="you@example.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                                <Input
                                    label="Phone Number"
                                    type="tel"
                                    name="phone"
                                    placeholder="+8801..."
                                    value={formData.phone}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="mb-12">
                            <h2 className="text-xl font-bold mb-6 pb-2 border-b border-border font-outfit uppercase tracking-wider text-text-main">
                                Shipping Address
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <Input
                                    label="First Name"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    required
                                />
                                <Input
                                    label="Last Name"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="mb-6">
                                <Input
                                    label="Address"
                                    name="address"
                                    placeholder="Street address, apartment, etc."
                                    value={formData.address}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-bold text-text-main font-outfit">
                                        District <span className="text-error">*</span>
                                    </label>
                                    <select
                                        name="district"
                                        value={formData.district}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-outfit bg-white"
                                    >
                                        <option value="">Select District</option>
                                        {getDistricts().map(district => (
                                            <option key={district} value={district}>{district}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-bold text-text-main font-outfit">
                                        Thana <span className="text-error">*</span>
                                    </label>
                                    <select
                                        name="thana"
                                        value={formData.thana}
                                        onChange={handleChange}
                                        required
                                        disabled={!formData.district}
                                        className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-outfit bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                                    >
                                        <option value="">Select Thana</option>
                                        {availableThanas.map(thana => (
                                            <option key={thana} value={thana}>{thana}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Input
                                    label="City"
                                    name="city"
                                    value={formData.city}
                                    onChange={handleChange}
                                    required
                                />
                                <Input
                                    label="Zip / Postal Code"
                                    name="zip"
                                    value={formData.zip}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
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
                                                label="bKash Number"
                                                name="bkashNumber"
                                                placeholder="017XXXXXXXX"
                                                value={formData.bkashNumber}
                                                onChange={handleChange}
                                                required
                                            />
                                            <Input
                                                label="Transaction ID (TrxID)"
                                                name="bkashTrxId"
                                                placeholder="8N7..."
                                                value={formData.bkashTrxId}
                                                onChange={handleChange}
                                                required
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
                                    <div key={item.id} className="flex gap-4 items-center">
                                        <div className="w-16 h-16 bg-white rounded-lg border border-border flex items-center justify-center shrink-0 relative p-1">
                                            <img src={item.image} alt={item.title} className="w-full h-full object-contain mix-blend-multiply" />
                                            <span className="absolute -top-2 -right-2 w-6 h-6 bg-primary text-white text-[10px] flex items-center justify-center rounded-full font-bold shadow-sm">
                                                {item.quantity}
                                            </span>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-text-main font-outfit leading-tight mb-1">{item.title}</p>
                                            <p className="text-xs text-text-muted font-outfit opacity-80">{item.style}</p>
                                        </div>
                                        <div className="text-sm font-bold text-text-main font-outfit ml-auto">
                                            ৳{(item.price * item.quantity).toFixed(2)}
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
