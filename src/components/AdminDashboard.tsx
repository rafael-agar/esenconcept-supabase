import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  LineChart, Line 
} from 'recharts';
import { 
  subDays, startOfDay, endOfDay, format, isWithinInterval, parseISO, 
  startOfWeek, startOfMonth, startOfYear, eachDayOfInterval 
} from 'date-fns';
import { es } from 'date-fns/locale';
import { DollarSign, ShoppingCart, Users, TrendingUp, Package, Mail, UserCheck } from 'lucide-react';

interface AdminDashboardProps {
  orders: any[];
  products: any[];
  users: any[];
  leads?: any[];
}

type DateRange = 'today' | '7days' | '30days' | 'thisMonth' | 'thisYear' | 'all';

export default function AdminDashboard({ orders, products, users, leads = [] }: AdminDashboardProps) {
  const [dateRange, setDateRange] = useState<DateRange>('30days');

  const filteredOrders = useMemo(() => {
    const now = new Date();
    let startDate: Date;

    switch (dateRange) {
      case 'today':
        startDate = startOfDay(now);
        break;
      case '7days':
        startDate = subDays(now, 7);
        break;
      case '30days':
        startDate = subDays(now, 30);
        break;
      case 'thisMonth':
        startDate = startOfMonth(now);
        break;
      case 'thisYear':
        startDate = startOfYear(now);
        break;
      case 'all':
      default:
        return orders;
    }

    return orders.filter(order => {
      const orderDate = new Date(order.created_at || order.date);
      return isWithinInterval(orderDate, { start: startDate, end: now });
    });
  }, [orders, dateRange]);

  const totalRevenue = filteredOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const totalOrders = filteredOrders.length;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  
  const convertedLeadsCount = users.filter(u => u.is_lead_conversion).length;
  const conversionRate = leads.length > 0 ? (convertedLeadsCount / leads.length) * 100 : 0;
  
  // Calculate revenue by day for chart
  const revenueByDay = useMemo(() => {
    const data: Record<string, { date: string, revenue: number, orders: number, sortDate: Date }> = {};
    const now = new Date();
    
    // Initialize days based on range
    if (dateRange !== 'all') {
      let startDate: Date;
      switch (dateRange) {
        case 'today': startDate = startOfDay(now); break;
        case '7days': startDate = subDays(now, 6); break;
        case '30days': startDate = subDays(now, 29); break;
        case 'thisMonth': startDate = startOfMonth(now); break;
        case 'thisYear': startDate = startOfYear(now); break;
        default: startDate = subDays(now, 29);
      }

      const days = eachDayOfInterval({ start: startDate, end: now });
      days.forEach(d => {
        const dateStr = format(d, 'MMM dd', { locale: es });
        data[dateStr] = { date: dateStr, revenue: 0, orders: 0, sortDate: startOfDay(d) };
      });
    }

    filteredOrders.forEach(order => {
      const orderDate = new Date(order.created_at || order.date);
      const dateStr = format(orderDate, 'MMM dd', { locale: es });
      
      if (!data[dateStr]) {
        data[dateStr] = { date: dateStr, revenue: 0, orders: 0, sortDate: startOfDay(orderDate) };
      }
      
      data[dateStr].revenue += Number(order.total || 0);
      data[dateStr].orders += 1;
    });

    return Object.values(data).sort((a, b) => {
      return a.sortDate.getTime() - b.sortDate.getTime();
    }).map(({ sortDate, ...rest }) => rest);
  }, [filteredOrders, dateRange]);

  // Top selling products
  const topProducts = useMemo(() => {
    const productSales: Record<string, { name: string, quantity: number, revenue: number }> = {};
    
    filteredOrders.forEach(order => {
      order.items?.forEach((item: any) => {
        if (!productSales[item.name]) {
          productSales[item.name] = { name: item.name, quantity: 0, revenue: 0 };
        }
        productSales[item.name].quantity += item.quantity;
        productSales[item.name].revenue += (item.price * item.quantity);
      });
    });

    return Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [filteredOrders]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-2xl font-serif font-bold">Dashboard</h2>
        
        <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
          <select 
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as DateRange)}
            className="text-sm border-none focus:ring-0 cursor-pointer bg-transparent py-1.5 pl-3 pr-8"
          >
            <option value="today">Hoy</option>
            <option value="7days">Últimos 7 días</option>
            <option value="30days">Últimos 30 días</option>
            <option value="thisMonth">Este Mes</option>
            <option value="thisYear">Este Año</option>
            <option value="all">Todo el tiempo</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-14 h-14 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center shrink-0">
            <DollarSign size={28} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Ingresos</p>
            <p className="text-3xl font-bold">${totalRevenue.toFixed(2)}</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
            <ShoppingCart size={28} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Pedidos</p>
            <p className="text-3xl font-bold">{totalOrders}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center shrink-0">
            <TrendingUp size={28} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Ticket Promedio</p>
            <p className="text-3xl font-bold">${averageOrderValue.toFixed(2)}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-14 h-14 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center shrink-0">
            <Users size={28} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Usuarios</p>
            <p className="text-3xl font-bold">{users.length}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shrink-0">
            <Mail size={28} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Leads</p>
            <p className="text-3xl font-bold">{leads.length}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
            <UserCheck size={28} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Conversión</p>
            <p className="text-3xl font-bold">{conversionRate.toFixed(1)}%</p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-6">Ingresos en el tiempo</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueByDay} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(value) => `$${value}`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [`$${value.toFixed(2)}`, 'Ingresos']}
                />
                <Line type="monotone" dataKey="revenue" stroke="#000000" strokeWidth={3} dot={{ r: 4, fill: '#000000', strokeWidth: 0 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Orders Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-6">Pedidos en el tiempo</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueByDay} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [value, 'Pedidos']}
                  cursor={{ fill: '#f3f4f6' }}
                />
                <Bar dataKey="orders" fill="#000000" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Products, Recent Orders & Recent Leads */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Products */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-1">
          <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-6 flex items-center gap-2">
            <Package size={16} /> Productos Más Vendidos
          </h3>
          <div className="space-y-4">
            {topProducts.length > 0 ? (
              topProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-bold line-clamp-1">{product.name}</p>
                      <p className="text-xs text-gray-500">{product.quantity} unidades</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">${product.revenue.toFixed(2)}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No hay datos de ventas en este período.</p>
            )}
          </div>

          <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 mt-8 mb-6 flex items-center gap-2 border-t border-gray-100 pt-6">
            <Mail size={16} /> Leads Recientes
          </h3>
          <div className="space-y-4">
            {leads.slice(0, 5).map((lead, index) => (
              <div key={index} className="flex flex-col border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                <p className="text-sm font-medium truncate">{lead.email}</p>
                <div className="flex justify-between items-center">
                  <p className="text-[10px] text-gray-400">{new Date(lead.created_at).toLocaleDateString()}</p>
                  <p className="text-[10px] font-bold text-amber-600">{lead.whatsapp || 'Sin WhatsApp'}</p>
                </div>
              </div>
            ))}
            {leads.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-2">No hay leads aún.</p>
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
          <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-6">Pedidos Recientes</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider text-[10px] font-bold">
                <tr>
                  <th className="p-3 rounded-l-lg">ID</th>
                  <th className="p-3">Cliente</th>
                  <th className="p-3">Fecha</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3 text-right rounded-r-lg">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredOrders.slice(0, 5).map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-3 font-mono text-xs">#{order.id.slice(0, 8)}</td>
                    <td className="p-3 font-medium">{order.customer?.full_name || 'Desconocido'}</td>
                    <td className="p-3 text-gray-500">{new Date(order.created_at || order.date).toLocaleDateString()}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        order.status === 'Enviado' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'Pago Aprobado' ? 'bg-green-100 text-green-800' :
                        order.status === 'Entregado' ? 'bg-gray-100 text-gray-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="p-3 text-right font-bold">${Number(order.total).toFixed(2)}</td>
                  </tr>
                ))}
                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-gray-500 text-sm">
                      No hay pedidos en este período.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
