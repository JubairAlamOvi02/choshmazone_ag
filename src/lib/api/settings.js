import { supabase } from '../supabaseClient';

export const settingsParams = {
    fetchAll: async () => {
        const { data, error } = await supabase
            .from('site_settings')
            .select('*');
        if (error) throw error;
        return data;
    },

    get: async (key) => {
        const { data, error } = await supabase
            .from('site_settings')
            .select('value')
            .eq('key', key)
            .single();
        if (error && error.code !== 'PGRST116') throw error; // PGRST116 is code for 'no rows returned'
        return data?.value;
    },

    set: async (key, value) => {
        const { data, error } = await supabase
            .from('site_settings')
            .upsert({ key, value, updated_at: new Date() })
            .select();
        if (error) throw error;
        return data;
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
