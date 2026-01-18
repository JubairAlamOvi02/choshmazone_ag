
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState(() => {
        const localData = localStorage.getItem('cartItems');
        return localData ? JSON.parse(localData) : [];
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
                setCartItems(prev => {
                    const filtered = prev.filter(item => {
                        // Check if it's a valid UUID
                        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.id);
                        if (!isUUID) return false;
                        return activeIds.has(item.id);
                    });
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

    const addToCart = (product) => {
        setCartItems(prevItems => {
            const existingItem = prevItems.find(item => item.id === product.id);
            if (existingItem) {
                return prevItems.map(item =>
                    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            return [...prevItems, { ...product, quantity: 1 }];
        });
        setIsCartOpen(true);
    };

    const removeFromCart = (id) => {
        setCartItems(prevItems => prevItems.filter(item => item.id !== id));
    };

    const updateQuantity = (id, amount) => {
        setCartItems(prevItems => prevItems.map(item => {
            if (item.id === id) {
                const newQuantity = item.quantity + amount;
                return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
            }
            return item;
        }));
    };

    const clearCart = () => {
        setCartItems([]);
    };

    const toggleCart = () => setIsCartOpen(!isCartOpen);

    const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
    const cartTotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    return (
        <CartContext.Provider value={{
            cartItems,
            addToCart,
            removeFromCart,
            updateQuantity,
            isCartOpen,
            toggleCart,
            cartCount,
            cartTotal,
            clearCart
        }}>
            {children}
        </CartContext.Provider>
    );
};
