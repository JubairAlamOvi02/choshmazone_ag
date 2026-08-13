import { supabase } from '../supabaseClient';

export const categoryParams = {
    fetchAll: async () => {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('name');
            
        if (error) throw error;
        return data || [];
    },

    create: async (categoryData) => {
        const { data, error } = await supabase
            .from('categories')
            .insert([categoryData])
            .select()
            .single();
            
        if (error) throw error;
        return data;
    },

    delete: async (id) => {
        const { error } = await supabase
            .from('categories')
            .delete()
            .eq('id', id);
            
        if (error) throw error;
        return true;
    }
};
