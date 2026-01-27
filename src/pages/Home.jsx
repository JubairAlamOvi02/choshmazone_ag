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
        <div className="min-h-screen bg-white">
            <Navbar />

            <main>
                <Hero />

                <FeaturedCollections />

                <section className="container mx-auto px-4 py-16 md:py-24">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold relative inline-block pb-3 font-outfit uppercase tracking-wider text-text-main">
                            New Arrivals
                            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-secondary"></span>
                        </h2>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
                            {newArrivals.map(product => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    )}
                </section>

                <PromotionalBanner />
            </main>

            <Footer />
        </div>
    );
};

export default Home;
