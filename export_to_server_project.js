import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateServerJson, generateServerCsv } from './src/lib/serverProductExporter.js';

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
    console.error('❌ Error: Supabase credentials not found in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function exportProducts() {
    console.log('🔄 Fetching products from Choshmazone database (Supabase)...');
    
    const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('❌ Failed to fetch products:', error.message);
        process.exit(1);
    }

    console.log(`📦 Successfully retrieved ${products.length} products.`);

    // Generate JSON and CSV
    const { jsonString, totalProducts } = generateServerJson(products, { includeInactive: true });
    const { csvContent } = generateServerCsv(products, { includeInactive: true });

    // Target locations:
    const targetDirs = [
        path.resolve('D:/AG_Projects/choshmazone_server'),
        __dirname
    ];

    for (const dir of targetDirs) {
        if (!fs.existsSync(dir)) {
            console.log(`Directory does not exist: ${dir}, creating...`);
            fs.mkdirSync(dir, { recursive: true });
        }

        const jsonFile = path.join(dir, 'products_export.json');
        const csvFile = path.join(dir, 'products_export.csv');

        fs.writeFileSync(jsonFile, jsonString, 'utf8');
        fs.writeFileSync(csvFile, '\uFEFF' + csvContent, 'utf8'); // UTF-8 BOM

        console.log(`✅ Saved export to: ${jsonFile}`);
        console.log(`✅ Saved export to: ${csvFile}`);
    }

    console.log('\n🎉 Export complete! ' + totalProducts + ' products are ready for choshmazone_server.');
}

exportProducts().catch(err => {
    console.error('❌ Unexpected error:', err);
    process.exit(1);
});
