import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Button from './Button';
import heroBannerFallback from '../assets/hero_banner.png';
import { settingsParams } from '../lib/api/settings';

const Hero = () => {
    const [heroImage, setHeroImage] = useState(heroBannerFallback);

    useEffect(() => {
        const fetchHero = async () => {
            try {
                const settings = await settingsParams.fetchAll();
                const banner = settings.find(s => s.key === 'hero_banner')?.value;
                if (banner) setHeroImage(banner);
            } catch (err) {
                console.error("Failed to fetch hero banner:", err);
            }
        };
        fetchHero();
    }, []);

    return (
        <section className="h-[70vh] md:h-[85vh] min-h-[500px] md:min-h-[700px] relative flex items-center overflow-hidden">
            {/* Background Image with optimized loading */}
            <img
                src={heroImage}
                alt="Premium Eyewear Collection"
                className="absolute inset-0 w-full h-full object-cover object-center scale-105 animate-slow-zoom"
                fetchPriority="high"
                loading="eager"
            />

            {/* Premium Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent flex items-center">
                <div className="container mx-auto text-white max-w-full md:max-w-[750px] px-6 text-center md:text-left">
                    <div className="inline-block px-4 py-1.5 bg-secondary/20 backdrop-blur-md border border-secondary/30 rounded-full mb-6 animate-fade-in-up">
                        <span className="text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] text-secondary">Elite Vision • Luxury Style</span>
                    </div>

                    <h1 className="text-4xl md:text-7xl font-bold mb-6 leading-[1.1] drop-shadow-2xl font-outfit uppercase tracking-tighter animate-fade-in-up [animation-delay:200ms]">
                        See the World <br />
                        <span className="text-secondary">Clearly</span>
                    </h1>

                    <p className="text-lg md:text-2xl mb-10 opacity-90 drop-shadow-xl font-outfit max-w-[550px] leading-relaxed animate-fade-in-up [animation-delay:400ms]">
                        Experience premium vision with our handcrafted eyewear collection, designed for those who demand the perfect blend of performance and luxury.
                    </p>

                    <Link to="/shop" className="animate-fade-in-up [animation-delay:600ms] inline-block">
                        <Button variant="primary" size="large">Shop Collection</Button>
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default Hero;
