
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

const Dashboard = () => {
    const [stats, setStats] = useState({
        totalSales: 0,
        ordersCount: 0,
        productsCount: 0,
        pendingOrders: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);

            // 1. Fetch Orders and calculate Sales
            const { data: orders, error: ordersError } = await supabase
                .from('orders')
                .select('total_amount, status');

            if (ordersError) throw ordersError;

            const totalSales = orders.reduce((sum, order) => sum + Number(order.total_amount), 0);
            const pendingOrders = orders.filter(o => o.status === 'pending').length;

            // 2. Fetch Products count
            const { count: productsCount, error: productsError } = await supabase
                .from('products')
                .select('*', { count: 'exact', head: true });

            if (productsError) throw productsError;

            setStats({
                totalSales,
                ordersCount: orders.length,
                productsCount: productsCount || 0,
                pendingOrders
            });

        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div>Loading dashboard stats...</div>;

    return (
        <div className="admin-dashboard">
            <h1>Dashboard Overview</h1>
            <p>Real-time updates from your database.</p>

            <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
                <div className="stat-card" style={{ padding: '1.5rem', background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ color: '#666', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Total Sales</h3>
                    <p style={{ fontSize: '1.75rem', fontWeight: 'bold', margin: 0 }}>৳{stats.totalSales.toFixed(2)}</p>
                </div>

                <div className="stat-card" style={{ padding: '1.5rem', background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ color: '#666', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Total Orders</h3>
                    <p style={{ fontSize: '1.75rem', fontWeight: 'bold', margin: 0 }}>{stats.ordersCount}</p>
                </div>

                <div className="stat-card" style={{ padding: '1.5rem', background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ color: '#666', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Pending Orders</h3>
                    <p style={{ fontSize: '1.75rem', fontWeight: 'bold', margin: 0, color: stats.pendingOrders > 0 ? '#ffc107' : 'inherit' }}>
                        {stats.pendingOrders}
                    </p>
                </div>

                <div className="stat-card" style={{ padding: '1.5rem', background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ color: '#666', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Active Products</h3>
                    <p style={{ fontSize: '1.75rem', fontWeight: 'bold', margin: 0 }}>{stats.productsCount}</p>
                </div>
            </div>

            <div style={{ marginTop: '3rem', display: 'flex', gap: '1rem' }}>
                <button
                    onClick={fetchStats}
                    style={{ padding: '0.5rem 1rem', background: '#333', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                    Refresh Data
                </button>
            </div>
        </div>
    );
};

export default Dashboard;
