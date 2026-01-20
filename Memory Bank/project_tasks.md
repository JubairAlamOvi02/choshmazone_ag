# Project Task List: Sunglasses Ecommerce

## Phase 1: Setup & Initialization
- [x] **Project Setup**
  - [x] Initialize git repository
  - [x] Set up project structure (folders for assets, styles, scripts)
  - [x] Select and install tech stack (e.g., Vite + React or Vanilla JS)
- [x] **Asset Preparation**
  - [x] Collect high-resolution product images (sunglasses)
  - [x] Create/download logo and branding assets

## Phase 2: Design System & UI Architecture
- [x] **Global Styling**
  - [x] Define color palette (Main, Accent, Neutral, Error/Success)
  - [x] Set up typography (Headings, Body text)
  - [x] Create `index.css` with CSS variables/Tailwind config
  - [x] Implement responsive grid/layout container
- [x] **UI Components**
  - [x] Button component (Primary, Secondary, Ghost)
  - [x] Product Card (Image, Title, Price, Add to Cart)
  - [x] Navbar (Logo, Navigation Links, Cart Icon)
  - [x] Footer (Links, Socials, Copyright)
  - [x] Form Inputs (Text, Email, Checkbox, Radio)

## Phase 3: Core Features Implementation
- [x] **Homepage**
  - [x] functionality for Hero Banner (Slider or Static Hero)
  - [x] "Featured Collections" section
  - [x] Promotional banner/highlight section
- [x] **Product Catalog**
  - [x] Product Grid Layout
  - [x] Sidebar/Modal for Filters (Frame Style, Lens Color, Brand)
  - [x] Sorting functionality (Price: Low-High, Newest)
- [x] **Product Details Page (PDP)**
  - [x] Image Gallery (Main image + thumbnails)
  - [x] Product Info (Title, Description, Specifications)
  - [x] "Add to Cart" Logic (UI only)
- [x] **Shopping Cart**
  - [x] Cart Drawer or Dedicated Page
  - [x] Update Quantity logic
  - [x] Remove Item logic
  - [x] Subtotal calculation

## Phase 4: Checkout & Payments
- [x] **Checkout Form**
  - [x] Guest User Details (Name, Email, Phone)
  - [x] Shipping Address Inputs
- [x] **Payment Integration**
  - [x] **bKash Integration**
    - [x] UI for bKash number input/instruction
    - [x] Logic to handle bKash verification (mock or API)
  - [x] **Cash on Delivery (COD)**
    - [x] Option selection logic
    - [x] Order confirmation triggers
  - [x] **Google Sheets Integration**
    - [x] Send order data to Google Sheets via Apps Script
    - [x] Clear cart on successful order
- [x] **Order Success**
  - [x] "Thank You" page with Order Summary

## Phase 5: Admin Panel & Backend Integration (Supabase)
- [x] **Backend Setup (Supabase)**
  - [x] Initialize Supabase project
  - [x] **Database Schema**: Create tables (`profiles`, `products`, `orders`, `order_items`)
  - [x] **Security**: Configure RLS (Row Level Security) policies
  - [x] **Storage**: Create bucket for product images
- [x] **Authentication**
  - [x] Integrate Supabase Auth (Sign Up, Sign In, Sign Out)
  - [x] Implement Role-Based Access Control (Admin vs Customer)
  - [x] Create `ProtectedRoutes` for Admin pages
- [x] **Admin Dashboard**
  - [x] Create Admin Layout (Sidebar, Navigation)
  - [x] **Product Management**: CRUD operations with Storage integration
  - [x] **Orders Management**: Live list and status updates
  - [x] **Customers Management**: List registered users and view roles
  - [x] **Dynamic Stats**: Sales, Order counts, and Customer counts

## Phase 6: Customer Portal
- [x] **Account Management**
  - [x] Created "My Profile" page
  - [x] Created "My Orders" history page
- [x] **Site Navigation Refinement**
  - [x] Role-based Navbar (Login/Logout/Dashboard)
  - [x] Logout redirection to Home
- [x] **Supporting Pages**
  - [x] Collections Page (category-based filtering)
  - [x] About Page (branded story)
  - [x] Contact Page (lead generation form)

## Phase 7: UI/UX Synchronization & Quality
- [x] **Data Integrity**
  - [x] Sync PDP and Shop with Supabase
  - [x] Automated Cart Validation (remove deleted items)
- [x] **Error Handling**
  - [x] UUID validation for guest orders
  - [x] RLS policy fixes for multi-table inserts (Orders/Items)
- [x] **Final QA**
  - [x] Mobile Responsiveness Audit
  - [x] Performance Optimization (WebP assets)
  - [x] Server cleanup (port management)
- [x] **Advanced Features (Post-Launch Refinements)**
  - [x] Multi-image Gallery support (PDP and Shop hover)
  - [x] Product activation/deactivation system
  - [x] Administrative Order deletion with cascading cleanup
  - [x] Performance: Fixed Blocking UI (INP) via memoization and transitions.
  - [x] Storage: Fixed filename collision (409 Conflict) with random suffixes.
  - [x] **Mobile Refresh (Task Id: 33)**: Implemented full mobile responsiveness across all pages.
  - [x] **Mobile UX (Task Id: 167)**: Resolved specific icon visibility and tap target issues on high-end OnePlus/narrow mobile devices.
- [x] **Phase 8: Design Modernization (Tailwind v4)**
  - [x] Integrated Tailwind CSS v4 and configured `@theme` tokens.
  - [x] Migrated all Admin Panel pages (Inventory, Orders, Members, Dashboard).
  - [x] Migrated all Storefront pages (Home, Shop, PDP, Checkout).
  - [x] Removed 21+ legacy `.css` files and cleaned up global styles.
  - [x] Optimized Dashboard Overview with explicit Tailwind iconography classes.

