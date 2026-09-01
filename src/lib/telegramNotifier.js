/**
 * Telegram Notification Service for Choshma Zone
 * Sends real-time order alerts to the store owner's phone via Telegram Bot.
 */

const TELEGRAM_BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = import.meta.env.VITE_TELEGRAM_CHAT_ID;

/**
 * Format order details into an attractive HTML message for Telegram
 */
const formatOrderMessage = (order) => {
    const {
        orderId = 'N/A',
        customerName = 'Guest Customer',
        phone = 'N/A',
        email = '',
        address = '',
        district = '',
        thana = '',
        paymentMethod = 'COD',
        bkashNumber = '',
        bkashTrxId = '',
        items = [],
        deliveryCharge = 0,
        totalAmount = 0,
        orderDate = '',
        orderTime = ''
    } = order;

    const fullAddress = [address, thana, district].filter(Boolean).join(', ') || 'N/A';
    const isBkash = paymentMethod.toLowerCase() === 'bkash';
    const paymentLabel = isBkash ? '⚡ <b>bKash (Online)</b>' : '💵 <b>Cash on Delivery (COD)</b>';
    
    let itemsList = '';
    if (items && items.length > 0) {
        itemsList = items.map((item, index) => {
            const style = item.style && item.style !== 'Default' ? ` (${item.style})` : '';
            const price = Number(item.price || 0).toLocaleString();
            return `  ${index + 1}. <b>${item.title || item.name || 'Product'}</b>${style}\n     Qty: <b>${item.quantity}</b> × ৳${price}`;
        }).join('\n');
    } else {
        itemsList = '  <i>No items listed</i>';
    }

    let bkashInfo = '';
    if (isBkash) {
        bkashInfo = `\n📱 <b>Sender No:</b> <code>${bkashNumber || 'N/A'}</code>\n🔑 <b>Trx ID:</b> <code>${bkashTrxId || 'N/A'}</code>`;
    }

    const dateStr = orderDate && orderTime ? `${orderDate} at ${orderTime}` : new Date().toLocaleString();

    return `
🛒 <b>NEW ORDER RECEIVED!</b>
━━━━━━━━━━━━━━━━━━━━
🆔 <b>Order ID:</b> <code>#${orderId}</code>
🕒 <b>Time:</b> ${dateStr}

👤 <b>CUSTOMER DETAILS</b>
• <b>Name:</b> ${customerName}
• <b>Phone:</b> <a href="tel:${phone}">${phone}</a>
${email ? `• <b>Email:</b> ${email}\n` : ''}• <b>Delivery Address:</b> ${fullAddress}

📦 <b>ORDERED ITEMS</b>
${itemsList}

💳 <b>PAYMENT & TOTAL</b>
• <b>Payment Method:</b> ${paymentLabel}${bkashInfo}
• <b>Delivery Charge:</b> ৳${Number(deliveryCharge || 0).toLocaleString()}
• <b>Total Payable:</b> <b>৳${Number(totalAmount || 0).toLocaleString()}</b>
━━━━━━━━━━━━━━━━━━━━
<i>Choshma Zone Store Notification</i>
`.trim();
};

/**
 * Send order notification to Telegram
 * @param {Object} orderData Order details
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const sendTelegramOrderNotification = async (orderData) => {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
        console.warn('⚠️ Telegram notification skipped: VITE_TELEGRAM_BOT_TOKEN or VITE_TELEGRAM_CHAT_ID is missing in .env');
        return { success: false, error: 'Telegram credentials missing' };
    }

    try {
        const text = formatOrderMessage(orderData);
        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: text,
                parse_mode: 'HTML',
                disable_web_page_preview: true
            })
        });

        const data = await response.json();

        if (!data.ok) {
            console.error('Telegram API error:', data.description);
            return { success: false, error: data.description };
        }

        console.log('✅ Telegram order notification sent successfully!');
        return { success: true };
    } catch (err) {
        console.error('Failed to send Telegram notification:', err);
        return { success: false, error: err.message };
    }
};

/**
 * Test Telegram Bot connection
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const testTelegramNotification = async () => {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
        return {
            success: false,
            message: 'Telegram Bot Token or Chat ID is not configured in your .env file.'
        };
    }

    try {
        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
        const testText = `
🎉 <b>Choshma Zone - Telegram Alerts Connected!</b>
━━━━━━━━━━━━━━━━━━━━
Your order notification system is now working. You will receive real-time push alerts on your phone whenever a customer places an order.
🕒 Time: ${new Date().toLocaleString()}
━━━━━━━━━━━━━━━━━━━━
`.trim();

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: testText,
                parse_mode: 'HTML'
            })
        });

        const data = await response.json();
        if (data.ok) {
            return { success: true, message: 'Test message sent! Check your Telegram app.' };
        } else {
            return { success: false, message: `Telegram Error: ${data.description}` };
        }
    } catch (err) {
        return { success: false, message: `Network error: ${err.message}` };
    }
};
