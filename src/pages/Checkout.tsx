import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useProducts } from '../context/ProductContext';
import { supabase } from '../lib/supabase';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, CreditCard, Truck, MapPin, Mail, User, ShieldCheck, Smartphone, Banknote, Tag, X, Copy, Check, Share2 } from 'lucide-react';
import { motion } from 'motion/react';
import Spinner from '../components/Spinner';
import FreeShippingProgress from '../components/FreeShippingProgress';

export default function Checkout() {
  const { cart, cartTotal, cartSubtotal, saleDiscount, clearCart, shippingCost, finalTotal, appliedCoupon, discountAmount, applyCoupon, removeCoupon } = useCart();
  const { user, isAuthenticated, addOrder } = useAuth();
  const { products } = useProducts();
  const navigate = useNavigate();
  const location = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'pago-movil' | 'transferencia'>('pago-movil');
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const sharePaymentDetails = () => {
    const details = paymentMethod === 'pago-movil' 
      ? `Datos de Pago Móvil ESEN:\nCédula: V-14345345\nBanco: BNC\nTeléfono: 0414-4231212`
      : `Datos de Transferencia ESEN:\nBanco: Banesco\nCuenta: 0134-0067-97-0671033669\nCédula: 22416850\nTeléfono: 04144326786\nTitular: Nombre Titular`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Datos de Pago ESEN',
        text: details,
      }).catch(err => {
        if (err.name !== 'AbortError') {
          copyToClipboard(details, 'all');
        }
      });
    } else {
      copyToClipboard(details, 'all');
    }
  };

  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    postalCode: '',
    depositorName: '',
    depositorId: '',
    bank: '',
    referenceNumber: '',
    isGift: false,
    recipientName: '',
    recipientEmail: '',
    giftMessage: ''
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } });
    } else if (user) {
      // Pre-fill form with user data
      setFormData(prev => ({
        ...prev,
        email: user.email,
        firstName: user.name.split(' ')[0] || '',
        lastName: user.name.split(' ').slice(1).join(' ') || '',
        address: user.address || ''
      }));
    }
  }, [isAuthenticated, user, navigate, location]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    try {
      // Add order to history in Supabase
      const newOrder = await addOrder({
        total: finalTotal,
        items: cart,
        paymentMethod,
        isGift: formData.isGift,
        giftDetails: formData.isGift ? {
          recipientName: formData.recipientName,
          recipientEmail: formData.recipientEmail,
          message: formData.giftMessage
        } : undefined,
        shippingAddress: `${formData.address}, ${formData.city}, ${formData.postalCode}`,
        paymentDetails: {
          depositorName: formData.depositorName,
          depositorId: formData.depositorId,
          bank: formData.bank,
          referenceNumber: formData.referenceNumber
        }
      });

      if (newOrder) {
        // Update inventory via RPC function
        try {
          console.log('Starting inventory update for cart:', cart);
          const inventoryItems: any[] = [];
          
          cart.forEach(item => {
            // 1. Discount the main product (the bundle itself or the regular product)
            inventoryItems.push({
              id: item.id,
              variantId: item.selectedVariantId || null,
              quantity: item.quantity,
              selectedColor: item.selectedColor || null,
              selectedSize: item.selectedSize || null
            });

            // 2. If it's a bundle, we ALSO discount its components
            if (item.isBundle && item.bundleItems && item.bundleItems.length > 0) {
              console.log(`Processing bundle components for: ${item.name}`, item.bundleItems);
              item.bundleItems.forEach(bundleItem => {
                const baseProduct = products.find(p => p.id === bundleItem.productId);
                const variant = baseProduct?.variants?.find(v => v.id === bundleItem.variantId);
                
                inventoryItems.push({
                  id: bundleItem.productId,
                  variantId: bundleItem.variantId || null,
                  quantity: bundleItem.quantity * item.quantity,
                  selectedColor: variant?.color || null,
                  selectedSize: variant?.size || null
                });
              });
            }
          });

          console.log('Sending inventory update to Supabase:', inventoryItems);

          if (inventoryItems.length > 0) {
            const { data: rpcResult, error: inventoryError } = await supabase.rpc('update_inventory', { 
              items: inventoryItems
            });

            if (inventoryError) {
              console.error('Error updating inventory via RPC:', inventoryError);
            } else {
              console.log('Inventory updated successfully:', rpcResult);
            }
          }
        } catch (invErr) {
          console.error('Exception updating inventory:', invErr);
        }

        // Send confirmation email via Edge Function
        try {
          // Using service_role key provided by user to bypass "Invalid JWT" issues with user session
          // WARNING: In a production app, this key should not be exposed in the frontend.
          const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndycHNxbWR3aHdicnVxZ3lqZGlzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjI2Nzc4OCwiZXhwIjoyMDg3ODQzNzg4fQ.ym_3yVpT-jRSQx1gLh1Qt9xW7WBQ9LsNEjjYs3XFA_Q';
          
          const payload = {
            order: {
              ...newOrder,
              // Explicitly add snake_case properties to support the OLD version of the Edge Function
              // in case the deployment didn't go through correctly.
              total_amount: finalTotal, 
              shipping_address: `${formData.address}, ${formData.city}, ${formData.postalCode}`,
              payment_method: paymentMethod,
              is_gift: formData.isGift,
              gift_details: formData.isGift ? {
                recipientName: formData.recipientName,
                recipientEmail: formData.recipientEmail,
                message: formData.giftMessage
              } : undefined,
              payment_details: {
                referenceNumber: formData.referenceNumber,
                bank: formData.bank
              },
              
              // Ensure camelCase properties are also present and correct
              total: finalTotal,
              
              user_email: formData.email,
              user_name: `${formData.firstName} ${formData.lastName}`,
              items: cart
            }
          };

          console.log('Sending email payload:', payload);

          const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL || 'https://wrpsqmdwhwbruqgyjdis.supabase.co'}/functions/v1/send-order-email`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
              },
              body: JSON.stringify(payload)
            }
          );

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Error sending email:', errorData);
          } else {
            const resultData = await response.json();
            console.log('Email sent successfully via service_role', resultData);
            
            // Check for partial failures (e.g. Resend restrictions)
            if (resultData.results?.customer?.error) {
              console.warn('Customer email failed:', resultData.results.customer.error);
              if (JSON.stringify(resultData.results.customer.error).includes('resend.dev')) {
                alert('NOTA: El correo al cliente no se envió porque estás usando el dominio de prueba de Resend (onboarding@resend.dev). Solo puedes enviar correos a tu propia dirección verificada. El pedido sí se guardó correctamente.');
              }
            }
          }
        } catch (emailError) {
          console.error('Failed to send confirmation email:', emailError);
          // Continue to success screen even if email fails
        }
      }

      setIsProcessing(false);
      setIsSuccess(true);
      clearCart();
    } catch (error: any) {
      console.error('Error processing order:', error);
      if (error?.code === 'PGRST204' && (error?.message?.includes('gift_details') || error?.message?.includes('is_gift'))) {
        alert('Error de sistema: Faltan columnas en la base de datos (gift_details). Por favor, ejecuta el script SQL de actualización en Supabase.');
      } else {
        alert('Hubo un error al procesar tu pedido. Por favor, intenta de nuevo.');
      }
      setIsProcessing(false);
    }
  };

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  if (cart.length === 0 && !isSuccess) {
    return (
      <div className="pt-32 pb-20 px-4 max-w-7xl mx-auto text-center">
        <h1 className="text-3xl font-serif font-bold mb-4">Tu carrito está vacío</h1>
        <p className="text-gray-500 mb-8">Agrega productos para continuar con el pago.</p>
        <button 
          onClick={() => navigate('/shop')}
          className="bg-black text-white px-8 py-3 text-sm font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors"
        >
          Ir a la Tienda
        </button>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="pt-32 pb-20 px-4 max-w-md mx-auto text-center">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle size={40} className="text-green-600" />
        </motion.div>
        <h1 className="text-3xl font-serif font-bold mb-4">¡Gracias por tu compra!</h1>
        <p className="text-gray-500 mb-8">
          Hemos recibido tu pedido correctamente. En las próximas 24 horas nos estaremos comunicando contigo mientras confirmamos tu pago.
        </p>
        <button 
          onClick={() => navigate('/')}
          className="bg-black text-white px-8 py-3 text-sm font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors"
        >
          Volver al Inicio
        </button>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-20 px-4 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-serif font-bold mb-8 text-center">Finalizar Compra</h1>
        
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column: Forms */}
          <div className="lg:w-2/3 space-y-6">
            <form id="checkout-form" onSubmit={handleSubmit}>
              {/* Contact Info */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Mail size={18} /> Contacto
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Email</label>
                    <input 
                      type="email" 
                      name="email"
                      required
                      disabled
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:border-black transition-colors bg-gray-50 cursor-not-allowed"
                      placeholder="tu@email.com"
                    />
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <MapPin size={18} /> Dirección de Envío
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Nombre</label>
                    <input 
                      type="text" 
                      name="firstName"
                      required
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:border-black transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Apellido</label>
                    <input 
                      type="text" 
                      name="lastName"
                      required
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:border-black transition-colors"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Dirección</label>
                    <input 
                      type="text" 
                      name="address"
                      required
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:border-black transition-colors"
                      placeholder="Calle, número, colonia..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Ciudad</label>
                    <input 
                      type="text" 
                      name="city"
                      required
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:border-black transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Código Postal</label>
                    <input 
                      type="text" 
                      name="postalCode"
                      required
                      value={formData.postalCode}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:border-black transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Gift Option */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <input 
                    type="checkbox" 
                    id="isGift"
                    name="isGift"
                    checked={formData.isGift}
                    onChange={handleInputChange}
                    className="w-5 h-5 accent-black cursor-pointer"
                  />
                  <label htmlFor="isGift" className="text-lg font-bold cursor-pointer select-none">
                    ¿Es un regalo?
                  </label>
                </div>

                {formData.isGift && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-4 pt-2 border-t border-gray-100"
                  >
                    <p className="text-sm text-gray-500 italic">
                      Agrega una dedicatoria personalizada y los datos de la persona que recibirá el regalo.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Nombre del Destinatario</label>
                        <input 
                          type="text" 
                          name="recipientName"
                          required={formData.isGift}
                          value={formData.recipientName}
                          onChange={handleInputChange}
                          className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:border-black transition-colors"
                          placeholder="¿Para quién es?"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Email del Destinatario</label>
                        <input 
                          type="email" 
                          name="recipientEmail"
                          required={formData.isGift}
                          value={formData.recipientEmail}
                          onChange={handleInputChange}
                          className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:border-black transition-colors"
                          placeholder="email@destinatario.com"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Dedicatoria / Mensaje</label>
                      <textarea 
                        name="giftMessage"
                        required={formData.isGift}
                        value={formData.giftMessage}
                        onChange={handleInputChange}
                        rows={4}
                        className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:border-black transition-colors resize-none"
                        placeholder="Escribe un mensaje especial..."
                      />
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Payment Info */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <CreditCard size={18} /> Pago Seguro
                </h2>
                
                <div className="flex gap-4 mb-6">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('pago-movil')}
                    className={`flex-1 p-4 border rounded-lg flex flex-col items-center gap-2 transition-colors ${paymentMethod === 'pago-movil' ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <Smartphone size={24} />
                    <span className="text-sm font-bold">Pago Móvil</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('transferencia')}
                    className={`flex-1 p-4 border rounded-lg flex flex-col items-center gap-2 transition-colors ${paymentMethod === 'transferencia' ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <Banknote size={24} />
                    <span className="text-sm font-bold">Transferencia</span>
                  </button>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg mb-6 border border-gray-200">
                  <h3 className="font-bold mb-4 text-sm uppercase tracking-wider">Datos para el pago:</h3>
                  {paymentMethod === 'pago-movil' ? (
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                        <span className="text-gray-500">Cédula:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold">V-14345345</span>
                          <button 
                            type="button"
                            onClick={() => copyToClipboard('V-14345345', 'pm-cedula')}
                            className="p-1 hover:bg-gray-200 rounded transition-colors text-gray-400 hover:text-black"
                          >
                            {copiedField === 'pm-cedula' ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                        <span className="text-gray-500">Banco:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold">BNC</span>
                          <button 
                            type="button"
                            onClick={() => copyToClipboard('BNC', 'pm-banco')}
                            className="p-1 hover:bg-gray-200 rounded transition-colors text-gray-400 hover:text-black"
                          >
                            {copiedField === 'pm-banco' ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Teléfono:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold">0414-4231212</span>
                          <button 
                            type="button"
                            onClick={() => copyToClipboard('0414-4231212', 'pm-telefono')}
                            className="p-1 hover:bg-gray-200 rounded transition-colors text-gray-400 hover:text-black"
                          >
                            {copiedField === 'pm-telefono' ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                        <span className="text-gray-500">Banco:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold">Banesco</span>
                          <button 
                            type="button"
                            onClick={() => copyToClipboard('Banesco', 'tr-banco')}
                            className="p-1 hover:bg-gray-200 rounded transition-colors text-gray-400 hover:text-black"
                          >
                            {copiedField === 'tr-banco' ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                        <span className="text-gray-500">Cuenta:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold">0134-0067-97-0671033669</span>
                          <button 
                            type="button"
                            onClick={() => copyToClipboard('0134-0067-97-0671033669', 'tr-cuenta')}
                            className="p-1 hover:bg-gray-200 rounded transition-colors text-gray-400 hover:text-black"
                          >
                            {copiedField === 'tr-cuenta' ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                        <span className="text-gray-500">Cédula:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold">22416850</span>
                          <button 
                            type="button"
                            onClick={() => copyToClipboard('22416850', 'tr-cedula')}
                            className="p-1 hover:bg-gray-200 rounded transition-colors text-gray-400 hover:text-black"
                          >
                            {copiedField === 'tr-cedula' ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                        <span className="text-gray-500">Teléfono:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold">04144326786</span>
                          <button 
                            type="button"
                            onClick={() => copyToClipboard('04144326786', 'tr-telefono')}
                            className="p-1 hover:bg-gray-200 rounded transition-colors text-gray-400 hover:text-black"
                          >
                            {copiedField === 'tr-telefono' ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Titular:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold">Nombre Titular</span>
                          <button 
                            type="button"
                            onClick={() => copyToClipboard('Nombre Titular', 'tr-titular')}
                            className="p-1 hover:bg-gray-200 rounded transition-colors text-gray-400 hover:text-black"
                          >
                            {copiedField === 'tr-titular' ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={sharePaymentDetails}
                    className="mt-6 w-full flex items-center justify-center gap-2 py-3 px-4 bg-white border border-gray-200 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-gray-100 transition-colors shadow-sm"
                  >
                    <Share2 size={14} />
                    {copiedField === 'all' ? '¡Copiado!' : 'Compartir todos los datos'}
                  </button>
                </div>

                <h3 className="font-bold mb-4 text-sm uppercase tracking-wider mt-8">Reportar Pago</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Nombre del Depositante</label>
                    <input 
                      type="text" 
                      name="depositorName"
                      required
                      value={formData.depositorName}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:border-black transition-colors"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Número de Cédula</label>
                      <input 
                        type="text" 
                        name="depositorId"
                        required
                        value={formData.depositorId}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:border-black transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Banco Emisor</label>
                      <input 
                        type="text" 
                        name="bank"
                        required
                        value={formData.bank}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:border-black transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Número de Referencia</label>
                    <input 
                      type="text" 
                      name="referenceNumber"
                      required
                      value={formData.referenceNumber}
                      onChange={(e) => {
                        // Only allow numbers and limit length if it's pago movil (optional but good UX)
                        const value = e.target.value.replace(/\D/g, '');
                        if (paymentMethod === 'pago-movil' && value.length > 4) return;
                        setFormData(prev => ({ ...prev, referenceNumber: value }));
                      }}
                      className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:border-black transition-colors"
                      placeholder={paymentMethod === 'pago-movil' ? "Últimos 4 dígitos" : "Número de referencia completo"}
                      maxLength={paymentMethod === 'pago-movil' ? 4 : undefined}
                    />
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Right Column: Order Summary */}
          <div className="lg:w-1/3">
            <FreeShippingProgress />
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 sticky top-24">
              <h2 className="text-lg font-bold mb-6 border-b border-gray-100 pb-4">Resumen del Pedido</h2>
              
              <div className="space-y-4 mb-6 max-h-60 overflow-y-auto pr-2">
                {cart.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="w-16 h-20 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium line-clamp-2">{item.name}</h4>
                      <p className="text-xs text-gray-500 mt-1">
                        {item.selectedColor && <span className="mr-2">Color: {item.selectedColor}</span>}
                        {item.selectedSize && <span>Talla: {item.selectedSize}</span>}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Cant: {item.quantity}</p>
                      <p className="text-sm font-bold mt-1">
                        {item.isSale && item.salePrice ? (
                          <span className="text-red-500">${(item.salePrice * item.quantity).toFixed(2)}</span>
                        ) : (
                          <span>${(item.price * item.quantity).toFixed(2)}</span>
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Coupon Section */}
              <div className="mb-6">
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
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      placeholder="Código de descuento"
                      className="flex-1 border border-gray-300 p-2 text-sm focus:outline-none focus:border-black rounded-sm"
                    />
                    <button 
                      type="button"
                      onClick={handleApplyCoupon}
                      className="bg-black text-white px-4 py-2 text-sm font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors rounded-sm"
                    >
                      Aplicar
                    </button>
                  </div>
                )}
                {couponError && <p className="text-red-500 text-xs mt-1">{couponError}</p>}
              </div>

              <div className="space-y-3 border-t border-gray-100 pt-4 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">${cartSubtotal.toFixed(2)}</span>
                </div>
                
                {saleDiscount > 0 && (
                  <div className="flex justify-between text-sm text-red-500">
                    <span>Ahorro en Ofertas</span>
                    <span className="font-medium">-${saleDiscount.toFixed(2)}</span>
                  </div>
                )}

                {appliedCoupon && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Cupón ({appliedCoupon.discountPercentage}%)</span>
                    <span className="font-medium">-${discountAmount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Envío</span>
                  <span className={`font-medium ${shippingCost === 0 ? 'text-green-600' : ''}`}>
                    {shippingCost === 0 ? 'Gratis' : `$${shippingCost.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-gray-100 pt-3">
                  <span>Total</span>
                  <span>${finalTotal.toFixed(2)}</span>
                </div>
              </div>

              <button 
                type="submit"
                form="checkout-form"
                disabled={isProcessing}
                className="w-full bg-black text-white py-4 rounded-lg text-sm font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <Spinner size="sm" color="text-white" />
                    <span>Procesando...</span>
                  </div>
                ) : (
                  <>Pagar Ahora</>
                )}
              </button>
              
              <p className="text-xs text-center text-gray-400 mt-4">
                Al completar tu compra, aceptas nuestros términos y condiciones.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
