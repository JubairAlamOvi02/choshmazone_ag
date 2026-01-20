import React, { useState } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, LayoutDashboard, Box, ShoppingCart, Users, LogOut, Bell, Search, Settings, Glasses } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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

    const NavLink = ({ to, icon: Icon, label }) => (
        <Link
            to={to}
            onClick={closeMobileMenu}
            className={`
                flex items-center gap-3 px-6 py-4 text-sm font-bold transition-all duration-300 group
                ${isActive(to)
                    ? 'bg-primary/10 text-primary border-r-4 border-primary'
                    : 'text-text-muted hover:bg-gray-50 hover:text-text-main'}
                font-outfit uppercase tracking-widest
            `}
        >
            <Icon size={20} className={`${isActive(to) ? 'text-primary' : 'text-text-muted group-hover:text-text-main'} transition-colors`} />
            {label}
        </Link>
    );

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar Desktop */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-border transform transition-transform duration-300 lg:translate-x-0 lg:static lg:block
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="flex flex-col h-full">
                    <div className="p-8 border-b border-border mb-6">
                        <Link to="/" className="flex items-center gap-2 group">
                            <div className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:rotate-12 transition-transform">
                                <Glasses size={24} />
                            </div>
                            <span className="text-xl font-bold font-outfit text-text-main tracking-tighter">CHOSHMA<span className="text-primary tracking-normal uppercase text-xs ml-1">Admin</span></span>
                        </Link>
                    </div>

                    <nav className="flex-1 space-y-2">
                        <NavLink to="/admin/dashboard" icon={LayoutDashboard} label="Dashboard" />
                        <NavLink to="/admin/products" icon={Box} label="Inventory" />
                        <NavLink to="/admin/orders" icon={ShoppingCart} label="Orders" />
                        <NavLink to="/admin/customers" icon={Users} label="Members" />
                    </nav>

                    <div className="p-8 border-t border-border">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-text-muted">
                                <Users size={20} />
                            </div>
                            <div className="flex flex-col truncate">
                                <span className="text-xs font-bold text-text-main font-outfit truncate uppercase tracking-wider">{user?.email?.split('@')[0]}</span>
                                <span className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Master Admin</span>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-all font-outfit uppercase tracking-widest text-xs"
                        >
                            <LogOut size={16} /> Sign Out
                        </button>
                    </div>
                </div>
            </aside>

            {/* Overlay for mobile menu */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
                    onClick={closeMobileMenu}
                ></div>
            )}

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Header */}
                <header className="h-20 bg-white border-b border-border flex items-center justify-between px-6 lg:px-12 sticky top-0 z-30">
                    <div className="flex items-center gap-4">
                        <button
                            className="lg:hidden p-2 text-text-muted hover:bg-gray-100 rounded-lg"
                            onClick={toggleMobileMenu}
                        >
                            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                        <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-gray-50 border border-border rounded-xl">
                            <Search size={18} className="text-text-muted" />
                            <input
                                type="text"
                                placeholder="Global Search..."
                                className="bg-transparent border-none outline-none text-sm font-outfit w-40 md:w-64"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3 md:gap-6">
                        <button className="relative p-2 text-text-muted hover:bg-gray-100 rounded-lg transition-colors">
                            <Bell size={20} />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-white"></span>
                        </button>
                        <button className="p-2 text-text-muted hover:bg-gray-100 rounded-lg transition-colors">
                            <Settings size={20} />
                        </button>
                        <div className="w-px h-8 bg-border hidden md:block"></div>
                        <div className="hidden md:flex flex-col items-end">
                            <span className="text-xs font-bold text-text-main font-outfit uppercase tracking-tight">Active Session</span>
                            <span className="text-[10px] text-green-500 font-bold uppercase tracking-widest flex items-center gap-1">
                                <span className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></span> Authorized
                            </span>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-6 lg:p-12">
                    <div className="container mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
