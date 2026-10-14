-- Create categories table
create table public.categories (
  id uuid default uuid_generate_v4() primary key,
  name text not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.categories enable row level security;

-- Policies for Categories
create policy "Categories are viewable by everyone."
  on categories for select
  using ( true );

create policy "Admins can insert categories."
  on categories for insert
  to authenticated
  with check ( exists ( select 1 from profiles where id = auth.uid() and role = 'admin' ) );

create policy "Admins can update categories."
  on categories for update
  to authenticated
  using ( exists ( select 1 from profiles where id = auth.uid() and role = 'admin' ) );

create policy "Admins can delete categories."
  on categories for delete
  to authenticated
  using ( exists ( select 1 from profiles where id = auth.uid() and role = 'admin' ) );

-- Insert initial categories
insert into public.categories (name) values
  ('Men'),
  ('Women'),
  ('Unisex'),
  ('Kids');
