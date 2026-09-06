import React, { useState, useEffect } from 'react';
import { 
    Settings, 
    Save, 
    RotateCcw, 
    CheckCircle2, 
    AlertCircle, 
    Eye, 
    EyeOff, 
    Asterisk, 
    ShieldCheck, 
    Phone, 
    Mail, 
    User, 
    MapPin, 
    Building2, 
    Navigation, 
    FileText, 
    Info 
} from 'lucide-react';
import { settingsParams, DEFAULT_CHECKOUT_FIELD_SETTINGS } from '../../lib/api/settings';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/Button';

const FIELD_ICONS = {
    name: User,
    phone: Phone,
    email: Mail,
    address: MapPin,
    district: Building2,
    thana: Navigation,
    city: Building2,
    zip: MapPin,
    notes: FileText
};

const FIELD_DESCRIPTIONS = {
    name: 'Customer full name for invoice and parcel shipping label.',
    phone: 'Customer mobile number. Enforces 11-digit validation (e.g. 017XXXXXXXX) for SMS & delivery calls.',
    email: 'Customer email for digital receipts. Making this optional speeds up orders in BD.',
    address: 'Detailed street address, apartment, flat, or holding number.',
    district: 'Delivery district in Bangladesh. Used to calculate standard shipping charges.',
    thana: 'Police station / Upazila dropdown. Filtered dynamically based on selected District.',
    city: 'City / Area name for more granular parcel routing.',
    zip: 'Postal zip code for courier sort centers.',
    notes: 'Special delivery instructions or notes from customer.'
};

const SECTIONS = [
    {
        id: 'contact',
        title: 'Contact Information',
        description: 'How you communicate and confirm orders with your customers.',
        fields: ['phone', 'email']
    },
    {
        id: 'shipping',
        title: 'Shipping & Delivery Address',
        description: 'Delivery destination information for parcel delivery.',
        fields: ['name', 'address', 'district', 'thana', 'city', 'zip']
    },
    {
        id: 'additional',
        title: 'Additional Options',
        description: 'Extra notes or special requests for the order.',
        fields: ['notes']
    }
];

