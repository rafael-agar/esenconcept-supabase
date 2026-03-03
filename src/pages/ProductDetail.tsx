import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Product } from '../data/products';
import { useProducts } from '../context/ProductContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Star, Minus, Plus, ChevronDown, ChevronUp, X, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ProductCard from '../components/ProductCard';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { products, refreshProducts } = useProducts();
  const product = products.find(p => p.id === id);
  const { addToCart } = useCart();
  const { toggleFavorite, isFavorite, isAuthenticated } = useAuth();

  useEffect(() => {
    refreshProducts();
  }, [refreshProducts]);

  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [notification, setNotification] = useState<{ message: string, type: 'error' | 'success' } | null>(null);

  // Extract unique colors and sizes from variants
  const colorMap = new Map<string, string>();
  product?.variants?.forEach(v => {
    if (!colorMap.has(v.color)) {
      colorMap.set(v.color, v.colorCode);
    }
  });
  const colors = Array.from(colorMap.entries());
  const sizes = Array.from(new Set(product?.variants?.map(v => v.size) || []));

  // Find selected variant
  const selectedVariant = product?.variants?.find(v => v.color === selectedColor && v.size === selectedSize);

  // Scroll to top when product changes
  useEffect(() => {
    window.scrollTo(0, 0);
    if (product) {
      setSelectedImage(product.image);
      // Set default selections if variants exist
      if (product.variants && product.variants.length > 0) {
        setSelectedColor(product.variants[0].color);
        setSelectedSize(product.variants[0].size);
      }
    }
  }, [id, product]);

  // Update image if variant has one
  useEffect(() => {
    if (selectedVariant?.imageUrl) {
      setSelectedImage(selectedVariant.imageUrl);
    }
  }, [selectedVariant]);

  // Clear notification after 3 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Handle Recently Viewed
  useEffect(() => {
    if (product) {
      const viewedIds = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
      
      // Get product details for viewed IDs (excluding current)
      const viewedProducts = viewedIds
        .map((vid: string) => products.find(p => p.id === vid))
        .filter((p: Product | undefined): p is Product => p !== undefined && p.id !== product.id)
        .slice(0, 4);
      
      setRecentlyViewed(viewedProducts);

      // Update local storage with current product
      const newViewedIds = [product.id, ...viewedIds.filter((vid: string) => vid !== product.id)].slice(0, 8);
      localStorage.setItem('recentlyViewed', JSON.stringify(newViewedIds));
    }
  }, [product]);

  if (!product) {
    return <div className="pt-32 text-center">Producto no encontrado</div>;
  }

  // Get related products (same category) or fallback to others if not enough
  const getRelatedProducts = () => {
    let related = products
      .filter(p => p.category === product.category && p.id !== product.id);
    
    if (related.length < 4) {
      const others = products
        .filter(p => p.category !== product.category && p.id !== product.id)
        .sort(() => 0.5 - Math.random())
        .slice(0, 4 - related.length);
      related = [...related, ...others];
    }
    return related;
  };

  const relatedProducts = getRelatedProducts();

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  // Calculate current available stock based on selection or product total
  const currentStock = product.variants && product.variants.length > 0
    ? (selectedVariant?.stock || 0)
    : (product.stock || 0);

  // Reset quantity if it exceeds new stock limit when variant changes
  useEffect(() => {
    if (quantity > currentStock && currentStock > 0) {
      setQuantity(currentStock);
    }
  }, [currentStock]);

  const handleIncreaseQuantity = () => {
    if (quantity < currentStock) {
      setQuantity(quantity + 1);
    } else {
      setNotification({ message: 'Has alcanzado el stock máximo disponible', type: 'error' });
    }
  };

  const handleAddToCart = () => {
    if (product.variants && product.variants.length > 0 && !selectedVariant) {
      setNotification({ message: 'Por favor selecciona color y talla', type: 'error' });
      return;
    }
    
    if (currentStock === 0) {
      setNotification({ message: 'Producto agotado', type: 'error' });
      return;
    }

    if (quantity > currentStock) {
      setNotification({ message: 'No hay suficiente stock', type: 'error' });
      return;
    }

    const success = addToCart(product, selectedColor, selectedSize, quantity);
    
    if (success) {
      setNotification({ message: 'Producto añadido al carrito', type: 'success' });
    } else {
      setNotification({ message: 'No puedes añadir más cantidad de la disponible en stock (revisa tu carrito)', type: 'error' });
    }
  };

  const handleFavoriteClick = () => {
    if (isAuthenticated) {
      toggleFavorite(product.id);
    } else {
      setNotification({ message: 'Inicia sesión para agregar a favoritos', type: 'error' });
    }
  };

  return (
    <div className="pt-24 pb-20 px-4 max-w-7xl mx-auto">
      {/* Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className={`fixed top-24 left-1/2 z-50 px-6 py-3 rounded-full shadow-lg text-white text-sm font-bold uppercase tracking-widest ${
              notification.type === 'error' ? 'bg-red-500' : 'bg-black'
            }`}
          >
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Back Button */}
      <button 
        onClick={() => navigate(-1)}
        className="mb-8 flex items-center gap-2 text-gray-500 hover:text-black transition-colors uppercase text-sm font-bold tracking-widest"
      >
        <X size={20} /> Volver
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-20">
        {/* Image Gallery */}
        <div className="space-y-4">
          <div className="aspect-[3/4] bg-gray-100 overflow-hidden relative">
            <motion.img 
              key={selectedImage}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              src={selectedImage || product.image} 
              alt={product.name} 
              className="w-full h-full object-cover"
            />
            {/* Favorite Button on Main Image */}
            <button
              onClick={handleFavoriteClick}
              className="absolute top-4 right-4 z-10 p-3 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors shadow-sm"
            >
              <Heart 
                size={24} 
                className={isFavorite(product.id) ? "fill-red-500 text-red-500" : "text-gray-600"} 
              />
            </button>
          </div>
          <div className="grid grid-cols-5 gap-4">
            {product.images && product.images.length > 0 ? (
              product.images.map((img, index) => (
                <div 
                  key={index} 
                  onClick={() => setSelectedImage(img)}
                  className={`aspect-square bg-gray-100 overflow-hidden cursor-pointer hover:opacity-80 transition-all ${selectedImage === img ? 'ring-2 ring-black' : ''}`}
                >
                  <img 
                    src={img} 
                    alt={`${product.name} view ${index + 1}`} 
                    className="w-full h-full object-cover"
                  />
                </div>
              ))
            ) : (
              <div className="aspect-square bg-gray-100 overflow-hidden cursor-pointer hover:opacity-80 transition-all ring-2 ring-black">
                <img 
                  src={product.image} 
                  alt={product.name} 
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
        </div>

        {/* Product Info */}
        <div className="flex flex-col">
          <h1 className="text-3xl font-serif font-bold mb-2">{product.name}</h1>
          
          <div className="flex items-center gap-4 mb-6">
            <div className="flex text-yellow-500">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} size={16} fill="currentColor" />
              ))}
            </div>
            <span className="text-sm text-gray-500">(24 reviews)</span>
          </div>

          <p className="text-gray-600 mb-6 leading-relaxed">
            {product.description || 'Sin descripción disponible.'}
          </p>

          <div className="flex items-center gap-4 mb-8">
            {product.isSale && product.salePrice ? (
              <>
                <span className="text-2xl font-bold text-red-500">${product.salePrice.toFixed(2)}</span>
                <span className="text-xl text-gray-400 line-through">${product.price.toFixed(2)}</span>
              </>
            ) : (
              <span className="text-2xl font-bold">${(selectedVariant?.price || product.price).toFixed(2)}</span>
            )}
          </div>

          {/* Color Selection */}
          {colors.length > 0 && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-bold uppercase tracking-widest">Color: <span className="text-gray-500 font-medium normal-case">{selectedColor}</span></h3>
              </div>
              <div className="flex flex-wrap gap-3">
                {colors.map(([colorName, colorCode]) => (
                  <button
                    key={colorName}
                    onClick={() => setSelectedColor(colorName)}
                    className={`group relative flex items-center justify-center w-10 h-10 rounded-full transition-all ${selectedColor === colorName ? 'ring-2 ring-black ring-offset-2' : 'ring-1 ring-gray-200 hover:ring-gray-400'}`}
                    title={colorName}
                  >
                    <span 
                      className="w-8 h-8 rounded-full border border-black/5" 
                      style={{ backgroundColor: colorCode }}
                    />
                    {selectedColor === colorName && (
                      <span className="absolute -bottom-1 -right-1 bg-black text-white rounded-full p-0.5">
                        <Star size={8} fill="currentColor" />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Size Selection */}
          {sizes.length > 0 && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-bold uppercase tracking-widest">Talla: <span className="text-gray-500 font-medium normal-case">{selectedSize}</span></h3>
                <button className="text-[10px] underline uppercase tracking-widest text-gray-400 hover:text-black">Guía de tallas</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`min-w-[48px] h-12 px-3 border text-sm font-bold transition-all ${selectedSize === size ? 'border-black bg-black text-white' : 'border-gray-200 text-gray-700 hover:border-black'}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="mb-8">
            <h3 className="text-sm font-bold uppercase tracking-widest mb-3">Cantidad</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center border border-gray-300">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-3 hover:bg-gray-50"
                >
                  <Minus size={16} />
                </button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <button 
                  onClick={handleIncreaseQuantity}
                  className="p-3 hover:bg-gray-50"
                >
                  <Plus size={16} />
                </button>
              </div>
              {((product.variants && product.variants.length > 0) ? (selectedColor && selectedSize) : true) && (
                <span className={`text-sm font-medium ${currentStock === 0 ? 'text-red-500' : (currentStock < 5 ? 'text-orange-500' : 'text-green-600')}`}>
                  {currentStock === 0 ? 'Agotado' : `Stock disponible: ${currentStock}`}
                </span>
              )}
            </div>
          </div>

          <div className="flex gap-4 mb-12">
            <button 
              onClick={handleAddToCart}
              disabled={currentStock === 0 && (product.variants && product.variants.length > 0 ? !!selectedVariant : true)}
              className={`flex-1 py-4 text-sm font-bold uppercase tracking-widest transition-colors ${
                (currentStock === 0 && (product.variants && product.variants.length > 0 ? !!selectedVariant : true))
                ? 'bg-gray-300 cursor-not-allowed' 
                : 'bg-black text-white hover:bg-gray-800'
              }`}
            >
              {(currentStock === 0 && (product.variants && product.variants.length > 0 ? !!selectedVariant : true)) ? 'Agotado' : 'Agregar al Carrito'}
            </button>
            <button 
              onClick={handleFavoriteClick}
              className={`px-6 border border-gray-300 flex items-center justify-center hover:border-black transition-colors ${isFavorite(product.id) ? 'bg-red-50 border-red-200' : ''}`}
            >
              <Heart 
                size={24} 
                className={isFavorite(product.id) ? "fill-red-500 text-red-500" : "text-gray-600"} 
              />
            </button>
          </div>

          {/* Accordions */}
          <div className="border-t border-gray-200">
            <div className="border-b border-gray-200">
              <button
                onClick={() => toggleSection('description')}
                className="w-full flex justify-between items-center py-4 text-left font-bold uppercase tracking-widest text-sm hover:text-gray-600"
              >
                Descripción
                {openSection === 'description' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              <AnimatePresence>
                {openSection === 'description' && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pb-4 text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                      {product.longDescription || product.description || 'Sin descripción disponible.'}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="border-b border-gray-200">
              <button
                onClick={() => toggleSection('care')}
                className="w-full flex justify-between items-center py-4 text-left font-bold uppercase tracking-widest text-sm hover:text-gray-600"
              >
                Cuidados
                {openSection === 'care' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              <AnimatePresence>
                {openSection === 'care' && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pb-4 text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                      {product.careInstructions || 'No hay instrucciones de cuidado disponibles.'}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="border-t border-gray-200 pt-20 mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-serif font-bold mb-4">También te podría gustar</h2>
            <div className="w-12 h-0.5 bg-black mx-auto"></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
            {relatedProducts.map((relatedProduct) => (
              <ProductCard key={relatedProduct.id} product={relatedProduct} />
            ))}
          </div>
        </section>
      )}

      {/* Recently Viewed */}
      {recentlyViewed.length > 0 && (
        <section className="border-t border-gray-200 pt-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-serif font-bold mb-4">Vistos Recientemente</h2>
            <div className="w-12 h-0.5 bg-black mx-auto"></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
            {recentlyViewed.map((viewedProduct) => (
              <ProductCard key={viewedProduct.id} product={viewedProduct} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
