-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.categories (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  slug text,
  description text,
  image_url text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT categories_pkey PRIMARY KEY (id),
  CONSTRAINT categories_name_key UNIQUE (name)
);

-- Migration for is_active column:
-- alter table public.categories add column if not exists is_active boolean default true;
-- update public.categories set is_active = true where is_active is null;

CREATE TABLE public.order_items (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  order_id uuid NOT NULL,
  product_id uuid,
  quantity integer NOT NULL,
  unit_price numeric NOT NULL,
  style text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT order_items_pkey PRIMARY KEY (id),
  CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
  CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL
);
CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'processing'::text, 'shipped'::text, 'cancelled'::text, 'completed'::text])),
  total_amount numeric NOT NULL,
  shipping_address jsonb,
  payment_method text,
  payment_details jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  price numeric NOT NULL,
  stock_quantity integer DEFAULT 0,
  category text,
  image_url text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  style text,
  images text[],
  brand text,
  frame_material text,
  lens_material text,
  lens_technology text,
  lens_color text,
  frame_color text,
  color text,
  frame_width text,
  lens_width text,
  bridge_width text,
  temple_length text,
  face_shape text,
  spec_frame text,
  spec_lens text,
  spec_hardware text,
  spec_weight text,
  shipping_info text,
  variants jsonb DEFAULT '[]'::jsonb,
  CONSTRAINT products_pkey PRIMARY KEY (id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  full_name text,
  role text DEFAULT 'customer'::text CHECK (role = ANY (ARRAY['admin'::text, 'customer'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  user_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  user_name text,
  CONSTRAINT reviews_pkey PRIMARY KEY (id),
  CONSTRAINT reviews_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id),
  CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.wishlist (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  product_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT wishlist_pkey PRIMARY KEY (id),
  CONSTRAINT wishlist_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT wishlist_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id),
  CONSTRAINT wishlist_unique_item UNIQUE (user_id, product_id)
);

CREATE TABLE public.site_settings (
  key text NOT NULL,
  value text NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT site_settings_pkey PRIMARY KEY (key)
);

-- Web Logs & Conversion Funnel Analytics Tables
CREATE TABLE public.visitor_sessions (
  id text NOT NULL, -- session UUID (sessionStorage)
  visitor_id text NOT NULL, -- persistent client identifier (localStorage UUID)
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  first_page text,
  last_page text,
  referrer text,
  device_type text, -- 'mobile', 'tablet', 'desktop'
  browser text,
  operating_system text,
  page_views_count integer DEFAULT 1,
  has_viewed_product boolean DEFAULT false,
  has_added_to_cart boolean DEFAULT false,
  has_initiated_checkout boolean DEFAULT false,
  has_purchased boolean DEFAULT false,
  total_purchased_amount numeric(10,2) DEFAULT 0,
  order_id uuid,
  started_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  last_active_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT visitor_sessions_pkey PRIMARY KEY (id)
);

CREATE TABLE public.web_events (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  session_id text NOT NULL,
  visitor_id text NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  event_type text NOT NULL, -- 'page_view', 'view_product', 'add_to_cart', 'remove_from_cart', 'initiate_checkout', 'purchase', 'wishlist_add'
  path text NOT NULL,
  page_title text,
  metadata jsonb DEFAULT '{}'::jsonb, -- product info, cart value, order details, etc.
  device_type text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT web_events_pkey PRIMARY KEY (id)
);

-- Common site_settings keys:
-- 'checkout_field_settings': JSON object mapping field IDs ('name', 'phone', 'email', 'address', 'district', 'thana', 'city', 'zip', 'notes') to their required, enabled, label, and placeholder settings.
-- 'lens_packages_settings': JSON array of optical lens packages (id, name, price, subtitle, features, isPrescription, is_active, order)
-- 'hero_banner_*': Homepage hero configuration (image, badge, title, highlight, description, btn_text, btn_link, btn_style, btn_shape, btn_size, btn_icon)
-- 'collections_hero_*': Collections page header banner (bg, badge, title, description)
-- 'promo_banner_*': Promotional highlight banner configuration (image, badge, title, description, button, link)