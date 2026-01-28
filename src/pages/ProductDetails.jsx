import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useRecentlyViewed } from '../context/RecentlyViewedContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Button from '../components/Button';
import { productParams } from '../lib/api/products';
import { ChevronRight, ShieldCheck, Truck, RotateCcw, Plus, Minus, Star, Heart, ShoppingBag } from 'lucide-react';
import OptimizedImage from '../components/ui/OptimizedImage';
import RecentlyViewed from '../components/RecentlyViewed';
import ProductCard from '../components/ProductCard';

const ProductDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const { isInWishlist, toggleWishlist } = useWishlist();
    const { addToRecentlyViewed } = useRecentlyViewed();
    const [product, setProduct] = useState(null);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [mainImage, setMainImage] = useState('');

    // Derived state, safe to use even if product is null initially (will just be false)
    const isWishlisted = product ? isInWishlist(product.id) : false;
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [activeTab, setActiveTab] = useState('description');

    useEffect(() => {
        const getProduct = async () => {
            try {
                setLoading(true);
                const data = await productParams.fetchById(id);
                const formattedProduct = {
                    ...data,
                    id: data.id,
                    title: data.name || 'Untitled Product',
                    price: Number(data.price) || 0,
                    image: data.image_url || '',
                    images: Array.isArray(data.images) && data.images.length > 0
                        ? data.images
                        : [data.image_url].filter(Boolean)
                };

                // Final safety: if no images at all, use a placeholder
                if (formattedProduct.images.length === 0) {
                    formattedProduct.images = ['/placeholder-product.png'];
                    if (!formattedProduct.image) formattedProduct.image = '/placeholder-product.png';
                }

                setProduct(formattedProduct);
                setMainImage(formattedProduct.image);
                addToRecentlyViewed(formattedProduct);

                // Fetch related products - only if category exists
                if (data.category) {
                    try {
                        const related = await productParams.fetchByCategory(data.category, id);
                        if (Array.isArray(related)) {
                            setRelatedProducts(related.map(p => ({
                                ...p,
                                title: p.name || 'Untitled Product',
                                price: Number(p.price) || 0,
                                image: p.image_url || '',
                                images: Array.isArray(p.images) ? p.images : [p.image_url].filter(Boolean)
                            })));
                        }
                    } catch (relatedError) {
                        console.error("Error fetching related products:", relatedError);
                        setRelatedProducts([]);
                    }
                }
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

    const handleQuantityChange = (type) => {
        if (type === 'inc') setQuantity(prev => prev + 1);
        if (type === 'dec' && quantity > 1) setQuantity(prev => prev - 1);
    };

    const handleBuyNow = () => {
        addToCart({ ...product, quantity }, false);
        navigate('/checkout');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white">
                <Navbar />
                <div className="flex justify-center items-center min-h-[60vh]">
                    <div className="relative">
                        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-secondary"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-2 h-2 bg-primary rounded-full"></div>
                        </div>
                    </div>
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
                    <h2 className="text-3xl font-bold mb-4 font-outfit uppercase tracking-tighter">Product Not Found</h2>
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

            {/* Breadcrumbs */}
            <div className="bg-background-alt/50 border-b border-border">
                {product && (
                    <script
                        type="application/ld+json"
                        dangerouslySetInnerHTML={{
                            __html: JSON.stringify({
                                "@context": "https://schema.org/",
                                "@type": "Product",
                                "name": product?.title || 'Sunglasses',
                                "image": product?.images || [],
                                "description": `Premium handcrafted ${product?.style || 'sunglasses'} from Choshma Zone.`,
                                "brand": {
                                    "@type": "Brand",
                                    "name": "Choshma Zone"
                                },
                                "offers": {
                                    "@type": "Offer",
                                    "url": typeof window !== 'undefined' ? window.location.href : '',
                                    "priceCurrency": "BDT",
                                    "price": product?.price || 0,
                                    "itemCondition": "https://schema.org/NewCondition",
                                    "availability": product?.is_active !== false ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
                                }
                            })
                        }}
                    />
                )}
                <div className="container mx-auto px-4 py-4">
                    <nav className="flex items-center gap-2 text-[10px] md:text-xs font-bold uppercase tracking-widest font-outfit text-text-muted">
                        <Link to="/" className="hover:text-primary transition-colors">Home</Link>
                        <ChevronRight size={12} strokeWidth={3} className="text-border" />
                        <Link to="/shop" className="hover:text-primary transition-colors">Shop</Link>
                        <ChevronRight size={12} strokeWidth={3} className="text-border" />
                        <span className="text-primary truncate max-w-[150px] md:max-w-none">{product.title}</span>
                    </nav>
                </div>
            </div>

            <main className="container mx-auto px-4 py-8 md:py-16 pb-24 lg:pb-16">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-24">
                    {/* Left: Image Gallery */}
                    <div className="flex flex-col gap-6 sticky top-[72px] lg:top-24 h-fit z-10 bg-white">
                        <div className="relative group bg-background-alt rounded-2xl overflow-hidden aspect-square flex items-center justify-center border border-border/50 shadow-sm transition-all duration-500 hover:shadow-xl">
                            <OptimizedImage
                                src={mainImage}
                                alt={product.title}
                                priority={true}
                                className="w-full h-full object-contain p-8 mix-blend-multiply transform transition-transform duration-700 group-hover:scale-110"
                            />
                            {/* Zoom Indicator */}
                            <div className="absolute bottom-4 right-4 bg-white/80 backdrop-blur-md p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <Plus size={16} className="text-primary" />
                            </div>
                        </div>

                        {product.images.length > 1 && (
                            <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                                {product.images.map((img, index) => (
                                    <button
                                        key={index}
                                        className={`flex-shrink-0 p-2 bg-white border-2 rounded-xl aspect-square w-20 md:w-24 cursor-pointer transition-all duration-300 ${mainImage === img ? 'border-secondary scale-105 shadow-md' : 'border-background-alt hover:border-border hover:scale-105'}`}
                                        onClick={() => setMainImage(img)}
                                    >
                                        <img src={img} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-contain mix-blend-multiply" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right: Product Info */}
                    <div className="flex flex-col">
                        <div className="mb-6">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] px-2.5 py-1 bg-secondary text-white rounded-full">
                                    {product.category}
                                </span>
                                {product.is_active !== false && (
                                    <div className="flex items-center gap-1 text-green-600">
                                        <div className="w-1.5 h-1.5 bg-green-600 rounded-full animate-pulse"></div>
                                        <span className="text-[10px] font-bold uppercase tracking-widest">In Stock</span>
                                    </div>
                                )}
                            </div>

                            <h1 className="text-3xl md:text-4xl xl:text-5xl font-bold text-text-main mb-4 font-outfit leading-[1.1] tracking-tighter">
                                {product.title}
                            </h1>

                            <div className="flex items-center gap-4 mb-6">
                                <div className="text-3xl md:text-4xl font-bold text-primary font-outfit">
                                    ৳{Number(product.price || 0).toLocaleString()}
                                </div>
                                <div className="flex items-center gap-1">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} size={14} className={i < 4 ? "fill-secondary text-secondary" : "text-border"} />
                                    ))}
                                    <span className="text-xs text-text-muted font-bold ml-1">(4.8/5.0)</span>
                                </div>
                            </div>
                        </div>

                        <div className="mb-8 text-text-muted leading-relaxed font-outfit">
                            <p className="text-lg">Experience premium vision with our handcrafted {product.style} sunglasses. Designed for ultimate comfort and durability, these frames feature high-quality materials and 100% UV protection lenses.</p>
                        </div>

                        {/* Add to Cart Controls */}
                        <div className="space-y-6 pb-8 border-b border-border mb-8">
                            <div className="flex flex-wrap items-center gap-6">
                                <div className="flex flex-col gap-2">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Quantity</span>
                                    <div className="flex items-center border border-border rounded-full p-1 bg-background-alt h-12">
                                        <button
                                            onClick={() => handleQuantityChange('dec')}
                                            className="w-10 h-10 flex items-center justify-center hover:bg-white rounded-full transition-colors"
                                        >
                                            <Minus size={16} />
                                        </button>
                                        <span className="w-10 text-center font-bold font-outfit">{quantity}</span>
                                        <button
                                            onClick={() => handleQuantityChange('inc')}
                                            className="w-10 h-10 flex items-center justify-center hover:bg-white rounded-full transition-colors"
                                        >
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex-1 flex flex-col gap-4 pt-6">
                                    <div className="flex flex-col sm:flex-row gap-4">
                                        <button
                                            className={`flex-1 h-14 bg-primary text-white font-bold text-sm uppercase tracking-wider rounded-lg flex items-center justify-center gap-3 transition-all duration-300 shadow-lg hover:shadow-xl ${product.is_active === false ? 'opacity-50 cursor-not-allowed bg-gray-400' : 'hover:bg-secondary hover:scale-[1.02]'}`}
                                            onClick={() => addToCart({ ...product, quantity })}
                                            disabled={product.is_active === false}
                                        >
                                            <ShoppingBag size={20} strokeWidth={2.5} />
                                            <span>{product.is_active === false ? 'Out of Stock' : 'Add to Bag'}</span>
                                        </button>

                                        <button
                                            className={`flex-1 h-14 bg-secondary text-primary font-bold text-sm uppercase tracking-wider rounded-lg flex items-center justify-center gap-3 transition-all duration-300 shadow-lg hover:shadow-xl ${product.is_active === false ? 'opacity-50 cursor-not-allowed bg-gray-400' : 'hover:bg-primary hover:text-white hover:scale-[1.02]'}`}
                                            onClick={handleBuyNow}
                                            disabled={product.is_active === false}
                                        >
                                            <span>Buy Now</span>
                                        </button>

                                        <button
                                            onClick={() => toggleWishlist(product)}
                                            className={`h-14 w-14 border-2 rounded-lg flex items-center justify-center transition-all duration-300 group ${isWishlisted ? 'border-error bg-error/5' : 'border-border hover:bg-error/10 hover:border-error'}`}
                                            title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
                                        >
                                            <Heart size={20} className={`${isWishlisted ? 'text-error fill-error' : 'text-text-muted group-hover:text-error group-hover:fill-error'} transition-all`} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Collapsible Info Section */}
                        <div className="space-y-4 mb-10">
                            {['description', 'specifications', 'shipping'].map((tab) => (
                                <div key={tab} className="border-b border-border pb-4 last:border-0">
                                    <button
                                        className="w-full flex justify-between items-center py-2 group"
                                        onClick={() => setActiveTab(activeTab === tab ? '' : tab)}
                                    >
                                        <span className="text-xs font-bold uppercase tracking-widest group-hover:text-primary transition-colors">
                                            {tab === 'description' ? 'Product Highlight' : tab}
                                        </span>
                                        <div className={`transition-transform duration-300 ${activeTab === tab ? 'rotate-180' : ''}`}>
                                            <Plus size={16} className={activeTab === tab ? 'hidden' : 'block'} />
                                            <Minus size={16} className={activeTab === tab ? 'block' : 'hidden'} />
                                        </div>
                                    </button>
                                    <div className={`overflow-hidden transition-all duration-500 ease-in-out ${activeTab === tab ? 'max-h-96 opacity-100 pt-4' : 'max-h-0 opacity-0'}`}>
                                        <div className="text-sm text-text-muted font-outfit leading-relaxed">
                                            {tab === 'description' && (
                                                <ul className="space-y-3">
                                                    <li className="flex gap-3">
                                                        <div className="w-1.5 h-1.5 bg-secondary rounded-full mt-1.5"></div>
                                                        Handcrafted {product.style} frame for a timeless look.
                                                    </li>
                                                    <li className="flex gap-3">
                                                        <div className="w-1.5 h-1.5 bg-secondary rounded-full mt-1.5"></div>
                                                        Premium scratch-resistant polarized lenses.
                                                    </li>
                                                </ul>
                                            )}
                                            {tab === 'specifications' && (
                                                <div className="grid grid-cols-2 gap-y-4">
                                                    <div><span className="text-[10px] block font-bold text-text-muted uppercase">Frame</span>Acetate</div>
                                                    <div><span className="text-[10px] block font-bold text-text-muted uppercase">Lens</span>Polarized UV400</div>
                                                    <div><span className="text-[10px] block font-bold text-text-muted uppercase">Hardware</span>Italian Hinges</div>
                                                    <div><span className="text-[10px] block font-bold text-text-muted uppercase">Weight</span>32g</div>
                                                </div>
                                            )}
                                            {tab === 'shipping' && (
                                                <p>Complimentary shipping on all orders over ৳5000. 7-day hassle-free return policy. Ships in premium branded hard case.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Trust Badges */}
                        <div className="grid grid-cols-3 gap-4 p-6 bg-background-alt rounded-2xl border border-border/50">
                            <div className="flex flex-col items-center text-center gap-2">
                                <Truck size={20} className="text-primary" />
                                <span className="text-[8px] font-bold uppercase tracking-widest">Free Shipping</span>
                            </div>
                            <div className="flex flex-col items-center text-center gap-2 border-x border-border/30 px-2">
                                <ShieldCheck size={20} className="text-primary" />
                                <span className="text-[8px] font-bold uppercase tracking-widest">UV400 Protection</span>
                            </div>
                            <div className="flex flex-col items-center text-center gap-2">
                                <RotateCcw size={20} className="text-primary" />
                                <span className="text-[8px] font-bold uppercase tracking-widest">7-Day Returns</span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Mobile Sticky Bottom Bar */}
            <div className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-lg border-t border-border p-4 z-40 md:hidden flex gap-3 animate-in slide-in-from-bottom duration-500">
                <button
                    className={`flex-1 h-14 bg-primary text-white font-bold text-[11px] uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 shadow-lg ${product.is_active === false ? 'opacity-50 cursor-not-allowed bg-gray-400' : 'active:scale-95 transition-transform'}`}
                    onClick={() => addToCart({ ...product, quantity })}
                    disabled={product.is_active === false}
                >
                    <ShoppingBag size={18} />
                    <span>{product.is_active === false ? 'Out of Stock' : 'Add to Bag'}</span>
                </button>
                <button
                    className={`flex-1 h-14 bg-secondary text-primary font-bold text-[11px] uppercase tracking-widest rounded-xl shadow-lg ${product.is_active === false ? 'opacity-50 cursor-not-allowed bg-gray-400' : 'active:scale-95 transition-transform'}`}
                    onClick={handleBuyNow}
                    disabled={product.is_active === false}
                >
                    <span>Buy Now</span>
                </button>
            </div>

            {/* Related Products Section */}
            {relatedProducts && relatedProducts.length > 0 && (
                <section className="py-12 md:py-20 border-t border-border bg-background-alt/30">
                    <div className="container mx-auto px-4">
                        <div className="flex justify-between items-end mb-8 md:mb-12">
                            <div>
                                <h2 className="text-2xl md:text-3xl font-bold font-outfit uppercase tracking-tighter mb-2">You May Also Like</h2>
                                <div className="w-12 h-1 bg-secondary"></div>
                            </div>
                            <Link to="/shop" className="text-[10px] font-bold uppercase tracking-widest text-text-muted hover:text-primary transition-colors">View All Products</Link>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
                            {relatedProducts.map(p => (
                                <ProductCard key={p.id} product={p} />
                            ))}
                        </div>
                    </div>
                </section>
            )}

            <RecentlyViewed excludeId={product?.id} />
            <Footer />
        </div>
    );
};

export default ProductDetails;
