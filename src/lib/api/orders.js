
import { supabase } from '../supabaseClient';

export const orderParams = {
    // Create a new order with its items
    create: async (orderData, items) => {
        // 1. Insert into 'orders' table
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert([orderData])
            .select()
            .single();

        if (orderError) throw orderError;

        // 2. Insert items into 'order_items' table
        const orderItems = items.map(item => {
            // Check if item.id is a valid UUID to avoid database errors with legacy mock data (IDs like 1, 2, 3)
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.id);

            return {
                order_id: order.id,
                product_id: isUUID ? item.id : null,
                quantity: item.quantity,
                unit_price: item.price
            };
        });

        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItems);

        if (itemsError) throw itemsError;

        return order;
    },

    // Fetch all orders (Admin)
    fetchAll: async () => {
        const { data, error } = await supabase
            .from('orders')
            .select(`
                *,
                profiles (full_name, role),
                order_items (
                    *,
                    products (name, image_url)
                )
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    // Fetch order by ID
    fetchById: async (id) => {
        const { data, error } = await supabase
            .from('orders')
            .select(`
                *,
                profiles (full_name, role),
                order_items (
                    *,
                    products (name, image_url)
                )
            `)
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    // Update order status (Admin)
    updateStatus: async (id, status) => {
        const { data, error } = await supabase
            .from('orders')
            .update({ status })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }
};
