import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import CartSidebar from './components/CartSidebar';
import Footer from './components/Footer';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { ProductProvider } from './context/ProductContext';
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Profile from './pages/Profile';
import About from './pages/About';
import PrivacyPolicy from './pages/PrivacyPolicy';
import ReturnsAndWarranty from './pages/ReturnsAndWarranty';
import ShippingInfo from './pages/ShippingInfo';
import FAQ from './pages/FAQ';
import Admin from './pages/Admin';
import AdminRoute from './components/AdminRoute';

function AppContent() {
  return (
    <Router>
      <div className="min-h-screen bg-white font-sans text-gray-900 flex flex-col">
        <Navbar />
        <CartSidebar />
        
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/login" element={<Login />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/about" element={<About />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/returns-and-warranty" element={<ReturnsAndWarranty />} />
            <Route path="/shipping-info" element={<ShippingInfo />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/my-admin" element={
              <AdminRoute>
                <Admin />
              </AdminRoute>
            } />
          </Routes>
        </main>

        <Footer />
      </div>
    </Router>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ProductProvider>
        <CartProvider>
          <AppContent />
        </CartProvider>
      </ProductProvider>
    </AuthProvider>
  );
}
