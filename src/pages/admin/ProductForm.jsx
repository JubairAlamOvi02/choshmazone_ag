import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { productParams } from '../../lib/api/products';

const ProductForm = () => {
    const { id } = useParams(); // Check if we are in "Edit" mode
    const navigate = useNavigate();
    const isEditMode = !!id;

    const [formData, setFormData] = useState({
        name: '',
        price: '',
        description: '',
        category: '',
        stock_quantity: 0,
        image_url: ''
    });
    const [imageFile, setImageFile] = useState(null);
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
            setFormData(data);
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
            setImageFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            let imageUrl = formData.image_url;

            // Upload new image if selected
            if (imageFile) {
                imageUrl = await productParams.uploadImage(imageFile);
            }

            const payload = {
                name: formData.name,
                price: parseFloat(formData.price),
                description: formData.description,
                stock_quantity: parseInt(formData.stock_quantity),
                category: formData.category, // Assuming you might add a category field later
                image_url: imageUrl
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

    if (loading && isEditMode && !formData.name) return <div>Loading...</div>;

    return (
        <div className="admin-product-form">
            <h1>{isEditMode ? 'Edit Product' : 'Add New Product'}</h1>
            {error && <div className="error-message" style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

            <form onSubmit={handleSubmit} style={{ background: 'white', padding: '2rem', borderRadius: '8px', maxWidth: '600px', marginTop: '1rem' }}>
                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Product Name</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                        required
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Price (৳)</label>
                        <input
                            type="number"
                            name="price"
                            value={formData.price}
                            onChange={handleChange}
                            style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                            required
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Stock Quantity</label>
                        <input
                            type="number"
                            name="stock_quantity"
                            value={formData.stock_quantity}
                            onChange={handleChange}
                            style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                            required
                        />
                    </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Description</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px', minHeight: '100px' }}
                    />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Image</label>
                    {formData.image_url && (
                        <div style={{ marginBottom: '0.5rem' }}>
                            <img src={formData.image_url} alt="Current" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '4px' }} />
                        </div>
                    )}
                    <input type="file" onChange={handleImageChange} accept="image/*" />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    style={{ padding: '0.75rem 1.5rem', background: '#333', color: 'white', border: 'none', borderRadius: '4px', cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1 }}
                >
                    {loading ? 'Saving...' : 'Save Product'}
                </button>
            </form>
        </div>
    );
};

export default ProductForm;
