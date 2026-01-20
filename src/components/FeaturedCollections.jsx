import React from 'react';
import { useNavigate } from 'react-router-dom';
import product1 from '../assets/product_1.png';
import product3 from '../assets/product_3.png';
import product4 from '../assets/product_4.png';

const FeaturedCollections = () => {
    const navigate = useNavigate();

    const collections = [
        { id: 1, title: 'Men', category: 'Men', image: product1 },
        { id: 2, title: 'Women', category: 'Women', image: product3 },
        { id: 3, title: 'Unisex', category: 'Unisex', image: product4 },
    ];

    const handleCollectionClick = (category) => {
        navigate('/shop', { state: { category } });
    };

    return (
        <section className="section-padding">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold relative inline-block pb-3 font-outfit uppercase tracking-wider text-text-main">
                        Featured Collections
                        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-secondary"></span>
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {collections.map((collection) => (
                        <div
                            key={collection.id}
                            className="relative h-[250px] md:h-[400px] rounded-md overflow-hidden cursor-pointer group"
                            onClick={() => handleCollectionClick(collection.category)}
                        >
                            <img
                                src={collection.image}
                                alt={collection.title}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-6 md:p-8 text-white">
                                <h3 className="text-2xl md:text-3xl font-bold mb-2 font-outfit">{collection.title}</h3>
                                <span className="text-sm font-medium uppercase tracking-widest border-b-2 border-white self-start pb-1 font-outfit opacity-90 group-hover:opacity-100 transition-opacity">
                                    Shop Collection
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FeaturedCollections;
