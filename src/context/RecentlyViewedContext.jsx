import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const RecentlyViewedContext = createContext();

export const useRecentlyViewed = () => useContext(RecentlyViewedContext);

export const RecentlyViewedProvider = ({ children }) => {
    const [viewedProducts, setViewedProducts] = useState(() => {
        try {
            const localData = localStorage.getItem('recentlyViewed');
            if (!localData) return [];
            const parsed = JSON.parse(localData);
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            console.error("Error parsing recentlyViewed from localStorage:", e);
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem('recentlyViewed', JSON.stringify(viewedProducts));
    }, [viewedProducts]);

    const addToRecentlyViewed = useCallback((product) => {
        if (!product || !product.id) return;

        setViewedProducts(prev => {
            const currentList = Array.isArray(prev) ? prev : [];
            // Remove existing entry to move it to the front
            const filtered = currentList.filter(item => item && item.id !== product.id);
            // Keep only the last 10 items
            const newList = [product, ...filtered].slice(0, 10);
            return newList;
        });
    }, []);

    const clearRecentlyViewed = useCallback(() => {
        setViewedProducts([]);
    }, []);

    return (
        <RecentlyViewedContext.Provider value={{ viewedProducts, addToRecentlyViewed, clearRecentlyViewed }}>
            {children}
        </RecentlyViewedContext.Provider>
    );
};
