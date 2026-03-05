import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const PixelTracker = () => {
    const location = useLocation();

    useEffect(() => {
        if (typeof window !== 'undefined' && window.fbq) {
            window.fbq('track', 'PageView');
        }
    }, [location.pathname]);

    return null;
};

export default PixelTracker;
