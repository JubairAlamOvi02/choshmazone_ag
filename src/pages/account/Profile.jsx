import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { User, Mail, Shield, LogOut, Settings } from 'lucide-react';

const UserProfile = () => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            getProfile();
        }
    }, [user]);

    const getProfile = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            setProfile(data);
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSignOut = async () => {
        await signOut();
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />
            <main className="flex-1 container mx-auto px-4 py-12 md:py-20">
                <div className="max-w-2xl mx-auto">
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                                <User size={32} />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-text-main font-outfit uppercase tracking-wider">Account Settings</h1>
                                <p className="text-text-muted text-sm font-outfit">Manage your personal information</p>
                            </div>
                        </div>
                        <button className="p-3 bg-white border border-border rounded-xl hover:bg-gray-50 transition-colors">
                            <Settings size={20} className="text-text-muted" />
                        </button>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-3xl border border-border/50 shadow-xl shadow-black/5 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="p-8 md:p-12 space-y-10">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-text-muted mb-2">
                                            <Mail size={16} />
                                            <span className="text-xs font-bold uppercase tracking-widest font-outfit">Email Address</span>
                                        </div>
                                        <p className="text-lg font-bold text-text-main font-outfit truncate">{user?.email}</p>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-text-muted mb-2">
                                            <User size={16} />
                                            <span className="text-xs font-bold uppercase tracking-widest font-outfit">Full Name</span>
                                        </div>
                                        <p className="text-lg font-bold text-text-main font-outfit">{profile?.full_name || 'Not provided'}</p>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-text-muted mb-2">
                                            <Shield size={16} />
                                            <span className="text-xs font-bold uppercase tracking-widest font-outfit">Account Role</span>
                                        </div>
                                        <p className="inline-flex items-center px-3 py-1 bg-secondary/10 text-secondary rounded-full text-sm font-bold uppercase tracking-wider font-outfit">
                                            {profile?.role || 'Customer'}
                                        </p>
                                    </div>
                                </div>

                                <div className="pt-10 border-t border-border mt-10">
                                    <button
                                        onClick={handleSignOut}
                                        className="flex items-center gap-3 px-8 py-4 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-all font-outfit uppercase tracking-widest"
                                    >
                                        <LogOut size={18} />
                                        Sign Out Account
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default UserProfile;
