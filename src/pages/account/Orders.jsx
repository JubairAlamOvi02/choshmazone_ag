import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { Package, Clock, CheckCircle2, ChevronRight } from 'lucide-react';


const UserOrders = () => {
    const { user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchOrders();
        }
    }, [user]);

    const fetchOrders = async () => {
        try {
            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setOrders(data);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />
            <main className="flex-1 container mx-auto px-4 py-12 md:py-20">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-4 mb-10">
                        <div className="w-12 h-12 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                            <Package size={24} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-text-main font-outfit uppercase tracking-wider">My Orders</h1>
                            <p className="text-text-muted text-sm font-outfit">Track and manage your recent purchases</p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="py-20 text-center">
                            <p className="text-text-muted font-outfit">Loading your orders...</p>
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="bg-white p-12 md:p-20 text-center rounded-3xl border border-border/50 shadow-sm animate-in fade-in zoom-in duration-500">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Package size={40} className="text-gray-300" />
                            </div>
                            <h2 className="text-2xl font-bold text-text-main font-outfit mb-2">No orders yet</h2>
                            <p className="text-text-muted font-outfit mb-8 max-w-sm mx-auto">Looks like you haven't placed any orders. Start exploring our premium eyewear collection.</p>
                            <Link to="/shop" className="inline-block px-10 py-4 bg-primary text-white font-bold rounded-xl hover:bg-primary/95 hover:-translate-y-0.5 transition-all shadow-lg shadow-primary/20 font-outfit uppercase tracking-widest">
                                Discover Collection
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {orders.map(order => (
                                <div key={order.id} className="bg-white rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group">
                                    <div className="p-6 md:p-8">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-border/50">
                                            <div className="flex items-center gap-4">
                                                <div className="px-4 py-2 bg-gray-50 rounded-lg border border-border">
                                                    <span className="text-xs font-bold text-text-muted uppercase tracking-widest block mb-1">Order ID</span>
                                                    <span className="text-sm font-bold text-text-main font-mono">#{order.id.slice(0, 8)}</span>
                                                </div>
                                                <div>
                                                    <span className="text-xs font-bold text-text-muted uppercase tracking-widest block mb-1">Placed On</span>
                                                    <span className="text-sm font-bold text-text-main">{new Date(order.created_at).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
                                                </div>
                                            </div>

                                            <div className={`
                                                inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest
                                                ${order.status === 'completed' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}
                                            `}>
                                                {order.status === 'completed' ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                                                {order.status}
                                            </div>
                                        </div>

                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-6 border-t border-border/10">
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                                                <div>
                                                    <span className="text-xs font-bold text-text-muted uppercase tracking-widest block mb-1">Items</span>
                                                    <span className="text-base font-bold text-text-main">
                                                        {order.shipping_address?.items_count || order.total_items || 'N/A'} Products
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-xs font-bold text-text-muted uppercase tracking-widest block mb-1">Payment</span>
                                                    <span className="text-base font-bold text-text-main uppercase">{order.payment_method}</span>
                                                </div>
                                                <div className="col-span-2 md:col-span-1">
                                                    <span className="text-xs font-bold text-text-muted uppercase tracking-widest block mb-1">Total Amount</span>
                                                    <span className="text-xl font-bold text-primary">৳{order.total_amount.toLocaleString()}</span>
                                                </div>
                                            </div>

                                            <Link to={`/account/orders/${order.id}`} className="flex items-center gap-2 text-sm font-bold text-text-main hover:text-primary transition-colors group/link">
                                                View Details
                                                <ChevronRight size={18} className="group-hover/link:translate-x-1 transition-transform" />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default UserOrders;
