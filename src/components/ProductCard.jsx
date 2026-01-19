import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import './ProductCard.css';

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
        <div className="product-card">
            <Link to={`/product/${id}`} className="product-card-link">
                <div className="product-image-container">
                    <img src={image} alt={title} className="product-image primary" />
                    {hoverImage && <img src={hoverImage} alt={title} className="product-image secondary" />}
                    <div className="product-overlay">
                        <button className="add-to-cart-btn" onClick={handleAddToCart}>
                            <ShoppingBag size={20} />
                            Add to Cart
                        </button>
                    </div>
                </div>
                <div className="product-info">
                    {/* <span className="product-category">{category}</span>/ */}
                    <h3 className="product-title">{title}</h3>
                    <span className="product-price">৳{price}</span>
                </div>
            </Link>
        </div>
    );
});

export default ProductCard;
