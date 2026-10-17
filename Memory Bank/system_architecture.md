# System Architecture & Design: Admin Panel Expansion

## 1. Technology Decision: Supabase
**Verdict**: **Recommended**

**Justification**:
*   **Authentication**: Supabase provides a production-ready authentication system (Email/Password, Social details) out of the box, saving significant development time.
*   **Database**: It serves a full PostgreSQL database, which is the industry standard for relational data (Products, Orders, Users).
*   **Security (RLS)**: PostgreSQL's Row Level Security (RLS) allows us to define strict access rules immediately at the database level (e.g., "Only users with role 'admin' can UPDATE products"), ensuring the "Secure role-based access" requirement is strictly met.
*   **Storage**: Integrated object storage for product images eliminates the need for a separate AWS S3 setup.
*   **Scalability**: Being a managed backend-as-a-service (BaaS), it handles scaling automatically and minimizes maintenance overhead.

---

## 2. Architecture Overview

### Frontend
*   **Framework**: React (Vite)
*   **State Management**: React Context (`AuthProvider`, `CartProvider`, `ToastProvider`)
*   **Data Fetching**: `@supabase/supabase-js` client library with an integrated `DataCache` layer.
*   **Routing**: `react-router-dom` with Protected Routes and Route-based Code Splitting (`React.lazy`).
*   **Performance & Analytics Components**: 
    *   `OptimizedImage`: Lazy loading and blur-up effects.
    *   `Skeleton`: Global shimmering placeholder system for smooth loading transitions.
    *   `DashboardCharts`: Real-time data visualization using Recharts.
    *   `OrderTimeline`: State-driven progress tracking for fulfillment.
    *   `TrackOrder`: Phone-based lookup and secure OTP verification flow.
    *   `ScrollToTop`: Global scroll reset on route changes.
    *   `SearchBar`: Debounced multi-field filtering.
    *   **Checkout Logic**: Integrated quantity counters with real-time total and delivery charge recalculation.
    *   **Admin Intelligence**: Multi-select bulk operation toolbar for status management and deletion.
    *   `ErrorBoundary`: Global crash protection.
    *   `Data Services`: Intelligent manual merging for relational data (e.g., Reviews -> Profiles) to bypass missing DB foreign key constraints and minimize console errors.
    *   `Media Manager`: Implementation of `URL.createObjectURL` for immediate, low-latency visual feedback during admin image uploads.
    *   **Session Intelligence**: Client-side logic for managing active sessions (`SESSION_VERSION`) and providing "Session Active" choice screens to prevent login loops.
    *   **Chart Optimization**: Component-level hydration tracking (`isMounted`) and debounced `ResponsiveContainer` to ensure Recharts stability in the Admin Dashboard.
    *   `Rich Text Engine`: Integrated `react-quill-new` for full HTML description support, maintaining React 19 compatibility.
    *   `Shopify-Style Variants`: Unified variant management UI for Color and Size combinations.
    *   `Unified Media Grid`: Drag-and-drop gallery with automatic primary image detection.
    *   `Telegram Notifier`: Real-time instant phone push alerts for orders via Telegram Bot API with interactive test suite in Admin Orders.
    *   `Promotional Content Engine`: Dynamic background image and live editable text for homepage banners via `site_settings`.
    *   `Hero Banner Dynamic Engine`: Database-driven Hero section on homepage with customizable photography, tag/badge, two-part heading with accent gold word, multiline description, and button styling token selector engine (Color/Style, Shape, Size, Icon) with Live Homepage Preview.
    *   `Dynamic Category & Collections System`: Database-driven category management with activation/deactivation toggles (`is_active`), featured status management, live tab filters, and dual-level Collections page architecture (All Collections + Featured Collections).
    *   `Collections Hero Banner Engine`: Dynamic background image and live real-time editable text customizer (badge, title, subtitle) for `/collections` header powered by `site_settings`.
    *   `Prescription Lens Engine`: Multi-package optical lens customizer modal (`LensCustomizerModal.jsx`) supporting file upload, manual SPH/CYL/AXIS/PD matrix, and WhatsApp submission options with dynamic cart pricing.
    *   `Checkout Order Management`: Sidebar item removal direct from checkout with dynamic recalculation of delivery charges and order total.
    *   `Checkout Form Customizer`: Granular Admin module at `/admin/settings` controlling Required/Optional status, Shown/Hidden visibility, and custom labels/placeholders for all checkout inputs.
    *   `11-Digit Phone Validation`: Real-time phone number normalization and regex enforcement (`^01[3-9]\d{8}$`) with live digit counters.
    *   `Admin Orders Interaction Engine`: Clickable table rows and explicit `👁 Details` buttons for frictionless order inspection.
    *   `Interactive PDP Gallery`: Full-scale product image presentation with high-res thumbnails and floating previous/next navigation arrows.
    *   `Web Log & Funnel Analytics Engine`: Real-time visitor activity stream, persistent visitor/session tracking (`src/lib/tracker.js`), non-blocking event logging (`page_view`, `view_product`, `add_to_cart`, `remove_from_cart`, `initiate_checkout`, `purchase`), and comprehensive admin analytics dashboard (`WebLogs.jsx`) with step-by-step conversion funnel visualization, drop-off metrics, Recharts area trends, device breakdown, and JSON metadata inspector.
    *   `Product Duplication Engine`: Administrative cloning pipeline (`Products.jsx` + `ProductForm.jsx`) supporting instant product duplication with auto `(Copy)` naming, ID sanitization, variant regeneration, image re-referencing, and direct new-product persistence.
    *   `Guarded Image Rendering`: Explicit `hasValidSrc` validation in `OptimizedImage.jsx` and `CartItem.jsx` to prevent empty/undefined image sources from generating invalid client requests.
    *   `Recently Purchased Showcase`: Public homepage component (`RecentlyPurchased.jsx`) displaying recent purchases matching the New Arrivals 4-column layout and header style (`bg-secondary` bar). Data is queried via `orderParams.fetchRecentPurchased` with strict exclusion of all customer details, automatic product de-duplication, and 3-minute local cache management.
    *   `Visitor Geo-Map & Regional Analytics`: Administrative map visualization (`VisitorGeoMap.jsx`) integrated with `visitor_sessions` geo-tracking (`ip_address`, `city`, `region`, `country`, `isp`) for geographic intelligence in `/admin/web-logs`.
    *   `Client-Side WebP Image Compressor`: Native HTML5 canvas module (`src/lib/imageCompressor.js`) intercepting all uploads across product forms, media manager, categories, and checkout prescriptions. Auto-converts files to WebP under ~100 KB with max dimensions (1200px or 1920px for banners) and attaches 1-year browser cache headers (`cacheControl: '31536000, public'`), slashing Supabase Storage egress by 95-98% to remain permanently within the 5 GB/month free plan.
    *   `WooCommerce Bulk Exporter Engine`: Complete WordPress migration and synchronization pipeline (`src/lib/woocommerceExporter.js`, `ExportWooCommerceModal.jsx`, `export_woocommerce.js`) generating RFC 4180 / UTF-8 BOM CSV files mapped to standard WooCommerce column headers. Formats parent/variation hierarchies (colors, sizes, pricing, stock), combines product specifications into rich HTML descriptions, and consolidates public cloud image URLs for automated WordPress media ingestion.
    *   `Nationwide Steadfast Courier Logistics Engine`: Complete geographic database (`src/data/bangladeshLocations.js`) containing all 64 districts of Bangladesh + Dhaka Sub-Urban and 500+ upazilas and police stations (both administrative upazilas and metropolitan stations). Features dual-spelling aliases (`Chattogram` ↔ `Chittagong`, `Bogura` ↔ `Bogra`, `Jashore` ↔ `Jessore`, etc.) and an `Other / অন্যান্য` checkout fallback ensuring customers across any corner of Bangladesh can order effortlessly, with courier copy formatting in `Orders.jsx` optimized for Steadfast, Pathao, and RedX delivery systems.
    *   `Real-Time Order Alerting & Audio Engine`: Supabase Realtime channel subscription (`admin_realtime_orders_layout`) listening on PostgreSQL `public.orders` INSERT events in `AdminLayout.jsx`. Triggers an authentic cash register "Cha-Ching!" audio chime via `src/lib/orderSoundNotifier.js` (Web Audio API + `/sounds/cha-ching.mp3`), hardware vibration pattern (`navigator.vibrate`), system push notification, and an interactive animated floating toast banner with volume controls (`Volume2`/`VolumeX`).
    *   `ntfy.sh Instant Mobile Push Notifier`: Lightweight, zero-cost push notification service (`src/lib/ntfyNotifier.js`) delivering instant high-priority alerts to store managers on Android and iOS via ntfy.sh without requiring paid Apple Developer accounts or Firebase credentials. Supports priority levels, cash emojis, and interactive action buttons (`View Order`, `Call Customer`).
    *   `Interactive Telegram Bot Dispatcher`: Order notification pipeline (`src/lib/telegramNotifier.js`) equipped with Telegram `inline_keyboard` interactive buttons, allowing admins to inspect order details or call the customer directly from their Telegram chat.
    *   `Dynamic Contact Page CMS`: Database-driven Contact Us module (`src/pages/Contact.jsx`) connected to `site_settings` for dynamic headings, subtitles, showroom addresses, email support, and hotline numbers. Managed in `src/pages/admin/MediaManager.jsx` (Section 6) with a side-by-side real-time interactive preview replicating the public design.
    *   `ChoshmaZone Spotlight Media Engine`: Comprehensive brand storytelling suite comprising `SpotlightManager.jsx` in the admin panel and `ChoshmaZoneSpotlight.jsx` on the homepage. Supports embedded MP4/WebM videos and lifestyle photography, dynamic video playback modals with auto-play/mute controls, and product tag pill links. Settings persist in `site_settings` under key `spotlight_settings`.
    *   `Recently Viewed Eyewear Real-Time Engine`: Client-side persistent browsing history (`src/components/RecentlyViewed.jsx`) hydrated and verified directly against Supabase via `products.js` (`fetchRecentlyViewed`), ensuring live inventory badges ("In Stock" / "Out of Stock"), formatted BDT pricing, and instant "Add to Bag".
    *   `Multi-Tiered Stock Validation Engine`: Robust inventory validation in `src/pages/Checkout.jsx` that dynamically resolves stock availability across: (1) Specific variant ID lookup, (2) Variant color/size match fallback, and (3) Base product `stock_quantity` fallback. Eliminates false out-of-stock modal popups and provides dynamic modal status badges (`Only X left (ordered Y)` vs `Out of Stock`).
    *   `Fault-Tolerant Order Item Persistence & Rollback`: Decoupled dynamic variants from legacy relational UUID constraints (`order_items.variant_id`), storing rich variant payloads in `variant_info` (JSONB) alongside `selected_color`, `selected_size`, and formatted `style`. Includes automated rollback that removes parent `orders` if line item creation fails, preventing orphaned zero-item orders.
    *   `Meta Pixel & Advanced Matching Conversion Engine`: Dedicated tracking layer (`src/lib/metaPixel.js`) configured with Meta Pixel ID `28809507428687294`. Implements Meta Advanced Matching parameters (`external_id` synced from persistent `visitor_id`, normalized E.164 Bangladeshi phone numbers, lowercase email, names, and city), route synchronization in `PageMonitor.jsx`, and `eventID` deduplication on `Purchase` events for seamless alignment with Meta Conversions API (CAPI).

    *   `Facebook Catalog RSS/Atom XML Feed`: Serverless XML feed generator (`api/catalog.js`) compliant with Meta Commerce Manager specifications, featuring strict XML character entity escaping and sanitized URLs.
