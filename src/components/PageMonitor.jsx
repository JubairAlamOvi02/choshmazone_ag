import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackEvent } from '../lib/tracker';

const PageMonitor = () => {
    const location = useLocation();

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

    return null;
};

export default PageMonitor;

