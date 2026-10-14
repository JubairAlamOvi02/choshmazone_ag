import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useToast } from '../../context/ToastContext';
import { Copy, Check, ExternalLink, HelpCircle, RefreshCw, ShoppingBag, Layers, AlertCircle, Sparkles, BookOpen } from 'lucide-react';

const FacebookCatalog = () => {
    const { showToast } = useToast();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [copied, setCopied] = useState(false);

    const feedUrl = `${window.location.origin}/api/catalog.xml`;

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setProducts(data || []);
        } catch (err) {
            console.error('Error fetching catalog data:', err);
            showToast('Failed to load catalog data.', 'error');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchProducts();
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(feedUrl);
            setCopied(true);
            showToast('Catalog Feed URL copied to clipboard!', 'success');
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            showToast('Failed to copy feed URL.', 'error');
        }
    };

    // Calculate metrics
    const activeProductsCount = products.length;
    
    let totalItemsCount = 0;
    let outOfStockCount = 0;
    let previewItems = [];

    products.forEach(p => {
        let variantsList = [];
        try {
            if (p.variants) {
                variantsList = typeof p.variants === 'string' 
                    ? JSON.parse(p.variants) 
                    : p.variants;
            }
        } catch (e) {
            console.error(e);
        }

        if (Array.isArray(variantsList) && variantsList.length > 0) {
            totalItemsCount += variantsList.length;
            variantsList.forEach(v => {
                const stock = typeof v.stock_quantity !== 'undefined' ? Number(v.stock_quantity) : 0;
                if (stock <= 0) outOfStockCount++;
                
                // Add to preview items limit 10
                if (previewItems.length < 5) {
                    const variantDetails = [];
                    if (v.color) variantDetails.push(v.color);
                    if (v.size) variantDetails.push(v.size);
                    const displayName = variantDetails.length > 0
                        ? `${p.name} (${variantDetails.join(' / ')})`
                        : p.name;

                    previewItems.push({
                        id: `${p.id}_${v.id || 'var'}`,
                        name: displayName,
                        image: v.image_url || p.image_url,
                        price: v.price || p.price,
                        category: p.category || 'Apparel & Accessories',
                        stock: stock,
                        isVariant: true,
                        parentId: p.id
                    });
                }
            });
        } else {
            totalItemsCount += 1;
            const stock = Number(p.stock_quantity || 0);
            if (stock <= 0) outOfStockCount++;
            
            if (previewItems.length < 5) {
                previewItems.push({
                    id: p.id,
                    name: p.name,
                    image: p.image_url,
                    price: p.price,
                    category: p.category || 'Apparel & Accessories',
                    stock: stock,
                    isVariant: false
                });
            }
        }
    });

    return (
        <div className="animate-in fade-in duration-700 pb-16">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div>
                    <h1 className="text-3xl font-bold text-text-main font-outfit uppercase tracking-tight flex items-center gap-2">
                        <Sparkles size={28} className="text-primary animate-pulse" />
                        Facebook Catalog Feed
                    </h1>
                    <p className="text-text-muted font-outfit">Sync your store products and variants directly to Facebook and Instagram.</p>
                </div>
                <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="flex items-center gap-2 px-6 py-3 bg-white border border-border rounded-xl text-sm font-bold text-text-main hover:bg-gray-50 transition-all font-outfit uppercase tracking-widest shadow-sm disabled:opacity-50"
                >
                    <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                    {refreshing ? 'Syncing...' : 'Sync Feed Data'}
                </button>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white border border-border/50 rounded-3xl">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
                    <p className="font-outfit text-text-muted text-sm uppercase tracking-widest">Loading Catalog Metrics...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-8 items-start">
                    {/* Left Column: Feed Connection and Preview */}
                    <div className="space-y-8">
                        {/* Feed Url Card */}
                        <div className="bg-white p-8 rounded-3xl border border-border/50 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
                            
                            <h2 className="text-xl font-bold text-text-main font-outfit mb-2 flex items-center gap-2">
                                <Layers size={20} className="text-primary" />
                                Product Feed Data Source
                            </h2>
                            <p className="text-sm text-text-muted mb-6 font-outfit">
                                Use the dynamic URL below as a scheduled XML feed in Facebook Commerce Manager. The feed is generated in real-time matching the Shopify format to export both products and variants.
                            </p>

                            <div className="flex flex-col sm:flex-row items-stretch gap-2 bg-gray-50 p-2 rounded-2xl border border-border mb-4">
                                <input
                                    type="text"
                                    readOnly
                                    value={feedUrl}
                                    className="bg-transparent border-none outline-none text-xs font-outfit px-3 py-3 w-full text-text-main font-medium overflow-x-auto"
                                    onClick={(e) => e.target.select()}
                                />
                                <button
                                    onClick={handleCopy}
                                    className="shrink-0 flex items-center justify-center gap-2 px-5 py-3 bg-primary text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-primary/95 transition-all shadow-md active:scale-95"
                                >
                                    {copied ? <Check size={14} /> : <Copy size={14} />}
                                    {copied ? 'Copied' : 'Copy URL'}
                                </button>
                            </div>

                            <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-text-muted font-outfit">
                                <div className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                    <span>Format: <strong>XML (RSS 2.0)</strong></span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                    <span>Currency: <strong>BDT</strong></span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                    <span>Live Sync: <strong>Enabled</strong></span>
                                </div>
                            </div>
                        </div>

                        {/* Preview Table */}
                        <div className="bg-white p-8 rounded-3xl border border-border/50 shadow-sm overflow-hidden">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h2 className="text-xl font-bold text-text-main font-outfit">Feed Data Preview</h2>
                                    <p className="text-xs text-text-muted font-outfit">First 5 records exported in the feed</p>
                                </div>
                                <span className="text-[10px] font-bold font-outfit uppercase tracking-widest text-primary border border-primary/20 px-2.5 py-1 rounded-full bg-primary/5">
                                    Live Preview
                                </span>
                            </div>

                            <div className="overflow-x-auto -mx-8">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 border-y border-border/60">
                                            <th className="py-4 px-8 text-xs font-bold text-text-muted uppercase tracking-widest font-outfit">Product</th>
                                            <th className="py-4 px-4 text-xs font-bold text-text-muted uppercase tracking-widest font-outfit">ID / SKU</th>
                                            <th className="py-4 px-4 text-xs font-bold text-text-muted uppercase tracking-widest font-outfit">Price</th>
                                            <th className="py-4 px-4 text-xs font-bold text-text-muted uppercase tracking-widest font-outfit">Stock</th>
                                            <th className="py-4 px-8 text-xs font-bold text-text-muted uppercase tracking-widest font-outfit">Category</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/40">
                                        {previewItems.map((item, index) => (
                                            <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="py-4 px-8 flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg overflow-hidden border border-border/50 shrink-0 bg-gray-50">
                                                        {item.image ? (
                                                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-text-muted text-[10px]">No Img</div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-text-main font-outfit line-clamp-1">{item.name}</p>
                                                        {item.isVariant && (
                                                            <span className="text-[8px] font-bold text-primary font-outfit uppercase tracking-widest bg-primary/5 px-1.5 py-0.5 rounded">
                                                                Variant Item
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4 font-mono text-xs text-text-muted">
                                                    {item.id.length > 15 ? `${item.id.slice(0, 8)}...` : item.id}
                                                </td>
                                                <td className="py-4 px-4 text-sm font-bold text-text-main font-outfit">
                                                    ৳{Number(item.price).toLocaleString()}
                                                </td>
                                                <td className="py-4 px-4">
                                                    <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                                                        item.stock > 0 
                                                            ? 'bg-green-50 text-green-700 border border-green-200/50' 
                                                            : 'bg-red-50 text-red-700 border border-red-200/50'
                                                    }`}>
                                                        {item.stock > 0 ? `${item.stock} in stock` : 'out of stock'}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-8 text-xs text-text-muted font-outfit truncate max-w-[120px]">
                                                    {item.category.split(' > ').pop()}
                                                </td>
                                            </tr>
                                        ))}

                                        {previewItems.length === 0 && (
                                            <tr>
                                                <td colSpan="5" className="py-10 text-center font-outfit text-text-muted text-sm">
                                                    No products found in the catalog.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Statistics & Setup Instructions */}
                    <div className="space-y-8">
                        {/* Feed Statistics */}
                        <div className="bg-white p-8 rounded-3xl border border-border/50 shadow-sm">
                            <h2 className="text-xl font-bold text-text-main font-outfit mb-6">Catalog Statistics</h2>
                            
                            <div className="space-y-6">
                                <div className="flex items-center justify-between border-b border-border/30 pb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl">
                                            <ShoppingBag size={20} />
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider font-outfit">Active Base Products</h4>
                                            <p className="text-lg font-bold text-text-main font-outfit">{activeProductsCount}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between border-b border-border/30 pb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                                            <Layers size={20} />
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider font-outfit">Exported Catalog Items</h4>
                                            <p className="text-lg font-bold text-text-main font-outfit">{totalItemsCount}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                                            <AlertCircle size={20} />
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider font-outfit">Out of Stock Variants</h4>
                                            <p className="text-lg font-bold text-text-main font-outfit">{outOfStockCount}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Setup Instructions */}
                        <div className="bg-white p-8 rounded-3xl border border-border/50 shadow-sm">
                            <h2 className="text-xl font-bold text-text-main font-outfit mb-6 flex items-center gap-2">
                                <BookOpen size={20} className="text-primary" />
                                Facebook Setup Instructions
                            </h2>

                            <div className="space-y-6">
                                <div className="flex gap-4 relative">
                                    <div className="absolute top-8 left-4 w-[1px] h-12 bg-border/60"></div>
                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-sm text-text-muted shrink-0">1</div>
                                    <div>
                                        <h4 className="text-sm font-bold text-text-main font-outfit mb-1">Commerce Manager</h4>
                                        <p className="text-xs text-text-muted font-outfit leading-relaxed">
                                            Go to <a href="https://business.facebook.com/commerce" target="_blank" rel="noopener noreferrer" className="text-primary font-bold inline-flex items-center gap-0.5 hover:underline">Facebook Commerce Manager <ExternalLink size={10} /></a>. Create or select your retail catalog.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-4 relative">
                                    <div className="absolute top-8 left-4 w-[1px] h-12 bg-border/60"></div>
                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-sm text-text-muted shrink-0">2</div>
                                    <div>
                                        <h4 className="text-sm font-bold text-text-main font-outfit mb-1">Add Data Source</h4>
                                        <p className="text-xs text-text-muted font-outfit leading-relaxed">
                                            In the left sidebar, click <strong>Catalog</strong> &gt; <strong>Data Sources</strong>, then click <strong>Add Items</strong> &gt; <strong>Use Data Feed</strong>.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-4 relative">
                                    <div className="absolute top-8 left-4 w-[1px] h-12 bg-border/60"></div>
                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-sm text-text-muted shrink-0">3</div>
                                    <div>
                                        <h4 className="text-sm font-bold text-text-main font-outfit mb-1">Scheduled Feed</h4>
                                        <p className="text-xs text-text-muted font-outfit leading-relaxed">
                                            Select <strong>Scheduled Feed</strong>. In the "Enter URL" field, paste the feed URL copied from this page. Skip username/password since it is publicly accessible.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-sm text-text-muted shrink-0">4</div>
                                    <div>
                                        <h4 className="text-sm font-bold text-text-main font-outfit mb-1">Set Update Frequency</h4>
                                        <p className="text-xs text-text-muted font-outfit leading-relaxed">
                                            Choose an automatic sync schedule (e.g., <strong>Hourly</strong> or <strong>Daily</strong>). Click upload, and Facebook will index your inventory!
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FacebookCatalog;
