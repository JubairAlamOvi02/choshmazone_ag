import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Star, Upload, Sparkles, Eye, EyeOff, Power, CheckCircle2, Filter } from 'lucide-react';
import { categoryParams } from '../../lib/api/categories';
import { settingsParams } from '../../lib/api/settings';
import { useToast } from '../../context/ToastContext';
import { getCategoryFallbackImage } from '../../components/FeaturedCollections';

const Categories = () => {
    const [categories, setCategories] = useState([]);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryFeatured, setNewCategoryFeatured] = useState(true);
    const [newCategoryActive, setNewCategoryActive] = useState(true);
    const [featuredCategories, setFeaturedCategories] = useState([]);
    const [categoryImages, setCategoryImages] = useState({});
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadingFor, setUploadingFor] = useState(null);
    const [togglingActive, setTogglingActive] = useState(null);
    const [filterTab, setFilterTab] = useState('all'); // 'all' | 'active' | 'inactive'
    const { showToast } = useToast();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [categoriesData, settingsData] = await Promise.all([
                categoryParams.fetchAll(),
                settingsParams.fetchAll()
            ]);

            setCategories(categoriesData);

            // Parse settings
            const getSetting = (key) => settingsData.find(s => s.key === key)?.value;
            
            // Featured list
            const featuredSetting = getSetting('featured_categories');
            let featured = [];
            if (featuredSetting) {
                try {
                    featured = typeof featuredSetting === 'string' ? JSON.parse(featuredSetting) : featuredSetting;
                } catch {
                    featured = featuredSetting.split(',').map(s => s.trim());
                }
            } else {
                // By default, if no setting exists yet, all existing categories are featured
                featured = categoriesData.map(c => c.name);
            }
            setFeaturedCategories(featured);

            // Images map
            const imgMap = {};
            categoriesData.forEach(cat => {
                const normalizedKey = `category_img_${cat.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
                imgMap[cat.name] = getSetting(normalizedKey) || 
                                  getSetting(`category_image_${cat.id}`) || 
                                  getSetting(`${cat.name.toLowerCase()}_collection`) || 
                                  cat.image_url || 
                                  getCategoryFallbackImage(cat.name);
            });
            setCategoryImages(imgMap);

        } catch (error) {
            console.error('Failed to load categories:', error);
            showToast('Failed to load categories', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAddCategory = async (e) => {
        e.preventDefault();
        const trimmed = newCategoryName.trim();
        if (!trimmed) return;

        try {
            setIsSubmitting(true);
            const newCat = await categoryParams.create({ 
                name: trimmed,
                is_active: newCategoryActive 
            });
            
            // Update featured list if requested
            if (newCategoryFeatured) {
                const updatedFeatured = [...new Set([...featuredCategories, trimmed])];
                await settingsParams.set('featured_categories', JSON.stringify(updatedFeatured));
                setFeaturedCategories(updatedFeatured);
            }

            setNewCategoryName('');
            setNewCategoryFeatured(true);
            setNewCategoryActive(true);
            showToast(`Category "${trimmed}" created successfully`, 'success');
            loadData();
        } catch (error) {
            console.error('Failed to add category:', error);
            showToast(error.message || 'Failed to add category', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggleActive = async (category) => {
        const currentActive = category.is_active !== false;
        const newStatus = !currentActive;

        try {
            setTogglingActive(category.id);
            await categoryParams.update(category.id, { is_active: newStatus });
            
            // Update local state immediately
            setCategories(prev => prev.map(c => c.id === category.id ? { ...c, is_active: newStatus } : c));

            if (newStatus) {
                showToast(`Category "${category.name}" is now Active and visible in store`, 'success');
            } else {
                showToast(`Category "${category.name}" deactivated (hidden from store)`, 'info');
            }
        } catch (err) {
            console.error('Failed to toggle category active status:', err);
            showToast('Failed to update category status. Ensure database migration has run.', 'error');
        } finally {
            setTogglingActive(null);
        }
    };

    const handleToggleFeatured = async (categoryName) => {
        try {
            let updated;
            if (featuredCategories.includes(categoryName)) {
                updated = featuredCategories.filter(name => name !== categoryName);
                showToast(`Removed "${categoryName}" from Featured Collections`, 'info');
            } else {
                updated = [...featuredCategories, categoryName];
                showToast(`Added "${categoryName}" to Featured Collections`, 'success');
            }
            setFeaturedCategories(updated);
            await settingsParams.set('featured_categories', JSON.stringify(updated));
        } catch (err) {
            console.error('Failed to update featured category:', err);
            showToast('Failed to update featured status', 'error');
        }
    };

    const handleImageUpload = async (e, category) => {
        if (!e.target.files || !e.target.files[0]) return;
        const file = e.target.files[0];

        try {
            setUploadingFor(category.name);
            const publicUrl = await categoryParams.uploadImage(file);
            const normalizedKey = `category_img_${category.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
            
            // Save to site_settings
            await settingsParams.set(normalizedKey, publicUrl);
            await settingsParams.set(`category_image_${category.id}`, publicUrl);
            
            // Try updating category table if column exists
            try {
                await categoryParams.update(category.id, { image_url: publicUrl });
            } catch {
                // Ignore if column doesn't exist
            }

            setCategoryImages(prev => ({ ...prev, [category.name]: publicUrl }));
            showToast(`Updated image for ${category.name}`, 'success');
        } catch (err) {
            console.error('Failed to upload category image:', err);
            showToast('Failed to upload image', 'error');
        } finally {
            setUploadingFor(null);
        }
    };

    const handleDeleteCategory = async (id, name) => {
        if (!window.confirm(`Are you sure you want to permanently delete the category "${name}"?\n\nTip: If you might need this category in the future, you can deactivate it instead of deleting.`)) {
            return;
        }

        try {
            await categoryParams.delete(id);
            // Remove from featured
            const updatedFeatured = featuredCategories.filter(catName => catName !== name);
            await settingsParams.set('featured_categories', JSON.stringify(updatedFeatured));
            
            showToast('Category deleted successfully', 'success');
            loadData();
        } catch (error) {
            console.error('Failed to delete category:', error);
            showToast('Failed to delete category', 'error');
        }
    };

    // Filter categories based on active tab
    const activeCount = categories.filter(c => c.is_active !== false).length;
    const inactiveCount = categories.filter(c => c.is_active === false).length;

    const displayedCategories = categories.filter(cat => {
        if (filterTab === 'active') return cat.is_active !== false;
        if (filterTab === 'inactive') return cat.is_active === false;
        return true;
    });

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-text-main font-outfit uppercase tracking-tight">Categories & Collections</h1>
                    <p className="text-text-muted font-outfit">Manage store categories, activate/deactivate temporary items, update images, and select Featured Collections.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Add Category Form */}
                <div className="lg:col-span-4">
                    <div className="bg-white p-6 rounded-3xl border border-border shadow-sm sticky top-24">
                        <h2 className="text-lg font-bold text-text-main font-outfit mb-4 flex items-center gap-2">
                            <Plus size={20} className="text-primary" />
                            Add New Category
                        </h2>
                        <form onSubmit={handleAddCategory} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold font-outfit uppercase tracking-wider text-text-main mb-2">Category Name</label>
                                <input
                                    type="text"
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                    placeholder="e.g. Luxury Shades, Sports, etc."
                                    className="w-full bg-gray-50 border border-border text-text-main px-4 py-3 rounded-xl focus:bg-white focus:border-primary outline-none transition-all font-outfit text-sm"
                                    required
                                />
                            </div>

                            {/* Active Status Checkbox */}
                            <div className="p-3 bg-gray-50 rounded-xl border border-border/60">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={newCategoryActive}
                                        onChange={(e) => setNewCategoryActive(e.target.checked)}
                                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-border"
                                    />
                                    <div className="text-xs font-outfit">
                                        <span className="font-bold text-text-main flex items-center gap-1.5">
                                            <span className={`w-2 h-2 rounded-full ${newCategoryActive ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
                                            Active Status
                                        </span>
                                        <span className="text-text-muted">Visible in navigation, collections & shop filters</span>
                                    </div>
                                </label>
                            </div>

                            {/* Featured Checkbox */}
                            <div className="p-3 bg-gray-50 rounded-xl border border-border/60">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={newCategoryFeatured}
                                        onChange={(e) => setNewCategoryFeatured(e.target.checked)}
                                        className="w-4 h-4 rounded text-primary focus:ring-primary border-border"
                                    />
                                    <div className="text-xs font-outfit">
                                        <span className="font-bold text-text-main block">Show in Featured Collections</span>
                                        <span className="text-text-muted">Will be highlighted on the Homepage & Collections page</span>
                                    </div>
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting || !newCategoryName.trim()}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/95 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed font-outfit uppercase tracking-wider text-xs"
                            >
                                <Plus size={16} />
                                {isSubmitting ? 'Adding...' : 'Create Category'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Categories List */}
                <div className="lg:col-span-8">
                    <div className="bg-white rounded-3xl border border-border shadow-sm overflow-hidden">
                        {/* Header & Stats */}
                        <div className="p-6 border-b border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <h2 className="text-lg font-bold text-text-main font-outfit uppercase tracking-tight">Existing Categories</h2>
                                <p className="text-xs text-text-muted font-outfit">Deactivate temporary categories to hide them from store without deleting.</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full font-outfit uppercase">
                                    {categories.length} Total
                                </span>
                                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-full font-outfit uppercase flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                    {activeCount} Active
                                </span>
                                {inactiveCount > 0 && (
                                    <span className="text-xs font-bold text-gray-700 bg-gray-200 px-3 py-1.5 rounded-full font-outfit uppercase">
                                        {inactiveCount} Inactive
                                    </span>
                                )}
                                <span className="text-xs font-bold text-amber-700 bg-amber-100 px-3 py-1.5 rounded-full font-outfit uppercase flex items-center gap-1">
                                    <Star size={12} className="fill-amber-500 text-amber-500" />
                                    {featuredCategories.length} Featured
                                </span>
                            </div>
                        </div>

                        {/* Filter Tabs */}
                        <div className="px-6 py-3 bg-gray-50/70 border-b border-border flex items-center gap-2">
                            <span className="text-xs font-bold text-text-muted font-outfit uppercase tracking-wider flex items-center gap-1 mr-2">
                                <Filter size={12} /> View:
                            </span>
                            <button
                                onClick={() => setFilterTab('all')}
                                className={`px-3 py-1 text-xs font-bold font-outfit uppercase tracking-wider rounded-lg transition-all ${
                                    filterTab === 'all'
                                        ? 'bg-primary text-white shadow-sm'
                                        : 'bg-white text-text-muted hover:text-text-main border border-border'
                                }`}
                            >
                                All ({categories.length})
                            </button>
                            <button
                                onClick={() => setFilterTab('active')}
                                className={`px-3 py-1 text-xs font-bold font-outfit uppercase tracking-wider rounded-lg transition-all ${
                                    filterTab === 'active'
                                        ? 'bg-emerald-600 text-white shadow-sm'
                                        : 'bg-white text-text-muted hover:text-text-main border border-border'
                                }`}
                            >
                                Active ({activeCount})
                            </button>
                            <button
                                onClick={() => setFilterTab('inactive')}
                                className={`px-3 py-1 text-xs font-bold font-outfit uppercase tracking-wider rounded-lg transition-all ${
                                    filterTab === 'inactive'
                                        ? 'bg-gray-700 text-white shadow-sm'
                                        : 'bg-white text-text-muted hover:text-text-main border border-border'
                                }`}
                            >
                                Inactive ({inactiveCount})
                            </button>
                        </div>
                        
                        {loading ? (
                            <div className="p-12 flex justify-center">
                                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
                            </div>
                        ) : displayedCategories.length === 0 ? (
                            <div className="p-12 text-center text-text-muted font-outfit">
                                {filterTab === 'inactive'
                                    ? 'No inactive categories. All categories are currently active.'
                                    : filterTab === 'active'
                                    ? 'No active categories found.'
                                    : 'No categories found. Add your first category using the form on the left.'}
                            </div>
                        ) : (
                            <div className="divide-y divide-border">
                                {displayedCategories.map(category => {
                                    const isFeatured = featuredCategories.includes(category.name);
                                    const isActive = category.is_active !== false;
                                    const isUploading = uploadingFor === category.name;
                                    const isToggling = togglingActive === category.id;
                                    const currentImg = categoryImages[category.name] || getCategoryFallbackImage(category.name);

                                    return (
                                        <div 
                                            key={category.id} 
                                            className={`p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
                                                isActive ? 'hover:bg-gray-50/50' : 'bg-gray-50/40 opacity-75 hover:opacity-100 hover:bg-gray-50'
                                            }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                {/* Image Thumbnail with Upload Trigger */}
                                                <div className={`relative w-16 h-16 rounded-2xl overflow-hidden bg-gray-100 border border-border flex-shrink-0 group/thumb ${!isActive ? 'grayscale' : ''}`}>
                                                    <img
                                                        src={currentImg}
                                                        alt={category.name}
                                                        className="w-full h-full object-cover group-hover/thumb:scale-110 transition-transform duration-300"
                                                    />
                                                    <label className="absolute inset-0 bg-black/50 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                                                        <Upload size={16} className="text-white" />
                                                        <input
                                                            type="file"
                                                            className="hidden"
                                                            accept="image/*"
                                                            disabled={isUploading}
                                                            onChange={(e) => handleImageUpload(e, category)}
                                                        />
                                                    </label>
                                                    {isUploading && (
                                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex flex-col">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className={`font-bold font-outfit text-base ${isActive ? 'text-text-main' : 'text-text-muted line-through decoration-text-muted/40'}`}>
                                                            {category.name}
                                                        </span>
                                                        
                                                        {/* Active / Inactive Badge */}
                                                        {isActive ? (
                                                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                                                Active
                                                            </span>
                                                        ) : (
                                                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600 bg-gray-200 border border-gray-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                                <EyeOff size={10} />
                                                                Inactive
                                                            </span>
                                                        )}

                                                        {isFeatured && (
                                                            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                                <Star size={10} className="fill-amber-500 text-amber-500" /> Featured
                                                            </span>
                                                        )}
                                                    </div>

                                                    <label className="text-xs text-primary hover:underline cursor-pointer inline-flex items-center gap-1 mt-1 font-outfit font-medium">
                                                        <Upload size={12} />
                                                        Change Photo
                                                        <input
                                                            type="file"
                                                            className="hidden"
                                                            accept="image/*"
                                                            disabled={isUploading}
                                                            onChange={(e) => handleImageUpload(e, category)}
                                                        />
                                                    </label>
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex flex-wrap items-center gap-2.5 self-end sm:self-center">
                                                {/* Active / Deactivate Toggle Button */}
                                                <button
                                                    onClick={() => handleToggleActive(category)}
                                                    disabled={isToggling}
                                                    className={`px-3.5 py-2 rounded-xl text-xs font-bold font-outfit uppercase tracking-wider flex items-center gap-1.5 transition-all border ${
                                                        isActive
                                                            ? 'bg-emerald-50 text-emerald-700 hover:bg-red-50 hover:text-red-700 hover:border-red-200 border-emerald-200'
                                                            : 'bg-gray-100 text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border-gray-300'
                                                    }`}
                                                    title={isActive ? 'Click to deactivate (hide from store)' : 'Click to activate (make visible in store)'}
                                                >
                                                    {isToggling ? (
                                                        <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                                    ) : (
                                                        <Power size={13} className={isActive ? 'text-emerald-600' : 'text-gray-400'} />
                                                    )}
                                                    <span>{isActive ? 'Active' : 'Deactivated'}</span>
                                                </button>

                                                {/* Featured Button */}
                                                <button
                                                    onClick={() => handleToggleFeatured(category.name)}
                                                    className={`px-3.5 py-2 rounded-xl text-xs font-bold font-outfit uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                                                        isFeatured
                                                            ? 'bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-300'
                                                            : 'bg-gray-100 text-text-muted hover:bg-gray-200 hover:text-text-main border border-border'
                                                    }`}
                                                    title={isFeatured ? 'Click to unfeature' : 'Click to feature in collections'}
                                                >
                                                    <Star size={13} className={isFeatured ? 'fill-amber-500 text-amber-500' : 'text-gray-400'} />
                                                    {isFeatured ? 'Featured' : 'Make Featured'}
                                                </button>

                                                {/* Delete Button */}
                                                <button
                                                    onClick={() => handleDeleteCategory(category.id, category.name)}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors border border-transparent hover:border-red-200"
                                                    title="Delete permanently"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Categories;
