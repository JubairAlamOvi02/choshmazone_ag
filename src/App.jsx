import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ErrorBoundary from './components/ErrorBoundary';
import CartDrawer from './components/Cart/CartDrawer';

// Loading Fallback Component
const PageLoader = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
    <div className="relative">
      <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-primary"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-8 w-8 rounded-full bg-white"></div>
      </div>
    </div>
    <p className="mt-4 text-gray-600 font-medium animate-pulse">Loading...</p>
  </div>
);

// ============================================
// LAZY LOADED ROUTES - Code Splitting
// ============================================

// Public Pages (most commonly accessed - smaller chunks)
const Home = lazy(() => import('./pages/Home'));
const Shop = lazy(() => import('./pages/Shop'));
const ProductDetails = lazy(() => import('./pages/ProductDetails'));
const Collections = lazy(() => import('./pages/Collections'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));

// Checkout Flow (loaded when user is ready to purchase)
const Checkout = lazy(() => import('./pages/Checkout'));
const OrderSuccess = lazy(() => import('./pages/OrderSuccess'));

// Customer Authentication & Account (loaded on demand)
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const UserProfile = lazy(() => import('./pages/account/Profile'));
const UserOrders = lazy(() => import('./pages/account/Orders'));

// Admin Panel (large bundle - only loaded for admins)
const AdminLogin = lazy(() => import('./pages/admin/Login'));
const AdminLayout = lazy(() => import('./layouts/AdminLayout'));
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminProducts = lazy(() => import('./pages/admin/Products'));
const AdminProductNew = lazy(() => import('./pages/admin/ProductNew'));
const ProductForm = lazy(() => import('./pages/admin/ProductForm'));
const AdminOrders = lazy(() => import('./pages/admin/Orders'));
const AdminCustomers = lazy(() => import('./pages/admin/Customers'));

// Protected Route - Keep as regular import for auth checks
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <Router>
          <AuthProvider>
            <CartProvider>
              <div className="app">
                <CartDrawer />
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<Home />} />
                    <Route path="/shop" element={<Shop />} />
                    <Route path="/product/:id" element={<ProductDetails />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/order-success" element={<OrderSuccess />} />
                    <Route path="/collections" element={<Collections />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/contact" element={<Contact />} />

                    {/* Customer Routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/profile" element={
                      <ProtectedRoute>
                        <UserProfile />
                      </ProtectedRoute>
                    } />
                    <Route path="/orders" element={
                      <ProtectedRoute>
                        <UserOrders />
                      </ProtectedRoute>
                    } />

                    {/* Admin Routes */}
                    <Route path="/admin/login" element={<AdminLogin />} />

                    <Route path="/admin" element={
                      <ProtectedRoute requireAdmin={true}>
                        <AdminLayout />
                      </ProtectedRoute>
                    }>
                      <Route index element={<Navigate to="dashboard" replace />} />
                      <Route path="dashboard" element={<AdminDashboard />} />
                      <Route path="products" element={<AdminProducts />} />
                      <Route path="products/new" element={<AdminProductNew />} />
                      <Route path="products/edit/:id" element={<ProductForm />} />
                      <Route path="orders" element={<AdminOrders />} />
                      <Route path="customers" element={<AdminCustomers />} />
                    </Route>
                  </Routes>
                </Suspense>
              </div>
            </CartProvider>
          </AuthProvider>
        </Router>
      </ToastProvider>
    </ErrorBoundary>
  )
}

export default App

