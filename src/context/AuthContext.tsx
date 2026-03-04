import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Product, products } from '../data/products';
import { CartItem } from './CartContext';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  role?: 'customer' | 'admin';
}

export interface Order {
  id: string;
  date: string;
  total: number;
  status: 'Pendiente' | 'Pago Aprobado' | 'Enviado' | 'Entregado' | 'Cancelado';
  items: any[];
  paymentMethod: 'pago-movil' | 'transferencia';
  isGift?: boolean;
  giftDetails?: {
    recipientName: string;
    recipientEmail: string;
    message: string;
  };
  shippingAddress?: string;
  paymentDetails?: {
    depositorName?: string;
    depositorId?: string;
    bank?: string;
    referenceNumber?: string;
  };
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (name: string, email: string, password: string, phone: string, address: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  
  // Favorites
  favorites: string[];
  toggleFavorite: (productId: string) => void;
  isFavorite: (productId: string) => boolean;
  
  // Orders
  orders: Order[];
  addOrder: (order: Omit<Order, 'id' | 'date' | 'status'>) => Promise<Order | undefined>;
  fetchOrders: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  const fetchOrders = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (*)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const formattedOrders: Order[] = data.map(o => ({
          id: o.id,
          date: o.created_at,
          total: Number(o.total_amount),
          status: o.status,
          items: o.order_items.map((oi: any) => ({
            id: oi.products?.id,
            name: oi.products?.name,
            price: Number(oi.unit_price),
            image: oi.products?.image_url,
            quantity: oi.quantity,
            // Note: variants are not fully reconstructed here, simplified for history
          })),
          paymentMethod: o.payment_method,
          isGift: o.is_gift || false,
          giftDetails: o.gift_details || undefined,
          shippingAddress: o.shipping_address,
          paymentDetails: o.payment_details || undefined
        }));
        setOrders(formattedOrders);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const fetchFavorites = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('product_id')
        .eq('user_id', userId);

      if (error) throw error;

      if (data) {
        setFavorites(data.map(f => f.product_id));
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  };

  useEffect(() => {
    let subscription: any;

    if (user) {
      fetchOrders();
      fetchFavorites(user.id);

      // Subscribe to changes in orders table for this user
      subscription = supabase
        .channel(`public:orders:user:${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            fetchOrders();
          }
        )
        .subscribe();
    } else {
      setOrders([]);
      // Load from local storage if logged out
      const storedFavorites = localStorage.getItem('favorites');
      if (storedFavorites) {
        setFavorites(JSON.parse(storedFavorites));
      } else {
        setFavorites([]);
      }
    }

    return () => {
      if (subscription) supabase.removeChannel(subscription);
    };
  }, [user]);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email || '');
      } else {
        setIsLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email || '');
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string, email: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (data) {
        setUser({
          id: data.id,
          name: data.full_name || '',
          email: email,
          phone: data.phone || '',
          address: data.address || '',
          role: data.role || 'customer'
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Keep local storage for favorites for now (only if not logged in or as backup)
  useEffect(() => {
    if (!user) {
      const storedFavorites = localStorage.getItem('favorites');
      if (storedFavorites) setFavorites(JSON.parse(storedFavorites));
    }
  }, []);

  useEffect(() => {
    // Only save to local storage if not logged in, or maybe always as cache?
    // Let's save always for now to keep it simple, but prioritize DB on load
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }, [favorites]);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setFavorites([]); // Clear favorites on logout (will be reloaded from LS by useEffect if needed, or stay empty)
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  };

  const register = async (name: string, email: string, password: string, phone: string, address: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          phone,
          address,
        }
      }
    });
    
    if (error) throw error;

    if (data.user) {
      // Update profile with additional details
      // We use upsert to handle cases where the trigger might have already created the row
      // or if it hasn't created it yet.
      
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: data.user.id,
          full_name: name,
          phone: phone,
          address: address,
          role: 'customer'
        });

      if (profileError) {
        console.error('Error updating profile details:', profileError);
      }
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!user) return;
    
    const updates = {
      full_name: data.name !== undefined ? data.name : user.name,
      phone: data.phone !== undefined ? data.phone : user.phone,
      address: data.address !== undefined ? data.address : user.address,
    };

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (error) {
      console.error('Error updating profile:', error);
      throw error;
    }

    setUser(prev => prev ? { ...prev, ...data } : null);
  };

  const toggleFavorite = async (productId: string) => {
    const isFav = favorites.includes(productId);
    
    // Optimistic update
    setFavorites(prev => {
      if (isFav) {
        return prev.filter(id => id !== productId);
      }
      return [...prev, productId];
    });

    if (user) {
      try {
        if (isFav) {
          // Remove from DB
          const { error } = await supabase
            .from('favorites')
            .delete()
            .eq('user_id', user.id)
            .eq('product_id', productId);
          if (error) throw error;
        } else {
          // Add to DB
          const { error } = await supabase
            .from('favorites')
            .insert({ user_id: user.id, product_id: productId });
          if (error) throw error;
        }
      } catch (error) {
        console.error('Error updating favorites in DB:', error);
        // Revert optimistic update if needed (omitted for simplicity)
      }
    }
  };

  const isFavorite = (productId: string) => favorites.includes(productId);

  const addOrder = async (orderData: Omit<Order, 'id' | 'date' | 'status'>) => {
    if (!user) return;

    try {
      // 1. Insert Order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          user_id: user.id,
          total_amount: orderData.total,
          status: 'Pendiente',
          payment_method: orderData.paymentMethod,
          is_gift: orderData.isGift || false,
          gift_details: orderData.giftDetails || null,
          shipping_address: orderData.shippingAddress || user.address || 'Dirección no proporcionada',
          payment_details: orderData.paymentDetails || null
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      if (order) {
        // 2. Insert Order Items
        const orderItems = orderData.items.map((item: any) => ({
          order_id: order.id,
          product_id: item.id,
          quantity: item.quantity,
          unit_price: item.isSale && item.salePrice ? item.salePrice : item.price
        }));

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);

        if (itemsError) throw itemsError;

        // 3. Update local state
        const newOrder: Order = {
          id: order.id,
          date: order.created_at,
          total: Number(order.total_amount),
          status: order.status,
          items: orderData.items,
          paymentMethod: order.payment_method,
          isGift: order.is_gift,
          giftDetails: order.gift_details,
          shippingAddress: order.shipping_address,
          paymentDetails: order.payment_details
        };
        setOrders(prev => [newOrder, ...prev]);
        
        return newOrder;
      }
    } catch (error) {
      console.error('Error adding order:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
      register,
      resetPassword,
      updateProfile,
      favorites,
      toggleFavorite,
      isFavorite,
      orders,
      addOrder,
      fetchOrders
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a AuthProvider');
  }
  return context;
};
