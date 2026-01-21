/**
 * Simple In-Memory Cache with TTL (Time To Live)
 * 
 * Features:
 * - Configurable TTL per cache entry
 * - Stale-while-revalidate pattern
 * - Memory-efficient with automatic cleanup
 * - Type-safe with clear API
 */

class CacheEntry {
    constructor(data, ttl) {
        this.data = data;
        this.timestamp = Date.now();
        this.ttl = ttl;
    }

    isExpired() {
        return Date.now() - this.timestamp > this.ttl;
    }

    isStale(staleTime = 0) {
        return Date.now() - this.timestamp > staleTime;
    }
}

class DataCache {
    constructor() {
        this.cache = new Map();
        this.pendingRequests = new Map();
    }

    /**
     * Get data from cache
     * @param {string} key - Cache key
     * @returns {any|null} - Cached data or null if expired/missing
     */
    get(key) {
        const entry = this.cache.get(key);
        if (!entry) return null;
        if (entry.isExpired()) {
            this.cache.delete(key);
            return null;
        }
        return entry.data;
    }

    /**
     * Set data in cache
     * @param {string} key - Cache key
     * @param {any} data - Data to cache
     * @param {number} ttl - Time to live in milliseconds (default: 5 minutes)
     */
    set(key, data, ttl = 5 * 60 * 1000) {
        this.cache.set(key, new CacheEntry(data, ttl));
    }

    /**
     * Check if key exists and is not expired
     * @param {string} key - Cache key
     * @returns {boolean}
     */
    has(key) {
        const entry = this.cache.get(key);
        if (!entry) return false;
        if (entry.isExpired()) {
            this.cache.delete(key);
            return false;
        }
        return true;
    }

    /**
     * Invalidate a specific cache entry
     * @param {string} key - Cache key to invalidate
     */
    invalidate(key) {
        this.cache.delete(key);
    }

    /**
     * Invalidate all entries matching a pattern
     * @param {string} pattern - Pattern to match (simple string matching)
     */
    invalidatePattern(pattern) {
        for (const key of this.cache.keys()) {
            if (key.includes(pattern)) {
                this.cache.delete(key);
            }
        }
    }

    /**
     * Clear all cache entries
     */
    clear() {
        this.cache.clear();
        this.pendingRequests.clear();
    }

    /**
     * Fetch with cache - Stale-While-Revalidate pattern
     * @param {string} key - Cache key
     * @param {Function} fetcher - Async function to fetch data
     * @param {Object} options - Cache options
     * @returns {Promise<any>} - Cached or fresh data
     */
    async fetchWithCache(key, fetcher, options = {}) {
        const {
            ttl = 5 * 60 * 1000, // 5 minutes default
            staleTime = 30 * 1000, // 30 seconds before considering stale
            forceRefresh = false,
        } = options;

        // If force refresh, skip cache
        if (forceRefresh) {
            const data = await fetcher();
            this.set(key, data, ttl);
            return data;
        }

        // Check cache
        const cached = this.get(key);
        if (cached !== null) {
            const entry = this.cache.get(key);

            // If not stale, return cached data immediately
            if (!entry.isStale(staleTime)) {
                return cached;
            }

            // If stale but not expired, return cached data and revalidate in background
            if (!this.pendingRequests.has(key)) {
                this.pendingRequests.set(key, true);
                fetcher().then(freshData => {
                    this.set(key, freshData, ttl);
                    this.pendingRequests.delete(key);
                }).catch(() => {
                    this.pendingRequests.delete(key);
                });
            }
            return cached;
        }

        // No cache, fetch fresh data
        const data = await fetcher();
        this.set(key, data, ttl);
        return data;
    }

    /**
     * Get cache statistics
     * @returns {Object} - Cache stats
     */
    getStats() {
        let activeEntries = 0;
        let expiredEntries = 0;

        for (const entry of this.cache.values()) {
            if (entry.isExpired()) {
                expiredEntries++;
            } else {
                activeEntries++;
            }
        }

        return {
            totalEntries: this.cache.size,
            activeEntries,
            expiredEntries,
            pendingRequests: this.pendingRequests.size,
        };
    }
}

// Singleton instance
export const dataCache = new DataCache();

// Cache keys constants for consistency
export const CACHE_KEYS = {
    PRODUCTS_ALL: 'products:all',
    PRODUCTS_ACTIVE: 'products:active',
    PRODUCT_BY_ID: (id) => `product:${id}`,
    ORDERS_ALL: 'orders:all',
    CUSTOMERS_ALL: 'customers:all',
};

// Cache TTL constants (in milliseconds)
export const CACHE_TTL = {
    SHORT: 30 * 1000,        // 30 seconds
    MEDIUM: 5 * 60 * 1000,   // 5 minutes
    LONG: 30 * 60 * 1000,    // 30 minutes
    HOUR: 60 * 60 * 1000,    // 1 hour
};
