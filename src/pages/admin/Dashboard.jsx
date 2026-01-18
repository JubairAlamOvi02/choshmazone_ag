import React from 'react';

const Dashboard = () => {
    return (
        <div className="admin-dashboard">
            <h1>Dashboard</h1>
            <p>Welcome to the Admin Panel.</p>

            <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
                <div className="stat-card" style={{ padding: '1.5rem', background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <h3>Total Sales</h3>
                    <p className="text-2xl font-bold">৳0.00</p>
                </div>
                <div className="stat-card" style={{ padding: '1.5rem', background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <h3>Orders</h3>
                    <p className="text-2xl font-bold">0</p>
                </div>
                <div className="stat-card" style={{ padding: '1.5rem', background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <h3>Products</h3>
                    <p className="text-2xl font-bold">0</p>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
