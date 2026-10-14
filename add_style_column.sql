-- Add style column to products table
ALTER TABLE public.products 
ADD COLUMN style text;

-- Optional: You might want to update existing products to have a default style if needed
-- UPDATE public.products SET style = 'Classic';
