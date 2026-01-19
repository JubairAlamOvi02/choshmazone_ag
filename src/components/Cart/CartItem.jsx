import React from 'react';
import { Minus, Plus, X } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import './CartItem.css';

const CartItem = React.memo(({ item }) => {
    const { removeFromCart, updateQuantity } = useCart();

    return (
        <div className="cart-item">
            <div className="cart-item-image-container">
                <img src={item.image} alt={item.title} className="cart-item-image" />
            </div>

            <div className="cart-item-details">
                <div className="cart-item-header">
                    <h4 className="cart-item-title">{item.title}</h4>
                    <button
                        className="remove-btn"
                        onClick={() => removeFromCart(item.id)}
                        aria-label="Remove item"
                    >
                        <X size={16} />
                    </button>
                </div>

                <p className="cart-item-variant">{item.category} / {item.style}</p>

                <div className="cart-item-footer">
                    <div className="quantity-controls">
                        <button onClick={() => updateQuantity(item.id, -1)} aria-label="Decrease quantity">
                            <Minus size={14} />
                        </button>
                        <span>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} aria-label="Increase quantity">
                            <Plus size={14} />
                        </button>
                    </div>
                    <p className="cart-item-price">৳{(item.price * item.quantity).toFixed(2)}</p>
                </div>
            </div>
        </div>
    );
});

export default CartItem;
