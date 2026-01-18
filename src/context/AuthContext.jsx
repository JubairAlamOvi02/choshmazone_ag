import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null); // 'admin' | 'customer' | null
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check active session
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();

            if (session?.user) {
                setUser(session.user);
                await fetchUserRole(session.user.id);
            } else {
                setUser(null);
                setRole(null);
            }
            setLoading(false);
        };

        getSession();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session?.user) {
                setUser(session.user);
                await fetchUserRole(session.user.id);
            } else {
                setUser(null);
                setRole(null);
            }
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchUserRole = async (userId) => {
        try {
            // Query the 'profiles' table for role
            // Note: This table needs to be created in Supabase
            const { data, error } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', userId)
                .single();

            if (error) {
                console.error('Error fetching role:', error);
                // Default to customer if profile missing/error
                setRole('customer');
            } else {
                setRole(data?.role || 'customer');
            }
        } catch (err) {
            console.error("Unexpected error fetching role:", err);
            setRole('customer');
        }
    };

    const signIn = async (email, password) => {
        return supabase.auth.signInWithPassword({ email, password });
    };

    const signUp = async (email, password, metadata = {}) => {
        return supabase.auth.signUp({
            email,
            password,
            options: {
                data: metadata, // e.g. full_name
            },
        });
    };

    const signOut = async () => {
        return supabase.auth.signOut();
    };

    const value = {
        user,
        role,
        isAdmin: role === 'admin',
        signIn,
        signUp,
        signOut,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
