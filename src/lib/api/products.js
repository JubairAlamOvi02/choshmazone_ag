import { supabase } from '../supabaseClient';
import { cacheManager } from '../cache';

export const productParams = {
    // Fetch all products with caching
    fetchAll: async (activeOnly = false) => {
        const cacheKey = `products_${activeOnly ? 'active' : 'all'}`;
        const cachedData = cacheManager.get(cacheKey);

        if (cachedData) {
            // Optional: You could trigger a background refresh here (stale-while-revalidate)
            // For now, we return cached data immediately for speed.
            return cachedData;
        }

        let query = supabase
            .from('products')
            .select('*');

        if (activeOnly) {
            query = query.eq('is_active', true);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;

        // Cache for 5 minutes
        cacheManager.set(cacheKey, data, 1000 * 60 * 5);
        return data;
    },

    // Fetch single product by ID
    fetchById: async (id) => {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    // Create new product (Admin only via RLS)
    create: async (productData) => {
        const { data, error } = await supabase
            .from('products')
            .insert([productData])
            .select()
            .single();

        if (error) throw error;

        // Invalidate all product listings caches
        cacheManager.invalidatePattern('products_');
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

        // Invalidate all product listings caches
        cacheManager.invalidatePattern('products_');
        return data;
    },

    // Delete product (Admin only via RLS)
    delete: async (id) => {
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);

        if (error) throw error;

        // Invalidate all product listings caches
        cacheManager.invalidatePattern('products_');
        return true;
    },

    // Upload image to Storage
    uploadImage: async (file) => {
        const randomStr = Math.random().toString(36).substring(2, 8);
        const fileName = `${Date.now()}-${randomStr}-${file.name}`;
        const { error } = await supabase.storage
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
    }
};
