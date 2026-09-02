import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { settingsParams } from '../../lib/api/settings';
import { productParams } from '../../lib/api/products';
import { categoryParams } from '../../lib/api/categories';
import { getCategoryFallbackImage } from '../../components/FeaturedCollections';
import { Upload, X, Save, Image as ImageIcon, Layout, Box, CheckCircle2, AlertCircle, RefreshCw, ShoppingBag, Sparkles, Type, Link as LinkIcon, Eye } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import heroBannerFallback from '../../assets/hero_banner.png';
import promoBannerFallback from '../../assets/promo_banner.jpg';
import menFallback from '../../assets/product_1.png';
import womenFallback from '../../assets/product_3.png';
import unisexFallback from '../../assets/product_4.png';

const AdminMedia = () => {
    const navigate = useNavigate();
    const [siteAssets, setSiteAssets] = useState({
        hero_banner: heroBannerFallback,
        logo_main: '',
        footer_logo: '',
        promo_banner_image: promoBannerFallback,
        promo_banner_badge: 'Limited Time Offer',
        promo_banner_title: 'Summer Sale',
        promo_banner_description: 'Get up to 50% off on selected styles. Upgrade your look for the sunny days ahead.',
        promo_banner_btn_text: 'Shop Sale',
        promo_banner_btn_link: '/shop',
        men_collection: menFallback,
        women_collection: womenFallback,
        unisex_collection: unisexFallback,
    });
    const [previewAssets, setPreviewAssets] = useState({});
    const [pendingProducts, setPendingProducts] = useState({}); // productId -> newUrl
    const [tableMissing, setTableMissing] = useState(false);
    const [products, setProducts] = useState([]);
    const [adminCategories, setAdminCategories] = useState([]);
    const [featuredCategories, setFeaturedCategories] = useState([]);
    const [library, setLibrary] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('site'); // 'site' or 'products'
    const [showLibrary, setShowLibrary] = useState(false);
    const [selectingFor, setSelectingFor] = useState(null); // { type, id/key }
    const { showToast } = useToast();

    const hasChanges = Object.keys(previewAssets).length > 0 || Object.keys(pendingProducts).length > 0;

    const getSettingValue = (key) => {
        if (previewAssets[key] !== undefined) return previewAssets[key];
        if (siteAssets[key] !== undefined) return siteAssets[key];
        return '';
    };

    const handleTextChange = (key, value) => {
        setPreviewAssets(prev => ({ ...prev, [key]: value }));
    };

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            setTableMissing(false);

            // Fetch Products, Categories, Library Assets, Settings in parallel
            const [productsData, categoriesData, assets, settings] = await Promise.all([
                productParams.fetchAll(),
                categoryParams.fetchAll(),
                settingsParams.listAssets(),
                settingsParams.fetchAll()
            ]);

            setProducts(productsData);
            setAdminCategories(categoriesData.length > 0 ? categoriesData : [
                { id: '1', name: 'Eye Glasses' },
                { id: '2', name: 'Kids' },
                { id: '3', name: 'Men' },
                { id: '4', name: 'Unisex' },
                { id: '5', name: 'Women' }
            ]);
            setLibrary(assets);

            // Fetch Site Settings
            const assetsObj = {};
            settings.forEach(s => {
                if (s.value !== undefined && s.value !== null) assetsObj[s.key] = s.value;
            });
            setSiteAssets(prev => ({ ...prev, ...assetsObj }));

            // Featured list
            const featuredSetting = assetsObj['featured_categories'];
            let featured = [];
            if (featuredSetting) {
                try {
                    featured = typeof featuredSetting === 'string' ? JSON.parse(featuredSetting) : featuredSetting;
                } catch {
                    featured = featuredSetting.split(',').map(s => s.trim());
                }
            } else {
                featured = categoriesData.map(c => c.name);
            }
            setFeaturedCategories(featured);
        } catch (err) {
            console.error('Error fetching media data:', err);
            if (err.code === '42P01') {
                setTableMissing(true);
            }
        } finally {
            setLoading(false);
        }
    };


    const handleSelectFromLibrary = (url) => {
        if (!selectingFor) return;

        if (selectingFor.type === 'site') {
            setPreviewAssets(prev => ({ ...prev, [selectingFor.key]: url }));
            showToast('Preview updated', 'info');
        } else if (selectingFor.type === 'product') {
            setPendingProducts(prev => ({ ...prev, [selectingFor.id]: url }));
            showToast('Product preview updated', 'info');
        }

        setShowLibrary(false);
        setSelectingFor(null);
    };

    const handleSaveAll = async () => {
        try {
            setSaving(true);

            // 1. Save Global Assets
            const siteUpdates = Object.entries(previewAssets).map(([key, value]) =>
                settingsParams.set(key, value)
            );

            // 2. Save Product Updates
            const productUpdates = Object.entries(pendingProducts).map(([id, url]) =>
                productParams.update(id, { image_url: url })
            );

            await Promise.all([...siteUpdates, ...productUpdates]);

            // Sync states
            setSiteAssets(prev => ({ ...prev, ...previewAssets }));
            setProducts(prev => prev.map(p =>
                pendingProducts[p.id] ? { ...p, image_url: pendingProducts[p.id] } : p
            ));

            // Clear pending
            setPreviewAssets({});
            setPendingProducts({});

            showToast('All changes published to live site!', 'success');
        } catch (err) {
            console.error('Failed to save changes:', err);
            showToast('Failed to save some changes', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleSiteAssetUpload = async (e, key) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            try {
                setSaving(true);
                const url = await settingsParams.uploadAsset(file);
                setPreviewAssets(prev => ({ ...prev, [key]: url }));

                // Refresh library to show new image
                const updatedLibrary = await settingsParams.listAssets();
                setLibrary(updatedLibrary);

                showToast('Image uploaded and ready to save', 'info');
            } catch (err) {
                showToast('Failed to upload image', 'error');
            } finally {
                setSaving(false);
            }
        }
    };

    const handleProductImageUpload = async (productId, file) => {
        try {
            setSaving(true);
            const url = await productParams.uploadImage(file);
            setPendingProducts(prev => ({ ...prev, [productId]: url }));

            // Refresh library
            const updatedLibrary = await settingsParams.listAssets();
            setLibrary(updatedLibrary);

            showToast('Product image uploaded and ready to save', 'info');
        } catch (err) {
            showToast('Failed to upload image', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-vh-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div>
                    <h1 className="text-3xl font-bold text-text-main font-outfit uppercase tracking-tight">Media & Content Manager</h1>
                    <p className="text-text-muted font-outfit">Control all visual banners, text content, and store assets across your website.</p>
                </div>

                <div className="flex bg-white/50 backdrop-blur-md p-1 rounded-2xl border border-border/50">
                    <button
                        onClick={() => setActiveTab('site')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'site' ? 'bg-primary text-white shadow-lg' : 'text-text-muted hover:text-text-main'}`}
                    >
                        <Layout size={14} />
                        Global Assets & Content
                    </button>
                    <button
                        onClick={() => setActiveTab('products')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'products' ? 'bg-primary text-white shadow-lg' : 'text-text-muted hover:text-text-main'}`}
                    >
                        <Box size={14} />
                        Product Images
                    </button>
                </div>
            </div>

            {tableMissing && (
                <div className="bg-amber-50 border border-amber-200 rounded-[2rem] p-8 mb-10 animate-in zoom-in duration-500">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl">
                            <AlertCircle size={24} />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-amber-900 font-outfit uppercase tracking-tight mb-2">Supabase Table Required</h3>
                            <p className="text-amber-800 font-outfit text-sm mb-6 leading-relaxed">
                                To save persistent global assets (Banners, Text, Logos, etc.), you need to create the <code className="bg-amber-100 px-2 py-0.5 rounded font-bold">site_settings</code> table in your Supabase SQL Editor.
                            </p>
                            <div className="bg-gray-900 rounded-2xl p-6 relative group">
                                <pre className="text-emerald-400 text-[11px] font-mono overflow-x-auto custom-scrollbar leading-relaxed">
                                    {`CREATE TABLE public.site_settings (
    key text PRIMARY KEY,
    value text NOT NULL,
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Permissions
CREATE POLICY "Public Read" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Admin CRUD" ON public.site_settings FOR ALL 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));`}
                                </pre>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(`CREATE TABLE public.site_settings (key text PRIMARY KEY, value text NOT NULL, updated_at timestamp with time zone DEFAULT now()); ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY; CREATE POLICY "Public Read" ON public.site_settings FOR SELECT USING (true); CREATE POLICY "Admin CRUD" ON public.site_settings FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));`);
                                        showToast('SQL Copied!', 'success');
                                    }}
                                    className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white text-[10px] uppercase font-bold px-3 py-1.5 rounded-lg transition-all"
                                >
                                    Copy SQL
                                </button>
                            </div>
                            <button
                                onClick={fetchData}
                                className="mt-6 flex items-center gap-2 px-6 py-3 bg-amber-200 text-amber-900 font-bold rounded-xl hover:bg-amber-300 transition-all font-outfit uppercase tracking-widest text-xs"
                            >
                                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                                Check Again
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {activeTab === 'site' ? (
                <div className="space-y-12 pb-32">
                    {/* SECTION 1: Brand & Hero Assets */}
                    <div>
                        <div className="mb-6">
                            <h2 className="text-xl font-bold text-text-main font-outfit uppercase tracking-tight flex items-center gap-3">
                                <Layout className="text-primary" size={20} />
                                Header & Brand Assets
                            </h2>
                            <p className="text-text-muted font-outfit text-sm">Update the primary hero banner image and store logos.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {/* Hero Banner Card */}
                            <AssetCard
                                title="Hero Banner"
                                description="Main landing image"
                                imageUrl={previewAssets.hero_banner || siteAssets.hero_banner}
                                isPending={!!previewAssets.hero_banner}
                                onUpload={(e) => handleSiteAssetUpload(e, 'hero_banner')}
                                onSelect={() => {
                                    setSelectingFor({ type: 'site', key: 'hero_banner' });
                                    setShowLibrary(true);
                                }}
                                saving={saving}
                            />

                            {/* Logo Card */}
                            <AssetCard
                                title="Main Logo"
                                description="Displayed in Navbar"
                                imageUrl={previewAssets.logo_main || siteAssets.logo_main}
                                isPending={!!previewAssets.logo_main}
                                onUpload={(e) => handleSiteAssetUpload(e, 'logo_main')}
                                onSelect={() => {
                                    setSelectingFor({ type: 'site', key: 'logo_main' });
                                    setShowLibrary(true);
                                }}
                                saving={saving}
                            />

                            {/* Footer Logo Card */}
                            <AssetCard
                                title="Footer Logo"
                                description="Secondary branding"
                                imageUrl={previewAssets.footer_logo || siteAssets.footer_logo}
                                isPending={!!previewAssets.footer_logo}
                                onUpload={(e) => handleSiteAssetUpload(e, 'footer_logo')}
                                onSelect={() => {
                                    setSelectingFor({ type: 'site', key: 'footer_logo' });
                                    setShowLibrary(true);
                                }}
                                saving={saving}
                            />
                        </div>
                    </div>

                    {/* SECTION 2: Homepage Promotional Banner Editor with Live Preview */}
                    <div className="bg-white rounded-[2.5rem] border border-border/60 p-6 md:p-10 shadow-sm">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 border-b border-border/50 mb-8">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-secondary/20 text-secondary-dark rounded-2xl flex items-center justify-center">
                                    <Sparkles size={24} className="text-amber-600" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-text-main font-outfit uppercase tracking-tight flex items-center gap-2">
                                        Promotional Banner (Home Page)
                                        {(previewAssets.promo_banner_image || previewAssets.promo_banner_title || previewAssets.promo_banner_description || previewAssets.promo_banner_badge || previewAssets.promo_banner_btn_text || previewAssets.promo_banner_btn_link) && (
                                            <span className="text-[10px] bg-primary/10 text-primary font-bold px-2.5 py-1 rounded-full uppercase animate-pulse">Draft</span>
                                        )}
                                    </h2>
                                    <p className="text-text-muted font-outfit text-xs md:text-sm">Customize background image and all text shown in the middle promotional section.</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                            {/* Form inputs */}
                            <div className="lg:col-span-6 space-y-6">
                                {/* Image Selector */}
                                <div>
                                    <label className="block text-xs font-bold font-outfit uppercase tracking-wider text-text-main mb-2">
                                        Banner Background Image
                                    </label>
                                    <div className="flex items-center gap-4">
                                        <div className="relative w-28 h-20 rounded-2xl overflow-hidden bg-gray-100 border border-border flex-shrink-0">
                                            <img
                                                src={getSettingValue('promo_banner_image') || promoBannerFallback}
                                                alt="Promo banner preview"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <label className="cursor-pointer px-4 py-2 bg-gray-100 hover:bg-primary hover:text-white rounded-xl text-xs font-bold font-outfit uppercase tracking-wider transition-colors inline-flex items-center gap-2">
                                                <Upload size={14} />
                                                Upload Image
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    onChange={(e) => handleSiteAssetUpload(e, 'promo_banner_image')}
                                                    disabled={saving}
                                                    accept="image/*"
                                                />
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelectingFor({ type: 'site', key: 'promo_banner_image' });
                                                    setShowLibrary(true);
                                                }}
                                                disabled={saving}
                                                className="px-4 py-2 bg-gray-100 hover:bg-text-main hover:text-white rounded-xl text-xs font-bold font-outfit uppercase tracking-wider transition-colors inline-flex items-center gap-2"
                                            >
                                                <ImageIcon size={14} />
                                                Choose Library
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Badge */}
                                <div>
                                    <label className="block text-xs font-bold font-outfit uppercase tracking-wider text-text-main mb-2 flex items-center gap-1.5">
                                        <Sparkles size={14} className="text-secondary" /> Tag / Badge Text (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={getSettingValue('promo_banner_badge')}
                                        onChange={(e) => handleTextChange('promo_banner_badge', e.target.value)}
                                        placeholder="e.g. Summer Exclusive, Limited Edition"
                                        className="w-full px-4 py-3 bg-gray-50 border border-border rounded-xl text-sm font-outfit focus:bg-white focus:border-primary outline-none transition-all"
                                    />
                                </div>

                                {/* Title */}
                                <div>
                                    <label className="block text-xs font-bold font-outfit uppercase tracking-wider text-text-main mb-2 flex items-center gap-1.5">
                                        <Type size={14} className="text-primary" /> Main Heading / Title
                                    </label>
                                    <input
                                        type="text"
                                        value={getSettingValue('promo_banner_title')}
                                        onChange={(e) => handleTextChange('promo_banner_title', e.target.value)}
                                        placeholder="e.g. Summer Sale"
                                        className="w-full px-4 py-3 bg-gray-50 border border-border rounded-xl text-sm font-outfit font-bold focus:bg-white focus:border-primary outline-none transition-all"
                                    />
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-xs font-bold font-outfit uppercase tracking-wider text-text-main mb-2 flex items-center gap-1.5">
                                        <Type size={14} className="text-primary" /> Subtitle / Description Text
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={getSettingValue('promo_banner_description')}
                                        onChange={(e) => handleTextChange('promo_banner_description', e.target.value)}
                                        placeholder="e.g. Get up to 50% off on selected styles. Upgrade your look for the sunny days ahead."
                                        className="w-full px-4 py-3 bg-gray-50 border border-border rounded-xl text-sm font-outfit focus:bg-white focus:border-primary outline-none transition-all resize-none"
                                    />
                                </div>

                                {/* Button Config */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold font-outfit uppercase tracking-wider text-text-main mb-2">
                                            Button Text
                                        </label>
                                        <input
                                            type="text"
                                            value={getSettingValue('promo_banner_btn_text')}
                                            onChange={(e) => handleTextChange('promo_banner_btn_text', e.target.value)}
                                            placeholder="e.g. Shop Sale"
                                            className="w-full px-4 py-3 bg-gray-50 border border-border rounded-xl text-sm font-outfit focus:bg-white focus:border-primary outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold font-outfit uppercase tracking-wider text-text-main mb-2 flex items-center gap-1.5">
                                            <LinkIcon size={14} className="text-text-muted" /> Button Link (URL)
                                        </label>
                                        <input
                                            type="text"
                                            value={getSettingValue('promo_banner_btn_link')}
                                            onChange={(e) => handleTextChange('promo_banner_btn_link', e.target.value)}
                                            placeholder="e.g. /shop or /collections"
                                            className="w-full px-4 py-3 bg-gray-50 border border-border rounded-xl text-sm font-outfit focus:bg-white focus:border-primary outline-none transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Live Interactive Preview Box */}
                            <div className="lg:col-span-6 sticky top-24">
                                <div className="flex items-center gap-2 mb-3">
                                    <Eye size={16} className="text-primary" />
                                    <span className="text-xs font-bold font-outfit uppercase tracking-widest text-text-muted">Live Homepage Preview</span>
                                </div>

                                <div className="relative rounded-3xl overflow-hidden shadow-xl border border-border/80 min-h-[340px] flex items-center justify-center p-8 text-center group">
                                    {/* Image */}
                                    <img
                                        src={getSettingValue('promo_banner_image') || promoBannerFallback}
                                        alt="Promo preview"
                                        className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                                    />
                                    {/* Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/70 backdrop-brightness-90"></div>

                                    {/* Foreground Content */}
                                    <div className="relative z-10 max-w-md text-white">
                                        {getSettingValue('promo_banner_badge') && (
                                            <div className="inline-block px-3 py-1 bg-secondary/20 backdrop-blur-md border border-secondary/40 rounded-full mb-3">
                                                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-secondary font-outfit">
                                                    {getSettingValue('promo_banner_badge')}
                                                </span>
                                            </div>
                                        )}

                                        <h3 className="text-2xl sm:text-3xl font-bold font-outfit uppercase tracking-tight text-white mb-2 drop-shadow-md">
                                            {getSettingValue('promo_banner_title') || 'Summer Sale'}
                                        </h3>

                                        <p className="text-xs sm:text-sm text-white/90 font-outfit mb-6 line-clamp-3 leading-relaxed drop-shadow">
                                            {getSettingValue('promo_banner_description') || 'Get up to 50% off on selected styles. Upgrade your look for the sunny days ahead.'}
                                        </p>

                                        <div className="inline-block">
                                            <div className="bg-secondary text-primary font-bold font-outfit text-xs uppercase tracking-wider px-6 py-2.5 rounded shadow-lg">
                                                {getSettingValue('promo_banner_btn_text') || 'Shop Sale'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 3: Dynamic Category Collections */}
                    <div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-text-main font-outfit uppercase tracking-tight flex items-center gap-3">
                                    <ShoppingBag className="text-primary" size={20} />
                                    Homepage & Store Collections
                                </h2>
                                <p className="text-text-muted font-outfit text-sm">Update images and choose which categories appear in Featured Collections.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => navigate('/admin/categories')}
                                className="self-start sm:self-auto px-4 py-2 bg-gray-100 hover:bg-primary hover:text-white rounded-xl text-xs font-bold font-outfit uppercase tracking-wider transition-all"
                            >
                                Manage Categories & Tags →
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {adminCategories.map((cat) => {
                                const normalizedKey = `category_img_${cat.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
                                const isFeatured = featuredCategories.includes(cat.name);
                                const fallbackImg = getCategoryFallbackImage(cat.name);
                                const currentImg = previewAssets[normalizedKey] || siteAssets[normalizedKey] || previewAssets[`${cat.name.toLowerCase()}_collection`] || siteAssets[`${cat.name.toLowerCase()}_collection`] || fallbackImg;

                                return (
                                    <div key={cat.id} className="relative">
                                        <AssetCard
                                            title={`${cat.name} Collection`}
                                            description={`${isFeatured ? '★ Featured Collection' : 'Standard Category'}`}
                                            imageUrl={currentImg}
                                            isPending={!!previewAssets[normalizedKey] || !!previewAssets[`${cat.name.toLowerCase()}_collection`]}
                                            onUpload={(e) => handleSiteAssetUpload(e, normalizedKey)}
                                            onSelect={() => {
                                                setSelectingFor({ type: 'site', key: normalizedKey });
                                                setShowLibrary(true);
                                            }}
                                            saving={saving}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6 pb-32">
                    {products.map(product => (
                        <div key={product.id} className={`group bg-white rounded-3xl border ${pendingProducts[product.id] ? 'border-primary ring-2 ring-primary/20' : 'border-border/50'} overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500`}>
                            <div className="relative aspect-square">
                                <img
                                    src={pendingProducts[product.id] || product.image_url}
                                    alt={product.name}
                                    className="w-full h-full object-contain p-4 mix-blend-multiply group-hover:scale-110 transition-transform duration-500"
                                />
                                {pendingProducts[product.id] && (
                                    <div className="absolute top-2 right-2 bg-primary text-white text-[8px] font-bold px-2 py-1 rounded-full uppercase tracking-tighter">
                                        Modified
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                    <label className="p-2 bg-white/10 hover:bg-white/20 rounded-xl cursor-pointer transition-colors" title="Upload New">
                                        <Upload className="text-white" size={20} />
                                        <input
                                            type="file"
                                            className="hidden"
                                            onChange={(e) => {
                                                if (e.target.files?.[0]) handleProductImageUpload(product.id, e.target.files[0]);
                                            }}
                                            accept="image/*"
                                        />
                                    </label>
                                    <button
                                        onClick={() => {
                                            setSelectingFor({ type: 'product', id: product.id });
                                            setShowLibrary(true);
                                        }}
                                        className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
                                        title="Pick from Gallery"
                                    >
                                        <ImageIcon className="text-white" size={20} />
                                    </button>
                                </div>
                            </div>
                            <div className="p-4 border-t border-border/30">
                                <h3 className="text-[10px] font-bold text-text-main line-clamp-1 uppercase tracking-widest font-outfit">{product.name}</h3>
                                <p className="text-[8px] text-text-muted mt-1 uppercase tracking-tighter">{product.category} • {product.style}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Sticky Save Bar */}
            {hasChanges && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-xl border border-primary/20 p-4 rounded-[2rem] shadow-2xl flex items-center gap-8 z-[90] animate-in slide-in-from-bottom-10 duration-500">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center animate-pulse">
                            <AlertCircle size={20} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-text-main font-outfit uppercase tracking-tight">Unpublished Changes</p>
                            <p className="text-[10px] text-text-muted font-outfit">You have modified {Object.keys(previewAssets).length + Object.keys(pendingProducts).length} assets</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            disabled={saving}
                            onClick={() => {
                                setPreviewAssets({});
                                setPendingProducts({});
                                showToast('All changes discarded', 'info');
                            }}
                            className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-text-muted hover:text-red-500 transition-colors"
                        >
                            Discard
                        </button>
                        <button
                            disabled={saving}
                            onClick={handleSaveAll}
                            className="px-8 py-3 bg-primary text-white text-[10px] font-bold uppercase tracking-[0.2em] rounded-2xl shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:bg-black transition-all flex items-center gap-2"
                        >
                            {saving ? (
                                <>
                                    <RefreshCw size={14} className="animate-spin" />
                                    Publishing...
                                </>
                            ) : (
                                <>
                                    <Save size={14} />
                                    Save & Publish
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Image Library Modal */}
            {showLibrary && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-text-main/60 backdrop-blur-md" onClick={() => setShowLibrary(false)}></div>
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="library-modal-title"
                        aria-describedby="library-modal-desc"
                        className="relative bg-white w-full max-w-5xl max-h-[85vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300"
                    >
                        <div className="px-8 py-6 border-b border-border/50 flex items-center justify-between">
                            <div>
                                <h2 id="library-modal-title" className="text-2xl font-bold text-text-main font-outfit uppercase tracking-tight">Image Library</h2>
                                <p id="library-modal-desc" className="text-xs text-text-muted font-outfit">Select an existing image from your storage history.</p>
                            </div>
                            <button onClick={() => setShowLibrary(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-gray-50/50">
                            {library.length === 0 ? (
                                <div className="h-64 flex flex-col items-center justify-center text-text-muted gap-4">
                                    <ImageIcon size={48} className="opacity-10" />
                                    <p className="font-outfit uppercase tracking-widest text-xs font-bold">Your library is empty</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                    {library.map((asset, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => handleSelectFromLibrary(asset.url)}
                                            className="group relative aspect-square bg-white border border-border/50 rounded-2xl overflow-hidden cursor-pointer hover:border-primary hover:shadow-xl transition-all duration-300"
                                        >
                                            <img src={asset.url} alt={asset.name} className="w-full h-full object-contain p-4 mix-blend-multiply group-hover:scale-110 transition-transform duration-500" />
                                            <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                                                <div className="w-full bg-white/90 backdrop-blur-sm p-2 rounded-xl text-[8px] font-bold truncate uppercase tracking-tighter">
                                                    {asset.name}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="px-8 py-4 border-t border-border/50 bg-white flex justify-end">
                            <button
                                onClick={() => setShowLibrary(false)}
                                className="px-6 py-2 text-xs font-bold uppercase tracking-widest text-text-muted hover:text-text-main transition-colors"
                            >
                                Close Library
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const AssetCard = ({ title, description, imageUrl, onUpload, onSelect, saving, isPending }) => (
    <div className={`bg-white p-8 rounded-[2.5rem] border ${isPending ? 'border-primary ring-4 ring-primary/5' : 'border-border/50'} shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col h-full group`}>
        <div className="flex items-center gap-3 mb-6">
            <div className={`w-10 h-10 ${isPending ? 'bg-primary text-white' : 'bg-primary/10 text-primary'} rounded-xl flex items-center justify-center transition-colors`}>
                <ImageIcon size={20} />
            </div>
            <div>
                <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-text-main uppercase tracking-widest font-outfit">{title}</h3>
                    {isPending && <span className="text-[10px] font-bold text-primary uppercase animate-pulse">Draft</span>}
                </div>
                <p className="text-[10px] text-text-muted font-outfit mt-0.5">{description}</p>
            </div>
        </div>

        <div className="relative flex-1 min-h-[200px] rounded-3xl overflow-hidden bg-gray-50 border border-border/50 mb-6 flex items-center justify-center p-6 group/img">
            {imageUrl ? (
                <img src={imageUrl} alt={title} className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-700" />
            ) : (
                <div className="text-center space-y-2 opacity-30">
                    <ImageIcon size={48} className="mx-auto" />
                    <span className="text-[10px] uppercase font-bold tracking-[0.2em] block">No Asset Set</span>
                </div>
            )}

            <div className={`absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center pointer-events-none`}>
                <Upload className="text-white" size={32} />
            </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
            <label className="relative overflow-hidden cursor-pointer">
                <input
                    type="file"
                    className="hidden"
                    onChange={onUpload}
                    disabled={saving}
                    accept="image/*"
                />
                <div className="w-full py-4 text-center bg-gray-50 border border-border/50 rounded-2xl text-[9px] font-bold uppercase tracking-widest hover:bg-primary hover:text-white hover:border-primary transition-all duration-300">
                    Upload
                </div>
            </label>
            <button
                onClick={onSelect}
                disabled={saving}
                className="w-full py-4 text-center bg-gray-50 border border-border/50 rounded-2xl text-[9px] font-bold uppercase tracking-widest hover:bg-text-main hover:text-white hover:border-text-main transition-all duration-300"
            >
                Pick Library
            </button>
        </div>
    </div>
);

export default AdminMedia;
