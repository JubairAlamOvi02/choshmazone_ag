import React from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import FeaturedCollections from '../components/FeaturedCollections';
import ProductCard from '../components/ProductCard';
import PromotionalBanner from '../components/PromotionalBanner';
import Footer from '../components/Footer';

import { productParams } from '../lib/api/products';

const Home = () => {
    const [newArrivals, setNewArrivals] = React.useState([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchNewArrivals = async () => {
            try {
                const data = await productParams.fetchAll(true);
                // Take the 4 most recent products
                const formattedData = data.slice(0, 4).map(p => ({
                    ...p,
                    title: p.name,
                    image: p.image_url,
                    images: p.images || []
                }));
                setNewArrivals(formattedData);
            } catch (error) {
                console.error("Error fetching new arrivals:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchNewArrivals();
    }, []);

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
