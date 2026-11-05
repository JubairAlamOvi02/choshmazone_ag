import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Eye } from 'lucide-react';
import OptimizedImage from '../ui/OptimizedImage';
import { useCart } from '../../context/CartContext';

const ProductShowcaseCard = ({
    item,
    currency = 'Tk',
    showBadge = true,
    showTitle = false,
    showQuickActions = true,
    linkedProduct = null
}) => {
    const navigate = useNavigate();
    const { addToCart } = useCart();

    if (!item) return null;

    // Resolve details (prefer item custom values, fallback to linked product)
    const title = item.title || linkedProduct?.name || linkedProduct?.title || 'Luxury Eyewear';
    const image = item.image || linkedProduct?.image_url || linkedProduct?.image || (linkedProduct?.images && linkedProduct.images[0]) || '';
    const price = Number(item.price !== undefined && item.price !== '' ? item.price : (linkedProduct?.price || 0));
    const originalPrice = item.original_price ? Number(item.original_price) : null;
    const badgeText = item.badge || 'Sale';
    const shouldShowBadge = showBadge && item.show_badge !== false && !!badgeText;

    // Navigation target
    const targetUrl = item.product_id
        ? `/product/${item.product_id}`
        : (item.custom_link || '/shop');

    const formatPrice = (val) => {
        if (val === null || val === undefined || isNaN(val)) return '';
        return `${currency} ${Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const handleCardClick = (e) => {
        // Let normal anchor / button handle their own clicks
        if (e.target.closest('button')) return;
        
        if (targetUrl.startsWith('/')) {
            navigate(targetUrl);
        } else {
            window.location.href = targetUrl;
        }
    };

    const handleQuickAdd = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (linkedProduct) {
            addToCart(linkedProduct, true);
        } else if (item.product_id) {
            navigate(`/product/${item.product_id}`);
        } else {
            navigate(targetUrl);
        }
    };

    const handleQuickBuy = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (linkedProduct) {
            addToCart(linkedProduct, false);
            navigate('/checkout');
        } else if (item.product_id) {
            navigate(`/product/${item.product_id}`);
        } else {
            navigate(targetUrl);
        }
    };

    return (
        <div
            onClick={handleCardClick}
            className="group relative flex flex-col cursor-pointer transition-all duration-300 select-none"
        >
            {/* Image Container with 1:1 Aspect Ratio */}
            <div className="relative aspect-square w-full overflow-hidden bg-neutral-900 rounded-sm">
                <OptimizedImage
                    src={image}
                    alt={title}
                    className="w-full h-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
                />

                {/* Pill Sale Badge - Styled exactly like the reference image */}
                {shouldShowBadge && (
                    <div className="absolute top-3 right-3 z-10 pointer-events-none">
                        <span className="inline-block bg-white text-neutral-900 text-[11px] sm:text-xs font-semibold px-3 py-1 rounded-full shadow-md tracking-tight border border-neutral-100/50">
                            {badgeText}
                        </span>
                    </div>
                )}

                {/* Quick Action Overlay (Desktop Hover) */}
                {showQuickActions && (linkedProduct || item.product_id) && (
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden md:flex flex-col items-center justify-center gap-2 p-4 z-20">
                        {linkedProduct && linkedProduct.stock_quantity <= 0 ? (
                            <span className="bg-black/80 text-white text-xs font-bold uppercase tracking-wider py-2 px-4 rounded">
                                Out of Stock
                            </span>
                        ) : (
                            <>
                                <button
                                    onClick={handleQuickAdd}
                                    className="w-36 py-2 px-3 bg-white text-neutral-900 hover:bg-neutral-900 hover:text-white rounded font-medium text-xs uppercase tracking-wider shadow-md transition-all duration-200 flex items-center justify-center gap-1.5 active:scale-95"
                                >
                                    <ShoppingBag size={14} /> Add to Cart
                                </button>
                                <button
                                    onClick={handleQuickBuy}
                                    className="w-36 py-2 px-3 bg-primary text-white hover:bg-secondary hover:text-primary rounded font-medium text-xs uppercase tracking-wider shadow-md transition-all duration-200 flex items-center justify-center gap-1.5 active:scale-95"
                                >
                                    Buy Now
                                </button>
                            </>
                        )}
                        <Link
                            to={targetUrl}
                            onClick={(e) => e.stopPropagation()}
                            className="text-white/90 hover:text-white text-[11px] flex items-center gap-1 underline underline-offset-2 mt-1"
                        >
                            <Eye size={12} /> View Details
                        </Link>
                    </div>
                )}
            </div>

            {/* Price & Details Bar - Clean styling as in screenshot */}
            <div className="pt-3 pb-1 flex flex-col items-center text-center">
                {showTitle && (
                    <h3 className="text-xs sm:text-sm font-medium text-text-main line-clamp-1 mb-1 font-outfit" title={title}>
                        {title}
                    </h3>
                )}

                <div className="flex items-baseline justify-center gap-2 flex-wrap">
                    <span className="text-sm sm:text-base font-semibold text-text-main font-outfit tracking-tight">
                        {formatPrice(price)}
                    </span>
                    {originalPrice && originalPrice > price && (
                        <span className="text-xs sm:text-sm text-neutral-400 line-through font-normal font-outfit">
                            {formatPrice(originalPrice)}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductShowcaseCard;

