import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShoppingBag, Menu, X, User, Search, Heart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import SearchBar from './SearchBar';

const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const { toggleCart, cartCount } = useCart();
    const { user, isAdmin, signOut } = useAuth();
    const { wishlist } = useWishlist();
    const navigate = useNavigate();

    const handleLogout = async () => {
        setIsProfileOpen(false);
        await signOut();
    };

    return (
        <nav className="sticky top-0 z-50 bg-white/50 backdrop-blur-md border-b border-border py-3 md:py-4">
            <div className="container mx-auto flex items-center justify-between gap-2 px-4">
                {/* Mobile Menu Button */}
                <button
                    className="flex md:hidden items-center justify-center p-2 -ml-2 shrink-0 text-text-main"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    aria-label="Toggle menu"
                >
                    {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>

                {/* Logo */}
                <div className="shrink overflow-hidden">
                    <Link to="/" className="no-underline text-inherit">
                        <h1 className="font-outfit font-bold text-base md:text-2xl tracking-wider text-text-main uppercase whitespace-nowrap overflow-hidden text-ellipsis">
                            Choshma Zone
                        </h1>
                    </Link>
                </div>

                {/* Desktop Navigation */}
                <div className={`
                        fixed md:static top-[60px] md:top-auto left-0 w-full md:w-auto h-[calc(100vh-60px)] md:h-auto
                        bg-white md:bg-transparent flex flex-col md:flex-row md:items-center p-8 md:p-0 gap-8 md:gap-10
                        border-t md:border-t-0 border-border z-40 overflow-y-auto md:overflow-visible transition-transform duration-300 ease-in-out
                        ${isMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                    `}>
                    <Link to="/shop" className="font-outfit font-medium text-xl md:text-sm uppercase tracking-widest text-text-main hover:text-secondary border-b md:border-b-0 border-background-alt py-2 md:py-0 transition-colors" onClick={() => setIsMenuOpen(false)}>Shop</Link>
                    <Link to="/collections" className="font-outfit font-medium text-xl md:text-sm uppercase tracking-widest text-text-main hover:text-secondary border-b md:border-b-0 border-background-alt py-2 md:py-0 transition-colors" onClick={() => setIsMenuOpen(false)}>Collections</Link>
                    <Link to="/about" className="font-outfit font-medium text-xl md:text-sm uppercase tracking-widest text-text-main hover:text-secondary border-b md:border-b-0 border-background-alt py-2 md:py-0 transition-colors" onClick={() => setIsMenuOpen(false)}>About</Link>
                    <Link to="/contact" className="font-outfit font-medium text-xl md:text-sm uppercase tracking-widest text-text-main hover:text-secondary border-b md:border-b-0 border-background-alt py-2 md:py-0 transition-colors" onClick={() => setIsMenuOpen(false)}>Contact</Link>
                </div>

                {/* Actions */}
                <div className="flex items-center shrink-0 min-w-[120px] justify-end">
                    {/* Search Bar Component */}
                    <SearchBar />

                    <div className="relative flex items-center shrink-0 z-10">
                        {user ? (
                            <div className="flex items-center shrink-0">
                                <button
                                    className="flex items-center justify-center p-2 text-text-main rounded-full hover:bg-black/5 transition-colors shrink-0 min-w-[40px] min-h-[40px]"
                                    aria-label="Account"
                                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                                >
                                    <User size={20} />
                                </button>
                                {isProfileOpen && (
                                    <div className="absolute right-0 top-[calc(100%+0.5rem)] bg-white min-w-[200px] shadow-lg rounded-lg z-[1000] py-2 border border-border">
                                        <span className="block px-4 py-3 text-sm text-text-muted border-b border-border mb-2">{user.email}</span>
                                        {isAdmin && (
                                            <Link to="/admin/dashboard" className="block px-4 py-2 text-text-main no-underline text-sm hover:bg-background-alt transition-colors" onClick={() => setIsProfileOpen(false)}>Admin Dashboard</Link>
                                        )}
                                        <Link to="/profile" className="block px-4 py-2 text-text-main no-underline text-sm hover:bg-background-alt transition-colors" onClick={() => setIsProfileOpen(false)}>My Profile</Link>
                                        <Link to="/profile" className="block px-4 py-2 text-text-main no-underline text-sm hover:bg-background-alt transition-colors" onClick={() => setIsProfileOpen(false)}>My Profile</Link>
                                        <Link to="/wishlist" className="block px-4 py-2 text-text-main no-underline text-sm hover:bg-background-alt transition-colors" onClick={() => setIsProfileOpen(false)}>My Wishlist</Link>
                                        <Link to="/orders" className="block px-4 py-2 text-text-main no-underline text-sm hover:bg-background-alt transition-colors" onClick={() => setIsProfileOpen(false)}>My Orders</Link>
                                        <button
                                            onClick={handleLogout}
                                            className="w-full text-left px-4 py-3 mt-2 border-t border-border text-error text-sm font-medium hover:bg-red-50 transition-colors"
                                        >
                                            Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Link to="/login" className="flex items-center justify-center p-2 text-text-main rounded-full hover:bg-black/5 transition-colors shrink-0 min-w-[40px] min-h-[40px]" aria-label="Login">
                                <User size={20} />
                            </Link>
                        )}
                    </div>

                    <button className="relative flex items-center justify-center p-2 text-text-main rounded-full hover:bg-black/5 transition-colors shrink-0 min-w-[40px] min-h-[40px]" aria-label="Cart" onClick={toggleCart}>
                        <ShoppingBag size={20} />
                        {cartCount > 0 && <span className="absolute top-0 right-0 bg-primary text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold pointer-events-none">{cartCount}</span>}
                    </button>

                    <Link to="/wishlist" className="relative flex items-center justify-center p-2 text-text-main rounded-full hover:bg-black/5 transition-colors shrink-0 min-w-[40px] min-h-[40px]" aria-label="Wishlist">
                        <Heart size={20} />
                        {wishlist.length > 0 && <span className="absolute top-0 right-0 bg-secondary text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold pointer-events-none">{wishlist.length}</span>}
                    </Link>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
