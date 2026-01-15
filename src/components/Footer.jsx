import React from 'react';
import { Facebook, Instagram, Twitter } from 'lucide-react';
import './Footer.css';

const Footer = () => {
    return (
        <footer className="footer">
            <div className="container">
                <div className="footer-grid">
                    {/* Brand Column */}
                    <div className="footer-brand">
                        <h3 className="footer-heading">Choshma Zone</h3>
                        <p className="footer-text">
                            Premium eyewear for the modern visionary.
                            Designed for style, engineered for performance.
                        </p>
                        <div className="social-icons">
                            <a href="#" aria-label="Instagram"><Instagram size={20} /></a>
                            <a href="#" aria-label="Facebook"><Facebook size={20} /></a>
                            <a href="#" aria-label="Twitter"><Twitter size={20} /></a>
                        </div>
                    </div>

                    {/* Links Column */}
                    <div className="footer-links">
                        <h4 className="footer-subheading">Shop</h4>
                        <a href="#">New Arrivals</a>
                        <a href="#">Best Sellers</a>
                        <a href="#">Men</a>
                        <a href="#">Women</a>
                    </div>

                    <div className="footer-links">
                        <h4 className="footer-subheading">Support</h4>
                        <a href="#">Contact Us</a>
                        <a href="#">Shipping & Returns</a>
                        <a href="#">FAQ</a>
                        <a href="#">Size Guide</a>
                    </div>

                    <div className="footer-links">
                        <h4 className="footer-subheading">Legal</h4>
                        <a href="#">Privacy Policy</a>
                        <a href="#">Terms of Service</a>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p>&copy; {new Date().getFullYear()} Choshma Zone. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
