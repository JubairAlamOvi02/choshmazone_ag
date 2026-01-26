# Technology Stack: Choshmazone

This document outlines the core technologies and tools used in the Choshmazone e-commerce project.

## Project Overview Summary
Choshmazone is a modern e-commerce platform built with a robust and scalable technology stack:
*   **Frontend**: React 19, Vite, and Tailwind CSS v4.
*   **Backend**: Supabase (PostgreSQL, Auth, Storage, and RLS).
*   **Integrations**: Google Sheets for order tracking and bKash/COD for payments.
*   **Architecture**: Role-based access and Tailwind-powered responsive design.

---

## 1. Frontend
*   **Framework**: [React 19](https://react.dev/) - A JavaScript library for building user interfaces.
*   **Build Tool**: [Vite](https://vitejs.dev/) - A fast development environment and bundler.
*   **Routing**: [React Router 7](https://reactrouter.com/) - For client-side navigation and protected admin/user routes.
*   **State Management**: **React Context API** - Used for managing the Shopping Cart and Authentication state.
*   **Styling**: **Tailwind CSS v4** - A utility-first CSS framework for rapid UI development and high-performance designs.
*   **Icons**: [Lucide React](https://lucide.dev/) - A library of beautiful, consistent icons.

## 2. Backend & Database (Supabase)
The project utilizes [Supabase](https://supabase.com/) as a Comprehensive Backend-as-a-Service (BaaS).
*   **Database**: **PostgreSQL** - Relational database for storing Products, Orders, User Profiles, and Categories.
*   **Authentication**: **Supabase Auth** - Secure, production-ready authentication (Email/Password).
*   **Row Level Security (RLS)**: PostgreSQL policies ensuring that users can only access their own data and only admins can manage inventory.
*   **Storage**: **Supabase Storage** - Hosting and serving product images.

## 3. External Integrations
*   **Order Management**: **Google Sheets API** - Orders are automatically synced to a Google Sheet via a custom **Google Apps Script** for business tracking.
*   **Payments**: 
    *   **bKash**: Digital payment integration for mobile banking.
    *   **Cash on Delivery (COD)**: Support for offline payments.

## 4. Key Architectural Features
*   **Role-Based Access Control (RBAC)**: Distinct permissions for 'Admin' and 'Customer' users.
*   **Responsive Design**: Mobile-first approach ensuring compatibility across all device sizes.
*   **SEO Optimized**: Semantic HTML structure and meta-tag management.
## 5. Mobile Design System
The application utilizes a **Mobile-First Responsive Strategy**:
- **Dynamic Drawers**: Custom-built side-drawer navigation for both public and admin interfaces.
- **Responsive Flex/Grid**: Intelligent layout stacking (e.g., PD gallery and Checkout flows).
- **Narrow-Device Optimization**: Explicit `flex-shrink` and `min-width` management for high-density, narrow mobile displays (e.g., OnePlus, iPhone Pro models).
- **Touch-First Elements**: Optimized tap targets (min 40x40px).
- **Premium Filter System**: Modern "Premium Tag" filtering with pulsing active indicators and dynamic chips for a fluid mobile-first and desktop exploration experience.
- **Glassmorphism Navigation**: Semi-transparent navbar (50% opacity) with backdrop blur for a modern, layered visual effect.
- **Enhanced Product Details**: Premium PDP featuring breadcrumbs, quantity selectors, star ratings, collapsible information sections, trust badges, and interactive image galleries with zoom indicators.
- **Premium CTAs**: Redesigned action buttons with icons, shadow effects, and smooth hover transitions for improved conversion rates.
- **Smart Delivery System**: District-based delivery charge calculation with dependent location dropdowns (District → Thana) for accurate shipping costs across Bangladesh.
- **Progressive Web App (PWA)**: Full manifest support (`manifest.json`) and service worker (`sw.js`) caching for offline-ready performance and installability.
- **Client-Side Caching**: Custom `cacheManager` utilizing LocalStorage with TTL for optimized API performance.
- **Advanced UX System**: Global toast notification system and real-time product search with debounced filtering.
- **Elite Performance & Analytics**: 
    - **Recharts Integration**: Professional-grade data visualization for sales and order trends in the admin panel.
    - **Skeleton Shimmering Loaders**: High-end perceived performance using a centralized skeleton system for all primary pages.
    - **Fulfillment Tracking**: Dynamic visual timeline for customer order status (Placed → Processing → Shipped → Delivered).
    - **Resilience**: Comprehensive Error Boundaries and Auth timeout protection to prevent blank screens.
- **Elite Performance**: 
    - **Route-Based Splitting**: Uses `React.lazy` and `Suspense` for on-demand chunk loading, reducing initial payload.
    - **Build Optimization**: Custom `manualChunks` in Vite for vendor library caching.
    - **Minification**: Integrated Terser for aggressive code reduction.
    - **LCP Tuning**: Optimized critical path images with `fetchpriority="high"` and eager loading.
    - **Lazy Rendering**: Asynchronous decoding and lazy loading for off-screen product assets.
