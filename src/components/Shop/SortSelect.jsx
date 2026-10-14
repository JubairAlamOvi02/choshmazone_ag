import React from 'react';

const SortSelect = ({ sortOption, setSortOption }) => {
    return (
        <div className="flex items-center gap-2">
            <label htmlFor="sort" className="hidden md:block text-sm text-text-muted font-outfit whitespace-nowrap uppercase tracking-widest font-bold">
                Sort:
            </label>
            <select
                id="sort"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="p-2 md:px-4 md:py-2 rounded-sm border border-border bg-white text-text-main cursor-pointer text-sm font-outfit focus:outline-none focus:border-primary transition-colors uppercase tracking-widest"
            >
                <option value="newest">Newest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
            </select>
        </div>
    );
};

export default SortSelect;
