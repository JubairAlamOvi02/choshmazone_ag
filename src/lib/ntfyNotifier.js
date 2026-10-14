/**
 * ntfy.sh Push Notification Service for Choshma Zone
 * 
 * Free, open-source native phone notification system (Android & iOS).
 * - No app publishing required (uses the free 'ntfy' app from App Store / Google Play).
 * - Delivers lock-screen notifications with custom sound & vibration.
 * - Interactive action buttons: 'View Order', 'Call Customer', 'WhatsApp'.
 */

export const NTFY_DEFAULT_TOPIC = 'choshmazone_orders_alerts_cz';

export const getNtfyTopic = () => {
    return import.meta.env.VITE_NTFY_TOPIC || NTFY_DEFAULT_TOPIC;
};

/**
 * Send real-time order alert to your phone via ntfy
 * @param {Object} order Order data
 */
export const sendNtfyOrderNotification = async (order) => {
    const topic = getNtfyTopic();
    if (!topic) return { success: false, error: 'No ntfy topic configured' };

    const {
        orderId = 'N/A',
        customerName = 'Guest Customer',
        phone = 'N/A',
        address = '',
        district = '',
        thana = '',
        totalAmount = 0,
        paymentMethod = 'COD',
        items = []
    } = order;

    const fullAddress = [address, thana, district].filter(Boolean).join(', ') || 'N/A';
    const cleanPhone = String(phone).replace(/\D/g, '');

    const itemsSummary = (items && items.length > 0)
        ? items.map(i => `${i.title || i.name || 'Item'} (x${i.quantity || 1})`).join(', ')
        : '1x Product';

    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://choshmazone.com';
    const adminUrl = `${origin}/admin/orders`;

    const actions = [
        {
            action: 'view',
            label: '👁️ View Order',
            url: adminUrl,
            clear: true
        }
    ];

    if (cleanPhone) {
        actions.push({
            action: 'view',
            label: `📞 Call (${cleanPhone.slice(-5)})`,
            url: `tel:${cleanPhone}`
        });
        const waNumber = cleanPhone.startsWith('880') ? cleanPhone : (cleanPhone.startsWith('0') ? `88${cleanPhone}` : `880${cleanPhone}`);
        actions.push({
            action: 'view',
            label: '💬 WhatsApp',
            url: `https://wa.me/${waNumber}`
        });
    }

    const payload = {
        topic: topic,
        title: `💰 New Order #${orderId} (৳${Number(totalAmount).toLocaleString()})`,
        message: `👤 ${customerName}\n📞 ${phone}\n📍 ${fullAddress}\n📦 ${itemsSummary}\n💳 ${paymentMethod.toUpperCase()}`,
        priority: 4, // 4 = High (Audible alert + vibration), 5 = Max
        tags: ['moneybag', 'eyeglasses', 'shopping_cart'],
        click: adminUrl,
        actions: actions
    };

    try {
        const response = await fetch('https://ntfy.sh', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`ntfy HTTP error: ${response.status}`);
        }

        console.log('✅ [ntfy] Phone notification sent successfully to topic:', topic);
        return { success: true, topic };
    } catch (err) {
        console.error('Failed to send ntfy notification:', err);
        return { success: false, error: err.message };
    }
};

/**
 * Send a test notification to verify phone reception
 */
export const testNtfyNotification = async () => {
    const topic = getNtfyTopic();
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://choshmazone.com';

    const payload = {
        topic: topic,
        title: '💰 Test Order #CZ-DEMO (৳2,450)',
        message: `👤 Rakibul Islam\n📞 01712345678\n📍 Mirpur, Dhaka\n📦 Aviator Classic Polarized (x1)\n💳 Cash on Delivery`,
        priority: 5, // Urgent - tests lock-screen banner and sound
        tags: ['bell', 'tada', 'eyeglasses'],
        click: `${origin}/admin/orders`,
        actions: [
            {
                action: 'view',
                label: '👁️ Open Orders',
                url: `${origin}/admin/orders`,
                clear: true
            },
            {
                action: 'view',
                label: '📞 Call Store',
                url: 'tel:01712345678'
            }
        ]
    };

    try {
        const response = await fetch('https://ntfy.sh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            return {
                success: true,
                topic: topic,
                message: `✅ Test alert dispatched to ntfy topic: "${topic}". Check your phone!`
            };
        } else {
            return {
                success: false,
                message: `ntfy server responded with status: ${response.status}`
            };
        }
    } catch (err) {
        return {
            success: false,
            message: `Network error sending test: ${err.message}`
        };
    }
};
