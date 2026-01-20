
# Additional Tasks

## Completed
- [x] Update currency to Taka (৳) in all relevant files:
    - `src/components/ProductCard.jsx`
    - `src/components/Cart/CartItem.jsx`
    - `src/pages/ProductDetails.jsx`
    - `src/pages/Checkout.jsx`
    - `src/components/Shop/FilterSidebar.jsx`
- [x] Create Google Apps Script reference for splitting Timestamp into Date and Time columns (`GoogleAppsScript_Reference.js`)
    - Updated frontend to send local `orderDate` and `orderTime`.
    - Updated script reference to use client-provided timestamp.
- [x] Add Order ID and organize columns per user request.
    - Updated script reference to match exact header: `Date`, `Time`, `Timestamp`, `Order ID`, `Customer Name`, `Email`, `Phone`, `Address`, `City`, `Zip`, `Payment Method`, `Payment Details`, `Bkash Number`, `Transaction ID`, `Order Items`, `Total Amount`.
    - Implemented logic to split bKash details into separate columns.
- [x] Social Media Branding & Links Update:
    - Removed Twitter logo and links.
    - Integrated TikTok branding with the profile link: `https://www.tiktok.com/@choshma.zone?_t=ZS-93COQHamGZd`.
    - Updated Instagram and Facebook links to official profile URLs.

**Status**: All additional tasks requested by the user involving Currency, Google Sheets customizations, and Social Media branding have been implemented and verified.

## Next High-Priority Tasks: Admin & Backend
- [x] **Architecture Design**: Create `system_architecture.md` detailing Schema and Auth flow. (Completed)
- [x] **Supabase SDK**: Install `@supabase/supabase-js` and configure environment variables.
- [x] **Database Setup**: Run `supabase_schema.sql` in Supabase SQL Editor.
- [x] **Auth Context**: Create a React Context to manage User Session and Role state.
- [x] **Admin Pages**:
    - [x] Create `AdminLayout.jsx`
    - [x] Create `AdminDashboard.jsx`
    - [x] Create `AdminProducts.jsx` (List View)
    - [x] Create `AdminProductForm.jsx` (Add/Edit View)
- [x] **Product Migration**: Transferred from local JSON data to Supabase Database.
    - [x] Created API helpers (`src/lib/api/products.js`)
    - [x] Connected Admin Products List to Supabase
    - [x] Connected Admin Product Form (Add/Edit) to Supabase
    - [x] Connected Public Shop and Home pages to Supabase

## Phase 7: Customer Portal (Next)
- [x] **Authentication Pages**:
    - [x] Login Page (`src/pages/Login.jsx`)
    - [x] Register Page (`src/pages/Register.jsx`)
- [x] **Navbar Integration**: Show Login/User Menu in Navbar.
- [x] **Profile & Orders**:
    - [x] Create `UserProfile.jsx`
    - [x] Create `UserOrders.jsx`
- [x] **Order Synchronization**:
    - [x] Save Checkout orders to Supabase (`orders` & `order_items`)
    - [x] Implement live Admin Orders dashboard
    - [x] Add dynamic stats to Admin Dashboard (Sales, Counts)
- [x] **Frontend Polish**:
    - [x] Create About, Contact, and Collections pages.
    - [x] Implement automatic cart cleanup for deleted products.
    - [x] Fix PDP and Shop page database synchronization.
    - [x] Fix logout redirection to home page.
- [x] **Admin Customers Management**:
    - [x] Create Admin Customers page to list registered users.
    - [x] Add "Total Customers" count to Admin Dashboard stats.
    - [x] Enable the Customers route in Admin Layout and App routes.
- [x] **Advanced Product Features**:
    - [x] Multi-image upload support in Admin Panel.
    - [x] Interactive Image Gallery on Product Details Page.
    - [x] Dynamic secondary image hover effect on Product Cards.
    - [x] Safe product deletion with association checks.
    - [x] Product soft-delete/deactivation toggle (Active vs Inactive).
- [x] **Storefront UX & Performance**:
    - [x] Automatic filtering of inactive products on Shop and Home.
    - [x] Performance bottleneck fix for blocking UI (INP issue) via memoization and transitions.
    - [x] Unique filename generation for Supabase Storage to prevent 409 Conflict errors.
- [x] **Administrative Enhancements**:
    - [x] Admin Order Deletion capability with cascading cleanup.
    - [x] Improved error handling for database integrity constraints.
- [x] **Comprehensive Mobile Responsiveness**: 
    - [x] Full-screen side drawers for Navbar and Admin Sidebar.
    - [x] Collapsible filter system on Shop page.
    - [x] Responsive layout stacking for PDP and Checkout Summary.
    - [x] Table horizontal scroll support for Admin Dashboard.
- [x] **Narrow-Device UX Optimization**: 
    - [x] Fixed User icon visibility bug on narrow screens (flex-shrink fix).
    - [x] Increased tap target sizes for better mobile navigation.
- [x] **Tailwind CSS v4 Migration**:
    - [x] Migrated all pages and components to Tailwind CSS v4 utility classes.
    - [x] Deleted 20+ custom `.css` files across the project.
    - [x] Optimized Admin Dashboard with a premium "Glassmorphism" and high-contrast aesthetic.
    - [x] Fixed missing icons in Dashboard by refactoring to explicit iconography classes.
    - [x] Streamlined `index.css` to only use modern Tailwind `@theme` definitions.
- [x] **Shop Experience Modernization**:
    - [x] Redesigned Category and Frame Style filters into a "Premium Tag" system with active pulsing indicators.
    - [x] Implemented dynamic active filter chips for improved state visibility.
    - [x] Added dynamic page titles based on selected categories for better SEO and UX context.
- [x] **Product Details Page Premium Redesign**:
    - [x] Added breadcrumb navigation for improved site hierarchy and SEO.
    - [x] Implemented quantity selector with +/- increment controls.
    - [x] Integrated star rating display (4.8/5.0) for social proof.
    - [x] Created collapsible accordion sections for Product Highlights, Specifications, and Shipping.
    - [x] Added trust badges (Free Shipping, UV400 Protection, 7-Day Returns).
    - [x] Enhanced image gallery with zoom indicator on hover and smooth thumbnail transitions.
    - [x] Redesigned "Add to Shopping Bag" button with shopping bag icon, shadow effects, and smooth hover animations.
- [x] **Cart Functionality Enhancement**:
    - [x] Fixed addToCart function to properly handle quantity selection from product details page.
    - [x] Cart now correctly adds the selected quantity instead of always defaulting to 1 item.
- [x] **Navigation UI Update**:
    - [x] Updated navbar to 50% transparency with backdrop blur for modern glassmorphism effect.

**Current Status**: All primary integration and functional requirements for both Admin and Customer portals are **COMPLETED**. The system is fully operational with real-time Supabase synchronization.
