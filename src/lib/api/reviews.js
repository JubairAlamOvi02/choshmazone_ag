import { supabase } from '../supabaseClient';

export const reviewParams = {
    // Fetch reviews for a specific product
    fetchByProduct: async (productId) => {
        try {
            // NOTE: We do NOT use .select('*, profiles(*)') here because it causes a 400 error 
            // in the browser console if the relationship is not explicitly defined in Supabase.
            // Instead, we fetch reviews and profiles separately and merge them.

            const { data: reviews, error: reviewsError } = await supabase
                .from('reviews')
                .select('*')
                .eq('product_id', productId)
                .order('created_at', { ascending: false });

            if (reviewsError) {
                if (reviewsError.code === '42P01') return []; // Table doesn't exist
                throw reviewsError;
            }

            if (!reviews || reviews.length === 0) return [];

            // Get unique user IDs to fetch names
            const userIds = [...new Set(reviews.map(r => r.user_id).filter(Boolean))];

            if (userIds.length > 0) {
                // Fetch profiles for these users to get names
                const { data: profiles } = await supabase
                    .from('profiles')
                    .select('id, full_name')
                    .in('id', userIds);

                if (profiles) {
                    const profileMap = profiles.reduce((acc, p) => {
                        acc[p.id] = p;
                        return acc;
                    }, {});

                    // Merge profiles into reviews
                    return reviews.map(r => ({
                        ...r,
                        profiles: profileMap[r.user_id] || { full_name: 'Verified Customer' }
                    }));
                }
            }

            // Fallback for each review if no profiles found
            return reviews.map(r => ({ ...r, profiles: { full_name: 'Verified Customer' } }));

        } catch (err) {
            console.error("Critical error in fetchByProduct:", err);
            return [];
        }
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
