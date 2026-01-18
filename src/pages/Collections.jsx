
import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FeaturedCollections from '../components/FeaturedCollections';
import './Shop.css'; // Reusing some shop styles

const Collections = () => {
    return (
        <div className="collections-page">
            <Navbar />
            <main className="container section-padding" style={{ minHeight: '60vh' }}>
                <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <h1 className="h2">Our Collections</h1>
                    <p style={{ color: '#666', marginTop: '1rem' }}>Explore our curated range of premium eyewear.</p>
                </header>

                <FeaturedCollections />

                <div style={{ marginTop: '4rem', textAlign: 'center' }}>
                    <p style={{ color: '#888', fontStyle: 'italic' }}>More collections coming soon...</p>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Collections;
