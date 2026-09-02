import { supabase } from '../supabaseClient';
import { settingsParams } from './settings';

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

    update: async (id, updateData) => {
        const { data, error } = await supabase
            .from('categories')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.warn('[Categories] Table update warning:', error.message);
        }
        return data;
    },

    delete: async (id) => {
        const { error } = await supabase
            .from('categories')
            .delete()
            .eq('id', id);
            
        if (error) throw error;
        return true;
    },

    uploadImage: async (file) => {
        return await settingsParams.uploadAsset(file, 'categories');
    }
};

