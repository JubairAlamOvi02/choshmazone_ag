
import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const About = () => {
    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            <main className="container mx-auto px-4 py-20 md:py-32">
                <div className="max-w-3xl mx-auto">
                    <header className="text-center mb-16 animate-in fade-in slide-in-from-top-4 duration-700">
                        <h1 className="text-4xl md:text-6xl font-bold font-outfit uppercase tracking-tighter text-text-main mb-4">
                            Our Story
                        </h1>
                        <p className="text-xl text-text-muted font-outfit">Crafting vision and style since 2024.</p>
                        <div className="w-20 h-1 bg-primary mx-auto mt-8"></div>
                    </header>

                    <div className="space-y-16 font-outfit text-lg leading-relaxed text-text-muted animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                        <section>
                            <h2 className="text-2xl font-bold text-text-main uppercase tracking-widest mb-6 border-l-4 border-secondary pl-6">
                                Who We Are
                            </h2>
                            <p>
                                Welcome to <strong className="text-text-main">Choshma Zone</strong>, your premier destination for handcrafted, premium eyewear.
                                Our journey began with a simple mission: to provide stylish, high-quality sunglasses that combine
                                modern aesthetics with superior eye protection.
                            </p>
                            <p className="mt-6">
                                We believe that eyewear is more than just a utility—it's an extension of your personality.
                                That's why every pair in our collection is curated with attention to detail, durability, and comfort.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-text-main uppercase tracking-widest mb-6 border-l-4 border-secondary pl-6">
                                Our Commitment
                            </h2>
                            <p>
                                Quality is at the heart of everything we do. From the materials we select to the customer service we provide,
                                we strive for excellence. Whether you're looking for classic wayfarers, elegant aviators, or bold
                                modern shields, we have something for every visionary.
                            </p>
                        </section>

                        <div className="bg-gray-50 p-10 rounded-2xl border border-border text-center">
                            <h3 className="text-xl font-bold text-text-main mb-4">Questions?</h3>
                            <p className="mb-6">Our team is always here to help you find your perfect pair.</p>
                            <a href="/contact" className="inline-block px-8 py-3 bg-secondary text-white font-bold rounded-lg hover:bg-secondary/90 transition-colors">
                                Get in Touch
                            </a>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default About;
