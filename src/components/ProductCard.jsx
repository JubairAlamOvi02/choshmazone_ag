import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';

const ProductCard = React.memo(({ product }) => {
    const { id, title, price, category, image, images } = product;
    const hoverImage = images && images.length > 1 ? images[1] : null;
    const { addToCart } = useCart();

    const handleAddToCart = (e) => {
        e.preventDefault();
        e.stopPropagation();
        addToCart(product);
    };

    return (
        <div className="flex flex-col transition-transform duration-300 bg-surface rounded-md overflow-hidden hover:-translate-y-1 group">
            <Link to={`/product/${id}`} className="no-underline text-inherit">
                <div className="relative aspect-square overflow-hidden bg-gray-100">
                    <img
                        src={image}
                        alt={title}
                        className="w-full h-full object-cover transition-all duration-500 primary group-hover:scale-105 group-hover:opacity-0"
                    />
                    {hoverImage && (
                        <img
                            src={hoverImage}
                            alt={title}
                            className="absolute inset-0 w-full h-full object-cover transition-all duration-500 opacity-0 group-hover:opacity-100 group-hover:scale-105"
                        />
                    )}
                    <div className="absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <button
                            className="flex items-center gap-2 bg-white text-primary py-2 px-4 rounded-sm font-medium shadow-md hover:bg-primary hover:text-white transition-colors duration-300"
                            onClick={handleAddToCart}
                        >
                            <ShoppingBag size={20} />
                            Add to Cart
                        </button>
                    </div>
                </div>
                <div className="py-4">
                    <h3 className="text-lg font-medium mb-1 text-text-main font-outfit">{title}</h3>
                    <span className="text-base font-bold text-text-muted font-outfit">৳{price}</span>
                </div>
            </Link>
        </div>
    );
});

export default ProductCard;