const CheckoutSettings = () => {
    const [fieldSettings, setFieldSettings] = useState(DEFAULT_CHECKOUT_FIELD_SETTINGS);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const { showToast } = useToast();

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setLoading(true);
            const settings = await settingsParams.getCheckoutFieldSettings();
            setFieldSettings(settings);
            setHasUnsavedChanges(false);
        } catch (error) {
            console.error('Error loading checkout field settings:', error);
            showToast('Failed to load settings', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleRequired = (fieldId) => {
        setFieldSettings(prev => ({
            ...prev,
            [fieldId]: {
                ...prev[fieldId],
                required: !prev[fieldId].required
            }
        }));
        setHasUnsavedChanges(true);
    };

    const handleToggleEnabled = (fieldId) => {
        setFieldSettings(prev => {
            const currentEnabled = prev[fieldId].enabled !== false;
            const newEnabled = !currentEnabled;
            return {
                ...prev,
                [fieldId]: {
                    ...prev[fieldId],
                    enabled: newEnabled,
                    // If disabling/hiding field, it cannot be required
                    required: newEnabled ? prev[fieldId].required : false
                }
            };
        });
        setHasUnsavedChanges(true);
    };

    const handleTextChange = (fieldId, prop, value) => {
        setFieldSettings(prev => ({
            ...prev,
            [fieldId]: {
                ...prev[fieldId],
                [prop]: value
            }
        }));
        setHasUnsavedChanges(true);
    };

    const handleResetDefaults = () => {
        if (window.confirm('Reset all checkout fields to recommended defaults (Name, Phone, Address, District required; Email, Thana, City, Zip optional)?')) {
            setFieldSettings(DEFAULT_CHECKOUT_FIELD_SETTINGS);
            setHasUnsavedChanges(true);
            showToast('Reset to recommended defaults (Click Save to apply)', 'info');
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            await settingsParams.saveCheckoutFieldSettings(fieldSettings);
            setHasUnsavedChanges(false);
            showToast('Checkout field settings saved successfully!', 'success');
        } catch (error) {
            console.error('Failed to save settings:', error);
            showToast('Failed to save settings: ' + error.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-16">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 md:p-8 rounded-2xl border border-border shadow-sm">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-primary/10 text-primary rounded-xl">
                            <Settings size={26} />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold font-outfit text-text-main tracking-tight uppercase">
                                Checkout Form Settings
                            </h1>
                            <p className="text-sm text-text-muted font-outfit mt-0.5">
                                Customize which fields are mandatory, optional, or hidden on customer checkout.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    <button
                        type="button"
                        onClick={handleResetDefaults}
                        className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold font-outfit text-text-muted bg-gray-100 hover:bg-gray-200 hover:text-text-main rounded-xl transition-all uppercase tracking-wider"
                    >
                        <RotateCcw size={15} />
                        Reset Defaults
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving || !hasUnsavedChanges}
                        className={`
                            flex items-center gap-2 px-6 py-2.5 text-xs font-bold font-outfit rounded-xl transition-all uppercase tracking-wider shadow-sm
                            ${hasUnsavedChanges
                                ? 'bg-primary text-white hover:bg-primary/90 shadow-primary/20 cursor-pointer'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
                        `}
                    >
                        <Save size={15} />
                        {saving ? 'Saving...' : hasUnsavedChanges ? 'Save Changes' : 'Saved'}
                    </button>
                </div>
            </div>

            {/* Quick Summary / Info Alert */}
            <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-start gap-3">
                <ShieldCheck size={22} className="text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs font-outfit text-emerald-900 leading-relaxed">
                    <span className="font-bold">E-Commerce Conversion Tip:</span> Making <strong>Email Address</strong>, <strong>Thana</strong>, and <strong>Postal Code</strong> optional drastically reduces checkout friction and boosts conversion in Bangladesh. Phone numbers automatically have <strong>11-digit validation</strong> enabled.
                </div>
            </div>

            {/* Field Configurations by Section */}
            <div className="space-y-8">
                {SECTIONS.map(section => {
                    const sectionFields = section.fields.map(id => ({
                        id,
                        ...(fieldSettings[id] || DEFAULT_CHECKOUT_FIELD_SETTINGS[id])
                    }));

                    return (
                        <div key={section.id} className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-border bg-gray-50/50">
                                <h2 className="text-lg font-bold font-outfit text-text-main uppercase tracking-wider">
                                    {section.title}
                                </h2>
                                <p className="text-xs text-text-muted font-outfit mt-0.5">
                                    {section.description}
                                </p>
                            </div>

                            <div className="divide-y divide-border">
                                {sectionFields.map(field => {
                                    const Icon = FIELD_ICONS[field.id] || FileText;
                                    const isEnabled = field.enabled !== false;
                                    const isRequired = field.required && isEnabled;

                                    return (
                                        <div 
                                            key={field.id}
                                            className={`p-6 transition-colors ${isEnabled ? 'hover:bg-gray-50/60' : 'bg-gray-50/40 opacity-70'}`}
                                        >
                                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                                {/* Field Info */}
                                                <div className="flex items-start gap-4 max-w-md">
                                                    <div className={`p-3 rounded-xl shrink-0 ${isEnabled ? 'bg-primary/10 text-primary' : 'bg-gray-200 text-gray-400'}`}>
                                                        <Icon size={20} />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <h3 className="font-bold font-outfit text-text-main text-base">
                                                                {field.label || field.id}
                                                            </h3>
                                                            {isEnabled ? (
                                                                isRequired ? (
                                                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-red-100 text-red-700">
                                                                        <Asterisk size={10} /> Required
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
                                                                        Optional
                                                                    </span>
                                                                )
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-gray-200 text-gray-600">
                                                                    Hidden
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-text-muted font-outfit mt-1 leading-relaxed">
                                                            {FIELD_DESCRIPTIONS[field.id]}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Controls: Editable Label, Placeholder, Toggles */}
                                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 lg:gap-6 shrink-0">
                                                    {/* Editable Label */}
                                                    <div className="flex flex-col gap-1 w-full sm:w-44">
                                                        <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider font-outfit">
                                                            Field Label
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={field.label || ''}
                                                            onChange={(e) => handleTextChange(field.id, 'label', e.target.value)}
                                                            disabled={!isEnabled}
                                                            placeholder="Label in checkout"
                                                            className="px-3 py-1.5 text-xs font-outfit bg-gray-50 border border-border rounded-lg focus:outline-none focus:border-primary disabled:bg-gray-100"
                                                        />
                                                    </div>

                                                    {/* Editable Placeholder */}
                                                    <div className="flex flex-col gap-1 w-full sm:w-48">
                                                        <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider font-outfit">
                                                            Placeholder
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={field.placeholder || ''}
                                                            onChange={(e) => handleTextChange(field.id, 'placeholder', e.target.value)}
                                                            disabled={!isEnabled}
                                                            placeholder="Input placeholder"
                                                            className="px-3 py-1.5 text-xs font-outfit bg-gray-50 border border-border rounded-lg focus:outline-none focus:border-primary disabled:bg-gray-100"
                                                        />
                                                    </div>

                                                    {/* Toggles */}
                                                    <div className="flex items-center gap-4 pt-2 sm:pt-4">
                                                        {/* Show / Hide */}
                                                        <div className="flex flex-col items-center gap-1">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleToggleEnabled(field.id)}
                                                                title={isEnabled ? 'Visible on checkout' : 'Hidden on checkout'}
                                                                className={`p-2 rounded-xl border transition-all ${
                                                                    isEnabled 
                                                                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100' 
                                                                        : 'bg-gray-100 border-gray-300 text-gray-400 hover:bg-gray-200'
                                                                }`}
                                                            >
                                                                {isEnabled ? <Eye size={18} /> : <EyeOff size={18} />}
                                                            </button>
                                                            <span className="text-[9px] font-bold uppercase tracking-wider text-text-muted font-outfit">
                                                                {isEnabled ? 'Shown' : 'Hidden'}
                                                            </span>
                                                        </div>

                                                        {/* Required / Optional Toggle */}
                                                        <div className="flex flex-col items-center gap-1">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleToggleRequired(field.id)}
                                                                disabled={!isEnabled}
                                                                title={isRequired ? 'Field is Mandatory' : 'Field is Optional'}
                                                                className={`p-2 rounded-xl border transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                                                                    isRequired 
                                                                        ? 'bg-red-50 border-red-300 text-red-600 hover:bg-red-100 font-bold' 
                                                                        : 'bg-blue-50 border-blue-300 text-blue-600 hover:bg-blue-100'
                                                                }`}
                                                            >
                                                                <Asterisk size={18} className={isRequired ? 'stroke-[2.5]' : 'stroke-1 text-gray-400'} />
                                                            </button>
                                                            <span className="text-[9px] font-bold uppercase tracking-wider text-text-muted font-outfit">
                                                                {isRequired ? 'Required' : 'Optional'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Bottom Save Bar */}
            {hasUnsavedChanges && (
                <div className="sticky bottom-6 z-30 p-4 bg-gray-900 text-white rounded-2xl shadow-2xl flex items-center justify-between gap-4 animate-in slide-in-from-bottom-4 duration-300">
                    <div className="flex items-center gap-2">
                        <AlertCircle size={20} className="text-amber-400 shrink-0" />
                        <span className="text-sm font-outfit font-medium">You have unsaved changes in checkout form fields.</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={handleResetDefaults}
                            className="px-4 py-2 text-xs font-bold font-outfit text-gray-300 hover:text-white transition-colors uppercase tracking-wider"
                        >
                            Reset
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 px-6 py-2 bg-primary text-white hover:bg-primary/90 text-xs font-bold font-outfit rounded-xl transition-all uppercase tracking-wider"
                        >
                            <Save size={15} />
                            {saving ? 'Saving...' : 'Save Settings'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CheckoutSettings;
