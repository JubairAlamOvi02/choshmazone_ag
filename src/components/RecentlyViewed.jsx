import React, { useState, useEffect } from 'react';
import { useRecentlyViewed } from '../context/RecentlyViewedContext';
import { productParams } from '../lib/api/products';
import ProductCard from './ProductCard';

const RecentlyViewed = ({ excludeId, title = 'Recently Viewed', limit = 4 }) => {
    const { viewedProducts } = useRecentlyViewed();
    const [globalViewed, setGlobalViewed] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const loadGlobalRecent = async () => {
            try {
                const data = await productParams.fetchRecentlyViewed(limit * 2, excludeId);
                if (isMounted && data) {
                    setGlobalViewed(data);
                }
            } catch (err) {
                console.warn('Failed to load global recently viewed products:', err);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        loadGlobalRecent();
        return () => {
            isMounted = false;
        };
    }, [excludeId, limit]);

    // 1. Start with user's local recently viewed products (excluding current product if on ProductDetails page)
    const localFiltered = (viewedProducts || [])
        .filter(p => p && p.id && String(p.id) !== String(excludeId));

    // 2. Assemble the combined list:
    // First take local products, then fill up to `limit` with global recently viewed products (or inventory fallback)
    const seenIds = new Set(localFiltered.map(p => String(p.id)));
    if (excludeId) {
        seenIds.add(String(excludeId));
    }

    const combinedProducts = [...localFiltered];

    for (const gProduct of globalViewed) {
        if (!seenIds.has(String(gProduct.id))) {
            seenIds.add(String(gProduct.id));
            combinedProducts.push(gProduct);
        }
        if (combinedProducts.length >= limit) {
            break;
        }
    }

    const displayProducts = combinedProducts.slice(0, limit);

    return (
        <section className="py-12 md:py-20 border-t border-border">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-end mb-8 md:mb-12">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold font-outfit uppercase tracking-tighter mb-2">
                            {title}
                        </h2>
                        <div className="w-12 h-1 bg-secondary"></div>
                    </div>
                </div>

                {loading && displayProducts.length === 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
                        {[1, 2, 3, 4].map(n => (
                            <div key={n} className="flex flex-col bg-surface rounded-md overflow-hidden animate-pulse">
                                <div className="aspect-square bg-gray-200"></div>
                                <div className="p-3 space-y-2">
                                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
                        {displayProducts.map(product => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};

export default RecentlyViewed;
