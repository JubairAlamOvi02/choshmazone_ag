import React from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import FeaturedCollections from '../components/FeaturedCollections';
import ProductCard from '../components/ProductCard';
import PromotionalBanner from '../components/PromotionalBanner';
import Footer from '../components/Footer';
import product1 from '../assets/product_1.png';
import product2 from '../assets/product_2.png';
import product3 from '../assets/product_3.png';
import product4 from '../assets/product_4.png';

const Home = () => {
    const newArrivals = [
        { id: 1, title: "Classic Wayfarer", price: 129.99, category: "Best Seller", image: product1 },
        { id: 2, title: "Luxury Aviator", price: 249.99, category: "New Arrival", image: product2 },
        { id: 3, title: "Clubmaster Elite", price: 189.99, category: "Trending", image: product3 },
        { id: 4, title: "Sport Performance", price: 159.99, category: "Sport", image: product4 },
    ];

    return (
        <div className="home-page">
            <Navbar />

            <main>
                <Hero />

                <FeaturedCollections />

                <section className="container section-padding" style={{ paddingBottom: 'var(--spacing-3xl)' }}>
                    <h2 className="section-title">New Arrivals</h2>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                        gap: 'var(--spacing-lg)'
                    }}>
                        {newArrivals.map(product => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                </section>

                <PromotionalBanner />
            </main>

            <Footer />
        </div>
    );
};

export default Home;
