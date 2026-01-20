import React from 'react';
import { Minus, Plus, X } from 'lucide-react';
import { useCart } from '../../context/CartContext';

const CartItem = React.memo(({ item }) => {
    const { removeFromCart, updateQuantity } = useCart();

    return (
        <div className="flex gap-4 py-4 border-b border-border last:border-0">
            <div className="w-20 h-20 bg-background-alt rounded-sm flex items-center justify-center shrink-0 overflow-hidden">
                <img src={item.image} alt={item.title} className="w-full h-full object-contain" />
            </div>

            <div className="flex-1 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                    <h4 className="text-sm md:text-base font-medium text-text-main font-outfit">{item.title}</h4>
                    <button
                        className="text-text-muted hover:text-error transition-colors p-1 -mr-1"
                        onClick={() => removeFromCart(item.id)}
                        aria-label="Remove item"
                    >
                        <X size={16} />
                    </button>
                </div>

                <p className="text-xs text-text-muted font-outfit truncate max-w-[150px]">
                    {item.category} / {item.style}
                </p>

                <div className="flex justify-between items-center mt-2">
                    <div className="flex items-center gap-1 border border-border rounded p-0.5">
                        <button
                            className="w-6 h-6 flex items-center justify-center hover:bg-background-alt rounded transition-colors text-text-main"
                            onClick={() => updateQuantity(item.id, -1)}
                            aria-label="Decrease quantity"
                        >
                            <Minus size={12} />
                        </button>
                        <span className="w-6 text-center text-xs font-bold">{item.quantity}</span>
                        <button
                            className="w-6 h-6 flex items-center justify-center hover:bg-background-alt rounded transition-colors text-text-main"
                            onClick={() => updateQuantity(item.id, 1)}
                            aria-label="Increase quantity"
                        >
                            <Plus size={12} />
                        </button>
                    </div>
                    <p className="font-bold text-text-main font-outfit text-sm">৳{(item.price * item.quantity).toFixed(2)}</p>
                </div>
            </div>
        </div>
    );
});

export default CartItem;
