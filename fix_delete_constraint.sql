
-- 1. Drop the existing foreign key constraint
ALTER TABLE public.order_items
DROP CONSTRAINT IF EXISTS order_items_product_id_fkey;

-- 2. Re-add the constraint with ON DELETE SET NULL
-- This allows the product to be deleted, while keeping the order item (with a null product reference)
ALTER TABLE public.order_items
ADD CONSTRAINT order_items_product_id_fkey
FOREIGN KEY (product_id)
REFERENCES public.products(id)
ON DELETE SET NULL;

-- 3. (Optional) Run this if you want to verify the change
-- SELECT constraint_name, delete_rule 
-- FROM information_schema.referential_constraints 
-- WHERE constraint_name = 'order_items_product_id_fkey';
