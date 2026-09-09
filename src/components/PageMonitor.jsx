import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { trackEvent, touchSession } from '../lib/tracker';

const HEARTBEAT_INTERVAL = 30000; // 30 seconds

const PageMonitor = () => {
    const location = useLocation();
    const heartbeatRef = useRef(null);

    // Track page views on route change
    useEffect(() => {
        // 1. Facebook Pixel
        if (typeof window !== 'undefined' && window.fbq) {
            window.fbq('track', 'PageView');
        }

        // 2. Custom Web Log Analytics
        trackEvent('page_view', {
            path: location.pathname,
            search: location.search,
            referrer: typeof document !== 'undefined' ? (document.referrer || 'Direct') : 'Direct'
        }, { path: location.pathname });
    }, [location.pathname, location.search]);

    // Heartbeat: update last_active_at every 30s so admin can see "live" viewers
    useEffect(() => {
        // Immediate touch on route change
        touchSession(location.pathname);

        // Set up recurring heartbeat
        heartbeatRef.current = setInterval(() => {
            touchSession(location.pathname);
        }, HEARTBEAT_INTERVAL);

        return () => {
            if (heartbeatRef.current) {
                clearInterval(heartbeatRef.current);
            }
        };
    }, [location.pathname]);

    return null;
};

export default PageMonitor;