*   **PWA & Service Worker Resiliency**:
    - **Offline Caching**: Service Worker (`public/sw.js`) with cache versioning (`choshmazone-v2`) and pre-caching for core static assets (`/`, `/index.html`, `/manifest.json`).
    - **Safe Rejection Handling**: Network fetches inside `event.respondWith` are wrapped with `.catch()` returning synthetic 408 responses, preventing `TypeError: Failed to fetch` unhandled promise rejections.
    - **Dev Environment Isolation**: Service worker is registered strictly in production (`import.meta.env.PROD`). In development (`import.meta.env.DEV`), active registrations on `localhost:5173` are automatically unregistered and local caches purged to prevent interference with Vite HMR and dev server modules.
    - **Bypass Filters**: Non-`GET` requests, API calls, WebSocket protocols, and Vite dev server paths (`/@vite/`, `/@fs/`, `/__vite_ping`, `node_modules`, `hot-update`) bypass service worker interception completely.
*   **Performance Optimization**: 
    - **Code Splitting**: Route-level granularity via `React.lazy` and `Suspense`.
    - **Asset Priority**: `fetchpriority="high"` for critical path Above-The-Fold (ATF) images.
    - **Asset Lazy Loading**: `loading="lazy"` for below-the-fold content.
    - **Build Pipeline**: Custom manual chunks for vendor caching and Terser minification.
    - **UI Strategy**: Mobile-first utility-class approach utilizing modern flexbox/grid and full-screen mobile drawers.

