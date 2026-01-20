import React, { useState } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, LayoutDashboard, Box, ShoppingCart, Users, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './AdminLayout.css'; // We will create this

const AdminLayout = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { signOut, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = async () => {
        await signOut();
        navigate('/');
    };

    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
    const closeMobileMenu = () => setIsMobileMenuOpen(false);

    const isActive = (path) => location.pathname === path;

    return (
        <div className={`admin-layout ${isMobileMenuOpen ? 'mobile-menu-open' : ''}`}>
            {/* Mobile Header */}
            <header className="admin-mobile-header">
                <h2>Admin</h2>
                <button className="admin-menu-toggle" onClick={toggleMobileMenu}>
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </header>

            <aside className="admin-sidebar">
                <div className="admin-logo">
                    <h2>Admin Panel</h2>
                    <button className="admin-close-menu" onClick={closeMobileMenu}>
                        <X size={24} />
                    </button>
                </div>
                <nav className="admin-nav">
                    <Link to="/admin/dashboard" className={`admin-nav-link ${isActive('/admin/dashboard') ? 'active' : ''}`} onClick={closeMobileMenu}>
                        <LayoutDashboard size={20} /> Dashboard
                    </Link>
                    <Link to="/admin/products" className={`admin-nav-link ${isActive('/admin/products') ? 'active' : ''}`} onClick={closeMobileMenu}>
                        <Box size={20} /> Products
                    </Link>
                    <Link to="/admin/orders" className={`admin-nav-link ${isActive('/admin/orders') ? 'active' : ''}`} onClick={closeMobileMenu}>
                        <ShoppingCart size={20} /> Orders
                    </Link>
                    <Link to="/admin/customers" className={`admin-nav-link ${isActive('/admin/customers') ? 'active' : ''}`} onClick={closeMobileMenu}>
                        <Users size={20} /> Customers
                    </Link>
                </nav>
                <div className="admin-user-info">
                    <span className="user-email">{user?.email}</span>
                    <button onClick={handleLogout} className="logout-btn">
                        <LogOut size={18} /> Logout
                    </button>
                </div>
            </aside>
            <main className="admin-content">
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;
