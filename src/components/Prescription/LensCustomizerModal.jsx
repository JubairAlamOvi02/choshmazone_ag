import React, { useState, useEffect } from 'react';
import { X, Check, Upload, FileText, MessageCircle, ShieldCheck, Sparkles, AlertCircle, Eye, EyeOff, Plus, Trash2 } from 'lucide-react';
import { settingsParams } from '../../lib/api/settings';

export const DEFAULT_LENS_PACKAGES = [
    {
        id: 'frame_only',
        name: 'Frame Only / Demo Lens',
        subtitle: 'Zero power factory lenses',
        price: 0,
        badge: 'Standard',
        isPrescription: false,
        features: ['Factory demo acrylic lenses', 'UV400 basic protection', 'Ready to wear or glaze elsewhere'],
        popular: false,
        is_active: true
    },
    {
        id: 'zero_power_blue',
        name: 'Zero Power Blue-Cut',
        subtitle: 'Digital screen protection (Computer glasses)',
        price: 500,
        badge: 'Best for Screens',
        isPrescription: false,
        features: ['Blocks 95%+ harmful blue light', 'Anti-reflective coating (ARC)', 'Reduces digital eye strain & headache', 'Zero power / Plano'],
        popular: true,
        is_active: true
    },
    {
        id: 'single_vision',
        name: 'Single Vision Prescription',
        subtitle: 'Clear distance or reading correction',
        price: 800,
        badge: 'Custom Power',
        isPrescription: true,
        features: ['Custom optical power (Distance or Reading)', 'Anti-scratch hard coat', 'CR-39 high clarity optical resin'],
        popular: false,
        is_active: true
    },
    {
        id: 'blue_cut_rx',
        name: 'Blue-Cut Prescription Lens',
        subtitle: 'Power + Blue light blocker + Anti-Glare',
        price: 1200,
        badge: 'Most Popular',
        isPrescription: true,
        features: ['Full custom prescription power', 'Blue-block digital shield', 'Green ARC anti-glare reflection', 'Hydrophobic water & smudge repellent'],
        popular: true,
        is_active: true
    },
    {
        id: 'photochromic_rx',
        name: 'Photochromic Transition + Blue-Cut',
        subtitle: 'Smart light-adaptive (Clear indoors, Dark in sun)',
        price: 1800,
        badge: '2-in-1 Sunglasses',
        isPrescription: true,
        features: ['Auto-darkens in UV sunlight', 'Indoor blue-light filter', '100% UVA/UVB protection', 'Custom optical power support'],
        popular: false,
        is_active: true
    },
    {
        id: 'progressive_rx',
        name: 'Progressive / Multifocal',
        subtitle: 'Distance + Intermediate + Reading (No lines)',
        price: 2500,
        badge: 'Premium Vision',
        isPrescription: true,
        features: ['3-in-1 seamless multi-focus zones', 'No visible bifocal line', 'Digital free-form surface design', 'Ultra-wide corridor for easy adaptation'],
        popular: false,
        is_active: true
    }
];

export const LENS_PACKAGES = DEFAULT_LENS_PACKAGES;

