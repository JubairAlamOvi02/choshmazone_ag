
import React, { createContext, useContext, useState, useEffect, useMemo, startTransition, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useToast } from './ToastContext';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const { showToast } = useToast();
    const [cartItems, setCartItems] = useState(() => {
        try {
            const localData = localStorage.getItem('cartItems');
            if (!localData) return [];
            const parsed = JSON.parse(localData);
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            console.error("Error parsing cartItems:", e);
            return [];
        }
    });
    const [isCartOpen, setIsCartOpen] = useState(false);

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
                let itemsRemoved = false;
                setCartItems(prev => {
                    const filtered = prev.filter(item => {
                        // Check if it's a valid UUID
                        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.id);
                        if (!isUUID) return false;
                        return activeIds.has(item.id);
                    });

                    if (filtered.length < prev.length) {
                        itemsRemoved = true;
                    }

                    return filtered;
                });

                // Notify outside of render/updater cycle
                if (itemsRemoved) {
                    setTimeout(() => {
                        showToast('Some items were removed from your cart as they are no longer available.', 'warning', 5000);
                    }, 0);
                }
            } catch (err) {
                console.error("Cart validation failed:", err);
            }
        };

        validateCart();
    }, []);

    useEffect(() => {
        localStorage.setItem('cartItems', JSON.stringify(cartItems));
    }, [cartItems]);

    const addToCart = useCallback((product, shouldOpenCart = true) => {
        const quantityToAdd = product.quantity || 1;
        const cartId = product.cartItemId || product.id; // use cartItemId if available

        setCartItems(prevItems => {
            const existingItemIndex = prevItems.findIndex(item => (item.cartItemId || item.id) === cartId);

            if (existingItemIndex >= 0) {
                const newItems = [...prevItems];
                newItems[existingItemIndex] = {
                    ...newItems[existingItemIndex],
                    quantity: newItems[existingItemIndex].quantity + quantityToAdd
                };
                return newItems;
            }
            return [...prevItems, { ...product, cartItemId: cartId, quantity: quantityToAdd }];
        });

        // Show toast
        showToast(`${product.name || product.title} added to your bag!`, 'success');

        // Facebook Pixel AddToCart event
        if (typeof window !== 'undefined' && window.fbq) {
            window.fbq('track', 'AddToCart', {
                content_name: product.name || product.title,
                content_ids: [product.id],
                value: product.price * quantityToAdd,
                currency: 'BDT'
            });
        }

        // Wrap UI state update in transition to improve INP/responsiveness
        if (shouldOpenCart) {
            startTransition(() => {
                setIsCartOpen(true);
            });
        }
    }, [showToast]);

    const removeFromCart = useCallback((id) => {
        let removedItem = null;
        setCartItems(prevItems => {
            removedItem = prevItems.find(item => (item.cartItemId || item.id) === id);
            return prevItems.filter(item => (item.cartItemId || item.id) !== id);
        });

        if (removedItem) {
            showToast(`${removedItem.name || removedItem.title} removed from bag.`, 'info');
        }
    }, [showToast]);

    const updateQuantity = useCallback((id, amount) => {
        setCartItems(prevItems => prevItems.map(item => {
            if ((item.cartItemId || item.id) === id) {
                const newQuantity = item.quantity + amount;
                return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
            }
            return item;
        }));
    }, []);

    const clearCart = useCallback(() => {
        setCartItems([]);
        showToast('Cart cleared.', 'info');
    }, [showToast]);

    const toggleCart = useCallback(() => {
        startTransition(() => {
            setIsCartOpen(prev => !prev);
        });
    }, []);

    const resetQuantities = useCallback(() => {
        setCartItems(prevItems => prevItems.map(item => ({ ...item, quantity: 1 })));
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
        clearCart,
        resetQuantities
    }), [cartItems, isCartOpen, addToCart, removeFromCart, updateQuantity, toggleCart, cartCount, cartTotal, clearCart, resetQuantities]);

    return (
        <CartContext.Provider value={contextValue}>
            {children}
        </CartContext.Provider>
    );
};
