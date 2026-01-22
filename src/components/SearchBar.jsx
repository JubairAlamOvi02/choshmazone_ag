
import React, { useState, useEffect, useRef, memo } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { productParams } from '../lib/api/products';

const SearchBar = memo(({ className = '' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [allProducts, setAllProducts] = useState([]);
    const inputRef = useRef(null);
    const containerRef = useRef(null);

    // Load products once when search is opened
    useEffect(() => {
        const loadProducts = async () => {
            try {
                const data = await productParams.fetchAll(true);
                setAllProducts(data);
            } catch (error) {
                console.error('Error loading products for search:', error);
            }
        };

        if (isOpen && allProducts.length === 0) {
            loadProducts();
        }
    }, [isOpen]);

    // Focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
                setQuery('');
                setResults([]);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Close on escape key
    useEffect(() => {
        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
                setQuery('');
                setResults([]);
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, []);

    // Filter products based on query
    useEffect(() => {
        if (query.trim().length < 2) {
            setResults([]);
            return;
        }

        setIsLoading(true);

        // Debounce the search
        const timer = setTimeout(() => {
            const searchQuery = query.toLowerCase();
            const filtered = allProducts.filter(product => {
                const name = (product.name || '').toLowerCase();
                const category = (product.category || '').toLowerCase();
                const description = (product.description || '').toLowerCase();

                return name.includes(searchQuery) ||
                    category.includes(searchQuery) ||
                    description.includes(searchQuery);
            }).slice(0, 5); // Limit to 5 results

            setResults(filtered);
            setIsLoading(false);
        }, 200);

        return () => clearTimeout(timer);
    }, [query, allProducts]);

    const handleResultClick = () => {
        setIsOpen(false);
        setQuery('');
        setResults([]);
    };

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            {/* Search Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-center p-2 text-text-main rounded-full hover:bg-black/5 transition-colors shrink-0 min-w-[40px] min-h-[40px]"
                aria-label="Search"
            >
                {isOpen ? <X size={20} /> : <Search size={20} />}
            </button>

            {/* Search Dropdown */}
            {isOpen && (
                <div className="absolute right-0 top-[calc(100%+0.5rem)] w-screen max-w-[400px] bg-white rounded-lg shadow-xl border border-border overflow-hidden z-50">
                    {/* Search Input */}
                    <div className="flex items-center gap-3 p-3 border-b border-border">
                        <Search size={18} className="text-text-muted flex-shrink-0" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search for sunglasses..."
                            className="flex-1 outline-none text-text-main placeholder:text-text-muted text-sm bg-transparent"
                        />
                        {isLoading && (
                            <Loader2 size={18} className="text-text-muted animate-spin flex-shrink-0" />
                        )}
                        {query && (
                            <button
                                onClick={() => setQuery('')}
                                className="text-text-muted hover:text-text-main transition-colors"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    {/* Results */}
                    <div className="max-h-[300px] overflow-y-auto">
                        {query.trim().length < 2 && (
                            <div className="p-4 text-center text-text-muted text-sm">
                                Type at least 2 characters to search
                            </div>
                        )}

                        {query.trim().length >= 2 && !isLoading && results.length === 0 && (
                            <div className="p-4 text-center text-text-muted text-sm">
                                No products found for "{query}"
                            </div>
                        )}

                        {results.map((product) => (
                            <Link
                                key={product.id}
                                to={`/product/${product.id}`}
                                onClick={handleResultClick}
                                className="flex items-center gap-3 p-3 hover:bg-background-alt transition-colors border-b border-border last:border-b-0"
                            >
                                <img
                                    src={product.image_url}
                                    alt={product.name}
                                    className="w-12 h-12 object-cover rounded-md bg-gray-100"
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-text-main text-sm truncate">
                                        {product.name}
                                    </p>
                                    <p className="text-text-muted text-xs">
                                        {product.category} • ৳{product.price}
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>

                    {/* View All Results */}
                    {results.length > 0 && (
                        <Link
                            to={`/shop?search=${encodeURIComponent(query)}`}
                            onClick={handleResultClick}
                            className="block p-3 text-center text-sm font-medium text-primary hover:bg-background-alt transition-colors border-t border-border"
                        >
                            View all results →
                        </Link>
                    )}
                </div>
            )}
        </div>
    );
});

SearchBar.displayName = 'SearchBar';

export default SearchBar;
