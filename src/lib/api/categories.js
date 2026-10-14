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

    fetchActive: async () => {
        const categories = await categoryParams.fetchAll();
        return categories.filter(c => c.is_active !== false);
    },

    create: async (categoryData) => {
        const payload = {
            ...categoryData,
            is_active: categoryData.is_active !== undefined ? categoryData.is_active : true
        };
        const { data, error } = await supabase
            .from('categories')
            .insert([payload])
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
            throw error;
        }
        return data;
    },

    toggleActive: async (id, currentStatus) => {
        const newStatus = currentStatus === false ? true : false;
        return await categoryParams.update(id, { is_active: newStatus });
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

