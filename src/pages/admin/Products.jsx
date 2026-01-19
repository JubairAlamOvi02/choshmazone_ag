import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { productParams } from '../../lib/api/products';

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

        try {
            await productParams.delete(id);
            setProducts(products.filter(p => p.id !== id));
        } catch (err) {
            console.error('Delete error:', err);
            let message = 'Failed to delete product.';
            if (err.code === '23503') {
                message = 'Cannot delete product because it has associated orders. Try deactivating it instead.';
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


    if (loading) return <div>Loading products...</div>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div className="admin-products">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1>Products</h1>
                <Link to="/admin/products/new" style={{ padding: '0.5rem 1rem', background: '#333', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>
                    Add New Product
                </Link>
            </div>

            <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: '#f8f9fa', borderBottom: '1px solid #eee' }}>
                        <tr>
                            <th style={{ padding: '1rem' }}>Image</th>
                            <th style={{ padding: '1rem' }}>Name</th>
                            <th style={{ padding: '1rem' }}>Price</th>
                            <th style={{ padding: '1rem' }}>Stock</th>
                            <th style={{ padding: '1rem' }}>Active</th>
                            <th style={{ padding: '1rem' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.length === 0 ? (
                            <tr>
                                <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
                                    No products found. Add your first product!
                                </td>
                            </tr>
                        ) : (
                            products.map(product => (
                                <tr key={product.id} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '1rem' }}>
                                        {product.image_url && (
                                            <img
                                                src={product.image_url}
                                                alt={product.name}
                                                style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }}
                                            />
                                        )}
                                    </td>
                                    <td style={{ padding: '1rem', fontWeight: '500' }}>{product.name}</td>
                                    <td style={{ padding: '1rem' }}>৳{product.price}</td>
                                    <td style={{ padding: '1rem' }}>{product.stock_quantity}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{
                                            padding: '0.25rem 0.5rem',
                                            borderRadius: '999px',
                                            fontSize: '0.8rem',
                                            background: product.is_active !== false ? '#e6f4ea' : '#fce8e6',
                                            color: product.is_active !== false ? '#1e7e34' : '#c5221f'
                                        }}>
                                            {product.is_active !== false ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                onClick={() => handleToggleStatus(product)}
                                                style={{ padding: '0.25rem 0.5rem', border: '1px solid #666', borderRadius: '4px', background: 'none', color: '#666', cursor: 'pointer', fontSize: '0.9rem' }}
                                            >
                                                {product.is_active !== false ? 'Deactivate' : 'Activate'}
                                            </button>
                                            <Link
                                                to={`/admin/products/edit/${product.id}`}
                                                style={{ padding: '0.25rem 0.5rem', border: '1px solid #ddd', borderRadius: '4px', textDecoration: 'none', color: '#333', fontSize: '0.9rem' }}
                                            >
                                                Edit
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(product.id)}
                                                style={{ padding: '0.25rem 0.5rem', border: '1px solid #ff4d4d', borderRadius: '4px', background: 'none', color: '#ff4d4d', cursor: 'pointer', fontSize: '0.9rem' }}
                                            >
                                                Delete
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
    );
};

export default AdminProducts;
