-- Add missing columns to products table
alter table products add column if not exists brand text;
alter table products add column if not exists style text;
alter table products add column if not exists images text[] default array[]::text[];
alter table products add column if not exists frame_material text;
alter table products add column if not exists lens_material text;
alter table products add column if not exists lens_technology text;
alter table products add column if not exists lens_color text;
alter table products add column if not exists frame_color text;
alter table products add column if not exists frame_width text;
alter table products add column if not exists lens_width text;
alter table products add column if not exists bridge_width text;
alter table products add column if not exists temple_length text;
alter table products add column if not exists face_shape text;
alter table products add column if not exists is_active boolean default true;

-- Enable RLS
alter table products enable row level security;

-- Policies (Re-applying to be safe)
drop policy if exists "Enable read access for all users" on products;
create policy "Enable read access for all users"
  on products for select
  using (true);

drop policy if exists "Enable insert for authenticated users only" on products;
create policy "Enable insert for authenticated users only"
  on products for insert
  with check (auth.role() = 'authenticated');

drop policy if exists "Enable update for authenticated users only" on products;
create policy "Enable update for authenticated users only"
  on products for update
  using (auth.role() = 'authenticated');

drop policy if exists "Enable delete for authenticated users only" on products;
create policy "Enable delete for authenticated users only"
  on products for delete
  using (auth.role() = 'authenticated');

-- Storage Bucket Setup
insert into storage.buckets (id, name, public)
values ('products', 'products', true)
on conflict (id) do nothing;

drop policy if exists "Public Access" on storage.objects;
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'products' );

drop policy if exists "Authenticated users can upload" on storage.objects;
create policy "Authenticated users can upload"
  on storage.objects for insert
  with check ( bucket_id = 'products' and auth.role() = 'authenticated' );

-- Insert Sample Data
insert into products (name, description, price, stock_quantity, category, brand, image_url, style, is_active)
values
  ('Classic Aviator', 'Timeless aviator sunglasses with gold frames.', 1500.00, 50, 'Men', 'Ray-Ban', 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&q=80&w=800', 'Aviator', true),
  ('Retro Square', 'Bold square frames for a modern look.', 1200.00, 30, 'Women', 'Gucci', 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&q=80&w=800', 'Square', true),
  ('Vintage Round', 'Classic round sunglasses with metal frames.', 1800.00, 25, 'Unisex', 'Persol', 'https://images.unsplash.com/photo-1577803645773-f96470509666?auto=format&fit=crop&q=80&w=800', 'Round', true)
on conflict do nothing;
