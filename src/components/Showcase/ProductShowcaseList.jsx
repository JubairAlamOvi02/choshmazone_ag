import React, { useState, useEffect } from 'react';
import { settingsParams } from '../../lib/api/settings';
import { productParams } from '../../lib/api/products';
import ProductShowcaseSection from './ProductShowcaseSection';

const ProductShowcaseList = () => {
    const [sections, setSections] = useState([]);
    const [productsMap, setProductsMap] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const loadSectionsAndProducts = async () => {
            try {
                const [secs, prods] = await Promise.all([
                    settingsParams.getShowcaseSections().catch(err => {
                        console.warn('[Showcase] Failed to load sections:', err);
                        return [];
                    }),
                    productParams.fetchAll(true).catch(err => {
                        console.warn('[Showcase] Failed to load inventory products:', err);
                        return [];
                    })
                ]);

                if (!isMounted) return;

                if (Array.isArray(secs)) {
                    // Sort sections by order
                    const sorted = [...secs].sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
                    setSections(sorted);
                }

                if (Array.isArray(prods)) {
                    const map = {};
                    prods.forEach(p => {
                        map[String(p.id)] = p;
                    });
                    setProductsMap(map);
                }
            } catch (err) {
                console.error('[Showcase] Error initializing showcase list:', err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        loadSectionsAndProducts();

        return () => {
            isMounted = false;
        };
    }, []);

    if (loading) {
        return null;
    }

    const activeSections = sections.filter(s => s && s.enabled !== false && Array.isArray(s.items) && s.items.length > 0);

    if (activeSections.length === 0) {
        return null;
    }

    return (
        <div className="product-showcase-container">
            {activeSections.map(section => (
                <ProductShowcaseSection
                    key={section.id}
                    section={section}
                    productsMap={productsMap}
                />
            ))}
        </div>
    );
};

export default ProductShowcaseList;

