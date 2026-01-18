import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { Link } from 'react-router-dom';

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

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading orders...</div>;

    return (
        <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '1rem' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>My Orders</h1>
            {orders.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', background: '#f9f9f9', borderRadius: '8px' }}>
                    <p style={{ marginBottom: '1rem' }}>You haven't placed any orders yet.</p>
                    <Link to="/shop" style={{ textDecoration: 'none', background: '#333', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '4px' }}>
                        Start Shopping
                    </Link>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    {orders.map(order => (
                        <div key={order.id} style={{ border: '1px solid #eee', borderRadius: '8px', padding: '1.5rem', background: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>
                                <div>
                                    <span style={{ fontWeight: 'bold' }}>#{order.id.slice(0, 8)}</span>
                                    <span style={{ marginLeft: '1rem', color: '#666', fontSize: '0.9rem' }}>
                                        {new Date(order.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <span style={{
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: '999px',
                                    fontSize: '0.85rem',
                                    background: order.status === 'completed' ? '#e6f4ea' : '#fff8e1',
                                    color: order.status === 'completed' ? '#1e7e34' : '#f57c00'
                                }}>
                                    {order.status.toUpperCase()}
                                </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <p style={{ margin: 0, color: '#666' }}>Quantity: {order.payment_details?.items?.length || 'N/A'}</p>
                                    <p style={{ margin: 0, color: '#666' }}>Payment: {order.payment_method}</p>
                                </div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                                    ৳{order.total_amount}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default UserOrders;
