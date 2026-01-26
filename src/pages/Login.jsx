import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { signIn, user, signOut, isAdmin } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Only show the "Already Logged In" screen for Admins
    if (user && isAdmin) {
        return (
            <div className="min-h-screen bg-white flex flex-col">
                <Navbar />
                <main className="flex-1 flex items-center justify-center p-4 py-12 bg-gray-50">
                    <div className="bg-white p-8 md:p-12 rounded-2xl shadow-xl w-full max-w-[480px] text-center border border-border/50">
                        <div className="text-center mb-10">
                            <h2 className="text-3xl font-bold mb-2 text-text-main font-outfit uppercase tracking-wider">Admin Session Active</h2>
                            <p className="text-text-muted font-outfit">You are currently logged in as:</p>
                            <p className="text-text-main font-bold mt-2 font-mono">{user.email}</p>
                        </div>

                        <div className="space-y-4">
                            <button
                                onClick={() => navigate('/admin/dashboard')}
                                className="w-full py-4 bg-primary text-white font-bold rounded-lg hover:bg-primary/95 transition-all font-outfit uppercase tracking-widest"
                            >
                                Go to Admin Dashboard
                            </button>
                            <button
                                onClick={() => {
                                    signOut();
                                    // Force reload backup in case signOut hangs
                                    setTimeout(() => window.location.href = '/', 1000);
                                }}
                                className="w-full py-4 border border-border text-text-main font-bold rounded-lg hover:bg-red-50 hover:text-error hover:border-red-100 transition-all font-outfit uppercase tracking-widest"
                            >
                                Log Out
                            </button>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    // Auto-redirect customers to home if they are already logged in
    if (user && !isAdmin) {
        // Use a short timeout to ensure state is settled or allow a brief flash if preferred, 
        // but typically direct return/navigate is better. 
        // However, since we can't 'return' a navigate side-effect easily in render without useEffect,
        // we'll just return null and navigate in a useEffect, OR just let them see the form if that's preferred.
        // Given your request "commented out code for customer", I'll just let them fall through to the form 
        // so they can switch accounts if they want, or use the navbar.
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const { error, userRole } = await signIn(email, password);
            if (error) throw error;

            // Role-based redirection - Master Override for Ovi
            if (userRole === 'admin' || email.toLowerCase().trim() === 'ovi.extra@gmail.com') {
                navigate('/admin/dashboard', { replace: true });
            } else {
                // Default to home page if no history
                const from = location.state?.from?.pathname || "/";

                // If the user was trying to go to login, send them to home instead to avoid loops
                const target = from === "/login" ? "/" : from;
                navigate(target, { replace: true });
            }
        } catch (err) {
            setError(err.message || 'Failed to login');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex flex-col">
            <Navbar />
            <main className="flex-1 flex items-center justify-center p-4 py-12 bg-gray-50">
                <div className="bg-white p-8 md:p-12 rounded-2xl shadow-xl w-full max-w-[480px] animate-in slide-in-from-bottom-4 duration-500 border border-border/50">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-bold mb-2 text-text-main font-outfit uppercase tracking-wider">Welcome Back</h2>
                        <p className="text-text-muted font-outfit">Login to your Choshma Zone account</p>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-8 text-sm text-center border border-red-100 font-outfit animate-in fade-in duration-300">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-text-main uppercase tracking-[0.2em] font-outfit">
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="Enter your email"
                                className="w-full px-4 py-3.5 rounded-lg border border-border focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all font-outfit text-text-main placeholder:text-text-muted/50"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-text-main uppercase tracking-[0.2em] font-outfit">
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="Enter your password"
                                className="w-full px-4 py-3.5 rounded-lg border border-border focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all font-outfit text-text-main placeholder:text-text-muted/50"
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full py-4 bg-primary text-white font-bold rounded-lg hover:bg-primary/95 hover:-translate-y-0.5 transition-all duration-300 font-outfit uppercase tracking-widest disabled:opacity-50 disabled:translate-y-0 shadow-lg shadow-black/10 mt-4"
                            disabled={loading}
                        >
                            {loading ? 'Authenticating...' : 'Sign In'}
                        </button>
                    </form>

                    <div className="mt-10 pt-8 border-t border-border text-center">
                        <p className="text-text-muted font-outfit">
                            Don't have an account? {' '}
                            <Link to="/register" className="text-text-main font-bold hover:text-secondary transition-colors underline decoration-2 underline-offset-4">
                                Create Account
                            </Link>
                        </p>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Login;
