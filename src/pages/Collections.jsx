
import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FeaturedCollections from '../components/FeaturedCollections';

const Collections = () => {
    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            <main className="container mx-auto px-4 py-20 md:py-32">
                <header className="text-center mb-16 animate-in fade-in slide-in-from-top-4 duration-700">
                    <h1 className="text-4xl md:text-5xl font-bold font-outfit uppercase tracking-tighter text-text-main mb-4">
                        Our Collections
                    </h1>
                    <p className="text-xl text-text-muted font-outfit">Explore our curated range of premium eyewear.</p>
                </header>

                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                    <FeaturedCollections />
                </div>

                <div className="mt-20 pt-12 border-t border-border text-center">
                    <p className="text-text-muted font-outfit italic opacity-60">
                        New styles being handcrafted as we speak. More collections coming soon...
                    </p>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Collections;
