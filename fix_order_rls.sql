-- Run this in Supabase SQL Editor to fix Order RLS issues

-- 1. DROP OLD POLICIES
DROP POLICY IF EXISTS "Users can insert their own orders." ON orders;
DROP POLICY IF EXISTS "Users can insert their own order items." ON order_items;

-- 2. NEW ORDERS POLICY: Allow Authenticated users and Guests (Anon)
CREATE POLICY "Allow anyone to insert orders"
ON orders FOR INSERT
WITH CHECK (
    (auth.role() = 'authenticated' AND auth.uid() = user_id) -- Logged in users
    OR
    (auth.role() = 'anon' AND user_id IS NULL) -- Guest users
);

-- 3. NEW ORDER_ITEMS POLICY: Allow Anyone to insert items for an order they just created
CREATE POLICY "Allow anyone to insert order items"
ON order_items FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM orders 
        WHERE orders.id = order_items.order_id 
        AND (
            (orders.user_id = auth.uid()) -- Match authenticated user
            OR 
            (orders.user_id IS NULL) -- Match guest user
        )
    )
);

-- 4. Ensure Public Read for Admins and Own Orders
-- The existing select policies in supabase_schema.sql are likely fine, but double check:
-- "Users can view their own orders." -> OK
-- "Admins can view all orders." -> OK
