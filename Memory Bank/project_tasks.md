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

## Phase 5: Quality Assurance & Launch
- [ ] **Mobile Responsiveness Check**
  - [ ] Test on Mobile (Portrait/Landscape) and Tablet
- [ ] **Performance Optimization**
  - [ ] Image optimization (WebP format, lazy loading)
- [ ] **Accessibility Audit**
  - [ ] Check contrast ratios and Alt tags
- [ ] **Final Deployment**
  - [ ] Build for production
  - [ ] Deploy to host (Netlify/Vercel/GitHub Pages)
