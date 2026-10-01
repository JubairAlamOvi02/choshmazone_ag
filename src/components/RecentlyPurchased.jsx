import React, { useState, useEffect } from 'react';
import ProductCard from './ProductCard';
import { orderParams } from '../lib/api/orders';

const RecentlyPurchased = ({ title = 'Recently Purchased', limit = 4 }) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const loadRecentPurchases = async () => {
            try {
                const items = await orderParams.fetchRecentPurchased(limit);
                if (isMounted) {
                    setProducts(items);
                }
            } catch (err) {
                console.error('Failed to load recently purchased products:', err);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        loadRecentPurchases();

        return () => {
            isMounted = false;
        };
    }, [limit]);

    // If loading has completed and there are no purchases to show, render nothing
    if (!loading && (!products || products.length === 0)) {
        return null;
    }

    return (
        <section className="container mx-auto px-4 py-16 md:py-24">
            <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold relative inline-block pb-3 font-outfit uppercase tracking-wider text-text-main">
                    {title}
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-secondary"></span>
                </h2>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
            ) : (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
                    {products.map(product => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            )}
        </section>
    );
};

export default RecentlyPurchased;
