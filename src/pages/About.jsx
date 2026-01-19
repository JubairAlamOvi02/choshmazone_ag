
import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const About = () => {
    return (
        <div className="about-page">
            <Navbar />
            <main className="container section-padding" style={{ minHeight: '60vh', py: 'var(--spacing-3xl)' }}>
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
                        <h1 className="h1">Our Story</h1>
                        <p style={{ color: '#666', marginTop: '1rem', fontSize: '1.2rem' }}>Crafting vision and style since 2025.</p>
                    </header>

                    <section style={{ marginBottom: '3rem', lineHeight: '1.8' }}>
                        <h2 className="h2" style={{ marginBottom: '1.5rem' }}>Who We Are</h2>
                        <p>
                            Welcome to <strong>Choshma Zone</strong>, your premier destination for handcrafted, premium eyewear.
                            Our journey began with a simple mission: to provide stylish, high-quality sunglasses that combine
                            modern aesthetics with superior eye protection.
                        </p>
                        <p style={{ marginTop: '1rem' }}>
                            We believe that eyewear is more than just a utility—it's an extension of your personality.
                            That's why every pair in our collection is curated with attention to detail, durability, and comfort.
                        </p>
                    </section>

                    <section style={{ marginBottom: '3rem', lineHeight: '1.8' }}>
                        <h2 className="h2" style={{ marginBottom: '1.5rem' }}>Our Commitment</h2>
                        <p>
                            Quality is at the heart of everything we do. From the materials we select to the customer service we provide,
                            we strive for excellence. Whether you're looking for classic wayfarers, elegant aviators, or bold
                            modern shields, we have something for every visionary.
                        </p>
                    </section>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default About;
