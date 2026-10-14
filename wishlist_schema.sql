-- Create wishlist table
create table wishlist (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  product_id uuid references products(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, product_id)
);

-- Enable Row Level Security
alter table wishlist enable row level security;

-- Create policies
create policy "Users can view their own wishlist"
  on wishlist for select
  using (auth.uid() = user_id);

create policy "Users can add to their own wishlist"
  on wishlist for insert
  with check (auth.uid() = user_id);

create policy "Users can delete from their own wishlist"
  on wishlist for delete
  using (auth.uid() = user_id);
