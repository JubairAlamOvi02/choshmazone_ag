import React, { useState, useEffect } from 'react';
import { settingsParams } from '../../lib/api/settings';
import { productParams } from '../../lib/api/products';
import { Upload, X, Save, Image as ImageIcon, Layout, Box, CheckCircle2, AlertCircle, RefreshCw, ShoppingBag } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import heroBannerFallback from '../../assets/hero_banner.png';
import menFallback from '../../assets/product_1.png';
import womenFallback from '../../assets/product_3.png';
import unisexFallback from '../../assets/product_4.png';

const AdminMedia = () => {
    const [siteAssets, setSiteAssets] = useState({
        hero_banner: heroBannerFallback,
        logo_main: '',
        footer_logo: '',
        men_collection: menFallback,
        women_collection: womenFallback,
        unisex_collection: unisexFallback,
    });
    const [tableMissing, setTableMissing] = useState(false);
    const [products, setProducts] = useState([]);
    const [library, setLibrary] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('site'); // 'site' or 'products'
    const [showLibrary, setShowLibrary] = useState(false);
    const [selectingFor, setSelectingFor] = useState(null); // { type, id/key }
    const { showToast } = useToast();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            setTableMissing(false);

            // Fetch Products for quick view
            const productsData = await productParams.fetchAll();
            setProducts(productsData);

            // Fetch Library Assets
            const assets = await settingsParams.listAssets();
            setLibrary(assets);

            // Fetch Site Settings
            const settings = await settingsParams.fetchAll();
            const assetsObj = {};
            settings.forEach(s => {
                if (s.value) assetsObj[s.key] = s.value;
            });
            setSiteAssets(prev => ({ ...prev, ...assetsObj }));
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
            handleSiteAssetUpdate(url, selectingFor.key);
        } else if (selectingFor.type === 'product') {
            handleProductImageUpdate(selectingFor.id, url, true);
        }

        setShowLibrary(false);
        setSelectingFor(null);
    };

    const handleSiteAssetUpdate = async (value, key) => {
        try {
            setSaving(true);
            await settingsParams.set(key, value);
            setSiteAssets(prev => ({ ...prev, [key]: value }));
            showToast('Asset updated from library', 'success');
        } catch (err) {
            showToast('Failed to update asset', 'error');
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
                await settingsParams.set(key, url);
                setSiteAssets(prev => ({ ...prev, [key]: url }));
                // Refresh library after upload
                const updatedLibrary = await settingsParams.listAssets();
                setLibrary(updatedLibrary);
                showToast('Asset updated successfully', 'success');
            } catch (err) {
                showToast('Failed to upload asset', 'error');
            } finally {
                setSaving(false);
            }
        }
    };

    const handleProductImageUpdate = async (productId, source, isUrl = false) => {
        try {
            setSaving(true);
            let url = source;
            if (!isUrl) {
                url = await productParams.uploadImage(source);
                // Refresh library after upload
                const updatedLibrary = await settingsParams.listAssets();
                setLibrary(updatedLibrary);
            }
            await productParams.update(productId, { image_url: url });
            setProducts(prev => prev.map(p => p.id === productId ? { ...p, image_url: url } : p));
            showToast('Product image updated', 'success');
        } catch (err) {
            showToast('Failed to update product image', 'error');
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
                    <h1 className="text-3xl font-bold text-text-main font-outfit uppercase tracking-tight">Media Manager</h1>
                    <p className="text-text-muted font-outfit">Control all visual assets across your entire store.</p>
                </div>

                <div className="flex bg-white/50 backdrop-blur-md p-1 rounded-2xl border border-border/50">
                    <button
                        onClick={() => setActiveTab('site')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'site' ? 'bg-primary text-white shadow-lg' : 'text-text-muted hover:text-text-main'}`}
                    >
                        <Layout size={14} />
                        Global Assets
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
                                To save persistent global assets (Hero, Logo, etc.), you need to create the <code className="bg-amber-100 px-2 py-0.5 rounded font-bold">site_settings</code> table in your Supabase SQL Editor.
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {/* Hero Banner Card */}
                    <AssetCard
                        title="Hero Banner"
                        description="Main landing image (Landscape recommended)"
                        imageUrl={siteAssets.hero_banner}
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
                        description="Displayed in Navbar (PNG/SVG recommended)"
                        imageUrl={siteAssets.logo_main}
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
                        description="Secondary branding in footer"
                        imageUrl={siteAssets.footer_logo}
                        onUpload={(e) => handleSiteAssetUpload(e, 'footer_logo')}
                        onSelect={() => {
                            setSelectingFor({ type: 'site', key: 'footer_logo' });
                            setShowLibrary(true);
                        }}
                        saving={saving}
                    />

                    {/* Collection Images */}
                    <div className="col-span-full mt-10 mb-6">
                        <h2 className="text-xl font-bold text-text-main font-outfit uppercase tracking-tight flex items-center gap-3">
                            <ShoppingBag className="text-primary" size={20} />
                            Homepage Collections
                        </h2>
                        <p className="text-text-muted font-outfit text-sm">Update the large category cards on your home page.</p>
                    </div>

                    <AssetCard
                        title="Men Collection"
                        description="Featured image for Men's category"
                        imageUrl={siteAssets.men_collection}
                        onUpload={(e) => handleSiteAssetUpload(e, 'men_collection')}
                        onSelect={() => {
                            setSelectingFor({ type: 'site', key: 'men_collection' });
                            setShowLibrary(true);
                        }}
                        saving={saving}
                    />

                    <AssetCard
                        title="Women Collection"
                        description="Featured image for Women's category"
                        imageUrl={siteAssets.women_collection}
                        onUpload={(e) => handleSiteAssetUpload(e, 'women_collection')}
                        onSelect={() => {
                            setSelectingFor({ type: 'site', key: 'women_collection' });
                            setShowLibrary(true);
                        }}
                        saving={saving}
                    />

                    <AssetCard
                        title="Unisex Collection"
                        description="Featured image for Unisex category"
                        imageUrl={siteAssets.unisex_collection}
                        onUpload={(e) => handleSiteAssetUpload(e, 'unisex_collection')}
                        onSelect={() => {
                            setSelectingFor({ type: 'site', key: 'unisex_collection' });
                            setShowLibrary(true);
                        }}
                        saving={saving}
                    />
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                    {products.map(product => (
                        <div key={product.id} className="group bg-white rounded-3xl border border-border/50 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500">
                            <div className="relative aspect-square">
                                <img
                                    src={product.image_url}
                                    alt={product.name}
                                    className="w-full h-full object-contain p-4 mix-blend-multiply group-hover:scale-110 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                    <label className="p-2 bg-white/10 hover:bg-white/20 rounded-xl cursor-pointer transition-colors" title="Upload New">
                                        <Upload className="text-white" size={20} />
                                        <input
                                            type="file"
                                            className="hidden"
                                            onChange={(e) => {
                                                if (e.target.files?.[0]) handleProductImageUpdate(product.id, e.target.files[0]);
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

            {/* Image Library Modal */}
            {showLibrary && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-text-main/60 backdrop-blur-md" onClick={() => setShowLibrary(false)}></div>
                    <div className="relative bg-white w-full max-w-5xl max-h-[85vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
                        <div className="px-8 py-6 border-b border-border/50 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-text-main font-outfit uppercase tracking-tight">Image Library</h2>
                                <p className="text-xs text-text-muted font-outfit">Select an existing image from your storage history.</p>
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

const AssetCard = ({ title, description, imageUrl, onUpload, onSelect, saving }) => (
    <div className="bg-white p-8 rounded-[2.5rem] border border-border/50 shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col h-full group">
        <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                <ImageIcon size={20} />
            </div>
            <div>
                <h3 className="text-sm font-bold text-text-main uppercase tracking-widest font-outfit">{title}</h3>
                <p className="text-[10px] text-text-muted font-outfit mt-0.5">{description}</p>
            </div>
        </div>

        <div className="relative flex-1 min-h-[200px] rounded-3xl overflow-hidden bg-gray-50 border border-border/50 mb-6 flex items-center justify-center p-6 group/img">
            {imageUrl ? (
                <img src={imageUrl} alt={title} className="w-full h-full object-contain mix-blend-multiply" />
            ) : (
                <div className="text-center space-y-2 opacity-30">
                    <ImageIcon size={48} className="mx-auto" />
                    <span className="text-[10px] uppercase font-bold tracking-[0.2em] block">No Asset Set</span>
                </div>
            )}

            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
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
