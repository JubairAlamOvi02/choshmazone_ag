import React, { useState, useEffect } from 'react';
import { orderParams } from '../../lib/api/orders';
import { calculateDeliveryCharge } from '../../data/bangladeshLocations';
import { Trash2, ExternalLink, Filter, Search, MoreVertical, X, Package, User, Mail, Phone, MapPin, CreditCard, ChevronRight } from 'lucide-react';

const AdminOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);

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

    const openOrderDetails = (order) => {
        setSelectedOrder(order);
        setIsModalOpen(true);
    };

    const closeOrderDetails = () => {
        setIsModalOpen(false);
        setSelectedOrder(null);
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
                                            <button
                                                onClick={() => openOrderDetails(order)}
                                                className="p-2 text-gray-400 hover:text-text-main hover:bg-gray-100 rounded-lg transition-all"
                                                title="View Order Details"
                                            >
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

            {/* Order Details Modal */}
            {isModalOpen && selectedOrder && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
                    <div
                        className="absolute inset-0 bg-text-main/60 backdrop-blur-md animate-in fade-in duration-300"
                        onClick={closeOrderDetails}
                    ></div>

                    <div className="relative bg-white w-full max-w-5xl max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 slide-in-from-bottom-8 duration-500">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-8 py-6 border-b border-border/50">
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <h2 className="text-2xl font-bold text-text-main font-outfit uppercase tracking-tight">Order Details</h2>
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${getStatusStyles(selectedOrder.status)}`}>
                                        {selectedOrder.status}
                                    </span>
                                </div>
                                <p className="text-sm font-mono text-text-muted">Order ID: #{selectedOrder.id}</p>
                            </div>
                            <button
                                onClick={closeOrderDetails}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors group"
                            >
                                <X size={24} className="text-text-muted group-hover:text-text-main" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-8 md:p-10 custom-scrollbar">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                                {/* Left Column: Customer & Shipping */}
                                <div className="lg:col-span-1 space-y-8">
                                    <section>
                                        <div className="flex items-center gap-2 mb-4 text-primary">
                                            <User size={18} />
                                            <h3 className="text-sm font-bold uppercase tracking-widest font-outfit">Customer Information</h3>
                                        </div>
                                        <div className="bg-background-alt/50 rounded-2xl p-5 space-y-3">
                                            <div className="flex items-start gap-3">
                                                <div className="p-2 bg-white rounded-lg border border-border/50 text-text-muted">
                                                    <User size={14} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] uppercase tracking-widest text-text-muted font-bold mb-0.5">Name</p>
                                                    <p className="text-sm font-bold text-text-main font-outfit">
                                                        {selectedOrder.shipping_address?.first_name} {selectedOrder.shipping_address?.last_name}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <div className="p-2 bg-white rounded-lg border border-border/50 text-text-muted">
                                                    <Mail size={14} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] uppercase tracking-widest text-text-muted font-bold mb-0.5">Email</p>
                                                    <p className="text-sm font-outfit text-text-main">{selectedOrder.shipping_address?.email}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <div className="p-2 bg-white rounded-lg border border-border/50 text-text-muted">
                                                    <Phone size={14} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] uppercase tracking-widest text-text-muted font-bold mb-0.5">Phone</p>
                                                    <p className="text-sm font-outfit text-text-main">{selectedOrder.shipping_address?.phone || 'N/A'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    <section>
                                        <div className="flex items-center gap-2 mb-4 text-primary">
                                            <MapPin size={18} />
                                            <h3 className="text-sm font-bold uppercase tracking-widest font-outfit">Shipping Address</h3>
                                        </div>
                                        <div className="bg-background-alt/50 rounded-2xl p-5 space-y-3 font-outfit">
                                            <p className="text-sm text-text-main leading-relaxed">
                                                {selectedOrder.shipping_address?.address}<br />
                                                {selectedOrder.shipping_address?.thana && `${selectedOrder.shipping_address.thana}, `}
                                                {selectedOrder.shipping_address?.district}<br />
                                                {selectedOrder.shipping_address?.city}, {selectedOrder.shipping_address?.zip}<br />
                                                {selectedOrder.shipping_address?.country}
                                            </p>
                                        </div>
                                    </section>

                                    <section>
                                        <div className="flex items-center gap-2 mb-4 text-primary">
                                            <CreditCard size={18} />
                                            <h3 className="text-sm font-bold uppercase tracking-widest font-outfit">Payment Details</h3>
                                        </div>
                                        <div className="bg-background-alt/50 rounded-2xl p-5 space-y-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] uppercase tracking-widest text-text-muted font-bold">Method</span>
                                                <span className="text-sm font-bold text-text-main uppercase font-outfit">{selectedOrder.payment_method}</span>
                                            </div>
                                            {selectedOrder.payment_details?.bkash_number && (
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[10px] uppercase tracking-widest text-text-muted font-bold">bKash No</span>
                                                    <span className="text-sm font-outfit text-text-main">{selectedOrder.payment_details.bkash_number}</span>
                                                </div>
                                            )}
                                            {selectedOrder.payment_details?.transaction_id && (
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[10px] uppercase tracking-widest text-text-muted font-bold">TrxID</span>
                                                    <span className="text-sm font-mono text-primary font-bold">{selectedOrder.payment_details.transaction_id}</span>
                                                </div>
                                            )}
                                        </div>
                                    </section>
                                </div>

                                {/* Right Column: Order Items */}
                                <div className="lg:col-span-2 flex flex-col">
                                    <div className="flex items-center gap-2 mb-4 text-primary">
                                        <Package size={18} />
                                        <h3 className="text-sm font-bold uppercase tracking-widest font-outfit">Order Items</h3>
                                    </div>

                                    <div className="flex-1 bg-white border border-border/50 rounded-3xl overflow-hidden shadow-sm">
                                        <table className="w-full text-left border-collapse">
                                            <thead className="bg-gray-50/50">
                                                <tr>
                                                    <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest font-outfit">Product</th>
                                                    <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest font-outfit">Style</th>
                                                    <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest font-outfit text-center">Qty</th>
                                                    <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest font-outfit text-right">Price</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border/30">
                                                {selectedOrder.order_items?.map((item) => (
                                                    <tr key={item.id} className="group hover:bg-gray-50/50 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-4">
                                                                <button
                                                                    onClick={() => setPreviewImage(item.products?.image_url)}
                                                                    className="w-14 h-14 bg-white rounded-xl border border-border/50 flex items-center justify-center p-1.5 shadow-sm hover:scale-110 hover:shadow-md transition-all duration-300 cursor-pointer overflow-hidden group/img"
                                                                >
                                                                    <img
                                                                        src={item.products?.image_url}
                                                                        alt={item.products?.name}
                                                                        className="w-full h-full object-contain mix-blend-multiply group-hover/img:scale-110 transition-transform duration-500"
                                                                    />
                                                                </button>
                                                                <span className="text-sm font-bold text-text-main font-outfit max-w-[150px] line-clamp-2">
                                                                    {item.products?.name}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="text-xs text-text-muted font-outfit">{item.style || 'Default'}</span>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <span className="text-sm font-bold text-text-main font-outfit">{item.quantity}</span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <span className="text-sm font-bold text-text-main font-outfit">৳{item.unit_price.toLocaleString()}</span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>

                                        {/* Order Summary Footer */}
                                        <div className="bg-gray-50/50 p-8 border-t border-border/50">
                                            <div className="flex flex-col items-end gap-3 font-outfit">
                                                <div className="flex justify-between w-full max-w-[240px] text-sm text-text-muted">
                                                    <span>Subtotal</span>
                                                    <span className="font-bold text-text-main">৳{(selectedOrder.total_amount - calculateDeliveryCharge(selectedOrder.shipping_address?.district)).toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between w-full max-w-[240px] text-sm text-text-muted">
                                                    <span>Shipping</span>
                                                    <span className="font-bold text-text-main">৳{calculateDeliveryCharge(selectedOrder.shipping_address?.district).toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between w-full max-w-[280px] text-xl font-bold text-text-main pt-3 mt-3 border-t border-border/50 uppercase tracking-tight">
                                                    <span>Total Amount</span>
                                                    <span className="text-primary">৳{selectedOrder.total_amount.toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Image Preview Modal */}
            {previewImage && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300"
                        onClick={() => setPreviewImage(null)}
                    ></div>
                    <div className="relative max-w-[90vw] max-h-[90vh] animate-in zoom-in-95 duration-300">
                        <button
                            onClick={() => setPreviewImage(null)}
                            className="absolute -top-12 right-0 p-2 text-white hover:text-primary transition-colors bg-white/10 hover:bg-white rounded-full"
                        >
                            <X size={20} />
                        </button>
                        <img
                            src={previewImage}
                            alt="Product Preview"
                            className="rounded-3xl shadow-2xl max-h-[80vh] object-contain bg-white p-4"
                        />
                    </div>
                </div>
            )}
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
