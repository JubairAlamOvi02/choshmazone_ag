
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read .env file manually
const envPath = path.resolve(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        env[key.trim()] = value.trim();
    }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testDeleteConstraint() {
    console.log('Testing delete constraint...');

    // 1. Create dummy product
    const { data: product, error: createError } = await supabase
        .from('products')
        .insert([{
            name: 'Constraint Test Product',
            price: 50,
            stock_quantity: 100,
            category: 'Test'
        }])
        .select()
        .single();

    if (createError) {
        console.error('Failed to create product:', createError);
        return;
    }
    console.log('Created product:', product.id);

    // 2. Create dummy order
    // We need a user ID. We'll try to find a profile or use a dummy UUID if RLS allows (it might not).
    // Actually, RLS requires authenticated user for insert orders.
    // So this script might fail at this step if run as anon.
    // But let's try. If it fails, we know we can't easily reproduce strictly from anon script without logging in.

    // Try to sign in? No, we don't have credentials.
    // We can try to rely on the fact that we might have an existing user in local storage? No, this is node.

    // Let's trying deleting a KNOWN product that has orders if step 2 fails.
    // Or just try to delete the product we just created. It should work because no orders.

    const { error: deleteError } = await supabase
        .from('products')
        .delete({ count: 'exact' })
        .eq('id', product.id);

    if (deleteError) {
        console.error('Delete failed (unexpected):', deleteError);
    } else {
        console.log('Delete successful (expected for product with no orders).');
    }

    // Since we can't easily create an order as anon, we will skip that part.
    // Use the user's reported error to guide us.
}

testDeleteConstraint();
