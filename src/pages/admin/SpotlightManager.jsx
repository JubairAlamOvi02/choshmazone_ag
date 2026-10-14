import React, { useState, useEffect, useMemo } from 'react';
import { settingsParams, DEFAULT_CHOSHMAZONE_SECTION } from '../../lib/api/settings';
import { productParams } from '../../lib/api/products';
import { useToast } from '../../context/ToastContext';
import {
    Sparkles, Save, Upload, RefreshCw, Eye, Image as ImageIcon, Video,
    Link as LinkIcon, Trash2, CheckCircle2, AlertCircle, Play, Layers,
    ExternalLink, ArrowLeft, Info, HelpCircle, Search, X, ShoppingBag,
    Check, Tag, ChevronDown, Package, Plus, Wand2
} from 'lucide-react';
import { Link } from 'react-router-dom';

const SpotlightManager = () => {
    const { showToast } = useToast();
    const [sectionData, setSectionData] = useState(DEFAULT_CHOSHMAZONE_SECTION);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingId, setUploadingId] = useState(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Product Picker Modal State
    const [pickerTargetItem, setPickerTargetItem] = useState(null);
    const [pickerSearch, setPickerSearch] = useState('');
    const [pickerCategory, setPickerCategory] = useState('ALL');
    const [autoFillMedia, setAutoFillMedia] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [data, prods] = await Promise.all([
                settingsParams.getChoshmazoneSection(),
                productParams.fetchAll().catch(err => {
                    console.warn('[SpotlightManager] Failed to fetch inventory products:', err);
                    return [];
                })
            ]);

            if (data) {
                setSectionData(data);
            }
            if (prods) {
                setProducts(prods);
            }
        } catch (err) {
            console.error('Failed to load spotlight settings:', err);
            showToast('Failed to load section settings', 'error');
        } finally {
            setLoading(false);
            setHasUnsavedChanges(false);
        }
    };

    const handleTextChange = (field, value) => {
        setSectionData(prev => ({
            ...prev,
            [field]: value
        }));
        setHasUnsavedChanges(true);
    };

    const handleItemChange = (itemId, field, value) => {
        setSectionData(prev => {
            const updatedItems = (prev.items || DEFAULT_CHOSHMAZONE_SECTION.items).map(item => {
                if (item.id === itemId) {
                    return { ...item, [field]: value };
                }
                return item;
            });
            return { ...prev, items: updatedItems };
        });
        setHasUnsavedChanges(true);
    };

    const handleFileUpload = async (itemId, file) => {
        if (!file) return;

        try {
            setUploadingId(itemId);
            const isVideo = file.type && (file.type.startsWith('video/') || /\.(mp4|webm|mov|ogg)$/i.test(file.name));
            showToast(`Uploading ${isVideo ? 'video' : 'image'}...`, 'info');

            const publicUrl = await settingsParams.uploadAsset(file, 'spotlight');

            handleItemChange(itemId, 'url', publicUrl);
            if (isVideo) {
                handleItemChange(itemId, 'type', 'video');
            } else if (!file.type || file.type.startsWith('image/')) {
                handleItemChange(itemId, 'type', 'image');
            }

            showToast('Media uploaded and updated!', 'success');
        } catch (err) {
            console.error('Upload failed:', err);
            showToast('Upload failed: ' + (err.message || 'Please check file size'), 'error');
        } finally {
            setUploadingId(null);
        }
    };

    // Helper functions for product resolution
    const getProductImage = (p) => {
        if (!p) return '';
        if (p.image_url) return p.image_url;
        if (p.image) return p.image;
        if (Array.isArray(p.images) && p.images.length > 0) return p.images[0];
        return '';
    };

    const getProductName = (p) => {
        if (!p) return 'Product';
        return p.name || p.title || 'Untitled Product';
    };

    // One-click sync image & title from product to card
    const handleSyncProductToCard = (itemId, product) => {
        if (!product) return;
        const prodImg = getProductImage(product);
        const prodName = getProductName(product);

        setSectionData(prev => {
            const updatedItems = (prev.items || DEFAULT_CHOSHMAZONE_SECTION.items).map(item => {
                if (item.id === itemId) {
                    return {
                        ...item,
                        product_id: product.id,
                        url: prodImg || item.url,
                        title: prodName || item.title,
                        type: 'image'
                    };
                }
                return item;
            });
            return { ...prev, items: updatedItems };
        });
        setHasUnsavedChanges(true);
        showToast(`Synced image & title from "${prodName}"!`, 'success');
    };

    // Handle picking a product from modal
    const handleSelectProduct = (product) => {
        if (!pickerTargetItem || !product) return;

        const itemId = pickerTargetItem.id;
        const prodImg = getProductImage(product);
        const prodName = getProductName(product);

        setSectionData(prev => {
            const updatedItems = (prev.items || DEFAULT_CHOSHMAZONE_SECTION.items).map(item => {
                if (item.id === itemId) {
                    const updated = {
                        ...item,
                        product_id: product.id
                    };
                    if (autoFillMedia) {
                        if (prodImg) {
                            updated.url = prodImg;
                            updated.type = 'image';
                        }
                        if (prodName) {
                            updated.title = prodName;
                        }
                    }
                    return updated;
                }
                return item;
            });
            return { ...prev, items: updatedItems };
        });

        setHasUnsavedChanges(true);
        showToast(`Linked box to "${prodName}"`, 'success');
        setPickerTargetItem(null);
        setPickerSearch('');
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            await settingsParams.saveChoshmazoneSection(sectionData);
            setHasUnsavedChanges(false);
            showToast('choshmazone.com section updated successfully!', 'success');
        } catch (err) {
            console.error('Failed to save spotlight settings:', err);
            showToast('Failed to save settings: ' + err.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        if (window.confirm('Reset this section back to the original default layout and images?')) {
            setSectionData(DEFAULT_CHOSHMAZONE_SECTION);
            setHasUnsavedChanges(true);
            showToast('Reset to default values. Click Save to apply.', 'info');
        }
    };

    // Filter categories list
    const availableCategories = useMemo(() => {
        const set = new Set();
        products.forEach(p => {
            if (p.category) set.add(p.category);
        });
        return Array.from(set);
    }, [products]);

    // Filtered products in picker
    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const name = (p.name || p.title || '').toLowerCase();
            const id = String(p.id || '').toLowerCase();
            const category = (p.category || '').toLowerCase();
            const search = pickerSearch.trim().toLowerCase();

            const matchesSearch = !search || name.includes(search) || id.includes(search) || category.includes(search);
            const matchesCategory = pickerCategory === 'ALL' || (p.category && p.category.toLowerCase() === pickerCategory.toLowerCase());

            return matchesSearch && matchesCategory;
        });
    }, [products, pickerSearch, pickerCategory]);

    if (loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
                <p className="text-sm text-text-muted font-outfit">Loading section editor and inventory...</p>
            </div>
        );
    }

    const items = sectionData.items || DEFAULT_CHOSHMAZONE_SECTION.items;
    const getItem = (id) => items.find(i => i.id === id) || { id, type: 'image', url: '', title: '', caption: '', product_id: '', custom_link: '' };

    const col1 = getItem('col-1');
    const col2 = getItem('col-2');
    const col3Top = getItem('col-3-top');
    const col3Bottom = getItem('col-3-bottom');
    const col4 = getItem('col-4');
    const col5 = getItem('col-5');

    const renderCardEditor = (item, label, dimensionsNote = '') => {
        const isVid = item.type === 'video' || /\.(mp4|webm|mov|ogg)($|\?)/i.test(item.url || '');
        const isCurrentlyUploading = uploadingId === item.id;
        const linkedProduct = products.find(p => String(p.id) === String(item.product_id));

        return (
            <div className="bg-white rounded-2xl border border-border/80 p-5 shadow-sm flex flex-col space-y-4 relative group/card overflow-hidden">
                {/* Card Title & Type */}
                <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                        <span className="text-xs font-bold font-outfit uppercase tracking-wider text-text-main flex items-center gap-1.5 truncate">
                            <Layers size={14} className="text-primary shrink-0" />
                            <span className="truncate">{label}</span>
                        </span>
                        {dimensionsNote && (
                            <span className="text-[10px] text-text-muted font-outfit block truncate mt-0.5">
                                {dimensionsNote}
                            </span>
                        )}
                    </div>
                    {/* Media Type Toggle */}
                    <div className="flex items-center bg-gray-100 p-0.5 rounded-lg border border-border/50 text-[11px] font-bold shrink-0">
                        <button
                            type="button"
                            onClick={() => handleItemChange(item.id, 'type', 'image')}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all cursor-pointer ${item.type !== 'video' ? 'bg-white text-primary shadow-xs' : 'text-text-muted hover:text-text-main'}`}
                        >
                            <ImageIcon size={12} /> Image
                        </button>
                        <button
                            type="button"
                            onClick={() => handleItemChange(item.id, 'type', 'video')}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all cursor-pointer ${item.type === 'video' ? 'bg-white text-primary shadow-xs' : 'text-text-muted hover:text-text-main'}`}
                        >
                            <Video size={12} /> Video
                        </button>
                    </div>
                </div>

                {/* Media Preview Box */}
                <div className="relative w-full aspect-[16/10] bg-slate-900 rounded-xl overflow-hidden border border-border flex items-center justify-center group/preview">
                    {item.url ? (
                        isVid ? (
                            <video
                                src={item.url}
                                autoPlay
                                loop
                                muted
                                playsInline
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <img
                                src={item.url}
                                alt={item.title || 'Preview'}
                                className="w-full h-full object-cover"
                            />
                        )
                    ) : (
                        <div className="text-center p-4 text-slate-400">
                            <ImageIcon size={28} className="mx-auto mb-1 opacity-50" />
                            <span className="text-xs">No media set</span>
                        </div>
                    )}

                    {/* Linked product pill badge on preview */}
                    {linkedProduct && (
                        <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-bold text-secondary flex items-center gap-1.5 border border-secondary/30">
                            <ShoppingBag size={11} />
                            <span>Linked to Product</span>
                        </div>
                    )}

                    {/* Overlay info */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <label className="px-3.5 py-2 bg-white text-slate-900 rounded-xl text-xs font-bold font-outfit shadow-md cursor-pointer hover:bg-gray-100 transition-colors flex items-center gap-1.5">
                            <Upload size={13} />
                            <span>Change Media File</span>
                            <input
                                type="file"
                                accept={item.type === 'video' ? "video/mp4,video/webm,video/quicktime" : "image/*,video/*"}
                                className="hidden"
                                onChange={(e) => handleFileUpload(item.id, e.target.files[0])}
                            />
                        </label>
                    </div>

                    {isCurrentlyUploading && (
                        <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center text-white text-xs font-bold gap-2">
                            <div className="animate-spin rounded-full h-7 w-7 border-2 border-white border-t-transparent"></div>
                            <span>Uploading...</span>
                        </div>
                    )}
                </div>

                {/* 1. LINKED INVENTORY PRODUCT SECTION */}
                <div className="pt-3 border-t border-border/60">
                    <div className="flex items-center justify-between gap-2 mb-2">
                        <label className="text-xs font-bold font-outfit uppercase tracking-wider text-text-muted flex items-center gap-1.5 truncate">
                            <ShoppingBag size={13} className="text-primary shrink-0" />
                            <span>Linked Inventory Product</span>
                        </label>
                        {linkedProduct ? (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                                <Check size={11} /> Connected
                            </span>
                        ) : item.product_id ? (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full shrink-0">
                                ID: {item.product_id}
                            </span>
                        ) : null}
                    </div>

                    {linkedProduct ? (
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2.5">
                            <div className="flex items-center gap-3">
                                <div className="w-14 h-14 rounded-lg bg-white border border-border/80 shrink-0 overflow-hidden flex items-center justify-center shadow-2xs">
                                    {getProductImage(linkedProduct) ? (
                                        <img
                                            src={getProductImage(linkedProduct)}
                                            alt={getProductName(linkedProduct)}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <Package size={20} className="text-text-muted" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-xs font-bold text-text-main truncate font-outfit" title={getProductName(linkedProduct)}>
                                        {getProductName(linkedProduct)}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs font-black text-primary font-outfit">
                                            ৳{linkedProduct.price}
                                        </span>
                                        {linkedProduct.category && (
                                            <span className="text-[10px] px-2 py-0.5 bg-gray-200 text-text-muted rounded font-medium truncate">
                                                {linkedProduct.category}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons Grid - Clean, responsive, never overflows */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-2 border-t border-slate-200/80">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setPickerTargetItem(item);
                                        setPickerSearch('');
                                    }}
                                    className="px-2 py-1.5 bg-white hover:bg-gray-100 border border-border/80 rounded-lg text-[11px] font-bold text-text-main flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-2xs"
                                >
                                    <RefreshCw size={11} />
                                    <span>Change</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleItemChange(item.id, 'product_id', '')}
                                    className="px-2 py-1.5 bg-white hover:bg-red-50 border border-red-200 rounded-lg text-[11px] font-bold text-red-600 flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-2xs"
                                >
                                    <Trash2 size={11} />
                                    <span>Unlink</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleSyncProductToCard(item.id, linkedProduct)}
                                    className="px-2 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg text-[11px] font-bold text-amber-800 flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-2xs"
                                    title="Copy product's image and name into this card"
                                >
                                    <Wand2 size={11} />
                                    <span>Sync Media</span>
                                </button>
                                <a
                                    href={`/product/${linkedProduct.id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-2 py-1.5 bg-white hover:bg-gray-100 border border-border/80 rounded-lg text-[11px] font-bold text-text-muted hover:text-text-main flex items-center justify-center gap-1 transition-colors shadow-2xs"
                                >
                                    <ExternalLink size={11} />
                                    <span>Store</span>
                                </a>
                            </div>
                        </div>
                    ) : item.product_id ? (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between text-xs">
                            <span className="text-xs font-medium text-amber-900 truncate">
                                Product ID: <span className="font-mono font-bold">{item.product_id}</span>
                            </span>
                            <div className="flex items-center gap-2 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setPickerTargetItem(item);
                                        setPickerSearch('');
                                    }}
                                    className="text-xs font-bold text-primary hover:underline cursor-pointer"
                                >
                                    Change
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleItemChange(item.id, 'product_id', '')}
                                    className="text-xs font-bold text-red-600 hover:underline cursor-pointer"
                                >
                                    Unlink
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => {
                                setPickerTargetItem(item);
                                setPickerSearch('');
                            }}
                            className="w-full py-2.5 px-3 bg-secondary/15 hover:bg-secondary/25 border border-secondary/40 text-black font-bold font-outfit text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer group/btn shadow-2xs hover:shadow-xs"
                        >
                            <Plus size={14} className="text-black group-hover/btn:scale-110 transition-transform" />
                            <span>Select Product from Inventory</span>
                        </button>
                    )}
                </div>

                {/* Media URL Input */}
                <div>
                    <label className="block text-[11px] font-bold font-outfit uppercase tracking-wider text-text-muted mb-1">
                        Media URL / Direct Link
                    </label>
                    <div className="flex items-center gap-2">
                        <input
                            type="url"
                            value={item.url || ''}
                            onChange={(e) => handleItemChange(item.id, 'url', e.target.value)}
                            placeholder={item.type === 'video' ? "https://.../video.mp4" : "https://.../photo.jpg"}
                            className="flex-1 min-w-0 px-3 py-2 bg-gray-50 border border-border rounded-xl text-xs font-outfit font-medium focus:border-primary outline-none"
                        />
                        <label className="p-2 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-xl transition-colors cursor-pointer shrink-0" title="Upload local file">
                            <Upload size={15} />
                            <input
                                type="file"
                                accept={item.type === 'video' ? "video/mp4,video/webm,video/quicktime" : "image/*,video/*"}
                                className="hidden"
                                onChange={(e) => handleFileUpload(item.id, e.target.files[0])}
                            />
                        </label>
                    </div>
                </div>

                {/* Card Title & Caption & Custom Link */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border/40">
                    <div>
                        <label className="block text-[11px] font-bold font-outfit uppercase tracking-wider text-text-muted mb-1">
                            Card Title
                        </label>
                        <input
                            type="text"
                            value={item.title || ''}
                            onChange={(e) => handleItemChange(item.id, 'title', e.target.value)}
                            placeholder="e.g. Handcrafted Precision"
                            className="w-full px-3 py-2 bg-gray-50 border border-border rounded-xl text-xs font-outfit focus:border-primary outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-[11px] font-bold font-outfit uppercase tracking-wider text-text-muted mb-1">
                            Caption (Optional)
                        </label>
                        <input
                            type="text"
                            value={item.caption || ''}
                            onChange={(e) => handleItemChange(item.id, 'caption', e.target.value)}
                            placeholder="e.g. Signature luxury frames"
                            className="w-full px-3 py-2 bg-gray-50 border border-border rounded-xl text-xs font-outfit focus:border-primary outline-none"
                        />
                    </div>
                    <div className="sm:col-span-2">
                        <label className="block text-[11px] font-medium font-outfit uppercase tracking-wider text-text-muted mb-1">
                            Custom Fallback URL (Optional)
                        </label>
                        <input
                            type="text"
                            value={item.custom_link || ''}
                            onChange={(e) => handleItemChange(item.id, 'custom_link', e.target.value)}
                            placeholder="e.g. /shop or /collections"
                            className="w-full px-3 py-2 bg-gray-50 border border-border rounded-xl text-xs font-outfit focus:border-primary outline-none"
                        />
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 font-outfit">
            {/* Top Navigation & Action Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Link to="/admin/media" className="text-xs text-text-muted hover:text-primary transition-colors flex items-center gap-1">
                            <ArrowLeft size={13} /> Back to Media Hub
                        </Link>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-900 border border-amber-500/20 flex items-center justify-center">
                            <Sparkles size={20} className="text-amber-700" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-text-main uppercase tracking-tight">
                                choshmazone.com Section Editor
                            </h1>
                            <p className="text-xs text-text-muted">
                                Configure images, videos, and link inventory products to each box on the homepage.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <a
                        href="/#recently-purchased"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3.5 py-2.5 bg-gray-100 hover:bg-gray-200 text-text-main rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                    >
                        <Eye size={14} />
                        <span>View Live</span>
                        <ExternalLink size={12} className="opacity-60" />
                    </a>

                    <button
                        type="button"
                        onClick={handleReset}
                        className="flex items-center gap-1.5 px-3.5 py-2.5 bg-gray-100 hover:bg-red-50 text-text-muted hover:text-red-600 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                        title="Reset to default eyewear layout"
                    >
                        <RefreshCw size={14} />
                        <span className="hidden sm:inline">Reset Defaults</span>
                    </button>

                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
                    >
                        {saving ? (
                            <>
                                <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent"></div>
                                <span>Saving...</span>
                            </>
                        ) : (
                            <>
                                <Save size={15} />
                                <span>Save Changes</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {hasUnsavedChanges && (
                <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-4 flex items-center justify-between gap-4 animate-in fade-in">
                    <div className="flex items-center gap-2 text-xs font-bold">
                        <AlertCircle size={16} className="text-amber-700 shrink-0" />
                        <span>You have unsaved changes in your choshmazone.com section!</span>
                    </div>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-xs transition-colors cursor-pointer"
                    >
                        Save Now
                    </button>
                </div>
            )}

            {/* Section Visibility & Global Text Settings */}
            <div className="bg-white rounded-3xl border border-border/80 p-6 sm:p-8 shadow-sm space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-border/50">
                    <div>
                        <h2 className="text-base font-bold text-text-main uppercase tracking-wider">
                            Section Content & Headings
                        </h2>
                        <p className="text-xs text-text-muted mt-0.5">
                            Edit the title and descriptive subtitle shown above the gallery.
                        </p>
                    </div>

                    {/* Enable Toggle */}
                    <label className="flex items-center gap-2.5 cursor-pointer">
                        <span className="text-xs font-bold text-text-main">Enable on Homepage</span>
                        <input
                            type="checkbox"
                            checked={sectionData.enabled !== false}
                            onChange={(e) => handleTextChange('enabled', e.target.checked)}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Main Title */}
                    <div className="md:col-span-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-text-main mb-2">
                            Main Heading Title
                        </label>
                        <input
                            type="text"
                            value={sectionData.title || ''}
                            onChange={(e) => handleTextChange('title', e.target.value)}
                            placeholder="The Details Define Your Vision"
                            className="w-full px-4 py-2.5 bg-gray-50 border border-border rounded-xl text-sm font-outfit focus:border-primary outline-none font-bold text-text-main"
                        />
                        <p className="text-[11px] text-text-muted mt-1">
                            Heading with gold accent underline matching other Choshma Zone sections.
                        </p>
                    </div>

                    {/* Description Subtitle */}
                    <div className="md:col-span-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-text-main mb-2">
                            Description Subtitle
                        </label>
                        <textarea
                            rows={3}
                            value={sectionData.description || ''}
                            onChange={(e) => handleTextChange('description', e.target.value)}
                            placeholder="From your first boardroom pitch to unforgettable celebrations..."
                            className="w-full px-4 py-2.5 bg-gray-50 border border-border rounded-xl text-sm font-outfit focus:border-primary outline-none leading-relaxed"
                        />
                    </div>
                </div>
            </div>

            {/* Media Gallery Grid Editor */}
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                        <h2 className="text-lg font-bold text-text-main uppercase tracking-wider">
                            Media Cards & Product Links
                        </h2>
                        <p className="text-xs text-text-muted">
                            Manage each box's media and connected inventory product.
                        </p>
                    </div>
                    <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full self-start sm:self-auto">
                        6 Total Boxes
                    </span>
                </div>

                {/* Homepage Layout Mapping Reference Bar */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 text-text-muted font-outfit">
                        <Info size={15} className="text-primary shrink-0" />
                        <span>Cards map left-to-right on homepage: Col 1 & 2 (Tall/Medium), Col 3 (Top & Bottom stacked), Col 4 & 5 (Medium/Tall).</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-slate-700 bg-white px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-2xs shrink-0">
                        <span className="px-1.5 py-0.5 bg-slate-100 rounded">1. Left</span>
                        <span>•</span>
                        <span className="px-1.5 py-0.5 bg-slate-100 rounded">2. Mid-L</span>
                        <span>•</span>
                        <span className="px-1.5 py-0.5 bg-amber-100 text-amber-900 rounded">3. Center (A+B)</span>
                        <span>•</span>
                        <span className="px-1.5 py-0.5 bg-slate-100 rounded">4. Mid-R</span>
                        <span>•</span>
                        <span className="px-1.5 py-0.5 bg-slate-100 rounded">5. Right</span>
                    </div>
                </div>

                {/* Balanced, Spacious 3-Column Grid for Admin Cards (2 Rows × 3 Cards) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Row 1 */}
                    {renderCardEditor(col1, '1. Left Tall Column', 'Homepage leftmost tall portrait card')}
                    {renderCardEditor(col2, '2. Mid-Left Column', 'Homepage mid-left medium portrait card')}
                    {renderCardEditor(col3Top, '3A. Center Top Card', 'Homepage center stack (Upper card)')}

                    {/* Row 2 */}
                    {renderCardEditor(col3Bottom, '3B. Center Bottom Card', 'Homepage center stack (Lower card)')}
                    {renderCardEditor(col4, '4. Mid-Right Column', 'Homepage mid-right medium-tall card')}
                    {renderCardEditor(col5, '5. Right Tall Column', 'Homepage rightmost tall portrait card')}
                </div>
            </div>

            {/* PRODUCT PICKER MODAL */}
            {pickerTargetItem && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl border border-border shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden">
                        {/* Modal Header */}
                        <div className="p-5 sm:p-6 border-b border-border flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold font-outfit text-text-main flex items-center gap-2">
                                    <ShoppingBag size={18} className="text-primary" />
                                    Select Inventory Product
                                </h3>
                                <p className="text-xs text-text-muted font-outfit mt-0.5">
                                    Linking to box: <span className="font-semibold text-text-main font-mono">{pickerTargetItem.id}</span>
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setPickerTargetItem(null)}
                                className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-text-muted hover:text-text-main flex items-center justify-center transition-colors cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Search and Filters */}
                        <div className="p-4 sm:p-6 bg-gray-50/70 border-b border-border space-y-3">
                            <div className="relative">
                                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                                <input
                                    type="text"
                                    value={pickerSearch}
                                    onChange={(e) => setPickerSearch(e.target.value)}
                                    placeholder="Search by product name, category, or ID..."
                                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-border rounded-xl text-xs font-outfit focus:border-primary outline-none shadow-2xs"
                                    autoFocus
                                />
                                {pickerSearch && (
                                    <button
                                        type="button"
                                        onClick={() => setPickerSearch('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>

                            {/* Category Filter Pills */}
                            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar text-xs">
                                <button
                                    type="button"
                                    onClick={() => setPickerCategory('ALL')}
                                    className={`px-3 py-1 rounded-full text-[11px] font-bold font-outfit transition-all cursor-pointer ${pickerCategory === 'ALL' ? 'bg-primary text-white shadow-2xs' : 'bg-white text-text-muted border border-border hover:text-text-main'}`}
                                >
                                    All Products ({products.length})
                                </button>
                                {availableCategories.map(cat => (
                                    <button
                                        key={cat}
                                        type="button"
                                        onClick={() => setPickerCategory(cat)}
                                        className={`px-3 py-1 rounded-full text-[11px] font-bold font-outfit whitespace-nowrap transition-all cursor-pointer ${pickerCategory === cat ? 'bg-primary text-white shadow-2xs' : 'bg-white text-text-muted border border-border hover:text-text-main'}`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>

                            {/* Auto-fill Toggle */}
                            <label className="flex items-center gap-2 cursor-pointer pt-1">
                                <input
                                    type="checkbox"
                                    checked={autoFillMedia}
                                    onChange={(e) => setAutoFillMedia(e.target.checked)}
                                    className="rounded border-gray-300 text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                                />
                                <span className="text-xs text-text-main font-medium font-outfit">
                                    Also copy product image & title to this box
                                </span>
                            </label>
                        </div>

                        {/* Product List */}
                        <div className="p-4 sm:p-6 overflow-y-auto flex-1 max-h-[50vh] space-y-2.5 custom-scrollbar">
                            {filteredProducts.length === 0 ? (
                                <div className="text-center py-12 text-text-muted">
                                    <Package size={36} className="mx-auto mb-2 opacity-40" />
                                    <p className="text-sm font-bold font-outfit">No products found</p>
                                    <p className="text-xs mt-1">Try another search keyword or clear category filters.</p>
                                </div>
                            ) : (
                                filteredProducts.map(p => {
                                    const isCurrentlyLinked = String(pickerTargetItem.product_id) === String(p.id);
                                    const pImg = getProductImage(p);
                                    const pName = getProductName(p);

                                    return (
                                        <div
                                            key={p.id}
                                            onClick={() => handleSelectProduct(p)}
                                            className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer group/row ${isCurrentlyLinked ? 'bg-secondary/10 border-secondary' : 'bg-white hover:bg-slate-50 border-border hover:border-primary/50 hover:shadow-sm'}`}
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-14 h-14 rounded-xl bg-gray-100 border border-border/80 overflow-hidden shrink-0 flex items-center justify-center">
                                                    {pImg ? (
                                                        <img
                                                            src={pImg}
                                                            alt={pName}
                                                            className="w-full h-full object-cover group-hover/row:scale-105 transition-transform"
                                                        />
                                                    ) : (
                                                        <Package size={20} className="text-text-muted" />
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="text-xs sm:text-sm font-bold text-text-main font-outfit truncate group-hover/row:text-primary transition-colors">
                                                        {pName}
                                                    </h4>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-xs font-black text-primary font-outfit">
                                                            ৳{p.price}
                                                        </span>
                                                        {p.category && (
                                                            <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-text-muted rounded-md font-medium">
                                                                {p.category}
                                                            </span>
                                                        )}
                                                        {p.stock_quantity !== undefined && (
                                                            <span className={`text-[10px] font-medium ${p.stock_quantity > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                                                {p.stock_quantity > 0 ? `${p.stock_quantity} in stock` : 'Out of stock'}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="shrink-0 flex items-center gap-2">
                                                {isCurrentlyLinked ? (
                                                    <span className="px-3 py-1.5 rounded-xl bg-secondary text-black font-bold font-outfit text-xs flex items-center gap-1 shadow-2xs">
                                                        <Check size={13} /> Selected
                                                    </span>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        className="px-3.5 py-1.5 rounded-xl bg-primary/10 group-hover/row:bg-primary text-primary group-hover/row:text-white font-bold font-outfit text-xs transition-colors cursor-pointer"
                                                    >
                                                        Link
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 bg-gray-50 border-t border-border flex items-center justify-between">
                            <span className="text-xs text-text-muted">
                                Showing {filteredProducts.length} of {products.length} products
                            </span>
                            <button
                                type="button"
                                onClick={() => setPickerTargetItem(null)}
                                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-text-main rounded-xl text-xs font-bold font-outfit transition-colors cursor-pointer"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Sticky Save Bar on mobile / bottom */}
            <div className="sticky bottom-6 z-30 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-border shadow-xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="text-xs font-bold text-text-main">
                        {hasUnsavedChanges ? 'Unsaved changes pending' : 'All settings up to date'}
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : 'Save All Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SpotlightManager;
