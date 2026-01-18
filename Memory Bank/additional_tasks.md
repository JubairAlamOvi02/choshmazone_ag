
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

**Status**: All additional tasks requested by the user involving Currency and Google Sheets customizations have been implemented and verified.

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
- [ ] **Product Migration**: Plan transition from local JSON data to Supabase Database.
    - [x] Created API helpers (`src/lib/api/products.js`)
    - [x] Connected Admin Products List to Supabase
    - [x] Connected Admin Product Form (Add/Edit) to Supabase

## Phase 7: Customer Portal (Next)
- [x] **Authentication Pages**:
    - [x] Login Page (`src/pages/Login.jsx`)
    - [x] Register Page (`src/pages/Register.jsx`)
- [x] **Navbar Integration**: Show Login/User Menu in Navbar.
- [x] **Profile & Orders**:
    - [x] Create `UserProfile.jsx`
    - [x] Create `UserOrders.jsx`
