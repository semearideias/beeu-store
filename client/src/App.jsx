import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import Layout from './components/Layout';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import QuoteRequest from './pages/QuoteRequest';
import QuoteCart from './pages/QuoteCart';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import MyQuotes from './pages/MyQuotes';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import ImportMakito from './pages/Admin/ImportMakito';
import ImportMakitoAdvanced from './pages/Admin/ImportMakitoAdvanced';
import ImageQueueManager from './pages/Admin/ImageQueueManager';
import AdminDashboard from './pages/Admin/AdminDashboard';
import AdminProducts from './pages/Admin/AdminProducts';
import AdminCategories from './pages/Admin/AdminCategories';
import AdminCategoriesDragDrop from './pages/Admin/AdminCategoriesDragDrop';
import AdminQuotesOld from './pages/Admin/AdminQuotes';
import AdminOrdersOld from './pages/Admin/AdminOrders';
import AdminLogin from './pages/AdminLogin';
import AdminLayout from './components/AdminLayout';
import AdminDashboardNew from './pages/AdminDashboard';
import AdminProductsNew from './pages/AdminProducts';
import AdminMenusNew from './pages/AdminMenus';
import AdminPageBuilder from './pages/AdminPageBuilder';
import AdminCategoriesManager from './pages/AdminCategoriesManager';
import AdminQuotes from './pages/AdminQuotes';
import AdminQuoteDetail from './pages/AdminQuoteDetail';
import AdminOrders from './pages/AdminOrders';
import AdminShipping from './pages/AdminShipping';
import AdminStoreSettings from './pages/AdminStoreSettings';
import AdminProductsCategories from './pages/AdminProductsCategories';
import AdminProductsManager from './pages/AdminProductsManager';
import AdminProductPrices from './pages/AdminProductPrices';
import ImportMakitoAdvancedNew from './pages/Admin/ImportMakitoAdvanced';
import ImportStatusNew from './pages/Admin/ImportStatus';
import AdminPagesNew from './pages/AdminPages';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';
import Page from './pages/Page';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
      // Aqui você poderia carregar dados do utilizador
    }
    setLoading(false);
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Carregando...</div>;
  }

  return (
    <Router>
      <Routes>
        {/* Novo Backoffice */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin/*"
          element={
            <ProtectedAdminRoute>
              <AdminLayout />
            </ProtectedAdminRoute>
          }
        >
          <Route path="dashboard" element={<AdminDashboardNew />} />
          <Route path="products" element={<AdminProductsNew />} />
          <Route path="products-categories" element={<AdminProductsManager />} />
          <Route path="import-makito" element={<ImportMakitoAdvancedNew />} />
          <Route path="import-status" element={<ImportStatusNew />} />
          <Route path="menus" element={<AdminMenusNew />} />
          <Route path="pages" element={<AdminPagesNew />} />
          <Route path="page-builder" element={<AdminPageBuilder />} />
          <Route path="categories" element={<AdminCategoriesManager />} />
          <Route path="product-prices/:productId" element={<AdminProductPrices />} />
          <Route path="quotes" element={<AdminQuotes />} />
          <Route path="quotes/:id" element={<AdminQuoteDetail />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="shipping" element={<AdminShipping />} />
          <Route path="store-settings" element={<AdminStoreSettings />} />
        </Route>

        {/* Admin Routes Antigos - Sem Layout */}
        <Route path="/admin-old/dashboard" element={isAuthenticated ? <AdminDashboard /> : <Navigate to="/login" />} />
        <Route path="/admin-old/products" element={isAuthenticated ? <AdminProducts /> : <Navigate to="/login" />} />
        <Route path="/admin-old/categories" element={isAuthenticated ? <AdminCategories /> : <Navigate to="/login" />} />
        <Route path="/admin-old/categories-dragdrop" element={isAuthenticated ? <AdminCategoriesDragDrop /> : <Navigate to="/login" />} />
        <Route path="/admin-old/quotes" element={isAuthenticated ? <AdminQuotesOld /> : <Navigate to="/login" />} />
        <Route path="/admin-old/orders" element={isAuthenticated ? <AdminOrdersOld /> : <Navigate to="/login" />} />
        <Route path="/admin-old/import-makito" element={<ImportMakito />} />
        <Route path="/admin-old/import-makito-advanced" element={<ImportMakitoAdvanced />} />
        <Route path="/admin-old/image-queue" element={<ImageQueueManager />} />

        {/* Site Routes - Com Layout */}
        <Route
          path="*"
          element={
            <Layout isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} user={user}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/products" element={<Products />} />
                <Route path="/products/:id" element={<ProductDetail />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/quote" element={<QuoteRequest />} />
                <Route path="/quote-cart" element={<QuoteCart />} />
                <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} setUser={setUser} />} />
                <Route path="/register" element={<Register setIsAuthenticated={setIsAuthenticated} setUser={setUser} />} />
                <Route path="/profile" element={isAuthenticated ? <Profile /> : <Navigate to="/login" />} />
                <Route path="/my-quotes" element={isAuthenticated ? <MyQuotes /> : <Navigate to="/login" />} />
                <Route path="/orders" element={isAuthenticated ? <Orders /> : <Navigate to="/login" />} />
                <Route path="/orders/:id" element={isAuthenticated ? <OrderDetail /> : <Navigate to="/login" />} />
                <Route path="/page/:slug" element={<Page />} />
              </Routes>
            </Layout>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
