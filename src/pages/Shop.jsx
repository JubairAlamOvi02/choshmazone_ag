import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FilterSidebar from '../components/Shop/FilterSidebar';
import SortSelect from '../components/Shop/SortSelect';
import ProductCard from '../components/ProductCard';
import { productParams } from '../lib/api/products';
// import { products } from '../data/products'; // Removed static data
import { useLocation } from 'react-router-dom';
import './Shop.css';

const Shop = () => {
    const location = useLocation();
    const initialCategory = location.state?.category || "All";

    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        category: initialCategory,
        style: "All",
        maxPrice: 10000 // Increased default max price
    });
    const [sortOption, setSortOption] = useState("newest");

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const data = await productParams.fetchAll();
            // Transform Supabase data to match component expectation if needed
            // e.g. map 'name' to 'title', 'image_url' to 'image'
            const formattedData = data.map(p => ({
                ...p,
                title: p.name,
                image: p.image_url
            }));
            setProducts(formattedData);
            setFilteredProducts(formattedData);
        } catch (error) {
            console.error("Error fetching products:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let result = [...products];

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
            result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        }

        setFilteredProducts(result);
    }, [filters, sortOption, products]);

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
