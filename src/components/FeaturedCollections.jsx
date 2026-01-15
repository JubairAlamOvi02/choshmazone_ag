import React from 'react';
import './FeaturedCollections.css';
import product1 from '../assets/product_1.png';
import product3 from '../assets/product_3.png';
import product4 from '../assets/product_4.png';

const FeaturedCollections = () => {
    const collections = [
        { id: 1, title: 'Men', image: product1 },
        { id: 2, title: 'Women', image: product3 },
        { id: 3, title: 'New Arrivals', image: product4 },
    ];

    return (
        <section className="featured-collections section-padding">
            <div className="container">
                <h2 className="section-title">Featured Collections</h2>
                <div className="collections-grid">
                    {collections.map((collection) => (
                        <div key={collection.id} className="collection-card">
                            <img src={collection.image} alt={collection.title} className="collection-image" />
                            <div className="collection-overlay">
                                <h3 className="collection-title">{collection.title}</h3>
                                <span className="collection-link">Shop Collection</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FeaturedCollections;
