import { supabase } from '../supabaseClient';
import { compressImage } from '../imageCompressor';

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

export const DEFAULT_CONTACT_SETTINGS = {
    contact_title: 'Get in Touch',
    contact_description: 'Have questions about our premium eyewear or your recent order? Our dedicated support team is here to assist you.',
    contact_showroom_title: 'Visit Our Showroom',
    contact_showroom_address: '123 Vision Street, Suite 456\nDhaka, Bangladesh',
    contact_email_title: 'Email Support',
    contact_email: 'support@choshmazone.com',
    contact_phone_title: 'Call Our Hotline',
    contact_phone: '+880 1234 567890'
};

export const DEFAULT_CHOSHMAZONE_SECTION = {
    badge: 'choshmazone.com',
    title: 'The Details Define Your Vision',
    description: 'From your first boardroom pitch to unforgettable weekend celebrations, Choshma Zone equips you with the finishing touches that turn dressed into distinguished.',
    enabled: true,
    items: [
        {
            id: 'col-1',
            type: 'image',
            url: 'https://images.unsplash.com/photo-1591076482161-42ce6da69f67?auto=format&fit=crop&w=800&q=80',
            title: 'Precision Craft',
            caption: 'Handcrafted luxury frames',
            product_id: '',
            custom_link: ''
        },
        {
            id: 'col-2',
            type: 'image',
            url: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=800&q=80',
            title: 'Signature Silhouette',
            caption: 'Titanium & acetate',
            product_id: '',
            custom_link: ''
        },
        {
            id: 'col-3-top',
            type: 'image',
            url: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=800&q=80',
            title: 'Refined Optics',
            caption: 'Ultra-clear Blue Cut lenses',
            product_id: '',
            custom_link: ''
        },
        {
            id: 'col-3-bottom',
            type: 'image',
            url: 'https://images.unsplash.com/photo-1508296695146-257a814070b4?auto=format&fit=crop&w=800&q=80',
            title: 'Tailored Fit',
            caption: 'Ergonomic comfort',
            product_id: '',
            custom_link: ''
        },
        {
            id: 'col-4',
            type: 'image',
            url: 'https://images.unsplash.com/photo-1577803645773-f96470509666?auto=format&fit=crop&w=800&q=80',
            title: 'Timeless Aesthetic',
            caption: 'Architectural lines',
            product_id: '',
            custom_link: ''
        },
        {
            id: 'col-5',
            type: 'image',
            url: 'https://images.unsplash.com/photo-1509695507497-903c140c43b0?auto=format&fit=crop&w=800&q=80',
            title: 'Distinguished Expression',
            caption: 'Elevated every day',
            product_id: '',
            custom_link: ''
        }
    ]
};

