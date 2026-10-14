import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { settingsParams, DEFAULT_CHOSHMAZONE_SECTION } from '../lib/api/settings';
import { productParams } from '../lib/api/products';
import { Sparkles, ZoomIn, Play, Volume2, VolumeX, X, ChevronRight, ShoppingBag } from 'lucide-react';

const ChoshmaZoneSpotlight = () => {
    const navigate = useNavigate();
    const [sectionData, setSectionData] = useState(DEFAULT_CHOSHMAZONE_SECTION);
    const [productsMap, setProductsMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [lightboxItem, setLightboxItem] = useState(null);

    useEffect(() => {
        let isMounted = true;
        const loadSectionAndProducts = async () => {
            try {
                const [data, prods] = await Promise.all([
                    settingsParams.getChoshmazoneSection(),
                    productParams.fetchAll(true).catch(err => {
                        console.warn('[Spotlight] Failed to load products map:', err);
                        return [];
                    })
                ]);

                if (isMounted) {
                    if (data) {
                        setSectionData(data);
                    }
                    if (prods && Array.isArray(prods)) {
                        const map = {};
                        prods.forEach(p => {
                            map[String(p.id)] = p;
                        });
                        setProductsMap(map);
                    }
                }
            } catch (err) {
                console.warn('Failed to load choshmazone spotlight section:', err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        loadSectionAndProducts();
        return () => { isMounted = false; };
    }, []);

    if (!sectionData || sectionData.enabled === false) {
        return null;
    }

    const items = sectionData.items || DEFAULT_CHOSHMAZONE_SECTION.items;
    const col1 = items.find(i => i.id === 'col-1') || items[0];
    const col2 = items.find(i => i.id === 'col-2') || items[1];
    const col3Top = items.find(i => i.id === 'col-3-top') || items[2];
    const col3Bottom = items.find(i => i.id === 'col-3-bottom') || items[3];
    const col4 = items.find(i => i.id === 'col-4') || items[4];
    const col5 = items.find(i => i.id === 'col-5') || items[5];

    const isVideoUrl = (item) => {
        if (!item) return false;
        if (item.type === 'video') return true;
        return /\.(mp4|webm|mov|ogg)($|\?)/i.test(item.url || '');
    };

    const handleCardClick = (item) => {
        if (!item) return;

        // If product is linked from inventory, navigate directly to that product page
        if (item.product_id) {
            navigate(`/product/${item.product_id}`);
            return;
        }

        // If custom link is specified
        if (item.custom_link) {
            if (item.custom_link.startsWith('/')) {
                navigate(item.custom_link);
            } else {
                window.open(item.custom_link, '_blank');
            }
            return;
        }

        // Default fallback: open media in lightbox
        setLightboxItem(item);
    };

    const renderMediaCard = ({ item, heightClass = '', roundedClass = 'rounded-3xl', customWrapperClass = '' }) => {
        if (!item || !item.url) return null;
        const isVid = isVideoUrl(item);
        const linkedProduct = item.product_id ? productsMap[String(item.product_id)] : null;
        const hasLink = !!(item.product_id || item.custom_link);

        return (
            <div
                onClick={() => handleCardClick(item)}
                className={`group relative overflow-hidden bg-slate-900 shadow-md hover:shadow-2xl transition-all duration-500 cursor-pointer ${heightClass} ${roundedClass} ${customWrapperClass}`}
                title={hasLink ? (linkedProduct ? `Shop ${linkedProduct.name || item.title}` : 'Click to view product') : 'Click to view'}
            >
                {/* Media Element */}
                {isVid ? (
                    <video
                        src={item.url}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                ) : (
                    <img
                        src={item.url}
                        alt={item.title || item.caption || (linkedProduct ? linkedProduct.name : 'Choshma Zone Look')}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                )}

                {/* Top-Left Shoppable Tag if product is linked */}
                {hasLink && (
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[11px] font-bold font-outfit text-white flex items-center gap-1.5 z-10 border border-white/10 group-hover:bg-secondary group-hover:text-black group-hover:border-secondary transition-all shadow-sm">
                        <ShoppingBag size={11} />
                        <span>Shop Look</span>
                    </div>
                )}

                {/* Top-Right Dedicated Zoom/Play Button for full-screen preview */}
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        setLightboxItem(item);
                    }}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white/90 hover:bg-black/70 hover:scale-110 hover:text-white transition-all z-20 cursor-pointer"
                    title={isVid ? "Watch video" : "Zoom preview"}
                >
                    {isVid ? <Play size={13} fill="currentColor" /> : <ZoomIn size={13} />}
                </button>

                {/* Subtle Luxury Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 sm:p-5">
                    {item.title && (
                        <p className="text-white font-bold font-outfit text-sm sm:text-base leading-snug drop-shadow-md">
                            {item.title}
                        </p>
                    )}
                    {item.caption && (
                        <p className="text-white/80 font-outfit text-xs mt-0.5 line-clamp-2">
                            {item.caption}
                        </p>
                    )}

                    {/* Shoppable Call to Action & Price badge */}
                    {linkedProduct ? (
                        <div className="mt-2.5 flex items-center justify-between gap-2">
                            <span className="text-sm font-black text-secondary font-outfit drop-shadow">
                                ৳{linkedProduct.price}
                            </span>
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-secondary text-black font-bold font-outfit text-xs shadow-md group-hover:scale-105 transition-transform">
                                <ShoppingBag size={12} />
                                <span>Shop Now</span>
                                <ChevronRight size={12} />
                            </span>
                        </div>
                    ) : hasLink ? (
                        <div className="mt-2.5 flex items-center">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary text-black font-bold font-outfit text-xs shadow-md group-hover:scale-105 transition-transform">
                                <ShoppingBag size={12} />
                                <span>View Product</span>
                                <ChevronRight size={13} />
                            </span>
                        </div>
                    ) : null}
                </div>
            </div>
        );
    };

    return (
        <section className="relative py-16 md:py-24 bg-gradient-to-b from-slate-100/90 via-gray-50 to-slate-100/80 border-y border-border/80 overflow-hidden">
            {/* Top & Bottom Accent Gradient Divider */}
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-secondary/70 to-transparent"></div>
            <div className="absolute bottom-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-secondary/40 to-transparent"></div>

            {/* Subtle Brand Atmosphere Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl h-64 bg-gradient-to-r from-secondary/5 via-primary/5 to-secondary/5 blur-3xl pointer-events-none"></div>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Header Section matching other Choshma Zone sections */}
                <div className="text-center mb-12 md:mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold relative inline-block pb-3 font-outfit uppercase tracking-wider text-text-main">
                        {sectionData.title || 'The Details Define Your Vision'}
                        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-secondary"></span>
                    </h2>

                    {/* Subtitle Description */}
                    {sectionData.description && (
                        <p className="mt-4 text-sm md:text-base text-text-muted font-outfit max-w-2xl mx-auto leading-relaxed">
                            {sectionData.description}
                        </p>
                    )}
                </div>

                {/* Desktop 5-Column Asymmetric Curved Gallery */}
                <div className="hidden lg:grid grid-cols-5 gap-4 xl:gap-5 items-center max-w-7xl mx-auto">
                    {/* Column 1: Tall Vertical Card */}
                    <div className="w-full">
                        {renderMediaCard({
                            item: col1,
                            heightClass: 'h-[460px] xl:h-[490px]',
                            roundedClass: 'rounded-[2rem]'
                        })}
                    </div>

                    {/* Column 2: Medium Vertical Card */}
                    <div className="w-full">
                        {renderMediaCard({
                            item: col2,
                            heightClass: 'h-[380px] xl:h-[410px]',
                            roundedClass: 'rounded-[2rem]'
                        })}
                    </div>

                    {/* Column 3: Center Stack of 2 Horizontal Cards */}
                    <div className="w-full flex flex-col gap-4 xl:gap-5">
                        {renderMediaCard({
                            item: col3Top,
                            heightClass: 'h-[180px] xl:h-[195px]',
                            roundedClass: 'rounded-2xl'
                        })}
                        {renderMediaCard({
                            item: col3Bottom,
                            heightClass: 'h-[180px] xl:h-[195px]',
                            roundedClass: 'rounded-2xl'
                        })}
                    </div>

                    {/* Column 4: Medium-Tall Vertical Card */}
                    <div className="w-full">
                        {renderMediaCard({
                            item: col4,
                            heightClass: 'h-[400px] xl:h-[430px]',
                            roundedClass: 'rounded-[2rem]'
                        })}
                    </div>

                    {/* Column 5: Very Tall Vertical Card */}
                    <div className="w-full">
                        {renderMediaCard({
                            item: col5,
                            heightClass: 'h-[480px] xl:h-[510px]',
                            roundedClass: 'rounded-[2rem]'
                        })}
                    </div>
                </div>

                {/* Mobile & Tablet Responsive Horizontal Smooth Carousel */}
                <div className="lg:hidden">
                    <div className="flex gap-4 overflow-x-auto pb-6 snap-x snap-mandatory -mx-4 px-4 custom-scrollbar">
                        <div className="shrink-0 w-[240px] sm:w-[280px] snap-center">
                            {renderMediaCard({
                                item: col1,
                                heightClass: 'h-[360px] sm:h-[420px]',
                                roundedClass: 'rounded-3xl'
                            })}
                        </div>
                        <div className="shrink-0 w-[240px] sm:w-[280px] snap-center">
                            {renderMediaCard({
                                item: col2,
                                heightClass: 'h-[360px] sm:h-[420px]',
                                roundedClass: 'rounded-3xl'
                            })}
                        </div>
                        <div className="shrink-0 w-[240px] sm:w-[280px] flex flex-col gap-3.5 snap-center">
                            {renderMediaCard({
                                item: col3Top,
                                heightClass: 'h-[175px] sm:h-[200px]',
                                roundedClass: 'rounded-2xl'
                            })}
                            {renderMediaCard({
                                item: col3Bottom,
                                heightClass: 'h-[175px] sm:h-[200px]',
                                roundedClass: 'rounded-2xl'
                            })}
                        </div>
                        <div className="shrink-0 w-[240px] sm:w-[280px] snap-center">
                            {renderMediaCard({
                                item: col4,
                                heightClass: 'h-[360px] sm:h-[420px]',
                                roundedClass: 'rounded-3xl'
                            })}
                        </div>
                        <div className="shrink-0 w-[240px] sm:w-[280px] snap-center">
                            {renderMediaCard({
                                item: col5,
                                heightClass: 'h-[360px] sm:h-[420px]',
                                roundedClass: 'rounded-3xl'
                            })}
                        </div>
                    </div>
                    <p className="text-center text-xs text-text-muted font-outfit mt-2">
                        ← Swipe to explore the lookbook →
                    </p>
                </div>
            </div>

            {/* Lightbox / Full-screen Preview Modal */}
            {lightboxItem && (
                <div
                    className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300"
                    onClick={() => setLightboxItem(null)}
                >
                    <button
                        onClick={() => setLightboxItem(null)}
                        className="absolute top-5 right-5 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors z-20 cursor-pointer"
                        title="Close preview"
                    >
                        <X size={22} />
                    </button>

                    <div
                        className="relative max-w-4xl max-h-[85vh] w-full flex flex-col items-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {isVideoUrl(lightboxItem) ? (
                            <div className="relative w-full max-h-[75vh] flex justify-center overflow-hidden rounded-2xl bg-black">
                                <video
                                    src={lightboxItem.url}
                                    controls
                                    autoPlay
                                    playsInline
                                    className="max-h-[75vh] w-auto max-w-full object-contain"
                                />
                            </div>
                        ) : (
                            <img
                                src={lightboxItem.url}
                                alt={lightboxItem.title || 'Preview'}
                                className="max-h-[75vh] w-auto max-w-full object-contain rounded-2xl shadow-2xl"
                            />
                        )}

                        {(lightboxItem.title || lightboxItem.caption || lightboxItem.product_id) && (
                            <div className="mt-4 text-center max-w-xl px-4 flex flex-col items-center">
                                {lightboxItem.title && (
                                    <h4 className="text-lg font-bold text-white font-outfit">
                                        {lightboxItem.title}
                                    </h4>
                                )}
                                {lightboxItem.caption && (
                                    <p className="text-sm text-gray-300 font-outfit mt-1">
                                        {lightboxItem.caption}
                                    </p>
                                )}

                                {/* Shoppable link inside lightbox */}
                                {lightboxItem.product_id && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const pid = lightboxItem.product_id;
                                            setLightboxItem(null);
                                            navigate(`/product/${pid}`);
                                        }}
                                        className="mt-3 inline-flex items-center gap-2 px-5 py-2 rounded-full bg-secondary text-black font-bold font-outfit text-xs uppercase tracking-wider hover:bg-secondary/90 transition-all shadow-lg cursor-pointer"
                                    >
                                        <ShoppingBag size={14} />
                                        <span>Shop This Product Now</span>
                                        <ChevronRight size={14} />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </section>
    );
};

export default ChoshmaZoneSpotlight;