### Backend (Supabase)
*   **Auth Service**: Manages Users (JWTs).
*   **PostgreSQL**: Stores relational data.
*   **Storage Buckets**: Stores product images.
*   **Edge Functions** (Optional): For complex server-side logic (e.g., payment webhooks), though mostly achievable via client + RLS for this scope.

---

## 3. Database Schema Design

### A. Tables

#### 1. `profiles`
*Extends the default `auth.users` table to store application-specific user data.*
*   `id` (UUID, Primary Key, References `auth.users.id`)
*   `full_name` (Text)
*   `role` (Text) - 'admin' | 'customer' (Default: 'customer')
*   `created_at` (Timestamp)

#### 2. `products`
*Inventory management.*
*   `id` (UUID, Primary Key)
*   `name` (Text)
*   `description` (Text)
*   `price` (Numeric)
*   `stock_quantity` (Integer)
*   `category` (Text)
*   `image_url` (Text) - Main display image
*   `images` (Text[]) - Support for multiple gallery images
*   `variants` (JSONB) - Complex variant data (Color, Size, Price, Stock, Image)
*   `spec_frame`, `spec_lens`, `spec_hardware`, `spec_weight` (Text) - Technical specifications
*   `shipping_info` (Text) - Delivery and returns details
*   `is_active` (Boolean) - For soft deleting/hiding products (Default: true)
*   `created_at` (Timestamp)

