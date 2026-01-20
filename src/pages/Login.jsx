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
    const { signIn } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const { error } = await signIn(email, password);
            if (error) throw error;

            const from = location.state?.from?.pathname || "/";
            navigate(from, { replace: true });
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
