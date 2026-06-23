import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(500).json({ error: 'Supabase environment variables are not configured on the server.' });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Fetch all active products
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(500).json({ error: `Supabase query failed: ${error.message}` });
    }

    // Determine the base URL dynamically based on headers
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host || 'choshmazone.vercel.app';
    const baseUrl = `${protocol}://${host}`;

    // Helper functions for formatting
    const cleanCdata = (str) => {
      if (!str) return '';
      return `<![CDATA[${String(str).replace(/\]\]>/g, ']] >')}]]>`;
    };

    const getAbsoluteUrl = (url) => {
      if (!url) return '';
      if (url.startsWith('http://') || url.startsWith('https://')) return url;
      return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
    };

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>Choshmazone Catalog Feed</title>
    <link>${baseUrl}</link>
    <description>Facebook Product Catalog Feed for Choshmazone</description>
`;

    for (const product of products) {
      const parentId = product.id;
      const parentName = product.name;
      const parentDescription = product.description || product.name;
      const parentCategory = product.category || 'Apparel & Accessories > Clothing';
      const brand = 'Choshmazone';
      
      // Parse variants if they exist
      let variantsList = [];
      try {
        if (product.variants) {
          variantsList = typeof product.variants === 'string' 
            ? JSON.parse(product.variants) 
            : product.variants;
        }
      } catch (e) {
        console.error(`Failed to parse variants for product ${product.id}`, e);
      }

      if (Array.isArray(variantsList) && variantsList.length > 0) {
        // Output each variant as a separate item in the catalog
        for (const variant of variantsList) {
          const variantId = variant.id || Math.random().toString(36).substr(2, 9);
          const feedId = `${parentId}_${variantId}`;
          
          // Formulate variant title
          const details = [];
          if (variant.color) details.push(variant.color);
          if (variant.size) details.push(variant.size);
          const variantName = details.length > 0 
            ? `${parentName} - ${details.join(' / ')}`
            : parentName;

          const link = `${baseUrl}/product/${parentId}?variant=${variantId}`;
          const imageLink = getAbsoluteUrl(variant.image_url || product.image_url);
          
          // Price formatting: variant price or fall back to main price
          const priceVal = variant.price || product.price;
          const priceStr = `${Number(priceVal).toFixed(2)} BDT`;
          
          // Availability based on variant stock
          const stockQty = typeof variant.stock_quantity !== 'undefined' 
            ? Number(variant.stock_quantity) 
            : Number(product.stock_quantity);
          const availability = stockQty > 0 ? 'in stock' : 'out of stock';

          xml += `    <item>
      <g:id>${feedId}</g:id>
      <g:item_group_id>${parentId}</g:item_group_id>
      <g:title>${cleanCdata(variantName)}</g:title>
      <g:description>${cleanCdata(parentDescription)}</g:description>
      <g:link>${link}</g:link>
      <g:image_link>${imageLink}</g:image_link>
      <g:brand>${cleanCdata(brand)}</g:brand>
      <g:condition>new</g:condition>
      <g:availability>${availability}</g:availability>
      <g:price>${priceStr}</g:price>
      <g:google_product_category>${cleanCdata(parentCategory)}</g:google_product_category>
`;

          if (variant.color) {
            xml += `      <g:color>${cleanCdata(variant.color)}</g:color>\n`;
          }
          if (variant.size) {
            xml += `      <g:size>${cleanCdata(variant.size)}</g:size>\n`;
          }
          if (product.style) {
            xml += `      <g:style>${cleanCdata(product.style)}</g:style>\n`;
          }

          xml += `    </item>\n`;
        }
      } else {
        // Output the product itself if there are no variants
        const link = `${baseUrl}/product/${parentId}`;
        const imageLink = getAbsoluteUrl(product.image_url);
        const priceStr = `${Number(product.price).toFixed(2)} BDT`;
        const availability = Number(product.stock_quantity) > 0 ? 'in stock' : 'out of stock';

        xml += `    <item>
      <g:id>${parentId}</g:id>
      <g:title>${cleanCdata(parentName)}</g:title>
      <g:description>${cleanCdata(parentDescription)}</g:description>
      <g:link>${link}</g:link>
      <g:image_link>${imageLink}</g:image_link>
      <g:brand>${cleanCdata(brand)}</g:brand>
      <g:condition>new</g:condition>
      <g:availability>${availability}</g:availability>
      <g:price>${priceStr}</g:price>
      <g:google_product_category>${cleanCdata(parentCategory)}</g:google_product_category>
`;

        if (product.style) {
          xml += `      <g:style>${cleanCdata(product.style)}</g:style>\n`;
        }

        xml += `    </item>\n`;
      }
    }

    xml += `  </channel>
</rss>`;

    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=600');
    return res.status(200).send(xml);
  } catch (err) {
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({ error: `Server error: ${err.message}` });
  }
}