const LensCustomizerModal = ({ isOpen, onClose, onApply, currentLensOption, framePrice = 0, customPackages = null }) => {
    const [packagesList, setPackagesList] = useState(customPackages || DEFAULT_LENS_PACKAGES);
    const [selectedPackageId, setSelectedPackageId] = useState(currentLensOption?.id || 'frame_only');
    const [rxMethod, setRxMethod] = useState(currentLensOption?.method || 'upload'); // 'upload' | 'manual' | 'whatsapp'
    
    // File upload state
    const [prescriptionFile, setPrescriptionFile] = useState(currentLensOption?.prescriptionFile || null);
    const [previewUrl, setPreviewUrl] = useState(currentLensOption?.previewUrl || '');
    const [uploadError, setUploadError] = useState('');

    // Manual numbers state
    const [manualPower, setManualPower] = useState(currentLensOption?.manualPower || {
        odSph: '0.00',
        odCyl: '0.00',
        odAxis: '',
        odAdd: '',
        osSph: '0.00',
        osCyl: '0.00',
        osAxis: '',
        osAdd: '',
        pd: '62'
    });

    const [additionalNotes, setAdditionalNotes] = useState(currentLensOption?.notes || '');

    useEffect(() => {
        if (customPackages && Array.isArray(customPackages) && customPackages.length > 0) {
            setPackagesList(customPackages.filter(p => p.is_active !== false));
            return;
        }

        const fetchCustomPackages = async () => {
            try {
                const stored = await settingsParams.get('lens_packages_settings');
                if (stored) {
                    const parsed = JSON.parse(stored);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        setPackagesList(parsed.filter(p => p.is_active !== false));
                        return;
                    }
                }
            } catch (e) {
                console.error("Failed to load custom lens packages:", e);
            }
            setPackagesList(DEFAULT_LENS_PACKAGES);
        };

        if (isOpen) {
            fetchCustomPackages();
        }
    }, [customPackages, isOpen]);

    useEffect(() => {
        if (currentLensOption?.id) {
            setSelectedPackageId(currentLensOption.id);
        }
        if (currentLensOption?.method) {
            setRxMethod(currentLensOption.method);
        }
        if (currentLensOption?.previewUrl) {
            setPreviewUrl(currentLensOption.previewUrl);
        }
        if (currentLensOption?.manualPower) {
            setManualPower(currentLensOption.manualPower);
        }
        if (currentLensOption?.notes) {
            setAdditionalNotes(currentLensOption.notes);
        }
    }, [currentLensOption, isOpen]);

    if (!isOpen) return null;

    const selectedPkg = packagesList.find(p => p.id === selectedPackageId) || packagesList[0] || DEFAULT_LENS_PACKAGES[0];
    const totalWithLens = Number(framePrice) + Number(selectedPkg?.price || 0);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            setUploadError('File size exceeds 10MB limit. Please upload a smaller image.');
            return;
        }

        const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
        if (!validTypes.includes(file.type)) {
            setUploadError('Please upload a JPG, PNG, WebP, or PDF file.');
            return;
        }

        setUploadError('');
        setPrescriptionFile(file);

        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = () => {
                setPreviewUrl(reader.result);
            };
            reader.readAsDataURL(file);
        } else {
            setPreviewUrl('pdf');
        }
    };

    const handleRemoveFile = () => {
        setPrescriptionFile(null);
        setPreviewUrl('');
        setUploadError('');
    };

    const handleManualChange = (field, value) => {
        setManualPower(prev => ({ ...prev, [field]: value }));
    };

    const handleApply = () => {
        if (selectedPkg?.isPrescription) {
            if (rxMethod === 'upload' && !prescriptionFile && !previewUrl) {
                setUploadError('Please upload your prescription slip, or choose "Enter Numbers Manually" or "Send via WhatsApp".');
                return;
            }
        }

        const lensPayload = {
            id: selectedPkg.id,
            name: selectedPkg.name,
            subtitle: selectedPkg.subtitle,
            price: Number(selectedPkg.price) || 0,
            isPrescription: Boolean(selectedPkg.isPrescription),
            method: selectedPkg.isPrescription ? rxMethod : 'none',
            prescriptionFile: selectedPkg.isPrescription && rxMethod === 'upload' ? prescriptionFile : null,
            previewUrl: selectedPkg.isPrescription && rxMethod === 'upload' ? previewUrl : '',
            manualPower: selectedPkg.isPrescription && rxMethod === 'manual' ? manualPower : null,
            notes: additionalNotes.trim()
        };

        onApply(lensPayload);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto">
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity" 
                onClick={onClose}
            />

            {/* Modal Container */}
            <div className="relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-3xl lg:max-w-4xl w-full max-h-[88vh] flex flex-col overflow-hidden z-10 border border-border animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-5 py-3.5 sm:py-4 border-b border-border flex items-center justify-between bg-background-alt/40 shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-secondary/15 flex items-center justify-center text-primary shrink-0">
                            <Sparkles size={16} />
                        </div>
                        <div>
                            <h2 className="text-lg sm:text-xl font-bold font-outfit text-text-main uppercase tracking-tight leading-tight">
                                Customize Your Lenses
                            </h2>
                            <p className="text-[11px] text-text-muted font-outfit">
                                Choose optical lens package & provide prescription details
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-white border border-border hover:bg-background-alt flex items-center justify-center text-text-muted hover:text-text-main transition-colors shadow-xs"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Body Content */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 no-scrollbar">
                    {/* Step 1: Lens Selection */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center font-outfit">1</span>
                                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-text-main font-outfit">Select Lens Package</h3>
                            </div>
                            <span className="text-[10px] sm:text-xs text-text-muted font-outfit">Includes premium coatings</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
                            {packagesList.map((pkg) => {
                                const isSelected = selectedPackageId === pkg.id;
                                return (
                                    <div
                                        key={pkg.id}
                                        onClick={() => setSelectedPackageId(pkg.id)}
                                        className={`relative rounded-xl sm:rounded-2xl p-3 sm:p-3.5 cursor-pointer transition-all duration-300 border-2 flex flex-col justify-between ${
                                            isSelected 
                                                ? 'border-primary bg-primary/[0.03] shadow-sm ring-2 ring-primary/20' 
                                                : 'border-border/60 hover:border-border hover:bg-gray-50/50'
                                        }`}
                                    >
                                        {pkg.popular && (
                                            <span className="absolute -top-2 right-3 bg-secondary text-white text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full shadow-xs">
                                                Popular
                                            </span>
                                        )}

                                        <div>
                                            <div className="flex items-start justify-between gap-1.5 mb-1">
                                                <h4 className="font-bold text-xs sm:text-sm text-text-main font-outfit leading-snug">
                                                    {pkg.name}
                                                </h4>
                                                <div className={`w-4 h-4 rounded-full flex items-center justify-center border shrink-0 ${
                                                    isSelected ? 'bg-primary border-primary text-white' : 'border-border bg-white'
                                                }`}>
                                                    {isSelected && <Check size={10} strokeWidth={3} />}
                                                </div>
                                            </div>

                                            <p className="text-[10px] sm:text-[11px] text-text-muted font-outfit mb-2 line-clamp-2">
                                                {pkg.subtitle}
                                            </p>

                                            <ul className="space-y-1 mb-3">
                                                {(pkg.features || []).map((feat, idx) => (
                                                    <li key={idx} className="flex items-center gap-1 text-[10px] text-text-muted font-outfit">
                                                        <Check size={10} className="text-secondary shrink-0" />
                                                        <span className="truncate">{feat}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        <div className="pt-2 border-t border-border/40 flex items-center justify-between">
                                            <span className="text-[9px] font-bold uppercase tracking-wider text-text-muted">
                                                {pkg.badge || 'Standard'}
                                            </span>
                                            <span className="font-bold font-outfit text-xs sm:text-sm text-primary">
                                                {Number(pkg.price) === 0 ? 'Free (৳0)' : `+৳${Number(pkg.price).toLocaleString()}`}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Step 2: Prescription Method (Only if prescription lens selected) */}
                    {selectedPkg?.isPrescription && (
                        <div className="animate-in fade-in slide-in-from-top-3 duration-300">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center font-outfit">2</span>
                                    <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-text-main font-outfit">
                                        Provide Your Prescription Details
                                    </h3>
                                </div>
                            </div>

                            {/* Method Tabs */}
                            <div className="grid grid-cols-3 gap-1.5 p-1 bg-background-alt/60 rounded-xl border border-border mb-4">
                                <button
                                    type="button"
                                    onClick={() => setRxMethod('upload')}
                                    className={`py-2 px-2 rounded-lg text-xs font-bold font-outfit transition-all flex items-center justify-center gap-1.5 ${
                                        rxMethod === 'upload' 
                                            ? 'bg-white text-primary shadow-xs' 
                                            : 'text-text-muted hover:text-text-main'
                                    }`}
                                >
                                    <Upload size={13} />
                                    <span className="hidden sm:inline">Upload Slip</span>
                                    <span className="sm:hidden">Upload</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRxMethod('manual')}
                                    className={`py-2 px-2 rounded-lg text-xs font-bold font-outfit transition-all flex items-center justify-center gap-1.5 ${
                                        rxMethod === 'manual' 
                                            ? 'bg-white text-primary shadow-xs' 
                                            : 'text-text-muted hover:text-text-main'
                                    }`}
                                >
                                    <FileText size={13} />
                                    <span className="hidden sm:inline">Enter Numbers</span>
                                    <span className="sm:hidden">Manual</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRxMethod('whatsapp')}
                                    className={`py-2 px-2 rounded-lg text-xs font-bold font-outfit transition-all flex items-center justify-center gap-1.5 ${
                                        rxMethod === 'whatsapp' 
                                            ? 'bg-white text-green-600 shadow-xs' 
                                            : 'text-text-muted hover:text-text-main'
                                    }`}
                                >
                                    <MessageCircle size={13} />
                                    <span className="hidden sm:inline">WhatsApp Later</span>
                                    <span className="sm:hidden">WhatsApp</span>
                                </button>
                            </div>

                            {/* Option 1: File Upload */}
                            {rxMethod === 'upload' && (
                                <div className="space-y-3">
                                    {!previewUrl ? (
                                        <label className="border-2 border-dashed border-border hover:border-primary/60 bg-background-alt/30 hover:bg-primary/[0.02] rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all group">
                                            <div className="w-10 h-10 rounded-xl bg-primary/5 group-hover:bg-primary/10 text-primary flex items-center justify-center mb-2 transition-colors">
                                                <Upload size={20} />
                                            </div>
                                            <p className="font-bold text-xs sm:text-sm text-text-main font-outfit mb-0.5">
                                                Click to upload doctor prescription photo
                                            </p>
                                            <p className="text-[10px] sm:text-xs text-text-muted font-outfit text-center max-w-sm">
                                                Supports JPG, PNG, WebP or PDF (Max 10MB). Take a clear photo of your prescription slip.
                                            </p>
                                            <input 
                                                type="file" 
                                                accept="image/*,application/pdf" 
                                                onChange={handleFileChange} 
                                                className="hidden" 
                                            />
                                        </label>
                                    ) : (
                                        <div className="bg-background-alt/50 border border-border rounded-xl p-3 flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-2.5 overflow-hidden">
                                                {previewUrl === 'pdf' ? (
                                                    <div className="w-12 h-12 rounded-lg bg-red-100 text-red-600 flex items-center justify-center font-bold text-xs shrink-0">
                                                        PDF
                                                    </div>
                                                ) : (
                                                    <img 
                                                        src={previewUrl} 
                                                        alt="Prescription Preview" 
                                                        className="w-12 h-12 rounded-lg object-cover border border-border shrink-0" 
                                                    />
                                                )}
                                                <div className="truncate">
                                                    <p className="text-xs font-bold text-text-main font-outfit truncate">
                                                        {prescriptionFile?.name || 'Prescription Attached'}
                                                    </p>
                                                    <p className="text-[9px] text-green-600 font-bold uppercase tracking-wider flex items-center gap-1 mt-0.5">
                                                        <Check size={10} /> Ready for order
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleRemoveFile}
                                                className="p-1.5 text-text-muted hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                                                title="Remove file"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    )}

                                    {uploadError && (
                                        <p className="text-xs text-red-600 flex items-center gap-1 font-outfit">
                                            <AlertCircle size={13} /> {uploadError}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Option 2: Manual Power Inputs */}
                            {rxMethod === 'manual' && (
                                <div className="space-y-3 bg-background-alt/30 border border-border/70 rounded-xl p-3 sm:p-4">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left font-outfit min-w-[450px]">
                                            <thead>
                                                <tr className="border-b border-border text-[9px] font-bold uppercase tracking-widest text-text-muted">
                                                    <th className="pb-2 px-1.5">Eye</th>
                                                    <th className="pb-2 px-1.5">SPH (Sphere)</th>
                                                    <th className="pb-2 px-1.5">CYL (Cylinder)</th>
                                                    <th className="pb-2 px-1.5">AXIS (0°-180°)</th>
                                                    <th className="pb-2 px-1.5">ADD (Near)</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border/40">
                                                {/* Right Eye (OD) */}
                                                <tr>
                                                    <td className="py-2 px-1.5 font-bold text-xs text-primary">
                                                        OD (Right)
                                                    </td>
                                                    <td className="py-1.5 px-1.5">
                                                        <input
                                                            type="text"
                                                            placeholder="-2.00"
                                                            value={manualPower.odSph}
                                                            onChange={(e) => handleManualChange('odSph', e.target.value)}
                                                            className="w-full h-8 px-2 text-xs font-bold border border-border rounded bg-white focus:outline-primary"
                                                        />
                                                    </td>
                                                    <td className="py-1.5 px-1.5">
                                                        <input
                                                            type="text"
                                                            placeholder="-0.50"
                                                            value={manualPower.odCyl}
                                                            onChange={(e) => handleManualChange('odCyl', e.target.value)}
                                                            className="w-full h-8 px-2 text-xs font-bold border border-border rounded bg-white focus:outline-primary"
                                                        />
                                                    </td>
                                                    <td className="py-1.5 px-1.5">
                                                        <input
                                                            type="text"
                                                            placeholder="180"
                                                            value={manualPower.odAxis}
                                                            onChange={(e) => handleManualChange('odAxis', e.target.value)}
                                                            className="w-full h-8 px-2 text-xs font-bold border border-border rounded bg-white focus:outline-primary"
                                                        />
                                                    </td>
                                                    <td className="py-1.5 px-1.5">
                                                        <input
                                                            type="text"
                                                            placeholder="+1.50"
                                                            value={manualPower.odAdd}
                                                            onChange={(e) => handleManualChange('odAdd', e.target.value)}
                                                            className="w-full h-8 px-2 text-xs font-bold border border-border rounded bg-white focus:outline-primary"
                                                        />
                                                    </td>
                                                </tr>

                                                {/* Left Eye (OS) */}
                                                <tr>
                                                    <td className="py-2 px-1.5 font-bold text-xs text-primary">
                                                        OS (Left)
                                                    </td>
                                                    <td className="py-1.5 px-1.5">
                                                        <input
                                                            type="text"
                                                            placeholder="-1.75"
                                                            value={manualPower.osSph}
                                                            onChange={(e) => handleManualChange('osSph', e.target.value)}
                                                            className="w-full h-8 px-2 text-xs font-bold border border-border rounded bg-white focus:outline-primary"
                                                        />
                                                    </td>
                                                    <td className="py-1.5 px-1.5">
                                                        <input
                                                            type="text"
                                                            placeholder="-0.50"
                                                            value={manualPower.osCyl}
                                                            onChange={(e) => handleManualChange('osCyl', e.target.value)}
                                                            className="w-full h-8 px-2 text-xs font-bold border border-border rounded bg-white focus:outline-primary"
                                                        />
                                                    </td>
                                                    <td className="py-1.5 px-1.5">
                                                        <input
                                                            type="text"
                                                            placeholder="175"
                                                            value={manualPower.osAxis}
                                                            onChange={(e) => handleManualChange('osAxis', e.target.value)}
                                                            className="w-full h-8 px-2 text-xs font-bold border border-border rounded bg-white focus:outline-primary"
                                                        />
                                                    </td>
                                                    <td className="py-1.5 px-1.5">
                                                        <input
                                                            type="text"
                                                            placeholder="+1.50"
                                                            value={manualPower.osAdd}
                                                            onChange={(e) => handleManualChange('osAdd', e.target.value)}
                                                            className="w-full h-8 px-2 text-xs font-bold border border-border rounded bg-white focus:outline-primary"
                                                        />
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Pupillary Distance (PD) */}
                                    <div className="flex items-center gap-3 pt-2 border-t border-border/40">
                                        <div className="flex-1 max-w-[180px]">
                                            <label className="text-[9px] font-bold uppercase tracking-widest text-text-muted mb-0.5 block">
                                                Pupillary Distance (PD mm)
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="e.g. 62"
                                                value={manualPower.pd}
                                                onChange={(e) => handleManualChange('pd', e.target.value)}
                                                className="w-full h-8 px-2 text-xs font-bold border border-border rounded bg-white focus:outline-primary"
                                            />
                                        </div>
                                        <p className="text-[10px] text-text-muted font-outfit pt-3">
                                            Default average is ~62mm. Leave blank if unsure.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Option 3: WhatsApp Later */}
                            {rxMethod === 'whatsapp' && (
                                <div className="bg-green-50/70 border border-green-200/80 rounded-xl p-3.5 flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-green-500 text-white flex items-center justify-center shrink-0">
                                        <MessageCircle size={16} />
                                    </div>
                                    <div className="font-outfit">
                                        <h4 className="font-bold text-xs sm:text-sm text-green-900 mb-0.5">
                                            Send Prescription on WhatsApp Later
                                        </h4>
                                        <p className="text-[11px] text-green-800 leading-relaxed">
                                            Place your order now. Our optical team will message your phone number on WhatsApp after checkout to collect your doctor's slip photo.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 3: Special Notes / Requests (Optional) */}
                    <div>
                        <label className="text-[9px] font-bold uppercase tracking-widest text-text-muted mb-1 block font-outfit">
                            Special Instructions for Optometrist (Optional)
                        </label>
                        <textarea
                            rows={2}
                            value={additionalNotes}
                            onChange={(e) => setAdditionalNotes(e.target.value)}
                            placeholder="E.g., high index 1.67 preference, driving glasses, or prescription remarks..."
                            className="w-full p-2.5 text-xs border border-border rounded-xl bg-background-alt/30 focus:outline-primary font-outfit"
                        />
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="px-5 py-3 border-t border-border bg-background-alt/40 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                        <div>
                            <span className="text-[9px] font-bold uppercase tracking-widest text-text-muted block">
                                Total (Frame + Lens)
                            </span>
                            <span className="text-xl sm:text-2xl font-bold font-outfit text-primary">
                                ৳{totalWithLens.toLocaleString()}
                            </span>
                        </div>
                        {selectedPkg?.price > 0 && (
                            <span className="text-[10px] text-text-muted font-outfit bg-white px-2 py-0.5 rounded-full border border-border">
                                Lens: +৳{Number(selectedPkg.price).toLocaleString()}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-2.5 w-full sm:w-auto">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 sm:flex-none px-4 py-2 border border-border rounded-xl text-xs font-bold uppercase tracking-wider text-text-muted hover:text-text-main hover:bg-white transition-all font-outfit"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleApply}
                            className="flex-1 sm:flex-none px-6 py-2 bg-primary text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-secondary transition-all shadow-sm font-outfit flex items-center justify-center gap-1.5"
                        >
                            <Check size={14} strokeWidth={2.5} />
                            Apply Lens Selection
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LensCustomizerModal;
