import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { User, ShoppingBag, Heart, LogOut, Settings, Package, MapPin, CreditCard } from 'lucide-react';
import { useProducts } from '../context/ProductContext';
import ProductCard from '../components/ProductCard';

export default function Profile() {
  const { user, logout, orders, favorites, updateProfile } = useAuth();
  const { products } = useProducts();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });
  
  const activeTab = (searchParams.get('tab') as 'profile' | 'orders' | 'favorites') || 'profile';

  const setActiveTab = (tab: 'profile' | 'orders' | 'favorites') => {
    setSearchParams({ tab });
  };

  useEffect(() => {
    if (user) {
      setEditForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || ''
      });
    }
  }, [user]);

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(editForm);
    setIsEditing(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  const favoriteProducts = products.filter(p => favorites.includes(p.id));

  const renderProfile = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-serif font-bold">Mi Información</h3>
        <button 
          onClick={() => setIsEditing(!isEditing)}
          className="text-sm font-bold uppercase tracking-widest border-b border-black pb-1 hover:text-gray-600 hover:border-gray-600 transition-colors"
        >
          {isEditing ? 'Cancelar' : 'Editar'}
        </button>
      </div>

      {isEditing ? (
        <form onSubmit={handleUpdateProfile} className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <User size={20} /> Información Personal
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Nombre</label>
                <input
                  type="text"
                  name="name"
                  value={editForm.name}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 p-2 rounded-lg focus:outline-none focus:border-black"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={editForm.email}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 p-2 rounded-lg focus:outline-none focus:border-black"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Teléfono</label>
                <input
                  type="text"
                  name="phone"
                  value={editForm.phone}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 p-2 rounded-lg focus:outline-none focus:border-black"
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <MapPin size={20} /> Dirección de Envío
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Dirección</label>
                <input
                  type="text"
                  name="address"
                  value={editForm.address}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 p-2 rounded-lg focus:outline-none focus:border-black"
                />
              </div>
            </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-black text-white py-3 rounded-lg text-sm font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors"
          >
            Guardar Cambios
          </button>
        </form>
      ) : (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <User size={20} /> Información Personal
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Nombre</label>
                <p className="text-gray-900 font-medium">{user.name}</p>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Email</label>
                <p className="text-gray-900 font-medium">{user.email}</p>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Teléfono</label>
                <p className="text-gray-900 font-medium">{user.phone || 'No registrado'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <MapPin size={20} /> Dirección de Envío
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Dirección</label>
                <p className="text-gray-900 font-medium">{user.address || 'No registrada'}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderOrders = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-serif font-bold mb-4">Mis Pedidos</h3>
      {orders.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
          <Package size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">No tienes pedidos recientes.</p>
          <button 
            onClick={() => navigate('/shop')}
            className="mt-4 text-black underline font-medium hover:text-gray-600"
          >
            Ir a comprar
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex flex-col md:flex-row justify-between md:items-center mb-4 border-b border-gray-100 pb-4">
                <div>
                  <span className="text-xs font-bold uppercase text-gray-500">Pedido</span>
                  <p className="font-mono font-bold text-lg">{order.id}</p>
                </div>
                <div className="mt-2 md:mt-0">
                  <span className="text-xs font-bold uppercase text-gray-500">Fecha</span>
                  <p className="text-sm">{new Date(order.date).toLocaleDateString()}</p>
                </div>
                <div className="mt-2 md:mt-0">
                  <span className="text-xs font-bold uppercase text-gray-500">Total</span>
                  <p className="font-bold text-lg">${order.total.toFixed(2)}</p>
                </div>
                <div className="mt-2 md:mt-0">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    order.status === 'Entregado' ? 'bg-green-100 text-green-800' :
                    order.status === 'Enviado' ? 'bg-blue-100 text-blue-800' :
                    order.status === 'Pago Aprobado' ? 'bg-indigo-100 text-indigo-800' :
                    order.status === 'Cancelado' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
              
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex gap-4 items-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium">{item.name}</h4>
                      <p className="text-xs text-gray-500">
                        {item.quantity} x ${item.price.toFixed(2)}
                        {item.selectedColor && ` | ${item.selectedColor}`}
                        {item.selectedSize && ` | ${item.selectedSize}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderFavorites = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-serif font-bold mb-4">Mis Favoritos</h3>
      {favoriteProducts.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
          <Heart size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">No tienes productos favoritos aún.</p>
          <button 
            onClick={() => navigate('/shop')}
            className="mt-4 text-black underline font-medium hover:text-gray-600"
          >
            Explorar productos
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 sm:gap-x-6 gap-y-6 sm:gap-y-8">
          {favoriteProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="pt-24 pb-20 px-4 max-w-7xl mx-auto min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <div className="md:w-1/4">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 sticky top-24">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 text-2xl font-bold">
                  {user.name.charAt(0)}
                </div>
                <div>
                  <h2 className="font-bold text-lg">{user.name}</h2>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
              </div>
              
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'profile' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <User size={18} /> Mi Perfil
                </button>
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'orders' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <ShoppingBag size={18} /> Mis Pedidos
                </button>
                <button
                  onClick={() => setActiveTab('favorites')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'favorites' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Heart size={18} /> Favoritos
                </button>
                <div className="pt-4 mt-4 border-t border-gray-100">
                  <button
                    onClick={() => {
                      logout();
                      navigate('/');
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={18} /> Cerrar Sesión
                  </button>
                </div>
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="md:w-3/4">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === 'profile' && renderProfile()}
              {activeTab === 'orders' && renderOrders()}
              {activeTab === 'favorites' && renderFavorites()}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
