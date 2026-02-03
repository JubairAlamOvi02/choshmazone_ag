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
                // Do not force reload, just let state update naturally to avoid loops
            });
        }
    }, []);

    useEffect(() => {
        // Timeout protection: if auth takes more than 15 seconds, stop loading
        const timeoutId = setTimeout(() => {
            if (loading && !initializationComplete.current) {
                console.warn('[Auth] Initialization timed out after 15s - forcing ready state');
                setLoading(false);
                setAuthError('Authentication timed out');
            }
        }, 15000);

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
                    // Fetch role in background to prevent blocking initialization if DB is slow
                    fetchUserRole(session.user.id, session.user.email);
                    console.log(`[Auth] Session detected for: ${session.user.email}`);
                } else {
                    console.log('[Auth] No active session found');
                    setUser(null);
                    setRole(null);
                }
            } catch (err) {
                console.error('Unexpected error in getSession:', err);
                setAuthError(err.message);
                setUser(null);
                setRole(null);
                // If we hit an error here, it might be a corrupted session. Clear it.
                localStorage.clear();
            } finally {
                initializationComplete.current = true;
                setLoading(false);
            }
        };

        getSession();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log(`[Auth] Auth state changed: ${event}`);
            try {
                if (event === 'SIGNED_OUT') {
                    setUser(null);
                    setRole(null);
                    localStorage.clear();
                } else if (session?.user && event !== 'INITIAL_SESSION') {
                    // INITIAL_SESSION is already handled by getSession() above
                    setUser(session.user);
                    await fetchUserRole(session.user.id, session.user.email);
                } else if (session?.user) {
                    setUser(session.user);
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
            }, { onConflict: 'id' }).then(({ error }) => {
                if (error) console.warn('[Auth] Background sync failed:', error);
            });
            return 'admin';
        }

        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', userId)
                .maybeSingle(); // Use maybeSingle to avoid 406 error if row missing

            if (error) {
                console.error('Error fetching role:', error);
                // Graceful fallback
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
        console.log('[Auth] SignOut initiated');
        try {
            // Prevent hanging: Race Supabase signOut against a 1-second timeout
            await Promise.race([
                supabase.auth.signOut(),
                new Promise((resolve) => setTimeout(() => resolve('timeout'), 1000))
            ]);
            console.log('[Auth] Supabase signOut attempted');
        } catch (err) {
            console.error("[Auth] SignOut error:", err);
        } finally {
            console.log('[Auth] Clearing local state');
            setUser(null);
            setRole(null);

            // Nuclear option: Clear everything
            localStorage.clear();
            sessionStorage.clear();

            // Clear all cookies
            document.cookie.split(";").forEach((c) => {
                document.cookie = c
                    .replace(/^ +/, "")
                    .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
            });

            showToast('Successfully logged out.', 'info');

            // Short delay to allow toast to appear and state to settle before hard refresh
            setTimeout(() => {
                window.location.href = '/';
            }, 500);
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

    // Simplified loading check to prevent flash of loading content
    if (loading && !initializationComplete.current) return <LoadingSpinner />;

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
