import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FilterSidebar from '../components/Shop/FilterSidebar';
import SortSelect from '../components/Shop/SortSelect';
import ProductCard from '../components/ProductCard';
import { productParams } from '../lib/api/products';
import { useLocation } from 'react-router-dom';

const Shop = () => {
    const location = useLocation();
    const initialCategory = location.state?.category || "All";

    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        category: initialCategory,
        style: "All",
        maxPrice: 10000
    });
    const [sortOption, setSortOption] = useState("newest");
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const data = await productParams.fetchAll(true);
            const formattedData = data.map(p => ({
                ...p,
                title: p.name,
                image: p.image_url,
                images: p.images || []
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

        if (filters.category !== "All") {
            result = result.filter(product => product.category === filters.category);
        }

        if (filters.style !== "All") {
            result = result.filter(product => product.style === filters.style);
        }

        result = result.filter(product => product.price <= filters.maxPrice);

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
        <div className="min-h-screen bg-white">
            <Navbar />

            <main className="container mx-auto px-4 py-8 md:py-12">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 pb-4 border-b border-border gap-4">
                    <h1 className="text-2xl md:text-3xl font-bold font-outfit text-text-main uppercase tracking-wider">
                        Shop All
                    </h1>
                    <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto">
                        <button
                            className="lg:hidden px-4 py-2 border border-border bg-white rounded-sm text-sm font-medium hover:bg-background-alt transition-colors font-outfit"
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                        >
                            {isFilterOpen ? 'Hide Filters' : 'Show Filters'}
                        </button>
                        <SortSelect sortOption={sortOption} setSortOption={setSortOption} />
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-8 md:gap-12">
                    <div className={`${isFilterOpen ? 'block' : 'hidden'} lg:block transition-all duration-300`}>
                        <FilterSidebar filters={filters} setFilters={setFilters} />
                    </div>

                    <div className="flex-1">
                        {loading ? (
                            <div className="flex justify-center py-20">
                                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                            </div>
                        ) : filteredProducts.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
                                {filteredProducts.map(product => (
                                    <ProductCard key={product.id} product={product} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 text-text-muted text-lg font-outfit">
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
