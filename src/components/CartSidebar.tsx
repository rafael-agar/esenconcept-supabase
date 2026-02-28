import React, { useState } from 'react';
import { X, Minus, Plus, Trash2, Tag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';

export default function CartSidebar() {
  const { 
    cart, removeFromCart, isCartOpen, setIsCartOpen, cartTotal, addToCart, decreaseQuantity, 
    shippingCost, finalTotal, applyCoupon, removeCoupon, appliedCoupon, discountAmount 
  } = useCart();
  const navigate = useNavigate();
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');

  const handleCheckout = () => {
    setIsCartOpen(false);
    navigate('/checkout');
  };

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError('');
    if (couponInput.trim()) {
      const success = applyCoupon(couponInput.trim());
      if (!success) {
        setCouponError('Cupón inválido o inactivo');
      } else {
        setCouponInput('');
      }
    }
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full max-w-md bg-white z-50 shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-serif font-bold">Tu Carrito</h2>
              <button
                onClick={() => setIsCartOpen(false)}
                className="text-gray-400 hover:text-black transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-4">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                    <ShoppingBagIcon size={32} />
                  </div>
                  <p>Tu carrito está vacío</p>
                  <button 
                    onClick={() => setIsCartOpen(false)}
                    className="text-black underline text-sm font-medium hover:text-gray-600"
                  >
                    Continuar comprando
                  </button>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.cartId} className="flex gap-4">
                    <div className="w-20 h-24 bg-gray-100 flex-shrink-0 overflow-hidden">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">{item.name}</h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {item.selectedColor && <span className="mr-2">Color: {item.selectedColor}</span>}
                          {item.selectedSize && <span>Talla: {item.selectedSize}</span>}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {item.isSale && item.salePrice ? (
                            <span className="font-bold text-red-500">${item.salePrice.toFixed(2)}</span>
                          ) : (
                            <span>${item.price.toFixed(2)}</span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center border border-gray-200">
                          <button 
                            onClick={() => decreaseQuantity(item.cartId)}
                            className="p-1 hover:bg-gray-50 text-gray-500"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="px-2 text-xs font-medium">{item.quantity}</span>
                          <button 
                            onClick={() => addToCart(item, item.selectedColor, item.selectedSize)}
                            className="p-1 hover:bg-gray-50 text-gray-500"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.cartId)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t border-gray-100 p-6 space-y-4 bg-gray-50">
                
                {/* Coupon Section */}
                <div className="mb-4">
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between bg-green-50 text-green-800 p-3 rounded-md border border-green-200">
                      <div className="flex items-center gap-2">
                        <Tag size={16} />
                        <span className="text-sm font-medium">{appliedCoupon.code} (-{appliedCoupon.discountPercentage}%)</span>
                      </div>
                      <button onClick={removeCoupon} className="text-green-800 hover:text-green-900">
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleApplyCoupon} className="flex gap-2">
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value)}
                        placeholder="Código de descuento"
                        className="flex-1 border border-gray-300 p-2 text-sm focus:outline-none focus:border-black rounded-sm"
                      />
                      <button 
                        type="submit"
                        className="bg-black text-white px-4 py-2 text-sm font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors rounded-sm"
                      >
                        Aplicar
                      </button>
                    </form>
                  )}
                  {couponError && <p className="text-red-500 text-xs mt-1">{couponError}</p>}
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-medium">${cartTotal.toFixed(2)}</span>
                </div>
                
                {appliedCoupon && (
                  <div className="flex justify-between items-center text-sm text-green-600">
                    <span>Descuento ({appliedCoupon.discountPercentage}%)</span>
                    <span className="font-medium">-${discountAmount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Envío</span>
                  <span className={`font-medium ${shippingCost === 0 ? 'text-green-600' : ''}`}>
                    {shippingCost === 0 ? 'Gratis' : `$${shippingCost.toFixed(2)}`}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-4 flex justify-between items-center">
                  <span className="text-lg font-serif font-bold">Total</span>
                  <span className="text-lg font-bold">${finalTotal.toFixed(2)}</span>
                </div>
                <button 
                  onClick={handleCheckout}
                  className="w-full bg-black text-white py-4 text-sm font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors"
                >
                  Pagar Ahora
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function ShoppingBagIcon({ size }: { size: number }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
            <path d="M3 6h18" />
            <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
    );
}
