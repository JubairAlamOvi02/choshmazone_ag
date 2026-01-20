import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ShoppingBag } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import CartItem from './CartItem';
import Button from '../Button';

const CartDrawer = () => {
    const { isCartOpen, toggleCart, cartItems, cartTotal } = useCart();
    const navigate = useNavigate();

    const handleCheckout = () => {
        toggleCart();
        navigate('/checkout');
    };

    // Prevent body scroll when cart is open
    useEffect(() => {
        if (isCartOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isCartOpen]);

    if (!isCartOpen) return null;

    return (
        <div className="fixed inset-0 z-[1000]">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
                onClick={toggleCart}
            ></div>

            {/* Drawer */}
            <div className={`
                absolute top-0 right-0 w-full max-w-[400px] h-full bg-surface shadow-2xl flex flex-col 
                transition-transform duration-300 ease-in-out animate-in slide-in-from-right
            `}>
                <div className="p-6 flex justify-between items-center border-b border-border">
                    <h2 className="text-xl font-bold font-outfit text-text-main uppercase tracking-wider">
                        Your Cart ({cartItems.length})
                    </h2>
                    <button
                        className="text-text-main p-2 hover:bg-black/5 rounded-full transition-colors"
                        onClick={toggleCart}
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
                    {cartItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full gap-6 text-text-muted">
                            <ShoppingBag size={64} className="opacity-30" />
                            <p className="text-lg font-medium font-outfit">Your cart is empty.</p>
                            <Button variant="outline" onClick={toggleCart}>Continue Shopping</Button>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {cartItems.map(item => (
                                <CartItem key={item.id} item={item} />
                            ))}
                        </div>
                    )}
                </div>

                {cartItems.length > 0 && (
                    <div className="p-6 border-t border-border bg-white">
                        <div className="flex justify-between items-center text-xl font-bold mb-2 font-outfit text-text-main">
                            <span>Subtotal</span>
                            <span>৳{cartTotal.toFixed(2)}</span>
                        </div>
                        <p className="text-xs text-text-muted mb-6 text-center font-outfit">
                            Shipping and taxes calculated at checkout.
                        </p>
                        <Button
                            variant="primary"
                            size="large"
                            className="w-full"
                            onClick={handleCheckout}
                        >
                            Proceed to Checkout
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CartDrawer;
