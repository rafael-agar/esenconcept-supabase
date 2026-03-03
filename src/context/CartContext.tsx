import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Product } from '../data/products';
import { supabase } from '../lib/supabase';

export interface CartItem extends Product {
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
  cartId: string;
}

export interface Coupon {
  code: string;
  discountPercentage: number;
  isActive: boolean;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, color?: string, size?: string, quantity?: number) => boolean;
  decreaseQuantity: (cartId: string) => void;
  removeFromCart: (cartId: string) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
  cartTotal: number;
  cartCount: number;
  shippingCost: number;
  finalTotal: number;
  baseShippingCost: number;
  setBaseShippingCost: (amount: number) => Promise<void>;
  
  // Coupon & Admin Logic
  discountAmount: number;
  appliedCoupon: Coupon | null;
  applyCoupon: (code: string) => boolean;
  removeCoupon: () => void;
  coupons: Coupon[];
  addCoupon: (coupon: Coupon) => Promise<void>;
  toggleCouponStatus: (code: string) => Promise<void>;
  deleteCoupon: (code: string) => Promise<void>;
  freeShippingThreshold: number;
  setFreeShippingThreshold: (amount: number) => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // Admin Settings
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(100);
  const [baseShippingCost, setBaseShippingCost] = useState(6);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*');
      
      if (error) throw error;
      if (data) {
        const threshold = data.find(s => s.key === 'free_shipping_threshold')?.value;
        const cost = data.find(s => s.key === 'base_shipping_cost')?.value;
        if (threshold !== undefined) setFreeShippingThreshold(Number(threshold));
        if (cost !== undefined) setBaseShippingCost(Number(cost));
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const fetchCoupons = async () => {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*');
      
      if (error) throw error;
      if (data) {
        setCoupons(data.map(c => ({
          code: c.code,
          discountPercentage: Number(c.discount_percentage),
          isActive: c.is_active
        })));
      }
    } catch (error: any) {
      if (error?.code === 'PGRST205') {
        console.warn('Tabla de cupones no encontrada. Ejecuta el script SQL.');
      } else {
        console.error('Error fetching coupons:', error);
      }
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchCoupons();
  }, []);

  const updateShippingThreshold = async (amount: number) => {
    try {
      const { error } = await supabase
        .from('settings')
        .upsert({ key: 'free_shipping_threshold', value: String(amount) });
      if (error) throw error;
      setFreeShippingThreshold(amount);
    } catch (error) {
      console.error('Error updating shipping threshold:', error);
    }
  };

  const updateBaseShippingCost = async (amount: number) => {
    try {
      const { error } = await supabase
        .from('settings')
        .upsert({ key: 'base_shipping_cost', value: String(amount) });
      if (error) throw error;
      setBaseShippingCost(amount);
    } catch (error) {
      console.error('Error updating base shipping cost:', error);
    }
  };

  const addToCart = (product: Product, color?: string, size?: string, quantity: number = 1): boolean => {
    // Determine available stock
    let availableStock = product.stock || 0;
    if (product.variants && product.variants.length > 0) {
      const variant = product.variants.find(v => v.color === color && v.size === size);
      if (variant) {
        availableStock = variant.stock;
      }
    }

    const cartId = `${product.id}-${color || 'default'}-${size || 'default'}`;
    const existingItem = cart.find(item => item.cartId === cartId);
    const currentQuantity = existingItem ? existingItem.quantity : 0;

    if (currentQuantity + quantity > availableStock) {
      return false;
    }

    setCart(prevCart => {
      if (existingItem) {
        return prevCart.map(item =>
          item.cartId === cartId ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prevCart, { ...product, quantity: quantity, selectedColor: color, selectedSize: size, cartId }];
    });
    setIsCartOpen(true);
    return true;
  };

  const decreaseQuantity = (cartId: string) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.cartId === cartId);
      if (existingItem && existingItem.quantity > 1) {
        return prevCart.map(item =>
          item.cartId === cartId ? { ...item, quantity: item.quantity - 1 } : item
        );
      }
      return prevCart.filter(item => item.cartId !== cartId);
    });
  };

  const removeFromCart = (cartId: string) => {
    setCart(prevCart => prevCart.filter(item => item.cartId !== cartId));
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
  };

  // Coupon Logic
  const applyCoupon = (code: string) => {
    const coupon = coupons.find(c => c.code.toUpperCase() === code.toUpperCase() && c.isActive);
    if (coupon) {
      setAppliedCoupon(coupon);
      return true;
    }
    return false;
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  // Admin Coupon Logic
  const addCoupon = async (coupon: Coupon) => {
    try {
      const { error } = await supabase
        .from('coupons')
        .upsert({
          code: coupon.code,
          discount_percentage: coupon.discountPercentage,
          is_active: coupon.isActive
        });
      if (error) throw error;
      setCoupons(prev => [...prev.filter(c => c.code !== coupon.code), coupon]);
    } catch (error) {
      console.error('Error adding coupon:', error);
    }
  };

  const toggleCouponStatus = async (code: string) => {
    const coupon = coupons.find(c => c.code === code);
    if (!coupon) return;
    try {
      const { error } = await supabase
        .from('coupons')
        .update({ is_active: !coupon.isActive })
        .eq('code', code);
      if (error) throw error;
      setCoupons(prev => prev.map(c => c.code === code ? { ...c, isActive: !c.isActive } : c));
    } catch (error) {
      console.error('Error toggling coupon status:', error);
    }
  };

  const deleteCoupon = async (code: string) => {
    try {
      const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('code', code);
      if (error) throw error;
      setCoupons(prev => prev.filter(c => c.code !== code));
      if (appliedCoupon?.code === code) {
        setAppliedCoupon(null);
      }
    } catch (error) {
      console.error('Error deleting coupon:', error);
    }
  };

  const cartTotal = cart.reduce((total, item) => {
    const itemPrice = item.isSale && item.salePrice ? item.salePrice : item.price;
    return total + itemPrice * item.quantity;
  }, 0);
  const cartCount = cart.reduce((count, item) => count + item.quantity, 0);

  const discountAmount = appliedCoupon ? (cartTotal * (appliedCoupon.discountPercentage / 100)) : 0;
  const subtotalAfterDiscount = cartTotal - discountAmount;

  // Shipping Logic
  // Free if: 3 or more items OR subtotalAfterDiscount >= freeShippingThreshold
  const shippingCost = (cartCount >= 3 || subtotalAfterDiscount >= freeShippingThreshold) ? 0 : baseShippingCost;
  
  const finalTotal = subtotalAfterDiscount + shippingCost;

  return (
    <CartContext.Provider value={{
      cart,
      addToCart,
      decreaseQuantity,
      removeFromCart,
      clearCart,
      isCartOpen,
      setIsCartOpen,
      cartTotal,
      cartCount,
      shippingCost,
      finalTotal,
      discountAmount,
      appliedCoupon,
      applyCoupon,
      removeCoupon,
      coupons,
      addCoupon,
      toggleCouponStatus,
      deleteCoupon,
      freeShippingThreshold,
      setFreeShippingThreshold: updateShippingThreshold,
      baseShippingCost,
      setBaseShippingCost: updateBaseShippingCost
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
