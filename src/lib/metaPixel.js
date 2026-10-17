import { getVisitorId } from './tracker';

export const META_PIXEL_ID = '28809507428687294';

/**
 * Retrieve a cookie value by name (e.g. _fbp, _fbc)
 */
export const getMetaCookie = (name) => {
    if (typeof document === 'undefined') return null;
    try {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) {
            return parts.pop().split(';').shift() || null;
        }
    } catch {
        // Cookie access blocked or restricted
    }
    return null;
};

/**
 * Normalizes phone numbers to standard Meta format (E.164 without +, e.g., 8801XXXXXXXXX for Bangladesh)
 */
export const formatMetaPhone = (phone) => {
    if (!phone) return '';
    const digitsOnly = String(phone).replace(/\D/g, '');
    if (!digitsOnly) return '';

    // If starts with 880 (e.g. 88017XXXXXXXX)
    if (digitsOnly.startsWith('880')) {
        return digitsOnly;
    }
    // If starts with standard local 01 (e.g. 017XXXXXXXX -> 88017XXXXXXXX)
    if (digitsOnly.startsWith('01') && digitsOnly.length === 11) {
        return `88${digitsOnly}`;
    }
    // If entered without leading 0 (e.g. 17XXXXXXXX -> 88017XXXXXXXX)
    if (digitsOnly.startsWith('1') && digitsOnly.length === 10) {
        return `880${digitsOnly}`;
    }
    return digitsOnly;
};

/**
 * Update Meta Pixel Advanced Matching user parameters (External ID, Phone, Email, etc.)
 */
export const updateMetaUserData = (customer = {}) => {
    if (typeof window === 'undefined' || !window.fbq) return;

    try {
        const visitorId = getVisitorId();
        const externalId = customer.external_id || customer.userId || visitorId;

        const userData = {
            external_id: externalId
        };

        const formattedPhone = formatMetaPhone(customer.phone);
        if (formattedPhone) {
            userData.ph = formattedPhone;
        }

        if (customer.email && typeof customer.email === 'string') {
            const cleanEmail = customer.email.trim().toLowerCase();
            if (cleanEmail && cleanEmail.includes('@')) {
                userData.em = cleanEmail;
            }
        }

        if (customer.name && typeof customer.name === 'string') {
            const nameParts = customer.name.trim().split(/\s+/);
            if (nameParts.length > 0 && nameParts[0]) {
                userData.fn = nameParts[0].toLowerCase();
            }
            if (nameParts.length > 1) {
                userData.ln = nameParts.slice(1).join(' ').toLowerCase();
            }
        }

        if (customer.district || customer.city) {
            const city = (customer.district || customer.city || '').trim().toLowerCase();
            if (city) {
                userData.ct = city;
            }
        }

        userData.country = 'bd';

        // Re-initialize pixel with Advanced Matching parameters
        window.fbq('init', META_PIXEL_ID, userData);
    } catch (err) {
        console.debug('[MetaPixel] Failed to update user data:', err);
    }
};

/**
 * Track Meta Pixel Purchase event with Browser ID (_fbp), External ID, and Advanced Matching
 */
export const trackMetaPurchase = (orderData, customerData = {}) => {
    if (typeof window === 'undefined' || !window.fbq) return;

    try {
        // 1. Send Advanced Matching (External ID + Customer identifiers)
        updateMetaUserData(customerData);

        const totalAmount = Number(orderData.totalAmount || orderData.value || 0);
        const orderId = String(orderData.orderId || orderData.id || '');
        const items = Array.isArray(orderData.items) ? orderData.items : [];

        const contentIds = items.map(item => String(item.id || item.productId || ''));
        const totalItemsCount = items.reduce((acc, item) => acc + (Number(item.quantity) || 1), 0);

        // 2. Track Purchase event with deduplication eventID
        const eventData = {
            value: Number(totalAmount.toFixed(2)),
            currency: 'BDT',
            content_ids: contentIds.filter(Boolean),
            content_type: 'product',
            num_items: totalItemsCount || 1
        };

        const eventOptions = {};
        if (orderId) {
            eventOptions.eventID = orderId;
        }

        window.fbq('track', 'Purchase', eventData, eventOptions);
    } catch (err) {
        console.warn('[MetaPixel] Purchase tracking failed:', err);
    }
};

/**
 * Track Meta Pixel InitiateCheckout event
 */
export const trackMetaInitiateCheckout = (cartItems = [], totalAmount = 0, customerData = {}) => {
    if (typeof window === 'undefined' || !window.fbq) return;

    try {
        updateMetaUserData(customerData);

        const contentIds = cartItems.map(item => String(item.id || ''));
        const totalItemsCount = cartItems.reduce((acc, item) => acc + (Number(item.quantity) || 1), 0);

        window.fbq('track', 'InitiateCheckout', {
            value: Number(Number(totalAmount).toFixed(2)),
            currency: 'BDT',
            content_ids: contentIds.filter(Boolean),
            content_type: 'product',
            num_items: totalItemsCount
        });
    } catch (err) {
        console.debug('[MetaPixel] InitiateCheckout tracking notice:', err);
    }
};
