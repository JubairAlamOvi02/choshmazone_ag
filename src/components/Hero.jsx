import React from 'react';
import { Link } from 'react-router-dom';
import Button from './Button';
import heroBanner from '../assets/hero_banner.png';

const Hero = () => {
    return (
        <section
            className="h-[60vh] md:h-[80vh] min-h-[400px] md:min-h-[600px] bg-cover bg-center relative flex items-center"
            style={{ backgroundImage: `url(${heroBanner})` }}
        >
            <div className="absolute inset-0 bg-black/40 md:bg-gradient-to-r md:from-black/60 md:via-black/30 md:to-transparent flex items-center justify-center md:justify-start">
                <div className="container mx-auto text-white max-w-full md:max-w-[600px] px-4 text-center md:text-left">
                    <h1 className="text-3xl md:text-6xl font-bold mb-4 leading-tight drop-shadow-lg uppercase tracking-wider font-outfit">
                        See the World Clearly
                    </h1>
                    <p className="text-base md:text-xl mb-8 opacity-90 drop-shadow-md font-outfit">
                        Discover our premium collection of handcrafted eyewear designed for style and performance.
                    </p>
                    <Link to="/shop">
                        <Button variant="primary" size="large">Shop Now</Button>
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default Hero;
