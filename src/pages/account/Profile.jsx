import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';

const UserProfile = () => {
    const { user, signOut } = useAuth();
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

    if (loading) return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading profile...</div>;

    return (
        <div style={{ maxWidth: '600px', margin: '2rem auto', padding: '1rem' }}>
            <h1 style={{ marginBottom: '2rem' }}>My Profile</h1>

            <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', color: '#666', marginBottom: '0.5rem' }}>Email</label>
                    <div style={{ fontSize: '1.1rem', fontWeight: '500' }}>{user?.email}</div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', color: '#666', marginBottom: '0.5rem' }}>Full Name</label>
                    <div style={{ fontSize: '1.1rem', fontWeight: '500' }}>{profile?.full_name || 'Not set'}</div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', color: '#666', marginBottom: '0.5rem' }}>Role</label>
                    <div style={{ fontSize: '1.1rem', fontWeight: '500', textTransform: 'capitalize' }}>{profile?.role || 'Customer'}</div>
                </div>

                <div style={{ borderTop: '1px solid #eee', paddingTop: '1.5rem', marginTop: '2rem' }}>
                    <button
                        onClick={signOut}
                        style={{ background: '#d32f2f', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        Sign Out
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserProfile;
