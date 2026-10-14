import { supabase } from '../supabaseClient';
import { cacheManager } from '../cache';
import { compressImage } from '../imageCompressor';

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

    // Fetch products by category
    fetchByCategory: async (category, excludeId = null) => {
        let query = supabase
            .from('products')
            .select('*')
            .eq('category', category)
            .eq('is_active', true);

        if (excludeId) {
            query = query.neq('id', excludeId);
        }

        const { data, error } = await query
            .order('created_at', { ascending: false })
            .limit(4);

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
        console.log(`Attempting to delete product with ID: ${id}`);
        const { error, count } = await supabase
            .from('products')
            .delete({ count: 'exact' })
            .eq('id', id);

        if (error) {
            console.error('Supabase Delete Error:', error);
            throw error;
        }

        if (count === 0) {
            console.warn(`Delete operation returned count 0 for ID: ${id}. Ensure the product exists and you have permission.`);
            // You might want to throw an error here if strict validation is needed
            // throw new Error('Product not found or permission denied.'); 
        }

        // Invalidate all product listings caches
        cacheManager.invalidatePattern('products_');
        return true;
    },

    // Upload image to Storage (auto-compressed to WebP under ~100 KB)
    uploadImage: async (file) => {
        const compressedFile = await compressImage(file, {
            maxWidth: 1200,
            maxHeight: 1200,
            maxSizeBytes: 100 * 1024
        });
        const randomStr = Math.random().toString(36).substring(2, 8);
        const fileName = `${Date.now()}-${randomStr}-${compressedFile.name}`;
        const { error } = await supabase.storage
            .from('products')
            .upload(fileName, compressedFile, {
                contentType: compressedFile.type || 'image/webp',
                cacheControl: '31536000, public',
                upsert: false
            });

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

    // Fetch site-wide recently viewed products with fallback to latest products
    fetchRecentlyViewed: async (limit = 4, excludeId = null) => {
        const cacheKey = `global_recently_viewed_${limit}_${excludeId || 'none'}`;
        const cached = cacheManager.get(cacheKey);
        if (cached) return cached;

        try {
            // 1. Fetch recent view events from web_events
            const { data: eventLogs, error } = await supabase
                .from('web_events')
                .select('metadata, created_at')
                .eq('event_type', 'view_product')
                .order('created_at', { ascending: false })
                .limit(35);

            const recentProductIds = [];
            const seen = new Set();
            if (excludeId) seen.add(String(excludeId));

            if (!error && Array.isArray(eventLogs)) {
                for (const log of eventLogs) {
                    const pid = log.metadata?.product_id;
                    if (pid && !seen.has(String(pid))) {
                        seen.add(String(pid));
                        recentProductIds.push(pid);
                    }
                    if (recentProductIds.length >= limit) break;
                }
            }

            // 2. Fetch all active products
            const allProducts = await productParams.fetchAll(true);
            if (!allProducts || allProducts.length === 0) return [];

            const productsMap = new Map();
            allProducts.forEach(p => productsMap.set(String(p.id), p));

            // 3. Resolve products in order of recently viewed
            const resolved = [];
            for (const pid of recentProductIds) {
                const prod = productsMap.get(String(pid));
                if (prod && prod.is_active !== false) {
                    resolved.push({
                        ...prod,
                        title: prod.name || prod.title,
                        image: prod.image_url || prod.image,
                        images: prod.images || (prod.image_url ? [prod.image_url] : [])
                    });
                }
            }

            // 4. If fewer than limit, fill with latest active inventory products
            if (resolved.length < limit) {
                for (const p of allProducts) {
                    if (String(p.id) !== String(excludeId) && !resolved.some(r => String(r.id) === String(p.id))) {
                        resolved.push({
                            ...p,
                            title: p.name || p.title,
                            image: p.image_url || p.image,
                            images: p.images || (p.image_url ? [p.image_url] : [])
                        });
                    }
                    if (resolved.length >= limit) break;
                }
            }

            const result = resolved.slice(0, limit);
            // Cache for 2 minutes
            cacheManager.set(cacheKey, result, 1000 * 60 * 2);
            return result;
        } catch (err) {
            console.error('Failed to fetch global recently viewed products:', err);
            try {
                const allProducts = await productParams.fetchAll(true);
                return (allProducts || [])
                    .filter(p => !excludeId || String(p.id) !== String(excludeId))
                    .slice(0, limit)
                    .map(p => ({
                        ...p,
                        title: p.name || p.title,
                        image: p.image_url || p.image,
                        images: p.images || (p.image_url ? [p.image_url] : [])
                    }));
            } catch {
                return [];
            }
        }
    }
};
