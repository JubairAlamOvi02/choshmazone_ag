-- Add variants column to products table to store colors, sizes, and stock for each
ALTER TABLE public.products 
ADD COLUMN variants jsonb DEFAULT '[]'::jsonb;

-- Add style column to order_items to store variant details for the order
ALTER TABLE public.order_items
ADD COLUMN style text;
