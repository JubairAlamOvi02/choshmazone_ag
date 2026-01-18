import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Button from '../components/Button';
import { productParams } from '../lib/api/products';
import './ProductDetails.css';

const ProductDetails = () => {
    const { id } = useParams();
    const { addToCart } = useCart();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getProduct = async () => {
            try {
                setLoading(true);
                const data = await productParams.fetchById(id);
                // Map fields to match component expectations
                setProduct({
                    ...data,
                    title: data.name,
                    image: data.image_url
                });
            } catch (error) {
                console.error("Error fetching product details:", error);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            getProduct();
        }
    }, [id]);

    if (loading) return <div>Loading...</div>;

    if (!product) {
        return (
            <div className="product-not-found">
                <Navbar />
                <div className="container section-padding text-center">
                    <h2 className="h2">Product Not Found</h2>
                    <p>The product you are looking for does not exist.</p>
                    <Link to="/shop">
                        <Button variant="primary">Back to Shop</Button>
                    </Link>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="product-details-page">
            <Navbar />

            <main className="container section-padding">
                <div className="pdp-layout">
                    {/* Left: Image Gallery */}
                    <div className="pdp-gallery">
                        <div className="main-image-container">
                            <img src={product.image} alt={product.title} className="pdp-main-image" />
                        </div>
                        <div className="thumbnail-grid">
                            {/* Placeholder thumbnails (reusing main image for demo) */}
                            {[1, 2, 3].map((_, index) => (
                                <div key={index} className="thumbnail-container">
                                    <img src={product.image} alt="Thumbnail" className="thumbnail-image" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Product Info */}
                    <div className="pdp-info">
                        <div className="pdp-header">
                            <span className="pdp-category">{product.category}</span>
                            <h1 className="pdp-title">{product.title}</h1>
                            <div className="pdp-price">৳{product.price}</div>
                        </div>

                        <div className="pdp-description">
                            <p>Experience premium vision with our handcrafted {product.style} sunglasses. Designed for ultimate comfort and durability, these frames feature high-quality materials and 100% UV protection lenses.</p>
                            <ul className="pdp-features">
                                <li>Premium Acetate Frame</li>
                                <li>Polarized Lenses</li>
                                <li>100% UV400 Protection</li>
                                <li>Includes Hard Case & Cloth</li>
                            </ul>
                        </div>

                        <div className="pdp-actions">
                            <Button variant="primary" size="large" style={{ width: '100%' }} onClick={() => addToCart(product)}>Add to Cart</Button>
                            <Button variant="outline" size="large" style={{ width: '100%' }}>Add to Wishlist</Button>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default ProductDetails;
