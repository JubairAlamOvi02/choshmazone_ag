/**
 * Choshmazone Server Product Exporter & Importer Helper
 * Handles lossless JSON & CSV data generation and parsing for Choshmazone Server (Node.js/PostgreSQL).
 */

// Helper to escape CSV values according to RFC 4180
export function escapeCsvCell(cell) {
    if (cell === null || cell === undefined) return '';
    const str = String(cell);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

// Columns definition for Choshmazone Server
export const SERVER_PRODUCT_COLUMNS = [
    'id',
    'name',
    'description',
    'price',
    'stock_quantity',
    'category',
    'image_url',
    'images',
    'is_active',
    'style',
    'brand',
    'frame_material',
    'lens_material',
    'lens_technology',
    'lens_color',
    'frame_color',
    'color',
    'frame_width',
    'lens_width',
    'bridge_width',
    'temple_length',
    'face_shape',
    'spec_frame',
    'spec_lens',
    'spec_hardware',
    'spec_weight',
    'shipping_info',
    'variants',
    'created_at'
];

/**
 * Normalizes a product object so it cleanly fits the Choshmazone Server schema.
 */
export function normalizeProductForServer(p) {
    let imagesArr = [];
    if (Array.isArray(p.images)) {
        imagesArr = p.images.filter(Boolean);
    } else if (typeof p.images === 'string') {
        try {
            const parsed = JSON.parse(p.images);
            if (Array.isArray(parsed)) imagesArr = parsed;
        } catch {
            imagesArr = p.images.split(',').map(s => s.trim()).filter(Boolean);
        }
    }
    if (p.image_url && !imagesArr.includes(p.image_url)) {
        imagesArr.unshift(p.image_url);
    }

    let variantsArr = [];
    if (Array.isArray(p.variants)) {
        variantsArr = p.variants;
    } else if (typeof p.variants === 'string') {
        try {
            const parsed = JSON.parse(p.variants);
            if (Array.isArray(parsed)) variantsArr = parsed;
        } catch {
            variantsArr = [];
        }
    }

    return {
        id: p.id || null,
        name: p.name || p.title || 'Untitled Product',
        description: p.description || '',
        price: parseFloat(p.price) || 0,
        stock_quantity: parseInt(p.stock_quantity, 10) || 0,
        category: p.category || '',
        image_url: p.image_url || imagesArr[0] || '',
        images: imagesArr,
        is_active: p.is_active !== undefined ? Boolean(p.is_active) : true,
        style: p.style || '',
        brand: p.brand || '',
        frame_material: p.frame_material || '',
        lens_material: p.lens_material || '',
        lens_technology: p.lens_technology || '',
        lens_color: p.lens_color || '',
        frame_color: p.frame_color || '',
        color: p.color || '',
        frame_width: p.frame_width || '',
        lens_width: p.lens_width || '',
        bridge_width: p.bridge_width || '',
        temple_length: p.temple_length || '',
        face_shape: p.face_shape || '',
        spec_frame: p.spec_frame || '',
        spec_lens: p.spec_lens || '',
        spec_hardware: p.spec_hardware || '',
        spec_weight: p.spec_weight || '',
        shipping_info: p.shipping_info || '',
        variants: variantsArr,
        created_at: p.created_at || new Date().toISOString()
    };
}

/**
 * Generate full JSON string for Choshmazone Server
 */
export function generateServerJson(products = [], options = {}) {
    const { includeInactive = true } = options;
    const filtered = products.filter(p => includeInactive || p.is_active);
    const normalized = filtered.map(normalizeProductForServer);

    const exportPayload = {
        exported_at: new Date().toISOString(),
        source: 'Choshmazone Web App',
        target: 'choshmazone_server',
        version: '1.0',
        total_products: normalized.length,
        products: normalized
    };

    return {
        jsonString: JSON.stringify(exportPayload, null, 2),
        totalProducts: normalized.length,
        timestamp: exportPayload.exported_at
    };
}

/**
 * Generate CSV string for Choshmazone Server
 */
export function generateServerCsv(products = [], options = {}) {
    const { includeInactive = true } = options;
    const filtered = products.filter(p => includeInactive || p.is_active);
    const normalized = filtered.map(normalizeProductForServer);

    const headers = [...SERVER_PRODUCT_COLUMNS];
    const rows = [headers.join(',')];

    for (const p of normalized) {
        const row = headers.map(col => {
            let val = p[col];
            if (col === 'images') {
                val = Array.isArray(val) ? JSON.stringify(val) : '[]';
            } else if (col === 'variants') {
                val = Array.isArray(val) ? JSON.stringify(val) : '[]';
            } else if (col === 'is_active') {
                val = val ? 'true' : 'false';
            }
            return escapeCsvCell(val);
        });
        rows.push(row.join(','));
    }

    return {
        csvContent: rows.join('\r\n'),
        totalRows: rows.length,
        productCount: normalized.length
    };
}

/**
 * Download Server JSON in browser
 */
export function downloadServerJson(products = [], options = {}) {
    const { jsonString, totalProducts } = generateServerJson(products, options);
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `choshmazone_server_products_${dateStr}.json`;

    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return { totalProducts, filename };
}

/**
 * Download Server CSV in browser
 */
export function downloadServerCsv(products = [], options = {}) {
    const { csvContent, productCount } = generateServerCsv(products, options);
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `choshmazone_server_products_${dateStr}.csv`;

    // UTF-8 BOM (\uFEFF) ensures proper encoding in Excel
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return { productCount, filename };
}

/**
 * Robust Client-Side CSV Parser (RFC 4180 compliant)
 */
export function parseCsvText(text) {
    const lines = [];
    let curLine = [];
    let curCell = '';
    let inQuotes = false;

    // Strip BOM if present
    const cleanText = text.replace(/^\uFEFF/, '');

    for (let i = 0; i < cleanText.length; i++) {
        const c = cleanText[i];
        const next = cleanText[i + 1];

        if (c === '"') {
            if (inQuotes && next === '"') {
                curCell += '"';
                i++; // Skip escaped quote
            } else {
                inQuotes = !inQuotes;
            }
        } else if (c === ',' && !inQuotes) {
            curLine.push(curCell);
            curCell = '';
        } else if ((c === '\r' || c === '\n') && !inQuotes) {
            if (c === '\r' && next === '\n') {
                i++; // Skip \n in \r\n
            }
            curLine.push(curCell);
            curCell = '';
            if (curLine.length > 0 && curLine.some(cell => cell.trim().length > 0)) {
                lines.push(curLine);
            }
            curLine = [];
        } else {
            curCell += c;
        }
    }

    if (curCell.length > 0 || curLine.length > 0) {
        curLine.push(curCell);
        if (curLine.some(cell => cell.trim().length > 0)) {
            lines.push(curLine);
        }
    }

    if (lines.length < 2) return [];

    const headers = lines[0].map(h => h.trim().toLowerCase());
    const results = [];

    for (let r = 1; r < lines.length; r++) {
        const row = lines[r];
        const obj = {};
        for (let col = 0; col < headers.length; col++) {
            const h = headers[col];
            obj[h] = row[col] !== undefined ? row[col] : '';
        }
        results.push(obj);
    }

    return results;
}

/**
 * Universal file parser for uploaded JSON or CSV
 */
export function parseUploadedProductFile(content, fileName = '') {
    const isJson = fileName.toLowerCase().endsWith('.json') || content.trim().startsWith('{') || content.trim().startsWith('[');

    if (isJson) {
        const parsed = JSON.parse(content);
        let products = [];
        if (Array.isArray(parsed)) {
            products = parsed;
        } else if (parsed && Array.isArray(parsed.products)) {
            products = parsed.products;
        } else {
            throw new Error('Invalid JSON structure. Expected an array of products or an object with a "products" array.');
        }
        return products.map(normalizeProductForServer);
    } else {
        const rows = parseCsvText(content);
        if (rows.length === 0) {
            throw new Error('CSV file appears to be empty or has no data rows.');
        }
        return rows.map(row => {
            // Map common aliases
            const name = row.name || row.title || row['product name'] || '';
            const price = parseFloat(row.price || row['regular price'] || 0) || 0;
            const stock_quantity = parseInt(row.stock_quantity || row.stock || 0, 10) || 0;

            let images = [];
            if (row.images) {
                try {
                    images = JSON.parse(row.images);
                } catch {
                    images = String(row.images).split(/[,|;]/).map(s => s.trim()).filter(Boolean);
                }
            }

            let variants = [];
            if (row.variants) {
                try {
                    variants = JSON.parse(row.variants);
                } catch {
                    variants = [];
                }
            }

            return normalizeProductForServer({
                ...row,
                name,
                price,
                stock_quantity,
                images,
                variants
            });
        });
    }
}
