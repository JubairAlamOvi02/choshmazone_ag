-- Add variants column to products table to store colors, sizes, and stock for each
ALTER TABLE public.products 
ADD COLUMN variants jsonb DEFAULT '[]'::jsonb;
