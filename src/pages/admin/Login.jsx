import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, Lock, Mail } from 'lucide-react';

const AdminLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { signIn, user, isAdmin, signOut, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    if (user && isAdmin) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-white">
                <div className="bg-slate-900 border border-slate-800 p-8 md:p-12 rounded-3xl shadow-2xl w-full max-w-[440px] text-center">
                    <div className="w-16 h-16 bg-primary/20 text-primary rounded-2xl flex items-center justify-center mx-auto mb-6 border border-primary/30 animate-pulse">
                        <ShieldCheck size={32} />
                    </div>
                    <h2 className="text-2xl font-bold font-outfit uppercase tracking-[0.2em] mb-4">Portal Access Active</h2>
                    <p className="text-slate-400 text-sm mb-8 font-outfit uppercase tracking-widest opacity-60">
                        Logged in: <span className="text-white opacity-100">{user.email}</span>
                    </p>

                    <div className="space-y-4">
                        <button
                            onClick={() => navigate('/admin/dashboard')}
                            className="w-full py-4 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all font-outfit uppercase tracking-[0.2em]"
                        >
                            Open Dashboard
                        </button>
                        <button
                            onClick={async () => {
                                await signOut();
                                navigate('/admin/login');
                            }}
                            className="w-full py-4 border border-slate-800 text-slate-400 font-bold rounded-xl hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20 transition-all font-outfit uppercase tracking-[0.2em]"
                        >
                            Log Out & Switch
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const { error, userRole } = await signIn(email, password);
            if (error) throw error;

            if (userRole !== 'admin') {
                setError('Unauthorized. Only administrators are permitted to enter this console.');
                return;
            }

            const from = location.state?.from?.pathname || "/admin/dashboard";
            navigate(from, { replace: true });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(51,65,85,0.15)_0,transparent_70%)] pointer-events-none"></div>

            <div className="w-full max-w-[440px] relative z-10">
                <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-8 md:p-12 rounded-3xl shadow-2xl">
                    <div className="text-center mb-10">
                        <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-6 border border-primary/20">
                            <ShieldCheck size={32} />
                        </div>
                        <h2 className="text-2xl font-bold text-white font-outfit uppercase tracking-[0.2em]">Admin Portal</h2>
                        <p className="text-slate-400 text-sm mt-2 font-outfit uppercase tracking-widest opacity-60">Restricted Access</p>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl mb-8 text-sm text-center font-outfit animate-in fade-in zoom-in duration-300">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest font-outfit ml-1">
                                Admin Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="admin@choshmazone.com"
                                    className="w-full bg-slate-950 border border-slate-800 text-white pl-12 pr-4 py-4 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-outfit"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest font-outfit ml-1">
                                Security Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    placeholder="••••••••"
                                    className="w-full bg-slate-950 border border-slate-800 text-white pl-12 pr-4 py-4 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-outfit"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 font-outfit uppercase tracking-[0.2em] mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Verifying...' : 'Access Console'}
                        </button>
                    </form>
                </div>

                <p className="text-center mt-8 text-slate-600 text-xs font-outfit uppercase tracking-widest">
                    &copy; 2024 Choshma Zone Management System
                </p>
            </div>
        </div>
    );
};

export default AdminLogin;
