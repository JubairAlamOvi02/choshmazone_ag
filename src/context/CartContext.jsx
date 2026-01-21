
import React, { createContext, useContext, useState, useEffect, useMemo, startTransition, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useToast } from './ToastContext';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState(() => {
        const localData = localStorage.getItem('cartItems');
        return localData ? JSON.parse(localData) : [];
    });
    const [isCartOpen, setIsCartOpen] = useState(false);
    const toast = useToast();

    // Validate cart items against database on mount
    useEffect(() => {
        const validateCart = async () => {
            if (cartItems.length === 0) return;

            try {
                // Get all active product IDs from Supabase
                const { data: activeProducts, error } = await supabase
                    .from('products')
                    .select('id');

                if (error) throw error;

                const activeIds = new Set(activeProducts.map(p => p.id));

                // Filter out items that are no longer in the DB
                setCartItems(prev => {
                    const filtered = prev.filter(item => {
                        // Check if it's a valid UUID
                        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.id);
                        if (!isUUID) return false;
                        return activeIds.has(item.id);
                    });

                    // Notify if items were removed
                    if (filtered.length < prev.length) {
                        toast.warning('Some items were removed from your cart as they are no longer available.');
                    }

                    return filtered;
                });
            } catch (err) {
                console.error("Cart validation failed:", err);
            }
        };

        validateCart();
    }, []);

    useEffect(() => {
        localStorage.setItem('cartItems', JSON.stringify(cartItems));
    }, [cartItems]);

    const addToCart = useCallback((product) => {
        const productName = product.title || product.name || 'Item';
        const quantityToAdd = product.quantity || 1;

        setCartItems(prevItems => {
            const existingItem = prevItems.find(item => item.id === product.id);

            if (existingItem) {
                return prevItems.map(item =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + quantityToAdd }
                        : item
                );
            }
            return [...prevItems, { ...product, quantity: quantityToAdd }];
        });

        // Show toast notification
        toast.success(
            `${productName} ${quantityToAdd > 1 ? `(x${quantityToAdd})` : ''} added to cart`,
            'Added to Cart'
        );

        // Wrap UI state update in transition to improve INP/responsiveness
        startTransition(() => {
            setIsCartOpen(true);
        });
    }, [toast]);

    const removeFromCart = useCallback((id, productName = 'Item') => {
        setCartItems(prevItems => prevItems.filter(item => item.id !== id));
        toast.info(`${productName} removed from cart`, 'Removed');
    }, [toast]);

    const updateQuantity = useCallback((id, amount) => {
        setCartItems(prevItems => prevItems.map(item => {
            if (item.id === id) {
                const newQuantity = item.quantity + amount;
                return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
            }
            return item;
        }));
    }, []);

    const clearCart = useCallback(() => {
        setCartItems([]);
    }, []);

    const toggleCart = useCallback(() => {
        startTransition(() => {
            setIsCartOpen(prev => !prev);
        });
    }, []);

    const cartCount = useMemo(() => cartItems.reduce((acc, item) => acc + item.quantity, 0), [cartItems]);
    const cartTotal = useMemo(() => cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0), [cartItems]);

    const contextValue = useMemo(() => ({
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        isCartOpen,
        toggleCart,
        cartCount,
        cartTotal,
        clearCart
    }), [cartItems, isCartOpen, addToCart, removeFromCart, updateQuantity, toggleCart, cartCount, cartTotal, clearCart]);

    return (
        <CartContext.Provider value={contextValue}>
            {children}
        </CartContext.Provider>
    );
};
