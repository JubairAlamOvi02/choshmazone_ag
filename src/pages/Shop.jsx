import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FilterSidebar from '../components/Shop/FilterSidebar';
import SortSelect from '../components/Shop/SortSelect';
import ProductCard from '../components/ProductCard';
import { productParams } from '../lib/api/products';
import { useLocation } from 'react-router-dom';
import { X } from 'lucide-react';


const Shop = () => {
    const location = useLocation();
    const initialCategory = location.state?.category || "All";
    const initialSearch = location.state?.searchQuery || "";

    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        category: initialCategory,
        style: "All",
        maxPrice: 10000
    });
    const [searchQuery, setSearchQuery] = useState(initialSearch);
    const [sortOption, setSortOption] = useState("newest");
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    useEffect(() => {
        // Check for state-based search
        if (location.state?.searchQuery) {
            setSearchQuery(location.state.searchQuery);
        }

        // Check for URL-based search
        const params = new URLSearchParams(location.search);
        const urlSearch = params.get('search');
        if (urlSearch) {
            setSearchQuery(urlSearch);
        }
    }, [location.state?.searchQuery, location.search]);

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

        // Apply Category/Style Filters
        if (filters.category !== "All") {
            result = result.filter(product => product.category === filters.category);
        }

        if (filters.style !== "All") {
            result = result.filter(product => product.style === filters.style);
        }

        result = result.filter(product => product.price <= filters.maxPrice);

        // Apply Search Filter
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(product =>
                product.name.toLowerCase().includes(q) ||
                product.category.toLowerCase().includes(q) ||
                product.style.toLowerCase().includes(q)
            );
        }

        // Apply Sorting
        if (sortOption === "price-low") {
            result.sort((a, b) => a.price - b.price);
        } else if (sortOption === "price-high") {
            result.sort((a, b) => b.price - a.price);
        } else if (sortOption === "newest") {
            result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        }

        setFilteredProducts(result);
    }, [filters, sortOption, products, searchQuery]);

    return (
        <div className="min-h-screen bg-white">
            <Navbar />

            <main className="container mx-auto px-4 py-8 md:py-12">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 pb-4 border-b border-border gap-4">
                    <h1 className="text-2xl md:text-3xl font-bold font-outfit text-text-main uppercase tracking-wider">
                        {searchQuery ? `Results for "${searchQuery}"` : (filters.category === "All" ? "Shop All" : `Shop ${filters.category}`)}
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
                        {/* Active Filter Chips */}
                        {(filters.category !== "All" || filters.style !== "All" || searchQuery) && (
                            <div className="flex flex-wrap items-center gap-3 mb-8 animate-in fade-in slide-in-from-left-4 duration-500">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Filtering:</span>

                                {searchQuery && (
                                    <div className="group flex items-center gap-2 bg-secondary text-white px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest font-outfit shadow-md ring-2 ring-secondary/5">
                                        <span className="w-1 h-1 rounded-full bg-white animate-pulse"></span>
                                        <span>Search: {searchQuery}</span>
                                        <button
                                            onClick={() => setSearchQuery("")}
                                            className="ml-2 hover:text-primary transition-colors cursor-pointer border-l border-white/20 pl-2"
                                            title="Clear Search"
                                        >
                                            <X size={10} strokeWidth={4} />
                                        </button>
                                    </div>
                                )}

                                {filters.category !== "All" && (
                                    <div className="group flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest font-outfit shadow-md ring-2 ring-primary/5">
                                        <span className="w-1 h-1 rounded-full bg-secondary"></span>
                                        <span>{filters.category}</span>
                                        <button
                                            onClick={() => setFilters(prev => ({ ...prev, category: "All" }))}
                                            className="ml-2 hover:text-secondary transition-colors cursor-pointer border-l border-white/20 pl-2"
                                            title="Remove Category"
                                        >
                                            <X size={10} strokeWidth={4} />
                                        </button>
                                    </div>
                                )}
                                {filters.style !== "All" && (
                                    <div className="group flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest font-outfit shadow-md ring-2 ring-primary/5">
                                        <span className="w-1 h-1 rounded-full bg-secondary"></span>
                                        <span>{filters.style}</span>
                                        <button
                                            onClick={() => setFilters(prev => ({ ...prev, style: "All" }))}
                                            className="ml-2 hover:text-secondary transition-colors cursor-pointer border-l border-white/20 pl-2"
                                            title="Remove Style"
                                        >
                                            <X size={10} strokeWidth={4} />
                                        </button>
                                    </div>
                                )}
                                <button
                                    onClick={() => {
                                        setFilters({ category: "All", style: "All", maxPrice: 10000 });
                                        setSearchQuery("");
                                    }}
                                    className="text-[10px] font-bold uppercase tracking-widest text-text-muted hover:text-primary transition-all hover:tracking-[0.15em]"
                                >
                                    Reset All
                                </button>
                            </div>
                        )}

                        {loading ? (
                            <div className="flex justify-center items-center h-64">
                                <p className="text-lg font-outfit text-text-muted">Loading products...</p>
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
