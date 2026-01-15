import React from 'react';
import '../Button.css'; // Reusing button styles
import './FilterSidebar.css';

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
        <aside className="filter-sidebar">
            <div className="filter-section">
                <h3 className="filter-title">Category</h3>
                <div className="filter-options">
                    {categories.map(cat => (
                        <label key={cat} className="filter-label">
                            <input
                                type="radio"
                                name="category"
                                checked={filters.category === cat}
                                onChange={() => handleCategoryChange(cat)}
                            />
                            <span className="radio-custom"></span>
                            {cat}
                        </label>
                    ))}
                </div>
            </div>

            <div className="filter-section">
                <h3 className="filter-title">Frame Style</h3>
                <div className="filter-options">
                    {styles.map(style => (
                        <label key={style} className="filter-label">
                            <input
                                type="radio"
                                name="style"
                                checked={filters.style === style}
                                onChange={() => handleStyleChange(style)}
                            />
                            <span className="radio-custom"></span>
                            {style}
                        </label>
                    ))}
                </div>
            </div>

            <div className="filter-section">
                <h3 className="filter-title">Price Range</h3>
                <input
                    type="range"
                    min="0"
                    max="500"
                    step="10"
                    value={filters.maxPrice}
                    onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: Number(e.target.value) }))}
                    className="price-slider"
                />
                <div className="price-display">
                    <span>$0</span>
                    <span>${filters.maxPrice}</span>
                </div>
            </div>
        </aside>
    );
};

export default FilterSidebar;
