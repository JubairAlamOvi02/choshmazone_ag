-- Add is_active column to categories table if not exists
alter table public.categories 
add column if not exists is_active boolean default true;

-- Ensure existing rows are marked active
update public.categories 
set is_active = true 
where is_active is null;
