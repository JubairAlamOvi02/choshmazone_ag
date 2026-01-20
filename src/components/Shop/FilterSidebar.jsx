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
                <div className="flex flex-col gap-3">
                    {categories.map(cat => (
                        <label key={cat} className="flex items-center gap-3 cursor-pointer text-sm font-outfit text-text-muted hover:text-text-main transition-colors group">
                            <div className="relative flex items-center justify-center">
                                <input
                                    type="radio"
                                    name="category"
                                    className="peer sr-only"
                                    checked={filters.category === cat}
                                    onChange={() => handleCategoryChange(cat)}
                                />
                                <div className="w-4 h-4 rounded-full border border-border peer-checked:border-primary transition-colors appearance-none flex items-center justify-center">
                                    <div className="w-2 h-2 rounded-full bg-primary opacity-0 peer-checked:opacity-100 transition-opacity"></div>
                                </div>
                            </div>
                            <span className="group-hover:translate-x-1 transition-transform duration-200">{cat}</span>
                        </label>
                    ))}
                </div>
            </div>

            <div className="mb-8">
                <h3 className="text-sm font-bold uppercase tracking-widest mb-4 font-outfit text-text-main">
                    Frame Style
                </h3>
                <div className="flex flex-col gap-3">
                    {styles.map(style => (
                        <label key={style} className="flex items-center gap-3 cursor-pointer text-sm font-outfit text-text-muted hover:text-text-main transition-colors group">
                            <div className="relative flex items-center justify-center">
                                <input
                                    type="radio"
                                    name="style"
                                    className="peer sr-only"
                                    checked={filters.style === style}
                                    onChange={() => handleStyleChange(style)}
                                />
                                <div className="w-4 h-4 rounded-full border border-border peer-checked:border-primary transition-colors appearance-none flex items-center justify-center">
                                    <div className="w-2 h-2 rounded-full bg-primary opacity-0 peer-checked:opacity-100 transition-opacity"></div>
                                </div>
                            </div>
                            <span className="group-hover:translate-x-1 transition-transform duration-200">{style}</span>
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
                    min="0"
                    max="10000"
                    step="100"
                    value={filters.maxPrice}
                    onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: Number(e.target.value) }))}
                    className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-xs font-bold text-text-muted mt-3 font-outfit">
                    <span>৳0</span>
                    <span className="text-primary font-bold">৳{filters.maxPrice}</span>
                </div>
            </div>
        </aside>
    );
};

export default FilterSidebar;
