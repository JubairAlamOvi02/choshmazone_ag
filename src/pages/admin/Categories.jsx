import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { categoryParams } from '../../lib/api/categories';
import { useToast } from '../../context/ToastContext';

const Categories = () => {
    const [categories, setCategories] = useState([]);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { showToast } = useToast();

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            setLoading(true);
            const data = await categoryParams.fetchAll();
            setCategories(data);
        } catch (error) {
            console.error('Failed to load categories:', error);
            showToast('Failed to load categories', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAddCategory = async (e) => {
        e.preventDefault();
        if (!newCategoryName.trim()) return;

        try {
            setIsSubmitting(true);
            await categoryParams.create({ name: newCategoryName.trim() });
            setNewCategoryName('');
            showToast('Category added successfully', 'success');
            loadCategories();
        } catch (error) {
            console.error('Failed to add category:', error);
            showToast(error.message || 'Failed to add category', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteCategory = async (id, name) => {
        if (!window.confirm(`Are you sure you want to delete the category "${name}"?`)) {
            return;
        }

        try {
            await categoryParams.delete(id);
            showToast('Category deleted successfully', 'success');
            loadCategories();
        } catch (error) {
            console.error('Failed to delete category:', error);
            showToast('Failed to delete category', 'error');
        }
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div>
                    <h1 className="text-3xl font-bold text-text-main font-outfit uppercase tracking-tight">Categories</h1>
                    <p className="text-text-muted font-outfit">Manage product categories</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Add Category Form */}
                <div className="md:col-span-1">
                    <div className="bg-white p-6 rounded-3xl border border-border shadow-sm">
                        <h2 className="text-lg font-bold text-text-main font-outfit mb-4">Add New Category</h2>
                        <form onSubmit={handleAddCategory} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-text-main mb-2">Category Name</label>
                                <input
                                    type="text"
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                    placeholder="e.g. Accessories"
                                    className="w-full bg-white border border-border text-text-main px-4 py-3 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isSubmitting || !newCategoryName.trim()}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/95 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Plus size={18} />
                                {isSubmitting ? 'Adding...' : 'Add Category'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Categories List */}
                <div className="md:col-span-2">
                    <div className="bg-white rounded-3xl border border-border shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-border flex justify-between items-center">
                            <h2 className="text-lg font-bold text-text-main font-outfit">Existing Categories</h2>
                            <span className="text-sm font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">{categories.length} Total</span>
                        </div>
                        
                        {loading ? (
                            <div className="p-8 flex justify-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                            </div>
                        ) : categories.length === 0 ? (
                            <div className="p-8 text-center text-text-muted">
                                No categories found. Add your first category.
                            </div>
                        ) : (
                            <div className="divide-y divide-border">
                                {categories.map(category => (
                                    <div key={category.id} className="p-6 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-text-main font-outfit">{category.name}</span>
                                            <span className="text-xs text-text-muted mt-1">
                                                Created {new Date(category.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteCategory(category.id, category.name)}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete category"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Categories;
