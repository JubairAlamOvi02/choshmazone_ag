import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AdminLayout.css'; // We will create this

const AdminLayout = () => {
    const { signOut, user } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await signOut();
        navigate('/');
    };

    return (
        <div className="admin-layout">
            <aside className="admin-sidebar">
                <div className="admin-logo">
                    <h2>Admin Panel</h2>
                </div>
                <nav className="admin-nav">
                    <Link to="/admin/dashboard" className="admin-nav-link">Dashboard</Link>
                    <Link to="/admin/products" className="admin-nav-link">Products</Link>
                    <Link to="/admin/orders" className="admin-nav-link">Orders</Link>
                    <Link to="/admin/customers" className="admin-nav-link">Customers</Link>
                </nav>
                <div className="admin-user-info">
                    <span>{user?.email}</span>
                    <button onClick={handleLogout} className="logout-btn">Logout</button>
                </div>
            </aside>
            <main className="admin-content">
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;
