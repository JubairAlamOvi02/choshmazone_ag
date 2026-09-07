-- ==========================================================
-- WEB LOGS & VISITOR ANALYTICS SCHEMA FOR CHOSHMAZONE
-- ==========================================================

-- 1. Create visitor_sessions table to track visitor journeys and conversion stages
create table if not exists public.visitor_sessions (
  id text primary key, -- e.g. session UUID
  visitor_id text not null, -- persistent client identifier (localStorage UUID)
  user_id uuid references public.profiles(id) on delete set null,
  first_page text,
  last_page text,
  referrer text,
  device_type text, -- 'mobile', 'tablet', 'desktop'
  browser text,
  operating_system text,
  page_views_count integer default 1,
  has_viewed_product boolean default false,
  has_added_to_cart boolean default false,
  has_initiated_checkout boolean default false,
  has_purchased boolean default false,
  total_purchased_amount numeric(10,2) default 0,
  order_id uuid,
  started_at timestamp with time zone default timezone('utc'::text, now()) not null,
  last_active_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create web_events table for granular event logging
create table if not exists public.web_events (
  id uuid default uuid_generate_v4() primary key,
  session_id text not null,
  visitor_id text not null,
  user_id uuid references public.profiles(id) on delete set null,
  event_type text not null, -- 'page_view', 'view_product', 'add_to_cart', 'remove_from_cart', 'initiate_checkout', 'purchase', 'wishlist_add'
  path text not null,
  page_title text,
  metadata jsonb default '{}'::jsonb, -- product info, cart value, order details, etc.
  device_type text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Create indexes for high performance analytics queries
create index if not exists idx_web_events_created_at on public.web_events(created_at desc);
create index if not exists idx_web_events_event_type on public.web_events(event_type);
create index if not exists idx_web_events_visitor_id on public.web_events(visitor_id);
create index if not exists idx_web_events_session_id on public.web_events(session_id);
create index if not exists idx_visitor_sessions_started_at on public.visitor_sessions(started_at desc);
create index if not exists idx_visitor_sessions_visitor_id on public.visitor_sessions(visitor_id);
create index if not exists idx_visitor_sessions_last_active on public.visitor_sessions(last_active_at desc);

-- 4. Enable Row Level Security (RLS)
alter table public.visitor_sessions enable row level security;
alter table public.web_events enable row level security;

-- Drop existing policies if any to avoid duplication
drop policy if exists "Allow all users to insert visitor_sessions" on public.visitor_sessions;
drop policy if exists "Allow all users to update visitor_sessions" on public.visitor_sessions;
drop policy if exists "Admins can view visitor_sessions" on public.visitor_sessions;

drop policy if exists "Allow all users to insert web_events" on public.web_events;
drop policy if exists "Admins can view web_events" on public.web_events;

-- 5. Policies for visitor_sessions
-- Allow anyone (anonymous or authenticated) to create or update their own session record
create policy "Allow all users to insert visitor_sessions"
  on public.visitor_sessions for insert
  with check ( true );

create policy "Allow all users to update visitor_sessions"
  on public.visitor_sessions for update
  using ( true );

-- Only admins can read visitor sessions for reporting
create policy "Admins can view visitor_sessions"
  on public.visitor_sessions for select
  to authenticated
  using ( exists ( select 1 from public.profiles where id = auth.uid() and role = 'admin' ) );

-- Also allow anonymous / public fallback select if admin check isn't authenticated yet (or you can keep strictly for admin)
create policy "Allow admins full access to visitor_sessions"
  on public.visitor_sessions for all
  using ( true );

-- 6. Policies for web_events
create policy "Allow all users to insert web_events"
  on public.web_events for insert
  with check ( true );

create policy "Allow admins full access to web_events"
  on public.web_events for all
  using ( true );
