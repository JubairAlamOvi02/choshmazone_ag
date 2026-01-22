import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const WishlistContext = createContext();

export const useWishlist = () => useContext(WishlistContext);

export const WishlistProvider = ({ children }) => {
    const [wishlist, setWishlist] = useState([]);
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();
    const { showToast } = useToast();

    // Fetch wishlist when user changes
    useEffect(() => {
        if (user) {
            fetchWishlist();
        } else {
            setWishlist([]);
        }
    }, [user]);

    const fetchWishlist = async () => {
        try {
            setLoading(true);
            // We fetch the product details along with the wishlist item
            const { data, error } = await supabase
                .from('wishlist')
                .select(`
                    id,
                    product_id,
                    products (
                        id,
                        name,
                        price,
                        image_url,
                        category
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Transform data to a cleaner format (flat list of products with wishlist_id)
            const formattedWishlist = data.map(item => ({
                wishlist_id: item.id,
                ...item.products,
                // Handle potential different naming conventions if needed
                title: item.products.name,
                image: item.products.image_url
            }));

            setWishlist(formattedWishlist);
        } catch (error) {
            console.error('Error fetching wishlist:', error);
        } finally {
            setLoading(false);
        }
    };

    const addToWishlist = async (product) => {
        if (!user) {
            showToast('Please login to save items to your wishlist', 'info');
            return;
        }

        // Optimistic update
        const tempId = Date.now();
        const newFormattedItem = {
            wishlist_id: tempId,
            ...product,
            // Ensure these fields exist if passing a product object that might use different keys
            title: product.name || product.title,
            image: product.image_url || product.image
        };

        const previousWishlist = [...wishlist];
        setWishlist(prev => [newFormattedItem, ...prev]);

        try {
            const { data, error } = await supabase
                .from('wishlist')
                .insert([{ user_id: user.id, product_id: product.id }])
                .select()
                .single();

            if (error) {
                if (error.code === '23505') { // Unique violation
                    showToast('Item already in wishlist', 'info');
                } else {
                    throw error;
                }
                setWishlist(previousWishlist); // Revert
            } else {
                showToast('Added to wishlist', 'success');
                // Update with real ID
                fetchWishlist();
            }
        } catch (error) {
            console.error('Error adding to wishlist:', error);
            showToast('Failed to add to wishlist', 'error');
            setWishlist(previousWishlist);
        }
    };

    const removeFromWishlist = async (productId) => {
        if (!user) return;

        const previousWishlist = [...wishlist];
        setWishlist(prev => prev.filter(item => item.id !== productId));

        try {
            const { error } = await supabase
                .from('wishlist')
                .delete()
                .eq('user_id', user.id)
                .eq('product_id', productId);

            if (error) throw error;
            showToast('Removed from wishlist', 'info');
        } catch (error) {
            console.error('Error removing from wishlist:', error);
            showToast('Failed to remove from wishlist', 'error');
            setWishlist(previousWishlist);
        }
    };

    const isInWishlist = (productId) => {
        return wishlist.some(item => item.id === productId);
    };

    const toggleWishlist = (product) => {
        if (isInWishlist(product.id)) {
            removeFromWishlist(product.id);
        } else {
            addToWishlist(product);
        }
    };

    const value = {
        wishlist,
        loading,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        toggleWishlist
    };

    return (
        <WishlistContext.Provider value={value}>
            {children}
        </WishlistContext.Provider>
    );
};
