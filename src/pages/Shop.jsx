import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FilterSidebar from '../components/Shop/FilterSidebar';
import SortSelect from '../components/Shop/SortSelect';
import ProductCard from '../components/ProductCard';
import { products } from '../data/products';
import './Shop.css';

const Shop = () => {
    const [filteredProducts, setFilteredProducts] = useState(products);
    const [filters, setFilters] = useState({
        category: "All",
        style: "All",
        maxPrice: 500
    });
    const [sortOption, setSortOption] = useState("newest");

    useEffect(() => {
        let result = products;

        // Filter by Category
        if (filters.category !== "All") {
            result = result.filter(product => product.category === filters.category);
        }

        // Filter by Style
        if (filters.style !== "All") {
            result = result.filter(product => product.style === filters.style);
        }

        // Filter by Price
        result = result.filter(product => product.price <= filters.maxPrice);

        // Sorting
        if (sortOption === "price-low") {
            result.sort((a, b) => a.price - b.price);
        } else if (sortOption === "price-high") {
            result.sort((a, b) => b.price - a.price);
        } else if (sortOption === "newest") {
            result.sort((a, b) => (a.isNew === b.isNew ? 0 : a.isNew ? -1 : 1));
        }

        setFilteredProducts([...result]);
    }, [filters, sortOption]);

    return (
        <div className="shop-page">
            <Navbar />

            <main className="container section-padding">
                <header className="shop-header">
                    <h1 className="h2">Shop All</h1>
                    <SortSelect sortOption={sortOption} setSortOption={setSortOption} />
                </header>

                <div className="shop-layout">
                    <FilterSidebar filters={filters} setFilters={setFilters} />

                    <div className="shop-grid">
                        {filteredProducts.length > 0 ? (
                            <div className="products-grid">
                                {filteredProducts.map(product => (
                                    <ProductCard key={product.id} product={product} />
                                ))}
                            </div>
                        ) : (
                            <div className="no-results">
                                <p>No products found matching your criteria.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default Shop;
