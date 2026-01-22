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

const SESSION_VERSION = '1.0.2';

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null); // 'admin' | 'customer' | null
    const [loading, setLoading] = useState(true);
    const [authError, setAuthError] = useState(null);
    const initializationComplete = useRef(false);
    const { showToast } = useToast();

    // Session Versioning: Force clean slate on version mismatch
    useEffect(() => {
        const storedVersion = localStorage.getItem('cz_session_version');
        if (storedVersion !== SESSION_VERSION) {
            supabase.auth.signOut().then(() => {
                localStorage.clear();
                localStorage.setItem('cz_session_version', SESSION_VERSION);
                // Only reload if we actually cleared a stale session
                if (storedVersion) window.location.reload();
            });
        }
    }, []);

    useEffect(() => {
        // Timeout protection: if auth takes more than 10 seconds, stop loading
        const timeoutId = setTimeout(() => {
            if (loading && !initializationComplete.current) {
                console.warn('Auth initialization timeout - proceeding without auth');
                setLoading(false);
                setAuthError('Authentication timed out');
            }
        }, 12000);

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
                    const finalRole = await fetchUserRole(session.user.id, session.user.email);
                    console.log(`[Auth] Session active: ${session.user.email}, Role: ${finalRole}`);
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
        console.log(`[Auth] Fetching role for: ${userEmail} (${userId})`);

        // Master Override for ovi.extra@gmail.com
        if (userEmail && userEmail.toLowerCase().trim() === 'ovi.extra@gmail.com') {
            console.log('[Auth] Master Admin Detected: Force setting admin role');
            setRole('admin');
            // Background sync to ensure DB is updated
            supabase.from('profiles').upsert({
                id: userId,
                role: 'admin',
                full_name: 'Ovi Admin'
            }, { onConflict: 'id' }).catch((e) => console.warn('[Auth] Background sync failed:', e));
            return 'admin';
        }

        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', userId)
                .single();

            if (error) {
                console.error('Error fetching role:', error);
                // Graceful fallback: check if user metadata has role (backup)
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
            return { error: result.error, userRole: null };
        } else {
            // Fetch and set role immediately
            const userRole = await fetchUserRole(result.data.user.id, email);
            showToast('Welcome back!', 'success');
            return { data: result.data, error: null, userRole };
        }
    };

    const signUp = async (email, password, metadata = {}) => {
        const result = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: metadata,
            },
        });
        if (result.error) {
            showToast(result.error.message, 'error');
        } else {
            showToast('Account created! Please check your email.', 'success', 6000);
        }
        return result;
    };

    const signOut = async () => {
        try {
            await supabase.auth.signOut();
        } catch (err) {
            console.error("SignOut error:", err);
        } finally {
            setUser(null);
            setRole(null);
            showToast('Successfully logged out.', 'info');
            // Optional: Hard refresh to clear any residual memory state
            window.location.href = '/';
        }
    };

    const value = {
        user,
        role,
        isAdmin: role === 'admin' || (user?.email?.toLowerCase().trim() === 'ovi.extra@gmail.com'),
        signIn,
        signUp,
        signOut,
        loading,
        authError
    };

    if (loading) return <LoadingSpinner />;

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
