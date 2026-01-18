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
*   **State Management**: React Context (for Auth State and Cart)
*   **Data Fetching**: `@supabase/supabase-js` client library
*   **Routing**: `react-router-dom` with Protected Routes

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
*   `image_url` (Text)
*   `is_active` (Boolean) - For soft deleting/hiding products
*   `created_at` (Timestamp)

#### 3. `orders`
*Order records.*
*   `id` (UUID, Primary Key)
*   `user_id` (UUID, References `profiles.id`)
*   `status` (Text) - 'pending', 'processing', 'shipped', 'cancelled'
*   `total_amount` (Numeric)
*   `shipping_address` (JSONB) - Stores snapshot of address
*   `created_at` (Timestamp)

#### 4. `order_items`
*Links products to orders.*
*   `id` (UUID, Primary Key)
*   `order_id` (UUID, References `orders.id`)
*   `product_id` (UUID, References `products.id`)
*   `quantity` (Integer)
*   `unit_price` (Numeric) - Snapshot of price at purchase time

### B. Relationships
*   `profiles` 1:N `orders`
*   `orders` 1:N `order_items`
*   `products` 1:N `order_items`

---

## 4. Authentication & Authorization Flow

### Security Policies (RLS)
1.  **Public Access**:
    *   `products`: SELECT (Read-only) for everyone.
2.  **Authenticated Data**:
    *   `orders`: INSERT for authenticated users (checkout). SELECT only for own rows (`auth.uid() == user_id`).
    *   `profiles`: SELECT/UPDATE own profile.
3.  **Admin Access**:
    *   `products`: INSERT, UPDATE, DELETE allowed only if `profiles.role` == 'admin'.
    *   `orders`: SELECT, UPDATE (status) all rows allowed only if `profiles.role` == 'admin'.

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
