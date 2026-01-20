import React from 'react';

const FilterSidebar = ({ filters, setFilters }) => {
    const categories = ["All", "Men", "Women", "Unisex"];
    const styles = ["All", "Wayfarer", "Aviator", "Clubmaster", "Round", "Sport", "Shield", "Square"];

    const handleCategoryChange = (category) => {
        setFilters(prev => ({ ...prev, category }));
    };

    const handleStyleChange = (style) => {
        setFilters(prev => ({ ...prev, style }));
    };

    return (
        <aside className="lg:pr-8 lg:border-r border-border h-full">
            <div className="mb-8">
                <h3 className="text-sm font-bold uppercase tracking-widest mb-4 font-outfit text-text-main">
                    Category
                </h3>
                <div className="flex flex-wrap gap-2">
                    {categories.map(cat => (
                        <label
                            key={cat}
                            className={`group flex items-center gap-2 px-5 py-2.5 rounded-full cursor-pointer text-[11px] font-bold uppercase tracking-widest font-outfit transition-all duration-300 border ${filters.category === cat
                                    ? 'bg-primary text-white border-primary shadow-lg ring-2 ring-primary/10'
                                    : 'bg-background-alt text-text-muted border-transparent hover:border-border hover:bg-white'
                                }`}
                        >
                            <input
                                type="radio"
                                name="category"
                                className="sr-only"
                                checked={filters.category === cat}
                                onChange={() => handleCategoryChange(cat)}
                            />
                            {filters.category === cat && (
                                <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
                            )}
                            <span>{cat}</span>
                        </label>
                    ))}
                </div>
            </div>

            <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-bold uppercase tracking-widest font-outfit text-text-main">
                        Frame Style
                    </h3>
                    {filters.style !== "All" && (
                        <button
                            onClick={() => handleStyleChange("All")}
                            className="text-[10px] text-secondary font-bold uppercase tracking-widest hover:underline"
                        >
                            Reset
                        </button>
                    )}
                </div>
                <div className="flex flex-wrap gap-2">
                    {styles.map(style => (
                        <label
                            key={style}
                            className={`group flex items-center gap-2 px-5 py-2.5 rounded-full cursor-pointer text-[11px] font-bold uppercase tracking-widest font-outfit transition-all duration-300 border ${filters.style === style
                                    ? 'bg-primary text-white border-primary shadow-lg ring-2 ring-primary/10'
                                    : 'bg-background-alt text-text-muted border-transparent hover:border-border hover:bg-white'
                                }`}
                        >
                            <input
                                type="radio"
                                name="style"
                                className="sr-only"
                                checked={filters.style === style}
                                onChange={() => handleStyleChange(style)}
                            />
                            {filters.style === style && (
                                <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
                            )}
                            <span className="text-center">{style}</span>
                        </label>
                    ))}
                </div>
            </div>

            <div className="mb-8">
                <h3 className="text-sm font-bold uppercase tracking-widest mb-4 font-outfit text-text-main">
                    Price Range
                </h3>
                <input
                    type="range"
                    min="1000"
                    max="10000"
                    step="100"
                    value={filters.maxPrice}
                    onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: Number(e.target.value) }))}
                    className="w-full h-1.5 bg-background-alt rounded-lg appearance-none cursor-pointer accent-secondary border border-border"
                />
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-text-muted mt-3 font-outfit">
                    <span>Min: ৳1000</span>
                    <span className="text-primary">Max: ৳{filters.maxPrice}</span>
                </div>
            </div>

            <button
                onClick={() => setFilters({ category: "All", style: "All", maxPrice: 10000 })}
                className="w-full py-3 mt-4 text-[10px] font-bold uppercase tracking-widest border border-primary hover:bg-primary hover:text-white transition-all duration-300 font-outfit"
            >
                Clear All Filters
            </button>
        </aside>
    );
};

export default FilterSidebar;
