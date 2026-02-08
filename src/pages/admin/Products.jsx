import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { productParams } from '../../lib/api/products';
import { Plus, Edit3, Trash2, Power, PowerOff, Glasses, Search, Filter } from 'lucide-react';

const AdminProducts = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const data = await productParams.fetchAll();
            setProducts(data);
        } catch (err) {
            setError('Failed to fetch products');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this product?')) return;

        console.log('Initiating delete for product ID:', id);
        try {
            await productParams.delete(id);
            setProducts(products.filter(p => p.id !== id));
        } catch (err) {
            console.error('Delete error details:', err); // Log the object directly
            console.error('Delete error JSON:', JSON.stringify(err, null, 2)); // improved logging

            let message = 'Failed to delete product.';
            let isFKViolation = false;

            // Check for Foreign Key Violation (Postgres code 23503 or HTTP 409 Conflict)
            if (err.code === '23503' || err.status === 409) {
                isFKViolation = true;
            } else if (err.message && err.message.toLowerCase().includes('violates foreign key constraint')) {
                isFKViolation = true;
            }

            if (isFKViolation) {
                message = '⚠️ Cannot Delete Product\n\nThis product is part of existing customer orders. Deleting it would corrupt your order history.\n\nSolution: Click the "Active/Inactive" status button to hide it from the shop instead.';
            } else if (err.status === 404) {
                message = 'Product not found. It may have already been deleted.';
            } else if (err.message) {
                message = `Failed to delete product: ${err.message}`;
            }

            alert(message);
        }
    };

    const handleToggleStatus = async (product) => {
        try {
            const newStatus = !product.is_active;
            await productParams.update(product.id, { is_active: newStatus });
            setProducts(products.map(p => p.id === product.id ? { ...p, is_active: newStatus } : p));
        } catch (err) {
            console.error('Toggle error:', err);
            alert('Failed to update product status');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error) return (
        <div className="p-8 bg-red-50 text-red-600 rounded-2xl border border-red-100 font-outfit text-center">
            {error}
        </div>
    );

    return (
        <div className="animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div>
                    <h1 className="text-3xl font-bold text-text-main font-outfit uppercase tracking-tight">Inventory</h1>
                    <p className="text-text-muted font-outfit">Manage your product catalog and availability.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white border border-border rounded-xl">
                        <Search size={18} className="text-text-muted" />
                        <input
                            type="text"
                            placeholder="Search products..."
                            className="bg-transparent border-none outline-none text-sm font-outfit w-40"
                        />
                    </div>
                    <Link to="/admin/products/new" className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/95 transition-all shadow-lg shadow-primary/20 font-outfit uppercase tracking-widest text-sm">
                        <Plus size={18} />
                        New Product
                    </Link>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-border/50 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-border/50">
                                <th className="px-6 py-5 text-xs font-bold text-text-muted uppercase tracking-[0.2em] font-outfit">Product</th>
                                <th className="px-6 py-5 text-xs font-bold text-text-muted uppercase tracking-[0.2em] font-outfit">Price</th>
                                <th className="px-6 py-5 text-xs font-bold text-text-muted uppercase tracking-[0.2em] font-outfit">Stock</th>
                                <th className="px-6 py-5 text-xs font-bold text-text-muted uppercase tracking-[0.2em] font-outfit">Category</th>
                                <th className="px-6 py-5 text-xs font-bold text-text-muted uppercase tracking-[0.2em] font-outfit">Status</th>
                                <th className="px-6 py-5 text-xs font-bold text-text-muted uppercase tracking-[0.2em] font-outfit text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                            {products.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center justify-center text-text-muted">
                                            <Glasses size={48} className="mb-4 opacity-20" />
                                            <p className="font-outfit">No products found. Start adding your collection!</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                products.map(product => (
                                    <tr key={product.id} className="hover:bg-gray-50/30 transition-colors group">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-lg bg-gray-50 border border-border/50 overflow-hidden flex items-center justify-center">
                                                    {product.image_url ? (
                                                        <img src={product.image_url} alt={product.name} className="w-full h-full object-contain mix-blend-multiply" />
                                                    ) : (
                                                        <Glasses size={20} className="text-gray-300" />
                                                    )}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-text-main font-outfit leading-tight mb-1">{product.name}</span>
                                                    <span className="text-[10px] text-text-muted font-bold uppercase tracking-widest">{product.brand || 'No Brand'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="text-sm font-bold text-text-main font-outfit">৳{product.price.toLocaleString()}</span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${product.stock_quantity > 10 ? 'bg-green-500' : 'bg-amber-500'}`}></div>
                                                <span className="text-sm font-bold text-text-main font-outfit">{product.stock_quantity} units</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="text-xs font-bold text-text-muted uppercase tracking-widest font-outfit italic">{product.category}</span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <button
                                                onClick={() => handleToggleStatus(product)}
                                                className={`
                                                    text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full transition-all
                                                    ${product.is_active !== false
                                                        ? 'bg-green-50 text-green-600 hover:bg-green-100'
                                                        : 'bg-red-50 text-red-600 hover:bg-red-100'}
                                                `}
                                            >
                                                {product.is_active !== false ? 'Active' : 'Inactive'}
                                            </button>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link
                                                    to={`/admin/products/edit/${product.id}`}
                                                    className="p-2 text-gray-400 hover:text-text-main hover:bg-gray-100 rounded-lg transition-all"
                                                    title="Edit Product"
                                                >
                                                    <Edit3 size={18} />
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(product.id)}
                                                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                    title="Delete Product"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminProducts;
