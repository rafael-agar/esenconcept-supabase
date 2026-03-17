import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Plus, Trash2, ShoppingBag, User, CreditCard, Truck, MapPin, DollarSign, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Product } from '../data/products';
import Spinner from './Spinner';

interface ManualOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  products: Product[];
}

const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndycHNxbWR3aHdicnVxZ3lqZGlzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjI2Nzc4OCwiZXhwIjoyMDg3ODQzNzg4fQ.ym_3yVpT-jRSQx1gLh1Qt9xW7WBQ9LsNEjjYs3XFA_Q';

export default function ManualOrderModal({ isOpen, onClose, onSuccess, products }: ManualOrderModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Customer Data
  const [customer, setCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    instagram: '',
    address: '',
    city: '',
    postalCode: '',
    documentId: '',
    isGift: false,
    recipientName: '',
    giftMessage: ''
  });

  // Order Items
  const [items, setItems] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [selectedVariant, setSelectedVariant] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);

  // Financials
  const [shippingCost, setShippingCost] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('pago-movil');
  const [paymentData, setPaymentData] = useState({
    depositorName: '',
    depositorId: '',
    bank: '',
    referenceNumber: ''
  });
  const [status, setStatus] = useState<string>('Pago Aprobado');

  useEffect(() => {
    if (isOpen) {
      setCustomer({ 
        name: '', 
        email: '', 
        phone: '', 
        instagram: '', 
        address: '', 
        city: '',
        postalCode: '',
        documentId: '',
        isGift: false,
        recipientName: '',
        giftMessage: ''
      });
      setItems([]);
      setShippingCost(0);
      setDiscount(0);
      setPaymentMethod('pago-movil');
      setPaymentData({
        depositorName: '',
        depositorId: '',
        bank: '',
        referenceNumber: ''
      });
      setStatus('Pago Aprobado');
      setError(null);
    }
  }, [isOpen]);

  const handleAddItem = () => {
    if (!selectedProduct) return;
    const product = products.find(p => p.id === selectedProduct);
    if (!product) return;

    let variant = null;
    if (selectedVariant) {
      variant = product.variants?.find(v => v.id === selectedVariant);
    }

    const price = product.isSale && product.salePrice ? product.salePrice : product.price;

    setItems([...items, {
      product,
      variant,
      quantity,
      price
    }]);

    setSelectedProduct('');
    setSelectedVariant('');
    setQuantity(1);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = subtotal + shippingCost - discount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      setError('Debes agregar al menos un producto a la orden.');
      return;
    }
    if (!customer.name) {
      setError('El nombre del cliente es obligatorio.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // 1. Determine Email
      const email = customer.email.trim() || null;

      // 2. Create or Find User using Supabase Admin API
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseAdmin = createClient(
        import.meta.env.VITE_SUPABASE_URL || 'https://wrpsqmdwhwbruqgyjdis.supabase.co',
        SERVICE_ROLE_KEY,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false
          }
        }
      );

      // Check if user exists (only if email is provided)
      const { data: existingUsers, error: searchError } = await supabaseAdmin.auth.admin.listUsers();
      let userId = null;

      if (!searchError && existingUsers && email) {
        const found = (existingUsers.users as any[]).find(u => u.email === email);
        if (found) userId = found.id;
      }

      if (!userId) {
        // Create new user
        const userData: any = {
          password: Math.random().toString(36).slice(-10) + 'A1!', // Random secure password
          email_confirm: true,
          user_metadata: {
            full_name: customer.name,
            phone: customer.phone,
            instagram: customer.instagram
          }
        };

        if (email) {
          userData.email = email;
        } else if (customer.phone) {
          userData.phone = customer.phone;
        }

        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser(userData);

        if (createError) throw createError;
        userId = newUser.user.id;

        // Create profile
        await supabaseAdmin.from('profiles').upsert({
          id: userId,
          full_name: customer.name,
          email: email,
          phone: customer.phone,
          address: customer.address,
          document_id: customer.documentId,
          role: 'customer'
        });
      }

      // 3. Create Order
      const { data: order, error: orderError } = await supabaseAdmin
        .from('orders')
        .insert([{
          user_id: userId,
          total_amount: total,
          status: status,
          payment_method: paymentMethod,
          is_gift: customer.isGift,
          gift_details: customer.isGift ? {
            recipientName: customer.recipientName,
            message: customer.giftMessage
          } : null,
          shipping_address: `${customer.address}${customer.city ? `, ${customer.city}` : ''}${customer.postalCode ? `, ${customer.postalCode}` : ''}` || 'Venta Manual / Redes Sociales',
          shipping_cost: shippingCost,
          payment_details: {
            instagram: customer.instagram,
            phone: customer.phone,
            notes: 'Orden Manual',
            depositorName: paymentData.depositorName,
            depositorId: paymentData.depositorId,
            bank: paymentData.bank,
            referenceNumber: paymentData.referenceNumber
          }
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // 4. Create Order Items
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.price,
        color: item.variant?.color || null,
        size: item.variant?.size || null
      }));

      const { error: itemsError } = await supabaseAdmin
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // 5. Update Inventory
      const inventoryItemsMap = new Map<string, any>();
      
      items.forEach(item => {
        const processItem = (productId: string, variantId: string | null, quantity: number, color: string | null, size: string | null) => {
          const key = `${productId}-${variantId || 'no-variant'}`;
          if (inventoryItemsMap.has(key)) {
            const existing = inventoryItemsMap.get(key);
            existing.quantity += quantity;
          } else {
            inventoryItemsMap.set(key, {
              id: productId,
              variantId: variantId,
              quantity: quantity,
              selectedColor: color,
              selectedSize: size
            });
          }
        };

        if (item.product.isBundle && item.product.bundleItems && item.product.bundleItems.length > 0) {
          // If it's a bundle, ONLY discount its components
          item.product.bundleItems.forEach((bundleItem: any) => {
            const baseProduct = products.find(p => p.id === bundleItem.productId);
            
            let targetVariantId = bundleItem.variantId || null;
            let targetColor = null;
            let targetSize = null;

            if (targetVariantId) {
              const variant = baseProduct?.variants?.find(v => v.id === targetVariantId);
              targetColor = variant?.color || null;
              targetSize = variant?.size || null;
            } else if (item.variant?.color && item.variant?.size) {
              const matchingVariant = baseProduct?.variants?.find(v => v.color === item.variant.color && v.size === item.variant.size);
              if (matchingVariant) {
                targetVariantId = matchingVariant.id;
                targetColor = matchingVariant.color;
                targetSize = matchingVariant.size;
              } else {
                targetColor = item.variant.color;
                targetSize = item.variant.size;
              }
            }
            
            processItem(bundleItem.productId, targetVariantId, bundleItem.quantity * item.quantity, targetColor, targetSize);
          });
        } else {
          // If it's a regular product, discount the product itself
          processItem(item.product.id, item.variant?.id || null, item.quantity, item.variant?.color || null, item.variant?.size || null);
        }
      });

      const inventoryItems = Array.from(inventoryItemsMap.values());

      const { error: inventoryError } = await supabaseAdmin.rpc('update_inventory', { 
        items: inventoryItems
      });

      if (inventoryError) {
        console.error('Error updating inventory:', inventoryError);
        // We don't throw here to not fail the order creation if inventory update fails, 
        // but we log it.
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error creating manual order:', err);
      setError(err.message || 'Error al crear la orden manual.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  const currentProduct = products.find(p => p.id === selectedProduct);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h2 className="text-xl font-serif font-bold flex items-center gap-2">
            <ShoppingBag size={20} />
            Nueva Orden Manual
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100">
              {error}
            </div>
          )}

          <form id="manual-order-form" onSubmit={handleSubmit} className="space-y-8">
            {/* Customer Section */}
            <section>
              <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2 border-b pb-2">
                <User size={16} /> Datos del Cliente
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Nombre Completo *</label>
                  <input 
                    type="text" 
                    required
                    value={customer.name}
                    onChange={e => setCustomer({...customer, name: e.target.value})}
                    className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:border-black text-sm"
                    placeholder="Ej. María Pérez"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Email (Opcional)</label>
                  <input 
                    type="email" 
                    value={customer.email}
                    onChange={e => setCustomer({...customer, email: e.target.value})}
                    className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:border-black text-sm"
                    placeholder="Si se deja vacío, se generará uno automático"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Teléfono / WhatsApp</label>
                  <input 
                    type="text" 
                    value={customer.phone}
                    onChange={e => setCustomer({...customer, phone: e.target.value})}
                    className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:border-black text-sm"
                    placeholder="Ej. +58 412 1234567"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Cédula / ID</label>
                  <input 
                    type="text" 
                    value={customer.documentId}
                    onChange={e => setCustomer({...customer, documentId: e.target.value})}
                    className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:border-black text-sm"
                    placeholder="V-12345678"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Usuario de Instagram</label>
                  <input 
                    type="text" 
                    value={customer.instagram}
                    onChange={e => setCustomer({...customer, instagram: e.target.value})}
                    className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:border-black text-sm"
                    placeholder="Ej. @mariaperez"
                  />
                </div>
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-1">
                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Dirección de Envío</label>
                    <input 
                      type="text" 
                      value={customer.address}
                      onChange={e => setCustomer({...customer, address: e.target.value})}
                      className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:border-black text-sm"
                      placeholder="Calle, número..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Ciudad</label>
                    <input 
                      type="text" 
                      value={customer.city}
                      onChange={e => setCustomer({...customer, city: e.target.value})}
                      className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:border-black text-sm"
                      placeholder="Ciudad"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Código Postal</label>
                    <input 
                      type="text" 
                      value={customer.postalCode}
                      onChange={e => setCustomer({...customer, postalCode: e.target.value})}
                      className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:border-black text-sm"
                      placeholder="CP"
                    />
                  </div>
                </div>

                {/* Gift Option */}
                <div className="md:col-span-2 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-center gap-3 mb-3">
                    <input 
                      type="checkbox" 
                      id="isGift"
                      checked={customer.isGift}
                      onChange={(e) => setCustomer({ ...customer, isGift: e.target.checked })}
                      className="w-4 h-4 accent-black cursor-pointer"
                    />
                    <label htmlFor="isGift" className="text-sm font-bold cursor-pointer select-none">
                      ¿Es un regalo?
                    </label>
                  </div>

                  {customer.isGift && (
                    <div className="space-y-3 pt-3 border-t border-gray-200">
                      <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Nombre del Destinatario</label>
                        <input 
                          type="text" 
                          value={customer.recipientName}
                          onChange={(e) => setCustomer({ ...customer, recipientName: e.target.value })}
                          className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:border-black text-sm"
                          placeholder="¿Para quién es?"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Dedicatoria / Mensaje</label>
                        <textarea 
                          value={customer.giftMessage}
                          onChange={(e) => setCustomer({ ...customer, giftMessage: e.target.value })}
                          className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:border-black text-sm h-20 resize-none"
                          placeholder="Escribe tu mensaje aquí..."
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Products Section */}
            <section>
              <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2 border-b pb-2">
                <ShoppingBag size={16} /> Productos
              </h3>
              
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-4 flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 w-full">
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Producto</label>
                  <select 
                    value={selectedProduct}
                    onChange={e => {
                      setSelectedProduct(e.target.value);
                      setSelectedVariant('');
                    }}
                    className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:border-black text-sm bg-white"
                  >
                    <option value="">Seleccionar producto...</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} - ${p.isSale && p.salePrice ? p.salePrice : p.price}</option>
                    ))}
                  </select>
                </div>
                
                {currentProduct && currentProduct.variants && currentProduct.variants.length > 0 && (
                  <div className="flex-1 w-full">
                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Variante (Color/Talla)</label>
                    <select 
                      value={selectedVariant}
                      onChange={e => setSelectedVariant(e.target.value)}
                      className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:border-black text-sm bg-white"
                    >
                      <option value="">Seleccionar variante...</option>
                      {currentProduct.variants.map(v => (
                        <option key={v.id} value={v.id}>
                          {[v.color, v.size].filter(Boolean).join(' / ')} (Stock: {v.stock})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="w-full md:w-24">
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Cant.</label>
                  <input 
                    type="number" 
                    min="1"
                    value={quantity}
                    onChange={e => setQuantity(parseInt(e.target.value) || 1)}
                    className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:border-black text-sm"
                  />
                </div>

                <button 
                  type="button"
                  onClick={handleAddItem}
                  disabled={!selectedProduct || (currentProduct?.variants?.length ? !selectedVariant : false)}
                  className="bg-black text-white p-2.5 rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors flex items-center justify-center w-full md:w-auto"
                >
                  <Plus size={20} />
                </button>
              </div>

              {/* Items List */}
              {items.length > 0 ? (
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="p-3 font-bold text-gray-600">Producto</th>
                        <th className="p-3 font-bold text-gray-600">Variante</th>
                        <th className="p-3 font-bold text-gray-600">Precio</th>
                        <th className="p-3 font-bold text-gray-600">Cant.</th>
                        <th className="p-3 font-bold text-gray-600">Subtotal</th>
                        <th className="p-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="p-3 font-medium">{item.product.name}</td>
                          <td className="p-3 text-gray-500">
                            {item.variant ? [item.variant.color, item.variant.size].filter(Boolean).join(' / ') : '-'}
                          </td>
                          <td className="p-3">${item.price.toFixed(2)}</td>
                          <td className="p-3">{item.quantity}</td>
                          <td className="p-3 font-bold">${(item.price * item.quantity).toFixed(2)}</td>
                          <td className="p-3 text-right">
                            <button 
                              type="button"
                              onClick={() => removeItem(idx)}
                              className="text-red-500 hover:text-red-700 p-1"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center p-8 border border-dashed border-gray-300 rounded-xl text-gray-500 text-sm">
                  No hay productos agregados a la orden.
                </div>
              )}
            </section>

            {/* Financials Section */}
            <section>
              <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2 border-b pb-2">
                <DollarSign size={16} /> Detalles de Pago y Envío
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Método de Pago</label>
                  <select 
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value)}
                    className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:border-black text-sm bg-white"
                  >
                    <option value="pago-movil">Pago Móvil</option>
                    <option value="transferencia">Transferencia Bancaria</option>
                    <option value="zelle">Zelle</option>
                    <option value="efectivo">Efectivo</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>

                {(paymentMethod === 'pago-movil' || paymentMethod === 'transferencia') && (
                  <>
                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Nombre del Depositante</label>
                      <input 
                        type="text" 
                        value={paymentData.depositorName}
                        onChange={e => setPaymentData({...paymentData, depositorName: e.target.value})}
                        className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:border-black text-sm"
                        placeholder="Nombre de quien pagó"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Cédula del Depositante</label>
                      <input 
                        type="text" 
                        value={paymentData.depositorId}
                        onChange={e => setPaymentData({...paymentData, depositorId: e.target.value})}
                        className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:border-black text-sm"
                        placeholder="V-12345678"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Banco</label>
                      <input 
                        type="text" 
                        value={paymentData.bank}
                        onChange={e => setPaymentData({...paymentData, bank: e.target.value})}
                        className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:border-black text-sm"
                        placeholder="Ej. Banesco, BNC..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Número de Referencia</label>
                      <input 
                        type="text" 
                        value={paymentData.referenceNumber}
                        onChange={e => setPaymentData({...paymentData, referenceNumber: e.target.value})}
                        className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:border-black text-sm"
                        placeholder={paymentMethod === 'pago-movil' ? "Últimos 4 dígitos" : "Referencia completa"}
                      />
                    </div>
                  </>
                )}
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Estado de la Orden</label>
                  <select 
                    value={status}
                    onChange={e => setStatus(e.target.value)}
                    className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:border-black text-sm bg-white"
                  >
                    <option value="Pago Aprobado">Pago Aprobado</option>
                    <option value="Pendiente">Pendiente</option>
                    <option value="Enviado">Enviado</option>
                    <option value="Entregado">Entregado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Costo de Envío ($)</label>
                  <input 
                    type="number" 
                    min="0"
                    step="0.01"
                    value={shippingCost}
                    onChange={e => setShippingCost(parseFloat(e.target.value) || 0)}
                    className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:border-black text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Descuento ($)</label>
                  <input 
                    type="number" 
                    min="0"
                    step="0.01"
                    value={discount}
                    onChange={e => setDiscount(parseFloat(e.target.value) || 0)}
                    className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:border-black text-sm"
                  />
                </div>
              </div>

              <div className="mt-6 bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Envío:</span>
                  <span className="font-medium">${shippingCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm mb-2 text-green-600">
                  <span>Descuento:</span>
                  <span className="font-medium">-${discount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2 mt-2">
                  <span>Total a Cobrar:</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </section>
          </form>
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-4">
          <button 
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 border border-gray-300 rounded-lg text-sm font-bold uppercase tracking-widest hover:bg-gray-100 transition-colors"
          >
            Cancelar
          </button>
          <button 
            type="submit"
            form="manual-order-form"
            disabled={isProcessing || items.length === 0}
            className="px-6 py-2.5 bg-black text-white rounded-lg text-sm font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isProcessing ? <Spinner size="sm" /> : <CheckCircle size={18} />}
            Crear Orden
          </button>
        </div>
      </motion.div>
    </div>
  );
}
