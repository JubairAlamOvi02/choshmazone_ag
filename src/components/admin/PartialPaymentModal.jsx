import React, { useState, useEffect } from 'react';
import { X, DollarSign, CreditCard, Check, AlertCircle, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

const PartialPaymentModal = ({
    isOpen,
    onClose,
    order,
    onSave,
    onSkip
}) => {
    const { showToast } = useToast();
    const [paidAmount, setPaidAmount] = useState('');
    const [method, setMethod] = useState('bKash');
    const [senderNumber, setSenderNumber] = useState('');
    const [transactionId, setTransactionId] = useState('');
    const [notes, setNotes] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen && order) {
            const existingDetails = order.payment_details || {};
            setPaidAmount(existingDetails.paid_amount != null ? String(existingDetails.paid_amount) : '');
            setMethod(order.payment_method || existingDetails.channel || 'bKash');
            setSenderNumber(existingDetails.bkash_number || existingDetails.sender_number || '');
            setTransactionId(existingDetails.transaction_id || '');
            setNotes(existingDetails.partial_payment_note || '');
        }
    }, [isOpen, order]);

    if (!isOpen || !order) return null;

    const total = Number(order.total_amount || 0);
    const paidNum = Math.max(0, Number(paidAmount) || 0);
    const remainingDue = Math.max(0, total - paidNum);

    const handleQuickAmount = (amount) => {
        const amt = Math.min(total, Math.max(0, amount));
        setPaidAmount(String(amt));
    };

    const handleSave = async (e) => {
        if (e) e.preventDefault();

        if (paidNum <= 0 && !window.confirm('The paid advance amount is set to ৳0. Do you want to proceed with ৳0 advance?')) {
            return;
        }

        try {
            setIsSaving(true);
            const paymentUpdates = {
                paid_amount: paidNum,
                due_amount: remainingDue,
                is_partial: true,
                partial_method: method,
                sender_number: senderNumber.trim(),
                transaction_id: transactionId.trim(),
                partial_payment_note: notes.trim(),
                partial_recorded_at: new Date().toISOString()
            };

            if (method.toLowerCase().includes('bkash')) {
                paymentUpdates.bkash_number = senderNumber.trim();
            }

            await onSave(order.id, paymentUpdates);
            showToast(`Partial payment of ৳${paidNum.toLocaleString()} recorded! Remaining COD: ৳${remainingDue.toLocaleString()}`, 'success');
            onClose();
        } catch (err) {
            console.error('Failed to save partial payment:', err);
            showToast('Failed to save partial payment: ' + (err.message || 'Unknown error'), 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-[2rem] max-w-lg w-full shadow-2xl border border-border relative overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-border/60 bg-gradient-to-r from-purple-50/60 to-white">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center shadow-inner font-extrabold text-lg">
                            ৳
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-text-main font-outfit uppercase tracking-tight flex items-center gap-2">
                                <span>Record Partial Payment</span>
                            </h2>
                            <p className="text-xs text-text-muted font-outfit">
                                Order #{String(order.id).slice(0, 8)} • {order.shipping_address?.first_name || 'Customer'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-text-muted hover:text-text-main hover:bg-gray-100 rounded-xl transition-colors"
                        title="Close"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body Form */}
                <form onSubmit={handleSave} className="p-6 space-y-5">
                    {/* Calculation Summary Card */}
                    <div className="bg-gradient-to-br from-purple-50/70 via-indigo-50/40 to-slate-50 border border-purple-200/60 rounded-2xl p-4">
                        <div className="grid grid-cols-3 gap-2 text-center divide-x divide-purple-200/60">
                            <div>
                                <span className="text-[10px] uppercase font-bold text-text-muted block">Total Order</span>
                                <span className="text-base font-extrabold text-text-main font-outfit">
                                    ৳{total.toLocaleString()}
                                </span>
                            </div>
                            <div>
                                <span className="text-[10px] uppercase font-bold text-purple-700 block">Advance Paid</span>
                                <span className="text-base font-extrabold text-purple-700 font-outfit">
                                    ৳{paidNum.toLocaleString()}
                                </span>
                            </div>
                            <div>
                                <span className="text-[10px] uppercase font-bold text-amber-700 block">Remaining COD</span>
                                <span className="text-base font-extrabold text-amber-700 font-outfit">
                                    ৳{remainingDue.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Paid Amount Input */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="text-xs font-bold text-text-main font-outfit uppercase tracking-wider">
                                Paid Advance Amount (৳) <span className="text-red-500">*</span>
                            </label>
                            <span className="text-[11px] text-text-muted font-outfit">
                                Total: ৳{total.toLocaleString()}
                            </span>
                        </div>
                        <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted font-bold">৳</span>
                            <input
                                type="number"
                                min="0"
                                max={total}
                                step="1"
                                placeholder="Enter advance amount (e.g. 200)"
                                value={paidAmount}
                                onChange={(e) => setPaidAmount(e.target.value)}
                                className="w-full bg-white border border-border rounded-xl pl-8 pr-4 py-2.5 text-base font-bold font-outfit text-text-main outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
                                required
                                autoFocus
                            />
                        </div>

                        {/* Quick Presets */}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                            {[150, 200, 300, 500, Math.round(total / 2)].map((presetAmt) => (
                                <button
                                    type="button"
                                    key={presetAmt}
                                    onClick={() => handleQuickAmount(presetAmt)}
                                    className="px-2.5 py-1 bg-gray-100 hover:bg-purple-100 text-text-main hover:text-purple-800 rounded-lg text-xs font-bold font-outfit transition-colors cursor-pointer"
                                >
                                    +৳{presetAmt}
                                </button>
                            ))}
                            <button
                                type="button"
                                onClick={() => handleQuickAmount(total)}
                                className="px-2.5 py-1 bg-gray-100 hover:bg-green-100 text-text-main hover:text-green-800 rounded-lg text-xs font-bold font-outfit transition-colors cursor-pointer"
                            >
                                Full (৳{total})
                            </button>
                        </div>
                    </div>

                    {/* Payment Method & TrxID */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-text-main font-outfit uppercase tracking-wider mb-1.5">
                                Payment Channel
                            </label>
                            <select
                                value={method}
                                onChange={(e) => setMethod(e.target.value)}
                                className="w-full bg-white border border-border rounded-xl px-3 py-2 text-sm font-outfit outline-none focus:border-purple-600"
                            >
                                <option value="bKash">bKash</option>
                                <option value="Nagad">Nagad</option>
                                <option value="Rocket">Rocket</option>
                                <option value="Bank Transfer">Bank Transfer</option>
                                <option value="Cash">Cash</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-text-main font-outfit uppercase tracking-wider mb-1.5">
                                TrxID / Transaction ID
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. 9J47AB3..."
                                value={transactionId}
                                onChange={(e) => setTransactionId(e.target.value)}
                                className="w-full bg-white border border-border rounded-xl px-3 py-2 text-sm font-mono text-text-main outline-none focus:border-purple-600"
                            />
                        </div>
                    </div>

                    {/* Sender Phone Number */}
                    <div>
                        <label className="block text-xs font-bold text-text-main font-outfit uppercase tracking-wider mb-1.5">
                            Customer / Sender Mobile Number (Optional)
                        </label>
                        <input
                            type="text"
                            placeholder="01XXXXXXXXX"
                            value={senderNumber}
                            onChange={(e) => setSenderNumber(e.target.value)}
                            className="w-full bg-white border border-border rounded-xl px-3 py-2 text-sm font-outfit outline-none focus:border-purple-600"
                        />
                    </div>

                    {/* Note */}
                    <div>
                        <label className="block text-xs font-bold text-text-main font-outfit uppercase tracking-wider mb-1.5">
                            Payment Note / Remarks (Optional)
                        </label>
                        <input
                            type="text"
                            placeholder="e.g. Delivery charge advance received via bKash personal"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full bg-white border border-border rounded-xl px-3 py-2 text-sm font-outfit outline-none focus:border-purple-600"
                        />
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between pt-3 border-t border-border">
                        <button
                            type="button"
                            onClick={() => {
                                if (onSkip) onSkip();
                                onClose();
                            }}
                            className="text-xs text-text-muted hover:text-text-main underline font-outfit font-medium"
                        >
                            Skip & Set Status Only
                        </button>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 bg-white border border-border text-text-main hover:bg-gray-100 rounded-xl text-xs font-bold font-outfit uppercase"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold font-outfit uppercase tracking-wider transition-all shadow-md disabled:opacity-50 cursor-pointer"
                            >
                                {isSaving ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <Check size={15} />
                                )}
                                <span>Save Payment</span>
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PartialPaymentModal;

