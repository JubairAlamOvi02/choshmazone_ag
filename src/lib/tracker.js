import { supabase } from './supabaseClient';

// Storage keys
const VISITOR_KEY = 'cz_visitor_id';
const SESSION_KEY = 'cz_session_id';
const SESSION_INIT_KEY = 'cz_session_init_ts';

// Helper to generate a random UUID-like string
const generateId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
};

// Retrieve or initialize unique visitor ID (persistent across browser restarts)
export const getVisitorId = () => {
    try {
        let visitorId = localStorage.getItem(VISITOR_KEY);
        if (!visitorId) {
            visitorId = generateId();
            localStorage.setItem(VISITOR_KEY, visitorId);
        }
        return visitorId;
    } catch {
        return generateId();
    }
};

// Retrieve or initialize session ID (cleared when browser session ends)
export const getSessionId = () => {
    try {
        let sessionId = sessionStorage.getItem(SESSION_KEY);
        if (!sessionId) {
            sessionId = generateId();
            sessionStorage.setItem(SESSION_KEY, sessionId);
            sessionStorage.setItem(SESSION_INIT_KEY, Date.now().toString());
        }
        return sessionId;
    } catch {
        return generateId();
    }
};

// Detect device type, browser, and OS
export const getDeviceInfo = () => {
    if (typeof window === 'undefined') {
        return { deviceType: 'desktop', browser: 'Unknown', os: 'Unknown' };
    }

    const ua = navigator.userAgent;

    // Device Type
    let deviceType = 'desktop';
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
        deviceType = 'tablet';
    } else if (
        /Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i.test(ua)
    ) {
        deviceType = 'mobile';
    }

    // Browser
    let browser = 'Other';
    if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('SamsungBrowser')) browser = 'Samsung Internet';
    else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera';
    else if (ua.includes('Trident')) browser = 'Internet Explorer';
    else if (ua.includes('Edge') || ua.includes('Edg')) browser = 'Microsoft Edge';
    else if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Safari')) browser = 'Safari';

    // Operating System
    let os = 'Unknown';
    if (ua.includes('Win')) os = 'Windows';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iPhone') || ua.includes('iPad') || ua.includes('iPod')) os = 'iOS';
    else if (ua.includes('Mac')) os = 'macOS';
    else if (ua.includes('Linux')) os = 'Linux';

    return { deviceType, browser, os };
};

// Initialize / Update visitor session in background
let sessionInitialized = false;
let sessionInitPromise = null;

export const ensureSession = async (currentPath = '/') => {
    const sessionId = getSessionId();
    const visitorId = getVisitorId();
    const { deviceType, browser, os } = getDeviceInfo();
    const referrer = typeof document !== 'undefined' ? (document.referrer || 'Direct') : 'Direct';

    if (sessionInitialized) {
        return sessionId;
    }

    if (sessionInitPromise) {
        return sessionInitPromise;
    }

    sessionInitPromise = (async () => {
        try {
            // Get logged in user if any
            const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));

            // Upsert session
            const { error } = await supabase
                .from('visitor_sessions')
                .upsert(
                    {
                        id: sessionId,
                        visitor_id: visitorId,
                        user_id: user?.id || null,
                        first_page: currentPath,
                        last_page: currentPath,
                        referrer: referrer,
                        device_type: deviceType,
                        browser: browser,
                        operating_system: os,
                        last_active_at: new Date().toISOString()
                    },
                    { onConflict: 'id', ignoreDuplicates: false }
                );

            if (!error) {
                sessionInitialized = true;
            }
        } catch (err) {
            // Tracking failure should never crash the user experience
            console.debug('[Tracker] Session sync notice:', err?.message || err);
        }
        return sessionId;
    })();

    return sessionInitPromise;
};

/**
 * Track an event to Supabase web_events and update visitor_sessions milestones
 * @param {string} eventType - e.g. 'page_view', 'view_product', 'add_to_cart', 'initiate_checkout', 'purchase'
 * @param {object} metadata - Custom payload (product info, price, cart total, etc.)
 * @param {object} extra - Optional path, pageTitle overrides
 */
export const trackEvent = async (eventType, metadata = {}, extra = {}) => {
    try {
        const visitorId = getVisitorId();
        const sessionId = getSessionId();
        const { deviceType } = getDeviceInfo();
        const path = extra.path || (typeof window !== 'undefined' ? window.location.pathname : '/');
        const pageTitle = extra.pageTitle || (typeof document !== 'undefined' ? document.title : '');

        // Ensure session exists
        ensureSession(path);

        // Fetch auth user ID if exists
        const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));

        // 1. Record event
        const eventPromise = supabase
            .from('web_events')
            .insert({
                visitor_id: visitorId,
                session_id: sessionId,
                user_id: user?.id || null,
                event_type: eventType,
                path: path,
                page_title: pageTitle,
                metadata: metadata || {},
                device_type: deviceType,
                created_at: new Date().toISOString()
            });

        // 2. Update session funnel flags if milestone reached
        const sessionUpdate = {
            last_page: path,
            last_active_at: new Date().toISOString()
        };

        if (user?.id) {
            sessionUpdate.user_id = user.id;
        }

        if (eventType === 'view_product') {
            sessionUpdate.has_viewed_product = true;
        } else if (eventType === 'add_to_cart') {
            sessionUpdate.has_added_to_cart = true;
        } else if (eventType === 'initiate_checkout') {
            sessionUpdate.has_initiated_checkout = true;
        } else if (eventType === 'purchase') {
            sessionUpdate.has_purchased = true;
            if (metadata.order_id) sessionUpdate.order_id = metadata.order_id;
            if (metadata.total_amount) {
                sessionUpdate.total_purchased_amount = Number(metadata.total_amount);
            }
        }

        const sessionPromise = supabase
            .from('visitor_sessions')
            .update(sessionUpdate)
            .eq('id', sessionId);

        // Execute in background
        Promise.allSettled([eventPromise, sessionPromise]).catch(() => {});
    } catch (err) {
        console.debug('[Tracker] Event dispatch notice:', err?.message || err);
    }
};
