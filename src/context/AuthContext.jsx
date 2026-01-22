import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useToast } from './ToastContext';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

// Loading Spinner Component
const LoadingSpinner = () => (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-primary"></div>
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-8 w-8 rounded-full bg-white"></div>
            </div>
        </div>
        <p className="mt-4 text-gray-600 font-medium animate-pulse">Loading...</p>
    </div>
);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null); // 'admin' | 'customer' | null
    const [loading, setLoading] = useState(true);
    const [authError, setAuthError] = useState(null);
    const initializationComplete = useRef(false);
    const { showToast } = useToast();

    useEffect(() => {
        // Timeout protection: if auth takes more than 10 seconds, stop loading
        const timeoutId = setTimeout(() => {
            if (loading && !initializationComplete.current) {
                console.warn('Auth initialization timeout - proceeding without auth');
                setLoading(false);
                setAuthError('Authentication timed out');
            }
        }, 10000);

        // Check active session
        const getSession = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error) {
                    console.error('Error getting session:', error);
                    setAuthError(error.message);
                    setUser(null);
                    setRole(null);
                } else if (session?.user) {
                    setUser(session.user);
                    await fetchUserRole(session.user.id, session.user.email);
                } else {
                    setUser(null);
                    setRole(null);
                }
            } catch (err) {
                console.error('Unexpected error in getSession:', err);
                setAuthError(err.message);
                setUser(null);
                setRole(null);
            } finally {
                initializationComplete.current = true;
                setLoading(false);
            }
        };

        getSession();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            // Don't set loading to true here to avoid blank screens during auth state changes
            try {
                if (session?.user) {
                    setUser(session.user);
                    await fetchUserRole(session.user.id, session.user.email);
                } else {
                    setUser(null);
                    setRole(null);
                }
                setAuthError(null);
            } catch (err) {
                console.error('Error in auth state change:', err);
                setAuthError(err.message);
            }
        });

        return () => {
            clearTimeout(timeoutId);
            subscription.unsubscribe();
        };
    }, []);

    const fetchUserRole = async (userId, userEmail = null) => {
        try {
            // Check for hardcoded admins first (instant recovery)
            if (userEmail && userEmail.toLowerCase() === 'ovi.extra@gmail.com') {
                setRole('admin');
                // Persist to DB asynchronously
                supabase.from('profiles').upsert({ id: userId, role: 'admin', full_name: 'Ovi Admin' }).catch(() => { });
                return 'admin';
            }

            const { data, error } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', userId)
                .single();

            if (error) {
                console.error('Error fetching role:', error);
                setRole('customer');
                return 'customer';
            } else {
                const userRole = data?.role || 'customer';
                setRole(userRole);
                return userRole;
            }
        } catch (err) {
            console.error("Unexpected error fetching role:", err);
            setRole('customer');
            return 'customer';
        }
    };

    const signIn = async (email, password) => {
        const result = await supabase.auth.signInWithPassword({ email, password });
        if (result.error) {
            showToast(result.error.message, 'error');
        } else {
            // Fetch role immediately after sign in, passing email for force-admin check
            const userRole = await fetchUserRole(result.data.user.id, email);
            result.userRole = userRole;
            showToast('Welcome back!', 'success');
        }
        return result;
    };

    const signUp = async (email, password, metadata = {}) => {
        const result = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: metadata, // e.g. full_name
            },
        });
        if (result.error) {
            showToast(result.error.message, 'error');
        } else {
            showToast('Account created! Please check your email for verification.', 'success', 6000);
        }
        return result;
    };

    const signOut = async () => {
        try {
            await supabase.auth.signOut();
        } catch (err) {
            console.warn("Supabase signOut error, continuing with local cleanup:", err);
        } finally {
            // Force clear state regardless of what happened
            setUser(null);
            setRole(null);
            showToast('Successfully logged out.', 'info');
        }
    };

    const value = {
        user,
        role,
        isAdmin: role === 'admin',
        signIn,
        signUp,
        signOut,
        loading,
        authError
    };

    // Show a loading spinner instead of nothing during auth initialization
    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
