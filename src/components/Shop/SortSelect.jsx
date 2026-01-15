import React from 'react';

const SortSelect = ({ sortOption, setSortOption }) => {
    return (
        <div className="sort-select" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label htmlFor="sort" style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Sort by:</label>
            <select
                id="sort"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                style={{
                    padding: '0.5rem',
                    borderRadius: '4px',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-surface)',
                    color: 'var(--color-text-main)',
                    cursor: 'pointer'
                }}
            >
                <option value="newest">Newest Arrivals</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
            </select>
        </div>
    );
};

export default SortSelect;
