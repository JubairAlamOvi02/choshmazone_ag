import React, { useState, useEffect } from 'react';
import { orderParams } from '../../lib/api/orders';
import { calculateDeliveryCharge } from '../../data/bangladeshLocations';
import { useToast } from '../../context/ToastContext';
import { 
    Trash2, ExternalLink, Filter, Search, MoreVertical, X, Package, 
    User, Mail, Phone, MapPin, CreditCard, ChevronRight, Bell, Eye, 
    Copy, Check, Truck, Image as ImageIcon 
} from 'lucide-react';
import { testTelegramNotification } from '../../lib/telegramNotifier';

// Reusable CopyButton with instant feedback and animated checkmark
const CopyButton = ({ 
    text, 
    onCopy, 
    onCopySuccess, 
    label, 
    className = "", 
    iconSize = 13, 
    title = "Copy to clipboard" 
}) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async (e) => {
        e?.stopPropagation?.();
        try {
            if (onCopy) {
                await onCopy();
            } else if (text) {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText(text);
                } else {
                    const textarea = document.createElement('textarea');
                    textarea.value = text;
                    document.body.appendChild(textarea);
                    textarea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textarea);
                }
            }
            setCopied(true);
            if (onCopySuccess) onCopySuccess();
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Copy failed:', err);
        }
    };

    return (
        <button
            type="button"
            onClick={handleCopy}
            title={copied ? "Copied!" : title}
            className={`inline-flex items-center gap-1.5 transition-all cursor-pointer select-none ${className}`}
        >
            {copied ? (
                <Check size={iconSize} className="text-green-600 shrink-0 animate-in zoom-in duration-200" />
            ) : (
                <Copy size={iconSize} className="shrink-0 transition-colors" />
            )}
            {label && <span className={copied ? "text-green-600 font-bold" : ""}>{copied ? "Copied!" : label}</span>}
        </button>
    );
};

// Formats full shipping address cleanly
const formatShippingAddress = (addr) => {
    if (!addr) return '';
    const parts = [];
    if (addr.address) parts.push(addr.address.trim());
    const line2 = [addr.thana, addr.district].filter(Boolean).map(s => s.trim()).join(', ');
    if (line2) parts.push(line2);
    const line3 = [addr.city, addr.zip].filter(Boolean).map(s => s.trim()).join(', ');
    if (line3) parts.push(line3);
    if (addr.country) parts.push(addr.country.trim());
    return parts.join('\n');
};

// Courier booking format (Steadfast / Pathao / RedX friendly)
const formatCourierText = (order) => {
    const addr = order.shipping_address || {};
    const name = `${addr.first_name || ''} ${addr.last_name || ''}`.trim() || 'Customer';
    const phone = addr.phone || 'N/A';
    const address = formatShippingAddress(addr).replace(/\n/g, ', ');
    const isPaid = order.payment_method?.toLowerCase() !== 'cod' && 
                   order.payment_method?.toLowerCase() !== 'cash on delivery' && 
                   Boolean(order.payment_details?.transaction_id);
    const codAmount = isPaid ? 0 : (order.total_amount || 0);
    const items = (order.order_items || []).map(i => `${i.products?.name || 'Product'} (x${i.quantity})`).join(', ');

    return `Name: ${name}\nPhone: ${phone}\nAddress: ${address}\nAmount: ৳${codAmount}\nNote: Order #${order.id?.slice(0, 8)} (${items})`;
};

// Generate Full Order Text
const generateFullOrderText = (order, getItemImgFn) => {
    const addr = order.shipping_address || {};
    const name = `${addr.first_name || ''} ${addr.last_name || ''}`.trim() || 'Customer';
    const phone = addr.phone || 'N/A';
    const email = addr.email || 'N/A';
    const fullAddr = formatShippingAddress(addr);
    const deliveryCharge = calculateDeliveryCharge(addr.district);
    const subtotal = Math.max(0, (order.total_amount || 0) - deliveryCharge);

    let text = `===============================\n`;
    text += `📦 CHOSHMA ZONE - ORDER DETAILS\n`;
    text += `===============================\n`;
    text += `Order ID: #${order.id}\n`;
    text += `Status: ${(order.status || '').toUpperCase()}\n`;
    text += `Date: ${new Date(order.created_at || Date.now()).toLocaleString()}\n\n`;

    text += `👤 CUSTOMER INFORMATION:\n`;
    text += `Name: ${name}\n`;
    text += `Phone: ${phone}\n`;
    text += `Email: ${email}\n\n`;

    text += `📍 SHIPPING ADDRESS:\n`;
    text += `${fullAddr}\n\n`;

    text += `💳 PAYMENT DETAILS:\n`;
    text += `Method: ${(order.payment_method || 'N/A').toUpperCase()}\n`;
    if (order.payment_details?.bkash_number) {
        text += `bKash Number: ${order.payment_details.bkash_number}\n`;
    }
    if (order.payment_details?.transaction_id) {
        text += `TrxID: ${order.payment_details.transaction_id}\n`;
    }
    text += `\n`;

    text += `🛍️ ORDER ITEMS (${(order.order_items || []).length}):\n`;
    (order.order_items || []).forEach((item, idx) => {
        const itemImg = getItemImgFn ? getItemImgFn(item) : (item.products?.image_url || '');
        const lensMatch = item.style?.match(/Lens:\s*([^|(\[]+)/);
        const lensName = lensMatch ? lensMatch[1].trim() : '';
        const rxPowerMatch = item.style?.match(/\[Rx:\s*([^\]]+)\]/);
        const rxPower = rxPowerMatch ? rxPowerMatch[1].trim() : '';
        const urlMatch = item.style?.match(/\[URL:\s*([^\]]+)\]/);
        const rxUrl = urlMatch ? urlMatch[1].trim() : '';

        text += `${idx + 1}. ${item.products?.name || 'Product'}\n`;
        text += `   - Config: ${item.style?.split('|')[0]?.trim() || 'Default'}\n`;
        if (lensName) text += `   - Lens: ${lensName}\n`;
        if (rxPower) text += `   - Rx Power: ${rxPower}\n`;
        if (rxUrl) text += `   - Doctor Slip: ${rxUrl}\n`;
        text += `   - Quantity: ${item.quantity} x ৳${Number(item.unit_price || 0).toLocaleString()} = ৳${Number((item.quantity || 1) * (item.unit_price || 0)).toLocaleString()}\n`;
        if (itemImg) text += `   - Image: ${itemImg}\n`;
        text += `\n`;
    });

    text += `💰 ORDER TOTAL:\n`;
    text += `Subtotal: ৳${subtotal.toLocaleString()}\n`;
    text += `Delivery Charge: ৳${deliveryCharge.toLocaleString()}\n`;
    text += `TOTAL AMOUNT: ৳${Number(order.total_amount || 0).toLocaleString()}\n`;
    text += `===============================`;

    return text;
};

