import React, { useState, useEffect, useRef } from 'react';
import { ShoppingBag, Search, Menu, X, User, ChevronDown, ArrowRight, LogOut, Heart, Settings } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { useProducts } from '../context/ProductContext';

export default function Navbar() {
  const { cartCount, setIsCartOpen } = useCart();
  const { user, logout } = useAuth();
  const { products, categories } = useProducts();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollectionsOpen, setIsCollectionsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  const filteredProducts = searchQuery
    ? products.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 4)
    : [];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery)}`);
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Mobile Menu Button */}
            <div className="flex items-center md:hidden flex-shrink-0">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-gray-500 hover:text-black focus:outline-none"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>

            {/* Logo */}
            <div className="flex-1 flex items-center justify-center md:justify-start md:flex-none md:w-auto">
              <Link to="/" className="text-2xl font-serif font-bold tracking-wider">
                <img 
                  src="https://esenconcept.netlify.app/logo.png" 
                  alt="ESEN CONCEPT" 
                  className="h-8 w-auto object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex space-x-8 items-center">
              <Link to="/" className="text-sm font-medium text-gray-700 hover:text-black transition-colors uppercase tracking-wide">Inicio</Link>
              <Link to="/shop" className="text-sm font-medium text-gray-700 hover:text-black transition-colors uppercase tracking-wide">Tienda</Link>
              
              {/* Collections Dropdown */}
              <div 
                className="relative group"
                onMouseEnter={() => setIsCollectionsOpen(true)}
                onMouseLeave={() => setIsCollectionsOpen(false)}
              >
                <button 
                  className="flex items-center text-sm font-medium text-gray-700 hover:text-black transition-colors uppercase tracking-wide focus:outline-none"
                >
                  Cápsulas <ChevronDown size={14} className="ml-1" />
                </button>
                
                <AnimatePresence>
                  {isCollectionsOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute left-0 mt-0 w-48 bg-white border border-gray-100 shadow-lg py-2 z-50"
                    >
                      {categories.map((category) => (
                        <Link 
                          key={category.id}
                          to={`/shop?category=${encodeURIComponent(category.name)}`}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-black"
                        >
                          {category.name}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Link to="/about" className="text-sm font-medium text-gray-700 hover:text-black transition-colors uppercase tracking-wide">Sobre Mí</Link>
            </div>

            {/* Icons */}
            <div className="flex items-center space-x-4 flex-shrink-0">
              <button 
                onClick={() => setIsSearchOpen(true)}
                className="text-gray-500 hover:text-black transition-colors"
              >
                <Search size={20} />
              </button>
              
              {/* User Menu */}
              <div 
                className="relative"
                onMouseEnter={() => setIsUserMenuOpen(true)}
                onMouseLeave={() => setIsUserMenuOpen(false)}
              >
                <Link 
                  to={user ? "/profile" : "/login"}
                  className="text-gray-500 hover:text-black transition-colors block py-2"
                >
                  <User size={20} />
                </Link>

                <AnimatePresence>
                  {isUserMenuOpen && user && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-0 w-48 bg-white border border-gray-100 shadow-lg py-2 z-50 rounded-lg"
                    >
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                      <Link 
                        to="/profile?tab=profile" 
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-black"
                      >
                        <User size={16} /> Mi Perfil
                      </Link>
                      <Link 
                        to="/profile?tab=orders" 
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-black"
                      >
                        <ShoppingBag size={16} /> Mis Pedidos
                      </Link>
                      <Link 
                        to="/profile?tab=favorites" 
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-black"
                      >
                        <Heart size={16} /> Favoritos
                      </Link>
                      {user.role === 'admin' && (
                        <Link 
                          to="/my-admin" 
                          className="flex items-center gap-2 px-4 py-2 text-sm text-purple-600 hover:bg-purple-50"
                        >
                          <Settings size={16} /> Panel Admin
                        </Link>
                      )}
                      <button 
                        onClick={logout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 text-left"
                      >
                        <LogOut size={16} /> Cerrar Sesión
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button
                onClick={() => setIsCartOpen(true)}
                className="text-gray-500 hover:text-black transition-colors relative"
              >
                <ShoppingBag size={20} />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-black text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-b border-gray-100 overflow-hidden"
            >
              <div className="px-4 pt-2 pb-4 space-y-1">
                <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-black hover:bg-gray-50">INICIO</Link>
                <Link to="/shop" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-black hover:bg-gray-50">TIENDA</Link>
                
                <div className="px-3 py-2">
                  <span className="block text-base font-medium text-gray-900 mb-2">CÁPSULAS</span>
                  <div className="pl-4 space-y-2 border-l-2 border-gray-100">
                    {categories.map((category) => (
                      <Link 
                        key={category.id}
                        to={`/shop?category=${encodeURIComponent(category.name)}`}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="block text-sm text-gray-600 hover:text-black"
                      >
                        {category.name}
                      </Link>
                    ))}
                  </div>
                </div>

                <Link to="/about" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-black hover:bg-gray-50">SOBRE MÍ</Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Search Overlay */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[60] bg-white/95 backdrop-blur-xl flex flex-col items-center pt-32 px-4"
          >
            <button 
              onClick={() => setIsSearchOpen(false)}
              className="absolute top-8 right-8 text-gray-500 hover:text-black transition-colors"
            >
              <X size={32} />
            </button>

            <div className="w-full max-w-3xl">
              <form onSubmit={handleSearchSubmit} className="relative mb-12">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar productos..."
                  className="w-full text-4xl md:text-6xl font-serif font-bold bg-transparent border-b-2 border-gray-200 focus:border-black pb-4 outline-none placeholder:text-gray-300 transition-colors text-center"
                />
              </form>

              {searchQuery && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-8"
                >
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map(product => (
                      <Link 
                        key={product.id} 
                        to={`/product/${product.id}`}
                        onClick={() => setIsSearchOpen(false)}
                        className="flex items-center gap-4 group"
                      >
                        <div className="w-20 h-24 bg-gray-100 overflow-hidden">
                          <img 
                            src={product.image} 
                            alt={product.name} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                        <div>
                          <h4 className="font-medium text-lg group-hover:text-gray-600 transition-colors">{product.name}</h4>
                          <p className="text-gray-500 font-serif">${product.price.toFixed(2)}</p>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="col-span-full text-center text-gray-400 text-lg">
                      No se encontraron resultados para "{searchQuery}"
                    </div>
                  )}
                  
                  {filteredProducts.length > 0 && (
                    <div className="col-span-full text-center mt-8">
                      <button 
                        onClick={(e) => handleSearchSubmit(e)}
                        className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest border-b border-black pb-1 hover:text-gray-600 hover:border-gray-600 transition-colors"
                      >
                        Ver todos los resultados <ArrowRight size={16} />
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
