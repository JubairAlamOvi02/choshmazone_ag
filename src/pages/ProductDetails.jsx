import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Button from '../components/Button';
import { productParams } from '../lib/api/products';

const ProductDetails = () => {
    const { id } = useParams();
    const { addToCart } = useCart();
    const [product, setProduct] = useState(null);
    const [mainImage, setMainImage] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getProduct = async () => {
            try {
                setLoading(true);
                const data = await productParams.fetchById(id);
                const formattedProduct = {
                    ...data,
                    title: data.name,
                    image: data.image_url,
                    images: data.images && data.images.length > 0 ? data.images : [data.image_url]
                };
                setProduct(formattedProduct);
                setMainImage(formattedProduct.image);
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

    if (loading) {
        return (
            <div className="min-h-screen bg-white">
                <Navbar />
                <div className="flex justify-center items-center min-h-[60vh]">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
                <Footer />
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen bg-white">
                <Navbar />
                <div className="container mx-auto px-4 py-20 text-center">
                    <h2 className="text-3xl font-bold mb-4 font-outfit">Product Not Found</h2>
                    <p className="text-text-muted mb-8 font-outfit">The product you are looking for does not exist.</p>
                    <Link to="/shop">
                        <Button variant="primary">Back to Shop</Button>
                    </Link>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            <Navbar />

            <main className="container mx-auto px-4 py-12 md:py-20">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
                    {/* Left: Image Gallery */}
                    <div className="flex flex-col gap-6">
                        <div className="bg-gray-50 rounded-xl overflow-hidden aspect-square flex items-center justify-center border border-border shadow-sm">
                            <img src={mainImage} alt={product.title} className="w-full h-full object-contain mix-blend-multiply" />
                        </div>
                        {product.images.length > 1 && (
                            <div className="grid grid-cols-4 sm:grid-cols-5 gap-4">
                                {product.images.map((img, index) => (
                                    <div
                                        key={index}
                                        className={`p-2 bg-white border rounded-lg aspect-square cursor-pointer transition-all duration-200 ${mainImage === img ? 'border-primary ring-1 ring-primary' : 'border-border hover:border-text-muted'}`}
                                        onClick={() => setMainImage(img)}
                                    >
                                        <img src={img} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-contain mix-blend-multiply" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right: Product Info */}
                    <div className="flex flex-col">
                        <div className="mb-8">
                            <span className="text-xs md:text-sm font-bold uppercase tracking-widest text-text-muted mb-2 block font-outfit">
                                {product.category}
                            </span>
                            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-text-main mb-4 font-outfit leading-tight">
                                {product.title}
                            </h1>
                            <div className="text-2xl md:text-3xl font-bold text-secondary font-outfit">
                                ৳{product.price}
                            </div>
                            {product.is_active === false && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 mt-4 uppercase tracking-tighter">
                                    Currently Unavailable
                                </span>
                            )}
                        </div>

                        <div className="mb-10 text-text-muted leading-relaxed font-outfit space-y-4">
                            <p>Experience premium vision with our handcrafted {product.style} sunglasses. Designed for ultimate comfort and durability, these frames feature high-quality materials and 100% UV protection lenses.</p>
                            <ul className="space-y-2 list-disc pl-5">
                                <li>Premium Acetate Frame</li>
                                <li>Polarized Lenses</li>
                                <li>100% UV400 Protection</li>
                                <li>Includes Hard Case & Cloth</li>
                            </ul>
                        </div>

                        <div className="flex flex-col gap-4 mt-auto">
                            <Button
                                variant="primary"
                                size="large"
                                className="w-full"
                                onClick={() => addToCart(product)}
                                disabled={product.is_active === false}
                            >
                                {product.is_active === false ? 'Unavailable' : 'Add to Cart'}
                            </Button>
                            <Button variant="outline" size="large" className="w-full">
                                Add to Wishlist
                            </Button>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default ProductDetails;