#### 3. `orders`
*Order records.*
*   `id` (UUID, Primary Key)
*   `user_id` (UUID, References `profiles.id`, Nullable for Guests)
*   `status` (Text) - 'pending', 'processing', 'shipped', 'completed', 'cancelled'
*   `total_amount` (Numeric)
*   `payment_method` (Text) - 'bkash' | 'cod'
*   `shipping_address` (JSONB) - Snapshot of details (first_name, last_name, email, phone, address, district, thana, city, zip, country)
*   `payment_details` (JSONB) - Snapshot for bKash (number, trx_id) or empty for COD.
*   `created_at` (Timestamp)

#### 4. `order_items`
*Links products to orders with snapshot pricing and variant specifications.*
*   `id` (UUID, Primary Key)
*   `order_id` (UUID, References `orders.id`)
*   `product_id` (UUID, References `products.id`, ON DELETE SET NULL)
*   `quantity` (Integer)
*   `unit_price` (Numeric) - Snapshot of price at purchase time
*   `style` (Text) - Formatted human-readable style/variant string
*   `selected_color` (Text, Nullable)
*   `selected_size` (Text, Nullable)
*   `variant_id` (UUID, Nullable) - Kept null for dynamic catalog JSON variants to preserve database FK integrity
*   `variant_info` (JSONB, Nullable) - Structured variant snapshot (color, size, SKU, image)


