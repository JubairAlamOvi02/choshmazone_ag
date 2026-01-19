-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES Table (Extends auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  full_name text,
  role text default 'customer' check (role in ('admin', 'customer')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Policies for Profiles
create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- 2. PRODUCTS Table
create table public.products (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  price numeric(10,2) not null,
  stock_quantity integer default 0,
  category text,
  image_url text, -- Primary display image
  images text[], -- Array of additional images (including primary)
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.products enable row level security;

-- Policies for Products
create policy "Products are viewable by everyone."
  on products for select
  using ( true );

create policy "Admins can insert products."
  on products for insert
  to authenticated
  with check ( exists ( select 1 from profiles where id = auth.uid() and role = 'admin' ) );

create policy "Admins can update products."
  on products for update
  to authenticated
  using ( exists ( select 1 from profiles where id = auth.uid() and role = 'admin' ) );

create policy "Admins can delete products."
  on products for delete
  to authenticated
  using ( exists ( select 1 from profiles where id = auth.uid() and role = 'admin' ) );

-- 3. ORDERS Table
create table public.orders (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id),
  status text default 'pending' check (status in ('pending', 'processing', 'shipped', 'cancelled', 'completed')),
  total_amount numeric(10,2) not null,
  shipping_address jsonb, -- Stores full address snapshot
  payment_method text,
  payment_details jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.orders enable row level security;

-- Policies for Orders
create policy "Users can view their own orders."
  on orders for select
  to authenticated
  using ( auth.uid() = user_id );

create policy "Admins can view all orders."
  on orders for select
  to authenticated
  using ( exists ( select 1 from profiles where id = auth.uid() and role = 'admin' ) );

create policy "Users can insert their own orders."
  on orders for insert
  to authenticated
  with check ( auth.uid() = user_id );

create policy "Admins can update orders (e.g. status)."
  on orders for update
  to authenticated
  using ( exists ( select 1 from profiles where id = auth.uid() and role = 'admin' ) );

create policy "Admins can delete orders."
  on orders for delete
  to authenticated
  using ( exists ( select 1 from profiles where id = auth.uid() and role = 'admin' ) );

-- 4. ORDER ITEMS Table
create table public.order_items (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references public.orders(id) on delete cascade not null,
  product_id uuid references public.products(id),
  quantity integer not null,
  unit_price numeric(10,2) not null, -- Price at time of purchase
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.order_items enable row level security;

-- Policies for Order Items
create policy "Users can view their own order items."
  on order_items for select
  to authenticated
  using ( exists ( select 1 from orders where orders.id = order_items.order_id and orders.user_id = auth.uid() ) );

create policy "Admins can view all order items."
  on order_items for select
  to authenticated
  using ( exists ( select 1 from profiles where id = auth.uid() and role = 'admin' ) );

create policy "Users can insert their own order items."
  on order_items for insert
  to authenticated
  with check ( exists ( select 1 from orders where orders.id = order_items.order_id and orders.user_id = auth.uid() ) );

-- 5. STORAGE (Buckets)
-- Note: You must create a bucket named 'products' in the Supabase Dashboard -> Storage

-- Trigger to create profile after Sign Up
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', 'customer');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Helper to make the first user an admin (Run manually if needed, or update via dashboard)
-- update public.profiles set role = 'admin' where id = 'YOUR_USER_ID';
