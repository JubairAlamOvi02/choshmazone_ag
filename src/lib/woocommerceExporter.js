/**
 * WooCommerce Product CSV Exporter for Choshmazone
 * Generates official WooCommerce-compliant CSV files for bulk import.
 */

// Escape CSV cell according to RFC 4180
export function escapeCsvCell(cell) {
    if (cell === null || cell === undefined) return '';
    const str = String(cell);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

// Convert product details and specifications into rich HTML description
export function buildDescription(product) {
    let desc = product.description || '';

    const specs = [];
    if (product.brand) specs.push(`<li><strong>Brand:</strong> ${product.brand}</li>`);
    if (product.style) specs.push(`<li><strong>Style:</strong> ${product.style}</li>`);
    if (product.frame_material) specs.push(`<li><strong>Frame Material:</strong> ${product.frame_material}</li>`);
    if (product.lens_material) specs.push(`<li><strong>Lens Material:</strong> ${product.lens_material}</li>`);
    if (product.lens_technology) specs.push(`<li><strong>Lens Technology:</strong> ${product.lens_technology}</li>`);
    if (product.face_shape) specs.push(`<li><strong>Suitable Face Shape:</strong> ${product.face_shape}</li>`);

    const dimensions = [];
    if (product.frame_width) dimensions.push(`Frame Width: ${product.frame_width}mm`);
    if (product.lens_width) dimensions.push(`Lens Width: ${product.lens_width}mm`);
    if (product.bridge_width) dimensions.push(`Bridge: ${product.bridge_width}mm`);
    if (product.temple_length) dimensions.push(`Temple: ${product.temple_length}mm`);

    if (dimensions.length > 0) {
        specs.push(`<li><strong>Dimensions:</strong> ${dimensions.join(' | ')}</li>`);
    }

    if (product.shipping_info) {
        specs.push(`<li><strong>Shipping Info:</strong> ${product.shipping_info}</li>`);
    }

    if (specs.length > 0) {
        desc += `\n\n<div class="product-specifications">\n<h3>Specifications</h3>\n<ul>\n${specs.join('\n')}\n</ul>\n</div>`;
    }

    return desc.trim();
}

/**
 * Parses and sanitizes variants from a product
 */
export function getProductVariants(product) {
    if (!product.variants) return [];
    let variants = product.variants;
    if (typeof variants === 'string') {
        try {
            variants = JSON.parse(variants);
        } catch {
            return [];
        }
    }
    return Array.isArray(variants) ? variants : [];
}

/**
 * Collects and deduplicates all image URLs for a product
 */
export function getProductImages(product) {
    const images = [];
    if (product.image_url) images.push(product.image_url);

    if (Array.isArray(product.images)) {
        product.images.forEach(img => {
            if (img && typeof img === 'string' && !images.includes(img)) {
                images.push(img);
            }
        });
    }

    // Also include variant images in the gallery
    const variants = getProductVariants(product);
    variants.forEach(v => {
        if (v.image_url && typeof v.image_url === 'string' && !images.includes(v.image_url)) {
            images.push(v.image_url);
        }
    });

    return images.filter(Boolean);
}

/**
 * Generate WooCommerce CSV rows
 * @param {Array} products - List of product records from Supabase
 * @param {Object} options - Export options { mode: 'variable'|'simple', includeInactive: boolean }
 */
export function generateWooCommerceCsv(products = [], options = {}) {
    const { mode = 'variable', includeInactive = true } = options;

    const filteredProducts = products.filter(p => includeInactive || p.is_active);

    // Official WooCommerce CSV column headers
    const headers = [
        'ID',
        'Type',
        'SKU',
        'Name',
        'Published',
        'Is featured?',
        'Visibility in catalog',
        'Short description',
        'Description',
        'Date sale price starts',
        'Date sale price ends',
        'Tax status',
        'Tax class',
        'In stock?',
        'Stock',
        'Low stock amount',
        'Backorders allowed?',
        'Sold individually?',
        'Weight (kg)',
        'Length (cm)',
        'Width (cm)',
        'Height (cm)',
        'Allow customer reviews?',
        'Purchase note',
        'Sale price',
        'Regular price',
        'Categories',
        'Tags',
        'Shipping class',
        'Images',
        'Download limit',
        'Download expiry days',
        'Parent',
        'Grouped products',
        'Upsells',
        'Cross-sells',
        'External URL',
        'Button text',
        'Position',
        'Attribute 1 name',
        'Attribute 1 value(s)',
        'Attribute 1 visible',
        'Attribute 1 global',
        'Attribute 2 name',
        'Attribute 2 value(s)',
        'Attribute 2 visible',
        'Attribute 2 global'
    ];

    const rows = [];

    filteredProducts.forEach((product, pIndex) => {
        const variants = getProductVariants(product);
        const hasVariants = variants.length > 0;
        const baseSku = `CSZ-${(product.id || '').slice(0, 8).toUpperCase()}`;
        const description = buildDescription(product);
        const shortDescription = product.style ? `Style: ${product.style}` : '';
        const category = product.category || 'Eyewear';
        const tags = [product.brand, product.style, product.face_shape, product.color]
            .filter(Boolean)
            .join(', ');

        const allImages = getProductImages(product);
        const imagesStr = allImages.join(', ');

        // If variable mode is enabled and product has variants
        if (mode === 'variable' && hasVariants) {
            // Find all unique colors and sizes
            const colors = [...new Set(variants.map(v => v.color).filter(Boolean))];
            const sizes = [...new Set(variants.map(v => v.size).filter(Boolean))];

            const totalStock = variants.reduce((acc, v) => acc + (Number(v.stock_quantity) || 0), 0);

            // 1. Parent Row (Variable Product)
            const parentRow = [
                '', // ID (empty so WooCommerce generates new ID)
                'variable', // Type
                baseSku, // SKU
                product.name, // Name
                product.is_active ? '1' : '0', // Published
                '0', // Is featured?
                'visible', // Visibility in catalog
                shortDescription, // Short description
                description, // Description
                '', '', // Sale dates
                'taxable', // Tax status
                '', // Tax class
                totalStock > 0 ? '1' : '0', // In stock?
                totalStock, // Stock
                '', '0', '0', '', '', '', '', // Low stock, backorders, dimensions
                '1', // Allow customer reviews?
                '', // Purchase note
                '', // Sale price
                product.price ? String(product.price) : '', // Regular price
                category, // Categories
                tags, // Tags
                '', // Shipping class
                imagesStr, // Images
                '', '', // Downloads
                '', // Parent
                '', '', '', '', '', // Grouped, upsells, external url
                pIndex, // Position
                colors.length > 0 ? 'Color' : '', // Attribute 1 name
                colors.join(', '), // Attribute 1 value(s)
                colors.length > 0 ? '1' : '', // Attribute 1 visible
                colors.length > 0 ? '1' : '', // Attribute 1 global
                sizes.length > 0 ? 'Size' : '', // Attribute 2 name
                sizes.join(', '), // Attribute 2 value(s)
                sizes.length > 0 ? '1' : '', // Attribute 2 visible
                sizes.length > 0 ? '1' : '' // Attribute 2 global
            ];
            rows.push(parentRow);

            // 2. Child Rows (Variations)
            variants.forEach((v, vIndex) => {
                const varSku = `${baseSku}-${vIndex + 1}`;
                const varStock = typeof v.stock_quantity !== 'undefined' ? Number(v.stock_quantity) : 0;
                const varPrice = v.price || product.price || '';
                const varImage = v.image_url || product.image_url || '';

                const details = [];
                if (v.color) details.push(v.color);
                if (v.size) details.push(v.size);
                const varName = details.length > 0 ? `${product.name} - ${details.join(' / ')}` : `${product.name} (Variation ${vIndex + 1})`;

                const varRow = [
                    '', // ID
                    'variation', // Type
                    varSku, // SKU
                    varName, // Name
                    product.is_active ? '1' : '0', // Published
                    '0',
                    'visible',
                    '', // Short description
                    '', // Description (inherits from parent)
                    '', '', 'taxable', '',
                    varStock > 0 ? '1' : '0', // In stock?
                    varStock, // Stock
                    '', '0', '0', '', '', '', '',
                    '1', '', '',
                    varPrice ? String(varPrice) : '', // Regular price
                    '', // Categories (inherits)
                    '', // Tags
                    '',
                    varImage, // Variation Image
                    '', '',
                    baseSku, // Parent SKU!
                    '', '', '', '', '',
                    vIndex,
                    v.color ? 'Color' : '',
                    v.color || '',
                    v.color ? '1' : '',
                    v.color ? '1' : '',
                    v.size ? 'Size' : '',
                    v.size || '',
                    v.size ? '1' : '',
                    v.size ? '1' : ''
                ];
                rows.push(varRow);
            });
        } else if (mode === 'simple' && hasVariants) {
            // Standalone simple products for each variant
            variants.forEach((v, vIndex) => {
                const varSku = `${baseSku}-${vIndex + 1}`;
                const varStock = typeof v.stock_quantity !== 'undefined' ? Number(v.stock_quantity) : (product.stock_quantity || 0);
                const varPrice = v.price || product.price || '';
                const details = [];
                if (v.color) details.push(v.color);
                if (v.size) details.push(v.size);
                const varName = details.length > 0 ? `${product.name} - ${details.join(' / ')}` : product.name;

                const varImages = [v.image_url, ...allImages].filter(Boolean);
                const uniqueVarImages = [...new Set(varImages)].join(', ');

                const simpleRow = [
                    '', // ID
                    'simple', // Type
                    varSku, // SKU
                    varName, // Name
                    product.is_active ? '1' : '0', // Published
                    '0',
                    'visible',
                    shortDescription,
                    description,
                    '', '', 'taxable', '',
                    varStock > 0 ? '1' : '0',
                    varStock,
                    '', '0', '0', '', '', '', '',
                    '1', '', '',
                    varPrice ? String(varPrice) : '',
                    category,
                    tags,
                    '',
                    uniqueVarImages,
                    '', '', '', '', '', '', '', '',
                    pIndex * 100 + vIndex,
                    v.color ? 'Color' : '',
                    v.color || '',
                    v.color ? '1' : '',
                    v.color ? '1' : '',
                    v.size ? 'Size' : '',
                    v.size || '',
                    v.size ? '1' : '',
                    v.size ? '1' : ''
                ];
                rows.push(simpleRow);
            });
        } else {
            // Standard Simple Product (no variants)
            const stock = Number(product.stock_quantity) || 0;
            const simpleRow = [
                '', // ID
                'simple', // Type
                baseSku, // SKU
                product.name, // Name
                product.is_active ? '1' : '0', // Published
                '0',
                'visible',
                shortDescription,
                description,
                '', '', 'taxable', '',
                stock > 0 ? '1' : '0',
                stock,
                '', '0', '0', '', '', '', '',
                '1', '', '',
                product.price ? String(product.price) : '',
                category,
                tags,
                '',
                imagesStr,
                '', '', '', '', '', '', '', '',
                pIndex,
                product.color ? 'Color' : '',
                product.color || '',
                product.color ? '1' : '',
                product.color ? '1' : '',
                '', '', '', ''
            ];
            rows.push(simpleRow);
        }
    });

    // Assemble CSV String
    const csvContent = [
        headers.map(escapeCsvCell).join(','),
        ...rows.map(row => row.map(escapeCsvCell).join(','))
    ].join('\r\n');

    return {
        csvContent,
        totalRows: rows.length,
        productCount: filteredProducts.length
    };
}

/**
 * Triggers a browser file download of the WooCommerce CSV
 */
export function downloadWooCommerceCsv(products, options = {}) {
    const { csvContent, totalRows, productCount } = generateWooCommerceCsv(products, options);
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `choshmazone_woocommerce_products_${dateStr}.csv`;

    // Add UTF-8 BOM so Excel/WooCommerce reads accents and Bengali chars properly
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return { filename, totalRows, productCount };
}
