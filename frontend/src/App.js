import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

import Header from './components/layout/Header';
import Footer from './components/layout/Footer';

// Public pages
import HomePage from './pages/HomePage';
import ProductListPage from './pages/ProductListPage';
import ProductDetailPage from './pages/ProductDetailPage';
import SalePage from './pages/SalePage';
import BlogPage from './pages/BlogPage';
import BlogDetailPage from './pages/BlogDetailPage';
import ContactPage from './pages/ContactPage';
import PolicyPage from './pages/PolicyPage';

// Auth pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';

// Customer pages (require login)
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import VnpayReturnPage from './pages/VnpayReturnPage';
import AccountPage from './pages/AccountPage';
import OrdersPage from './pages/OrdersPage';
import WishlistPage from './pages/WishlistPage';

// Admin pages
import AdminLayout from './pages/admin/AdminLayout';
import DashboardPage from './pages/admin/DashboardPage';
import AdminProductsPage from './pages/admin/AdminProductsPage';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';
import AdminCategoriesPage from './pages/admin/AdminCategoriesPage';
import AdminCustomersPage from './pages/admin/AdminCustomersPage';
import AdminVouchersPage from './pages/admin/AdminVouchersPage';
import AdminReviewsPage from './pages/admin/AdminReviewsPage';
import AdminBlogsPage from './pages/admin/AdminBlogPage';
import AdminReportsPage from './pages/admin/AdminReportsPage';
import AdminProductFormPage from './pages/admin/AdminProductFormPage';
import AdminBrandMaterialPage from './pages/admin/AdminBrandMaterialPage';

import './assets/css/index.css';

const PrivateRoute = () => {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loading"><div className="spinner" /></div>;
  return user ? <Outlet /> : <Navigate to="/dang-nhap" />;
};

const AdminRoute = () => {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loading"><div className="spinner" /></div>;
  if (!user || user.role !== 'admin') return <Navigate to="/" />;
  return <AdminLayout />;
};

const GuestRoute = () => {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loading"><div className="spinner" /></div>;
  return user ? <Navigate to="/" /> : <Outlet />;
};

const MainLayout = () => (
  <>
    <Header />
    <main className="main-content">
      <Outlet />
    </main>
    <Footer />
  </>
);

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <Routes>
            {/* Admin routes */}
            <Route path="/admin" element={<AdminRoute />}>
              <Route index element={<DashboardPage />} />
              <Route path="san-pham/tao-moi" element={<AdminProductFormPage />} />
              <Route path="san-pham/:id" element={<AdminProductFormPage />} />
              <Route path="san-pham" element={<AdminProductsPage />} />
              <Route path="don-hang" element={<AdminOrdersPage />} />
              <Route path="danh-muc" element={<AdminCategoriesPage />} />
              <Route path="thuong-hieu" element={<AdminBrandMaterialPage type="brand" />} />
              <Route path="chat-lieu" element={<AdminBrandMaterialPage type="material" />} />
              <Route path="khach-hang" element={<AdminCustomersPage />} />
              <Route path="voucher" element={<AdminVouchersPage />} />
              <Route path="danh-gia" element={<AdminReviewsPage />} />
              <Route path="bai-viet" element={<AdminBlogsPage />} />
              <Route path="bao-cao" element={<AdminReportsPage />} />
            </Route>

            {/* Main layout routes */}
            <Route element={<MainLayout />}>
              {/* Public routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/san-pham" element={<ProductListPage />} />
              <Route path="/san-pham/:slug" element={<ProductDetailPage />} />
              <Route path="/danh-muc/:categoryId" element={<ProductListPage />} />
              <Route path="/giam-gia" element={<SalePage />} />
              <Route path="/bai-viet" element={<BlogPage />} />
              <Route path="/bai-viet/:slug" element={<BlogDetailPage />} />
              <Route path="/lien-he" element={<ContactPage />} />
              <Route path="/chinh-sach" element={<PolicyPage />} />
              <Route path="/vnpay-return" element={<VnpayReturnPage />} />

              {/* Guest only routes */}
              <Route element={<GuestRoute />}>
                <Route path="/dang-nhap" element={<LoginPage />} />
                <Route path="/dang-ky" element={<RegisterPage />} />
                <Route path="/quen-mat-khau" element={<ForgotPasswordPage />} />
              </Route>

              {/* Protected routes */}
              <Route element={<PrivateRoute />}>
                <Route path="/gio-hang" element={<CartPage />} />
                <Route path="/thanh-toan" element={<CheckoutPage />} />
                <Route path="/tai-khoan" element={<AccountPage />} />
                <Route path="/don-hang" element={<OrdersPage />} />
                <Route path="/don-hang/:id" element={<OrdersPage />} />
                <Route path="/yeu-thich" element={<WishlistPage />} />
              </Route>
            </Route>
          </Routes>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
