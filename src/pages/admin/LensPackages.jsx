import React, { useState, useEffect } from 'react';
import { settingsParams } from '../../lib/api/settings';
import { 
    Plus, Trash2, Edit3, Check, Save, RotateCcw, Eye, ShieldCheck, 
    Sparkles, AlertCircle, CheckCircle2, ArrowUp, ArrowDown, Power
} from 'lucide-react';
import LensCustomizerModal, { DEFAULT_LENS_PACKAGES } from '../../components/Prescription/LensCustomizerModal';

const LensPackages = () => {
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [feedback, setFeedback] = useState(null);
    
    // Modal Edit/Add state
    const [editingPkg, setEditingPkg] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    useEffect(() => {
        loadPackages();
    }, []);

    const loadPackages = async () => {
        try {
            setLoading(true);
            const savedData = await settingsParams.get('lens_packages_settings');
            if (savedData) {
                try {
                    const parsed = JSON.parse(savedData);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        setPackages(parsed);
                        setLoading(false);
                        return;
                    }
                } catch (e) {
                    console.error("Failed to parse lens packages:", e);
                }
            }
            // Fallback to default packages
            setPackages(DEFAULT_LENS_PACKAGES);
        } catch (err) {
            console.error(err);
            setPackages(DEFAULT_LENS_PACKAGES);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveAll = async (packagesToSave = packages) => {
        try {
            setSaving(true);
            await settingsParams.set('lens_packages_settings', JSON.stringify(packagesToSave));
            setFeedback({ type: 'success', message: 'Lens packages saved successfully and updated live on the store!' });
            setTimeout(() => setFeedback(null), 4000);
        } catch (err) {
            console.error("Save error:", err);
            setFeedback({ type: 'error', message: 'Failed to save lens packages: ' + err.message });
        } finally {
            setSaving(false);
        }
    };

    const handleResetDefaults = () => {
        if (!window.confirm('Reset all lens packages to factory defaults? Any custom packages will be overwritten.')) return;
        setPackages(DEFAULT_LENS_PACKAGES);
        handleSaveAll(DEFAULT_LENS_PACKAGES);
    };

    const handleOpenEdit = (pkg) => {
        setEditingPkg({
            ...pkg,
            featuresText: Array.isArray(pkg.features) ? pkg.features.join('\n') : ''
        });
        setIsEditModalOpen(true);
    };

    const handleOpenNew = () => {
        const newId = `lens_${Date.now()}`;
        setEditingPkg({
            id: newId,
            name: '',
            subtitle: '',
            price: 500,
            badge: 'Standard',
            isPrescription: false,
            popular: false,
            is_active: true,
            features: ['UV400 protection', 'Anti-reflective coating'],
            featuresText: 'UV400 protection\nAnti-reflective coating'
        });
        setIsEditModalOpen(true);
    };

    const handleSaveModal = (e) => {
        e.preventDefault();
        if (!editingPkg.name.trim()) {
            alert('Please enter a package name');
            return;
        }

        const featuresArray = (editingPkg.featuresText || '')
            .split('\n')
            .map(f => f.trim())
            .filter(Boolean);

        const updatedPkg = {
            id: editingPkg.id,
            name: editingPkg.name.trim(),
            subtitle: editingPkg.subtitle.trim(),
            price: Number(editingPkg.price) || 0,
            badge: editingPkg.badge.trim() || 'Standard',
            isPrescription: Boolean(editingPkg.isPrescription),
            popular: Boolean(editingPkg.popular),
            is_active: editingPkg.is_active !== false,
            features: featuresArray
        };

        const existingIndex = packages.findIndex(p => p.id === updatedPkg.id);
        let updatedList;
        if (existingIndex >= 0) {
            updatedList = [...packages];
            updatedList[existingIndex] = updatedPkg;
        } else {
            updatedList = [...packages, updatedPkg];
        }

        setPackages(updatedList);
        setIsEditModalOpen(false);
        setEditingPkg(null);
        handleSaveAll(updatedList);
    };

    const handleDelete = (id) => {
        if (!window.confirm('Are you sure you want to delete this lens package?')) return;
        const updatedList = packages.filter(p => p.id !== id);
        setPackages(updatedList);
        handleSaveAll(updatedList);
    };

    const handleToggleActive = (id) => {
        const updatedList = packages.map(p => {
            if (p.id === id) {
                return { ...p, is_active: p.is_active === false ? true : false };
            }
            return p;
        });
        setPackages(updatedList);
        handleSaveAll(updatedList);
    };

    const handleMove = (index, direction) => {
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= packages.length) return;
        const updatedList = [...packages];
        const [movedItem] = updatedList.splice(index, 1);
        updatedList.splice(targetIndex, 0, movedItem);
        setPackages(updatedList);
        handleSaveAll(updatedList);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in duration-500 pb-16 font-outfit">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-text-main uppercase tracking-tight">
                        Prescription Lens Packages
                    </h1>
                    <p className="text-text-muted text-sm">
                        Customize lens options, optical pricing, features, and prescription requirements for customers.
                    </p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    <button
                        type="button"
                        onClick={() => setIsPreviewOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-border text-text-main rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-gray-50 transition-all shadow-xs"
                    >
                        <Eye size={16} />
                        Customer Preview
                    </button>
                    <button
                        type="button"
                        onClick={handleResetDefaults}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-border text-text-muted hover:text-red-600 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-red-50 transition-all shadow-xs"
                        title="Reset to factory default lens packages"
                    >
                        <RotateCcw size={16} />
                        Reset Defaults
                    </button>
                    <button
                        type="button"
                        onClick={handleOpenNew}
                        className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-secondary transition-all shadow-md"
                    >
                        <Plus size={16} strokeWidth={2.5} />
                        Add New Lens
                    </button>
                </div>
            </div>

            {/* Feedback Alert */}
            {feedback && (
                <div className={`p-4 mb-6 rounded-2xl border flex items-center gap-3 animate-in fade-in ${
                    feedback.type === 'success' 
                        ? 'bg-green-50 border-green-200 text-green-800' 
                        : 'bg-red-50 border-red-200 text-red-800'
                }`}>
                    {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                    <span className="text-sm font-bold">{feedback.message}</span>
                </div>
            )}

            {/* Packages Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {packages.map((pkg, index) => {
                    const isActive = pkg.is_active !== false;
                    return (
                        <div
                            key={pkg.id}
                            className={`relative rounded-3xl p-6 border-2 transition-all duration-300 flex flex-col justify-between bg-white ${
                                isActive ? 'border-border/80 shadow-sm hover:shadow-md' : 'border-gray-200 bg-gray-50 opacity-60'
                            }`}
                        >
                            {/* Popular Badge */}
                            {pkg.popular && (
                                <span className="absolute -top-3 right-6 bg-secondary text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-sm">
                                    Popular
                                </span>
                            )}

                            <div>
                                {/* Top Controls */}
                                <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-border/40">
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            disabled={index === 0}
                                            onClick={() => handleMove(index, -1)}
                                            className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"
                                            title="Move Up"
                                        >
                                            <ArrowUp size={14} />
                                        </button>
                                        <button
                                            type="button"
                                            disabled={index === packages.length - 1}
                                            onClick={() => handleMove(index, 1)}
                                            className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"
                                            title="Move Down"
                                        >
                                            <ArrowDown size={14} />
                                        </button>
                                        <span className="text-[10px] text-text-muted font-bold">
                                            #{index + 1}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <button
                                            type="button"
                                            onClick={() => handleToggleActive(pkg.id)}
                                            className={`p-1.5 rounded-lg text-xs font-bold transition-colors ${
                                                isActive ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-200'
                                            }`}
                                            title={isActive ? "Disable package" : "Enable package"}
                                        >
                                            <Power size={16} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleOpenEdit(pkg)}
                                            className="p-1.5 text-text-muted hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                                            title="Edit package"
                                        >
                                            <Edit3 size={16} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(pkg.id)}
                                            className="p-1.5 text-text-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete package"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-start justify-between gap-3 mb-2">
                                    <h3 className="font-bold text-lg text-text-main leading-snug">
                                        {pkg.name}
                                    </h3>
                                    <span className="font-bold text-lg text-primary shrink-0">
                                        {Number(pkg.price) === 0 ? 'Free (৳0)' : `+৳${Number(pkg.price).toLocaleString()}`}
                                    </span>
                                </div>

                                <p className="text-xs text-text-muted mb-4 line-clamp-2">
                                    {pkg.subtitle}
                                </p>

                                <div className="space-y-1.5 mb-6">
                                    {(pkg.features || []).map((feat, idx) => (
                                        <div key={idx} className="flex items-center gap-2 text-xs text-text-muted">
                                            <Check size={14} className="text-secondary shrink-0" />
                                            <span>{feat}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-4 border-t border-border/50 flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-gray-100 rounded-md text-text-muted">
                                        {pkg.badge || 'Standard'}
                                    </span>
                                    {pkg.isPrescription ? (
                                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md">
                                            Rx Required
                                        </span>
                                    ) : (
                                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md">
                                            Zero Power
                                        </span>
                                    )}
                                </div>

                                <span className={`text-[10px] font-bold uppercase tracking-widest ${isActive ? 'text-green-600' : 'text-gray-400'}`}>
                                    {isActive ? 'Active' : 'Disabled'}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Edit / Add Modal */}
            {isEditModalOpen && editingPkg && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                    <div className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-border animate-in zoom-in-95">
                        <div className="px-6 py-5 border-b border-border flex items-center justify-between bg-gray-50/50">
                            <h2 className="text-xl font-bold uppercase tracking-tight text-text-main">
                                {packages.some(p => p.id === editingPkg.id) ? 'Edit Lens Package' : 'New Lens Package'}
                            </h2>
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="p-2 text-text-muted hover:text-text-main rounded-full hover:bg-gray-100"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSaveModal} className="flex-1 overflow-y-auto p-6 space-y-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-wider text-text-muted block mb-1.5">
                                        Package Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Blue-Cut Prescription Lens"
                                        value={editingPkg.name}
                                        onChange={(e) => setEditingPkg({ ...editingPkg, name: e.target.value })}
                                        className="w-full h-11 px-4 text-sm font-bold border border-border rounded-xl focus:outline-primary bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-wider text-text-muted block mb-1.5">
                                        Lens Price (৳ BDT) *
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="50"
                                        required
                                        placeholder="0"
                                        value={editingPkg.price}
                                        onChange={(e) => setEditingPkg({ ...editingPkg, price: e.target.value })}
                                        className="w-full h-11 px-4 text-sm font-bold border border-border rounded-xl focus:outline-primary bg-white"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-text-muted block mb-1.5">
                                    Short Subtitle / Description
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Power + Blue light blocker + Anti-Glare"
                                    value={editingPkg.subtitle}
                                    onChange={(e) => setEditingPkg({ ...editingPkg, subtitle: e.target.value })}
                                    className="w-full h-11 px-4 text-sm border border-border rounded-xl focus:outline-primary bg-white"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-wider text-text-muted block mb-1.5">
                                        Badge Label (Footer pill)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Most Popular, Custom Power, etc."
                                        value={editingPkg.badge}
                                        onChange={(e) => setEditingPkg({ ...editingPkg, badge: e.target.value })}
                                        className="w-full h-11 px-4 text-sm border border-border rounded-xl focus:outline-primary bg-white"
                                    />
                                </div>
                                <div className="space-y-3 pt-6">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={editingPkg.isPrescription}
                                            onChange={(e) => setEditingPkg({ ...editingPkg, isPrescription: e.target.checked })}
                                            className="w-4 h-4 accent-primary rounded"
                                        />
                                        <span className="text-xs font-bold text-text-main">
                                            Requires Prescription (Upload / OD-OS power)
                                        </span>
                                    </label>
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={editingPkg.popular}
                                            onChange={(e) => setEditingPkg({ ...editingPkg, popular: e.target.checked })}
                                            className="w-4 h-4 accent-secondary rounded"
                                        />
                                        <span className="text-xs font-bold text-text-main">
                                            Highlight with 'Popular' ribbon
                                        </span>
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-text-muted block mb-1.5">
                                    Features / Benefits (One per line)
                                </label>
                                <textarea
                                    rows={4}
                                    placeholder="Full custom prescription power&#10;Blue-block digital shield&#10;Green ARC anti-glare reflection"
                                    value={editingPkg.featuresText}
                                    onChange={(e) => setEditingPkg({ ...editingPkg, featuresText: e.target.value })}
                                    className="w-full p-3 text-sm border border-border rounded-xl focus:outline-primary bg-white font-outfit"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="px-5 py-2.5 border border-border rounded-xl text-xs font-bold uppercase tracking-wider text-text-muted hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2.5 bg-primary text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-secondary transition-all shadow-md flex items-center gap-2"
                                >
                                    <Save size={16} />
                                    Save Package
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Live Customer Preview Modal */}
            <LensCustomizerModal
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
                onApply={(applied) => {
                    alert(`Preview test applied: ${applied.name} (৳${applied.price})`);
                    setIsPreviewOpen(false);
                }}
                currentLensOption={{ id: packages[0]?.id || 'frame_only' }}
                framePrice={1500}
                customPackages={packages}
            />
        </div>
    );
};

export default LensPackages;
