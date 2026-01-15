import React from 'react';
import { Link } from 'react-router-dom';
import Button from './Button';
import './Hero.css';
import heroBanner from '../assets/hero_banner.png';

const Hero = () => {
    return (
        <section className="hero" style={{ backgroundImage: `url(${heroBanner})` }}>
            <div className="hero-overlay">
                <div className="container hero-content">
                    <h1 className="hero-title">See the World Clearly</h1>
                    <p className="hero-subtitle">Discover our premium collection of handcrafted eyewear designed for style and performance.</p>
                    <Link to="/shop">
                        <Button variant="primary" size="large">Shop Now</Button>
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default Hero;
