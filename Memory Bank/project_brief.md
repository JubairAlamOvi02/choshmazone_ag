# Project Brief: Sunglasses Ecommerce Website

## 1. Project Overview
We are building a robust, stylish ecommerce website dedicated to selling sunglasses. The platform will serve as a digital storefront, allowing users to browse styles and make purchases, while providing administrators with a powerful dashboard to manage products and orders. The solution leverages **Supabase** for a secure, scalable backend.

## 2. Objectives
- **Brand Presence**: Create a visually appealing site that establishes a strong brand identity.
- **User Experience**: Ensure a smooth, intuitive browsing and checkout process.
- **Dynamic Management**: Enable real-time product and order management via a secure Admin Panel.
- **Sales Conversion**: Optimize product display and call-to-actions to drive sales.

## 3. Target Audience
- **Fashion-forward individuals**: Looking for the latest trends.
- **Practical buyers**: Seeking UV protection and durable eyewear.
- **Gift shoppers**: Looking for accessories for others.

## 4. Functional Requirements
### Core Features
- **Homepage**: Hero banner, featured collections, and promotional highlights.
- **Product Catalog**: Grid view with filtering options (Frame Style, Lens Color, Price, Brand).
- **Product Details Page**: High-resolution image gallery, detailed descriptions, specifications, and "Add to Cart" functionality.
- **Shopping Cart**: Review selected items, adjust quantities.
- **Checkout Flow**: Guest/User checkout, shipping information, and payment integration (Support for **bKash** and **Cash on Delivery**).
- **User Portal**:
    - Registration and Login system.
    - View Order History and Profile.
- **Admin Panel (WordPress-like)**:
    - Secure Login for Admins.
    - **Dashboard**: Overview of orders, customers, and system status with live stats.
    - **Product Management**: CRUD operations (Create, Read, Update, Delete) for products.
    - **Order Management**: Monitor sales and update order statuses.
    - **Customer Management**: View registered user list and roles.
    - **Inventory Control**: Manage stock levels and active status.
    - **Database Visibility**: Access to schemas and tables for debugging.

## 5. Non-Functional Requirements
- **Responsive Design**: Mobile-first approach to ensure usability on phones and tablets.
- **Performance**: Fast loading times for image-heavy pages.
- **Accessibility**: adherence to basic web accessibility standards (WCAG).

## 6. Chosen Tech Stack
- **Frontend**: React (Vite), Lucide Icons, Vanilla CSS.
- **Backend/Data**: **Supabase** (PostgreSQL, Auth, Storage).
- **Redundancy**: Google Sheets Integration for order backups.
