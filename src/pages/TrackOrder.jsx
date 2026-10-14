import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useToast } from '../context/ToastContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Button from '../components/Button';
import { Smartphone, Mail, CheckCircle2, Clock, ChevronRight, Truck, ArrowLeft } from 'lucide-react';

const TrackOrder = () => {
    const [step, setStep] = useState(1); // 1: Phone Input, 2: OTP Input, 3: Orders List
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [generatedOtp, setGeneratedOtp] = useState('');
    const [email, setEmail] = useState('');
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [expandedOrder, setExpandedOrder] = useState(null);
    const { showToast } = useToast();

    const handlePhoneChange = (e) => {
        let val = e.target.value.replace(/[^\d+]/g, '');
        // Handle user pasting with +880, 880, +88, or starting with 0
        if (val.startsWith('+880')) val = val.slice(4);
        else if (val.startsWith('880')) val = val.slice(3);
        else if (val.startsWith('+88')) val = val.slice(3);
        else if (val.startsWith('0')) val = val.slice(1);

        // Limit to 10 digits (e.g. 17XXXXXXXX)
        if (val.length <= 10) {
            setPhone(val);
        }
    };

    const handlePhoneSubmit = async (e) => {
        e.preventDefault();

        const cleanDigits = phone.replace(/\D/g, '');
        if (cleanDigits.length !== 10) {
            showToast("Please enter a valid 10-digit mobile number after +880 (e.g. 1712345678)", "error");
            return;
        }

        const local11 = '0' + cleanDigits; // 017XXXXXXXX
        const intlFormat = '+880' + cleanDigits; // +88017XXXXXXXX
        const digits13 = '880' + cleanDigits; // 88017XXXXXXXX
        const tenDigits = cleanDigits; // 17XXXXXXXX

        setLoading(true);
        try {
            // Search for orders linked to this phone number in any common format in the shipping_address JSONB column
            const { data, error } = await supabase
                .from('orders')
                .select(`
                    *,
                    order_items (
                        *,
                        products (*)
                    )
                `)
                .or(`shipping_address->>phone.eq.${local11},shipping_address->>phone.eq.${intlFormat},shipping_address->>phone.eq.${digits13},shipping_address->>phone.eq.${tenDigits}`)
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (!data || data.length === 0) {
                showToast("No orders found for this phone number.", "error");
                setLoading(false);
                return;
            }

            // Extract email from the most recent order for verification
            const latestOrder = data[0];
            const customerEmail = latestOrder.shipping_address?.email;

            if (!customerEmail) {
                showToast("Order found but no email associated with this order.", "error");
                setLoading(false);
                return;
            }

            setEmail(customerEmail);
            setOrders(data);

            // Generate a 6-digit OTP
            const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
            setGeneratedOtp(newOtp);

            // Trigger email script
            try {
                fetch(import.meta.env.VITE_GOOGLE_SCRIPT_URL, {
                    method: 'POST',
                    mode: 'no-cors',
                    body: JSON.stringify({
                        action: "sendOTP",
                        email: customerEmail,
                        otp: newOtp,
                        phone: intlFormat
                    })
                });
            } catch (err) {
                console.error("Failed to trigger email script:", err);
            }

            console.log(`[AUTH] OTP for ${customerEmail}: ${newOtp}`);

            const [local, domain] = customerEmail.split('@');
            const maskedEmail = local.substring(0, 1) + "***" + local.substring(local.length - 1) + "@" + domain;

            showToast(`Verification code sent to ${maskedEmail}`, "success");
            setStep(2);
        } catch (error) {
            console.error('Track Order Error:', error);
            showToast("Something went wrong while searching for orders.", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleOtpSubmit = (e) => {
        e.preventDefault();
        if (otp === generatedOtp) {
            showToast("Verification successful!", "success");
            setStep(3);
        } else {
            showToast("Incorrect code.", "error");
        }
    };

    const resetFlow = () => {
        setStep(1);
        setOtp('');
        setGeneratedOtp('');
        setExpandedOrder(null);
    };

    const toggleOrderDetails = (orderId) => {
        setExpandedOrder(expandedOrder === orderId ? null : orderId);
    };

    return (
        <div className="min-h-screen bg-white flex flex-col">
            <Navbar />

            <main className="flex-1 container mx-auto px-4 py-12 md:py-20 flex flex-col items-center">
                <div className="max-w-[800px] w-full">

                    {step === 1 && (
                        <div className="max-w-[480px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="text-center mb-10">
                                <div className="w-16 h-16 bg-primary/5 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                    <Smartphone size={32} className="text-primary" />
                                </div>
                                <h1 className="text-3xl font-bold mb-3 text-text-main font-outfit uppercase tracking-wider">Track Orders</h1>
                                <p className="text-text-muted font-outfit">Enter your phone number to see order history.</p>
                            </div>

                            <form onSubmit={handlePhoneSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="block text-xs font-bold text-text-main uppercase tracking-[0.2em] font-outfit px-1">
                                        Phone Number
                                    </label>
                                    <div className="relative flex items-center">
                                        <div className="absolute left-0 top-0 bottom-0 flex items-center px-4 pointer-events-none border-r border-border bg-gray-50 rounded-l-xl text-text-main font-bold font-outfit text-base select-none">
                                            <span className="flex items-center gap-1.5">
                                                <span className="text-base">🇧🇩</span>
                                                <span>+880</span>
                                            </span>
                                        </div>
                                        <input
                                            type="tel"
                                            value={phone}
                                            onChange={handlePhoneChange}
                                            placeholder="17XXXXXXXX"
                                            maxLength={10}
                                            required
                                            className="w-full pl-28 pr-5 py-4 rounded-xl border border-border focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all font-outfit text-lg shadow-sm font-medium tracking-wide"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between text-[11px] text-text-muted font-outfit px-1">
                                        <span>Enter the remaining 10 digits (e.g. 17XXXXXXXX)</span>
                                        {phone && (
                                            <span className={`font-bold font-mono ${phone.length === 10 ? 'text-emerald-600' : 'text-amber-600'}`}>
                                                +880{phone} ({phone.length}/10)
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <Button type="submit" variant="primary" size="large" className="w-full shadow-xl shadow-primary/20 transition-all active:scale-[0.98]" disabled={loading}>
                                    {loading ? 'Searching...' : 'Continue'}
                                </Button>
                            </form>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="max-w-[480px] mx-auto animate-in fade-in zoom-in duration-500">
                            <button onClick={resetFlow} className="flex items-center gap-2 text-text-muted hover:text-text-main mb-8 transition-colors font-bold text-xs uppercase tracking-widest">
                                <ArrowLeft size={14} /> Back
                            </button>
                            <div className="text-center mb-10">
                                <div className="w-16 h-16 bg-secondary/5 rounded-2xl flex items-center justify-center mx-auto mb-6 text-secondary">
                                    <Mail size={32} />
                                </div>
                                <h2 className="text-3xl font-bold mb-3 text-text-main font-outfit uppercase tracking-wider">Check Your Email</h2>
                                <p className="text-text-muted font-outfit">Verification code sent to {email.replace(/^(.)(.*)(.@.*)$/, "$1***$3")}</p>
                            </div>
                            <form onSubmit={handleOtpSubmit} className="space-y-6">
                                <input
                                    type="text"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    placeholder="000000"
                                    maxLength={6}
                                    required
                                    className="w-full px-4 py-5 rounded-xl border border-border text-center text-4xl font-bold tracking-[0.3em] focus:ring-4 focus:ring-secondary/5 focus:border-secondary outline-none transition-all font-outfit shadow-inner"
                                />
                                <Button type="submit" variant="primary" size="large" className="w-full shadow-xl shadow-primary/20">
                                    Verify & Track
                                </Button>
                            </form>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="animate-in fade-in slide-in-from-top-4 duration-700">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                                <div>
                                    <h2 className="text-3xl font-bold text-text-main font-outfit uppercase tracking-wider mb-2">My Orders</h2>
                                    <p className="text-text-muted font-outfit">Found {orders.length} order history entries</p>
                                </div>
                                <Button variant="outline" onClick={resetFlow}>Logout Session</Button>
                            </div>

                            <div className="space-y-6">
                                {orders.map(order => (
                                    <div key={order.id} className="bg-white rounded-3xl border border-border/50 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group">
                                        <div className="p-6 md:p-8">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-border/10 pb-6">
                                                <div className="flex items-center gap-6">
                                                    <div className="px-5 py-2.5 bg-gray-50 rounded-2xl border border-border shadow-inner">
                                                        <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest block mb-1">ID</span>
                                                        <span className="text-sm font-bold text-text-main font-mono">#{order.id.slice(0, 8)}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest block mb-1">Placed</span>
                                                        <span className="text-sm font-bold text-text-main">{new Date(order.created_at).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                                <div className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 ${order.status === 'completed' || order.status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                                                    }`}>
                                                    {order.status === 'completed' || order.status === 'delivered' ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                                                    {order.status}
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap gap-4 mb-8">
                                                {order.order_items?.map((item, idx) => (
                                                    <div key={idx} className="flex items-center gap-4 bg-gray-50/50 pr-5 rounded-2xl border border-border/50 group-hover:border-primary/20 transition-colors">
                                                        <div className="w-14 h-14 bg-white flex items-center justify-center p-2 rounded-2xl shadow-sm border border-border/50">
                                                            <img src={item.products?.image_url || "/placeholder.jpg"} alt="" className="w-full h-full object-contain mix-blend-multiply" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-text-main line-clamp-1">{item.products?.name}</p>
                                                            <p className="text-[10px] text-text-muted uppercase font-bold tracking-tighter">Qty: {item.quantity}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {expandedOrder === order.id && (
                                                <div className="mb-8 p-8 bg-background-alt/30 rounded-3xl border border-border/50 animate-in slide-in-from-top-4 grid grid-cols-1 md:grid-cols-2 gap-10">
                                                    <div>
                                                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-4">Delivery Address</h4>
                                                        <div className="text-sm text-text-main space-y-1.5 font-outfit">
                                                            <p className="font-bold text-base">{order.shipping_address?.first_name} {order.shipping_address?.last_name}</p>
                                                            <p className="opacity-80">{order.shipping_address?.address}</p>
                                                            <p className="opacity-80">{order.shipping_address?.thana}, {order.shipping_address?.district}</p>
                                                            <p className="opacity-80 font-mono">{order.shipping_address?.phone}</p>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-4">Payment Summary</h4>
                                                        <div className="text-sm text-text-main space-y-1.5 font-outfit">
                                                            <div className="flex justify-between border-b border-border/10 pb-2">
                                                                <span className="opacity-70 uppercase tracking-tighter font-bold">Method</span>
                                                                <span className="font-bold uppercase text-primary">{order.payment_method}</span>
                                                            </div>
                                                            <div className="flex justify-between pt-2">
                                                                <span className="opacity-70 uppercase tracking-tighter font-bold">Total</span>
                                                                <span className="text-lg font-bold text-text-main font-outfit tracking-tighter">৳{order.total_amount.toLocaleString()}</span>
                                                            </div>
                                                            {order.payment_method === 'bkash' && (
                                                                <div className="mt-4 p-3 bg-white/50 rounded-xl border border-border/50 text-[10px] font-mono opacity-80">
                                                                    Trx: {order.payment_details?.transaction_id}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex items-center justify-between border-t border-border/10 pt-6">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-2xl font-bold text-primary">৳{order.total_amount.toLocaleString()}</span>
                                                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">({order.order_items?.length} Items)</span>
                                                </div>
                                                <button onClick={() => toggleOrderDetails(order.id)} className="flex items-center gap-2 text-xs font-bold text-text-main hover:text-primary transition-all group/link uppercase tracking-[0.2em] font-outfit">
                                                    {expandedOrder === order.id ? 'Close' : 'Track Order'}
                                                    <ChevronRight size={18} className={`transition-transform duration-300 ${expandedOrder === order.id ? 'rotate-90 text-primary' : 'group-hover/link:translate-x-1'}`} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default TrackOrder;
