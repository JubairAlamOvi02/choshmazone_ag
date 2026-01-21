import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import CartDrawer from './components/Cart/CartDrawer';
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetails from './pages/ProductDetails';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import Collections from './pages/Collections';
import About from './pages/About';
import Contact from './pages/Contact';
// Customer Imports
import Login from './pages/Login';
import Register from './pages/Register';
import UserProfile from './pages/account/Profile';
import UserOrders from './pages/account/Orders';
// Admin Imports
import AdminLogin from './pages/admin/Login';
import AdminLayout from './layouts/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';
import AdminDashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/Products';
import AdminProductNew from './pages/admin/ProductNew';
import ProductForm from './pages/admin/ProductForm';
import AdminOrders from './pages/admin/Orders';
import AdminCustomers from './pages/admin/Customers';
// import './App.css'; 

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <CartProvider>
            <div className="app">
              <CartDrawer />
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
            </div>
          </CartProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  )
}

export default App
