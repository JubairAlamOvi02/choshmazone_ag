const CACHE_PREFIX = 'choshma_cache_';
const DEFAULT_TTL = 1000 * 60 * 5; // 5 minutes

export const cacheManager = {
    set: (key, data, ttl = DEFAULT_TTL) => {
        try {
            const item = {
                data,
                expiry: Date.now() + ttl,
                version: '1.0'
            };
            localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(item));
        } catch (e) {
            console.warn('Cache write failed', e);
        }
    },

    get: (key) => {
        try {
            const itemStr = localStorage.getItem(CACHE_PREFIX + key);
            if (!itemStr) return null;

            const item = JSON.parse(itemStr);
            if (Date.now() > item.expiry) {
                localStorage.removeItem(CACHE_PREFIX + key);
                return null;
            }
            return item.data;
        } catch {
            return null;
        }
    },

    invalidate: (key) => {
        localStorage.removeItem(CACHE_PREFIX + key);
    },

    // Pattern matching invalidate (e.g. invalidate('products_'))
    invalidatePattern: (pattern) => {
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith(CACHE_PREFIX + pattern)) {
                localStorage.removeItem(key);
            }
        });
    },

    clear: () => {
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith(CACHE_PREFIX)) {
                localStorage.removeItem(key);
            }
        });
    }
};
