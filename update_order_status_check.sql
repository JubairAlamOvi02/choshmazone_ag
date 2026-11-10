-- =========================================================================
-- Allow Custom & Additional Order Statuses (e.g. 'partial_payment')
-- Run this in your Supabase Dashboard -> SQL Editor
-- =========================================================================

-- 1. Drop the check constraint on orders.status so any admin-defined status is accepted
ALTER TABLE public.orders 
DROP CONSTRAINT IF EXISTS orders_status_check;

-- 2. Ensure default remains 'pending'
ALTER TABLE public.orders 
ALTER COLUMN status SET DEFAULT 'pending';

-- 3. (Optional verification) View column definition
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'orders' AND column_name = 'status';

