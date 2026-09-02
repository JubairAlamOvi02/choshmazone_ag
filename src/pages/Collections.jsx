import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FeaturedCollections, { getCategoryFallbackImage } from '../components/FeaturedCollections';
import { categoryParams } from '../lib/api/categories';
import { settingsParams } from '../lib/api/settings';
import { ArrowRight, Sparkles, Layers, Grid } from 'lucide-react';

const Collections = () => {
    const navigate = useNavigate();
    const [allCategories, setAllCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAllCollections = async () => {
            try {
                setLoading(true);
                const [categoriesData, settingsData] = await Promise.all([
                    categoryParams.fetchAll(),
                    settingsParams.fetchAll()
                ]);

                const getSetting = (key) => settingsData.find(s => s.key === key)?.value;

                // Base fallback categories if empty
                const list = categoriesData.length > 0 ? categoriesData : [
                    { id: '1', name: 'Eye Glasses' },
                    { id: '2', name: 'Kids' },
                    { id: '3', name: 'Men' },
                    { id: '4', name: 'Unisex' },
                    { id: '5', name: 'Women' }
                ];

                const mapped = list.map(cat => {
                    const normalizedKey = `category_img_${cat.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
                    const img = getSetting(normalizedKey) ||
                                getSetting(`category_image_${cat.id}`) ||
                                getSetting(`${cat.name.toLowerCase()}_collection`) ||
                                cat.image_url ||
                                getCategoryFallbackImage(cat.name);

                    return {
                        id: cat.id,
                        name: cat.name,
                        image: img
                    };
                });

                setAllCategories(mapped);
            } catch (err) {
                console.error("Failed to load collections:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchAllCollections();
    }, []);

    const handleCategoryClick = (category) => {
        navigate('/shop', { state: { category } });
    };

    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            
            <main>
                {/* Hero Header */}
                <section className="bg-gray-50/70 border-b border-border/50 py-16 md:py-24 text-center">
                    <div className="container mx-auto px-4">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-widest font-outfit mb-4">
                            <Layers size={14} /> Curated Eyewear
                        </div>
                        <h1 className="text-4xl md:text-6xl font-bold font-outfit uppercase tracking-tighter text-text-main mb-4">
                            Eyewear Collections
                        </h1>
                        <p className="text-base md:text-xl text-text-muted font-outfit max-w-2xl mx-auto">
                            Explore our complete range of handcrafted eyewear designed for every style, gender, and occasion.
                        </p>
                    </div>
                </section>

                {/* UPPER SECTION: ALL COLLECTIONS */}
                <section className="container mx-auto px-4 py-16 md:py-20">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 pb-4 border-b border-border/60">
                        <div>
                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary font-outfit mb-1">
                                <Grid size={14} /> Complete Catalog
                            </div>
                            <h2 className="text-2xl md:text-4xl font-bold font-outfit uppercase tracking-tight text-text-main">
                                All Collections
                            </h2>
                        </div>
                        <span className="text-xs font-bold font-outfit uppercase tracking-wider text-text-muted">
                            {allCategories.length} Categories Available
                        </span>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
                            {allCategories.map((cat) => (
                                <div
                                    key={cat.id}
                                    onClick={() => handleCategoryClick(cat.name)}
                                    className="group relative bg-white border border-border/80 rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl hover:border-primary/50 transition-all duration-500 flex flex-col"
                                >
                                    <div className="relative aspect-square overflow-hidden bg-gray-50">
                                        <img
                                            src={cat.image}
                                            alt={cat.name}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                            loading="lazy"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    </div>
                                    
                                    <div className="p-4 sm:p-5 flex items-center justify-between gap-2 border-t border-border/40 bg-white">
                                        <div>
                                            <h3 className="font-bold text-text-main font-outfit text-sm sm:text-base group-hover:text-primary transition-colors uppercase tracking-tight">
                                                {cat.name}
                                            </h3>
                                            <span className="text-[10px] sm:text-xs text-text-muted font-outfit uppercase tracking-wider block">
                                                View Catalog
                                            </span>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-gray-100 group-hover:bg-primary group-hover:text-white flex items-center justify-center transition-all flex-shrink-0">
                                            <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* DIVIDER BANNER */}
                <div className="container mx-auto px-4">
                    <div className="border-t border-border/80"></div>
                </div>

                {/* LOWER SECTION: FEATURED COLLECTIONS */}
                <section className="bg-white py-12 md:py-20">
                    <div className="container mx-auto px-4 mb-2 text-center">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-secondary/20 text-primary border border-secondary/40 rounded-full text-xs font-bold uppercase tracking-widest font-outfit mb-3">
                            <Sparkles size={13} className="text-amber-600" /> Curated Showcase
                        </div>
                    </div>
                    {/* Reusable Featured Collections Component */}
                    <FeaturedCollections showAll={false} title="Featured Collections" />
                </section>
            </main>

            <Footer />
        </div>
    );
};

export default Collections;
