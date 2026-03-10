import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useProducts } from '../context/ProductContext';
import { Package, Users, Tag, Settings, Truck, Edit, Trash2, Plus, CheckCircle, XCircle, Image as ImageIcon, Ruler, Folder, FileText, DollarSign, Eye, X, LayoutDashboard, Share2, Mail, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { Toast } from '../components/Toast';
import { ConfirmModal } from '../components/ConfirmModal';
import LoadingOverlay from '../components/LoadingOverlay';
import Spinner from '../components/Spinner';
import AdminDashboard from '../components/AdminDashboard';
import SocialIcon from '../components/SocialIcon';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Admin() {
  const { user } = useAuth();
  const { 
    coupons, addCoupon, toggleCouponStatus, deleteCoupon, 
    freeShippingThreshold, setFreeShippingThreshold, 
    baseShippingCost, setBaseShippingCost,
    socialLinks, updateSocialLinks 
  } = useCart();
  const { products, categories, sizes, updateProduct, addProduct, deleteProduct, addSize, updateSize, deleteSize, addCategory, updateCategory, deleteCategory, isLoading: productsLoading, processReturn } = useProducts();
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'products' | 'users' | 'settings' | 'sizes' | 'categories' | 'leads' | 'returns'>('dashboard');
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [viewingOrder, setViewingOrder] = useState<any | null>(null);
  const [processingReturn, setProcessingReturn] = useState<{
    orderId: string;
    userId: string;
    item: any;
  } | null>(null);
  const [manualReturnOpen, setManualReturnOpen] = useState(false);
  const [returnReason, setReturnReason] = useState<'voluntary' | 'defect'>('voluntary');
  const [exchangeProductId, setExchangeProductId] = useState<string>('');
  const [exchangeVariantId, setExchangeVariantId] = useState<string>('');
  const [returnNotes, setReturnNotes] = useState<string>('');
  const [returns, setReturns] = useState<any[]>([]);
  const [returnsLoading, setReturnsLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [leads, setLeads] = useState<any[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(true);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [pendingOrderUpdate, setPendingOrderUpdate] = useState<{
    orderId: string;
    newStatus: string;
    customerName: string;
    products: string[];
    phoneNumber?: string;
    trackingNumber?: string;
  } | null>(null);

  // ... (rest of state)

  const generatePDF = (order: any) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('ESEN CONCEPT', 14, 22);
    doc.setFontSize(12);
    doc.text('Detalle de Orden', 14, 32);
    
    // Order Info
    doc.setFontSize(10);
    doc.text(`Orden ID: ${order.id}`, 14, 42);
    doc.text(`Fecha: ${new Date(order.created_at || order.date).toLocaleDateString()}`, 14, 48);
    doc.text(`Estado: ${order.status}`, 14, 54);
    
    // Customer Info
    doc.text('Cliente:', 14, 64);
    doc.setFontSize(9);
    doc.text(`Nombre: ${order.customer?.full_name || 'Desconocido'}`, 14, 70);
    doc.text(`Email: ${order.customer?.email || 'N/A'}`, 14, 76);
    doc.text(`Dirección: ${order.shipping_address || 'N/A'}`, 14, 82);
    
    // Payment Info
    doc.setFontSize(10);
    doc.text('Detalles de Pago:', 120, 42);
    doc.setFontSize(9);
    doc.text(`Método: ${order.payment_method === 'pago-movil' ? 'Pago Móvil' : 'Transferencia'}`, 120, 48);
    if (order.paymentDetails) {
      doc.text(`Banco: ${order.paymentDetails.bank || 'N/A'}`, 120, 54);
      doc.text(`Ref: ${order.paymentDetails.referenceNumber || 'N/A'}`, 120, 60);
      doc.text(`Depositante: ${order.paymentDetails.depositorName || 'N/A'}`, 120, 66);
      doc.text(`C.I./ID: ${order.paymentDetails.depositorId || 'N/A'}`, 120, 72);
    }
    
    // Gift Info
    if (order.is_gift || order.isGift) {
      const gift = order.gift_details || order.giftDetails;
      if (gift) {
        doc.setFontSize(10);
        doc.text('Detalles de Regalo:', 14, 92);
        doc.setFontSize(9);
        doc.text(`Para: ${gift.recipientName}`, 14, 98);
        doc.text(`Mensaje: "${gift.message}"`, 14, 104);
      }
    }

    // Items Table
    const tableColumn = ["Producto", "Cantidad", "Precio Unit.", "Total"];
    const tableRows = [];

    order.items?.forEach((item: any) => {
      const variantInfo = (item.color || item.size) ? ` (${item.color || 'N/A'} / ${item.size || 'N/A'})` : '';
      const itemData = [
        (item.name || 'Producto') + variantInfo,
        item.quantity,
        `$${Number(item.price).toFixed(2)}`,
        `$${(Number(item.price) * item.quantity).toFixed(2)}`
      ];
      tableRows.push(itemData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 115,
      theme: 'grid',
      headStyles: { fillColor: [0, 0, 0] },
    });

    // Totals
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.text(`Total: $${Number(order.total).toFixed(2)}`, 140, finalY);

    doc.save(`orden-${order.id.slice(0, 8)}.pdf`);
  };

  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponDiscount, setNewCouponDiscount] = useState('');
  const [shippingThresholdInput, setShippingThresholdInput] = useState(freeShippingThreshold.toString());
  const [baseShippingCostInput, setBaseShippingCostInput] = useState(baseShippingCost.toString());
  const [localSocialLinks, setLocalSocialLinks] = useState<{name: string, url: string}[]>([]);

  useEffect(() => {
    if (socialLinks) {
      setLocalSocialLinks(socialLinks);
    }
  }, [socialLinks]);

  // Size Management State
  const [newSizeName, setNewSizeName] = useState('');
  const [newSizeOrder, setNewSizeOrder] = useState('0');
  const [editingSizeId, setEditingSizeId] = useState<string | null>(null);
  const [editSizeName, setEditSizeName] = useState('');
  const [editSizeOrder, setEditSizeOrder] = useState('0');

  // Product Edit State
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editStock, setEditStock] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editLongDescription, setEditLongDescription] = useState('');
  const [editCareInstructions, setEditCareInstructions] = useState('');
  const [editIsFeatured, setEditIsFeatured] = useState(false);
  const [editIsNew, setEditIsNew] = useState(false);
  const [editIsSale, setEditIsSale] = useState(false);
  const [editSalePrice, setEditSalePrice] = useState('');
  const [editProductImage, setEditProductImage] = useState<File | null>(null);
  const [editAdditionalImages, setEditAdditionalImages] = useState<File[]>([]);
  const [editExistingImages, setEditExistingImages] = useState<string[]>([]);
  const [editVariants, setEditVariants] = useState<{ id?: string, color: string, colorCode: string, size: string, stock: number }[]>([]);
  const [editIsBundle, setEditIsBundle] = useState(false);
  const [editBundleItems, setEditBundleItems] = useState<{ productId: string, variantId?: string, quantity: number }[]>([]);

  const addVariantToEditProduct = () => {
    setEditVariants([...editVariants, { color: '', colorCode: '#000000', size: sizes[0]?.name || '', stock: 0 }]);
  };

  const removeVariantFromEditProduct = (index: number) => {
    setEditVariants(editVariants.filter((_, i) => i !== index));
  };

  const updateEditProductVariant = (index: number, field: string, value: any) => {
    const updated = [...editVariants];
    updated[index] = { ...updated[index], [field]: value };
    setEditVariants(updated);
  };

  // New Product State
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [newProductStock, setNewProductStock] = useState('');
  const [newProductCategory, setNewProductCategory] = useState('');
  const [newProductDescription, setNewProductDescription] = useState('');
  const [newProductLongDescription, setNewProductLongDescription] = useState('');
  const [newProductCareInstructions, setNewProductCareInstructions] = useState('');
  const [newProductIsNew, setNewProductIsNew] = useState(false);
  const [newProductIsSale, setNewProductIsSale] = useState(false);
  const [newProductSalePrice, setNewProductSalePrice] = useState('');
  const [newProductImage, setNewProductImage] = useState<File | null>(null);
  const [newProductAdditionalImages, setNewProductAdditionalImages] = useState<File[]>([]);
  const [newProductVariants, setNewProductVariants] = useState<{ color: string, colorCode: string, size: string, stock: number }[]>([]);
  const [newProductIsBundle, setNewProductIsBundle] = useState(false);
  const [newProductBundleItems, setNewProductBundleItems] = useState<{ productId: string, variantId?: string, quantity: number }[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Category Management State
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [newCategoryImage, setNewCategoryImage] = useState<File | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [editCategoryDescription, setEditCategoryDescription] = useState('');
  const [editCategoryImage, setEditCategoryImage] = useState<File | null>(null);

  // Notification & Modal State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error'; visible: boolean }>({
    message: '',
    type: 'success',
    visible: false
  });
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isDestructive: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    isDestructive: false
  });

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type, visible: true });
  };

  const openConfirmModal = (title: string, message: string, onConfirm: () => void, isDestructive = false) => {
    setConfirmModal({ isOpen: true, title, message, onConfirm, isDestructive });
  };

  const closeConfirmModal = () => {
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
  };

  const addVariantToNewProduct = () => {
    setNewProductVariants([...newProductVariants, { color: '', colorCode: '#000000', size: sizes[0]?.name || '', stock: 0 }]);
  };

  const removeVariantFromNewProduct = (index: number) => {
    setNewProductVariants(newProductVariants.filter((_, i) => i !== index));
  };

  const updateNewProductVariant = (index: number, field: string, value: any) => {
    const updated = [...newProductVariants];
    updated[index] = { ...updated[index], [field]: value };
    setNewProductVariants(updated);
  };

  const addBundleItemToNewProduct = () => {
    setNewProductBundleItems([...newProductBundleItems, { productId: '', quantity: 1 }]);
  };

  const removeBundleItemFromNewProduct = (index: number) => {
    setNewProductBundleItems(newProductBundleItems.filter((_, i) => i !== index));
  };

  const updateNewProductBundleItem = (index: number, field: string, value: any) => {
    setNewProductBundleItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addBundleItemToEditProduct = () => {
    setEditBundleItems([...editBundleItems, { productId: '', quantity: 1 }]);
  };

  const removeBundleItemFromEditProduct = (index: number) => {
    setEditBundleItems(editBundleItems.filter((_, i) => i !== index));
  };

  const updateEditProductBundleItem = (index: number, field: string, value: any) => {
    setEditBundleItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const fetchAllOrders = async () => {
    setOrdersLoading(true);
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
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      if (data) {
        // Fetch user profiles for these orders
        const userIds = [...new Set(data.map(o => o.user_id).filter(Boolean))];
        let profilesMap = new Map();
        
        if (userIds.length > 0) {
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, full_name, email, phone, document_id')
            .in('id', userIds);
            
          if (!profilesError && profilesData) {
            profilesMap = new Map(profilesData.map(p => [p.id, p]));
          }
        }

        const formattedOrders = data.map(o => {
          const profile = profilesMap.get(o.user_id);
          let customerName = 'Desconocido';
          let customerEmail = 'No disponible';
          let customerPhone = '';
          let customerDocumentId = '';

          if (profile) {
            customerName = profile.full_name || 'Sin nombre';
            customerEmail = profile.email || 'Sin email';
            customerPhone = profile.phone || '';
            customerDocumentId = profile.document_id || '';
          } else if (o.payment_details && o.payment_details.depositorName) {
             customerName = o.payment_details.depositorName;
             customerEmail = 'N/A (Pago Móvil/Transferencia)';
             customerDocumentId = o.payment_details.depositorId || '';
          }

          return {
            ...o,
            total: Number(o.total_amount),
            customer: {
                full_name: customerName,
                email: customerEmail,
                phone: customerPhone,
                document_id: customerDocumentId
            },
            items: o.order_items.map((oi: any) => ({
              id: oi.products?.id,
              name: oi.products?.name,
              price: Number(oi.unit_price),
              image: oi.products?.image_url,
              quantity: oi.quantity,
              color: oi.color,
              size: oi.size
            })),
            paymentDetails: o.payment_details
          };
        });
        setOrders(formattedOrders);
      }
    } catch (error) {
      console.error('Error fetching all orders:', error);
    } finally {
      setOrdersLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    setUsersLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setUsers(data);
    } catch (error) {
      console.error('Error fetching all users:', error);
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchAllLeads = async () => {
    try {
      setLeadsLoading(true);
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLeadsLoading(false);
    }
  };

  const fetchAllReturns = async () => {
    try {
      setReturnsLoading(true);
      const { data, error } = await supabase
        .from('returns')
        .select(`
          *,
          product:products!returns_product_id_fkey(name, image_url),
          exchange_product:products!returns_exchange_product_id_fkey(name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;

      // Manually fetch profiles for these returns
      const userIds = [...new Set(data.map(r => r.user_id).filter(Boolean))];
      let profilesMap = new Map();
      
      if (userIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', userIds);
        
        if (!profilesError && profilesData) {
          profilesData.forEach(p => profilesMap.set(p.id, p));
        }
      }

      const returnsWithCustomer = (data || []).map(r => ({
        ...r,
        customer: profilesMap.get(r.user_id) || { full_name: 'Usuario desconocido', email: '' }
      }));

      setReturns(returnsWithCustomer);
    } catch (error) {
      console.error('Error fetching returns:', error);
    } finally {
      setReturnsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'orders') {
      fetchAllOrders();
    } else if (activeTab === 'users') {
      fetchAllUsers();
    } else if (activeTab === 'leads') {
      fetchAllLeads();
    } else if (activeTab === 'returns') {
      fetchAllReturns();
    } else if (activeTab === 'dashboard') {
      fetchAllOrders();
      fetchAllUsers();
      fetchAllLeads();
      fetchAllReturns();
    }
  }, [activeTab]);

  // Update total stock when variants change (New Product)
  useEffect(() => {
    if (newProductVariants.length > 0) {
      const total = newProductVariants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
      setNewProductStock(total.toString());
    }
  }, [newProductVariants]);

  // Update total stock when variants change (Edit Product)
  useEffect(() => {
    if (editVariants.length > 0) {
      const total = editVariants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
      setEditStock(total.toString());
    }
  }, [editVariants]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    if (newStatus === 'Pago Aprobado') {
      const order = orders.find(o => o.id === orderId);
      if (order) {
        setPendingOrderUpdate({
          orderId,
          newStatus,
          customerName: order.customer?.full_name || 'Cliente',
          products: order.items.map((i: any) => i.name),
          phoneNumber: order.customer?.phone
        });
        setIsConfirmModalOpen(true);
        return;
      }
    }

    if (newStatus === 'Enviado') {
      const order = orders.find(o => o.id === orderId);
      if (order) {
        setPendingOrderUpdate({
          orderId,
          newStatus,
          customerName: order.customer?.full_name || 'Cliente',
          products: order.items.map((i: any) => i.name),
          phoneNumber: order.customer?.phone,
          trackingNumber: ''
        });
        setIsConfirmModalOpen(true);
        return;
      }
    }

    await updateOrderStatus(orderId, newStatus);
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setIsUploading(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      showToast('Estado del pedido actualizado', 'success');
    } catch (error) {
      console.error('Error updating order status:', error);
      showToast('Error al actualizar el estado del pedido', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const confirmStatusChange = async () => {
    if (!pendingOrderUpdate) return;

    if (pendingOrderUpdate.newStatus === 'Enviado' && !pendingOrderUpdate.trackingNumber) {
      showToast('Por favor ingresa el número de guía', 'error');
      return;
    }

    await updateOrderStatus(pendingOrderUpdate.orderId, pendingOrderUpdate.newStatus);
    setIsConfirmModalOpen(false);

    // WhatsApp Logic
    const productsList = pendingOrderUpdate.products.join(', ');
    let message = '';

    if (pendingOrderUpdate.newStatus === 'Pago Aprobado') {
      message = `Hola ${pendingOrderUpdate.customerName}, tu pago ha sido aprobado. En las próximas 24 horas será enviado ${productsList} con su respectiva guía.`;
    } else if (pendingOrderUpdate.newStatus === 'Enviado') {
      message = `Hola ${pendingOrderUpdate.customerName}, tu pedido ha sido enviado. Tu número de guía es: ${pendingOrderUpdate.trackingNumber}. Productos: ${productsList}.`;
    }

    if (message) {
      const encodedMessage = encodeURIComponent(message);
      const storePhone = '584226413853';
      const whatsappUrl = `https://wa.me/${storePhone}?text=${encodedMessage}`;

      window.open(whatsappUrl, '_blank');
    }
    
    setPendingOrderUpdate(null);
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName) return;
    setIsUploading(true);
    try {
      await addCategory({
        name: newCategoryName,
        description: newCategoryDescription,
        image: ''
      }, newCategoryImage || undefined);
      setIsAddingCategory(false);
      setNewCategoryName('');
      setNewCategoryDescription('');
      setNewCategoryImage(null);
      showToast('Categoría creada correctamente', 'success');
    } catch (error) {
      showToast('Error al crear categoría', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdateCategory = async (category: any) => {
    setIsUploading(true);
    try {
      await updateCategory({
        ...category,
        name: editCategoryName,
        description: editCategoryDescription
      }, editCategoryImage || undefined);
      setEditingCategoryId(null);
      showToast('Categoría actualizada correctamente', 'success');
    } catch (error) {
      showToast('Error al actualizar categoría', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const startEditCategory = (category: any) => {
    setEditingCategoryId(category.id);
    setEditCategoryName(category.name);
    setEditCategoryDescription(category.description || '');
    setEditCategoryImage(null);
  };

  const renderCategories = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-serif font-bold">Gestión de Categorías</h2>
        <button 
          onClick={() => setIsAddingCategory(!isAddingCategory)}
          className="bg-black text-white px-4 py-2 rounded-lg text-sm font-bold uppercase flex items-center gap-2 hover:bg-gray-800 transition-colors"
        >
          {isAddingCategory ? <XCircle size={18} /> : <Plus size={18} />}
          {isAddingCategory ? 'Cancelar' : 'Nueva Categoría'}
        </button>
      </div>

      {isAddingCategory && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
          <h3 className="text-lg font-bold mb-4">Agregar Nueva Categoría</h3>
          <form onSubmit={handleAddCategory} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Nombre</label>
              <input 
                type="text" 
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:border-black"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Imagen</label>
              <input 
                type="file" 
                accept="image/*"
                onChange={(e) => setNewCategoryImage(e.target.files?.[0] || null)}
                className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:border-black file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Descripción</label>
              <textarea 
                value={newCategoryDescription}
                onChange={(e) => setNewCategoryDescription(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:border-black h-24"
              />
            </div>
            <div className="md:col-span-2 flex justify-end mt-4">
              <button 
                type="submit"
                disabled={isUploading}
                className="bg-black text-white px-8 py-2 rounded text-sm font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors disabled:bg-gray-400"
              >
                {isUploading ? 'Creando...' : 'Crear Categoría'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500">
              <th className="p-4 font-bold">Imagen</th>
              <th className="p-4 font-bold">Nombre</th>
              <th className="p-4 font-bold">Descripción</th>
              <th className="p-4 font-bold">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {categories.map(category => (
              <tr key={category.id} className="hover:bg-gray-50 transition-colors">
                <td className="p-4">
                  {editingCategoryId === category.id ? (
                    <div className="space-y-2">
                      {category.image && <img src={category.image} alt="" className="w-10 h-10 object-cover rounded mb-1" />}
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => setEditCategoryImage(e.target.files?.[0] || null)}
                        className="w-full text-[10px] border border-gray-300 rounded p-1"
                      />
                    </div>
                  ) : (
                    category.image ? (
                      <img src={category.image} alt={category.name} className="w-10 h-10 object-cover rounded" />
                    ) : (
                      <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center text-gray-400">
                        <ImageIcon size={20} />
                      </div>
                    )
                  )}
                </td>
                <td className="p-4">
                  {editingCategoryId === category.id ? (
                    <input 
                      type="text" 
                      value={editCategoryName}
                      onChange={(e) => setEditCategoryName(e.target.value)}
                      className="w-full border border-gray-300 p-1 rounded text-sm"
                    />
                  ) : (
                    <span className="font-medium text-sm">{category.name}</span>
                  )}
                </td>
                <td className="p-4">
                  {editingCategoryId === category.id ? (
                    <textarea 
                      value={editCategoryDescription}
                      onChange={(e) => setEditCategoryDescription(e.target.value)}
                      className="w-full border border-gray-300 p-1 rounded text-xs h-16"
                    />
                  ) : (
                    <span className="text-xs text-gray-500 line-clamp-2">{category.description || 'Sin descripción'}</span>
                  )}
                </td>
                <td className="p-4">
                  <div className="flex gap-2">
                    {editingCategoryId === category.id ? (
                      <>
                        <button 
                          onClick={() => handleUpdateCategory(category)}
                          disabled={isUploading}
                          className="text-green-600 hover:text-green-800"
                        >
                          <CheckCircle size={18} />
                        </button>
                        <button 
                          onClick={() => setEditingCategoryId(null)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <XCircle size={18} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          onClick={() => startEditCategory(category)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          onClick={() => openConfirmModal(
                            'Eliminar Categoría',
                            '¿Estás seguro de eliminar esta categoría? Se eliminarán también los productos asociados.',
                            async () => {
                              setIsUploading(true);
                              try {
                                await deleteCategory(category.id);
                                showToast('Categoría eliminada correctamente', 'success');
                              } catch (error) {
                                showToast('Error al eliminar categoría', 'error');
                              } finally {
                                setIsUploading(false);
                              }
                            },
                            true
                          )}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 size={18} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newCouponCode && newCouponDiscount) {
      setIsUploading(true);
      try {
        await addCoupon({
          code: newCouponCode.toUpperCase(),
          discountPercentage: Number(newCouponDiscount),
          isActive: true
        });
        setNewCouponCode('');
        setNewCouponDiscount('');
        showToast('Cupón agregado correctamente', 'success');
      } catch (error: any) {
        if (error?.code === 'PGRST205') {
          showToast('Error: Tabla de cupones no existe. Ejecuta el script SQL.', 'error');
        } else {
          showToast('Error al agregar cupón', 'error');
        }
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleSaveSettings = async () => {
    setIsUploading(true);
    try {
      await setFreeShippingThreshold(Number(shippingThresholdInput));
      await setBaseShippingCost(Number(baseShippingCostInput));
      showToast('Configuración guardada correctamente', 'success');
    } catch (error) {
      showToast('Error al guardar configuración', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddSize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newSizeName) {
      setIsUploading(true);
      try {
        await addSize(newSizeName, Number(newSizeOrder));
        setNewSizeName('');
        setNewSizeOrder('0');
        showToast('Talla añadida correctamente', 'success');
      } catch (error) {
        showToast('Error al añadir talla', 'error');
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleUpdateSize = async (id: string) => {
    setIsUploading(true);
    try {
      await updateSize(id, editSizeName, Number(editSizeOrder));
      setEditingSizeId(null);
      showToast('Talla actualizada correctamente', 'success');
    } catch (error) {
      showToast('Error al actualizar talla', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const startEditingProduct = (product: any) => {
    setEditingProductId(product.id);
    setEditName(product.name);
    setEditCategory(product.categoryId || '');
    setEditPrice(product.price.toString());
    setEditStock(product.stock?.toString() || '0');
    setEditDescription(product.description || '');
    setEditLongDescription(product.longDescription || '');
    setEditCareInstructions(product.careInstructions || '');
    setEditIsFeatured(product.isFeatured || false);
    setEditIsNew(product.isNew || false);
    setEditIsSale(product.isSale || false);
    setEditIsBundle(product.isBundle || false);
    setEditBundleItems(product.bundleItems || []);
    setEditSalePrice(product.salePrice?.toString() || '');
    setEditProductImage(null);
    setEditAdditionalImages([]);
    setEditExistingImages(product.images || []);
    setEditVariants(product.variants?.map((v: any) => ({
      id: v.id,
      color: v.color,
      colorCode: v.colorCode || '#000000',
      size: v.size,
      stock: v.stock
    })) || []);
  };

  const saveProductEdit = async (product: any) => {
    setIsUploading(true);
    try {
      await updateProduct({
        ...product,
        name: editName,
        categoryId: editCategory,
        category: categories.find(c => c.id === editCategory)?.name || '',
        price: Number(editPrice),
        salePrice: editIsSale ? Number(editSalePrice) : undefined,
        isSale: editIsSale,
        isNew: editIsNew,
        stock: Number(editStock),
        description: editDescription,
        longDescription: editLongDescription,
        careInstructions: editCareInstructions,
        isFeatured: editIsFeatured,
        isBundle: editIsBundle,
        bundleItems: editIsBundle ? editBundleItems : [],
        variants: editVariants as any
      }, editProductImage || undefined, editAdditionalImages.length > 0 ? editAdditionalImages : undefined);
      setEditingProductId(null);
      showToast('Producto actualizado correctamente', 'success');
    } catch (error) {
      showToast('Error al actualizar producto', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName || !newProductPrice || !newProductCategory) return;

    setIsUploading(true);
    try {
      await addProduct({
        name: newProductName,
        price: Number(newProductPrice),
        salePrice: newProductIsSale ? Number(newProductSalePrice) : undefined,
        isSale: newProductIsSale,
        isNew: newProductIsNew,
        stock: Number(newProductStock) || 0,
        description: newProductDescription,
        longDescription: newProductLongDescription,
        careInstructions: newProductCareInstructions,
        categoryId: newProductCategory,
        category: categories.find(c => c.id === newProductCategory)?.name || '',
        image: '', // Will be handled by addProduct if file exists
        images: [],
        isBundle: newProductIsBundle,
        bundleItems: newProductIsBundle ? newProductBundleItems : [],
        variants: newProductVariants as any
      }, newProductImage || undefined, newProductAdditionalImages.length > 0 ? newProductAdditionalImages : undefined);

      setIsAddingProduct(false);
      setNewProductName('');
      setNewProductPrice('');
      setNewProductSalePrice('');
      setNewProductIsSale(false);
      setNewProductIsNew(false);
      setNewProductIsBundle(false);
      setNewProductBundleItems([]);
      setNewProductStock('');
      setNewProductDescription('');
      setNewProductLongDescription('');
      setNewProductCareInstructions('');
      setNewProductCategory('');
      setNewProductImage(null);
      setNewProductAdditionalImages([]);
      setNewProductVariants([]);
      showToast('Producto creado correctamente', 'success');
    } catch (error) {
      showToast('Error al crear producto', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const renderProducts = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-serif font-bold">Gestión de Productos</h2>
        <button 
          onClick={() => setIsAddingProduct(!isAddingProduct)}
          className="bg-black text-white px-4 py-2 rounded-lg text-sm font-bold uppercase flex items-center gap-2 hover:bg-gray-800 transition-colors"
        >
          {isAddingProduct ? <XCircle size={18} /> : <Plus size={18} />}
          {isAddingProduct ? 'Cancelar' : 'Nuevo Producto'}
        </button>
      </div>

      {isAddingProduct && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
          <h3 className="text-lg font-bold mb-4">Agregar Nuevo Producto</h3>
          <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Nombre</label>
              <input 
                type="text" 
                value={newProductName}
                onChange={(e) => setNewProductName(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:border-black"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Categoría</label>
              <select
                value={newProductCategory}
                onChange={(e) => setNewProductCategory(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:border-black"
                required
              >
                <option value="">Selecciona una categoría</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Precio ($)</label>
              <input 
                type="number" 
                value={newProductPrice}
                onChange={(e) => setNewProductPrice(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:border-black"
                required
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Precio Oferta ($)</label>
              <input 
                type="number" 
                value={newProductSalePrice}
                onChange={(e) => setNewProductSalePrice(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:border-black"
                min="0"
                step="0.01"
                disabled={!newProductIsSale}
              />
            </div>
            <div className="flex items-center gap-6 py-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={newProductIsNew}
                  onChange={(e) => setNewProductIsNew(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-xs font-bold uppercase text-gray-500">Nuevo</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={newProductIsSale}
                  onChange={(e) => setNewProductIsSale(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-xs font-bold uppercase text-gray-500">Oferta</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={newProductIsBundle}
                  onChange={(e) => setNewProductIsBundle(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-xs font-bold uppercase text-gray-500">Producto Híbrido (Bundle)</span>
              </label>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                {newProductVariants.length > 0 || newProductIsBundle ? 'Stock Total (Calculado)' : 'Stock Total'}
              </label>
              <input 
                type="number" 
                value={newProductStock}
                onChange={(e) => setNewProductStock(e.target.value)}
                readOnly={newProductVariants.length > 0 || newProductIsBundle}
                className={`w-full border border-gray-300 p-2 rounded focus:outline-none focus:border-black ${newProductVariants.length > 0 || newProductIsBundle ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                required
                min="0"
              />
            </div>

            {newProductIsBundle && (
              <div className="md:col-span-2 bg-purple-50 p-4 rounded-lg border border-purple-100 mb-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-sm font-bold uppercase tracking-widest text-purple-900">Items del Bundle (Set)</h4>
                  <button 
                    type="button"
                    onClick={addBundleItemToNewProduct}
                    className="text-xs bg-purple-600 text-white px-3 py-1 rounded flex items-center gap-1 hover:bg-purple-700"
                  >
                    <Plus size={14} /> Agregar Item
                  </button>
                </div>
                <div className="space-y-3">
                  {newProductBundleItems.map((item, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end bg-white p-3 rounded border border-purple-100 shadow-sm">
                      <div className="md:col-span-5">
                        <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Producto Base</label>
                        <select 
                          value={item.productId}
                          onChange={(e) => {
                            const val = e.target.value;
                            setNewProductBundleItems(prev => {
                              const updated = [...prev];
                              updated[index] = { ...updated[index], productId: val, variantId: '' };
                              return updated;
                            });
                          }}
                          className="w-full border border-gray-300 p-1.5 rounded text-sm focus:outline-none focus:border-black"
                          required
                        >
                          <option value="">Seleccionar Producto</option>
                          {products.filter(p => !p.isBundle && p.id !== editingProductId).map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="md:col-span-4">
                        <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Variante (Recomendado para inventario)</label>
                        <select 
                          value={item.variantId || ''}
                          onChange={(e) => updateNewProductBundleItem(index, 'variantId', e.target.value)}
                          className="w-full border border-gray-300 p-1.5 rounded text-sm focus:outline-none focus:border-black"
                          disabled={!item.productId}
                        >
                          <option value="">Cualquier variante / Producto base</option>
                          {products.find(p => p.id === item.productId)?.variants?.map(v => (
                            <option key={v.id} value={v.id}>{v.color} - {v.size}</option>
                          ))}
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Cantidad</label>
                        <input 
                          type="number" 
                          value={item.quantity}
                          onChange={(e) => updateNewProductBundleItem(index, 'quantity', Number(e.target.value))}
                          className="w-full border border-gray-300 p-1.5 rounded text-sm focus:outline-none focus:border-black"
                          required
                          min="1"
                        />
                      </div>
                      <div className="md:col-span-1 flex justify-end">
                        <button 
                          type="button"
                          onClick={() => removeBundleItemFromNewProduct(index)}
                          className="text-red-500 hover:text-red-700 p-1.5"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {newProductBundleItems.length === 0 && (
                    <p className="text-xs text-purple-400 text-center py-2 italic">No hay items en este bundle. Agrega al menos uno.</p>
                  )}
                </div>
              </div>
            )}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Descripción Corta</label>
              <textarea 
                value={newProductDescription}
                onChange={(e) => setNewProductDescription(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:border-black h-20"
                placeholder="Breve descripción del producto..."
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Descripción Larga</label>
              <textarea 
                value={newProductLongDescription}
                onChange={(e) => setNewProductLongDescription(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:border-black h-32"
                placeholder="Descripción detallada del producto..."
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Cuidados</label>
              <textarea 
                value={newProductCareInstructions}
                onChange={(e) => setNewProductCareInstructions(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:border-black h-24"
                placeholder="Instrucciones de cuidado..."
              />
            </div>
            <div className="md:col-span-2 bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-bold uppercase tracking-widest">Variantes (Color y Talla)</h4>
                <button 
                  type="button"
                  onClick={addVariantToNewProduct}
                  className="text-xs bg-black text-white px-3 py-1 rounded flex items-center gap-1 hover:bg-gray-800"
                >
                  <Plus size={14} /> Agregar Variante
                </button>
              </div>
              <div className="space-y-3">
                {newProductVariants.map((variant, index) => (
                  <div key={index} className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end bg-white p-3 rounded border border-gray-100">
                    <div className="col-span-1">
                      <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Nombre Color</label>
                      <input 
                        type="text" 
                        value={variant.color}
                        onChange={(e) => updateNewProductVariant(index, 'color', e.target.value)}
                        placeholder="Ej: Rojo"
                        className="w-full border border-gray-300 p-1.5 rounded text-sm focus:outline-none focus:border-black"
                        required
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Color</label>
                      <div className="flex items-center gap-2">
                        <input 
                          type="color" 
                          value={variant.colorCode}
                          onChange={(e) => updateNewProductVariant(index, 'colorCode', e.target.value)}
                          className="w-full h-8 border border-gray-300 rounded cursor-pointer p-0"
                        />
                        <span className="text-[10px] font-mono">{variant.colorCode}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Talla</label>
                      <select 
                        value={variant.size}
                        onChange={(e) => updateNewProductVariant(index, 'size', e.target.value)}
                        className="w-full border border-gray-300 p-1.5 rounded text-sm focus:outline-none focus:border-black"
                        required
                      >
                        <option value="">Seleccionar</option>
                        {sizes.map(s => (
                          <option key={s.id} value={s.name}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Stock</label>
                      <input 
                        type="number" 
                        value={variant.stock}
                        onChange={(e) => updateNewProductVariant(index, 'stock', Number(e.target.value))}
                        className="w-full border border-gray-300 p-1.5 rounded text-sm focus:outline-none focus:border-black"
                        required
                        min="0"
                      />
                    </div>
                    <div className="flex justify-end">
                      <button 
                        type="button"
                        onClick={() => removeVariantFromNewProduct(index)}
                        className="text-red-500 hover:text-red-700 p-1.5"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
                {newProductVariants.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-2 italic">No hay variantes definidas. Se usará el stock general.</p>
                )}
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Imagen Principal</label>
              <input 
                type="file" 
                accept="image/*"
                onChange={(e) => setNewProductImage(e.target.files?.[0] || null)}
                className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:border-black file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Imágenes Adicionales (Máx. 5)</label>
              <input 
                type="file" 
                accept="image/*"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  setNewProductAdditionalImages(files.slice(0, 5));
                }}
                className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:border-black file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
              />
              {newProductAdditionalImages.length > 0 && (
                <div className="flex gap-2 mt-2">
                  {newProductAdditionalImages.map((file, i) => (
                    <div key={i} className="w-12 h-12 bg-gray-100 rounded overflow-hidden">
                      <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="md:col-span-2 flex justify-end mt-4">
              <button 
                type="submit"
                disabled={isUploading}
                className="bg-black text-white px-8 py-2 rounded text-sm font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {isUploading ? 'Guardando...' : 'Guardar Producto'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {productsLoading ? (
          <div className="p-12 flex justify-center">
            <Spinner size="xl" />
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500">
                <th className="p-4 font-bold">Producto</th>
                <th className="p-4 font-bold">Precio</th>
                <th className="p-4 font-bold">Stock</th>
                <th className="p-4 font-bold">Dañado</th>
                <th className="p-4 font-bold">Etiquetas</th>
                <th className="p-4 font-bold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map(product => (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {product.image ? (
                        <img src={product.image} alt={product.name} className="w-10 h-10 object-cover rounded" />
                      ) : (
                        <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center text-gray-400">
                          <ImageIcon size={20} />
                        </div>
                      )}
                      
                      {editingProductId === product.id ? (
                        <div className="space-y-3 w-full">
                          <input 
                            type="text" 
                            value={editName} 
                            onChange={(e) => setEditName(e.target.value)}
                            className="border border-gray-300 rounded p-1 text-sm w-full"
                            placeholder="Nombre del producto"
                          />
                          <select
                            value={editCategory}
                            onChange={(e) => setEditCategory(e.target.value)}
                            className="border border-gray-300 rounded p-1 text-xs w-full"
                          >
                            <option value="">Selecciona una categoría</option>
                            {categories.map(c => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                          <textarea 
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            className="border border-gray-300 rounded p-1 text-xs w-full h-16 mb-2"
                            placeholder="Descripción Corta"
                          />
                          <textarea 
                            value={editLongDescription}
                            onChange={(e) => setEditLongDescription(e.target.value)}
                            className="border border-gray-300 rounded p-1 text-xs w-full h-24"
                            placeholder="Descripción Larga"
                          />
                          <textarea 
                            value={editCareInstructions}
                            onChange={(e) => setEditCareInstructions(e.target.value)}
                            className="border border-gray-300 rounded p-1 text-xs w-full h-24 mb-2"
                            placeholder="Cuidados"
                          />
                          <div className="bg-gray-50 p-2 rounded border border-gray-100">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-[10px] font-bold uppercase text-gray-400">Variantes</span>
                              <button 
                                type="button"
                                onClick={addVariantToEditProduct}
                                className="text-[10px] bg-black text-white px-2 py-0.5 rounded"
                              >
                                + Agregar
                              </button>
                            </div>
                            <div className="space-y-2">
                              {editVariants.map((v, i) => (
                                <div key={i} className="flex flex-wrap gap-2 items-center bg-white p-2 rounded border border-gray-100">
                                  <input 
                                    type="text" 
                                    value={v.color}
                                    onChange={(e) => updateEditProductVariant(i, 'color', e.target.value)}
                                    placeholder="Color"
                                    className="w-20 border border-gray-300 p-1 rounded text-[10px]"
                                  />
                                  <input 
                                    type="color" 
                                    value={v.colorCode}
                                    onChange={(e) => updateEditProductVariant(i, 'colorCode', e.target.value)}
                                    className="w-6 h-6 border-0 p-0 cursor-pointer"
                                  />
                                  <select 
                                    value={v.size}
                                    onChange={(e) => updateEditProductVariant(i, 'size', e.target.value)}
                                    className="w-16 border border-gray-300 p-1 rounded text-[10px]"
                                  >
                                    <option value="">Talla</option>
                                    {sizes.map(s => (
                                      <option key={s.id} value={s.name}>{s.name}</option>
                                    ))}
                                  </select>
                                  <input 
                                    type="number" 
                                    value={v.stock}
                                    onChange={(e) => updateEditProductVariant(i, 'stock', Number(e.target.value))}
                                    placeholder="Stock"
                                    className="w-12 border border-gray-300 p-1 rounded text-[10px]"
                                  />
                                  <button onClick={() => removeVariantFromEditProduct(i)} className="text-red-500 ml-auto">
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                          {editIsBundle && (
                            <div className="bg-purple-50 p-2 rounded border border-purple-100 mt-3">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-[10px] font-bold uppercase text-purple-700">Items del Bundle</span>
                                <button 
                                  type="button"
                                  onClick={addBundleItemToEditProduct}
                                  className="text-[10px] bg-purple-600 text-white px-2 py-0.5 rounded"
                                >
                                  + Agregar
                                </button>
                              </div>
                              <div className="space-y-2">
                                {editBundleItems.map((item, i) => (
                                  <div key={i} className="flex flex-col gap-1 bg-white p-2 rounded border border-purple-100">
                                    <select 
                                      value={item.productId}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setEditBundleItems(prev => {
                                          const updated = [...prev];
                                          updated[i] = { ...updated[i], productId: val, variantId: '' };
                                          return updated;
                                        });
                                      }}
                                      className="w-full border border-gray-300 p-1 rounded text-[10px]"
                                    >
                                      <option value="">Producto</option>
                                      {products.filter(p => !p.isBundle && p.id !== editingProductId).map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                      ))}
                                    </select>
                                    <div className="flex gap-2">
                                      <select 
                                        value={item.variantId || ''}
                                        onChange={(e) => updateEditProductBundleItem(i, 'variantId', e.target.value)}
                                        className="flex-1 border border-gray-300 p-1 rounded text-[10px]"
                                        disabled={!item.productId}
                                      >
                                        <option value="">Cualquier variante</option>
                                        {products.find(p => p.id === item.productId)?.variants?.map(v => (
                                          <option key={v.id} value={v.id}>{v.color} - {v.size}</option>
                                        ))}
                                      </select>
                                      <input 
                                        type="number" 
                                        value={item.quantity}
                                        onChange={(e) => updateEditProductBundleItem(i, 'quantity', Number(e.target.value))}
                                        className="w-10 border border-gray-300 p-1 rounded text-[10px]"
                                        min="1"
                                      />
                                      <button onClick={() => removeBundleItemFromEditProduct(i)} className="text-red-500">
                                        <Trash2 size={12} />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          <div className="mt-2">
                            <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Cambiar Imagen Principal</label>
                            <input 
                              type="file" 
                              accept="image/*"
                              onChange={(e) => setEditProductImage(e.target.files?.[0] || null)}
                              className="w-full text-[10px] border border-gray-300 rounded p-1"
                            />
                          </div>
                          <div className="mt-2">
                            <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Imágenes Adicionales (Reemplaza todas)</label>
                            <input 
                              type="file" 
                              accept="image/*"
                              multiple
                              onChange={(e) => {
                                const files = Array.from(e.target.files || []);
                                setEditAdditionalImages(files.slice(0, 5));
                              }}
                              className="w-full text-[10px] border border-gray-300 rounded p-1"
                            />
                            {editExistingImages.length > 0 && editAdditionalImages.length === 0 && (
                              <div className="flex gap-1 mt-1">
                                {editExistingImages.map((img, i) => (
                                  <img key={i} src={img} alt="" className="w-6 h-6 object-cover rounded" />
                                ))}
                              </div>
                            )}
                            {editAdditionalImages.length > 0 && (
                              <div className="flex gap-1 mt-1">
                                {editAdditionalImages.map((file, i) => (
                                  <img key={i} src={URL.createObjectURL(file)} alt="" className="w-6 h-6 object-cover rounded" />
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <span className="font-medium text-sm block">{product.name}</span>
                          <span className="text-xs text-gray-500">{product.category}</span>
                          {product.variants && product.variants.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {product.variants.map((v: any, i: number) => (
                                <span key={i} className={`text-[8px] px-1 rounded ${v.damagedStock > 0 ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-gray-100 text-gray-500'}`}>
                                  {v.color}/{v.size} ({v.stock}){v.damagedStock > 0 && ` [D: ${v.damagedStock}]`}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  
                  {editingProductId === product.id ? (
                    <>
                      <td className="p-4">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-gray-400">P:</span>
                            <input 
                              type="number" 
                              value={editPrice} 
                              onChange={(e) => setEditPrice(e.target.value)}
                              className="w-16 border border-gray-300 rounded p-1 text-xs"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-gray-400">O:</span>
                            <input 
                              type="number" 
                              value={editSalePrice} 
                              onChange={(e) => setEditSalePrice(e.target.value)}
                              className="w-16 border border-gray-300 rounded p-1 text-xs"
                              disabled={!editIsSale}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <input 
                          type="number" 
                          value={editStock} 
                          onChange={(e) => setEditStock(e.target.value)}
                          readOnly={editVariants.length > 0}
                          className={`w-16 border border-gray-300 rounded p-1 text-xs ${editVariants.length > 0 ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                          title={editVariants.length > 0 ? "Calculado automáticamente de las variantes" : "Stock manual"}
                        />
                      </td>
                      <td className="p-4">
                        <div className="text-xs text-red-600 font-bold">
                          {product.damagedStock || 0}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1">
                          <label className="flex items-center gap-1 text-[10px] font-bold uppercase text-gray-500">
                            <input 
                              type="checkbox" 
                              checked={editIsFeatured} 
                              onChange={(e) => setEditIsFeatured(e.target.checked)}
                              className="w-3 h-3"
                            />
                            Dest.
                          </label>
                          <label className="flex items-center gap-1 text-[10px] font-bold uppercase text-gray-500">
                            <input 
                              type="checkbox" 
                              checked={editIsNew} 
                              onChange={(e) => setEditIsNew(e.target.checked)}
                              className="w-3 h-3"
                            />
                            Nuevo
                          </label>
                          <label className="flex items-center gap-1 text-[10px] font-bold uppercase text-gray-500">
                            <input 
                              type="checkbox" 
                              checked={editIsSale} 
                              onChange={(e) => setEditIsSale(e.target.checked)}
                              className="w-3 h-3"
                            />
                            Oferta
                          </label>
                          <label className="flex items-center gap-1 text-[10px] font-bold uppercase text-gray-500">
                            <input 
                              type="checkbox" 
                              checked={editIsBundle} 
                              onChange={(e) => setEditIsBundle(e.target.checked)}
                              className="w-3 h-3"
                            />
                            Bundle
                          </label>
                        </div>
                      </td>
                      <td className="p-4 flex gap-2">
                        <button 
                          onClick={() => saveProductEdit(product)}
                          className="bg-black text-white px-3 py-1 rounded text-xs font-bold uppercase"
                        >
                          Guardar
                        </button>
                        <button 
                          onClick={() => setEditingProductId(null)}
                          className="bg-gray-200 text-black px-3 py-1 rounded text-xs font-bold uppercase"
                        >
                          Cancelar
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">${product.price.toFixed(2)}</span>
                          {product.isSale && product.salePrice && (
                            <span className="text-xs text-red-500 font-bold">Oferta: ${product.salePrice.toFixed(2)}</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          (product.stock || 0) > 10 ? 'bg-green-100 text-green-800' : 
                          (product.stock || 0) > 0 ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-red-100 text-red-800'
                        }`}>
                          {product.stock || 0}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          (product.damagedStock || 0) > 0 ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-400'
                        }`}>
                          {product.damagedStock || 0}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {product.isFeatured && (
                            <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800">Dest.</span>
                          )}
                          {product.isNew && (
                            <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-green-100 text-green-800">Nuevo</span>
                          )}
                          {product.isSale && (
                            <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-red-100 text-red-800">Oferta</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => startEditingProduct(product)}
                            className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm font-medium"
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            onClick={() => openConfirmModal(
                              'Eliminar Producto',
                              '¿Estás seguro de eliminar este producto? Esta acción no se puede deshacer y eliminará todas las imágenes asociadas.',
                              async () => {
                                setIsUploading(true);
                                try {
                                  await deleteProduct(product.id);
                                  showToast('Producto eliminado correctamente', 'success');
                                } catch (error) {
                                  showToast('Error al eliminar producto', 'error');
                                } finally {
                                  setIsUploading(false);
                                }
                              },
                              true
                            )}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
              {products.length === 0 && !productsLoading && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    No hay productos disponibles.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );

  const renderSizes = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-serif font-bold mb-6">Gestión de Tallas</h2>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-sm font-bold uppercase tracking-widest mb-4">Añadir Nueva Talla</h3>
        <form onSubmit={handleAddSize} className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Nombre (Ej: S, M, 38)</label>
            <input 
              type="text" 
              value={newSizeName}
              onChange={(e) => setNewSizeName(e.target.value)}
              className="w-full border border-gray-300 p-2 rounded text-sm focus:outline-none focus:border-black"
              placeholder="Nombre de la talla"
              required
            />
          </div>
          <div className="w-24">
            <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Orden</label>
            <input 
              type="number" 
              value={newSizeOrder}
              onChange={(e) => setNewSizeOrder(e.target.value)}
              className="w-full border border-gray-300 p-2 rounded text-sm focus:outline-none focus:border-black"
              required
            />
          </div>
          <button 
            type="submit"
            className="bg-black text-white px-6 py-2 rounded text-sm font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors"
          >
            Añadir
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500">
              <th className="p-4 font-bold">Nombre</th>
              <th className="p-4 font-bold">Orden</th>
              <th className="p-4 font-bold">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sizes.map(size => (
              <tr key={size.id} className="hover:bg-gray-50 transition-colors">
                {editingSizeId === size.id ? (
                  <>
                    <td className="p-4">
                      <input 
                        type="text" 
                        value={editSizeName}
                        onChange={(e) => setEditSizeName(e.target.value)}
                        className="w-full border border-gray-300 p-1 rounded text-sm"
                      />
                    </td>
                    <td className="p-4">
                      <input 
                        type="number" 
                        value={editSizeOrder}
                        onChange={(e) => setEditSizeOrder(e.target.value)}
                        className="w-20 border border-gray-300 p-1 rounded text-sm"
                      />
                    </td>
                    <td className="p-4 flex gap-2">
                      <button 
                        onClick={() => handleUpdateSize(size.id)}
                        className="text-green-600 hover:text-green-800"
                      >
                        <CheckCircle size={18} />
                      </button>
                      <button 
                        onClick={() => setEditingSizeId(null)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <XCircle size={18} />
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="p-4 font-medium">{size.name}</td>
                    <td className="p-4 text-gray-600">{size.orderIndex}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => {
                            setEditingSizeId(size.id);
                            setEditSizeName(size.name);
                            setEditSizeOrder(size.orderIndex.toString());
                          }}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => openConfirmModal(
                            'Eliminar Talla',
                            '¿Estás seguro de eliminar esta talla?',
                            async () => {
                              setIsUploading(true);
                              try {
                                await deleteSize(size.id);
                                showToast('Talla eliminada correctamente', 'success');
                              } catch (error) {
                                showToast('Error al eliminar talla', 'error');
                              } finally {
                                setIsUploading(false);
                              }
                            },
                            true
                          )}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
            {sizes.length === 0 && (
              <tr>
                <td colSpan={3} className="p-8 text-center text-gray-500">
                  No hay tallas configuradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderOrders = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-serif font-bold mb-6">Gestión de Pedidos</h2>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {ordersLoading ? (
          <div className="p-12 flex justify-center">
            <Spinner size="xl" />
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500">
                <th className="p-4 font-bold">ID / Fecha</th>
                <th className="p-4 font-bold">Cliente</th>
                <th className="p-4 font-bold">Productos</th>
                <th className="p-4 font-bold">Envío</th>
                <th className="p-4 font-bold">Pago</th>
                <th className="p-4 font-bold">Total</th>
                <th className="p-4 font-bold">Estado</th>
                <th className="p-4 font-bold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map(order => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 align-top">
                    <div className="flex flex-col">
                      <span className="font-mono font-bold text-xs truncate max-w-[100px]" title={order.id}>#{order.id.slice(0, 8)}</span>
                      <span className="text-xs text-gray-500">{new Date(order.created_at || order.date).toLocaleDateString()}</span>
                      {order.is_gift || order.isGift ? (
                        <span className="mt-1 bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter w-fit">
                          Regalo
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="p-4 align-top">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold">{order.customer?.full_name || 'Desconocido'}</span>
                      <span className="text-xs text-gray-500">{order.customer?.email || 'No disponible'}</span>
                    </div>
                  </td>
                  <td className="p-4 align-top">
                    <div className="flex flex-col gap-1 max-w-[150px]">
                      {order.items?.map((item: any, idx: number) => (
                        <div key={idx} className="text-[10px] border-b border-gray-50 pb-1 last:border-0 last:pb-0">
                          <span className="font-bold">{item.quantity}x</span> {item.name}
                          {item.color || item.size ? (
                            <span className="text-gray-400 block italic">
                              ({[item.color, item.size].filter(Boolean).join(' / ')})
                            </span>
                          ) : (
                            <span className="text-gray-300 block italic">(Sin variante)</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="p-4 align-top">
                    <div className="flex flex-col max-w-[200px]">
                      <span className="text-xs font-medium truncate">{order.shipping_address || 'Dirección no disponible'}</span>
                      {(order.gift_details || order.giftDetails) && (
                        <div className="mt-1 text-[10px] bg-gray-50 p-1 rounded border border-gray-100">
                          <span className="font-bold">Para:</span> {(order.gift_details || order.giftDetails).recipientName}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-4 align-top">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-bold uppercase flex items-center gap-1">
                        <DollarSign size={12} />
                        {order.payment_method === 'pago-movil' ? 'Pago Móvil' : 'Transferencia'}
                      </span>
                      {order.paymentDetails && (
                        <div className="text-[10px] text-gray-500 space-y-0.5">
                          <div><span className="font-medium">Banco:</span> {order.paymentDetails.bank}</div>
                          <div><span className="font-medium">Ref:</span> {order.paymentDetails.referenceNumber}</div>
                          <div><span className="font-medium">Dep:</span> {order.paymentDetails.depositorName}</div>
                          <div><span className="font-medium">C.I.:</span> {order.paymentDetails.depositorId}</div>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-4 align-top font-medium text-sm">
                    ${Number(order.total).toFixed(2)}
                  </td>
                  <td className="p-4 align-top">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      order.status === 'Enviado' ? 'bg-blue-100 text-blue-800' :
                      order.status === 'Pago Aprobado' ? 'bg-green-100 text-green-800' :
                      order.status === 'Entregado' ? 'bg-gray-100 text-gray-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="p-4 align-top">
                    <div className="flex flex-col gap-2">
                      <select 
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        className="text-xs border border-gray-300 rounded p-1 focus:outline-none focus:border-black w-full"
                      >
                        <option value="Pendiente">Pendiente</option>
                        <option value="Pago Aprobado">Pago Aprobado</option>
                        <option value="Enviado">Enviado</option>
                        <option value="Cancelado">Cancelado</option>
                      </select>
                      <button 
                        onClick={() => generatePDF(order)}
                        className="flex items-center justify-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold py-1 px-2 rounded transition-colors"
                      >
                        <FileText size={12} /> Imprimir PDF
                      </button>
                      <button 
                        onClick={() => setViewingOrder(order)}
                        className="flex items-center justify-center gap-1 bg-black hover:bg-gray-800 text-white text-xs font-bold py-1 px-2 rounded transition-colors"
                      >
                        <Eye size={12} /> Ver Detalles
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-500">
                    No hay pedidos registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );

  const handleProcessReturn = async () => {
    if (!processingReturn) return;
    
    setIsUploading(true);
    try {
      await processReturn({
        orderId: processingReturn.orderId,
        userId: processingReturn.userId,
        productId: processingReturn.item.product_id || processingReturn.item.productId,
        variantId: processingReturn.item.variant_id || processingReturn.item.variantId,
        quantity: processingReturn.item.quantity,
        reason: returnReason,
        exchangeProductId: exchangeProductId || undefined,
        exchangeVariantId: exchangeVariantId || undefined,
        notes: returnNotes
      });
      
      setProcessingReturn(null);
      setReturnReason('voluntary');
      setExchangeProductId('');
      setExchangeVariantId('');
      setReturnNotes('');
      showToast('Devolución procesada correctamente', 'success');
      fetchAllReturns();
    } catch (error) {
      showToast('Error al procesar devolución', 'error');
    } finally {
      setIsUploading(false);
    }
  };
  const handleSaveSocialLinks = async () => {
    await updateSocialLinks(localSocialLinks);
    setToast({ visible: true, message: 'Redes sociales actualizadas', type: 'success' });
  };

  const renderSettings = () => (
    <div className="space-y-8">
      <h2 className="text-2xl font-serif font-bold mb-6">Lógica de Negocio</h2>
      
      {/* Shipping Settings */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Truck size={20} /> Configuración de Envío
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Costo de Envío Base ($)</label>
            <input 
              type="number" 
              value={baseShippingCostInput}
              onChange={(e) => setBaseShippingCostInput(e.target.value)}
              className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:border-black"
            />
            <p className="text-[10px] text-gray-400 mt-1">Monto que se cobrará si no se cumple el envío gratis.</p>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Monto Mínimo para Envío Gratis ($)</label>
            <input 
              type="number" 
              value={shippingThresholdInput}
              onChange={(e) => setShippingThresholdInput(e.target.value)}
              className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:border-black"
            />
            <p className="text-[10px] text-gray-400 mt-1">Los pedidos por encima de este monto tendrán envío gratuito.</p>
          </div>
        </div>
        <div className="flex justify-end">
          <button 
            onClick={handleSaveSettings}
            className="bg-black text-white px-8 py-2 rounded text-sm font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors"
          >
            Guardar Cambios
          </button>
        </div>
      </div>

      {/* Social Media Settings */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Share2 size={20} /> Redes Sociales
        </h3>
        <p className="text-sm text-gray-500 mb-6">Configura los enlaces que aparecen en el pie de página y contacto.</p>
        
        <div className="space-y-4 mb-6">
          {localSocialLinks.map((link, index) => (
            <div key={index} className="flex gap-4 items-start bg-gray-50 p-4 rounded-lg border border-gray-100">
              <div className="w-10 h-10 bg-white rounded-lg border border-gray-200 flex items-center justify-center shrink-0 mt-6">
                <SocialIcon name={link.name} url={link.url} size={20} className="text-gray-400" />
              </div>
              <div className="flex-1 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Nombre de la Red</label>
                    <input 
                      type="text" 
                      value={link.name}
                      onChange={(e) => {
                        const updated = [...localSocialLinks];
                        updated[index].name = e.target.value;
                        setLocalSocialLinks(updated);
                      }}
                      placeholder="Ej: Instagram, TikTok, Facebook"
                      className="w-full border border-gray-300 p-2 rounded text-sm focus:outline-none focus:border-black"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Enlace (URL)</label>
                    <input 
                      type="url" 
                      value={link.url}
                      onChange={(e) => {
                        const updated = [...localSocialLinks];
                        updated[index].url = e.target.value;
                        setLocalSocialLinks(updated);
                      }}
                      placeholder="https://instagram.com/tuusuario"
                      className="w-full border border-gray-300 p-2 rounded text-sm focus:outline-none focus:border-black"
                    />
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setLocalSocialLinks(localSocialLinks.filter((_, i) => i !== index))}
                className="text-red-500 hover:text-red-700 p-2"
                title="Eliminar"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
          
          {localSocialLinks.length === 0 && (
            <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300 text-gray-400 text-sm">
              No hay redes sociales configuradas.
            </div>
          )}
        </div>

        <div className="flex justify-between items-center">
          <button 
            onClick={() => setLocalSocialLinks([...localSocialLinks, { name: '', url: '' }])}
            className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest hover:text-gray-600 transition-colors"
          >
            <Plus size={16} /> Agregar Red Social
          </button>
          
          <button 
            onClick={handleSaveSocialLinks}
            className="bg-black text-white px-8 py-2 rounded text-sm font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors"
          >
            Guardar Redes
          </button>
        </div>
      </div>

      {/* Coupons Settings */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Tag size={20} /> Cupones de Descuento
        </h3>
        
        <form onSubmit={handleAddCoupon} className="flex items-end gap-4 mb-8 bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Código</label>
            <input 
              type="text" 
              value={newCouponCode}
              onChange={(e) => setNewCouponCode(e.target.value)}
              placeholder="Ej: VERANO20"
              required
              className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:border-black uppercase"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Descuento (%)</label>
            <input 
              type="number" 
              value={newCouponDiscount}
              onChange={(e) => setNewCouponDiscount(e.target.value)}
              placeholder="Ej: 15"
              min="1"
              max="100"
              required
              className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:border-black"
            />
          </div>
          <button 
            type="submit"
            className="bg-black text-white px-4 py-2 rounded text-sm font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors flex items-center gap-2"
          >
            <Plus size={16} /> Agregar
          </button>
        </form>

        <div className="space-y-3">
          {coupons.map(coupon => (
            <div key={coupon.code} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`w-2 h-2 rounded-full ${coupon.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <div>
                  <p className="font-bold text-lg">{coupon.code}</p>
                  <p className="text-sm text-gray-500">{coupon.discountPercentage}% de descuento</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={async () => {
                    try {
                      await toggleCouponStatus(coupon.code);
                      showToast(`Cupón ${coupon.isActive ? 'desactivado' : 'activado'}`, 'success');
                    } catch (error) {
                      showToast('Error al cambiar estado del cupón', 'error');
                    }
                  }}
                  className={`text-sm font-medium px-3 py-1 rounded-full ${coupon.isActive ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' : 'bg-green-100 text-green-800 hover:bg-green-200'}`}
                >
                  {coupon.isActive ? 'Desactivar' : 'Activar'}
                </button>
                <button 
                  onClick={() => openConfirmModal(
                    'Eliminar Cupón',
                    '¿Estás seguro de eliminar este cupón?',
                    async () => {
                      setIsUploading(true);
                      try {
                        await deleteCoupon(coupon.code);
                        showToast('Cupón eliminado correctamente', 'success');
                      } catch (error) {
                        showToast('Error al eliminar cupón', 'error');
                      } finally {
                        setIsUploading(false);
                      }
                    },
                    true
                  )}
                  className="text-red-500 hover:text-red-700 p-2"
                  title="Eliminar cupón"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
          {coupons.length === 0 && (
            <p className="text-gray-500 text-center py-4">No hay cupones creados.</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-serif font-bold mb-6">Gestión de Usuarios</h2>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {usersLoading ? (
          <div className="p-12 flex justify-center">
            <Spinner size="xl" />
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500">
                <th className="p-4 font-bold">Usuario</th>
                <th className="p-4 font-bold">Email</th>
                <th className="p-4 font-bold">Rol</th>
                <th className="p-4 font-bold">Fecha Registro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-bold text-xs">
                        {u.full_name?.charAt(0) || u.email?.charAt(0) || '?'}
                      </div>
                      <span className="font-medium text-sm">{u.full_name || 'Sin nombre'}</span>
                      {u.is_lead_conversion && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full uppercase tracking-tighter">
                          Lead
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-sm text-gray-600">{u.email}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-gray-500">
                    {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">
                    No hay usuarios registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );

  const renderLeads = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center">
        <h2 className="text-xl font-serif font-bold">Leads de Suscripción</h2>
        <div className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
          {leads.length} Total
        </div>
      </div>
      <div className="overflow-x-auto">
        {leadsLoading ? (
          <div className="p-12 flex justify-center">
            <Spinner />
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-[10px] uppercase tracking-widest text-gray-400 font-bold">
                <th className="p-4">Email</th>
                <th className="p-4">WhatsApp</th>
                <th className="p-4">Estado</th>
                <th className="p-4">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 text-sm font-medium">{lead.email}</td>
                  <td className="p-4 text-sm text-gray-600">{lead.whatsapp || '-'}</td>
                  <td className="p-4">
                    {lead.converted_user_id ? (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded-full uppercase">
                        Convertido
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-100 text-gray-500 text-[10px] font-bold rounded-full uppercase">
                        Pendiente
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-sm text-gray-500">
                    {new Date(lead.created_at).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                </tr>
              ))}
              {leads.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-gray-500">
                    No hay leads registrados aún.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );

  const renderReturns = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-serif font-bold">Gestión de Devoluciones</h2>
        <button 
          onClick={() => setManualReturnOpen(true)}
          className="bg-black text-white px-4 py-2 rounded-lg text-sm font-bold uppercase flex items-center gap-2 hover:bg-gray-800 transition-colors"
        >
          <Plus size={18} /> Registrar Devolución Manual
        </button>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {returnsLoading ? (
          <div className="p-12 flex justify-center">
            <Spinner size="xl" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500">
                  <th className="p-4 font-bold">ID Orden</th>
                  <th className="p-4 font-bold">Cliente</th>
                  <th className="p-4 font-bold">Producto Devuelto</th>
                  <th className="p-4 font-bold">Motivo</th>
                  <th className="p-4 font-bold">Cambio por</th>
                  <th className="p-4 font-bold">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {returns.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-mono text-xs">#{r.order_id.slice(0, 8)}</td>
                    <td className="p-4">
                      <div className="text-sm font-medium">{r.customer?.full_name}</div>
                      <div className="text-xs text-gray-500">{r.customer?.email}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {r.product?.image_url && (
                          <img src={r.product.image_url} alt="" className="w-8 h-8 rounded object-cover" />
                        )}
                        <span className="text-sm">{r.product?.name}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                        r.reason === 'defect' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {r.reason === 'defect' ? 'Garantía' : 'Voluntaria'}
                      </span>
                    </td>
                    <td className="p-4 text-sm">
                      {r.exchange_product?.name || 'Mismo producto'}
                    </td>
                    <td className="p-4 text-sm text-gray-500">
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {returns.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-gray-500">
                      No hay devoluciones registradas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-20 px-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8">
        
        {/* Sidebar */}
        <div className="md:w-64 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sticky top-24">
            <div className="mb-6 px-4">
              <h1 className="font-serif font-bold text-xl">Panel Admin</h1>
              <p className="text-xs text-gray-500">ESEN CONCEPT</p>
            </div>
            
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'dashboard' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <LayoutDashboard size={18} /> Dashboard
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'orders' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Package size={18} /> Pedidos
              </button>
              <button
                onClick={() => setActiveTab('products')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'products' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Tag size={18} /> Productos
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'users' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Users size={18} /> Usuarios
              </button>
              <button
                onClick={() => setActiveTab('leads')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'leads' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Mail size={18} /> Leads
              </button>
              <button
                onClick={() => setActiveTab('returns')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'returns' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <RotateCcw size={18} /> Devoluciones
              </button>
              <button
                onClick={() => setActiveTab('categories')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'categories' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Folder size={18} /> Categorías
              </button>
              <button
                onClick={() => setActiveTab('sizes')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'sizes' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Ruler size={18} /> Tallas
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'settings' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Settings size={18} /> Configuración
              </button>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'dashboard' && (
              (ordersLoading || usersLoading || productsLoading || leadsLoading) ? (
                <div className="flex justify-center items-center h-64">
                  <Spinner size="xl" />
                </div>
              ) : (
                <AdminDashboard orders={orders} products={products} users={users} leads={leads} />
              )
            )}
            {activeTab === 'orders' && renderOrders()}
            {activeTab === 'settings' && renderSettings()}
            {activeTab === 'products' && renderProducts()}
            {activeTab === 'users' && renderUsers()}
            {activeTab === 'leads' && renderLeads()}
            {activeTab === 'returns' && renderReturns()}
            {activeTab === 'sizes' && renderSizes()}
            {activeTab === 'categories' && renderCategories()}
          </motion.div>
        </div>

      </div>
      
      {toast.visible && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(prev => ({ ...prev, visible: false }))} 
        />
      )}
      
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={closeConfirmModal}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        isDestructive={confirmModal.isDestructive}
      />

      {isConfirmModalOpen && pendingOrderUpdate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
          >
            <h3 className="text-xl font-bold mb-4">
              {pendingOrderUpdate.newStatus === 'Pago Aprobado' ? 'Confirmar Aprobación de Pago' : 'Confirmar Envío'}
            </h3>
            
            <div className="mb-6">
              <p className="text-gray-800 mb-2">
                Estás a punto de cambiar el estado a <strong className="text-black">{pendingOrderUpdate.newStatus}</strong> para <strong className="text-black">{pendingOrderUpdate.customerName}</strong>.
              </p>
              
              {pendingOrderUpdate.newStatus === 'Enviado' && (
                <div className="mt-4">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Número de Guía / Tracking</label>
                  <input 
                    type="text" 
                    value={pendingOrderUpdate.trackingNumber || ''}
                    onChange={(e) => setPendingOrderUpdate({...pendingOrderUpdate, trackingNumber: e.target.value})}
                    placeholder="Ej: TEALCA-123456"
                    className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:border-black"
                    autoFocus
                  />
                </div>
              )}

              <p className="text-sm text-gray-500 bg-green-50 p-3 rounded-lg border border-green-100 mt-4">
                Al confirmar, se actualizará el estado y se abrirá WhatsApp para enviar la notificación al cliente.
              </p>
            </div>
            
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setIsConfirmModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 font-medium hover:bg-gray-50 transition-colors text-sm"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmStatusChange}
                disabled={pendingOrderUpdate.newStatus === 'Enviado' && !pendingOrderUpdate.trackingNumber}
                className={`px-4 py-2 rounded-lg text-white font-bold flex items-center gap-2 text-sm transition-colors ${
                  pendingOrderUpdate.newStatus === 'Enviado' && !pendingOrderUpdate.trackingNumber 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                <CheckCircle size={16} /> Confirmar y Enviar
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Order Details Modal */}
      <AnimatePresence>
        {viewingOrder && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col relative overflow-hidden"
            >
              {/* Fixed Header */}
              <div className="p-6 border-b border-gray-100 shrink-0 flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-serif font-bold">Detalles del Pedido</h2>
                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    <span className="font-mono text-sm text-gray-500">#{viewingOrder.id}</span>
                    <span className="text-sm text-gray-500">•</span>
                    <span className="text-sm text-gray-500">{new Date(viewingOrder.created_at || viewingOrder.date).toLocaleString()}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      viewingOrder.status === 'Enviado' ? 'bg-blue-100 text-blue-800' :
                      viewingOrder.status === 'Pago Aprobado' ? 'bg-green-100 text-green-800' :
                      viewingOrder.status === 'Entregado' ? 'bg-gray-100 text-gray-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {viewingOrder.status}
                    </span>
                    {(viewingOrder.is_gift || viewingOrder.isGift) && (
                      <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Regalo
                      </span>
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => setViewingOrder(null)}
                  className="text-gray-400 hover:text-black transition-colors p-1"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="p-6 overflow-y-auto flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  {/* Customer Info */}
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-2">
                      <Users size={16} /> Datos del Cliente
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                      <p><span className="font-medium text-gray-500">Nombre:</span> {viewingOrder.customer?.full_name}</p>
                      <p><span className="font-medium text-gray-500">Email:</span> {viewingOrder.customer?.email}</p>
                      <p><span className="font-medium text-gray-500">Teléfono:</span> {viewingOrder.customer?.phone || 'No especificado'}</p>
                      <p><span className="font-medium text-gray-500">Cédula / ID:</span> {viewingOrder.customer?.document_id || 'No especificado'}</p>
                    </div>
                  </div>

                  {/* Shipping Info */}
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-2">
                      <Truck size={16} /> Envío
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                      <p><span className="font-medium text-gray-500">Dirección:</span> {viewingOrder.shipping_address}</p>
                      <p><span className="font-medium text-gray-500">Ciudad:</span> {viewingOrder.city || 'No especificada'}</p>
                      <p><span className="font-medium text-gray-500">Estado:</span> {viewingOrder.state || 'No especificado'}</p>
                      <p><span className="font-medium text-gray-500">Código Postal:</span> {viewingOrder.zip_code || 'No especificado'}</p>
                      {viewingOrder.shipping_method && (
                        <p><span className="font-medium text-gray-500">Método de Envío:</span> {viewingOrder.shipping_method}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Gift Details */}
                {(viewingOrder.gift_details || viewingOrder.giftDetails) && (
                  <div className="mb-8">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-purple-600 mb-3 flex items-center gap-2">
                      <Package size={16} /> Detalles del Regalo
                    </h3>
                    <div className="bg-purple-50 p-4 rounded-lg space-y-2 text-sm border border-purple-100">
                      <p><span className="font-medium text-purple-800">Para:</span> {(viewingOrder.gift_details || viewingOrder.giftDetails).recipientName}</p>
                      <p><span className="font-medium text-purple-800">De:</span> {(viewingOrder.gift_details || viewingOrder.giftDetails).senderName}</p>
                      <p><span className="font-medium text-purple-800">Mensaje:</span></p>
                      <p className="italic text-gray-700 bg-white p-3 rounded border border-purple-100 mt-1">
                        "{(viewingOrder.gift_details || viewingOrder.giftDetails).message}"
                      </p>
                    </div>
                  </div>
                )}

                {/* Payment Details */}
                <div className="mb-8">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-2">
                    <DollarSign size={16} /> Detalles de Pago
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                    <p><span className="font-medium text-gray-500">Método:</span> {
                      viewingOrder.payment_method === 'pago-movil' ? 'Pago Móvil' : 
                      viewingOrder.payment_method === 'transferencia' ? 'Transferencia Bancaria' :
                      viewingOrder.payment_method
                    }</p>
                    {viewingOrder.paymentDetails && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 pt-2 border-t border-gray-200">
                        <p><span className="font-medium text-gray-500">Banco:</span> {viewingOrder.paymentDetails.bank}</p>
                        <p><span className="font-medium text-gray-500">Referencia:</span> {viewingOrder.paymentDetails.referenceNumber}</p>
                        <p><span className="font-medium text-gray-500">Depositante:</span> {viewingOrder.paymentDetails.depositorName}</p>
                        <p><span className="font-medium text-gray-500">C.I. Depositante:</span> {viewingOrder.paymentDetails.depositorId}</p>
                        <p><span className="font-medium text-gray-500">Fecha del Pago:</span> {viewingOrder.paymentDetails.date}</p>
                        {viewingOrder.paymentDetails.amount && (
                          <p><span className="font-medium text-gray-500">Monto Reportado:</span> {viewingOrder.paymentDetails.amount}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Items */}
                <div className="mb-8">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-2">
                    <Package size={16} /> Productos
                  </h3>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="p-3 font-medium text-gray-500">Producto</th>
                            <th className="p-3 font-medium text-gray-500">Variante</th>
                            <th className="p-3 font-medium text-gray-500 text-center">Cant.</th>
                            <th className="p-3 font-medium text-gray-500 text-right">Precio</th>
                            <th className="p-3 font-medium text-gray-500 text-right">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {viewingOrder.items?.map((item: any, index: number) => (
                            <tr key={index}>
                              <td className="p-3 font-medium">{item.name}</td>
                              <td className="p-3 text-gray-500">
                                {[item.color, item.size].filter(Boolean).join(' / ') || '-'}
                              </td>
                              <td className="p-3 text-center">{item.quantity}</td>
                              <td className="p-3 text-right">${Number(item.price).toFixed(2)}</td>
                              <td className="p-3 text-right font-medium">${(Number(item.price) * item.quantity).toFixed(2)}</td>
                              <td className="p-3 text-right">
                                <button 
                                  onClick={() => setProcessingReturn({
                                    orderId: viewingOrder.id,
                                    userId: viewingOrder.user_id,
                                    item: item
                                  })}
                                  className="text-amber-600 hover:text-amber-800 text-xs font-bold uppercase flex items-center gap-1 ml-auto"
                                >
                                  <RotateCcw size={12} /> Devolución
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Totals */}
                <div className="flex justify-end border-t border-gray-100 pt-4">
                  <div className="w-64 space-y-2 text-sm">
                    <div className="flex justify-between text-gray-500">
                      <span>Subtotal:</span>
                      <span>${Number(viewingOrder.subtotal).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                      <span>Envío:</span>
                      <span>${Number(viewingOrder.shipping_cost || 0).toFixed(2)}</span>
                    </div>
                    {viewingOrder.discount > 0 && (
                      <div className="flex justify-between text-red-500">
                        <span>Descuento:</span>
                        <span>-${Number(viewingOrder.discount).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-100">
                      <span>Total:</span>
                      <span>${Number(viewingOrder.total).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fixed Footer */}
              <div className="p-6 border-t border-gray-100 shrink-0 flex justify-end">
                <button 
                  onClick={() => setViewingOrder(null)}
                  className="bg-black text-white px-8 py-2 rounded-lg text-sm font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Process Return Modal */}
      <AnimatePresence>
        {(processingReturn || manualReturnOpen) && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Procesar Devolución / Cambio</h3>
                <button onClick={() => { setProcessingReturn(null); setManualReturnOpen(false); }} className="text-gray-400 hover:text-black">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                {processingReturn?.item ? (
                  <div className="bg-amber-50 p-4 rounded-lg border border-amber-100 mb-4">
                    <p className="text-sm font-medium text-amber-800">Producto a devolver:</p>
                    <p className="text-sm text-amber-900 font-bold">{processingReturn.item.name}</p>
                    <p className="text-xs text-amber-700">
                      {processingReturn.item.color} / {processingReturn.item.size} ({processingReturn.item.quantity} ud.)
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Pedido (Enviado)</label>
                      <select 
                        className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:border-black"
                        onChange={(e) => {
                          const order = orders.find(o => o.id === e.target.value);
                          if (order) setProcessingReturn({ orderId: order.id, userId: order.user_id, item: null });
                        }}
                      >
                        <option value="">Selecciona pedido</option>
                        {orders.filter(o => o.status === 'Enviado').map(o => (
                          <option key={o.id} value={o.id}>#{o.id.slice(0, 8)} - {o.customer?.full_name}</option>
                        ))}
                      </select>
                    </div>
                    {processingReturn?.orderId !== 'MANUAL' && processingReturn?.orderId && (
                      <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Producto del Pedido</label>
                        <select 
                          className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:border-black"
                          onChange={(e) => {
                            const order = orders.find(o => o.id === processingReturn.orderId);
                            const item = order?.items?.find((i: any, idx: number) => `${idx}` === e.target.value);
                            if (item) {
                              setProcessingReturn({ 
                                ...processingReturn, 
                                item: { 
                                  ...item, 
                                  name: item.name,
                                  productId: item.product_id || item.productId || item.id, 
                                  variantId: item.variant_id || item.variantId, 
                                  quantity: 1,
                                  color: item.color,
                                  size: item.size
                                } 
                              });
                            }
                          }}
                        >
                          <option value="">Selecciona producto</option>
                          {orders.find(o => o.id === processingReturn.orderId)?.items?.map((item: any, idx: number) => (
                            <option key={idx} value={idx}>{item.name} {item.color ? `(${item.color}/${item.size})` : ''}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Motivo de la Devolución</label>
                  <select 
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value as any)}
                    className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:border-black"
                  >
                    <option value="voluntary">Devolución Voluntaria</option>
                    <option value="defect">Garantía por desperfecto</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Producto de Cambio (Opcional)</label>
                  <select 
                    value={exchangeProductId}
                    onChange={(e) => {
                      setExchangeProductId(e.target.value);
                      setExchangeVariantId('');
                    }}
                    className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:border-black"
                  >
                    <option value="">Mismo producto (o sin cambio inmediato)</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                {exchangeProductId && (
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Variante de Cambio</label>
                    <select 
                      value={exchangeVariantId}
                      onChange={(e) => setExchangeVariantId(e.target.value)}
                      className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:border-black"
                    >
                      <option value="">Selecciona variante</option>
                      {products.find(p => p.id === exchangeProductId)?.variants?.map(v => (
                        <option key={v.id} value={v.id}>{v.color} / {v.size} (Stock: {v.stock})</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Notas / Observaciones</label>
                  <textarea 
                    value={returnNotes}
                    onChange={(e) => setReturnNotes(e.target.value)}
                    placeholder="Detalles sobre el desperfecto o el cambio..."
                    className="w-full border border-gray-300 p-2 rounded h-24 focus:outline-none focus:border-black"
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    onClick={() => { setProcessingReturn(null); setManualReturnOpen(false); }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-bold uppercase text-sm hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleProcessReturn}
                    disabled={isUploading || !processingReturn}
                    className="flex-1 px-4 py-2 bg-black text-white rounded-lg font-bold uppercase text-sm hover:bg-gray-800 transition-colors disabled:bg-gray-400"
                  >
                    {isUploading ? 'Procesando...' : 'Confirmar Cambio'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      <LoadingOverlay isLoading={isUploading} message="Procesando..." fullScreen={true} />
    </div>
  );
}
