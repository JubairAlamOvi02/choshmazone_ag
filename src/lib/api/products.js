
import { supabase } from '../supabaseClient';
import { dataCache, CACHE_KEYS, CACHE_TTL } from '../cache';

export const productParams = {
    // Fetch all products (with caching)
    fetchAll: async (activeOnly = false, forceRefresh = false) => {
        const cacheKey = activeOnly ? CACHE_KEYS.PRODUCTS_ACTIVE : CACHE_KEYS.PRODUCTS_ALL;

        return dataCache.fetchWithCache(
            cacheKey,
            async () => {
                let query = supabase
                    .from('products')
                    .select('*');

                if (activeOnly) {
                    query = query.eq('is_active', true);
                }

                const { data, error } = await query.order('created_at', { ascending: false });

                if (error) throw error;
                return data;
            },
            {
                ttl: CACHE_TTL.MEDIUM, // 5 minutes
                staleTime: CACHE_TTL.SHORT, // 30 seconds
                forceRefresh,
            }
        );
    },

    // Fetch single product by ID (with caching)
    fetchById: async (id, forceRefresh = false) => {
        const cacheKey = CACHE_KEYS.PRODUCT_BY_ID(id);

        return dataCache.fetchWithCache(
            cacheKey,
            async () => {
                const { data, error } = await supabase
                    .from('products')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (error) throw error;
                return data;
            },
            {
                ttl: CACHE_TTL.MEDIUM,
                staleTime: CACHE_TTL.SHORT,
                forceRefresh,
            }
        );
    },

    // Create new product (Admin only via RLS)
    create: async (productData) => {
        const { data, error } = await supabase
            .from('products')
            .insert([productData])
            .select()
            .single();

        if (error) throw error;

        // Invalidate products cache after creation
        dataCache.invalidatePattern('products:');

        return data;
    },

    // Update product (Admin only via RLS)
    update: async (id, updates) => {
        const { data, error } = await supabase
            .from('products')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // Invalidate caches after update
        dataCache.invalidate(CACHE_KEYS.PRODUCT_BY_ID(id));
        dataCache.invalidatePattern('products:');

        return data;
    },

    // Delete product (Admin only via RLS)
    delete: async (id) => {
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);

        if (error) throw error;

        // Invalidate caches after deletion
        dataCache.invalidate(CACHE_KEYS.PRODUCT_BY_ID(id));
        dataCache.invalidatePattern('products:');

        return true;
    },

    // Upload image to Storage
    uploadImage: async (file) => {
        const randomStr = Math.random().toString(36).substring(2, 8);
        const fileName = `${Date.now()}-${randomStr}-${file.name}`;
        const { data, error } = await supabase.storage
            .from('products')
            .upload(fileName, file);

        if (error) throw error;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('products')
            .getPublicUrl(fileName);

        return publicUrl;
    },

    // Upload multiple images to Storage
    uploadImages: async (files) => {
        const uploadPromises = files.map(file => productParams.uploadImage(file));
        return Promise.all(uploadPromises);
    },

    // Force refresh products cache
    refreshCache: () => {
        dataCache.invalidatePattern('products:');
    }
};
