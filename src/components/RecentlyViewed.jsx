import React from 'react';
import { useRecentlyViewed } from '../context/RecentlyViewedContext';
import ProductCard from './ProductCard';

const RecentlyViewed = ({ excludeId }) => {
    const { viewedProducts } = useRecentlyViewed();

    // Filter out the current product and limit to 4 items for display
    const displayProducts = viewedProducts
        .filter(p => p && p.id && p.id !== excludeId)
        .slice(0, 4);

    if (displayProducts.length === 0) return null;

    return (
        <section className="py-12 md:py-20 border-t border-border">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-end mb-8 md:mb-12">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold font-outfit uppercase tracking-tighter mb-2">Recently Viewed</h2>
                        <div className="w-12 h-1 bg-secondary"></div>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
                    {displayProducts.map(product => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default RecentlyViewed;
