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
        style: '',
        stock_quantity: 0,
        image_url: '',
        images: []
    });
    const [imageFile, setImageFile] = useState(null);
    const [additionalFiles, setAdditionalFiles] = useState([]);
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
            setImageFile(e.target.files[0]);
        }
    };

    const handleAdditionalImagesChange = (e) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files);
            setAdditionalFiles(prev => [...prev, ...filesArray]);
        }
    };

    const removeAdditionalFile = (index) => {
        setAdditionalFiles(prev => prev.filter((_, i) => i !== index));
    };

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

            // Upload main image if selected
            if (imageFile) {
                imageUrl = await productParams.uploadImage(imageFile);
                // The main image should also be the first in the 'images' array
                // If it's a new main image, we might want to update the array too
            }

            // Upload additional images
            if (additionalFiles.length > 0) {
                const newImageUrls = await productParams.uploadImages(additionalFiles);
                allImages = [...allImages, ...newImageUrls];
            }

            // Ensure main image is included in 'allImages' if not already there
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
                images: allImages
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Category</label>
                        <select
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                        >
                            <option value="">Select Category</option>
                            <option value="Men">Men</option>
                            <option value="Women">Women</option>
                            <option value="Unisex">Unisex</option>
                            <option value="Kids">Kids</option>
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Style</label>
                        <select
                            name="style"
                            value={formData.style}
                            onChange={handleChange}
                            style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
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
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Main Display Image (Required)</label>
                    {formData.image_url && (
                        <div style={{ marginBottom: '0.5rem' }}>
                            <img src={formData.image_url} alt="Current" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '4px' }} />
                        </div>
                    )}
                    <input type="file" onChange={handleImageChange} accept="image/*" />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Additional Images (Optional Gallery)</label>

                    {/* Existing Images from DB */}
                    {(formData.images && formData.images.length > 0) && (
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                            {formData.images.map((url, idx) => (
                                <div key={idx} style={{ position: 'relative' }}>
                                    <img src={url} alt={`Gallery ${idx}`} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px', border: url === formData.image_url ? '2px solid #333' : '1px solid #ddd' }} />
                                    <button
                                        type="button"
                                        onClick={() => removeExistingImage(url)}
                                        style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'red', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', fontSize: '12px', cursor: 'pointer' }}
                                    >×</button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* New Files to upload */}
                    {additionalFiles.length > 0 && (
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                            {additionalFiles.map((file, idx) => (
                                <div key={idx} style={{ position: 'relative' }}>
                                    <div style={{ width: '80px', height: '80px', background: '#f0f0f0', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', textAlign: 'center', overflow: 'hidden' }}>
                                        {file.name}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeAdditionalFile(idx)}
                                        style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'red', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', fontSize: '12px', cursor: 'pointer' }}
                                    >×</button>
                                </div>
                            ))}
                        </div>
                    )}

                    <input type="file" onChange={handleAdditionalImagesChange} accept="image/*" multiple />
                    <p style={{ fontSize: '12px', color: '#666', marginTop: '0.25rem' }}>You can select multiple files at once.</p>
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
