import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, ShoppingBag } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import CartItem from './CartItem';
import Button from '../Button';
import './CartDrawer.css';

const CartDrawer = () => {
    const { isCartOpen, toggleCart, cartItems, cartTotal } = useCart();
    const navigate = useNavigate();

    const handleCheckout = () => {
        toggleCart();
        navigate('/checkout');
    };

    if (!isCartOpen) return null;

    return (
        <>
            <div className="cart-overlay" onClick={toggleCart}></div>
            <div className={`cart-drawer ${isCartOpen ? 'open' : ''}`}>
                <div className="cart-header">
                    <h2 className="h3">Your Cart ({cartItems.length})</h2>
                    <button className="close-cart-btn" onClick={toggleCart}>
                        <X size={24} />
                    </button>
                </div>

                <div className="cart-items">
                    {cartItems.length === 0 ? (
                        <div className="empty-cart">
                            <ShoppingBag size={48} className="empty-cart-icon" />
                            <p>Your cart is empty.</p>
                            <Button variant="outline" onClick={toggleCart}>Continue Shopping</Button>
                        </div>
                    ) : (
                        cartItems.map(item => (
                            <CartItem key={item.id} item={item} />
                        ))
                    )}
                </div>

                {cartItems.length > 0 && (
                    <div className="cart-footer">
                        <div className="cart-subtotal">
                            <span>Subtotal</span>
                            <span className="subtotal-amount">${cartTotal.toFixed(2)}</span>
                        </div>
                        <p className="cart-note">Shipping and taxes calculated at checkout.</p>
                        <Button variant="primary" size="large" style={{ width: '100%' }} onClick={handleCheckout}>Checkout</Button>
                    </div>
                )}
            </div>
        </>
    );
};

export default CartDrawer;
