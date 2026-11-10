import React, { useState, useEffect } from 'react';
import { 
    X, Plus, Edit2, Trash2, Check, RotateCcw, Save, Sliders, 
    ArrowUp, ArrowDown, HelpCircle, Palette, Sparkles, AlertCircle 
} from 'lucide-react';
import { 
    STATUS_COLOR_PRESETS, 
    DEFAULT_ORDER_STATUSES, 
    settingsParams 
} from '../../lib/api/settings';
import { useToast } from '../../context/ToastContext';

const OrderStatusManagerModal = ({ 
    isOpen, 
    onClose, 
    currentStatuses = [], 
    onStatusesUpdated 
}) => {
    const { showToast } = useToast();
    const [statuses, setStatuses] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    // New status form state
    const [showAddForm, setShowAddForm] = useState(false);
    const [newLabel, setNewLabel] = useState('');
    const [newId, setNewId] = useState('');
    const [newColor, setNewColor] = useState('purple');
    const [newBgColor, setNewBgColor] = useState('#F3E8FF');
    const [newTextColor, setNewTextColor] = useState('#7E22CE');
    const [newDescription, setNewDescription] = useState('');

    // Editing status state
    const [editingStatusId, setEditingStatusId] = useState(null);
    const [editLabel, setEditLabel] = useState('');
    const [editColor, setEditColor] = useState('blue');
    const [editBgColor, setEditBgColor] = useState('#DBEAFE');
    const [editTextColor, setEditTextColor] = useState('#1D4ED8');
    const [editDescription, setEditDescription] = useState('');

    useEffect(() => {
        if (isOpen) {
            const initial = Array.isArray(currentStatuses) && currentStatuses.length > 0 
                ? JSON.parse(JSON.stringify(currentStatuses)) 
                : JSON.parse(JSON.stringify(DEFAULT_ORDER_STATUSES));
            setStatuses(initial);
            setHasChanges(false);
            setEditingStatusId(null);
            setShowAddForm(false);
        }
    }, [isOpen, currentStatuses]);

    if (!isOpen) return null;

    // Helper: auto-generate slug
    const handleLabelChange = (val) => {
        setNewLabel(val);
        const slug = val
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_+|_+$/g, '');
        setNewId(slug);
    };

    const handleSelectPreset = (presetKey, isEdit = false) => {
        const preset = STATUS_COLOR_PRESETS[presetKey];
        if (!preset) return;
        if (isEdit) {
            setEditColor(presetKey);
            setEditBgColor(preset.bgColor);
            setEditTextColor(preset.textColor);
        } else {
            setNewColor(presetKey);
            setNewBgColor(preset.bgColor);
            setNewTextColor(preset.textColor);
        }
    };

    const handleAddNewStatus = (e) => {
        e.preventDefault();
        const trimmedLabel = newLabel.trim();
        const trimmedId = (newId || trimmedLabel.toLowerCase().replace(/[^a-z0-9]+/g, '_')).trim();

        if (!trimmedLabel) {
            showToast('Please enter a status name.', 'error');
            return;
        }

        if (statuses.some(s => s.id?.toLowerCase() === trimmedId.toLowerCase())) {
            showToast(`A status with identifier "${trimmedId}" already exists.`, 'error');
            return;
        }

        const preset = STATUS_COLOR_PRESETS[newColor] || STATUS_COLOR_PRESETS.purple;
        const newStatusObj = {
            id: trimmedId,
            label: trimmedLabel,
            color: newColor,
            bgColor: newBgColor || preset.bgColor,
            textColor: newTextColor || preset.textColor,
            borderColor: preset.borderColor || '#E9D5FF',
            isDefault: false,
            description: newDescription.trim()
        };

        const updated = [...statuses, newStatusObj];
        setStatuses(updated);
        setHasChanges(true);
        setNewLabel('');
        setNewId('');
        setNewDescription('');
        setShowAddForm(false);
        showToast(`Added "${trimmedLabel}" status! Click "Save Changes" to apply.`, 'success');
    };

    const handleStartEdit = (status) => {
        setEditingStatusId(status.id);
        setEditLabel(status.label);
        setEditColor(status.color || 'blue');
        setEditBgColor(status.bgColor || '#DBEAFE');
        setEditTextColor(status.textColor || '#1D4ED8');
        setEditDescription(status.description || '');
    };

    const handleCancelEdit = () => {
        setEditingStatusId(null);
    };

    const handleSaveEdit = (statusId) => {
        const trimmedLabel = editLabel.trim();
        if (!trimmedLabel) {
            showToast('Status name cannot be empty.', 'error');
            return;
        }

        const preset = STATUS_COLOR_PRESETS[editColor] || STATUS_COLOR_PRESETS.blue;
        const updated = statuses.map(s => {
            if (s.id === statusId) {
                return {
                    ...s,
                    label: trimmedLabel,
                    color: editColor,
                    bgColor: editBgColor || preset.bgColor,
                    textColor: editTextColor || preset.textColor,
                    borderColor: preset.borderColor || '#BFDBFE',
                    description: editDescription.trim()
                };
            }
            return s;
        });

        setStatuses(updated);
        setHasChanges(true);
        setEditingStatusId(null);
        showToast(`Updated "${trimmedLabel}"! Click "Save Changes" to save.`, 'info');
    };

    const handleDeleteStatus = (statusId, label) => {
        if (!window.confirm(`Are you sure you want to remove the status "${label}"? Existing orders with this status will still display their status text.`)) {
            return;
        }

        const updated = statuses.filter(s => s.id !== statusId);
        setStatuses(updated);
        setHasChanges(true);
        showToast(`Removed "${label}" status.`, 'info');
    };

    const handleMove = (index, direction) => {
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= statuses.length) return;
        const updated = [...statuses];
        const [moved] = updated.splice(index, 1);
        updated.splice(targetIndex, 0, moved);
        setStatuses(updated);
        setHasChanges(true);
    };

    const handleResetDefaults = () => {
        if (!window.confirm('Reset all order statuses to the standard system defaults? Any custom added statuses will be restored to initial presets.')) {
            return;
        }
        setStatuses(JSON.parse(JSON.stringify(DEFAULT_ORDER_STATUSES)));
        setHasChanges(true);
        showToast('Reset to default status options. Click "Save Changes" to apply.', 'info');
    };

    const handleSaveAll = async () => {
        try {
            setIsSaving(true);
            await settingsParams.saveOrderStatuses(statuses);
            if (onStatusesUpdated) {
                onStatusesUpdated(statuses);
            }
            setHasChanges(false);
            showToast('Order statuses saved and synchronized successfully!', 'success');
            onClose();
        } catch (err) {
            console.error('Failed to save order statuses:', err);
            showToast('Failed to save order statuses: ' + (err.message || 'Unknown error'), 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-[2rem] max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-border relative overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-border/60 bg-gradient-to-r from-gray-50/80 to-white">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
                            <Sliders size={22} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-text-main font-outfit uppercase tracking-tight flex items-center gap-2">
                                <span>Order Status Settings</span>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-primary/10 text-primary">
                                    {statuses.length} Options
                                </span>
                            </h2>
                            <p className="text-xs text-text-muted font-outfit">
                                Manage and customize available statuses (e.g. Partial Payment, Confirmed, Shipped)
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

                {/* Body */}
                <div className="p-6 overflow-y-auto flex-1 space-y-6">
                    {/* Top Action Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-primary/5 border border-primary/15 rounded-2xl p-4">
                        <div className="flex items-center gap-2 text-xs text-primary font-medium">
                            <Sparkles size={16} className="text-primary shrink-0" />
                            <span>Statuses define the order workflow for dropdowns, bulk actions, and filters.</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setShowAddForm(!showAddForm)}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary text-white rounded-xl text-xs font-bold font-outfit uppercase tracking-wider hover:bg-primary/90 transition-all shadow-sm cursor-pointer"
                            >
                                <Plus size={15} />
                                <span>{showAddForm ? 'Close Form' : 'Add New Status'}</span>
                            </button>
                            <button
                                type="button"
                                onClick={handleResetDefaults}
                                className="inline-flex items-center gap-1 px-3 py-2 bg-white text-text-muted hover:text-text-main border border-border rounded-xl text-xs font-semibold font-outfit transition-colors"
                                title="Reset to standard defaults"
                            >
                                <RotateCcw size={13} />
                                <span className="hidden sm:inline">Reset Defaults</span>
                            </button>
                        </div>
                    </div>

                    {/* Add New Status Form */}
                    {showAddForm && (
                        <form onSubmit={handleAddNewStatus} className="bg-gray-50/90 border border-border rounded-2xl p-5 space-y-4 animate-in slide-in-from-top-3">
                            <div className="flex items-center justify-between pb-2 border-b border-border/60">
                                <h3 className="text-sm font-bold text-text-main font-outfit uppercase tracking-wider flex items-center gap-2">
                                    <Plus size={16} className="text-primary" />
                                    <span>Create New Status Option</span>
                                </h3>
                                {/* Live Badge Preview */}
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-text-muted uppercase font-bold">Badge Preview:</span>
                                    <span 
                                        className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border shadow-2xs font-outfit"
                                        style={{
                                            backgroundColor: newBgColor,
                                            color: newTextColor,
                                            borderColor: STATUS_COLOR_PRESETS[newColor]?.borderColor || '#E2E8F0'
                                        }}
                                    >
                                        {newLabel || 'Preview Status'}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-text-main font-outfit uppercase tracking-wider mb-1.5">
                                        Status Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Partial Payment, On Hold..."
                                        value={newLabel}
                                        onChange={(e) => handleLabelChange(e.target.value)}
                                        className="w-full bg-white border border-border rounded-xl px-3.5 py-2 text-sm font-outfit outline-none focus:border-primary"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-text-main font-outfit uppercase tracking-wider mb-1.5">
                                        System ID / Key
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. partial_payment"
                                        value={newId}
                                        onChange={(e) => setNewId(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                                        className="w-full bg-white border border-border rounded-xl px-3.5 py-2 text-sm font-mono text-text-muted outline-none focus:border-primary"
                                    />
                                </div>
                            </div>

                            {/* Color Preset Palette */}
                            <div>
                                <label className="block text-xs font-bold text-text-main font-outfit uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <Palette size={13} className="text-primary" />
                                    <span>Color Theme Palette</span>
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(STATUS_COLOR_PRESETS).map(([key, preset]) => {
                                        const isSelected = newColor === key;
                                        return (
                                            <button
                                                type="button"
                                                key={key}
                                                onClick={() => handleSelectPreset(key, false)}
                                                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold font-outfit transition-all cursor-pointer ${
                                                    isSelected ? 'ring-2 ring-primary ring-offset-1 scale-105' : 'hover:scale-102 opacity-85 hover:opacity-100'
                                                }`}
                                                style={{
                                                    backgroundColor: preset.bgColor,
                                                    color: preset.textColor,
                                                    borderColor: preset.borderColor
                                                }}
                                            >
                                                {isSelected && <Check size={12} />}
                                                <span>{preset.label.split(' / ')[0]}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-text-main font-outfit uppercase tracking-wider mb-1.5">
                                    Description / Usage Note (Optional)
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. When customer makes a partial advance payment before shipment"
                                    value={newDescription}
                                    onChange={(e) => setNewDescription(e.target.value)}
                                    className="w-full bg-white border border-border rounded-xl px-3.5 py-2 text-sm font-outfit outline-none focus:border-primary"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowAddForm(false)}
                                    className="px-4 py-2 bg-white border border-border text-text-muted hover:text-text-main rounded-xl text-xs font-bold font-outfit uppercase"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 bg-primary text-white rounded-xl text-xs font-bold font-outfit uppercase tracking-wider hover:bg-primary/90 transition-all shadow-sm"
                                >
                                    Add Status
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Status List */}
                    <div className="space-y-2.5">
                        <div className="flex items-center justify-between text-xs font-bold text-text-muted uppercase tracking-wider px-2">
                            <span>Status Option & Color Badge</span>
                            <span>Order & Actions</span>
                        </div>

                        {statuses.map((status, index) => {
                            const isEditing = editingStatusId === status.id;
                            const preset = STATUS_COLOR_PRESETS[status.color] || STATUS_COLOR_PRESETS.blue;

                            if (isEditing) {
                                return (
                                    <div key={status.id} className="bg-amber-50/60 border-2 border-amber-300/80 rounded-2xl p-4 space-y-3 animate-in fade-in">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold font-outfit uppercase text-amber-900">
                                                Editing: {status.id}
                                            </span>
                                            <span 
                                                className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border shadow-2xs"
                                                style={{
                                                    backgroundColor: editBgColor,
                                                    color: editTextColor,
                                                    borderColor: STATUS_COLOR_PRESETS[editColor]?.borderColor || '#E2E8F0'
                                                }}
                                            >
                                                {editLabel || 'Preview'}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-[11px] font-bold uppercase text-text-muted mb-1">
                                                    Display Label
                                                </label>
                                                <input
                                                    type="text"
                                                    value={editLabel}
                                                    onChange={(e) => setEditLabel(e.target.value)}
                                                    className="w-full bg-white border border-border rounded-xl px-3 py-2 text-sm font-outfit outline-none focus:border-primary"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-bold uppercase text-text-muted mb-1">
                                                    Description
                                                </label>
                                                <input
                                                    type="text"
                                                    value={editDescription}
                                                    onChange={(e) => setEditDescription(e.target.value)}
                                                    className="w-full bg-white border border-border rounded-xl px-3 py-2 text-sm font-outfit outline-none focus:border-primary"
                                                />
                                            </div>
                                        </div>

                                        {/* Color presets for edit */}
                                        <div>
                                            <div className="text-[11px] font-bold uppercase text-text-muted mb-1.5">Color Palette</div>
                                            <div className="flex flex-wrap gap-1.5">
                                                {Object.entries(STATUS_COLOR_PRESETS).map(([key, p]) => (
                                                    <button
                                                        type="button"
                                                        key={key}
                                                        onClick={() => handleSelectPreset(key, true)}
                                                        className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold font-outfit transition-all cursor-pointer ${
                                                            editColor === key ? 'ring-2 ring-primary ring-offset-1 scale-105' : 'opacity-80 hover:opacity-100'
                                                        }`}
                                                        style={{
                                                            backgroundColor: p.bgColor,
                                                            color: p.textColor,
                                                            borderColor: p.borderColor
                                                        }}
                                                    >
                                                        {editColor === key && '✓ '}
                                                        {p.label.split(' / ')[0]}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-amber-200/60">
                                            <button
                                                type="button"
                                                onClick={handleCancelEdit}
                                                className="px-3.5 py-1.5 bg-white border border-border text-text-muted hover:text-text-main rounded-xl text-xs font-bold uppercase"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleSaveEdit(status.id)}
                                                className="px-4 py-1.5 bg-primary text-white rounded-xl text-xs font-bold uppercase hover:bg-primary/90"
                                            >
                                                Update
                                            </button>
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <div 
                                    key={status.id}
                                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-white border border-border/70 rounded-2xl hover:border-primary/40 hover:shadow-xs transition-all"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        {/* Badge */}
                                        <span 
                                            className="text-[11px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border shadow-2xs font-outfit shrink-0"
                                            style={{
                                                backgroundColor: status.bgColor || preset.bgColor,
                                                color: status.textColor || preset.textColor,
                                                borderColor: status.borderColor || preset.borderColor
                                            }}
                                        >
                                            {status.label}
                                        </span>

                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-bold text-text-main font-outfit truncate">
                                                    {status.label}
                                                </span>
                                                <code className="text-[10px] text-text-muted bg-gray-100 px-1.5 py-0.5 rounded font-mono">
                                                    {status.id}
                                                </code>
                                                {status.isDefault && (
                                                    <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">
                                                        Default
                                                    </span>
                                                )}
                                            </div>
                                            {status.description && (
                                                <p className="text-xs text-text-muted truncate mt-0.5 font-outfit">
                                                    {status.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action buttons */}
                                    <div className="flex items-center justify-end gap-1.5 shrink-0 self-end sm:self-auto">
                                        {/* Move Buttons */}
                                        <button
                                            type="button"
                                            disabled={index === 0}
                                            onClick={() => handleMove(index, -1)}
                                            className="p-1.5 text-text-muted hover:text-text-main disabled:opacity-20 rounded-lg hover:bg-gray-100 transition-colors"
                                            title="Move Up"
                                        >
                                            <ArrowUp size={14} />
                                        </button>
                                        <button
                                            type="button"
                                            disabled={index === statuses.length - 1}
                                            onClick={() => handleMove(index, 1)}
                                            className="p-1.5 text-text-muted hover:text-text-main disabled:opacity-20 rounded-lg hover:bg-gray-100 transition-colors"
                                            title="Move Down"
                                        >
                                            <ArrowDown size={14} />
                                        </button>

                                        {/* Edit */}
                                        <button
                                            type="button"
                                            onClick={() => handleStartEdit(status)}
                                            className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                            title="Edit Name & Color"
                                        >
                                            <Edit2 size={14} />
                                        </button>

                                        {/* Delete */}
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteStatus(status.id, status.label)}
                                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete Status"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-border/60 bg-gray-50/50">
                    <div className="flex items-center gap-2">
                        {hasChanges && (
                            <span className="flex items-center gap-1.5 text-xs text-amber-600 font-bold font-outfit animate-pulse">
                                <AlertCircle size={14} />
                                <span>Unsaved status changes</span>
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 bg-white border border-border text-text-main hover:bg-gray-100 rounded-xl text-xs font-bold font-outfit uppercase tracking-wider transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSaveAll}
                            disabled={isSaving}
                            className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl text-xs font-bold font-outfit uppercase tracking-wider hover:bg-primary/90 transition-all shadow-md disabled:opacity-50 cursor-pointer"
                        >
                            {isSaving ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <Save size={15} />
                            )}
                            <span>Save Changes</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderStatusManagerModal;

