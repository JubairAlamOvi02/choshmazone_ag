import { supabase } from '../supabaseClient';

export const reviewParams = {
    // Fetch reviews for a specific product
    fetchByProduct: async (productId) => {
        const { data, error } = await supabase
            .from('reviews')
            .select(`
                *,
                profiles (
                    full_name
                )
            `)
            .eq('product_id', productId)
            .order('created_at', { ascending: false });

        if (error) {
            // If table doesn't exist yet, return empty array instead of crashing
            if (error.code === '42P01') return [];
            throw error;
        }
        return data;
    },

    // Submit a new review
    create: async (reviewData) => {
        const { data, error } = await supabase
            .from('reviews')
            .insert([reviewData])
            .select()
            .single();

        if (error) throw error;
        return data;
    }
};
