import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Search, Menu, X, User } from 'lucide-react';
import { useCart } from '../context/CartContext';
import logo from '../assets/logo.svg';
import './Navbar.css';

const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { toggleCart, cartCount } = useCart();

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
                    <button className="icon-btn" aria-label="Account">
                        <User size={20} />
                    </button>
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
