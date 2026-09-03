import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Button from './Button';
import promoBannerFallback from '../assets/promo_banner.jpg';
import { settingsParams } from '../lib/api/settings';

const PromotionalBanner = () => {
    const [banner, setBanner] = useState(() => {
        const cachedImg = settingsParams.getCached('promo_banner_image');
        const cachedBadge = settingsParams.getCached('promo_banner_badge');
        const cachedTitle = settingsParams.getCached('promo_banner_title');
        const cachedDesc = settingsParams.getCached('promo_banner_description');
        const cachedBtnText = settingsParams.getCached('promo_banner_btn_text');
        const cachedBtnLink = settingsParams.getCached('promo_banner_btn_link');

        return {
            image: cachedImg || promoBannerFallback,
            badge: cachedBadge !== null && cachedBadge !== undefined ? cachedBadge : 'Limited Time Offer',
            title: cachedTitle || 'Summer Sale',
            description: cachedDesc || 'Get up to 50% off on selected styles. Upgrade your look for the sunny days ahead.',
            btnText: cachedBtnText || 'Shop Sale',
            btnLink: cachedBtnLink || '/shop'
        };
    });

    useEffect(() => {
        const fetchBannerSettings = async () => {
            try {
                const settings = await settingsParams.fetchAll();
                const getSetting = (key) => settings.find(s => s.key === key)?.value;

                setBanner(prev => ({
                    image: getSetting('promo_banner_image') || prev.image,
                    badge: getSetting('promo_banner_badge') !== undefined ? getSetting('promo_banner_badge') : prev.badge,
                    title: getSetting('promo_banner_title') || prev.title,
                    description: getSetting('promo_banner_description') || prev.description,
                    btnText: getSetting('promo_banner_btn_text') || prev.btnText,
                    btnLink: getSetting('promo_banner_btn_link') || prev.btnLink
                }));
            } catch (err) {
                console.error("Failed to fetch promo banner settings:", err);
            }
        };

        fetchBannerSettings();
    }, []);

    return (
        <section className="relative py-20 md:py-32 overflow-hidden bg-secondary text-center">
            {/* Background Image */}
            {banner.image && (
                <img
                    src={banner.image}
                    alt={banner.title}
                    className="absolute inset-0 w-full h-full object-cover object-center scale-105 transition-transform duration-1000 ease-out hover:scale-110"
                    loading="lazy"
                />
            )}

            {/* Dark/Warm Premium Gradient Overlay for high text contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/70 backdrop-brightness-90"></div>

            {/* Content Container */}
            <div className="relative z-10 container mx-auto px-4 max-w-3xl">
                {banner.badge && (
                    <div className="inline-block px-4 py-1.5 bg-secondary/20 backdrop-blur-md border border-secondary/40 rounded-full mb-6 animate-fade-in-up">
                        <span className="text-xs md:text-sm font-bold uppercase tracking-[0.25em] text-secondary font-outfit">
                            {banner.badge}
                        </span>
                    </div>
                )}

                <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-5 font-outfit text-white uppercase tracking-tight drop-shadow-2xl">
                    {banner.title}
                </h2>

                <p className="text-base md:text-xl mb-10 max-w-[620px] mx-auto text-white/90 font-outfit leading-relaxed drop-shadow-md">
                    {banner.description}
                </p>

                <Link to={banner.btnLink || '/shop'} className="inline-block transition-transform duration-300 hover:scale-105 active:scale-95">
                    <Button variant="secondary" size="large" className="font-bold uppercase tracking-wider px-10 py-4 shadow-2xl shadow-secondary/30">
                        {banner.btnText}
                    </Button>
                </Link>
            </div>
        </section>
    );
};

export default PromotionalBanner;