// Generate Rich HTML for clipboard (with <img> tags and styled boxes)
const generateFullOrderHtml = (order, getItemImgFn) => {
    const addr = order.shipping_address || {};
    const name = `${addr.first_name || ''} ${addr.last_name || ''}`.trim() || 'Customer';
    const phone = addr.phone || 'N/A';
    const email = addr.email || 'N/A';
    const fullAddrHtml = formatShippingAddress(addr).replace(/\n/g, '<br />');
    const deliveryCharge = calculateDeliveryCharge(addr.district);
    const subtotal = Math.max(0, (order.total_amount || 0) - deliveryCharge);

    const itemsRowsHtml = (order.order_items || []).map((item) => {
        const itemImg = getItemImgFn ? getItemImgFn(item) : (item.products?.image_url || '');
        const lensMatch = item.style?.match(/Lens:\s*([^|(\[]+)/);
        const lensName = lensMatch ? lensMatch[1].trim() : '';
        const rxPowerMatch = item.style?.match(/\[Rx:\s*([^\]]+)\]/);
        const rxPower = rxPowerMatch ? rxPowerMatch[1].trim() : '';
        const urlMatch = item.style?.match(/\[URL:\s*([^\]]+)\]/);
        const rxUrl = urlMatch ? urlMatch[1].trim() : '';

        return `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 10px; width: 70px; vertical-align: top;">
            ${itemImg ? `<img src="${itemImg}" alt="${item.products?.name || ''}" width="65" height="65" style="object-fit: contain; border-radius: 8px; border: 1px solid #e2e8f0; background: #fff;" />` : '<div style="width:65px;height:65px;background:#f1f5f9;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:10px;color:#94a3b8;">No Image</div>'}
          </td>
          <td style="padding: 10px; vertical-align: top;">
            <div style="font-weight: bold; font-size: 14px; color: #0f172a; margin-bottom: 4px;">${item.products?.name || 'Product'}</div>
            <div style="font-size: 12px; color: #64748b;">${item.style?.split('|')[0]?.trim() || 'Default'}</div>
            ${lensName ? `<div style="font-size: 11px; color: #0284c7; font-weight: bold; margin-top: 3px;">👓 Lens: ${lensName}</div>` : ''}
            ${rxPower ? `<div style="font-size: 11px; font-family: monospace; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; display: inline-block; margin-top: 3px;">Rx: ${rxPower}</div>` : ''}
            ${rxUrl ? `<div style="font-size: 11px; margin-top: 3px;"><a href="${rxUrl}" target="_blank" style="color: #2563eb; text-decoration: underline;">View Doctor Slip</a></div>` : ''}
          </td>
          <td style="padding: 10px; text-align: center; vertical-align: top; font-weight: bold; font-size: 14px;">${item.quantity}</td>
          <td style="padding: 10px; text-align: right; vertical-align: top; font-weight: bold; font-size: 14px; color: #0f172a;">৳${Number(item.unit_price || 0).toLocaleString()}</td>
        </tr>
        `;
    }).join('');

    return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 650px; background: #ffffff; color: #0f172a; line-height: 1.5; padding: 16px; border: 1px solid #e2e8f0; border-radius: 12px;">
      <div style="border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: baseline;">
        <div>
          <h2 style="margin: 0 0 4px 0; font-size: 20px; font-weight: 800; color: #0f172a;">CHOSHMA ZONE ORDER</h2>
          <p style="margin: 0; font-size: 12px; font-family: monospace; color: #64748b;">Order ID: #${order.id}</p>
        </div>
        <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; background: #e0f2fe; color: #0369a1; padding: 4px 10px; border-radius: 9999px;">
          ${order.status}
        </div>
      </div>

      <div style="display: flex; gap: 12px; margin-bottom: 16px;">
        <div style="flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px;">
          <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 6px;">Customer Information</div>
          <div style="font-size: 13px; font-weight: 600; color: #0f172a;">${name}</div>
          <div style="font-size: 13px; color: #334155; margin-top: 2px;">Phone: <strong>${phone}</strong></div>
          <div style="font-size: 12px; color: #64748b; margin-top: 2px;">Email: ${email}</div>
        </div>

        <div style="flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px;">
          <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 6px;">Shipping Address</div>
          <div style="font-size: 13px; color: #0f172a; line-height: 1.4;">${fullAddrHtml}</div>
        </div>
      </div>

      <div style="margin-bottom: 16px;">
        <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 8px;">Order Items</div>
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
          <thead>
            <tr style="background: #f1f5f9; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; text-align: left;">
              <th style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0;">Image</th>
              <th style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0;">Details</th>
              <th style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-align: center;">Qty</th>
              <th style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-align: right;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRowsHtml}
          </tbody>
        </table>
      </div>

      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px;">
        <table style="width: 100%; font-size: 13px;">
          <tr>
            <td style="color: #64748b; padding: 2px 0;">Subtotal:</td>
            <td style="text-align: right; font-weight: 600; padding: 2px 0;">৳${subtotal.toLocaleString()}</td>
          </tr>
          <tr>
            <td style="color: #64748b; padding: 2px 0;">Shipping:</td>
            <td style="text-align: right; font-weight: 600; padding: 2px 0;">৳${deliveryCharge.toLocaleString()}</td>
          </tr>
          <tr style="border-top: 1px solid #cbd5e1;">
            <td style="font-size: 15px; font-weight: 800; color: #0f172a; padding: 6px 0 0 0;">Total Amount:</td>
            <td style="font-size: 15px; font-weight: 800; color: #0284c7; text-align: right; padding: 6px 0 0 0;">৳${Number(order.total_amount || 0).toLocaleString()}</td>
          </tr>
          <tr>
            <td style="font-size: 12px; color: #64748b; padding: 4px 0 0 0;">Payment:</td>
            <td style="font-size: 12px; font-weight: 600; text-transform: uppercase; text-align: right; padding: 4px 0 0 0;">${order.payment_method || 'COD'}</td>
          </tr>
        </table>
      </div>
    </div>
    `;
};

const AdminOrders = () => {
    const { showToast } = useToast();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);
    const [selectedOrders, setSelectedOrders] = useState([]);
    const [isProcessingBulk, setIsProcessingBulk] = useState(false);
    const [isTestingTelegram, setIsTestingTelegram] = useState(false);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const data = await orderParams.fetchAll();
            setOrders(data);
        } catch (err) {
            console.error(err);
            setError('Failed to fetch orders: ' + (err.message || 'Unknown error'));
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (orderId, newStatus) => {
        try {
            await orderParams.updateStatus(orderId, newStatus);
            // Update local state
            setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        } catch (err) {
            alert('Failed to update status');
        }
    };

    const handleDelete = async (orderId) => {
        if (!window.confirm('Are you sure you want to PERMANENTLY delete this order? This cannot be undone.')) return;

        try {
            await orderParams.delete(orderId);
            setOrders(orders.filter(o => o.id !== orderId));
        } catch (err) {
            console.error('Delete error:', err);
            alert('Failed to delete order. ' + (err.message || ''));
        }
    };

    const openOrderDetails = (order) => {
        setSelectedOrder(order);
        setIsModalOpen(true);
    };

    const closeOrderDetails = () => {
        setIsModalOpen(false);
        setSelectedOrder(null);
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedOrders(orders.map(o => o.id));
        } else {
            setSelectedOrders([]);
        }
    };

    const handleSelectOrder = (orderId) => {
        setSelectedOrders(prev => 
            prev.includes(orderId) 
                ? prev.filter(id => id !== orderId)
                : [...prev, orderId]
        );
    };

    const handleBulkStatusChange = async (newStatus) => {
        if (!window.confirm(`Are you sure you want to change the status of ${selectedOrders.length} orders to '${newStatus}'?`)) return;
        
        setIsProcessingBulk(true);
        try {
            await Promise.all(selectedOrders.map(id => orderParams.updateStatus(id, newStatus)));
            setOrders(orders.map(o => selectedOrders.includes(o.id) ? { ...o, status: newStatus } : o));
            setSelectedOrders([]);
        } catch (err) {
            alert('Failed to update statuses of some orders.');
            fetchOrders();
        } finally {
            setIsProcessingBulk(false);
        }
    };

    const handleBulkDelete = async () => {
        if (!window.confirm(`Are you sure you want to PERMANENTLY delete ${selectedOrders.length} orders? This cannot be undone.`)) return;

        setIsProcessingBulk(true);
        try {
            await Promise.all(selectedOrders.map(id => orderParams.delete(id)));
            setOrders(orders.filter(o => !selectedOrders.includes(o.id)));
            setSelectedOrders([]);
        } catch (err) {
            console.error('Bulk delete error:', err);
            alert('Failed to delete some orders.');
            fetchOrders();
        } finally {
            setIsProcessingBulk(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error) return (
        <div className="p-8 bg-red-50 text-red-600 rounded-2xl border border-red-100 font-outfit text-center">
            {error}
        </div>
    );

    const getItemImage = (item) => {
        if (item.style && item.style !== 'Default' && item.products?.variants) {
            const variant = item.products.variants.find(v => {
                const parts = [];
                if (v.color) parts.push(v.color);
                if (v.size) parts.push(v.size);
                return parts.join(', ') === item.style;
            });
            if (variant && variant.image_url) {
                return variant.image_url;
            }
        }
        return item.products?.image_url;
    };

    const copyImageDirectly = async (imageUrl, productName = 'Product') => {
        if (!imageUrl) {
            showToast('No image available to copy', 'error');
            return;
        }

        try {
            // Attempt fetching blob and convert to image/png for ClipboardItem
            const res = await fetch(imageUrl);
            const blob = await res.blob();

            let pngBlob = blob;
            if (blob.type !== 'image/png') {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                const blobUrl = URL.createObjectURL(blob);
                await new Promise((resolve, reject) => {
                    img.onload = () => resolve();
                    img.onerror = () => reject(new Error('Failed to load blob as image'));
                    img.src = blobUrl;
                });
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth || img.width;
                canvas.height = img.naturalHeight || img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                URL.revokeObjectURL(blobUrl);
                pngBlob = await new Promise((res) => canvas.toBlob(res, 'image/png'));
            }

            if (pngBlob && navigator.clipboard && window.ClipboardItem) {
                await navigator.clipboard.write([
                    new ClipboardItem({ 'image/png': pngBlob })
                ]);
                showToast(`Product image for "${productName}" copied to clipboard!`, 'success');
                return true;
            }
        } catch (blobErr) {
            console.warn('Direct blob copy failed, attempting canvas fallback:', blobErr);
            try {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                await new Promise((resolve, reject) => {
                    img.onload = () => resolve();
                    img.onerror = () => reject(new Error('Canvas image load failed'));
                    img.src = imageUrl;
                });
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth || img.width;
                canvas.height = img.naturalHeight || img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                const pngBlob = await new Promise((res) => canvas.toBlob(res, 'image/png'));
                if (pngBlob && navigator.clipboard && window.ClipboardItem) {
                    await navigator.clipboard.write([
                        new ClipboardItem({ 'image/png': pngBlob })
                    ]);
                    showToast(`Product image for "${productName}" copied to clipboard!`, 'success');
                    return true;
                }
            } catch (canvasErr) {
                console.warn('Canvas fallback failed:', canvasErr);
            }
        }

        // Fallback: Copy HTML <img> tag + URL so pasting in rich text or chat embeds it
        try {
            const html = `<img src="${imageUrl}" alt="${productName}" />`;
            if (navigator.clipboard && window.ClipboardItem) {
                await navigator.clipboard.write([
                    new ClipboardItem({
                        'text/html': new Blob([html], { type: 'text/html' }),
                        'text/plain': new Blob([imageUrl], { type: 'text/plain' })
                    })
                ]);
                showToast(`Product image copied to clipboard!`, 'success');
                return true;
            }
            await navigator.clipboard.writeText(imageUrl);
            showToast(`Product image link copied!`, 'info');
            return true;
        } catch (e) {
            showToast('Failed to copy image', 'error');
            return false;
        }
    };

    const handleCopyFullOrder = async (order) => {
        if (!order) return;
        try {
            const plainText = generateFullOrderText(order, getItemImage);
            const htmlContent = generateFullOrderHtml(order, getItemImage);

            if (navigator.clipboard && window.ClipboardItem) {
                try {
                    const textBlob = new Blob([plainText], { type: 'text/plain' });
                    const htmlBlob = new Blob([htmlContent], { type: 'text/html' });
                    await navigator.clipboard.write([
                        new ClipboardItem({
                            'text/html': htmlBlob,
                            'text/plain': textBlob
                        })
                    ]);
                    showToast('All order details & product images copied to clipboard!', 'success');
                    return;
                } catch (clipboardErr) {
                    console.warn('ClipboardItem write failed, fallback to writeText:', clipboardErr);
                }
            }

            // Fallback to text copy
            await navigator.clipboard.writeText(plainText);
            showToast('All order details copied as formatted text!', 'success');
        } catch (err) {
            console.error('Error copying full order:', err);
            showToast('Failed to copy order details', 'error');
        }
    };

    const handleCopyCourier = async (order) => {
        if (!order) return;
        try {
            const courierText = formatCourierText(order);
            await navigator.clipboard.writeText(courierText);
            showToast('Courier booking details copied! (Name, Phone, Address, COD)', 'success');
        } catch (err) {
            showToast('Failed to copy courier details', 'error');
        }
    };

    const handleTestTelegram = async () => {
        setIsTestingTelegram(true);
        try {
            const res = await testTelegramNotification();
            alert(res.message);
        } catch (e) {
            alert('Failed to send test notification: ' + e.message);
        } finally {
            setIsTestingTelegram(false);
        }
    };

    return (
        <div className="animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div>
                    <h1 className="text-3xl font-bold text-text-main font-outfit uppercase tracking-tight">Order Management</h1>
                    <p className="text-text-muted font-outfit">Review and manage all customer transactions.</p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    <button 
                        onClick={handleTestTelegram}
                        disabled={isTestingTelegram}
                        title="Send a test notification to your phone via Telegram Bot"
                        className="flex items-center gap-2 px-5 py-3 bg-blue-50 border border-blue-200 text-blue-600 rounded-xl text-sm font-bold hover:bg-blue-100 transition-all font-outfit uppercase tracking-widest shadow-sm disabled:opacity-50"
                    >
                        <Bell size={16} className={isTestingTelegram ? 'animate-bounce' : ''} />
                        {isTestingTelegram ? 'Sending Test...' : 'Test Phone Alert'}
                    </button>
                    <button className="p-3 bg-white border border-border rounded-xl text-text-muted hover:text-text-main transition-colors">
                        <Search size={20} />
                    </button>
                    <button className="flex items-center gap-2 px-6 py-3 bg-white border border-border rounded-xl text-sm font-bold text-text-main hover:bg-gray-50 transition-all font-outfit uppercase tracking-widest shadow-sm">
                        <Filter size={16} />
                        Filter
                    </button>
                </div>
            </div>

            {selectedOrders.length > 0 && (
                <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 mb-6 flex flex-wrap items-center justify-between gap-4 animate-in slide-in-from-top-4">
                    <span className="text-sm font-bold text-primary font-outfit">
                        {isProcessingBulk ? 'Processing...' : `${selectedOrders.length} order(s) selected`}
                    </span>
                    <div className="flex items-center gap-3">
                        <select
                            onChange={(e) => {
                                if(e.target.value) {
                                    handleBulkStatusChange(e.target.value);
                                    e.target.value = '';
                                }
                            }}
                            disabled={isProcessingBulk}
                            className="bg-white border border-border rounded-lg px-3 py-2 text-sm font-outfit outline-none focus:border-primary disabled:opacity-50"
                        >
                            <option value="">Change Status...</option>
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                        <button
                            onClick={handleBulkDelete}
                            disabled={isProcessingBulk}
                            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-bold font-outfit disabled:opacity-50"
                        >
                            {isProcessingBulk ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-red-600"></div>
                            ) : (
                                <Trash2 size={16} />
                            )}
                            Delete Selected
                        </button>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-3xl border border-border/50 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-border/50">
                                <th className="pl-6 py-5 w-10">
                                    <input 
                                        type="checkbox" 
                                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                        onChange={handleSelectAll}
                                        checked={orders.length > 0 && selectedOrders.length === orders.length}
                                    />
                                </th>
                                <th className="px-6 py-5 text-xs font-bold text-text-muted uppercase tracking-[0.2em] font-outfit">Order ID</th>
                                <th className="px-6 py-5 text-xs font-bold text-text-muted uppercase tracking-[0.2em] font-outfit">Customer</th>
                                <th className="px-6 py-5 text-xs font-bold text-text-muted uppercase tracking-[0.2em] font-outfit">Amount</th>
                                <th className="px-6 py-5 text-xs font-bold text-text-muted uppercase tracking-[0.2em] font-outfit">Status</th>
                                <th className="px-6 py-5 text-xs font-bold text-text-muted uppercase tracking-[0.2em] font-outfit">Date</th>
                                <th className="px-6 py-5 text-xs font-bold text-text-muted uppercase tracking-[0.2em] font-outfit text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                            {orders.map(order => (
                                <tr 
                                    key={order.id} 
                                    onClick={() => openOrderDetails(order)}
                                    className={`transition-all duration-200 cursor-pointer group ${
                                        selectedOrders.includes(order.id) 
                                            ? 'bg-primary/5 hover:bg-primary/10' 
                                            : 'hover:bg-amber-50/40 hover:shadow-xs'
                                    }`}
                                >
                                    <td className="pl-6 py-5" onClick={(e) => e.stopPropagation()}>
                                        <input 
                                            type="checkbox"
                                            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                            checked={selectedOrders.includes(order.id)}
                                            onChange={() => handleSelectOrder(order.id)}
                                        />
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-mono font-bold text-text-main group-hover:text-primary transition-colors uppercase">
                                                #{order.id.slice(0, 8)}
                                            </span>
                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Eye size={11} /> View
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-text-main font-outfit group-hover:text-primary transition-colors">
                                                {order.shipping_address?.first_name} {order.shipping_address?.last_name}
                                            </span>
                                            <div className="flex items-center gap-1.5 text-xs text-text-muted font-outfit">
                                                <span>{order.shipping_address?.phone || order.shipping_address?.email || 'Guest Customer'}</span>
                                                {order.shipping_address?.phone && (
                                                    <CopyButton
                                                        text={order.shipping_address.phone}
                                                        title="Copy Phone"
                                                        iconSize={11}
                                                        className="text-text-muted hover:text-primary p-0.5 rounded transition-colors"
                                                        onCopySuccess={() => showToast('Phone number copied!', 'success')}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col">
                                            <span className="text-base font-bold text-primary font-outfit">৳{Number(order.total_amount || 0).toLocaleString()}</span>
                                            <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{order.payment_method}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5" onClick={(e) => e.stopPropagation()}>
                                        <select
                                            value={order.status}
                                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                            className={`
                                                text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border-none outline-none cursor-pointer shadow-xs transition-transform hover:scale-105
                                                ${getStatusStyles(order.status)}
                                            `}
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="processing">Processing</option>
                                            <option value="shipped">Shipped</option>
                                            <option value="completed">Completed</option>
                                            <option value="cancelled">Cancelled</option>
                                        </select>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="text-sm text-text-main font-outfit">
                                            {new Date(order.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-right" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => openOrderDetails(order)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-xl text-xs font-bold font-outfit uppercase tracking-wider transition-all shadow-xs group/btn"
                                                title="View Order Details"
                                            >
                                                <Eye size={14} className="group-hover/btn:scale-110 transition-transform" />
                                                <span>Details</span>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(order.id)}
                                                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                                title="Delete Order"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Order Details Modal */}
            {isModalOpen && selectedOrder && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
                    <div
                        className="absolute inset-0 bg-text-main/60 backdrop-blur-md animate-in fade-in duration-300"
                        onClick={closeOrderDetails}
                    ></div>

                    <div className="relative bg-white w-full max-w-5xl max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 slide-in-from-bottom-8 duration-500">
                        {/* Modal Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-8 py-6 border-b border-border/50 gap-4">
                            <div>
                                <div className="flex items-center gap-3 mb-1 flex-wrap">
                                    <h2 className="text-2xl font-bold text-text-main font-outfit uppercase tracking-tight">Order Details</h2>
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${getStatusStyles(selectedOrder.status)}`}>
                                        {selectedOrder.status}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <p className="text-sm font-mono text-text-muted">Order ID: #{selectedOrder.id}</p>
                                    <CopyButton
                                        text={selectedOrder.id}
                                        title="Copy Full Order ID"
                                        iconSize={13}
                                        className="p-1 hover:bg-gray-100 rounded-md text-text-muted hover:text-primary transition-colors"
                                        onCopySuccess={() => showToast('Order ID copied!', 'success')}
                                    />
                                </div>
                            </div>

                            {/* Header Copy Actions */}
                            <div className="flex items-center gap-2.5 flex-wrap">
                                <button
                                    type="button"
                                    onClick={() => handleCopyFullOrder(selectedOrder)}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-xs font-bold font-outfit uppercase tracking-wider hover:bg-primary/90 shadow-md hover:shadow-lg transition-all cursor-pointer group active:scale-95"
                                    title="Copy all information with product image"
                                >
                                    <Copy size={14} className="group-hover:scale-110 transition-transform" />
                                    <span>Copy Full Order (with Image)</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleCopyCourier(selectedOrder)}
                                    className="flex items-center gap-1.5 px-3.5 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 rounded-xl text-xs font-bold font-outfit uppercase tracking-wider transition-all cursor-pointer active:scale-95"
                                    title="Copy formatted for Courier (Steadfast / Pathao / RedX)"
                                >
                                    <Truck size={14} className="text-amber-700" />
                                    <span className="hidden sm:inline">Courier Copy</span>
                                </button>
                                <button
                                    onClick={closeOrderDetails}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors group ml-1"
                                >
                                    <X size={24} className="text-text-muted group-hover:text-text-main" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-8 md:p-10 custom-scrollbar">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                                {/* Left Column: Customer & Shipping */}
                                <div className="lg:col-span-1 space-y-8">
                                    <section>
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2 text-primary">
                                                <User size={18} />
                                                <h3 className="text-sm font-bold uppercase tracking-widest font-outfit">Customer Information</h3>
                                            </div>
                                            <CopyButton
                                                text={`Name: ${selectedOrder.shipping_address?.first_name || ''} ${selectedOrder.shipping_address?.last_name || ''}\nPhone: ${selectedOrder.shipping_address?.phone || 'N/A'}\nEmail: ${selectedOrder.shipping_address?.email || 'N/A'}`}
                                                title="Copy Customer Info"
                                                label="Copy All"
                                                className="text-[11px] font-bold text-primary hover:text-primary/80 bg-primary/10 hover:bg-primary/20 px-2.5 py-1 rounded-lg font-outfit"
                                                onCopySuccess={() => showToast('Customer info copied!', 'success')}
                                            />
                                        </div>
                                        <div className="bg-background-alt/50 rounded-2xl p-5 space-y-3">
                                            <div className="flex items-center justify-between group/row">
                                                <div className="flex items-start gap-3">
                                                    <div className="p-2 bg-white rounded-lg border border-border/50 text-text-muted">
                                                        <User size={14} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] uppercase tracking-widest text-text-muted font-bold mb-0.5">Name</p>
                                                        <p className="text-sm font-bold text-text-main font-outfit">
                                                            {selectedOrder.shipping_address?.first_name} {selectedOrder.shipping_address?.last_name}
                                                        </p>
                                                    </div>
                                                </div>
                                                <CopyButton
                                                    text={`${selectedOrder.shipping_address?.first_name || ''} ${selectedOrder.shipping_address?.last_name || ''}`.trim()}
                                                    title="Copy Name"
                                                    iconSize={13}
                                                    className="p-1.5 text-text-muted hover:text-primary hover:bg-white rounded-lg transition-all"
                                                    onCopySuccess={() => showToast('Customer name copied!', 'success')}
                                                />
                                            </div>
                                            <div className="flex items-center justify-between group/row">
                                                <div className="flex items-start gap-3">
                                                    <div className="p-2 bg-white rounded-lg border border-border/50 text-text-muted">
                                                        <Mail size={14} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] uppercase tracking-widest text-text-muted font-bold mb-0.5">Email</p>
                                                        <p className="text-sm font-outfit text-text-main">{selectedOrder.shipping_address?.email || 'N/A'}</p>
                                                    </div>
                                                </div>
                                                {selectedOrder.shipping_address?.email && (
                                                    <CopyButton
                                                        text={selectedOrder.shipping_address.email}
                                                        title="Copy Email"
                                                        iconSize={13}
                                                        className="p-1.5 text-text-muted hover:text-primary hover:bg-white rounded-lg transition-all"
                                                        onCopySuccess={() => showToast('Email copied!', 'success')}
                                                    />
                                                )}
                                            </div>
                                            <div className="flex items-center justify-between group/row">
                                                <div className="flex items-start gap-3">
                                                    <div className="p-2 bg-white rounded-lg border border-border/50 text-text-muted">
                                                        <Phone size={14} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] uppercase tracking-widest text-text-muted font-bold mb-0.5">Phone</p>
                                                        <p className="text-sm font-outfit text-text-main font-bold">{selectedOrder.shipping_address?.phone || 'N/A'}</p>
                                                    </div>
                                                </div>
                                                {selectedOrder.shipping_address?.phone && (
                                                    <CopyButton
                                                        text={selectedOrder.shipping_address.phone}
                                                        title="Copy Phone Number"
                                                        iconSize={13}
                                                        className="p-1.5 text-primary bg-primary/10 hover:bg-primary hover:text-white rounded-lg transition-all shadow-xs"
                                                        onCopySuccess={() => showToast('Phone number copied!', 'success')}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    </section>

                                    <section>
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2 text-primary">
                                                <MapPin size={18} />
                                                <h3 className="text-sm font-bold uppercase tracking-widest font-outfit">Shipping Address</h3>
                                            </div>
                                            <CopyButton
                                                text={formatShippingAddress(selectedOrder.shipping_address)}
                                                title="Copy Full Shipping Address"
                                                label="Copy Address"
                                                className="text-[11px] font-bold text-primary hover:text-primary/80 bg-primary/10 hover:bg-primary/20 px-2.5 py-1 rounded-lg font-outfit"
                                                onCopySuccess={() => showToast('Shipping address copied!', 'success')}
                                            />
                                        </div>
                                        <div className="bg-background-alt/50 rounded-2xl p-5 space-y-3 font-outfit relative">
                                            <p className="text-sm text-text-main leading-relaxed">
                                                {selectedOrder.shipping_address?.address}<br />
                                                {selectedOrder.shipping_address?.thana && `${selectedOrder.shipping_address.thana}, `}
                                                {selectedOrder.shipping_address?.district}<br />
                                                {selectedOrder.shipping_address?.city}, {selectedOrder.shipping_address?.zip}<br />
                                                {selectedOrder.shipping_address?.country}
                                            </p>
                                        </div>
                                    </section>

                                    <section>
                                        <div className="flex items-center gap-2 mb-4 text-primary">
                                            <CreditCard size={18} />
                                            <h3 className="text-sm font-bold uppercase tracking-widest font-outfit">Payment Details</h3>
                                        </div>
                                        <div className="bg-background-alt/50 rounded-2xl p-5 space-y-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] uppercase tracking-widest text-text-muted font-bold">Method</span>
                                                <span className="text-sm font-bold text-text-main uppercase font-outfit">{selectedOrder.payment_method}</span>
                                            </div>
                                            {selectedOrder.payment_details?.bkash_number && (
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[10px] uppercase tracking-widest text-text-muted font-bold">bKash No</span>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-sm font-outfit text-text-main">{selectedOrder.payment_details.bkash_number}</span>
                                                        <CopyButton
                                                            text={selectedOrder.payment_details.bkash_number}
                                                            title="Copy bKash Number"
                                                            iconSize={12}
                                                            className="text-text-muted hover:text-primary p-1"
                                                            onCopySuccess={() => showToast('bKash number copied!', 'success')}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                            {selectedOrder.payment_details?.transaction_id && (
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[10px] uppercase tracking-widest text-text-muted font-bold">TrxID</span>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-sm font-mono text-primary font-bold">{selectedOrder.payment_details.transaction_id}</span>
                                                        <CopyButton
                                                            text={selectedOrder.payment_details.transaction_id}
                                                            title="Copy Transaction ID"
                                                            iconSize={12}
                                                            className="text-primary hover:bg-primary/10 rounded p-1"
                                                            onCopySuccess={() => showToast('Transaction ID copied!', 'success')}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </section>
                                </div>

                                {/* Right Column: Order Items */}
                                <div className="lg:col-span-2 flex flex-col">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2 text-primary">
                                            <Package size={18} />
                                            <h3 className="text-sm font-bold uppercase tracking-widest font-outfit">Order Items</h3>
                                        </div>
                                        <span className="text-xs text-text-muted font-outfit">
                                            {selectedOrder.order_items?.length || 0} item(s)
                                        </span>
                                    </div>

                                    <div className="flex-1 bg-white border border-border/50 rounded-3xl overflow-hidden shadow-sm">
                                        <table className="w-full text-left border-collapse">
                                            <thead className="bg-gray-50/50">
                                                <tr>
                                                    <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest font-outfit">Product</th>
                                                    <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest font-outfit">Configuration / Lenses</th>
                                                    <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest font-outfit text-center">Qty</th>
                                                    <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest font-outfit text-right">Price</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border/30">
                                                {selectedOrder.order_items?.map((item) => {
                                                    const urlMatch = item.style?.match(/\[URL:\s*([^\]]+)\]/);
                                                    const rxUrl = urlMatch ? urlMatch[1].trim() : '';
                                                    const isWhatsApp = item.style?.includes('WhatsApp Follow-up');
                                                    const rxPowerMatch = item.style?.match(/\[Rx:\s*([^\]]+)\]/);
                                                    const rxPower = rxPowerMatch ? rxPowerMatch[1].trim() : '';
                                                    const lensMatch = item.style?.match(/Lens:\s*([^|(\[]+)/);
                                                    const lensName = lensMatch ? lensMatch[1].trim() : '';
                                                    const itemImg = getItemImage(item);

                                                    return (
                                                    <tr key={item.id} className="group hover:bg-gray-50/50 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                {/* Image with direct copy button */}
                                                                <div className="relative group/thumb shrink-0">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            if (itemImg) setPreviewImage(itemImg);
                                                                        }}
                                                                        className="w-14 h-14 bg-white rounded-xl border border-border/50 flex items-center justify-center p-1.5 shadow-sm hover:scale-105 hover:shadow-md transition-all duration-300 cursor-pointer overflow-hidden group/img"
                                                                        title="Click to zoom image"
                                                                    >
                                                                        {itemImg ? (
                                                                            <img
                                                                                src={itemImg}
                                                                                alt={item.products?.name}
                                                                                className="w-full h-full object-contain mix-blend-multiply group-hover/img:scale-110 transition-transform duration-500"
                                                                            />
                                                                        ) : (
                                                                            <Package size={20} className="text-gray-300" />
                                                                        )}
                                                                    </button>
                                                                    {itemImg && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                copyImageDirectly(itemImg, item.products?.name);
                                                                            }}
                                                                            title="Copy product image to clipboard"
                                                                            className="absolute -bottom-1 -right-1 p-1 bg-white hover:bg-primary hover:text-white text-text-muted rounded-md shadow-md border border-border/60 transition-all hover:scale-110 cursor-pointer"
                                                                        >
                                                                            <ImageIcon size={11} />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <span className="text-sm font-bold text-text-main font-outfit max-w-[150px] line-clamp-2">
                                                                            {item.products?.name || <span className="text-text-muted italic">Deleted Product</span>}
                                                                        </span>
                                                                        <CopyButton
                                                                            text={`${item.products?.name || 'Product'} (${item.style?.split('|')[0]?.trim() || 'Default'}) - Qty: ${item.quantity} - ৳${item.unit_price}${itemImg ? ` - Image: ${itemImg}` : ''}`}
                                                                            title="Copy Product Details"
                                                                            iconSize={12}
                                                                            className="p-1 text-text-muted hover:text-primary rounded hover:bg-gray-100 transition-colors"
                                                                            onCopySuccess={() => showToast('Product info copied!', 'success')}
                                                                        />
                                                                    </div>
                                                                    {itemImg && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => copyImageDirectly(itemImg, item.products?.name)}
                                                                            className="text-[10px] text-primary/80 hover:text-primary text-left font-outfit flex items-center gap-1 mt-0.5 cursor-pointer"
                                                                        >
                                                                            <Copy size={9} /> Copy Image
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="space-y-1.5 font-outfit max-w-xs">
                                                                <div className="text-xs text-text-muted">
                                                                    {item.style?.split('|')[0]?.trim() || 'Default'}
                                                                </div>

                                                                {lensName && (
                                                                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                                                                        <span className="text-[10px] font-bold px-2 py-0.5 bg-primary/10 text-primary rounded-md border border-primary/20">
                                                                            👓 {lensName}
                                                                        </span>
                                                                    </div>
                                                                )}

                                                                {rxUrl && (
                                                                    <div className="flex items-center gap-1.5">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setPreviewImage(rxUrl)}
                                                                            className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                                                                        >
                                                                            <span>🔍 View Doctor Slip</span>
                                                                        </button>
                                                                        <CopyButton
                                                                            text={rxUrl}
                                                                            title="Copy Doctor Slip Link"
                                                                            iconSize={11}
                                                                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                                                            onCopySuccess={() => showToast('Doctor slip link copied!', 'success')}
                                                                        />
                                                                    </div>
                                                                )}

                                                                {rxPower && (
                                                                    <div className="text-[10px] font-mono bg-gray-100 p-1.5 rounded-md border border-gray-200 text-gray-800 leading-tight">
                                                                        {rxPower}
                                                                    </div>
                                                                )}

                                                                {isWhatsApp && selectedOrder.shipping_address?.phone && (
                                                                    <a
                                                                        href={`https://wa.me/88${selectedOrder.shipping_address.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${selectedOrder.shipping_address?.first_name || 'there'}, regarding your Choshma Zone order #${selectedOrder.id.slice(0, 8)}, please send your prescription slip photo.`)}`}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="inline-flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-50 border border-green-200 hover:bg-green-100 px-2 py-1 rounded-lg transition-colors"
                                                                    >
                                                                        <span>💬 Chat on WhatsApp for Rx</span>
                                                                    </a>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <span className="text-sm font-bold text-text-main font-outfit">{item.quantity}</span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <span className="text-sm font-bold text-text-main font-outfit">৳{item.unit_price.toLocaleString()}</span>
                                                        </td>
                                                    </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>

                                        {/* Order Summary Footer */}
                                        <div className="bg-gray-50/50 p-6 md:p-8 border-t border-border/50">
                                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                                <div className="flex items-center gap-2 self-start sm:self-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleCopyFullOrder(selectedOrder)}
                                                        className="flex items-center gap-1.5 px-3.5 py-2 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-xl text-xs font-bold font-outfit uppercase tracking-wider transition-all cursor-pointer"
                                                        title="Copy all information with images"
                                                    >
                                                        <Copy size={13} />
                                                        <span>Copy Full Summary</span>
                                                    </button>
                                                </div>

                                                <div className="flex flex-col items-end gap-2.5 font-outfit w-full sm:w-auto">
                                                    <div className="flex justify-between w-full sm:w-[240px] text-sm text-text-muted">
                                                        <span>Subtotal</span>
                                                        <span className="font-bold text-text-main">৳{(selectedOrder.total_amount - calculateDeliveryCharge(selectedOrder.shipping_address?.district)).toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex justify-between w-full sm:w-[240px] text-sm text-text-muted">
                                                        <span>Shipping</span>
                                                        <span className="font-bold text-text-main">৳{calculateDeliveryCharge(selectedOrder.shipping_address?.district).toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex justify-between w-full sm:w-[280px] text-xl font-bold text-text-main pt-2.5 mt-1 border-t border-border/50 uppercase tracking-tight">
                                                        <span>Total Amount</span>
                                                        <span className="text-primary">৳{selectedOrder.total_amount.toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Image Preview Modal */}
            {previewImage && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300"
                        onClick={() => setPreviewImage(null)}
                    ></div>
                    <div className="relative max-w-[90vw] max-h-[90vh] animate-in zoom-in-95 duration-300">
                        <button
                            onClick={() => setPreviewImage(null)}
                            className="absolute -top-12 right-0 p-2 text-white hover:text-primary transition-colors bg-white/10 hover:bg-white rounded-full"
                        >
                            <X size={20} />
                        </button>
                        <img
                            src={previewImage}
                            alt="Product Preview"
                            className="rounded-3xl shadow-2xl max-h-[80vh] object-contain bg-white p-4"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

const getStatusStyles = (status) => {
    switch (status) {
        case 'pending': return 'bg-amber-100 text-amber-700';
        case 'processing': return 'bg-blue-100 text-blue-700';
        case 'shipped': return 'bg-indigo-100 text-indigo-700';
        case 'completed': return 'bg-green-100 text-green-700';
        case 'cancelled': return 'bg-red-100 text-red-700';
        default: return 'bg-gray-100 text-gray-700';
    }
};

export default AdminOrders;
