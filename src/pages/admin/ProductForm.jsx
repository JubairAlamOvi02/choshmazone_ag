import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { productParams } from '../../lib/api/products';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { ChevronLeft, Upload, X, Plus, Package, DollarSign, Layers, Tag, Eye } from 'lucide-react';

const ProductForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = !!id;

    const [formData, setFormData] = useState({
        name: '',
        price: '',
        description: '',
        category: '',
        style: '',
        stock_quantity: 0,
        image_url: '',
        images: [],
        shipping_info: '',
        variants: []
    });
    const [mediaItems, setMediaItems] = useState([]);
    const [draggedIdx, setDraggedIdx] = useState(null);
    const [variantFiles, setVariantFiles] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isEditMode) {
            loadProduct(id);
        }
    }, [id]);

    const loadProduct = async (productId) => {
        try {
            setLoading(true);
            const data = await productParams.fetchById(productId);
            setFormData({
                ...data,
                images: data.images || [],
                variants: data.variants || []
            });
            
            const loadedMedia = [];
            if (data.image_url) {
                loadedMedia.push({ type: 'url', data: data.image_url, id: Math.random().toString() });
            }
            if (data.images) {
                data.images.forEach(url => {
                    if (url !== data.image_url) {
                        loadedMedia.push({ type: 'url', data: url, id: Math.random().toString() });
                    }
                });
            }
            setMediaItems(loadedMedia);
        } catch (err) {
            setError('Failed to load product details');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleMediaAdd = (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;
        
        const newItems = files.map(file => ({
            type: 'file',
            data: file,
            preview: URL.createObjectURL(file),
            id: Math.random().toString()
        }));
        setMediaItems(prev => [...prev, ...newItems]);
    };

    const handleDragStart = (e, index) => {
        setDraggedIdx(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e, index) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e, dropIndex) => {
        e.preventDefault();
        if (draggedIdx === null || draggedIdx === dropIndex) return;
        
        const items = [...mediaItems];
        const draggedItem = items[draggedIdx];
        items.splice(draggedIdx, 1);
        items.splice(dropIndex, 0, draggedItem);
        setMediaItems(items);
        setDraggedIdx(null);
    };

    const removeMediaItem = (index) => {
        setMediaItems(prev => prev.filter((_, i) => i !== index));
    };

    // Cleanup object URLs to prevent memory leaks
    useEffect(() => {
        return () => {
            mediaItems.forEach(item => {
                if (item.type === 'file' && item.preview) URL.revokeObjectURL(item.preview);
            });
        };
    }, [mediaItems]);

    const addVariant = () => {
        setFormData(prev => ({
            ...prev,
            variants: [...prev.variants, { id: Date.now().toString(), color: '', size: '', stock_quantity: 0, price: '', image_url: '' }]
        }));
    };

    const removeVariant = (index) => {
        setFormData(prev => ({
            ...prev,
            variants: prev.variants.filter((_, i) => i !== index)
        }));
    };

    const handleVariantChange = (index, field, value) => {
        setFormData(prev => {
            const newVariants = [...prev.variants];
            newVariants[index] = { ...newVariants[index], [field]: value };
            return { ...prev, variants: newVariants };
        });
    };

    const handleVariantImageUpload = (index, variantId, e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        setVariantFiles(prev => ({ ...prev, [variantId]: file }));
        
        const previewUrl = URL.createObjectURL(file);
        handleVariantChange(index, 'image_url', previewUrl);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            let allImages = [];
            let imageUrl = '';

            for (let i = 0; i < mediaItems.length; i++) {
                const item = mediaItems[i];
                let finalUrl = '';
                if (item.type === 'file') {
                    finalUrl = await productParams.uploadImage(item.data);
                } else {
                    finalUrl = item.data;
                }
                allImages.push(finalUrl);
                if (i === 0) {
                    imageUrl = finalUrl;
                }
            }

            // Upload variant images
            const finalVariants = await Promise.all(formData.variants.map(async (variant) => {
                const file = variantFiles[variant.id];
                let varImageUrl = variant.image_url;
                if (file) {
                    varImageUrl = await productParams.uploadImage(file);
                }
                return { ...variant, image_url: varImageUrl };
            }));

            const payload = {
                name: formData.name,
                price: parseFloat(formData.price),
                description: formData.description,
                stock_quantity: parseInt(formData.stock_quantity),
                category: formData.category,
                style: formData.style,
                image_url: imageUrl,
                images: allImages,
                shipping_info: formData.shipping_info,
                variants: finalVariants
            };

            if (isEditMode) {
                await productParams.update(id, payload);
            } else {
                await productParams.create(payload);
            }

            navigate('/admin/products');
        } catch (err) {
            console.error(err);
            setError('Failed to save product. ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading && isEditMode && !formData.name) {
        return (
            <div className="flex items-center justify-center min-vh-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-4xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/admin/products')}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-text-muted"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-text-main font-outfit uppercase tracking-tight">
                            {isEditMode ? 'Modify Product' : 'Add New Style'}
                        </h1>
                        <p className="text-text-muted font-outfit">Detailed information about your inventory item.</p>
                    </div>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl mb-8 font-outfit text-sm animate-in zoom-in duration-300">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8 pb-20">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left: Product Info */}
                    <div className="lg:col-span-2 space-y-8">
                        <section className="bg-white p-6 rounded-xl border border-border shadow-sm space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-text-main">Title</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    className="w-full bg-white border border-border text-text-main px-3 py-2 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-text-main">Description</label>
                                <div className="bg-white rounded-lg overflow-hidden border border-border focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all react-quill-wrapper">
                                    <ReactQuill 
                                        theme="snow"
                                        value={formData.description}
                                        onChange={(content) => setFormData(prev => ({ ...prev, description: content }))}
                                        placeholder="Tell the story behind this product..."
                                        className="min-h-[200px]"
                                    />
                                </div>
                            </div>
                        </section>
                        
                        {/* Media Section */}
                        <section className="bg-white p-6 rounded-xl border border-border shadow-sm space-y-4">
                            <h3 className="text-sm font-medium text-text-main">Media</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                {mediaItems.map((item, index) => (
                                    <div 
                                        key={item.id} 
                                        draggable 
                                        onDragStart={(e) => handleDragStart(e, index)}
                                        onDragOver={(e) => handleDragOver(e, index)}
                                        onDrop={(e) => handleDrop(e, index)}
                                        className={`relative rounded-xl overflow-hidden border border-border group cursor-grab active:cursor-grabbing bg-gray-50 flex items-center justify-center
                                            ${index === 0 ? 'col-span-2 row-span-2 aspect-[4/5]' : 'col-span-1 row-span-1 aspect-square'}
                                            ${draggedIdx === index ? 'opacity-50' : 'opacity-100'}
                                        `}
                                    >
                                        <img 
                                            src={item.type === 'file' ? item.preview : item.data} 
                                            alt={`Media ${index}`} 
                                            className="w-full h-full object-contain pointer-events-none" 
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeMediaItem(index)}
                                            className="absolute top-2 right-2 p-1.5 bg-white/90 text-red-500 rounded-md shadow hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                                
                                <label className={`rounded-xl border-2 border-dashed border-border flex items-center justify-center text-text-muted cursor-pointer hover:bg-gray-50 transition-colors ${mediaItems.length === 0 ? 'col-span-2 row-span-2 aspect-[4/5]' : 'col-span-1 row-span-1 aspect-square'}`}>
                                    <div className="flex flex-col items-center gap-2">
                                        <Plus size={24} />
                                        {mediaItems.length === 0 && <span className="text-sm font-medium">Add images</span>}
                                    </div>
                                    <input type="file" onChange={handleMediaAdd} accept="image/*" multiple className="hidden" />
                                </label>
                            </div>
                        </section>

                        <section className="bg-white p-8 rounded-3xl border border-border/50 shadow-sm space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-xs font-bold text-text-muted uppercase tracking-widest font-outfit ml-1">
                                        <Package size={12} />
                                        Collection
                                    </label>
                                    <select
                                        name="category"
                                        value={formData.category}
                                        onChange={handleChange}
                                        className="w-full bg-gray-50 border border-border/50 text-text-main px-4 py-4 rounded-2xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-outfit font-bold"
                                    >
                                        <option value="">Select Category</option>
                                        <option value="Men">Men</option>
                                        <option value="Women">Women</option>
                                        <option value="Unisex">Unisex</option>
                                        <option value="Kids">Kids</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-xs font-bold text-text-muted uppercase tracking-widest font-outfit ml-1">
                                        <Layers size={12} />
                                        Frame Style
                                    </label>
                                    <select
                                        name="style"
                                        value={formData.style}
                                        onChange={handleChange}
                                        className="w-full bg-gray-50 border border-border/50 text-text-main px-4 py-4 rounded-2xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-outfit font-bold"
                                    >
                                        <option value="">Select Style</option>
                                        <option value="Wayfarer">Wayfarer</option>
                                        <option value="Aviator">Aviator</option>
                                        <option value="Clubmaster">Clubmaster</option>
                                        <option value="Round">Round</option>
                                        <option value="Square">Square</option>
                                        <option value="oversized">Oversized</option>
                                        <option value="Cat Eye">Cat Eye</option>
                                        <option value="Sport">Sport</option>
                                        <option value="Shield">Shield</option>
                                    </select>
                                </div>
                            </div>
                        </section>

                        <section className="bg-white p-8 rounded-3xl border border-border/50 shadow-sm space-y-6">
                            <h3 className="text-xs font-bold text-text-main uppercase tracking-[0.2em] font-outfit border-b border-border/50 pb-4 mb-6">Pricing & Inventory</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-xs font-bold text-text-muted uppercase tracking-widest font-outfit ml-1">
                                        <DollarSign size={12} />
                                        Retail Price (BDT)
                                    </label>
                                    <input
                                        type="number"
                                        name="price"
                                        value={formData.price}
                                        onChange={handleChange}
                                        required
                                        className="w-full bg-gray-50 border border-border/50 text-text-main px-4 py-4 rounded-2xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-outfit font-bold"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-xs font-bold text-text-muted uppercase tracking-widest font-outfit ml-1">
                                        <Package size={12} />
                                        Current Stock
                                    </label>
                                    <input
                                        type="number"
                                        name="stock_quantity"
                                        value={formData.stock_quantity}
                                        onChange={handleChange}
                                        required
                                        className="w-full bg-gray-50 border border-border/50 text-text-main px-4 py-4 rounded-2xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-outfit font-bold"
                                    />
                                </div>
                            </div>
                        </section>

                        <section className="bg-white rounded-xl border border-border/50 shadow-sm overflow-hidden space-y-0">
                            <div className="p-6 border-b border-border/50 flex justify-between items-center bg-white">
                                <h3 className="text-lg font-semibold text-text-main">Variants</h3>
                                <button
                                    type="button"
                                    onClick={addVariant}
                                    className="flex items-center gap-1 text-sm font-medium text-text-main border border-border/50 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <Plus size={16} /> Add variant
                                </button>
                            </div>

                            {formData.variants && formData.variants.length > 0 ? (
                                <div>
                                    {/* Table Header */}
                                    <div className="grid grid-cols-[auto_1fr_1fr_1fr_auto] gap-4 items-center px-6 py-3 border-b border-border/50 bg-gray-50/50 text-sm font-medium text-text-muted">
                                        <div className="w-5"></div>
                                        <div>Variant</div>
                                        <div>Price</div>
                                        <div>Available</div>
                                        <div></div>
                                    </div>
                                    
                                    {/* Table Body */}
                                    <div className="divide-y divide-border/50">
                                        {formData.variants.map((variant, index) => (
                                            <div key={variant.id || index} className="grid grid-cols-[auto_1fr_1fr_1fr_auto] gap-4 items-center px-6 py-4 bg-white hover:bg-gray-50/50 transition-colors">
                                                
                                                <div className="w-5 flex items-center">
                                                    <input type="checkbox" className="rounded border-gray-300 text-primary focus:ring-primary w-4 h-4 cursor-pointer" />
                                                </div>
                                                
                                                <div className="flex items-center gap-4">
                                                    <div className="relative w-12 h-12 rounded-md border border-border/50 bg-white overflow-hidden group flex items-center justify-center cursor-pointer shrink-0">
                                                        {variant.image_url ? (
                                                            <img src={variant.image_url} alt="Variant" className="w-full h-full object-cover group-hover:opacity-50 transition-opacity" />
                                                        ) : (
                                                            <Upload size={16} className="text-text-muted" />
                                                        )}
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={(e) => handleVariantImageUpload(index, variant.id, e)}
                                                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                                        />
                                                    </div>
                                                    <div className="flex flex-col gap-2 w-full max-w-[150px]">
                                                        <input
                                                            type="text"
                                                            value={variant.color}
                                                            onChange={(e) => handleVariantChange(index, 'color', e.target.value)}
                                                            placeholder="Color"
                                                            className="w-full bg-white border border-border/50 text-text-main px-3 py-1.5 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm"
                                                        />
                                                        <input
                                                            type="text"
                                                            value={variant.size}
                                                            onChange={(e) => handleVariantChange(index, 'size', e.target.value)}
                                                            placeholder="Size"
                                                            className="w-full bg-white border border-border/50 text-text-main px-3 py-1.5 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm"
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">৳</span>
                                                        <input
                                                            type="number"
                                                            value={variant.price}
                                                            onChange={(e) => handleVariantChange(index, 'price', e.target.value)}
                                                            placeholder="1050.00"
                                                            className="w-full bg-white border border-border/50 text-text-main pl-7 pr-3 py-2 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm"
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <input
                                                        type="number"
                                                        value={variant.stock_quantity}
                                                        onChange={(e) => handleVariantChange(index, 'stock_quantity', parseInt(e.target.value) || 0)}
                                                        className="w-full bg-white border border-border/50 text-text-main px-3 py-2 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm"
                                                    />
                                                </div>

                                                <div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeVariant(index)}
                                                        className="text-text-muted hover:text-red-500 transition-colors p-2 rounded-md hover:bg-red-50"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="p-4 border-t border-border/50 bg-gray-50/50 text-center text-sm text-text-main">
                                        Total inventory at Shop location: {formData.variants.reduce((acc, v) => acc + (parseInt(v.stock_quantity) || 0), 0)} available
                                    </div>
                                </div>
                            ) : (
                                <div className="p-8 text-center text-text-muted">
                                    <p className="text-sm mb-2">This product has no variants.</p>
                                    <p className="text-xs opacity-70">Add variants to manage pricing and inventory for different colors or sizes.</p>
                                </div>
                            )}
                        </section>

                        <section className="bg-white p-8 rounded-3xl border border-border/50 shadow-sm space-y-6">
                            <h3 className="text-xs font-bold text-text-main uppercase tracking-[0.2em] font-outfit border-b border-border/50 pb-4 mb-6">Shipping Information</h3>

                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-xs font-bold text-text-muted uppercase tracking-widest font-outfit ml-1">
                                    Shipping Information
                                </label>
                                <textarea
                                    name="shipping_info"
                                    value={formData.shipping_info || ''}
                                    onChange={handleChange}
                                    rows={3}
                                    placeholder="Details about delivery time and returns..."
                                    className="w-full bg-gray-50 border border-border/50 text-text-main px-4 py-4 rounded-2xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-outfit text-sm"
                                />
                            </div>
                        </section>
                    </div>

                    {/* Right: Media */}
                    <div className="space-y-8">
                        <section className="bg-white p-6 rounded-3xl border border-border/50 shadow-sm space-y-6 sticky top-8">
                            <h3 className="text-xs font-bold text-text-main uppercase tracking-[0.2em] font-outfit border-b border-border/50 pb-4 mb-6">Action</h3>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-primary text-white font-bold rounded-2xl hover:bg-primary/95 transition-all shadow-xl shadow-primary/20 font-outfit uppercase tracking-[0.2em] mt-8 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Saving Changes...' : 'Save Product'}
                            </button>
                        </section>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default ProductForm;
