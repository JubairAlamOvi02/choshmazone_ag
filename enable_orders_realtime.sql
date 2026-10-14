-- ========================================================
-- Enable Supabase Realtime for the 'orders' table
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql
-- ========================================================

-- 1. Ensure the orders table has REPLICA IDENTITY set to FULL
alter table public.orders replica identity full;

-- 2. Add 'orders' table to the 'supabase_realtime' publication
-- (If it's already added, this will safely succeed or can be ignored)
do $$
begin
  if not exists (
    select 1 
    from pg_publication_tables 
    where pubname = 'supabase_realtime' 
      and schemaname = 'public' 
      and tablename = 'orders'
  ) then
    alter publication supabase_realtime add table public.orders;
  end if;
end $$;
