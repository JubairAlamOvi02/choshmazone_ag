import React from 'react';
import Button from './Button';

const PromotionalBanner = () => {
    return (
        <section style={{
            backgroundColor: 'var(--color-secondary)',
            color: 'var(--color-primary)',
            padding: 'var(--spacing-3xl) 0',
            textAlign: 'center'
        }}>
            <div className="container">
                <h2 className="h2" style={{ marginBottom: 'var(--spacing-md)' }}>Summer Sale</h2>
                <p style={{
                    fontSize: 'var(--font-size-lg)',
                    marginBottom: 'var(--spacing-lg)',
                    maxWidth: '600px',
                    marginLeft: 'auto',
                    marginRight: 'auto'
                }}>
                    Get up to 50% off on selected styles. Upgrade your look for the sunny days ahead.
                </p>
                <Button variant="primary" size="large" style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-surface)' }}>
                    Shop Sale
                </Button>
            </div>
        </section>
    );
};

export default PromotionalBanner;
