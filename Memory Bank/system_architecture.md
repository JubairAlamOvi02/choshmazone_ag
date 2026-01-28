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
    *   `SearchBar`: Debounced multi-field filtering.
    *   `ErrorBoundary`: Global crash protection.
    *   `Data Services`: Intelligent manual merging for relational data (e.g., Reviews -> Profiles) to bypass missing DB foreign key constraints and minimize console errors.
*   **PWA** (Implemented): Service Worker (`sw.js`) with offline caching for assets/images and Manifest support.
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
*   `highlights` (Text) - Bulleted highlights for PDP
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
*Links products to orders.*
*   `id` (UUID, Primary Key)
*   `order_id` (UUID, References `orders.id`)
*   `product_id` (UUID, References `products.id`)
*   `quantity` (Integer)
*   `unit_price` (Numeric) - Snapshot of price at purchase time

#### 5. `reviews`
*Customer feedback and ratings.*
*   `id` (UUID, Primary Key)
*   `product_id` (UUID, References `products.id`)
*   `user_id` (UUID, References `profiles.id`)
*   `rating` (Integer) - 1 to 5 stars
*   `comment` (Text)
*   `created_at` (Timestamp)

### B. Relationships
*   `profiles` 1:N `orders`
*   `orders` 1:N `order_items`
*   `products` 1:N `order_items`

---

## 4. Authentication & Authorization Flow

### Security Policies (RLS)
1.  **Public Access**:
    *   `products`: SELECT (Read-only) for everyone.
2.  **Order Placement**:
    *   `orders`: INSERT for everyone (Guests and Authenticated). SELECT for admins or matching `user_id`.
    *   `order_items`: INSERT for everyone. SELECT matching parent order.
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
