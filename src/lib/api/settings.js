import { supabase } from '../supabaseClient';

const CACHE_STORAGE_KEY = 'cz_site_settings_cache';

let settingsCache = null;
try {
    const stored = localStorage.getItem(CACHE_STORAGE_KEY);
    if (stored) {
        settingsCache = JSON.parse(stored);
    }
} catch {
    settingsCache = null;
}

const updateLocalStorage = (data) => {
    try {
        if (data) {
            localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(data));
        }
    } catch {
        // ignore storage errors
    }
};

export const DEFAULT_CHECKOUT_FIELD_SETTINGS = {
    name: {
        id: 'name',
        label: 'Full Name',
        placeholder: 'Enter your full name',
        required: true,
        enabled: true,
        section: 'shipping'
    },
    phone: {
        id: 'phone',
        label: 'Phone Number',
        placeholder: '01XXXXXXXXX (11 digits)',
        required: true,
        enabled: true,
        section: 'contact'
    },
    email: {
        id: 'email',
        label: 'Email Address',
        placeholder: '(Required for order tracking)',
        required: false,
        enabled: true,
        section: 'contact'
    },
    address: {
        id: 'address',
        label: 'Street Address',
        placeholder: 'House, road, flat, area...',
        required: true,
        enabled: true,
        section: 'shipping'
    },
    district: {
        id: 'district',
        label: 'District',
        placeholder: 'Select District',
        required: true,
        enabled: true,
        section: 'shipping'
    },
    thana: {
        id: 'thana',
        label: 'Thana / Upazila',
        placeholder: 'Select Thana',
        required: false,
        enabled: true,
        section: 'shipping'
    },
    city: {
        id: 'city',
        label: 'City',
        placeholder: 'Enter city',
        required: false,
        enabled: true,
        section: 'shipping'
    },
    zip: {
        id: 'zip',
        label: 'Zip / Postal Code',
        placeholder: 'Enter postal code',
        required: false,
        enabled: true,
        section: 'shipping'
    },
    notes: {
        id: 'notes',
        label: 'Order Notes / Instructions',
        placeholder: 'Notes about your order (e.g. special delivery instructions)',
        required: false,
        enabled: true,
        section: 'additional'
    }
};

export const settingsParams = {
    getCachedAll: () => settingsCache || [],

    getCached: (key) => {
        if (!settingsCache) return null;
        const found = settingsCache.find(s => s.key === key);
        return found ? found.value : null;
    },

    fetchAll: async (forceRefresh = false) => {
        if (settingsCache && !forceRefresh) return settingsCache;

        const { data, error } = await supabase
            .from('site_settings')
            .select('*');
        if (error) {
            if (error.code === '42P01') { // Table missing
                console.warn('[Settings] site_settings table missing. Using fallbacks.');
                return [];
            }
            throw error;
        }

        settingsCache = data;
        updateLocalStorage(data);
        return data;
    },

    get: async (key) => {
        // Try cache first
        if (settingsCache) {
            const cached = settingsCache.find(s => s.key === key);
            if (cached) return cached.value;
        }

        const { data, error } = await supabase
            .from('site_settings')
            .select('value')
            .eq('key', key)
            .maybeSingle();

        if (error) {
            if (error.code === '42P01') return null; // Table missing
            throw error;
        }

        return data?.value;
    },

    set: async (key, value) => {
        const strVal = typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value);
        const { data, error } = await supabase
            .from('site_settings')
            .upsert({ key, value: strVal, updated_at: new Date() })
            .select();

        // Update cache
        if (!error && settingsCache) {
            const index = settingsCache.findIndex(s => s.key === key);
            if (index > -1) {
                settingsCache[index] = { ...settingsCache[index], value: strVal };
            } else {
                settingsCache.push({ key, value: strVal });
            }
            updateLocalStorage(settingsCache);
        }

        if (error) throw error;
        return data;
    },

    getCheckoutFieldSettings: async () => {
        try {
            const raw = await settingsParams.get('checkout_field_settings');
            if (!raw) return DEFAULT_CHECKOUT_FIELD_SETTINGS;
            
            const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
            // Merge with default to guarantee all expected fields exist
            return {
                ...DEFAULT_CHECKOUT_FIELD_SETTINGS,
                ...parsed
            };
        } catch (e) {
            console.warn('[Settings] Failed to parse checkout_field_settings:', e);
            return DEFAULT_CHECKOUT_FIELD_SETTINGS;
        }
    },

    saveCheckoutFieldSettings: async (fieldSettings) => {
        return await settingsParams.set('checkout_field_settings', fieldSettings);
    },

    uploadAsset: async (file, path = 'site-assets') => {
        const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        const filePath = `${path}/${fileName}`;

        const { data, error } = await supabase.storage
            .from('products') // Use the existing 'products' bucket
            .upload(filePath, file);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
            .from('products')
            .getPublicUrl(filePath);

        return publicUrl;
    },

    listAssets: async (path = '') => {
        // List files in the root or specific folder
        const { data, error } = await supabase.storage
            .from('products')
            .list(path, {
                limit: 100,
                offset: 0,
                sortBy: { column: 'created_at', order: 'desc' }
            });

        if (error) throw error;

        // Get public URLs for each file
        const assets = data.map(file => {
            const fullPath = path ? `${path}/${file.name}` : file.name;
            const { data: { publicUrl } } = supabase.storage
                .from('products')
                .getPublicUrl(fullPath);

            return {
                name: file.name,
                url: publicUrl,
                metadata: file.metadata,
                created_at: file.created_at
            };
        });

        // Recursively fetch 'site-assets' folder if in root and it exists
        if (path === '') {
            const { data: siteAssetsData } = await supabase.storage
                .from('products')
                .list('site-assets');

            if (siteAssetsData) {
                const siteAssets = siteAssetsData.map(file => {
                    const { data: { publicUrl } } = supabase.storage
                        .from('products')
                        .getPublicUrl(`site-assets/${file.name}`);
                    return {
                        name: file.name,
                        url: publicUrl,
                        created_at: file.created_at
                    };
                });
                return [...assets, ...siteAssets].filter(a => !a.name.startsWith('.'));
            }
        }

        return assets.filter(a => !a.name.startsWith('.'));
    }
};
