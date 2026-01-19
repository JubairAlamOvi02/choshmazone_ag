
import { supabase } from '../supabaseClient';

export const productParams = {
    // Fetch all products
    fetchAll: async (activeOnly = false) => {
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
        return data;
    },

    // Delete product (Admin only via RLS)
    delete: async (id) => {
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);

        if (error) throw error;
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
    }
};
