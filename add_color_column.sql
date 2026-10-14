-- Add color column to products table to act as the default variant color
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS color text;