#### 5. `reviews`
*Customer feedback and ratings.*
*   `id` (UUID, Primary Key)
*   `product_id` (UUID, References `products.id`)
*   `user_id` (UUID, References `profiles.id`)
*   `rating` (Integer) - 1 to 5 stars
*   `comment` (Text)
*   `created_at` (Timestamp)

#### 6. `categories`
*Dynamic category definitions and collections.*
*   `id` (UUID, Primary Key)
*   `name` (Text, Unique)
*   `is_active` (Boolean, Default: true) - Controls storefront visibility without deletion
*   `created_at` (Timestamp)

#### 7. `site_settings`
*Global key-value storage for banners, promotional texts, and store styling.*
*   `key` (Text, Primary Key)
*   `value` (Text)
*   `updated_at` (Timestamp)

#### 8. `visitor_sessions`
*Tracks unique visitor sessions, geo-location, and conversion milestones.*
*   `id` (Text, Primary Key) - Session UUID (sessionStorage)
*   `visitor_id` (Text) - Persistent client ID (localStorage)
*   `user_id` (UUID, References `profiles.id`, Nullable)
*   `first_page` (Text), `last_page` (Text), `referrer` (Text)
*   `device_type` (Text), `browser` (Text), `operating_system` (Text)
*   `ip_address` (Text), `city` (Text), `region` (Text), `country` (Text), `isp` (Text)
*   `page_views_count` (Integer, Default: 1)
*   `has_viewed_product` (Boolean), `has_added_to_cart` (Boolean), `has_initiated_checkout` (Boolean), `has_purchased` (Boolean)
*   `total_purchased_amount` (Numeric, Default: 0), `order_id` (UUID)
*   `started_at` (Timestamp), `last_active_at` (Timestamp)

#### 9. `web_events`
*Real-time granular event stream for all visitor actions.*
*   `id` (UUID, Primary Key)
*   `session_id` (Text), `visitor_id` (Text)
*   `user_id` (UUID, References `profiles.id`, Nullable)
*   `event_type` (Text) - 'page_view', 'view_product', 'add_to_cart', 'remove_from_cart', 'initiate_checkout', 'purchase', 'wishlist_add'
*   `path` (Text), `page_title` (Text)
*   `metadata` (JSONB) - Event specific details (product info, price, cart value, order summary)
*   `device_type` (Text)
*   `created_at` (Timestamp)

### B. Relationships
*   `profiles` 1:N `orders`
*   `orders` 1:N `order_items`
*   `products` 1:N `order_items`
*   `visitor_sessions` 1:N `web_events` (via session_id)


---

## 4. Authentication & Authorization Flow

### Security Policies (RLS)
1.  **Public Access**:
    *   `products`: SELECT (Read-only) for everyone.
2.  **Order Placement**:
    *   `orders`: INSERT for everyone (Guests and Authenticated). SELECT for admins or matching `user_id`.
    *   `order_items`: INSERT for everyone. SELECT matching parent order.
    *   **Data Integrity update**: The foreign key `product_id` is set to `ON DELETE SET NULL`. This ensures that when an Admin permanently deletes a product, the historical order record remains intact (with `product_id` becoming null), preventing foreign key violation errors (409 Conflict).
3.  **Authenticated Data**:
    *   `profiles`: SELECT/UPDATE own profile.
4.  **Admin Access**:
    *   `products`: Full CRUD permissions.
    *   `orders`: Full CRUD permissions (Admins manage statuses and deletion).
    *   `profiles`: Read access for user/customer management list.

### Application Flow
1.  **Login**: User submits credentials to `/login`.
2.  **Verification**: Supabase verifies and returns a Session + JWT.
3.  **Role Check**: App queries `profiles` table for the logged-in user to check `role`.
4.  **Redirection**:
    *   If `role === 'admin'`: Redirect to `/admin/dashboard`.
    *   If `role === 'customer'`: Redirect to `/` or `/account`.
5.  **Protection**:
    *   Accessing `/admin/*` routes without the correct role triggers an immediate redirect to unauthorized/login page.

