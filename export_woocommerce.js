import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateWooCommerceCsv } from './src/lib/woocommerceExporter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read .env
const envPath = path.resolve(__dirname, '.env');
const env = {};
if (fs.existsSync(envPath)) {
    const dotenv = fs.readFileSync(envPath, 'utf8');
    dotenv.split('\n').forEach(line => {
        const [k, ...v] = line.split('=');
        if (k && v) env[k.trim()] = v.join('=').trim();
    });
}

const supabaseUrl = env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Error: Supabase environment variables not found in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function exportProducts() {
    console.log('Fetching products from Choshmazone database...');
    const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Failed to fetch products:', error.message);
        process.exit(1);
    }

    console.log(`Fetched ${products.length} products. Generating WooCommerce CSV...`);

    const { csvContent, totalRows, productCount } = generateWooCommerceCsv(products, {
        mode: 'variable',
        includeInactive: true
    });

    const dateStr = new Date().toISOString().split('T')[0];
    const outputPath = path.resolve(__dirname, `choshmazone_woocommerce_export_${dateStr}.csv`);

    // Write with UTF-8 BOM
    fs.writeFileSync(outputPath, '\uFEFF' + csvContent, 'utf8');

    console.log(`✅ Success! Created WooCommerce CSV file with ${totalRows} rows (${productCount} products).`);
    console.log(`Saved to: ${outputPath}`);
}

exportProducts();
