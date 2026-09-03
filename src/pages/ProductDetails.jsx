import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useRecentlyViewed } from '../context/RecentlyViewedContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Button from '../components/Button';
import { productParams } from '../lib/api/products';
import { ChevronLeft, ChevronRight, ShieldCheck, Truck, Package, Plus, Minus, Star, Heart, ShoppingBag } from 'lucide-react';
import OptimizedImage from '../components/ui/OptimizedImage';
import RecentlyViewed from '../components/RecentlyViewed';
import ProductCard from '../components/ProductCard';
import ReviewSection from '../components/ReviewSection';
import LensCustomizerModal from '../components/Prescription/LensCustomizerModal';
import { settingsParams } from '../lib/api/settings';

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

    // Lens & Prescription State
    const [isLensModalOpen, setIsLensModalOpen] = useState(false);
    const [selectedLens, setSelectedLens] = useState({
        id: 'frame_only',
        name: 'Frame Only / Demo Lens',
        subtitle: 'Zero power factory lenses',
        price: 0,
        isPrescription: false,
        method: 'none',
        prescriptionFile: null,
        previewUrl: '',
        manualPower: null,
        notes: ''
    });

    useEffect(() => {
        const loadDefaultLens = async () => {
            try {
                const stored = await settingsParams.get('lens_packages_settings');
                if (stored) {
                    const parsed = JSON.parse(stored);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        const firstActive = parsed.find(p => p.id === 'frame_only' && p.is_active !== false) || parsed.find(p => p.is_active !== false) || parsed[0];
                        if (firstActive) {
                            setSelectedLens(prev => ({
                                ...prev,
                                id: firstActive.id,
                                name: firstActive.name,
                                subtitle: firstActive.subtitle,
                                price: Number(firstActive.price) || 0,
                                isPrescription: Boolean(firstActive.isPrescription)
                            }));
                        }
                    }
                }
            } catch (e) {
                // fallback to default
            }
        };
        loadDefaultLens();
    }, []);

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

    useEffect(() => {
        if (product && (product.color || (product.variants && product.variants.length > 0))) {
            if (!selectedColor && !selectedSize) {
                // Default to main product color if exists, else first available variant
                setSelectedColor(product.color || (product.variants && product.variants.length > 0 ? product.variants[0].color : ''));
                setSelectedSize(product.variants && product.variants.length > 0 ? product.variants[0].size : '');
            }
            
            const variant = (product.variants || []).find(v => 
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
        
    const basePrice = product?.variants?.length > 0 && currentVariant && currentVariant.price
        ? currentVariant.price 
        : (product?.price || 0);

    const displayPrice = basePrice;
    const effectiveUnitPrice = Number(displayPrice || 0) + Number(selectedLens?.price || 0);

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
        const lensPrice = selectedLens?.price || 0;
        const finalUnitPrice = Number(displayPrice || 0) + Number(lensPrice);
        const item = { ...product, quantity, price: finalUnitPrice };
        
        let variantId = 'base';
        let variantTitleSuffix = '';
        if (currentVariant) {
            item.variant = currentVariant;
            variantId = currentVariant.id;
            variantTitleSuffix = `${selectedColor ? ` - ${selectedColor}` : ''}${selectedSize ? ` - ${selectedSize}` : ''}`;
            if (currentVariant.image_url) {
                item.image = currentVariant.image_url;
            }
        }

        item.title = `${product.title}${variantTitleSuffix}`;
        
        // Attach lens and prescription details
        item.lensOption = selectedLens;
        
        const lensSuffix = selectedLens?.id !== 'frame_only' 
            ? `-${selectedLens.id}-${selectedLens.method || 'def'}` 
            : '';
        item.cartItemId = `${product.id}-${variantId}${lensSuffix}`;

        return item;
    };

    const handleBuyNow = () => {
        if (!product || isOutOfStock) return;
        addToCart(getCartItem(), false);
        navigate('/checkout');
    };

    const handlePrevImage = () => {
        if (!product?.images || product.images.length <= 1) return;
        const currentIndex = product.images.indexOf(mainImage);
        const prevIndex = currentIndex <= 0 ? product.images.length - 1 : currentIndex - 1;
        setMainImage(product.images[prevIndex]);
    };

    const handleNextImage = () => {
        if (!product?.images || product.images.length <= 1) return;
        const currentIndex = product.images.indexOf(mainImage);
        const nextIndex = currentIndex >= product.images.length - 1 ? 0 : currentIndex + 1;
        setMainImage(product.images[nextIndex]);
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

            <main className="container mx-auto px-4 py-6 md:py-10 pb-24 lg:pb-16 max-w-7xl">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 xl:gap-16 items-start">
                    {/* Left: Image Gallery */}
                    <div className="flex flex-col gap-4 relative lg:sticky top-[72px] lg:top-24 h-fit z-10 bg-white lg:bg-transparent pb-2 lg:pb-0">
                        <div className="relative group bg-background-alt rounded-2xl overflow-hidden aspect-square w-full flex items-center justify-center border border-border/50 shadow-sm transition-all duration-500 hover:shadow-xl mx-auto">
                            <OptimizedImage
                                src={mainImage}
                                alt={product.title}
                                priority={true}
                                className="w-full h-full object-contain p-2 md:p-4 mix-blend-multiply transform transition-transform duration-700 group-hover:scale-105"
                            />

                            {/* Previous & Next Navigation Arrows */}
                            {product.images && product.images.length > 1 && (
                                <>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handlePrevImage();
                                        }}
                                        aria-label="Previous Image"
                                        className="absolute left-3.5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/95 hover:bg-white text-primary shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110 hover:shadow-xl border border-border/60 z-10 cursor-pointer"
                                    >
                                        <ChevronLeft size={22} strokeWidth={2.5} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleNextImage();
                                        }}
                                        aria-label="Next Image"
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/95 hover:bg-white text-primary shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110 hover:shadow-xl border border-border/60 z-10 cursor-pointer"
                                    >
                                        <ChevronRight size={22} strokeWidth={2.5} />
                                    </button>
                                </>
                            )}

                            {/* Zoom Indicator */}
                            <div className="absolute bottom-3 right-3 bg-white/80 backdrop-blur-md p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                                <Plus size={16} className="text-primary" />
                            </div>
                        </div>

                        {product.images.length > 1 && (
                            <div className="flex gap-2.5 overflow-x-auto pb-1 no-scrollbar">
                                {product.images.map((img, index) => (
                                    <button
                                        key={index}
                                        className={`flex-shrink-0 p-1 bg-white border-2 rounded-xl aspect-square w-16 h-16 md:w-20 md:h-20 cursor-pointer transition-all duration-300 ${mainImage === img ? 'border-secondary scale-105 shadow-md ring-2 ring-secondary/20' : 'border-background-alt hover:border-border hover:scale-105'}`}
                                        onClick={() => setMainImage(img)}
                                    >
                                        <img src={img} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-contain mix-blend-multiply" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right: Product Info & Buy Controls */}
                    <div className="flex flex-col min-w-0 max-w-full overflow-hidden w-full">
                        <div className="mb-4">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] px-2.5 py-0.5 bg-secondary text-white rounded-full">
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

                            <h1 className="text-2xl md:text-3xl xl:text-4xl font-bold text-text-main mb-3 font-outfit leading-[1.1] tracking-tight break-words">
                                {product.title}
                            </h1>

                            <div className="flex items-center gap-4 mb-4">
                                <div className="flex items-baseline gap-2 flex-wrap">
                                    <span className="text-2xl md:text-3xl font-bold text-primary font-outfit">
                                        ৳{effectiveUnitPrice.toLocaleString()}
                                    </span>
                                    {selectedLens.price > 0 && (
                                        <span className="text-xs text-text-muted font-outfit">
                                            (Frame: ৳{Number(displayPrice || 0).toLocaleString()} + Lens: ৳{selectedLens.price.toLocaleString()})
                                        </span>
                                    )}
                                </div>
                                <a href="#reviews" className="flex items-center gap-1 hover:opacity-70 transition-opacity">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} size={13} className={i < 4 ? "fill-secondary text-secondary" : "text-border"} />
                                    ))}
                                    <span className="text-xs text-text-muted font-bold ml-1">(4.8/5.0)</span>
                                </a>
                            </div>
                        </div>

                        {/* Product Description & Overview (Contained within layout) */}
                        <div className="mb-6 text-text-muted leading-relaxed font-outfit text-sm md:text-base max-w-full break-words overflow-hidden">
                            {product.description ? (
                                <div className="quill-content space-y-2 break-words max-w-full overflow-hidden" dangerouslySetInnerHTML={{ __html: product.description }} />
                            ) : (
                                <p className="break-words">Experience premium vision with our handcrafted {product.style || 'sunglasses'}. Designed for ultimate comfort and durability, these frames feature high-quality materials and 100% UV protection lenses.</p>
                            )}
                        </div>

                        {/* Variants Selection */}
                        {((product.variants && product.variants.length > 0) || product.color) && (() => {
                            const availableColors = [...new Set([
                                product.color,
                                ...(product.variants || []).map(v => v.color)
                            ].filter(Boolean))];
                            
                            const availableSizes = [...new Set([
                                ...(product.variants || []).map(v => v.size)
                            ].filter(Boolean))];

                            return (
                            <div className="mb-5 space-y-3.5">
                                {/* Colors */}
                                {availableColors.length > 0 && (
                                    <div>
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-2 block">Color</span>
                                        <div className="flex flex-wrap gap-2">
                                            {availableColors.map(color => (
                                                <button
                                                    key={color}
                                                    onClick={() => setSelectedColor(color)}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                                                        selectedColor === color 
                                                            ? 'border-primary bg-primary text-white shadow-xs' 
                                                            : 'border-border bg-white text-text-main hover:border-primary/50'
                                                    }`}
                                                >
                                                    {color}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                {/* Sizes */}
                                {availableSizes.length > 0 && (
                                    <div>
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-2 block">Size</span>
                                        <div className="flex flex-wrap gap-2">
                                            {availableSizes.map(size => (
                                                <button
                                                    key={size}
                                                    onClick={() => setSelectedSize(size)}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                                                        selectedSize === size 
                                                            ? 'border-primary bg-primary text-white shadow-xs' 
                                                            : 'border-border bg-white text-text-main hover:border-primary/50'
                                                    }`}
                                                >
                                                    {size}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            );
                        })()}

                        {/* Lens & Prescription Selector (Slightly Bigger Pill Badge) */}
                        <div className="mb-5 self-start inline-flex items-center gap-3.5 py-2.5 px-4 sm:px-5 rounded-full bg-gray-50/90 border border-border text-xs sm:text-sm shadow-2xs">
                            <div className="flex items-center gap-2">
                                <ShieldCheck size={16} className="text-secondary shrink-0" />
                                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-text-muted shrink-0">Lens:</span>
                                <span className="font-bold text-text-main text-xs sm:text-sm">{selectedLens.name}</span>
                                {selectedLens.price > 0 && (
                                    <span className="text-xs font-bold text-primary shrink-0">+৳{selectedLens.price.toLocaleString()}</span>
                                )}
                            </div>

                            <button
                                type="button"
                                onClick={() => setIsLensModalOpen(true)}
                                className="px-3.5 py-1.5 bg-primary text-white hover:bg-secondary rounded-full text-[11px] font-bold uppercase tracking-wider transition-all shadow-2xs shrink-0 cursor-pointer font-outfit ml-1"
                            >
                                <span>{selectedLens.id === 'frame_only' ? '+ Add Lenses' : 'Change'}</span>
                            </button>
                        </div>

                        {/* Add to Cart Controls */}
                        <div className="space-y-4 pb-6 border-b border-border mb-6">
                            <div className="flex flex-col gap-4">
                                {/* Quantity and Wishlist for Mobile */}
                                <div className="flex items-end justify-between md:justify-start gap-4">
                                    <div className="flex flex-col gap-1.5">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Quantity</span>
                                        <div className="flex items-center border border-border rounded-lg p-0.5 bg-background-alt h-10 w-28">
                                            <button
                                                onClick={() => handleQuantityChange('dec')}
                                                className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-md transition-colors"
                                            >
                                                <Minus size={14} />
                                            </button>
                                            <span className="flex-1 text-center font-bold text-xs font-outfit">{quantity}</span>
                                            <button
                                                onClick={() => handleQuantityChange('inc')}
                                                className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-md transition-colors"
                                            >
                                                <Plus size={14} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Wishlist Button - Mobile Only */}
                                    <button
                                        onClick={() => toggleWishlist(product)}
                                        className={`md:hidden h-10 w-10 border rounded-lg flex items-center justify-center transition-all duration-300 group shadow-xs ${isWishlisted ? 'border-error bg-error/5' : 'border-border hover:bg-error/10 hover:border-error'}`}
                                        title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
                                    >
                                        <Heart size={18} className={`${isWishlisted ? 'text-error fill-error' : 'text-text-muted'} transition-all`} />
                                    </button>
                                </div>

                                {/* Desktop Buttons */}
                                <div className="hidden md:flex flex-row gap-3 w-full">
                                    <button
                                        className={`flex-1 h-11 font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all duration-300 shadow-sm cursor-pointer ${isOutOfStock ? 'opacity-50 cursor-not-allowed bg-gray-400 text-white' : 'bg-primary text-white hover:bg-secondary hover:shadow-md'}`}
                                        onClick={() => addToCart(getCartItem())}
                                        disabled={isOutOfStock}
                                    >
                                        <ShoppingBag size={17} strokeWidth={2.2} />
                                        <span>{isOutOfStock ? 'Out of Stock' : 'Add to Bag'}</span>
                                    </button>

                                    <button
                                        className={`flex-1 h-11 font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all duration-300 shadow-sm cursor-pointer ${isOutOfStock ? 'opacity-50 cursor-not-allowed bg-gray-300 text-gray-500 hidden' : 'bg-secondary text-primary hover:bg-primary hover:text-white hover:shadow-md'}`}
                                        onClick={handleBuyNow}
                                        disabled={isOutOfStock}
                                    >
                                        <span>Buy Now</span>
                                    </button>

                                    <button
                                        onClick={() => toggleWishlist(product)}
                                        className={`h-11 w-11 border rounded-xl flex items-center justify-center transition-all duration-300 group cursor-pointer shrink-0 ${isWishlisted ? 'border-error bg-error/5' : 'border-border hover:bg-error/10 hover:border-error'}`}
                                        title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
                                    >
                                        <Heart size={18} className={`${isWishlisted ? 'text-error fill-error' : 'text-text-muted group-hover:text-error group-hover:fill-error'} transition-all`} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Shipping & Returns Tab / Accordion */}
                        <div className="space-y-3 mb-8 font-outfit">
                            <div className="border-b border-border pb-3 last:border-0">
                                <button
                                    className="w-full flex justify-between items-center py-1 group cursor-pointer text-left"
                                    onClick={() => setActiveTab(activeTab === 'shipping' ? '' : 'shipping')}
                                >
                                    <span className="text-xs font-bold uppercase tracking-widest text-text-main group-hover:text-primary transition-colors">
                                        Shipping & Returns
                                    </span>
                                    <div className={`transition-transform duration-300 ${activeTab === 'shipping' ? 'rotate-180' : ''}`}>
                                        <Plus size={14} className={activeTab === 'shipping' ? 'hidden' : 'block'} />
                                        <Minus size={14} className={activeTab === 'shipping' ? 'block' : 'hidden'} />
                                    </div>
                                </button>
                                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${activeTab === 'shipping' ? 'max-h-96 opacity-100 pt-2.5' : 'max-h-0 opacity-0'}`}>
                                    <div className="text-xs sm:text-sm text-text-muted leading-relaxed">
                                        <p>{product.shipping_info || 'Complimentary shipping on all orders over ৳5000. 7-day hassle-free return policy. Ships in premium branded hard case.'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>


                    </div>
                </div>
            </main>

            <ReviewSection productId={product.id} />

            {/* Mobile Sticky Bottom Bar */}
            <div className="fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-lg border-t border-border p-2.5 z-40 md:hidden flex items-center gap-2.5 animate-in slide-in-from-bottom duration-500 shadow-xl">
                <div className="flex flex-col shrink-0 min-w-[70px]">
                    <span className="text-[8px] uppercase font-bold tracking-widest text-text-muted">Total</span>
                    <span className="text-sm font-bold text-primary font-outfit">৳{effectiveUnitPrice.toLocaleString()}</span>
                </div>
                <button
                    className={`flex-1 h-10 font-bold text-[10px] uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 shadow-xs ${isOutOfStock ? 'opacity-50 cursor-not-allowed bg-gray-400 text-white' : 'bg-primary text-white active:scale-95 transition-transform'}`}
                    onClick={() => addToCart(getCartItem())}
                    disabled={isOutOfStock}
                >
                    <ShoppingBag size={14} />
                    <span>{isOutOfStock ? 'Out of Stock' : 'Add to Bag'}</span>
                </button>
                <button
                    className={`flex-1 h-10 font-bold text-[10px] uppercase tracking-wider rounded-lg shadow-xs ${isOutOfStock ? 'opacity-50 cursor-not-allowed bg-gray-300 text-gray-500 hidden' : 'bg-secondary text-primary active:scale-95 transition-transform'}`}
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

            {/* Prescription & Lens Customizer Modal */}
            <LensCustomizerModal
                isOpen={isLensModalOpen}
                onClose={() => setIsLensModalOpen(false)}
                onApply={(lensData) => setSelectedLens(lensData)}
                currentLensOption={selectedLens}
                framePrice={displayPrice}
            />

            <Footer />
        </div>
    );
};

export default ProductDetails;