---

## 5. Implementation Plan

1.  **Setup**: Initialize Supabase project and connect it to the React app.
2.  **Database**: Run SQL scripts to create tables and set up Row Level Security (RLS) policies.
3.  **Auth Integration**: creating `AuthProvider` context and Login/Register pages.
4.  **Admin Layout**: Create a sidebar layout specifically for admin routes.
5.  **Product Management**: Build forms for creating/editing products and uploading images to Supabase Storage.
6.  **User Portal**: Build "My Orders" page fetching data from `orders` table.
7.  **Responsive Polishing**: Implemented mobile drawers, responsive grids, and narrow-device visibility fixes.
8.  **Community & Reviews**: Built a premium, glassmorphic review system with smart-merge relational logic and dynamic user avatars.
9.  **Admin UX Refinement**: Integrated real-time image previews and status badges to eliminate ambiguity during product management.

## 6. Deployment Strategy

### Hybrid Architecture (cPanel + Supabase)
Given the constraints of traditional cPanel hosting (MySQL-centric) versus our modern stack (PostgreSQL), we have adopted a **Hybrid Hosting Model**:

*   **Frontend (The "Head")**: Hosted on cPanel/Apache (Best Web Host BD).
    *   Served as static files (`dist` folder).
    *   Uses `.htaccess` rewrite rules to handle Client-Side Routing (SPA navigation).
*   **Backend (The "Body")**: Remains on Supabase Cloud.
    *   **Database**: PostgreSQL hosted on Supabase.
    *   **Auth**: Managed by Supabase Auth Service.
    *   **Storage**: Supabase Storage buckets.

**Why this works**: The Frontend is just a set of files that runs in the user's browser. Once loaded, the browser makes direct, secure API calls to Supabase over the internet. The cPanel server is only responsible for delivering the initial HTML/JS/CSS files. This avoids the massive complexity of migrating a cloud-native PostgreSQL backend to a legacy cPanel environment.

### External API Strategy: Google Apps Script
*   **Protocol**: `POST` requests with `mode: 'no-cors'`.
*   **Rationale**: Browser CORS policies strictly block cross-origin requests to Google Scripts unless the script is deployed as a Web App with access set to "Anyone" and the client uses opaque (`no-cors`) requests. This allows data submission (fire-and-forget) without requiring complex backend proxies.

### Mobile Notification Strategy: Telegram Bot API
*   **Protocol**: HTTPS `POST` directly to `https://api.telegram.org/bot<TOKEN>/sendMessage` with HTML formatting.
*   **Rationale**: Zero cost, zero SMS/subscription fees, instant sound push notifications delivered directly to the store owner's mobile device (iOS/Android) upon order creation. Contains comprehensive customer, shipping, itemized variant, and payment breakdown. Includes client-side fallback to ensure checkout never fails even if notification services encounter network anomalies.

### Meta Ad Tracking Strategy: Meta Pixel & Conversions API (CAPI) Preparation
*   **Client-Side Tracking (`src/lib/metaPixel.js`)**: Meta Pixel (ID: `28809507428687294`) embedded in `index.html` with advanced initialization.
*   **Persistent External ID**: Every visitor is assigned an `external_id` anchored to the persistent `visitor_id` generated by `src/lib/tracker.js` (or their authenticated Supabase `user_id`). This ID is continuously maintained across routes via `PageMonitor.jsx`.
*   **Advanced Matching**: Automatically cleans, formats, and supplies customer identity attributes to Meta: E.164 Bangladeshi phone numbers (`8801XXXXXXXXX`), sanitized lowercase email (`em`), first name (`fn`), last name (`ln`), city/district (`ct`), and country code (`bd`).
*   **Event Deduplication**: `Purchase` events carry an explicit `eventID` set to the unique Order ID (`order.id` or `orderDisplayId`). This guarantees that when server-side CAPI events are dispatched, Meta can deduplicate them with 100% accuracy, boosting Event Match Quality (EMQ) and campaign ROAS.


