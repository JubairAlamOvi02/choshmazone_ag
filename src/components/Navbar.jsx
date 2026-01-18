import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShoppingBag, Search, Menu, X, User } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.svg';
import './Navbar.css';

const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const { toggleCart, cartCount } = useCart();
    const { user, isAdmin, signOut } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await signOut();
        setIsProfileOpen(false);
        navigate('/');
    };

    return (
        <nav className="navbar">
            <div className="container navbar-container">
                {/* Mobile Menu Button */}
                <button
                    className="navbar-toggle"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    aria-label="Toggle menu"
                >
                    {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>

                {/* Logo */}
                <div className="navbar-logo">
                    <Link to="/" className="logo-link">
                        <h1 className="logo-text">Choshma Zone</h1>
                    </Link>
                </div>

                {/* Desktop Navigation */}
                <div className={`navbar-links ${isMenuOpen ? 'active' : ''}`}>
                    <Link to="/shop" className="nav-link">Shop</Link>
                    <Link to="/collections" className="nav-link">Collections</Link>
                    <Link to="/about" className="nav-link">About</Link>
                    <Link to="/contact" className="nav-link">Contact</Link>
                </div>

                {/* Actions */}
                <div className="navbar-actions">
                    <button className="icon-btn" aria-label="Search">
                        <Search size={20} />
                    </button>
                    <div className="navbar-auth-dropdown">
                        {user ? (
                            <div className="auth-menu-container">
                                <button
                                    className="icon-btn"
                                    aria-label="Account"
                                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                                >
                                    <User size={20} />
                                </button>
                                {isProfileOpen && (
                                    <div className="auth-dropdown-content">
                                        <span className="user-email">{user.email}</span>
                                        {isAdmin && (
                                            <Link to="/admin/dashboard" className="dropdown-link" onClick={() => setIsProfileOpen(false)}>Admin Dashboard</Link>
                                        )}
                                        <Link to="/profile" className="dropdown-link" onClick={() => setIsProfileOpen(false)}>My Profile</Link>
                                        <Link to="/orders" className="dropdown-link" onClick={() => setIsProfileOpen(false)}>My Orders</Link>
                                        <button
                                            onClick={handleLogout}
                                            className="dropdown-link logout"
                                        >
                                            Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Link to="/login" className="icon-btn" aria-label="Login">
                                <User size={20} />
                            </Link>
                        )}
                    </div>
                    <button className="icon-btn cart-btn" aria-label="Cart" onClick={toggleCart}>
                        <ShoppingBag size={20} />
                        {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
