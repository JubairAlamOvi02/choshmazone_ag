import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useRecentlyViewed } from '../context/RecentlyViewedContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Button from '../components/Button';
import { productParams } from '../lib/api/products';
import { ChevronRight, ShieldCheck, Truck, Package, Plus, Minus, Star, Heart, ShoppingBag } from 'lucide-react';
import OptimizedImage from '../components/ui/OptimizedImage';
import RecentlyViewed from '../components/RecentlyViewed';
import ProductCard from '../components/ProductCard';
import ReviewSection from '../components/ReviewSection';

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
    const [isWishlisted, setIsWishlisted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [activeTab, setActiveTab] = useState('description');
    
    // Variant state
    const [selectedColor, setSelectedColor] = useState('');
    const [selectedSize, setSelectedSize] = useState('');
    const [currentVariant, setCurrentVariant] = useState(null);

    useEffect(() => {
        const getProduct = async () => {
            try {
                setLoading(true);
                const data = await productParams.fetchById(id);
                if (!data) throw new Error("Product not found");

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
                setIsWishlisted(isInWishlist(formattedProduct.id));
                addToRecentlyViewed(formattedProduct);

                // Facebook Pixel ViewContent event
                if (typeof window !== 'undefined' && window.fbq) {
                    window.fbq('track', 'ViewContent', {
                        content_name: formattedProduct.title,
                        content_ids: [formattedProduct.id],
                        content_type: 'product',
                        value: formattedProduct.price,
                        currency: 'BDT'
                    });
                }

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
                setProduct(null);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            getProduct();
        }
    }, [id, isInWishlist, addToRecentlyViewed]);

    // Update wishlist icon when context changes
    useEffect(() => {
        if (product) {
            setIsWishlisted(isInWishlist(product.id));
        }
    }, [product, isInWishlist]);

    // Handle variant selection updates
    useEffect(() => {
        if (product && product.variants && product.variants.length > 0) {
            if (!selectedColor && !selectedSize) {
                // Default to first available variant
                setSelectedColor(product.variants[0].color || '');
                setSelectedSize(product.variants[0].size || '');
            }
            
            const variant = product.variants.find(v => 
                (v.color === selectedColor || (!v.color && !selectedColor)) && 
                (v.size === selectedSize || (!v.size && !selectedSize))
            );
            setCurrentVariant(variant || null);
            
            // Update image based on variant
            if (variant && variant.image_url) {
                setMainImage(variant.image_url);
            } else if (product && product.image) {
                setMainImage(product.image);
            }

            // Reset quantity if the new variant has less stock
            if (variant && quantity > variant.stock_quantity) {
                setQuantity(Math.max(1, variant.stock_quantity));
            }
        } else {
            setCurrentVariant(null);
        }
    }, [selectedColor, selectedSize, product]);

    const displayStock = product?.variants?.length > 0 && currentVariant 
        ? currentVariant.stock_quantity 
        : product?.stock_quantity;
        
    const displayPrice = product?.variants?.length > 0 && currentVariant && currentVariant.price
        ? currentVariant.price 
        : product?.price;

    const isOutOfStock = product?.is_active === false || displayStock <= 0;

    const handleQuantityChange = (type) => {
        if (isOutOfStock) return;
        if (type === 'inc') {
            if (quantity < displayStock) {
                setQuantity(prev => prev + 1);
            } else {
                alert(`Only ${displayStock || 0} items available in stock.`);
            }
        }
        if (type === 'dec' && quantity > 1) setQuantity(prev => prev - 1);
    };

    const getCartItem = () => {
        const item = { ...product, quantity };
        if (currentVariant) {
            item.variant = currentVariant;
            item.price = displayPrice; // Use variant price if available
            item.title = `${product.title} ${selectedColor ? ` - ${selectedColor}` : ''}${selectedSize ? ` - ${selectedSize}` : ''}`;
            item.cartItemId = `${product.id}-${currentVariant.id}`;
            if (currentVariant.image_url) {
                item.image = currentVariant.image_url;
            }
        } else {
            item.cartItemId = product.id;
        }
        return item;
    };

    const handleBuyNow = () => {
        if (!product || isOutOfStock) return;
        addToCart(getCartItem(), false);
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
                    <div className="flex flex-col gap-6 relative lg:sticky top-[72px] lg:top-24 h-fit z-10 bg-white lg:bg-transparent pb-4 lg:pb-0">
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
                                {!isOutOfStock && (
                                    <div className="flex items-center gap-1 text-green-600">
                                        <div className="w-1.5 h-1.5 bg-green-600 rounded-full animate-pulse"></div>
                                        <span className="text-[10px] font-bold uppercase tracking-widest">In Stock</span>
                                    </div>
                                )}
                                {isOutOfStock && (
                                    <div className="flex items-center gap-1 text-red-600">
                                        <div className="w-1.5 h-1.5 bg-red-600 rounded-full"></div>
                                        <span className="text-[10px] font-bold uppercase tracking-widest">Out of Stock</span>
                                    </div>
                                )}
                            </div>

                            <h1 className="text-3xl md:text-4xl xl:text-5xl font-bold text-text-main mb-4 font-outfit leading-[1.1] tracking-tighter">
                                {product.title}
                            </h1>

                            <div className="flex items-center gap-4 mb-6">
                                <div className="text-3xl md:text-4xl font-bold text-primary font-outfit">
                                    ৳{Number(displayPrice || 0).toLocaleString()}
                                </div>
                                <a href="#reviews" className="flex items-center gap-1 hover:opacity-70 transition-opacity">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} size={14} className={i < 4 ? "fill-secondary text-secondary" : "text-border"} />
                                    ))}
                                    <span className="text-xs text-text-muted font-bold ml-1">(4.8/5.0)</span>
                                </a>
                            </div>
                        </div>

                        <div className="mb-8 text-text-muted leading-relaxed font-outfit">
                            {product.description ? (
                                <div className="text-lg quill-content" dangerouslySetInnerHTML={{ __html: product.description }} />
                            ) : (
                                <p className="text-lg">Experience premium vision with our handcrafted {product.style || 'sunglasses'}. Designed for ultimate comfort and durability, these frames feature high-quality materials and 100% UV protection lenses.</p>
                            )}
                        </div>

                        {/* Variants Selection */}
                        {product.variants && product.variants.length > 0 && (
                            <div className="mb-8 space-y-6">
                                {/* Colors */}
                                {product.variants.some(v => v.color) && (
                                    <div>
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-3 block">Color</span>
                                        <div className="flex flex-wrap gap-3">
                                            {[...new Set(product.variants.map(v => v.color).filter(Boolean))].map(color => (
                                                <button
                                                    key={color}
                                                    onClick={() => setSelectedColor(color)}
                                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border-2 ${
                                                        selectedColor === color 
                                                            ? 'border-primary bg-primary/5 text-primary' 
                                                            : 'border-border/50 bg-white text-text-muted hover:border-border'
                                                    }`}
                                                >
                                                    {color}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                {/* Sizes */}
                                {product.variants.some(v => v.size) && (
                                    <div>
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-3 block">Size</span>
                                        <div className="flex flex-wrap gap-3">
                                            {[...new Set(product.variants.map(v => v.size).filter(Boolean))].map(size => (
                                                <button
                                                    key={size}
                                                    onClick={() => setSelectedSize(size)}
                                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border-2 ${
                                                        selectedSize === size 
                                                            ? 'border-primary bg-primary/5 text-primary' 
                                                            : 'border-border/50 bg-white text-text-muted hover:border-border'
                                                    }`}
                                                >
                                                    {size}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Add to Cart Controls */}
                        <div className="space-y-6 pb-8 border-b border-border mb-8">
                            <div className="flex flex-col gap-6">
                                {/* Quantity and Wishlist for Mobile */}
                                <div className="flex items-end justify-between md:justify-start gap-6">
                                    <div className="flex flex-col gap-2">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Quantity</span>
                                        <div className="flex items-center border border-border rounded-full p-1 bg-background-alt h-12 w-36">
                                            <button
                                                onClick={() => handleQuantityChange('dec')}
                                                className="w-10 h-10 flex items-center justify-center hover:bg-white rounded-full transition-colors"
                                            >
                                                <Minus size={16} />
                                            </button>
                                            <span className="flex-1 text-center font-bold font-outfit">{quantity}</span>
                                            <button
                                                onClick={() => handleQuantityChange('inc')}
                                                className="w-10 h-10 flex items-center justify-center hover:bg-white rounded-full transition-colors"
                                            >
                                                <Plus size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Wishlist Button - Mobile Only (moves here) */}
                                    <button
                                        onClick={() => toggleWishlist(product)}
                                        className={`md:hidden h-12 w-12 border-2 rounded-full flex items-center justify-center transition-all duration-300 group shadow-sm ${isWishlisted ? 'border-error bg-error/5' : 'border-border hover:bg-error/10 hover:border-error'}`}
                                        title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
                                    >
                                        <Heart size={20} className={`${isWishlisted ? 'text-error fill-error' : 'text-text-muted'} transition-all`} />
                                    </button>
                                </div>

                                {/* Desktop Buttons */}
                                <div className="hidden md:flex flex-row gap-4 w-full">
                                    <button
                                        className={`flex-1 h-14 font-bold text-sm uppercase tracking-wider rounded-lg flex items-center justify-center gap-3 transition-all duration-300 shadow-lg cursor-pointer ${isOutOfStock ? 'opacity-50 cursor-not-allowed bg-gray-400 text-white' : 'bg-primary text-white hover:bg-secondary hover:scale-[1.02] hover:shadow-xl'}`}
                                        onClick={() => addToCart(getCartItem())}
                                        disabled={isOutOfStock}
                                    >
                                        <ShoppingBag size={20} strokeWidth={2.5} />
                                        <span>{isOutOfStock ? 'Out of Stock' : 'Add to Bag'}</span>
                                    </button>

                                    <button
                                        className={`flex-1 h-14 font-bold text-sm uppercase tracking-wider rounded-lg flex items-center justify-center gap-3 transition-all duration-300 shadow-lg cursor-pointer ${isOutOfStock ? 'opacity-50 cursor-not-allowed bg-gray-300 text-gray-500 hidden' : 'bg-secondary text-primary hover:bg-primary hover:text-white hover:scale-[1.02] hover:shadow-xl'}`}
                                        onClick={handleBuyNow}
                                        disabled={isOutOfStock}
                                    >
                                        <span>Buy Now</span>
                                    </button>

                                    <button
                                        onClick={() => toggleWishlist(product)}
                                        className={`h-14 w-14 border-2 rounded-lg flex items-center justify-center transition-all duration-300 group cursor-pointer ${isWishlisted ? 'border-error bg-error/5' : 'border-border hover:bg-error/10 hover:border-error'}`}
                                        title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
                                    >
                                        <Heart size={20} className={`${isWishlisted ? 'text-error fill-error' : 'text-text-muted group-hover:text-error group-hover:fill-error'} transition-all`} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Collapsible Info Section */}
                        <div className="space-y-4 mb-10">
                            {['shipping'].map((tab) => (
                                <div key={tab} className="border-b border-border pb-4 last:border-0">
                                    <button
                                        className="w-full flex justify-between items-center py-2 group"
                                        onClick={() => setActiveTab(activeTab === tab ? '' : tab)}
                                    >
                                        <span className="text-xs font-bold uppercase tracking-widest group-hover:text-primary transition-colors">
                                            {tab}
                                        </span>
                                        <div className={`transition-transform duration-300 ${activeTab === tab ? 'rotate-180' : ''}`}>
                                            <Plus size={16} className={activeTab === tab ? 'hidden' : 'block'} />
                                            <Minus size={16} className={activeTab === tab ? 'block' : 'hidden'} />
                                        </div>
                                    </button>
                                    <div className={`overflow-hidden transition-all duration-500 ease-in-out ${activeTab === tab ? 'max-h-96 opacity-100 pt-4' : 'max-h-0 opacity-0'}`}>
                                        <div className="text-sm text-text-muted font-outfit leading-relaxed">
                                            {tab === 'shipping' && (
                                                <p>{product.shipping_info || 'Complimentary shipping on all orders over ৳5000. 7-day hassle-free return policy. Ships in premium branded hard case.'}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>


                    </div>
                </div>
            </main>

            <ReviewSection productId={product.id} />

            {/* Mobile Sticky Bottom Bar */}
            <div className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-lg border-t border-border p-4 z-40 md:hidden flex gap-3 animate-in slide-in-from-bottom duration-500">
                <button
                    className={`flex-1 h-14 font-bold text-[11px] uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 shadow-lg ${isOutOfStock ? 'opacity-50 cursor-not-allowed bg-gray-400 text-white' : 'bg-primary text-white active:scale-95 transition-transform'}`}
                    onClick={() => addToCart(getCartItem())}
                    disabled={isOutOfStock}
                >
                    <ShoppingBag size={18} />
                    <span>{isOutOfStock ? 'Out of Stock' : 'Add to Bag'}</span>
                </button>
                <button
                    className={`flex-1 h-14 font-bold text-[11px] uppercase tracking-widest rounded-xl shadow-lg ${isOutOfStock ? 'opacity-50 cursor-not-allowed bg-gray-300 text-gray-500 hidden' : 'bg-secondary text-primary active:scale-95 transition-transform'}`}
                    onClick={handleBuyNow}
                    disabled={isOutOfStock}
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

            <RecentlyViewed excludeId={product.id} />
            <Footer />
        </div>
    );
};

export default ProductDetails;
