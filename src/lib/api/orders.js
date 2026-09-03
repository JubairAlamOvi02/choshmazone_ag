
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

            let styleStr = item.style || '';
            if (item.variant) {
                const parts = [];
                if (item.variant.color) parts.push(item.variant.color);
                if (item.variant.size) parts.push(item.variant.size);
                if (parts.length > 0) {
                    styleStr = parts.join(', ');
                }
            }

            if (item.lensOption && item.lensOption.id !== 'frame_only') {
                let lensDetail = `Lens: ${item.lensOption.name}`;
                if (item.lensOption.isPrescription) {
                    if (item.lensOption.method === 'upload') {
                        const urlInfo = item.uploadedPrescriptionUrl ? ` [URL: ${item.uploadedPrescriptionUrl}]` : '';
                        lensDetail += ` (Prescription Slip Attached${urlInfo})`;
                    } else if (item.lensOption.method === 'manual' && item.lensOption.manualPower) {
                        const p = item.lensOption.manualPower;
                        lensDetail += ` [Rx: R(Sph:${p.odSph || '0'}, Cyl:${p.odCyl || '0'}, Ax:${p.odAxis || '-'}, Add:${p.odAdd || '-'}) L(Sph:${p.osSph || '0'}, Cyl:${p.osCyl || '0'}, Ax:${p.osAxis || '-'}, Add:${p.osAdd || '-'}) PD:${p.pd || '62'}]`;
                    } else if (item.lensOption.method === 'whatsapp') {
                        lensDetail += ' (WhatsApp Follow-up)';
                    }
                }
                if (item.lensOption.notes) {
                    lensDetail += ` (Note: ${item.lensOption.notes})`;
                }
                styleStr = styleStr ? `${styleStr} | ${lensDetail}` : lensDetail;
            }

            return {
                order_id: order.id,
                product_id: isUUID ? item.id : null,
                quantity: item.quantity,
                unit_price: item.price,
                style: styleStr || 'Default'
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
                    products (name, image_url, variants)
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
                    products (name, image_url, variants)
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
    },

    // Delete order (Admin)
    delete: async (id) => {
        const { error } = await supabase
            .from('orders')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    }
};
