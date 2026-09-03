import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, ShoppingBag } from 'lucide-react';
import heroBannerFallback from '../assets/hero_banner.png';
import { settingsParams } from '../lib/api/settings';

export const HERO_BUTTON_STYLES = {
    dark: 'bg-primary text-white border-primary hover:bg-black/90 shadow-xl shadow-black/30',
    gold: 'bg-secondary text-primary border-secondary font-bold hover:brightness-110 shadow-xl shadow-secondary/30',
    white: 'bg-white text-primary border-white font-bold hover:bg-white/90 shadow-xl shadow-white/20',
    outline_gold: 'bg-transparent text-secondary border-2 border-secondary font-bold hover:bg-secondary hover:text-primary backdrop-blur-xs shadow-lg',
    outline_white: 'bg-transparent text-white border-2 border-white/80 font-bold hover:bg-white hover:text-primary backdrop-blur-xs shadow-lg',
    glass: 'bg-white/15 backdrop-blur-md text-white border border-white/30 hover:bg-white/25 shadow-lg',
    gradient_gold: 'bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#AA771C] text-black border-none font-bold shadow-xl shadow-amber-500/20 hover:brightness-110'
};

export const HERO_BUTTON_SHAPES = {
    'rounded-none': 'rounded-none',
    'rounded-md': 'rounded-md',
    'rounded-xl': 'rounded-2xl',
    'rounded-full': 'rounded-full'
};

export const HERO_BUTTON_SIZES = {
    medium: 'px-6 py-3 text-sm',
    large: 'px-8 py-4 text-base md:text-lg',
    xlarge: 'px-10 py-5 text-lg md:text-xl font-bold'
};

const Hero = () => {
    const [heroData, setHeroData] = useState(() => {
        const cachedImg = settingsParams.getCached('hero_banner_image') || settingsParams.getCached('hero_banner');
        const cachedBadge = settingsParams.getCached('hero_banner_badge');
        const cachedTitle = settingsParams.getCached('hero_banner_title');
        const cachedHighlight = settingsParams.getCached('hero_banner_highlight');
        const cachedDescription = settingsParams.getCached('hero_banner_description');
        const cachedBtnText = settingsParams.getCached('hero_banner_btn_text');
        const cachedBtnLink = settingsParams.getCached('hero_banner_btn_link');
        const cachedBtnStyle = settingsParams.getCached('hero_banner_btn_style');
        const cachedBtnShape = settingsParams.getCached('hero_banner_btn_shape');
        const cachedBtnSize = settingsParams.getCached('hero_banner_btn_size');
        const cachedBtnIcon = settingsParams.getCached('hero_banner_btn_icon');

        return {
            image: cachedImg || heroBannerFallback,
            badge: cachedBadge !== null && cachedBadge !== undefined ? cachedBadge : 'Elite Vision • Luxury Style',
            title: cachedTitle || 'See the World',
            highlight: cachedHighlight !== null && cachedHighlight !== undefined ? cachedHighlight : 'Clearly',
            description: cachedDescription || 'Experience premium vision with our handcrafted eyewear collection, designed for those who demand the perfect blend of performance and luxury.',
            btnText: cachedBtnText || 'Shop Collection',
            btnLink: cachedBtnLink || '/shop',
            btnStyle: cachedBtnStyle || 'dark',
            btnShape: cachedBtnShape || 'rounded-md',
            btnSize: cachedBtnSize || 'large',
            btnIcon: cachedBtnIcon || 'none'
        };
    });

    useEffect(() => {
        const fetchHeroSettings = async () => {
            try {
                const settings = await settingsParams.fetchAll();
                const getSetting = (key) => settings.find(s => s.key === key)?.value;

                setHeroData(prev => ({
                    image: getSetting('hero_banner_image') || getSetting('hero_banner') || prev.image,
                    badge: getSetting('hero_banner_badge') !== undefined ? getSetting('hero_banner_badge') : prev.badge,
                    title: getSetting('hero_banner_title') || prev.title,
                    highlight: getSetting('hero_banner_highlight') !== undefined ? getSetting('hero_banner_highlight') : prev.highlight,
                    description: getSetting('hero_banner_description') || prev.description,
                    btnText: getSetting('hero_banner_btn_text') || prev.btnText,
                    btnLink: getSetting('hero_banner_btn_link') || prev.btnLink,
                    btnStyle: getSetting('hero_banner_btn_style') || prev.btnStyle,
                    btnShape: getSetting('hero_banner_btn_shape') || prev.btnShape,
                    btnSize: getSetting('hero_banner_btn_size') || prev.btnSize,
                    btnIcon: getSetting('hero_banner_btn_icon') || prev.btnIcon
                }));
            } catch (err) {
                console.error("Failed to fetch hero banner:", err);
            }
        };
        fetchHeroSettings();
    }, []);

    const styleClass = HERO_BUTTON_STYLES[heroData.btnStyle] || HERO_BUTTON_STYLES.dark;
    const shapeClass = HERO_BUTTON_SHAPES[heroData.btnShape] || HERO_BUTTON_SHAPES['rounded-md'];
    const sizeClass = HERO_BUTTON_SIZES[heroData.btnSize] || HERO_BUTTON_SIZES.large;

    return (
        <section className="h-[70vh] md:h-[85vh] min-h-[500px] md:min-h-[700px] relative flex items-center overflow-hidden">
            {/* Background Image with optimized loading */}
            <img
                src={heroData.image}
                alt={heroData.title || "Premium Eyewear Collection"}
                className="absolute inset-0 w-full h-full object-cover object-center scale-105 animate-slow-zoom"
                fetchPriority="high"
                loading="eager"
            />

            {/* Premium Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-transparent flex items-center">
                <div className="container mx-auto text-white max-w-full md:max-w-[750px] px-6 text-center md:text-left">
                    {heroData.badge && (
                        <div className="inline-block px-4 py-1.5 bg-secondary/20 backdrop-blur-md border border-secondary/30 rounded-full mb-6 animate-fade-in-up">
                            <span className="text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] text-secondary font-outfit">
                                {heroData.badge}
                            </span>
                        </div>
                    )}

                    <h1 className="text-4xl md:text-7xl font-bold mb-6 leading-[1.1] drop-shadow-2xl font-outfit uppercase tracking-tighter animate-fade-in-up [animation-delay:200ms]">
                        {heroData.title} {heroData.highlight && <br />}
                        {heroData.highlight && (
                            <span className="text-secondary">{heroData.highlight}</span>
                        )}
                    </h1>

                    {heroData.description && (
                        <p className="text-lg md:text-2xl mb-10 opacity-90 drop-shadow-xl font-outfit max-w-[550px] leading-relaxed animate-fade-in-up [animation-delay:400ms]">
                            {heroData.description}
                        </p>
                    )}

                    <Link
                        to={heroData.btnLink || '/shop'}
                        className="animate-fade-in-up [animation-delay:600ms] inline-block group"
                    >
                        <button
                            type="button"
                            className={`inline-flex items-center justify-center gap-3 font-outfit uppercase tracking-wider transition-all duration-300 transform group-hover:scale-105 group-active:scale-95 ${styleClass} ${shapeClass} ${sizeClass}`}
                        >
                            <span>{heroData.btnText || 'Shop Collection'}</span>
                            {heroData.btnIcon === 'arrow' && <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-1" />}
                            {heroData.btnIcon === 'sparkle' && <Sparkles size={18} className="text-secondary animate-pulse" />}
                            {heroData.btnIcon === 'bag' && <ShoppingBag size={18} />}
                        </button>
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default Hero;
