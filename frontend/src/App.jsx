import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { CartProvider, CartContext } from './context/CartContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Products from './pages/Products';
import ProductDetails from './pages/ProductDetails';
import AdminProducts from './pages/admin/AdminProducts';
import AdminCategories from './pages/admin/AdminCategories';
import AdminOrders from './pages/admin/AdminOrders';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import MyOrders from './pages/MyOrders';
import OrderDetails from './pages/OrderDetails';
import OrderTracking from './pages/OrderTracking';

const Navigation = () => {
  const { user, logout } = useContext(AuthContext);
  const { cart } = useContext(CartContext);

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="text-xl font-bold text-gray-900">ShopInsight</Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link to="/products" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                Products
              </Link>
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-4">
            {user ? (
              <>
                <Link to="/cart" className="relative p-2 text-gray-400 hover:text-gray-500">
                  <ShoppingBag className="h-6 w-6" />
                  {cart.itemCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-primary-600 rounded-full">
                      {cart.itemCount}
                    </span>
                  )}
                </Link>
                <div className="ml-3 relative flex items-center gap-4 text-sm text-gray-700">
                  <span>Hi, {user.name}</span>
                  <Link to="/orders" className="text-gray-500 hover:text-gray-900 font-medium">Orders</Link>
                  {user.role === 'admin' && (
                    <Link to="/admin/analytics" className="text-primary-600 hover:text-primary-800 font-medium">Admin</Link>
                  )}
                  <button onClick={logout} className="text-gray-500 hover:text-gray-900">Logout</button>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-500 hover:text-gray-900 font-medium px-3 py-2 rounded-md text-sm">Login</Link>
                <Link to="/register" className="bg-primary-600 text-white hover:bg-primary-500 px-3 py-2 rounded-md text-sm font-medium">Register</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

const Home = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
            <span className="block">Welcome to</span>
            <span className="block text-primary-600">ShopInsight</span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            The premium e-commerce platform with powerful sales analytics.
          </p>
          <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
            <div className="rounded-md shadow">
              <Link to="/products" className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 md:py-4 md:text-lg md:px-10">
                Start Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="w-64 bg-white border-r border-gray-200 p-6 flex flex-col">
        <h2 className="text-xl font-bold text-gray-900 mb-8">ShopInsight Admin</h2>
        <nav className="flex-1 space-y-2">
          <Link to="/" className="block px-4 py-2 text-gray-600 hover:bg-gray-50 hover:text-primary-600 rounded-md">
            Storefront
          </Link>
          <Link to="/admin/analytics" className="block px-4 py-2 text-gray-600 hover:bg-gray-50 hover:text-primary-600 rounded-md">
            Dashboard
          </Link>
          <Link to="/admin/orders" className="block px-4 py-2 text-gray-600 hover:bg-gray-50 hover:text-primary-600 rounded-md">
            Orders
          </Link>
          <Link to="/admin/products" className="block px-4 py-2 text-gray-600 hover:bg-gray-50 hover:text-primary-600 rounded-md">
            Products
          </Link>
          <Link to="/admin/categories" className="block px-4 py-2 text-gray-600 hover:bg-gray-50 hover:text-primary-600 rounded-md">
            Categories
          </Link>
        </nav>
      </div>
      <div className="flex-1 bg-gray-50 overflow-auto">
        {children}
      </div>
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <Navigation />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:slug" element={<ProductDetails />} />
            
            <Route element={<ProtectedRoute />}>
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/orders" element={<MyOrders />} />
              <Route path="/orders/:id" element={<OrderDetails />} />
              <Route path="/orders/:id/track" element={<OrderTracking />} />
            </Route>
            
            <Route element={<ProtectedRoute requireAdmin={true} />}>
              <Route path="/admin/analytics" element={<AdminLayout><AdminAnalytics /></AdminLayout>} />
              <Route path="/admin/products" element={<AdminLayout><AdminProducts /></AdminLayout>} />
              <Route path="/admin/categories" element={<AdminLayout><AdminCategories /></AdminLayout>} />
              <Route path="/admin/orders" element={<AdminLayout><AdminOrders /></AdminLayout>} />
            </Route>
          </Routes>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
};

export default App;
