
import React, { useState, useEffect } from 'react';
import { orderParams } from '../../lib/api/orders';

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
            setError('Failed to fetch orders');
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

    if (loading) return <div>Loading orders...</div>;
    if (error) return <div style={{ color: 'red' }}>{error}</div>;

    return (
        <div className="admin-orders">
            <h1>All Orders</h1>

            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '2rem', background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <thead style={{ background: '#f8f9fa' }}>
                    <tr>
                        <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #eee' }}>Order ID</th>
                        <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #eee' }}>Customer</th>
                        <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #eee' }}>Amount</th>
                        <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #eee' }}>Method</th>
                        <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #eee' }}>Status</th>
                        <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #eee' }}>Date</th>
                        <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #eee' }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.map(order => (
                        <tr key={order.id}>
                            <td style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>
                                <span style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{order.id.slice(0, 8)}...</span>
                            </td>
                            <td style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>
                                <div>{order.shipping_address?.first_name} {order.shipping_address?.last_name}</div>
                                <div style={{ fontSize: '0.8rem', color: '#666' }}>{order.shipping_address?.email}</div>
                            </td>
                            <td style={{ padding: '1rem', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>
                                ৳{order.total_amount}
                            </td>
                            <td style={{ padding: '1rem', borderBottom: '1px solid #eee', textTransform: 'uppercase' }}>
                                {order.payment_method}
                            </td>
                            <td style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>
                                <span style={{
                                    padding: '0.25rem 0.5rem',
                                    borderRadius: '4px',
                                    fontSize: '0.8rem',
                                    backgroundColor: getStatusColor(order.status),
                                    color: 'white'
                                }}>
                                    {order.status}
                                </span>
                            </td>
                            <td style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>
                                {new Date(order.created_at).toLocaleDateString()}
                            </td>
                            <td style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <select
                                        value={order.status}
                                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                        style={{ padding: '0.25rem', borderRadius: '4px', border: '1px solid #ddd' }}
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="processing">Processing</option>
                                        <option value="shipped">Shipped</option>
                                        <option value="completed">Completed</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                    <button
                                        onClick={() => handleDelete(order.id)}
                                        style={{
                                            padding: '0.25rem 0.5rem',
                                            backgroundColor: '#fee2e2',
                                            color: '#dc2626',
                                            border: '1px solid #fecaca',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontSize: '0.8rem'
                                        }}
                                        title="Delete Order"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const getStatusColor = (status) => {
    switch (status) {
        case 'pending': return '#ffc107';
        case 'processing': return '#17a2b8';
        case 'shipped': return '#007bff';
        case 'completed': return '#28a745';
        case 'cancelled': return '#dc3545';
        default: return '#6c757d';
    }
};

export default AdminOrders;
