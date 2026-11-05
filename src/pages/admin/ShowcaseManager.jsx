import React, { useState, useEffect, useMemo } from 'react';
import { settingsParams, DEFAULT_SHOWCASE_SECTIONS } from '../../lib/api/settings';
import { productParams } from '../../lib/api/products';
import { useToast } from '../../context/ToastContext';
import {
    Grid, Plus, Trash2, Eye, EyeOff, Save, Upload, Search,
    X, Check, ArrowUp, ArrowDown, Copy, ExternalLink,
    Sparkles, RefreshCw, Tag, DollarSign, Package,
    Edit3, Image as ImageIcon, ChevronRight, Layers, HelpCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

const ShowcaseManager = () => {
    const { showToast } = useToast();
    const [sections, setSections] = useState([]);
    const [inventoryProducts, setInventoryProducts] = useState([]);
    const [selectedSectionId, setSelectedSectionId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingItemId, setUploadingItemId] = useState(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Modals
    const [showProductPicker, setShowProductPicker] = useState(false);
    const [pickerSearch, setPickerSearch] = useState('');
    const [pickerCategory, setPickerCategory] = useState('ALL');
    const [selectedProductIds, setSelectedProductIds] = useState([]);

    // Item Edit Drawer / Modal
    const [editingItem, setEditingItem] = useState(null); // { sectionId, item }
    const [viewMode, setViewMode] = useState('editor'); // 'editor' | 'preview'

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [secs, prods] = await Promise.all([
                settingsParams.getShowcaseSections().catch(err => {
                    console.warn('Failed to load showcase sections:', err);
                    return DEFAULT_SHOWCASE_SECTIONS;
                }),
                productParams.fetchAll().catch(err => {
                    console.warn('Failed to load inventory products:', err);
                    return [];
                })
            ]);

            const loadedSections = Array.isArray(secs) && secs.length > 0 ? secs : DEFAULT_SHOWCASE_SECTIONS;
            setSections(loadedSections);
            if (loadedSections.length > 0) {
                setSelectedSectionId(loadedSections[0].id);
            }
            if (prods) {
                setInventoryProducts(prods);
            }
        } catch (err) {
            console.error('Failed to load showcase data:', err);
            showToast('Failed to load sections data', 'error');
        } finally {
            setLoading(false);
            setHasUnsavedChanges(false);
        }
    };

    const activeSection = useMemo(() => {
        return sections.find(s => s.id === selectedSectionId) || sections[0] || null;
    }, [sections, selectedSectionId]);

    const activeSectionIndex = useMemo(() => {
        return sections.findIndex(s => s.id === selectedSectionId);
    }, [sections, selectedSectionId]);

    // Fast map of inventory products
    const productsMap = useMemo(() => {
        const map = {};
        inventoryProducts.forEach(p => {
            map[String(p.id)] = p;
        });
        return map;
    }, [inventoryProducts]);

    // Categories in inventory
    const categoriesList = useMemo(() => {
        const cats = new Set();
        inventoryProducts.forEach(p => {
            if (p.category) cats.add(p.category);
        });
        return Array.from(cats);
    }, [inventoryProducts]);

    // Save all to database
    const handleSaveAll = async () => {
        try {
            setSaving(true);
            await settingsParams.saveShowcaseSections(sections);
            setHasUnsavedChanges(false);
            showToast('Showcase sections saved and updated on storefront!', 'success');
        } catch (err) {
            console.error('Failed to save showcase sections:', err);
            showToast('Error saving sections: ' + (err.message || 'Unknown error'), 'error');
        } finally {
            setSaving(false);
        }
    };

    // SECTION ACTIONS
    const handleAddSection = () => {
        const newId = `sec-${Date.now()}`;
        const newSection = {
            id: newId,
            title: 'New Showcase Collection',
            subtitle: '',
            enabled: true,
            currency: 'Tk',
            columns: 4,
            show_badge: true,
            show_title: false,
            show_quick_actions: true,
            order: sections.length + 1,
            items: []
        };
        setSections(prev => [...prev, newSection]);
        setSelectedSectionId(newId);
        setHasUnsavedChanges(true);
        showToast('New section added! You can now add products to it.', 'success');
    };

    const handleDuplicateSection = (sec) => {
        const newId = `sec-${Date.now()}`;
        const cloned = {
            ...sec,
            id: newId,
            title: `${sec.title} (Copy)`,
            order: sections.length + 1,
            items: (sec.items || []).map(item => ({
                ...item,
                id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`
            }))
        };
        setSections(prev => [...prev, cloned]);
        setSelectedSectionId(newId);
        setHasUnsavedChanges(true);
        showToast(`Duplicated "${sec.title}"`, 'success');
    };

    const handleDeleteSection = (secId) => {
        const target = sections.find(s => s.id === secId);
        if (!window.confirm(`Are you sure you want to delete section "${target?.title || 'this section'}"?`)) {
            return;
        }

        const remaining = sections.filter(s => s.id !== secId);
        setSections(remaining);
        if (selectedSectionId === secId) {
            setSelectedSectionId(remaining[0]?.id || null);
        }
        setHasUnsavedChanges(true);
        showToast('Section deleted', 'info');
    };

    const handleMoveSection = (index, direction) => {
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= sections.length) return;

        const updated = [...sections];
        const [moved] = updated.splice(index, 1);
        updated.splice(newIndex, 0, moved);

        // Re-assign order
        const reordered = updated.map((s, idx) => ({ ...s, order: idx + 1 }));
        setSections(reordered);
        setHasUnsavedChanges(true);
    };

    const handleUpdateActiveSection = (field, value) => {
        if (!activeSection) return;
        setSections(prev => prev.map(s => {
            if (s.id === activeSection.id) {
                return { ...s, [field]: value };
            }
            return s;
        }));
        setHasUnsavedChanges(true);
    };

    // ITEM ACTIONS
    const handleMoveItem = (itemIndex, direction) => {
        if (!activeSection) return;
        const items = [...(activeSection.items || [])];
        const newIndex = itemIndex + direction;
        if (newIndex < 0 || newIndex >= items.length) return;

        const [moved] = items.splice(itemIndex, 1);
        items.splice(newIndex, 0, moved);

        handleUpdateActiveSection('items', items);
    };

    const handleDeleteItem = (itemId) => {
        if (!activeSection) return;
        const filtered = (activeSection.items || []).filter(i => i.id !== itemId);
        handleUpdateActiveSection('items', filtered);
        showToast('Item removed from section', 'info');
    };

    const handleAddCustomItem = () => {
        if (!activeSection) return;
        const newItem = {
            id: `item-${Date.now()}`,
            product_id: '',
            title: 'Custom Product',
            image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=800&q=80',
            price: 1190,
            original_price: 1750,
            badge: 'Sale',
            show_badge: true,
            custom_link: '/shop'
        };
        handleUpdateActiveSection('items', [...(activeSection.items || []), newItem]);
        showToast('Custom item added', 'success');
    };

    // INVENTORY PICKER
    const filteredInventory = useMemo(() => {
        return inventoryProducts.filter(p => {
            const matchesCategory = pickerCategory === 'ALL' || p.category === pickerCategory;
            const searchLower = pickerSearch.toLowerCase().trim();
            const matchesSearch = !searchLower ||
                (p.name && p.name.toLowerCase().includes(searchLower)) ||
                (p.category && p.category.toLowerCase().includes(searchLower)) ||
                (p.style && p.style.toLowerCase().includes(searchLower));
            return matchesCategory && matchesSearch;
        });
    }, [inventoryProducts, pickerCategory, pickerSearch]);

    const handleTogglePickerSelect = (prodId) => {
        setSelectedProductIds(prev => {
            if (prev.includes(prodId)) {
                return prev.filter(id => id !== prodId);
            } else {
                return [...prev, prodId];
            }
        });
    };

    const handleConfirmProductPicker = () => {
        if (!activeSection || selectedProductIds.length === 0) return;

        const newItems = selectedProductIds.map(prodId => {
            const prod = productsMap[prodId];
            const basePrice = Number(prod?.price || 0);
            // Auto suggest a realistic compare-at price (~35% higher rounded to nearest 50/90)
            const suggestedOriginal = basePrice > 0 ? Math.round((basePrice * 1.45) / 50) * 50 : '';
            const prodImage = prod?.image_url || (prod?.images && prod.images[0]) || '';

            return {
                id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                product_id: prod?.id || prodId,
                title: prod?.name || 'Eyewear Product',
                image: prodImage,
                price: basePrice,
                original_price: suggestedOriginal,
                badge: 'Sale',
                show_badge: true,
                custom_link: `/product/${prod?.id || prodId}`
            };
        });

        handleUpdateActiveSection('items', [...(activeSection.items || []), ...newItems]);
        setSelectedProductIds([]);
        setShowProductPicker(false);
        showToast(`Added ${newItems.length} product(s) to "${activeSection.title}"`, 'success');
    };

    // FILE UPLOAD FOR ITEM
    const handleItemFileUpload = async (itemId, file) => {
        if (!file || !activeSection) return;
        try {
            setUploadingItemId(itemId);
            showToast('Uploading custom image...', 'info');
            const publicUrl = await settingsParams.uploadAsset(file, 'showcase');

            const updatedItems = (activeSection.items || []).map(it => {
                if (it.id === itemId) {
                    return { ...it, image: publicUrl };
                }
                return it;
            });

            handleUpdateActiveSection('items', updatedItems);
            showToast('Image uploaded successfully!', 'success');
        } catch (err) {
            console.error('Upload failed:', err);
            showToast('Upload failed: ' + (err.message || 'File error'), 'error');
        } finally {
            setUploadingItemId(null);
        }
    };

    // INLINE ITEM EDIT
    const handleUpdateItemField = (itemId, field, value) => {
        if (!activeSection) return;
        const updatedItems = (activeSection.items || []).map(it => {
            if (it.id === itemId) {
                return { ...it, [field]: value };
            }
            return it;
        });
        handleUpdateActiveSection('items', updatedItems);
    };

    if (loading) {
        return (
            <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
                <p className="text-text-muted font-outfit text-sm">Loading Showcase Sections...</p>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto font-outfit">
            {/* Header & Main Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 mb-6 border-b border-border">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 text-[11px] font-bold uppercase tracking-wider rounded-full">
                            Storefront Grids
                        </span>
                        {hasUnsavedChanges && (
                            <span className="px-2.5 py-0.5 bg-red-100 text-red-700 text-[11px] font-bold uppercase tracking-wider rounded-full animate-pulse">
                                Unsaved Changes
                            </span>
                        )}
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-text-main tracking-tight">
                        Product Showcase Sections
                    </h1>
                    <p className="text-sm text-text-muted mt-1 max-w-2xl">
                        Design and manage curated product grid sections (like <strong>Best Rimless Collections</strong>, <strong>Best Frame Collections</strong>) displayed on your homepage.
                    </p>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    <button
                        onClick={() => setViewMode(viewMode === 'editor' ? 'preview' : 'editor')}
                        className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${
                            viewMode === 'preview'
                                ? 'bg-primary text-white border-primary shadow-md'
                                : 'bg-white text-text-main border-border hover:bg-slate-50'
                        }`}
                    >
                        <Eye size={16} /> {viewMode === 'preview' ? 'Back to Editor' : 'Live Preview'}
                    </button>

                    <Link
                        to="/"
                        target="_blank"
                        className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-text-main rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                        title="View storefront in new tab"
                    >
                        <ExternalLink size={15} /> Store
                    </Link>

                    <button
                        onClick={handleSaveAll}
                        disabled={saving}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold uppercase tracking-wider text-xs shadow-md transition-all ${
                            hasUnsavedChanges
                                ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 scale-105 shadow-amber-500/20'
                                : 'bg-primary text-white hover:bg-secondary hover:text-primary'
                        } ${saving ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        <Save size={16} />
                        {saving ? 'Publishing...' : hasUnsavedChanges ? 'Publish Changes *' : 'Saved to Store'}
                    </button>
                </div>
            </div>

            {/* LIVE PREVIEW TAB */}
            {viewMode === 'preview' && (
                <div className="bg-white rounded-2xl border border-border shadow-sm p-4 sm:p-8 mb-8">
                    <div className="flex items-center justify-between pb-4 mb-6 border-b border-border">
                        <div>
                            <h2 className="text-lg font-bold text-text-main">Storefront Live Preview</h2>
                            <p className="text-xs text-text-muted">Exact visual representation as it appears to customers on the homepage</p>
                        </div>
                        <button
                            onClick={() => setViewMode('editor')}
                            className="text-xs font-bold text-primary hover:underline"
                        >
                            Return to Editor
                        </button>
                    </div>

                    <div className="space-y-12 bg-neutral-50/50 p-4 sm:p-8 rounded-xl border border-dashed border-border">
                        {sections.filter(s => s.enabled !== false).map(section => (
                            <div key={section.id} className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-neutral-100">
                                <div className="text-center mb-8">
                                    <h3 className="text-2xl sm:text-3xl font-normal sm:font-medium text-neutral-900 font-outfit">
                                        {section.title}
                                    </h3>
                                    {section.subtitle && (
                                        <p className="text-xs sm:text-sm text-neutral-500 mt-1">{section.subtitle}</p>
                                    )}
                                </div>

                                <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-${section.columns || 4} gap-4 sm:gap-6`}>
                                    {(section.items || []).map((item, idx) => {
                                        const p = item.product_id ? productsMap[item.product_id] : null;
                                        const img = item.image || p?.image_url || '';
                                        const pr = item.price !== undefined ? item.price : (p?.price || 0);
                                        return (
                                            <div key={idx} className="flex flex-col group">
                                                <div className="relative aspect-square w-full bg-neutral-900 rounded-sm overflow-hidden">
                                                    {img ? (
                                                        <img src={img} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-neutral-500 text-xs">No image</div>
                                                    )}
                                                    {section.show_badge !== false && item.show_badge !== false && item.badge && (
                                                        <div className="absolute top-3 right-3">
                                                            <span className="bg-white text-neutral-900 text-[11px] font-semibold px-3 py-1 rounded-full shadow-sm">
                                                                {item.badge}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="pt-3 pb-1 text-center">
                                                    {section.show_title && (
                                                        <div className="text-xs font-medium text-neutral-800 line-clamp-1 mb-1">
                                                            {item.title || p?.name}
                                                        </div>
                                                    )}
                                                    <div className="flex items-baseline justify-center gap-2">
                                                        <span className="text-sm sm:text-base font-semibold text-neutral-900">
                                                            {section.currency || 'Tk'} {Number(pr || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </span>
                                                        {item.original_price && Number(item.original_price) > Number(pr) && (
                                                            <span className="text-xs sm:text-sm text-neutral-400 line-through">
                                                                {section.currency || 'Tk'} {Number(item.original_price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* MAIN TWO-COLUMN WORKSPACE */}
            {viewMode === 'editor' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* LEFT COLUMN: SECTIONS LIST */}
                    <div className="lg:col-span-4 flex flex-col gap-4">
                        <div className="bg-white rounded-2xl border border-border p-4 shadow-sm">
                            <div className="flex items-center justify-between pb-3 mb-3 border-b border-border">
                                <span className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                                    <Layers size={15} /> Sections ({sections.length})
                                </span>
                                <button
                                    onClick={handleAddSection}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-secondary hover:text-primary transition-all shadow-sm"
                                >
                                    <Plus size={14} /> New Section
                                </button>
                            </div>

                            {/* Section Cards */}
                            <div className="space-y-2">
                                {sections.map((sec, idx) => {
                                    const isSelected = sec.id === selectedSectionId;
                                    const itemsCount = (sec.items || []).length;

                                    return (
                                        <div
                                            key={sec.id}
                                            onClick={() => setSelectedSectionId(sec.id)}
                                            className={`group relative p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                                                isSelected
                                                    ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-primary/20'
                                                    : 'bg-white hover:bg-slate-50 border-border text-text-main'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-bold text-xs ${
                                                    isSelected ? 'bg-white/10 text-white' : 'bg-slate-100 text-text-muted'
                                                }`}>
                                                    #{idx + 1}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-bold text-sm truncate">{sec.title}</h3>
                                                        {sec.enabled === false && (
                                                            <span className="px-1.5 py-0.2 bg-red-500/20 text-red-400 text-[10px] font-bold uppercase rounded">
                                                                Hidden
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className={`text-xs truncate ${isSelected ? 'text-slate-300' : 'text-text-muted'}`}>
                                                        {itemsCount} product{itemsCount === 1 ? '' : 's'} &bull; {sec.columns || 4} cols
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                                                <button
                                                    onClick={() => handleMoveSection(idx, -1)}
                                                    disabled={idx === 0}
                                                    title="Move Up"
                                                    className={`p-1 rounded hover:bg-white/20 transition-all ${idx === 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
                                                >
                                                    <ArrowUp size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleMoveSection(idx, 1)}
                                                    disabled={idx === sections.length - 1}
                                                    title="Move Down"
                                                    className={`p-1 rounded hover:bg-white/20 transition-all ${idx === sections.length - 1 ? 'opacity-30 cursor-not-allowed' : ''}`}
                                                >
                                                    <ArrowDown size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleDuplicateSection(sec)}
                                                    title="Duplicate Section"
                                                    className="p-1 rounded hover:bg-white/20 transition-all"
                                                >
                                                    <Copy size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteSection(sec.id)}
                                                    title="Delete Section"
                                                    className="p-1 rounded hover:bg-red-500/30 text-red-400 transition-all"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Quick Tips Box */}
                        <div className="bg-amber-50 border border-amber-200/70 rounded-2xl p-4 text-xs text-amber-900">
                            <div className="flex items-center gap-2 font-bold mb-1.5 text-amber-950">
                                <Sparkles size={16} /> Showcase Pro-Tips
                            </div>
                            <ul className="list-disc pl-4 space-y-1 text-amber-900/90 leading-relaxed">
                                <li><strong>4 columns</strong> with 8 products is the recommended sweet-spot matching high-converting eyewear stores.</li>
                                <li>Select products from your store inventory to automatically keep prices and links synced.</li>
                                <li>Custom compare-at prices will display with an attractive strikethrough (e.g. <span className="line-through text-amber-700">Tk 1,750</span>).</li>
                                <li>Remember to click <strong>Publish Changes</strong> at the top right to push updates live to your website!</li>
                            </ul>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: ACTIVE SECTION EDITOR */}
                    <div className="lg:col-span-8 flex flex-col gap-6">
                        {activeSection ? (
                            <div className="bg-white rounded-2xl border border-border shadow-sm p-4 sm:p-6">
                                {/* Section Settings Bar */}
                                <div className="border-b border-border pb-5 mb-6">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                                                <Edit3 size={16} />
                                            </div>
                                            <div>
                                                <h2 className="text-lg font-bold text-text-main">
                                                    Section Settings
                                                </h2>
                                                <span className="text-xs text-text-muted">Configure title, columns & badges</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <label className="flex items-center gap-2 text-xs font-bold cursor-pointer select-none">
                                                <input
                                                    type="checkbox"
                                                    checked={activeSection.enabled !== false}
                                                    onChange={(e) => handleUpdateActiveSection('enabled', e.target.checked)}
                                                    className="w-4 h-4 rounded text-primary focus:ring-primary accent-primary"
                                                />
                                                <span>{activeSection.enabled !== false ? 'Active on Store' : 'Hidden from Store'}</span>
                                            </label>
                                        </div>
                                    </div>

                                    {/* Inputs Grid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                        <div className="sm:col-span-2">
                                            <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1">
                                                Section Title (e.g. Best Rimless Collections)
                                            </label>
                                            <input
                                                type="text"
                                                value={activeSection.title}
                                                onChange={(e) => handleUpdateActiveSection('title', e.target.value)}
                                                placeholder="e.g. Best Rimless Collections"
                                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-border rounded-xl text-sm font-semibold text-text-main focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1">
                                                Columns per row
                                            </label>
                                            <select
                                                value={activeSection.columns || 4}
                                                onChange={(e) => handleUpdateActiveSection('columns', Number(e.target.value))}
                                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-border rounded-xl text-sm font-medium text-text-main focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                                            >
                                                <option value={2}>2 Columns</option>
                                                <option value={3}>3 Columns</option>
                                                <option value={4}>4 Columns (Default / Recommended)</option>
                                                <option value={5}>5 Columns</option>
                                            </select>
                                        </div>

                                        <div className="sm:col-span-2">
                                            <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1">
                                                Subtitle / Note (Optional)
                                            </label>
                                            <input
                                                type="text"
                                                value={activeSection.subtitle || ''}
                                                onChange={(e) => handleUpdateActiveSection('subtitle', e.target.value)}
                                                placeholder="e.g. Ultra-lightweight luxury rimless eyewear with free delivery"
                                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-border rounded-xl text-sm text-text-main focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1">
                                                Currency Prefix
                                            </label>
                                            <input
                                                type="text"
                                                value={activeSection.currency || 'Tk'}
                                                onChange={(e) => handleUpdateActiveSection('currency', e.target.value)}
                                                placeholder="Tk or ৳"
                                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-border rounded-xl text-sm font-medium text-text-main focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                                            />
                                        </div>
                                    </div>

                                    {/* Checkboxes Row */}
                                    <div className="flex items-center gap-6 mt-4 pt-3 border-t border-slate-100 flex-wrap">
                                        <label className="flex items-center gap-2 text-xs font-medium text-text-main cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={activeSection.show_badge !== false}
                                                onChange={(e) => handleUpdateActiveSection('show_badge', e.target.checked)}
                                                className="w-4 h-4 rounded text-primary focus:ring-primary accent-primary"
                                            />
                                            <span>Show "Sale" pill badge on cards</span>
                                        </label>

                                        <label className="flex items-center gap-2 text-xs font-medium text-text-main cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={!!activeSection.show_title}
                                                onChange={(e) => handleUpdateActiveSection('show_title', e.target.checked)}
                                                className="w-4 h-4 rounded text-primary focus:ring-primary accent-primary"
                                            />
                                            <span>Show product name text below image</span>
                                        </label>

                                        <label className="flex items-center gap-2 text-xs font-medium text-text-main cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={activeSection.show_quick_actions !== false}
                                                onChange={(e) => handleUpdateActiveSection('show_quick_actions', e.target.checked)}
                                                className="w-4 h-4 rounded text-primary focus:ring-primary accent-primary"
                                            />
                                            <span>Desktop quick-actions (Add to Cart / Buy Now)</span>
                                        </label>
                                    </div>
                                </div>

                                {/* PRODUCTS IN SECTION */}
                                <div>
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                                        <div>
                                            <h3 className="font-bold text-base text-text-main flex items-center gap-2">
                                                <Package size={18} className="text-primary" />
                                                Products in this Section ({activeSection.items?.length || 0})
                                            </h3>
                                            <p className="text-xs text-text-muted">
                                                Drag or use arrows to reorder. Click card to edit image or pricing.
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => {
                                                    setSelectedProductIds([]);
                                                    setShowProductPicker(true);
                                                }}
                                                className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-secondary hover:text-primary transition-all shadow-sm"
                                            >
                                                <Plus size={15} /> Select From Inventory
                                            </button>
                                            <button
                                                onClick={handleAddCustomItem}
                                                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 text-text-main rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-slate-200 transition-all"
                                            >
                                                <Plus size={14} /> Custom Item
                                            </button>
                                        </div>
                                    </div>

                                    {/* Products Grid in Editor */}
                                    {(!activeSection.items || activeSection.items.length === 0) ? (
                                        <div className="border-2 border-dashed border-border rounded-2xl p-10 text-center bg-slate-50/50">
                                            <Package size={40} className="mx-auto text-slate-300 mb-3" />
                                            <h4 className="text-sm font-bold text-text-main mb-1">No products in this section yet</h4>
                                            <p className="text-xs text-text-muted mb-4 max-w-sm mx-auto">
                                                Click "Select From Inventory" to pick existing glasses from your store, or add a custom item.
                                            </p>
                                            <button
                                                onClick={() => setShowProductPicker(true)}
                                                className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm hover:bg-secondary hover:text-primary transition-all inline-flex items-center gap-1.5"
                                            >
                                                <Plus size={15} /> Add Products Now
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                            {activeSection.items.map((item, itemIdx) => {
                                                const linkedProd = item.product_id ? productsMap[item.product_id] : null;
                                                const displayImg = item.image || linkedProd?.image_url || '';
                                                const isUploading = uploadingItemId === item.id;

                                                return (
                                                    <div
                                                        key={item.id || itemIdx}
                                                        className="group relative bg-white border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col"
                                                    >
                                                        {/* Top Image & Badge */}
                                                        <div className="relative aspect-square bg-slate-900 overflow-hidden">
                                                            {displayImg ? (
                                                                <img
                                                                    src={displayImg}
                                                                    alt={item.title}
                                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs p-2 text-center">
                                                                    <ImageIcon size={24} className="mb-1 text-slate-500" />
                                                                    <span>No Image</span>
                                                                </div>
                                                            )}

                                                            {/* Pill Sale Badge */}
                                                            {item.show_badge !== false && item.badge && (
                                                                <div className="absolute top-2 right-2 z-10">
                                                                    <span className="bg-white text-neutral-900 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                                                                        {item.badge}
                                                                    </span>
                                                                </div>
                                                            )}

                                                            {/* Upload Progress Overlay */}
                                                            {isUploading && (
                                                                <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white text-xs z-30">
                                                                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent mb-1"></div>
                                                                    <span>Uploading...</span>
                                                                </div>
                                                            )}

                                                            {/* Quick Overlay Controls */}
                                                            <div className="absolute top-2 left-2 flex items-center gap-1 z-20">
                                                                <button
                                                                    onClick={() => handleMoveItem(itemIdx, -1)}
                                                                    disabled={itemIdx === 0}
                                                                    title="Move Left"
                                                                    className={`w-7 h-7 bg-white/90 hover:bg-white text-neutral-900 rounded-lg flex items-center justify-center shadow-sm text-xs transition-all ${
                                                                        itemIdx === 0 ? 'opacity-30 cursor-not-allowed' : ''
                                                                    }`}
                                                                >
                                                                    <ArrowUp size={13} className="-rotate-90" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleMoveItem(itemIdx, 1)}
                                                                    disabled={itemIdx === activeSection.items.length - 1}
                                                                    title="Move Right"
                                                                    className={`w-7 h-7 bg-white/90 hover:bg-white text-neutral-900 rounded-lg flex items-center justify-center shadow-sm text-xs transition-all ${
                                                                        itemIdx === activeSection.items.length - 1 ? 'opacity-30 cursor-not-allowed' : ''
                                                                    }`}
                                                                >
                                                                    <ArrowDown size={13} className="-rotate-90" />
                                                                </button>
                                                            </div>

                                                            {/* Delete Button */}
                                                            <button
                                                                onClick={() => handleDeleteItem(item.id)}
                                                                title="Remove Product"
                                                                className="absolute bottom-2 right-2 w-7 h-7 bg-red-600/90 hover:bg-red-600 text-white rounded-lg flex items-center justify-center shadow-sm text-xs transition-all z-20"
                                                            >
                                                                <Trash2 size={13} />
                                                            </button>

                                                            {/* Image Change overlay on hover */}
                                                            <label
                                                                title="Upload replacement photo"
                                                                className="absolute bottom-2 left-2 bg-black/70 hover:bg-black text-white text-[10px] font-bold px-2 py-1 rounded-lg cursor-pointer flex items-center gap-1 shadow-sm transition-all z-20"
                                                            >
                                                                <Upload size={11} />
                                                                <span>Change Img</span>
                                                                <input
                                                                    type="file"
                                                                    accept="image/*"
                                                                    className="hidden"
                                                                    onChange={(e) => handleItemFileUpload(item.id, e.target.files?.[0])}
                                                                />
                                                            </label>
                                                        </div>

                                                        {/* Editable Details Card Body */}
                                                        <div className="p-3 flex flex-col gap-2 flex-1">
                                                            <div>
                                                                <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted block">
                                                                    Title
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    value={item.title || ''}
                                                                    onChange={(e) => handleUpdateItemField(item.id, 'title', e.target.value)}
                                                                    placeholder="Product Name"
                                                                    className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs text-text-main focus:bg-white focus:outline-none"
                                                                />
                                                            </div>

                                                            <div className="grid grid-cols-2 gap-2">
                                                                <div>
                                                                    <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted block">
                                                                        Price ({activeSection.currency || 'Tk'})
                                                                    </label>
                                                                    <input
                                                                        type="number"
                                                                        value={item.price !== undefined ? item.price : ''}
                                                                        onChange={(e) => handleUpdateItemField(item.id, 'price', e.target.value)}
                                                                        placeholder="1190"
                                                                        className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-bold text-text-main focus:bg-white focus:outline-none"
                                                                    />
                                                                </div>

                                                                <div>
                                                                    <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted block">
                                                                        Original
                                                                    </label>
                                                                    <input
                                                                        type="number"
                                                                        value={item.original_price || ''}
                                                                        onChange={(e) => handleUpdateItemField(item.id, 'original_price', e.target.value)}
                                                                        placeholder="1750"
                                                                        className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs text-neutral-400 line-through focus:bg-white focus:outline-none"
                                                                    />
                                                                </div>
                                                            </div>

                                                            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                                                                <div>
                                                                    <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted block">
                                                                        Badge Text
                                                                    </label>
                                                                    <input
                                                                        type="text"
                                                                        value={item.badge || ''}
                                                                        onChange={(e) => handleUpdateItemField(item.id, 'badge', e.target.value)}
                                                                        placeholder="Sale"
                                                                        className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-[11px] text-text-main focus:bg-white focus:outline-none"
                                                                    />
                                                                </div>

                                                                <div className="flex items-center pt-3">
                                                                    <label className="flex items-center gap-1.5 text-[11px] text-text-main cursor-pointer select-none">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={item.show_badge !== false}
                                                                            onChange={(e) => handleUpdateItemField(item.id, 'show_badge', e.target.checked)}
                                                                            className="w-3.5 h-3.5 rounded text-primary focus:ring-primary accent-primary"
                                                                        />
                                                                        <span>Show Badge</span>
                                                                    </label>
                                                                </div>
                                                            </div>

                                                            {/* Linked Product Indicator */}
                                                            <div className="pt-1 mt-auto">
                                                                {linkedProd ? (
                                                                    <div className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-1 rounded flex items-center justify-between">
                                                                        <span className="truncate">Linked: {linkedProd.name}</span>
                                                                        <Check size={12} className="shrink-0" />
                                                                    </div>
                                                                ) : item.custom_link ? (
                                                                    <div className="text-[10px] text-blue-700 bg-blue-50 px-2 py-1 rounded truncate">
                                                                        Link: {item.custom_link}
                                                                    </div>
                                                                ) : null}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white rounded-2xl border border-border p-12 text-center text-text-muted">
                                <Layers size={48} className="mx-auto text-slate-300 mb-3" />
                                <h3 className="font-bold text-base text-text-main mb-1">No Section Selected</h3>
                                <p className="text-xs mb-4">Select an existing showcase section from the left or create a new one.</p>
                                <button
                                    onClick={handleAddSection}
                                    className="px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-secondary hover:text-primary transition-all shadow-md inline-flex items-center gap-1.5"
                                >
                                    <Plus size={16} /> Create Showcase Section
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* PRODUCT PICKER MODAL */}
            {showProductPicker && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="p-5 border-b border-border flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-text-main flex items-center gap-2">
                                    <Package size={20} className="text-primary" />
                                    Select Products from Inventory
                                </h3>
                                <p className="text-xs text-text-muted">
                                    Adding to: <span className="font-bold text-text-main">{activeSection?.title}</span>
                                </p>
                            </div>
                            <button
                                onClick={() => setShowProductPicker(false)}
                                className="text-text-muted hover:text-text-main p-1.5 rounded-lg hover:bg-slate-100"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Search & Filter Bar */}
                        <div className="p-4 bg-slate-50 border-b border-border flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                                <input
                                    type="text"
                                    value={pickerSearch}
                                    onChange={(e) => setPickerSearch(e.target.value)}
                                    placeholder="Search by product name, category, or style..."
                                    className="w-full pl-9 pr-4 py-2 bg-white border border-border rounded-xl text-xs sm:text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                                {pickerSearch && (
                                    <button
                                        onClick={() => setPickerSearch('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>

                            <select
                                value={pickerCategory}
                                onChange={(e) => setPickerCategory(e.target.value)}
                                className="px-3 py-2 bg-white border border-border rounded-xl text-xs sm:text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                <option value="ALL">All Categories</option>
                                {categoriesList.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        {/* Products Grid in Modal */}
                        <div className="p-4 overflow-y-auto flex-1 max-h-[50vh]">
                            {filteredInventory.length === 0 ? (
                                <div className="text-center py-12 text-text-muted">
                                    <Package size={36} className="mx-auto text-slate-300 mb-2" />
                                    <p className="text-sm font-semibold">No products found matching your search</p>
                                    <p className="text-xs mt-1">Try another search keyword or clear filters</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                    {filteredInventory.map(prod => {
                                        const isChecked = selectedProductIds.includes(prod.id);
                                        const prodImg = prod.image_url || (prod.images && prod.images[0]) || '';

                                        return (
                                            <div
                                                key={prod.id}
                                                onClick={() => handleTogglePickerSelect(prod.id)}
                                                className={`relative border rounded-xl overflow-hidden cursor-pointer transition-all flex flex-col ${
                                                    isChecked
                                                        ? 'border-primary ring-2 ring-primary bg-primary/5 shadow-md'
                                                        : 'border-border hover:border-slate-400 bg-white'
                                                }`}
                                            >
                                                {/* Checkbox indicator */}
                                                <div className="absolute top-2 right-2 z-10">
                                                    <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                                                        isChecked ? 'bg-primary text-white shadow-sm' : 'bg-white/80 border border-slate-300 text-transparent'
                                                    }`}>
                                                        <Check size={13} />
                                                    </div>
                                                </div>

                                                <div className="aspect-square bg-slate-100 overflow-hidden relative">
                                                    {prodImg ? (
                                                        <img src={prodImg} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                                                            No Image
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="p-2.5 flex flex-col justify-between flex-1">
                                                    <div>
                                                        <h4 className="font-bold text-xs text-text-main line-clamp-1 mb-0.5" title={prod.name}>
                                                            {prod.name}
                                                        </h4>
                                                        <span className="text-[10px] text-text-muted block">{prod.category || 'Eyewear'}</span>
                                                    </div>
                                                    <span className="text-xs font-extrabold text-primary font-outfit mt-1">
                                                        ৳{Number(prod.price || 0).toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 bg-slate-50 border-t border-border flex items-center justify-between">
                            <span className="text-xs text-text-muted font-medium">
                                Selected: <strong className="text-text-main">{selectedProductIds.length}</strong> product(s)
                            </span>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setShowProductPicker(false)}
                                    className="px-4 py-2 border border-border bg-white rounded-xl text-xs font-bold uppercase tracking-wider text-text-main hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmProductPicker}
                                    disabled={selectedProductIds.length === 0}
                                    className={`px-5 py-2 bg-primary text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-md flex items-center gap-1.5 transition-all ${
                                        selectedProductIds.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-secondary hover:text-primary'
                                    }`}
                                >
                                    <Plus size={15} /> Add Selected ({selectedProductIds.length})
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ShowcaseManager;

