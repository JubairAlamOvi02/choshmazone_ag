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
- **Product Catalog**: Advanced Grid view with "Premium Tag" filtering (Frame Style, Category, Price) and dynamic active filter chips for effortless navigation.
- **Product Details Page**: High-resolution interactive image gallery with thumbnail support, detailed descriptions, specifications, and "Add to Cart" functionality.
- **Shopping Cart**: Review selected items, adjust quantities.
- **Checkout Flow**: Guest/User checkout, shipping information with district-based delivery charges (৳60 for Dhaka, ৳120 for other districts), and payment integration (Support for **bKash** and **Cash on Delivery**).
- **User Portal**:
    - Registration and Login system.
    - View Order History and Profile.
    - **Session Intelligence**: "Session Active" choice screen for already logged-in users to navigate between Shop, Profile, and Admin areas.
- **Admin Panel (WordPress-like)**:
    - Secure Login for Admins.
    - **Dashboard**: Overview of orders, customers, and system status with **Live Sales Analytics (Recharts)**.
    - **Product Management**: Full CRUD operations + Advanced Multi-Image Upload and Gallery management.
    - **Order Management**: Monitor sales, update statuses, administrative deletion, and Comprehensive Order Details Modal.
    - **Customer Management**: View registered user list and roles.
    - **Inventory Control**: Manage stock levels and dynamic "Active/Inactive" visibility toggle.
    - **Database Visibility**: Access to schemas and tables for debugging.

## 5. Non-Functional Requirements
- **Responsive Design**: Mobile-first approach with optimized tap targets and fixed mobile product card layouts.
- **Performance**: Fast loading times via route splitting, image optimization (lazy loading), and API response caching.
- **Resilience**: Global Error Boundary protection and high-latency Auth strategies (15s timeouts).
- **Accessibility**: Adherence to basic web accessibility standards (WCAG).

## 6. Chosen Tech Stack
- **Frontend**: React (Vite), Lucide Icons, Tailwind CSS v4.
- **Backend/Data**: **Supabase** (PostgreSQL, Auth, Storage).
- **Redundancy**: Google Sheets Integration for order backups.
