import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Heart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import OptimizedImage from './ui/OptimizedImage';

const ProductCard = ({ product }) => {
    if (!product || !product.id) return null;
    const { id, title, price, image, images } = product;
    const hoverImage = images && images.length > 1 ? images[1] : null;
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const { isInWishlist, toggleWishlist } = useWishlist();
    const isWishlisted = isInWishlist(id);

    const handleAddToCart = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (product.stock_quantity <= 0) return;
        addToCart(product);
    };

    const handleBuyNow = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (product.stock_quantity <= 0) return;
        addToCart(product, false);
        navigate('/checkout');
    };

    const handleWaitlist = (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleWishlist(product);
    };

    return (
        <div className="flex flex-col bg-surface rounded-md overflow-hidden md:hover:-translate-y-1 md:transition-transform md:duration-300 group border border-border/10 md:border-transparent">
            <Link to={`/product/${id}`} className="no-underline text-inherit">
                <div className="relative aspect-square overflow-hidden bg-gray-100">
                    {/* Primary Image */}
                    <OptimizedImage
                        src={image}
                        alt={title}
                        className="absolute inset-0 w-full h-full md:group-hover:scale-105 md:group-hover:opacity-0 md:transition-all md:duration-500"
                    />

                    {/* Wishlist Button */}
                    <button
                        onClick={handleWaitlist}
                        className={`absolute top-2 right-2 z-20 p-2 rounded-full transition-all duration-300 ${isWishlisted ? 'bg-error text-white' : 'bg-white/80 text-text-muted hover:bg-white hover:text-error'}`}
                        title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
                    >
                        <Heart size={16} className={isWishlisted ? "fill-current" : ""} />
                    </button>

                    {/* Hover Image */}
                    {hoverImage && (
                        <OptimizedImage
                            src={hoverImage}
                            alt={`${title} - alternate view`}
                            className="absolute inset-0 w-full h-full object-cover opacity-0 md:group-hover:opacity-100 md:group-hover:scale-105 md:transition-all md:duration-500"
                        />
                    )}

                    {/* Out of Stock Banner */}
                    {product.stock_quantity <= 0 && (
                        <div className="absolute top-1/2 left-0 w-full transform -translate-y-1/2 bg-black/70 text-white text-center py-2 z-20 font-outfit uppercase tracking-widest text-xs font-bold backdrop-blur-sm">
                            Out of Stock
                        </div>
                    )}

                    {/* Add to Cart Overlay (Desktop) */}
                    <div className="absolute inset-0 bg-black/5 items-center justify-center opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 z-10 hidden md:flex">
                        <button
                            className={`flex items-center gap-2 py-2 px-4 rounded-sm font-medium shadow-md transition-colors duration-300 ${product.stock_quantity <= 0 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-white text-primary hover:bg-primary hover:text-white'}`}
                            onClick={handleAddToCart}
                            disabled={product.stock_quantity <= 0}
                        >
                            <ShoppingBag size={18} />
                            {product.stock_quantity <= 0 ? 'Out of Stock' : 'Add to Cart'}
                        </button>
                    </div>
                </div>
                <div className="p-3 md:py-4">
                    <h3 className="text-sm md:text-lg font-medium mb-1 text-text-main font-outfit truncate">{title}</h3>
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-sm md:text-base font-bold text-text-muted font-outfit">৳{Number(price || 0).toLocaleString()}</span>
                    </div>

                    {/* Mobile Quick Actions */}
                    <div className="flex flex-col gap-2 md:hidden">
                        <button
                            className={`w-full h-11 font-bold text-[11px] uppercase tracking-widest rounded-md flex items-center justify-center gap-2 shadow-sm transition-transform ${product.stock_quantity <= 0 ? 'bg-gray-300 text-gray-500 cursor-not-allowed bg-opacity-50' : 'bg-primary text-white active:scale-[0.98]'}`}
                            onClick={handleAddToCart}
                            disabled={product.stock_quantity <= 0}
                        >
                            <ShoppingBag size={14} />
                            {product.stock_quantity <= 0 ? 'Out of Stock' : 'Add to Bag'}
                        </button>
                        <button
                            className={`w-full h-11 font-bold text-[11px] uppercase tracking-widest rounded-md shadow-sm transition-transform ${product.stock_quantity <= 0 ? 'bg-gray-200 text-gray-400 cursor-not-allowed hidden' : 'bg-secondary text-primary active:scale-[0.98]'}`}
                            onClick={handleBuyNow}
                            disabled={product.stock_quantity <= 0}
                        >
                            Buy Now
                        </button>
                    </div>
                </div>
            </Link>
        </div>
    );
};

export default ProductCard;