export const DEFAULT_SHOWCASE_SECTIONS = [
    {
        id: 'sec-best-rimless',
        title: 'Best Rimless Collections',
        subtitle: '',
        enabled: true,
        currency: 'Tk',
        columns: 4,
        show_badge: true,
        show_title: false,
        show_quick_actions: true,
        order: 1,
        items: [
            {
                id: 'rimless-1',
                product_id: '',
                title: 'Cartier Rimless Powerless UV400 Sunglasses',
                image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=800&q=80',
                price: 1190,
                original_price: 1750,
                badge: 'Sale',
                show_badge: true,
                custom_link: '/shop'
            },
            {
                id: 'rimless-2',
                product_id: '',
                title: 'Powerless PhotoSun Lens Wood Temple Rimless',
                image: 'https://images.unsplash.com/photo-1591076482161-42ce6da69f67?auto=format&fit=crop&w=800&q=80',
                price: 1299,
                original_price: 1950,
                badge: 'Sale',
                show_badge: true,
                custom_link: '/shop'
            },
            {
                id: 'rimless-3',
                product_id: '',
                title: 'Powerless PhotoSun Lens Gradient Rimless Gold',
                image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=800&q=80',
                price: 1090,
                original_price: 1379,
                badge: 'Sale',
                show_badge: true,
                custom_link: '/shop'
            },
            {
                id: 'rimless-4',
                product_id: '',
                title: 'Powerless PhotoSun Lens Beveled Edge Cut',
                image: 'https://images.unsplash.com/photo-1508296695146-257a814070b4?auto=format&fit=crop&w=800&q=80',
                price: 1150,
                original_price: 1860,
                badge: 'Sale',
                show_badge: true,
                custom_link: '/shop'
            },
            {
                id: 'rimless-5',
                product_id: '',
                title: 'Silver Temple PhotoSun Clear Lens Rimless',
                image: 'https://images.unsplash.com/photo-1577803645773-f96470509666?auto=format&fit=crop&w=800&q=80',
                price: 1190,
                original_price: 1690,
                badge: 'Sale',
                show_badge: true,
                custom_link: '/shop'
            },
            {
                id: 'rimless-6',
                product_id: '',
                title: 'Gold Double Bridge Black Tint Rimless',
                image: 'https://images.unsplash.com/photo-1509695507497-903c140c43b0?auto=format&fit=crop&w=800&q=80',
                price: 1390,
                original_price: 2100,
                badge: 'Sale',
                show_badge: true,
                custom_link: '/shop'
            },
            {
                id: 'rimless-7',
                product_id: '',
                title: 'Luxury Gold Sculpted Dragon Temple Rimless',
                image: 'https://images.unsplash.com/photo-1582142306909-195724d33ffc?auto=format&fit=crop&w=800&q=80',
                price: 1450,
                original_price: 2200,
                badge: 'Sale',
                show_badge: true,
                custom_link: '/shop'
            },
            {
                id: 'rimless-8',
                product_id: '',
                title: 'Champagne Gradient Diamond Cut Rimless Glass',
                image: 'https://images.unsplash.com/photo-1508296695146-257a814070b4?auto=format&fit=crop&w=800&q=80',
                price: 1250,
                original_price: 1890,
                badge: 'Sale',
                show_badge: true,
                custom_link: '/shop'
            }
        ]
    },
    {
        id: 'sec-best-frames',
        title: 'Best Frame Collections',
        subtitle: '',
        enabled: true,
        currency: 'Tk',
        columns: 4,
        show_badge: true,
        show_title: false,
        show_quick_actions: true,
        order: 2,
        items: [
            {
                id: 'frame-1',
                product_id: '',
                title: 'Classic Clubmaster Acetate & Metal Frame',
                image: 'https://images.unsplash.com/photo-1591076482161-42ce6da69f67?auto=format&fit=crop&w=800&q=80',
                price: 1490,
                original_price: 2100,
                badge: 'Sale',
                show_badge: true,
                custom_link: '/shop'
            },
            {
                id: 'frame-2',
                product_id: '',
                title: 'Minimalist Matte Black Square Frame',
                image: 'https://images.unsplash.com/photo-1508296695146-257a814070b4?auto=format&fit=crop&w=800&q=80',
                price: 1290,
                original_price: 1850,
                badge: 'Sale',
                show_badge: true,
                custom_link: '/shop'
            },
            {
                id: 'frame-3',
                product_id: '',
                title: 'Aviation Pilot Titanium Frame',
                image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=800&q=80',
                price: 1650,
                original_price: 2400,
                badge: 'Sale',
                show_badge: true,
                custom_link: '/shop'
            },
            {
                id: 'frame-4',
                product_id: '',
                title: 'Retro Round Vintage Wire Frame',
                image: 'https://images.unsplash.com/photo-1577803645773-f96470509666?auto=format&fit=crop&w=800&q=80',
                price: 1190,
                original_price: 1750,
                badge: 'Sale',
                show_badge: true,
                custom_link: '/shop'
            }
        ]
    }
];

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

    getContactSettings: async () => {
        try {
            await settingsParams.fetchAll();
            return {
                contact_title: settingsParams.getCached('contact_title') || DEFAULT_CONTACT_SETTINGS.contact_title,
                contact_description: settingsParams.getCached('contact_description') || DEFAULT_CONTACT_SETTINGS.contact_description,
                contact_showroom_title: settingsParams.getCached('contact_showroom_title') || DEFAULT_CONTACT_SETTINGS.contact_showroom_title,
                contact_showroom_address: settingsParams.getCached('contact_showroom_address') || DEFAULT_CONTACT_SETTINGS.contact_showroom_address,
                contact_email_title: settingsParams.getCached('contact_email_title') || DEFAULT_CONTACT_SETTINGS.contact_email_title,
                contact_email: settingsParams.getCached('contact_email') || DEFAULT_CONTACT_SETTINGS.contact_email,
                contact_phone_title: settingsParams.getCached('contact_phone_title') || DEFAULT_CONTACT_SETTINGS.contact_phone_title,
                contact_phone: settingsParams.getCached('contact_phone') || DEFAULT_CONTACT_SETTINGS.contact_phone
            };
        } catch (e) {
            console.warn('[Settings] Failed to fetch contact settings:', e);
            return DEFAULT_CONTACT_SETTINGS;
        }
    },

    saveContactSettings: async (contactSettings) => {
        const promises = Object.entries(contactSettings).map(([key, val]) =>
            settingsParams.set(key, val)
        );
        return await Promise.all(promises);
    },

    getChoshmazoneSection: async () => {
        try {
            const raw = await settingsParams.get('choshmazone_section');
            if (!raw) return DEFAULT_CHOSHMAZONE_SECTION;
            const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
            const rawItems = Array.isArray(parsed.items) && parsed.items.length > 0 ? parsed.items : DEFAULT_CHOSHMAZONE_SECTION.items;
            const items = rawItems.map(savedItem => {
                const def = DEFAULT_CHOSHMAZONE_SECTION.items.find(d => d.id === savedItem.id) || {};
                return {
                    product_id: '',
                    custom_link: '',
                    ...def,
                    ...savedItem
                };
            });

            return {
                ...DEFAULT_CHOSHMAZONE_SECTION,
                ...parsed,
                items
            };
        } catch (e) {
            console.warn('[Settings] Failed to fetch choshmazone_section:', e);
            return DEFAULT_CHOSHMAZONE_SECTION;
        }
    },

    saveChoshmazoneSection: async (sectionData) => {
        return await settingsParams.set('choshmazone_section', sectionData);
    },

    getShowcaseSections: async () => {
        try {
            const raw = await settingsParams.get('product_showcase_sections');
            if (!raw) return DEFAULT_SHOWCASE_SECTIONS;
            const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
            if (Array.isArray(parsed) && parsed.length > 0) {
                // Ensure proper fallbacks and IDs for every item
                return parsed.map((sec, secIdx) => ({
                    id: sec.id || `sec-${secIdx + 1}`,
                    title: sec.title || 'Featured Collection',
                    subtitle: sec.subtitle || '',
                    enabled: sec.enabled !== false,
                    currency: sec.currency || 'Tk',
                    columns: Number(sec.columns) || 4,
                    show_badge: sec.show_badge !== false,
                    show_title: !!sec.show_title,
                    show_quick_actions: sec.show_quick_actions !== false,
                    order: Number(sec.order) || (secIdx + 1),
                    items: Array.isArray(sec.items) ? sec.items : []
                }));
            }
            return DEFAULT_SHOWCASE_SECTIONS;
        } catch (e) {
            console.warn('[Settings] Failed to fetch product_showcase_sections:', e);
            return DEFAULT_SHOWCASE_SECTIONS;
        }
    },

    saveShowcaseSections: async (sections) => {
        return await settingsParams.set('product_showcase_sections', sections);
    },

    uploadAsset: async (file, path = 'site-assets') => {
        let uploadFile = file;
        const isVideo = file.type && (file.type.startsWith('video/') || /\.(mp4|webm|mov|ogg)$/i.test(file.name));

        if (!isVideo && file.type && file.type.startsWith('image/')) {
            try {
                const isBanner = path.includes('banner') || (file.name && file.name.toLowerCase().includes('banner'));
                uploadFile = await compressImage(file, {
                    maxWidth: isBanner ? 1920 : 1200,
                    maxHeight: isBanner ? 1080 : 1200,
                    maxSizeBytes: isBanner ? 150 * 1024 : 100 * 1024
                });
            } catch (err) {
                console.warn('Image compression skipped, using original file:', err);
                uploadFile = file;
            }
        }

        const cleanName = (uploadFile.name || 'media').replace(/[^a-zA-Z0-9.]/g, '_');
        const fileName = `${Date.now()}-${cleanName}`;
        const filePath = `${path}/${fileName}`;

        const contentType = uploadFile.type || (isVideo ? 'video/mp4' : 'image/webp');

        const { data, error } = await supabase.storage
            .from('products') // Use the existing 'products' bucket
            .upload(filePath, uploadFile, {
                contentType,
                cacheControl: '31536000, public',
                upsert: false
            });

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
