import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { productParams } from '../../lib/api/products';
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
        highlights: '',
        spec_frame: '',
        spec_lens: '',
        spec_hardware: '',
        spec_weight: '',
        shipping_info: ''
    });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [additionalFiles, setAdditionalFiles] = useState([]);
    const [additionalPreviews, setAdditionalPreviews] = useState([]);
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
                images: data.images || []
            });
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

    const handleImageChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);

            // Create preview
            if (imagePreview) URL.revokeObjectURL(imagePreview);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleAdditionalImagesChange = (e) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files);
            setAdditionalFiles(prev => [...prev, ...filesArray]);

            // Create previews
            const newPreviews = filesArray.map(file => URL.createObjectURL(file));
            setAdditionalPreviews(prev => [...prev, ...newPreviews]);
        }
    };

    const removeAdditionalFile = (index) => {
        setAdditionalFiles(prev => {
            const newFiles = prev.filter((_, i) => i !== index);
            return newFiles;
        });
        setAdditionalPreviews(prev => {
            URL.revokeObjectURL(prev[index]);
            return prev.filter((_, i) => i !== index);
        });
    };

    // Cleanup object URLs to prevent memory leaks
    useEffect(() => {
        return () => {
            if (imagePreview) URL.revokeObjectURL(imagePreview);
            additionalPreviews.forEach(url => URL.revokeObjectURL(url));
        };
    }, [imagePreview, additionalPreviews]);

    const removeExistingImage = (url) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter(img => img !== url)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            let imageUrl = formData.image_url;
            let allImages = [...formData.images];

            if (imageFile) {
                imageUrl = await productParams.uploadImage(imageFile);
            }

            if (additionalFiles.length > 0) {
                const newImageUrls = await productParams.uploadImages(additionalFiles);
                allImages = [...allImages, ...newImageUrls];
            }

            if (imageUrl && !allImages.includes(imageUrl)) {
                allImages = [imageUrl, ...allImages];
            }

            const payload = {
                name: formData.name,
                price: parseFloat(formData.price),
                description: formData.description,
                stock_quantity: parseInt(formData.stock_quantity),
                category: formData.category,
                style: formData.style,
                image_url: imageUrl,
                images: allImages,
                highlights: formData.highlights,
                spec_frame: formData.spec_frame,
                spec_lens: formData.spec_lens,
                spec_hardware: formData.spec_hardware,
                spec_weight: formData.spec_weight,
                shipping_info: formData.shipping_info
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
                        <section className="bg-white p-8 rounded-3xl border border-border/50 shadow-sm space-y-6">
                            <h3 className="text-xs font-bold text-text-main uppercase tracking-[0.2em] font-outfit border-b border-border/50 pb-4 mb-6">General Information</h3>

                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-xs font-bold text-text-muted uppercase tracking-widest font-outfit ml-1">
                                    <Tag size={12} />
                                    Display Name
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    placeholder="e.g. Classic Wayfarer Onyx"
                                    className="w-full bg-gray-50 border border-border/50 text-text-main px-4 py-4 rounded-2xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-outfit font-bold"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-xs font-bold text-text-muted uppercase tracking-widest font-outfit ml-1">
                                    Description
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows={5}
                                    placeholder="Tell the story behind this product..."
                                    className="w-full bg-gray-50 border border-border/50 text-text-main px-4 py-4 rounded-2xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-outfit text-sm"
                                />
                            </div>

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

                        <section className="bg-white p-8 rounded-3xl border border-border/50 shadow-sm space-y-6">
                            <h3 className="text-xs font-bold text-text-main uppercase tracking-[0.2em] font-outfit border-b border-border/50 pb-4 mb-6">Product Highlights & Shipping</h3>

                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-xs font-bold text-text-muted uppercase tracking-widest font-outfit ml-1">
                                    Product Highlights (One per line)
                                </label>
                                <textarea
                                    name="highlights"
                                    value={formData.highlights || ''}
                                    onChange={handleChange}
                                    rows={4}
                                    placeholder="• Handcrafted frame&#10;• UV400 Protection..."
                                    className="w-full bg-gray-50 border border-border/50 text-text-main px-4 py-4 rounded-2xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-outfit text-sm"
                                />
                            </div>

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

                        <section className="bg-white p-8 rounded-3xl border border-border/50 shadow-sm space-y-6">
                            <h3 className="text-xs font-bold text-text-main uppercase tracking-[0.2em] font-outfit border-b border-border/50 pb-4 mb-6">Technical Specifications</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-text-muted uppercase tracking-widest font-outfit ml-1">Frame Material</label>
                                    <input
                                        type="text"
                                        name="spec_frame"
                                        value={formData.spec_frame || ''}
                                        onChange={handleChange}
                                        placeholder="e.g. Acetate / Metal"
                                        className="w-full bg-gray-50 border border-border/50 text-text-main px-4 py-4 rounded-2xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-outfit text-sm"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-text-muted uppercase tracking-widest font-outfit ml-1">Lens Type</label>
                                    <input
                                        type="text"
                                        name="spec_lens"
                                        value={formData.spec_lens || ''}
                                        onChange={handleChange}
                                        placeholder="e.g. Polarized UV400"
                                        className="w-full bg-gray-50 border border-border/50 text-text-main px-4 py-4 rounded-2xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-outfit text-sm"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-text-muted uppercase tracking-widest font-outfit ml-1">Hardware</label>
                                    <input
                                        type="text"
                                        name="spec_hardware"
                                        value={formData.spec_hardware || ''}
                                        onChange={handleChange}
                                        placeholder="e.g. Italian Hinges"
                                        className="w-full bg-gray-50 border border-border/50 text-text-main px-4 py-4 rounded-2xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-outfit text-sm"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-text-muted uppercase tracking-widest font-outfit ml-1">Weight</label>
                                    <input
                                        type="text"
                                        name="spec_weight"
                                        value={formData.spec_weight || ''}
                                        onChange={handleChange}
                                        placeholder="e.g. 32g"
                                        className="w-full bg-gray-50 border border-border/50 text-text-main px-4 py-4 rounded-2xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-outfit text-sm"
                                    />
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Right: Media */}
                    <div className="space-y-8">
                        <section className="bg-white p-6 rounded-3xl border border-border/50 shadow-sm space-y-6 sticky top-8">
                            <h3 className="text-xs font-bold text-text-main uppercase tracking-[0.2em] font-outfit border-b border-border/50 pb-4 mb-6">Product Media</h3>

                            <div className="space-y-4">
                                <label className="block text-xs font-bold text-text-muted uppercase tracking-widest font-outfit ml-1">Main Cover</label>
                                {(imagePreview || formData.image_url) ? (
                                    <div className="relative group rounded-3xl overflow-hidden aspect-square bg-gray-50 border border-border/50">
                                        <img
                                            src={imagePreview || formData.image_url}
                                            alt="Preview"
                                            className="w-full h-full object-contain mb-multiply transition-opacity duration-300"
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                            <Upload className="text-white" size={32} />
                                        </div>
                                        {imagePreview && (
                                            <div className="absolute top-2 right-2 bg-secondary text-primary text-[8px] font-bold px-2 py-1 rounded-full uppercase tracking-widest animate-in zoom-in">
                                                New Selection
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="aspect-square bg-gray-50 border-2 border-dashed border-border rounded-3xl flex flex-col items-center justify-center text-text-muted">
                                        <Upload size={32} className="mb-2 opacity-20" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest">Upload Cover</span>
                                    </div>
                                )}
                                <input type="file" onChange={handleImageChange} accept="image/*" className="hidden" id="main-upload" />
                                <label htmlFor="main-upload" className="block w-full text-center py-3 border border-border rounded-xl text-xs font-bold uppercase tracking-widest font-outfit cursor-pointer hover:bg-gray-50 transition-colors">
                                    Change Image
                                </label>
                            </div>

                            <div className="space-y-4 pt-6 border-t border-border/50">
                                <label className="block text-xs font-bold text-text-muted uppercase tracking-widest font-outfit ml-1">Gallery</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {formData.images.filter(url => url !== formData.image_url).map((url, idx) => (
                                        <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-border/50 bg-gray-50">
                                            <img src={url} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => removeExistingImage(url)}
                                                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                            >
                                                <X size={10} />
                                            </button>
                                        </div>
                                    ))}
                                    {additionalPreviews.map((url, idx) => (
                                        <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-primary/50 bg-primary/5 group animate-in zoom-in duration-300">
                                            <img src={url} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                                            <button
                                                type="button"
                                                onClick={() => removeAdditionalFile(idx)}
                                                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full shadow-sm hover:bg-red-600 transition-colors"
                                            >
                                                <X size={10} />
                                            </button>
                                            <div className="absolute bottom-0 left-0 w-full bg-primary/80 text-white text-[6px] font-bold py-0.5 text-center uppercase tracking-tighter">
                                                New
                                            </div>
                                        </div>
                                    ))}
                                    <label className="aspect-square rounded-xl border-2 border-dashed border-border flex items-center justify-center text-text-muted cursor-pointer hover:bg-gray-50 transition-colors">
                                        <Plus size={20} className="opacity-30" />
                                        <input type="file" onChange={handleAdditionalImagesChange} accept="image/*" multiple className="hidden" />
                                    </label>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-primary text-white font-bold rounded-2xl hover:bg-primary/95 transition-all shadow-xl shadow-primary/20 font-outfit uppercase tracking-[0.2em] mt-8 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Saving Changes...' : 'Publish Product'}
                            </button>
                        </section>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default ProductForm;
