import React from 'react';
import { Facebook, Instagram, Music2 as Tiktok } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="bg-primary text-white py-16 md:py-20 mt-auto">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
                    {/* Brand Column */}
                    <div className="lg:col-span-2">
                        <h3 className="text-xl md:text-2xl font-bold mb-4 tracking-widest font-outfit uppercase">
                            Choshma Zone
                        </h3>
                        <p className="text-gray-400 text-sm mb-6 max-w-[320px] font-outfit leading-relaxed">
                            Premium eyewear for the modern visionary.
                            Designed for style, engineered for performance.
                        </p>
                        <div className="flex gap-6">
                            <a href="https://www.instagram.com/choshmazone" className="text-white/70 hover:text-white transition-colors" aria-label="Instagram">
                                <Instagram size={24} />
                            </a>
                            <a href="https://www.facebook.com/profile.php?id=100066797659136" className="text-white/70 hover:text-white transition-colors" aria-label="Facebook">
                                <Facebook size={24} />
                            </a>
                            <a href="https://www.tiktok.com/@choshma.zone?_t=ZS-93COQHamGZd" className="text-white/70 hover:text-white transition-colors" aria-label="TikTok">
                                <Tiktok size={24} />
                            </a>
                        </div>
                    </div>

                    {/* Links Column */}
                    <div className="flex flex-col gap-4">
                        <h4 className="text-sm font-bold uppercase tracking-widest mb-2 font-outfit">Shop</h4>
                        <div className="flex flex-col gap-2 font-outfit">
                            <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">New Arrivals</a>
                            <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Best Sellers</a>
                            <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Men's Collection</a>
                            <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Women's Collection</a>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        <h4 className="text-sm font-bold uppercase tracking-widest mb-2 font-outfit">Support</h4>
                        <div className="flex flex-col gap-2 font-outfit">
                            <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Contact Us</a>
                            <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Shipping & Returns</a>
                            <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Order Tracking</a>
                            <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">FAQ</a>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        <h4 className="text-sm font-bold uppercase tracking-widest mb-2 font-outfit">Legal</h4>
                        <div className="flex flex-col gap-2 font-outfit">
                            <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Privacy Policy</a>
                            <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Terms of Service</a>
                            <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Cookie Policy</a>
                        </div>
                    </div>
                </div>

                <div className="border-t border-white/10 pt-8 text-center text-gray-500 text-xs font-outfit">
                    <p>&copy; {new Date().getFullYear()} Choshma Zone. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
