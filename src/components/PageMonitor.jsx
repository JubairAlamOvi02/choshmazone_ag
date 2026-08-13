import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const PageMonitor = () => {
    const location = useLocation();

    useEffect(() => {
        if (typeof window !== 'undefined' && window.fbq) {
            window.fbq('track', 'PageView');
        }
    }, [location.pathname]);

    return null;
};

export default PageMonitor;
