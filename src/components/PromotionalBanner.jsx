import React from 'react';
import Button from './Button';

const PromotionalBanner = () => {
    return (
        <section className="bg-secondary py-16 md:py-24 text-center">
            <div className="container mx-auto px-4">
                <h2 className="text-3xl md:text-5xl font-bold mb-4 font-outfit text-primary uppercase tracking-wider">
                    Summer Sale
                </h2>
                <p className="text-base md:text-lg mb-8 max-w-[600px] mx-auto text-primary/80 font-outfit">
                    Get up to 50% off on selected styles. Upgrade your look for the sunny days ahead.
                </p>
                <Link to="/shop">
                    <Button variant="primary" size="large">
                        Shop Sale
                    </Button>
                </Link>
            </div>
        </section>
    );
};

// Import missing Link component
import { Link } from 'react-router-dom';

export default PromotionalBanner;
