import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import {
    Package, MapPin, CreditCard, ArrowLeft,
    CheckCircle2, Circle, Clock, Truck
} from 'lucide-react';

const OrderDetails = () => {
    const { id } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrderDetails();
    }, [id]);

    const fetchOrderDetails = async () => {
        try {
            const { data, error } = await supabase
                .from('orders')
                .select(`
                    *,
                    order_items (
                        *,
                        product:product_id (*)
                    )
                `)
                .eq('id', id)
                .single();

            if (error) throw error;
            setOrder(data);
        } catch (error) {
            console.error('Error fetching order details:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <Navbar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
                <Footer />
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <Navbar />
                <div className="flex-1 flex flex-col items-center justify-center p-4">
                    <h2 className="text-2xl font-bold text-text-main mb-4">Order Not Found</h2>
                    <Link to="/orders" className="text-primary hover:underline">Return to Orders</Link>
                </div>
                <Footer />
            </div>
        );
    }

    // Timeline Steps
    const steps = [
        { status: 'pending', label: 'Order Placed', icon: Clock },
        { status: 'processing', label: 'Processing', icon: Package },
        { status: 'shipped', label: 'Shipped', icon: Truck },
        { status: 'delivered', label: 'Delivered', icon: CheckCircle2 },
    ];

    const currentStepIndex = steps.findIndex(step => step.status === order.status) !== -1
        ? steps.findIndex(step => step.status === order.status)
        // If status is 'completed', assume it's delivered for the timeline visual
        : (order.status === 'completed' ? 3 : 0);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />
            <main className="flex-1 container mx-auto px-4 py-8 md:py-12">
                <Link to="/orders" className="inline-flex items-center gap-2 text-text-muted hover:text-primary mb-8 transition-colors font-outfit text-sm font-bold uppercase tracking-widest">
                    <ArrowLeft size={16} />
                    Back to Orders
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Order Info & Items */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Order Header */}
                        <div className="bg-white p-8 rounded-3xl border border-border/50 shadow-sm">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                <div>
                                    <h1 className="text-2xl font-bold text-text-main font-outfit uppercase tracking-wider mb-1">
                                        Order #{order.id.slice(0, 8)}
                                    </h1>
                                    <p className="text-sm text-text-muted font-outfit">
                                        Placed on {new Date(order.created_at).toLocaleDateString(undefined, { dateStyle: 'long', timeStyle: 'short' })}
                                    </p>
                                </div>
                                <div className={`
                                    inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold uppercase tracking-widest self-start md:self-auto
                                    ${order.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}
                                `}>
                                    {order.status}
                                </div>
                            </div>

                            {/* Timeline */}
                            <div className="relative mt-12 mb-4">
                                <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -translate-y-1/2 rounded-full hidden md:block" />
                                <div className="flex flex-col md:flex-row justify-between relative z-10 gap-8 md:gap-0">
                                    {steps.map((step, index) => {
                                        const isCompleted = index <= currentStepIndex;
                                        const isCurrent = index === currentStepIndex;
                                        const Icon = step.icon;

                                        return (
                                            <div key={step.status} className="flex md:flex-col items-center gap-4 md:gap-3 group">
                                                <div className={`
                                                    w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500
                                                    ${isCompleted
                                                        ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-110'
                                                        : 'bg-white border-gray-200 text-gray-300'
                                                    }
                                                `}>
                                                    <Icon size={18} />
                                                </div>
                                                <span className={`
                                                    text-xs font-bold uppercase tracking-widest transition-colors duration-300
                                                    ${isCompleted ? 'text-primary' : 'text-gray-400'}
                                                `}>
                                                    {step.label}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Order Items */}
                        <div className="bg-white p-8 rounded-3xl border border-border/50 shadow-sm">
                            <h3 className="text-lg font-bold text-text-main font-outfit uppercase tracking-widest mb-6">Items Ordered</h3>
                            <div className="space-y-6">
                                {order.order_items?.map((item) => (
                                    <div key={item.id} className="flex gap-4 items-start pb-6 border-b border-border/50 last:border-0 last:pb-0">
                                        <div className="w-20 h-24 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0">
                                            {item.product?.image_url && (
                                                <img
                                                    src={item.product.image_url}
                                                    alt={item.product.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-text-main font-outfit">{item.product?.name || 'Product'}</h4>
                                            <p className="text-sm text-text-muted mb-2">Quantity: {item.quantity}</p>
                                            <p className="font-bold text-primary">৳{item.price.toLocaleString()}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Address & Summaries */}
                    <div className="space-y-8">
                        {/* Shipping Address */}
                        <div className="bg-white p-8 rounded-3xl border border-border/50 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <MapPin className="text-primary" size={20} />
                                <h3 className="text-lg font-bold text-text-main font-outfit uppercase tracking-widest">Delivery Details</h3>
                            </div>
                            <div className="space-y-1 text-sm text-text-muted font-outfit">
                                <p className="font-bold text-text-main text-base">{order.shipping_address?.fullName}</p>
                                <p>{order.shipping_address?.address}</p>
                                <p>{order.shipping_address?.thana}, {order.shipping_address?.district}</p>
                                <p>{order.shipping_address?.phone}</p>
                                <p>{order.shipping_address?.email}</p>
                            </div>
                        </div>

                        {/* Order Summary */}
                        <div className="bg-white p-8 rounded-3xl border border-border/50 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <CreditCard className="text-primary" size={20} />
                                <h3 className="text-lg font-bold text-text-main font-outfit uppercase tracking-widest">Order Summary</h3>
                            </div>

                            <div className="space-y-3 mb-6 pb-6 border-b border-border/50 text-sm font-outfit">
                                <div className="flex justify-between text-text-muted">
                                    <span>Subtotal</span>
                                    <span className="font-bold text-text-main">৳{(order.total_amount - (order.delivery_charge || 0)).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-text-muted">
                                    <span>Delivery Charge</span>
                                    <span className="font-bold text-text-main">৳{order.delivery_charge?.toLocaleString() || '0'}</span>
                                </div>
                            </div>

                            <div className="flex justify-between items-center text-lg font-bold text-text-main font-outfit">
                                <span>Total</span>
                                <span className="text-primary">৳{order.total_amount.toLocaleString()}</span>
                            </div>

                            <div className="mt-6 pt-6 border-t border-border/50">
                                <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-1">Payment Method</p>
                                <p className="font-bold text-text-main uppercase font-outfit">{order.payment_method}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default OrderDetails;
