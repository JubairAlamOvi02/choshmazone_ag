import React, { useState, useEffect, useRef } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
    Menu, X, LayoutDashboard, Box, ShoppingCart, Users, LogOut, Bell, 
    Search, Settings, Glasses, Image as ImageIcon, Facebook, Tags, 
    Activity, Volume2, VolumeX, Sparkles, Check, ExternalLink, Play
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { 
    playChaChingSound, 
    vibratePhone, 
    notifyNewOrder, 
    unlockAudio, 
    requestNotificationPermission, 
    isNotificationPermissionGranted 
} from '../lib/orderSoundNotifier';

const AdminNavLink = ({ to, icon: Icon, label, isActive, onClick }) => (
    <Link
        to={to}
        onClick={onClick}
        className={`
            flex items-center gap-3 px-6 py-4 text-sm font-bold transition-all duration-300 group
            ${isActive
                ? 'bg-primary/10 text-primary border-r-4 border-primary'
                : 'text-text-muted hover:bg-gray-50 hover:text-text-main'}
            font-outfit uppercase tracking-widest
        `}
    >
        <Icon size={20} className={`${isActive ? 'text-primary' : 'text-text-muted group-hover:text-text-main'} transition-colors`} />
        {label}
    </Link>
);

const AdminLayout = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { signOut, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Sound & Notification Alert States
    const [soundEnabled, setSoundEnabled] = useState(() => {
        return localStorage.getItem('admin_order_sound') !== 'false';
    });
    const [notifPermission, setNotifPermission] = useState(() => {
        return typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'denied';
    });
    const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);
    const [recentAlerts, setRecentAlerts] = useState([]);
    const [activeToast, setActiveToast] = useState(null);
    const [unreadCount, setUnreadCount] = useState(0);

    const dropdownRef = useRef(null);

    // Auto-unlock Web Audio on first user interaction
    useEffect(() => {
        unlockAudio();
    }, []);

    // Listen outside clicks to close notification dropdown
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsNotifDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Supabase Real-time Order Listener
    useEffect(() => {
        const channel = supabase
            .channel('admin_realtime_orders_layout')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'orders' },
                (payload) => {
                    const newOrder = payload.new;
                    console.log('⚡ [Realtime] New order received in Admin Layout:', newOrder);

                    // 1. Play "Cha-Ching!" cash register chime
                    if (soundEnabled) {
                        playChaChingSound();
                    }

                    // 2. Vibrate phone
                    vibratePhone();

                    // 3. System Push / Browser Notification
                    notifyNewOrder(newOrder);

                    // 4. Update UI state & popup toast
                    setActiveToast(newOrder);
                    setUnreadCount((c) => c + 1);
                    setRecentAlerts((prev) => [
                        { ...newOrder, receivedAt: new Date() },
                        ...prev.slice(0, 19)
                    ]);

                    // Auto dismiss popup after 9 seconds
                    setTimeout(() => {
                        setActiveToast((cur) => (cur?.id === newOrder?.id ? null : cur));
                    }, 9000);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [soundEnabled]);

    const handleToggleSound = () => {
        const next = !soundEnabled;
        setSoundEnabled(next);
        localStorage.setItem('admin_order_sound', String(next));
        if (next) {
            playChaChingSound();
        }
    };

    const handleRequestPermission = async () => {
        const perm = await requestNotificationPermission();
        setNotifPermission(perm);
        if (perm === 'granted') {
            vibratePhone();
            playChaChingSound();
            alert('Push notifications enabled! You will now receive order alerts.');
        }
    };

    const handleTestChaChing = (e) => {
        e?.stopPropagation?.();
        playChaChingSound();
        vibratePhone();

        const fakeOrder = {
            id: 'TEST-' + Math.floor(1000 + Math.random() * 9000),
            total_amount: 1850,
            customer_name: 'Test Customer',
            created_at: new Date().toISOString()
        };

        setActiveToast(fakeOrder);
        setRecentAlerts((prev) => [
            { ...fakeOrder, receivedAt: new Date() },
            ...prev.slice(0, 19)
        ]);
        setUnreadCount((c) => c + 1);

        setTimeout(() => {
            setActiveToast((cur) => (cur?.id === fakeOrder.id ? null : cur));
        }, 6000);
    };

    const handleLogout = async () => {
        await signOut();
        navigate('/');
    };

    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
    const closeMobileMenu = () => setIsMobileMenuOpen(false);

    const isActive = (path) => location.pathname === path;

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
                            <span className="text-xl font-bold font-outfit text-text-main tracking-tighter">
                                CHOSHMA<span className="text-primary tracking-normal uppercase text-xs ml-1">Admin</span>
                            </span>
                        </Link>
                    </div>

                    <nav className="flex-1 space-y-2 overflow-y-auto">
                        <AdminNavLink to="/admin/dashboard" icon={LayoutDashboard} label="Dashboard" isActive={isActive('/admin/dashboard')} onClick={closeMobileMenu} />
                        <AdminNavLink to="/admin/orders" icon={ShoppingCart} label="Orders" isActive={isActive('/admin/orders')} onClick={closeMobileMenu} />
                        <AdminNavLink to="/admin/web-logs" icon={Activity} label="Web Logs & Funnel" isActive={isActive('/admin/web-logs')} onClick={closeMobileMenu} />
                        <AdminNavLink to="/admin/products" icon={Box} label="Inventory" isActive={isActive('/admin/products')} onClick={closeMobileMenu} />
                        <AdminNavLink to="/admin/categories" icon={Tags} label="Categories" isActive={isActive('/admin/categories')} onClick={closeMobileMenu} />
                        <AdminNavLink to="/admin/lenses" icon={Glasses} label="Lens Packages" isActive={isActive('/admin/lenses')} onClick={closeMobileMenu} />
                        <AdminNavLink to="/admin/media" icon={ImageIcon} label="Media" isActive={isActive('/admin/media')} onClick={closeMobileMenu} />
                        <AdminNavLink to="/admin/customers" icon={Users} label="Members" isActive={isActive('/admin/customers')} onClick={closeMobileMenu} />
                        <AdminNavLink to="/admin/facebook-catalog" icon={Facebook} label="FB Catalog" isActive={isActive('/admin/facebook-catalog')} onClick={closeMobileMenu} />
                        <AdminNavLink to="/admin/settings" icon={Settings} label="Checkout Form" isActive={isActive('/admin/settings')} onClick={closeMobileMenu} />
                    </nav>

                    <div className="p-8 border-t border-border">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-text-muted">
                                <Users size={20} />
                            </div>
                            <div className="flex flex-col truncate">
                                <span className="text-xs font-bold text-text-main font-outfit truncate uppercase tracking-wider">
                                    {user?.email?.split('@')[0]}
                                </span>
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
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                {/* Floating Real-time Order Popup Banner */}
                {activeToast && (
                    <div className="fixed top-4 right-4 left-4 sm:left-auto sm:w-96 z-50 animate-in slide-in-from-top-6 duration-300">
                        <div className="bg-slate-900 border-2 border-amber-400 text-white rounded-2xl p-4 shadow-2xl flex items-start gap-3 backdrop-blur-lg">
                            <div className="w-11 h-11 bg-amber-400 text-slate-950 rounded-xl flex items-center justify-center shrink-0 font-black text-lg animate-bounce">
                                💰
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-xs font-bold uppercase tracking-widest text-amber-400 flex items-center gap-1">
                                        <Sparkles size={12} /> Kaching! New Order
                                    </span>
                                    <button 
                                        onClick={() => setActiveToast(null)}
                                        className="text-slate-400 hover:text-white p-1 rounded-md"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                                <p className="font-bold font-outfit text-white text-base truncate mt-0.5">
                                    ৳{Number(activeToast.total_amount || 0).toLocaleString()}
                                </p>
                                <p className="text-xs text-slate-300 truncate">
                                    {activeToast.customer_name || 'Customer'} • Order #{String(activeToast.id).slice(0, 8)}
                                </p>
                                <button
                                    onClick={() => {
                                        setActiveToast(null);
                                        navigate('/admin/orders');
                                    }}
                                    className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-400 text-slate-950 font-bold rounded-lg text-xs hover:bg-amber-300 transition-colors uppercase tracking-wider font-outfit"
                                >
                                    <span>View Order</span>
                                    <ExternalLink size={12} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

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

                    <div className="flex items-center gap-2 sm:gap-4">
                        {/* Quick Sound Toggle Button */}
                        <button 
                            onClick={handleToggleSound}
                            title={soundEnabled ? 'Order Cha-Ching sound enabled (Click to mute)' : 'Order sound muted (Click to enable)'}
                            className={`p-2.5 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-bold font-outfit ${
                                soundEnabled 
                                    ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100' 
                                    : 'bg-gray-100 border-gray-200 text-gray-500 hover:bg-gray-200'
                            }`}
                        >
                            {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                            <span className="hidden md:inline">{soundEnabled ? 'Chime ON' : 'Muted'}</span>
                        </button>

                        {/* Notifications Bell Dropdown */}
                        <div className="relative" ref={dropdownRef}>
                            <button 
                                onClick={() => {
                                    setIsNotifDropdownOpen(!isNotifDropdownOpen);
                                    setUnreadCount(0);
                                }}
                                className="relative p-2.5 text-text-muted hover:bg-gray-100 rounded-xl transition-colors border border-border bg-white"
                                title="Order Alerts & Sounds"
                            >
                                <Bell size={18} />
                                {unreadCount > 0 ? (
                                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-amber-500 text-white text-[10px] font-black rounded-full flex items-center justify-center animate-pulse shadow-sm">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                ) : (
                                    <span className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full"></span>
                                )}
                            </button>

                            {/* Dropdown Menu */}
                            {isNotifDropdownOpen && (
                                <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white border border-border rounded-2xl shadow-2xl z-50 p-4 animate-in fade-in duration-200">
                                    <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold font-outfit text-text-main uppercase tracking-wider">Order Alerts</span>
                                            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[10px] font-bold">LIVE</span>
                                        </div>
                                        <button
                                            onClick={handleTestChaChing}
                                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg text-xs font-bold font-outfit transition-colors cursor-pointer"
                                            title="Test the Cash Register (Kaching) sound and vibration"
                                        >
                                            <Play size={12} className="fill-amber-900" />
                                            <span>Test Kaching</span>
                                        </button>
                                    </div>

                                    {/* Permission Status */}
                                    <div className="bg-gray-50 border border-border rounded-xl p-3 mb-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-text-main font-outfit">Phone Push Notifications</span>
                                                <span className="text-[10px] text-text-muted">
                                                    Status: {notifPermission === 'granted' ? 'Active' : notifPermission === 'denied' ? 'Blocked in Browser' : 'Not Enabled'}
                                                </span>
                                            </div>
                                            {notifPermission === 'granted' ? (
                                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md">
                                                    <Check size={12} /> Active
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={handleRequestPermission}
                                                    className="px-2.5 py-1 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary-dark transition-all font-outfit"
                                                >
                                                    Enable
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Recent Live Order Alerts */}
                                    <div>
                                        <div className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-2">Recent Live Orders</div>
                                        {recentAlerts.length === 0 ? (
                                            <div className="text-center py-6 text-xs text-text-muted">
                                                No incoming orders yet in this session.
                                                <br />
                                                <button
                                                    onClick={handleTestChaChing}
                                                    className="mt-2 text-primary font-bold hover:underline"
                                                >
                                                    Click here to simulate a test order
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                                                {recentAlerts.map((order, idx) => (
                                                    <div 
                                                        key={order.id || idx}
                                                        onClick={() => {
                                                            setIsNotifDropdownOpen(false);
                                                            navigate('/admin/orders');
                                                        }}
                                                        className="p-2.5 bg-gray-50 hover:bg-amber-50/50 border border-border rounded-xl cursor-pointer transition-colors flex items-center justify-between gap-2"
                                                    >
                                                        <div className="truncate">
                                                            <div className="text-xs font-bold text-text-main truncate">
                                                                {order.customer_name || 'Customer'}
                                                            </div>
                                                            <div className="text-[10px] text-text-muted">
                                                                Order #{String(order.id).slice(0, 8)}
                                                            </div>
                                                        </div>
                                                        <div className="text-right shrink-0">
                                                            <div className="text-xs font-bold text-primary font-outfit">
                                                                ৳{Number(order.total_amount || 0).toLocaleString()}
                                                            </div>
                                                            <div className="text-[9px] text-text-muted">
                                                                {order.receivedAt ? order.receivedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-3 border-t border-border mt-3 text-center">
                                        <Link 
                                            to="/admin/orders" 
                                            onClick={() => setIsNotifDropdownOpen(false)}
                                            className="text-xs font-bold text-primary hover:underline font-outfit uppercase tracking-wider"
                                        >
                                            View All Orders →
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>

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
