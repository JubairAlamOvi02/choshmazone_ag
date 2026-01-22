import React, { useState, useEffect } from 'react';
import { orderParams } from '../../lib/api/orders';
import { Trash2, ExternalLink, Filter, Search, MoreVertical } from 'lucide-react';

const AdminOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const data = await orderParams.fetchAll();
            setOrders(data);
        } catch (err) {
            console.error(err);
            setError('Failed to fetch orders: ' + (err.message || 'Unknown error'));
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (orderId, newStatus) => {
        try {
            await orderParams.updateStatus(orderId, newStatus);
            // Update local state
            setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        } catch (err) {
            alert('Failed to update status');
        }
    };

    const handleDelete = async (orderId) => {
        if (!window.confirm('Are you sure you want to PERMANENTLY delete this order? This cannot be undone.')) return;

        try {
            await orderParams.delete(orderId);
            setOrders(orders.filter(o => o.id !== orderId));
        } catch (err) {
            console.error('Delete error:', err);
            alert('Failed to delete order. ' + (err.message || ''));
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error) return (
        <div className="p-8 bg-red-50 text-red-600 rounded-2xl border border-red-100 font-outfit text-center">
            {error}
        </div>
    );

    return (
        <div className="animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div>
                    <h1 className="text-3xl font-bold text-text-main font-outfit uppercase tracking-tight">Order Management</h1>
                    <p className="text-text-muted font-outfit">Review and manage all customer transactions.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="p-3 bg-white border border-border rounded-xl text-text-muted hover:text-text-main transition-colors">
                        <Search size={20} />
                    </button>
                    <button className="flex items-center gap-2 px-6 py-3 bg-white border border-border rounded-xl text-sm font-bold text-text-main hover:bg-gray-50 transition-all font-outfit uppercase tracking-widest shadow-sm">
                        <Filter size={16} />
                        Filter
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-border/50 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-border/50">
                                <th className="px-6 py-5 text-xs font-bold text-text-muted uppercase tracking-[0.2em] font-outfit">Order ID</th>
                                <th className="px-6 py-5 text-xs font-bold text-text-muted uppercase tracking-[0.2em] font-outfit">Customer</th>
                                <th className="px-6 py-5 text-xs font-bold text-text-muted uppercase tracking-[0.2em] font-outfit">Amount</th>
                                <th className="px-6 py-5 text-xs font-bold text-text-muted uppercase tracking-[0.2em] font-outfit">Status</th>
                                <th className="px-6 py-5 text-xs font-bold text-text-muted uppercase tracking-[0.2em] font-outfit">Date</th>
                                <th className="px-6 py-5 text-xs font-bold text-text-muted uppercase tracking-[0.2em] font-outfit text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                            {orders.map(order => (
                                <tr key={order.id} className="hover:bg-gray-50/30 transition-colors group">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-mono font-bold text-text-main uppercase">#{order.id.slice(0, 8)}</span>
                                            <ExternalLink size={14} className="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-text-main font-outfit">{order.shipping_address?.first_name} {order.shipping_address?.last_name}</span>
                                            <span className="text-xs text-text-muted font-outfit">{order.shipping_address?.email}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col">
                                            <span className="text-base font-bold text-primary font-outfit">৳{order.total_amount.toLocaleString()}</span>
                                            <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{order.payment_method}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <select
                                            value={order.status}
                                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                            className={`
                                                text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border-none outline-none cursor-pointer
                                                ${getStatusStyles(order.status)}
                                            `}
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="processing">Processing</option>
                                            <option value="shipped">Shipped</option>
                                            <option value="completed">Completed</option>
                                            <option value="cancelled">Cancelled</option>
                                        </select>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="text-sm text-text-main font-outfit">
                                            {new Date(order.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleDelete(order.id)}
                                                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                title="Delete Order"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                            <button className="p-2 text-gray-400 hover:text-text-main hover:bg-gray-100 rounded-lg transition-all">
                                                <MoreVertical size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const getStatusStyles = (status) => {
    switch (status) {
        case 'pending': return 'bg-amber-100 text-amber-700';
        case 'processing': return 'bg-blue-100 text-blue-700';
        case 'shipped': return 'bg-indigo-100 text-indigo-700';
        case 'completed': return 'bg-green-100 text-green-700';
        case 'cancelled': return 'bg-red-100 text-red-700';
        default: return 'bg-gray-100 text-gray-700';
    }
};

export default AdminOrders;
