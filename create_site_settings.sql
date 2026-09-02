-- SQL to create site_settings table in Supabase
create table if not exists public.site_settings (
  key text primary key,
  value text not null,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable Row Level Security (RLS)
alter table public.site_settings enable row level security;

-- Policies: Anyone can view, Admins can create/update/delete
create policy "Public Read site_settings" on public.site_settings for select using (true);

create policy "Admin CRUD site_settings" on public.site_settings for all 
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
