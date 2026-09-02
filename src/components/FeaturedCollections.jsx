import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import product1 from '../assets/product_1.png';
import product2 from '../assets/product_2.png';
import product3 from '../assets/product_3.png';
import product4 from '../assets/product_4.png';
import heroBanner from '../assets/hero_banner.png';
import { categoryParams } from '../lib/api/categories';
import { settingsParams } from '../lib/api/settings';

export const getCategoryFallbackImage = (categoryName = '') => {
    const name = (categoryName || '').toLowerCase();
    if (name.includes('men') && !name.includes('women')) return product1;
    if (name.includes('women')) return product3;
    if (name.includes('unisex')) return product4;
    if (name.includes('kid')) return product2;
    if (name.includes('glass') || name.includes('eye') || name.includes('sun') || name.includes('shade')) return heroBanner;
    return product1;
};

const FeaturedCollections = ({ showAll = false, title = "Featured Collections" }) => {
    const navigate = useNavigate();
    const [collections, setCollections] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCollectionsData = async () => {
            try {
                setLoading(true);
                // 1. Fetch categories
                const categoriesData = await categoryParams.fetchAll();
                
                // 2. Fetch site settings
                const settings = await settingsParams.fetchAll();
                const getSetting = (key) => settings.find(s => s.key === key)?.value;

                // Parse featured categories setting if configured
                let featuredList = null;
                const featuredSetting = getSetting('featured_categories');
                if (featuredSetting) {
                    try {
                        featuredList = typeof featuredSetting === 'string' ? JSON.parse(featuredSetting) : featuredSetting;
                    } catch {
                        featuredList = featuredSetting.split(',').map(s => s.trim());
                    }
                }

                // If categoriesData is empty, fallback to default 5
                const baseCategories = categoriesData.length > 0 ? categoriesData : [
                    { id: '1', name: 'Eye Glasses' },
                    { id: '2', name: 'Kids' },
                    { id: '3', name: 'Men' },
                    { id: '4', name: 'Unisex' },
                    { id: '5', name: 'Women' }
                ];

                // Filter by featured if not showAll
                const filtered = baseCategories.filter(cat => {
                    if (showAll) return true;
                    if (Array.isArray(featuredList) && featuredList.length > 0) {
                        return featuredList.includes(cat.name) || featuredList.includes(cat.id);
                    }
                    // If no explicit featured filter, show all or default ones
                    return cat.is_featured !== false;
                });

                // Map images
                const mapped = filtered.map(cat => {
                    const normalizedKey = `category_img_${cat.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
                    const customImage = getSetting(normalizedKey) || 
                                       getSetting(`category_image_${cat.id}`) || 
                                       getSetting(`${cat.name.toLowerCase()}_collection`) || 
                                       cat.image_url;

                    return {
                        id: cat.id,
                        title: cat.name,
                        category: cat.name,
                        image: customImage || getCategoryFallbackImage(cat.name)
                    };
                });

                setCollections(mapped);
            } catch (err) {
                console.error("Failed to fetch featured collections:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchCollectionsData();
    }, [showAll]);

    const handleCollectionClick = (category) => {
        navigate('/shop', { state: { category } });
    };

    if (loading) {
        return (
            <div className="section-padding flex justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (collections.length === 0) return null;

    // Dynamic grid classes based on count
    const getGridCols = (count) => {
        if (count === 1) return "grid-cols-1 max-w-md mx-auto";
        if (count === 2) return "grid-cols-1 md:grid-cols-2 max-w-3xl mx-auto";
        if (count === 3) return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";
        if (count === 4) return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";
        return "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5";
    };

    return (
        <section className="section-padding">
            <div className="container mx-auto px-4">
                {title && (
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold relative inline-block pb-3 font-outfit uppercase tracking-wider text-text-main">
                            {title}
                            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-secondary"></span>
                        </h2>
                    </div>
                )}

                <div className={`grid ${getGridCols(collections.length)} gap-6`}>
                    {collections.map((collection) => (
                        <div
                            key={collection.id}
                            className="relative h-[280px] md:h-[380px] rounded-2xl overflow-hidden cursor-pointer group shadow-sm hover:shadow-2xl transition-all duration-500 border border-border/40"
                            onClick={() => handleCollectionClick(collection.category)}
                        >
                            <img
                                src={collection.image}
                                alt={collection.title}
                                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                                loading="lazy"
                            />
                            {/* Premium Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex flex-col justify-end p-6 md:p-8 text-white transition-opacity duration-300">
                                <h3 className="text-2xl md:text-3xl font-bold mb-2 font-outfit drop-shadow-md tracking-tight">
                                    {collection.title}
                                </h3>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs md:text-sm font-bold uppercase tracking-widest border-b-2 border-secondary text-secondary pb-0.5 font-outfit group-hover:text-white group-hover:border-white transition-colors">
                                        Shop Collection
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FeaturedCollections;

