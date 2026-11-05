import React from 'react';
import ProductShowcaseCard from './ProductShowcaseCard';

const ProductShowcaseSection = ({ section, productsMap = {} }) => {
    if (!section || section.enabled === false) return null;

    const items = Array.isArray(section.items) ? section.items : [];
    if (items.length === 0) return null;

    const columns = Number(section.columns) || 4;

    // Dynamic grid classes based on column configuration
    const getGridClass = () => {
        switch (columns) {
            case 2:
                return 'grid-cols-2 gap-4 md:gap-8 max-w-4xl mx-auto';
            case 3:
                return 'grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5 md:gap-8 max-w-6xl mx-auto';
            case 5:
                return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6';
            case 4:
            default:
                return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 md:gap-6 lg:gap-8';
        }
    };

    return (
        <section className="w-full py-10 md:py-16 bg-white border-b border-neutral-100 last:border-b-0">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header matching reference image: centered, clean, elegant */}
                <div className="text-center mb-8 md:mb-12">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-normal sm:font-medium text-neutral-900 tracking-normal font-outfit">
                        {section.title}
                    </h2>
                    {section.subtitle && (
                        <p className="mt-2 text-xs sm:text-sm text-neutral-500 max-w-2xl mx-auto font-outfit">
                            {section.subtitle}
                        </p>
                    )}
                </div>

                {/* Grid of Product Cards */}
                <div className={`grid ${getGridClass()}`}>
                    {items.map((item, idx) => {
                        const linkedProduct = item.product_id ? productsMap[String(item.product_id)] : null;
                        return (
                            <ProductShowcaseCard
                                key={item.id || `item-${idx}`}
                                item={item}
                                currency={section.currency || 'Tk'}
                                showBadge={section.show_badge !== false}
                                showTitle={!!section.show_title}
                                showQuickActions={section.show_quick_actions !== false}
                                linkedProduct={linkedProduct}
                            />
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default ProductShowcaseSection;

