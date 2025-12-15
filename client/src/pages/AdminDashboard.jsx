import React, { useEffect, useState } from 'react';
import { ShoppingCart, FileText, Users, TrendingUp, DollarSign, AlertCircle } from 'lucide-react';
import axios from 'axios';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalPages: 0,
    totalMenus: 0,
    totalQuotes: 0,
    totalRevenue: 0,
    pendingQuotes: 0,
    recentOrders: [],
    recentQuotes: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        const headers = { Authorization: `Bearer ${token}` };

        const [products, pages, menus, orders, quotes] = await Promise.all([
          axios.get('/api/admin/products', { headers }).catch(() => ({ data: [] })),
          axios.get('/api/admin/pages', { headers }).catch(() => ({ data: [] })),
          axios.get('/api/admin/menus', { headers }).catch(() => ({ data: [] })),
          axios.get('/api/orders', { headers }).catch(() => ({ data: [] })),
          axios.get('/api/quotes', { headers }).catch(() => ({ data: [] }))
        ]);

        const ordersData = orders.data || [];
        const quotesData = quotes.data || [];

        // Calcular receita total
        const totalRevenue = ordersData.reduce((sum, order) => sum + (order.total || 0), 0);

        // Pedidos pendentes de orçamento
        const pendingQuotes = quotesData.filter(q => q.status === 'pending').length;

        // Últimos 5 pedidos
        const recentOrders = ordersData.slice(0, 5).map(order => ({
          id: order.id,
          number: order.order_number,
          customer: order.company_name,
          amount: order.total,
          status: order.status
        }));

        // Últimos 5 orçamentos
        const recentQuotes = quotesData.slice(0, 5).map(quote => ({
          id: quote.id,
          number: quote.quote_number,
          customer: quote.company_name,
          amount: quote.total,
          status: quote.status
        }));

        setStats({
          totalProducts: products.data.length,
          totalPages: pages.data.length,
          totalMenus: menus.data.length,
          totalOrders: ordersData.length,
          totalQuotes: quotesData.length,
          totalRevenue: totalRevenue,
          pendingQuotes: pendingQuotes,
          recentOrders: recentOrders,
          recentQuotes: recentQuotes
        });
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const cards = [
    {
      icon: ShoppingCart,
      label: 'Pedidos Totais',
      value: stats.totalOrders,
      color: 'bg-blue-500'
    },
    {
      icon: DollarSign,
      label: 'Receita Total',
      value: `€${stats.totalRevenue.toFixed(2)}`,
      color: 'bg-green-500'
    },
    {
      icon: FileText,
      label: 'Orçamentos',
      value: stats.totalQuotes,
      color: 'bg-orange-500'
    },
    {
      icon: AlertCircle,
      label: 'Orçamentos Pendentes',
      value: stats.pendingQuotes,
      color: 'bg-red-500'
    }
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Bem-vindo ao Backoffice</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {cards.map((card, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">{card.label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {loading ? '-' : card.value}
                </p>
              </div>
              <div className={`${card.color} p-3 rounded-lg`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Orders and Quotes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Pedidos Recentes</h2>
          {stats.recentOrders.length === 0 ? (
            <p className="text-gray-600 text-center py-8">Nenhum pedido encontrado</p>
          ) : (
            <div className="space-y-3">
              {stats.recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                  <div>
                    <p className="font-semibold text-gray-900">{order.number}</p>
                    <p className="text-sm text-gray-600">{order.customer}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">€{order.amount.toFixed(2)}</p>
                    <span className={`text-xs font-semibold px-2 py-1 rounded ${
                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                      order.status === 'shipped' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {order.status === 'pending' ? 'Pendente' :
                       order.status === 'confirmed' ? 'Confirmado' :
                       order.status === 'shipped' ? 'Enviado' : order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Quotes */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Orçamentos Recentes</h2>
          {stats.recentQuotes.length === 0 ? (
            <p className="text-gray-600 text-center py-8">Nenhum orçamento encontrado</p>
          ) : (
            <div className="space-y-3">
              {stats.recentQuotes.map((quote) => (
                <div key={quote.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                  <div>
                    <p className="font-semibold text-gray-900">{quote.number}</p>
                    <p className="text-sm text-gray-600">{quote.customer}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">€{quote.amount.toFixed(2)}</p>
                    <span className={`text-xs font-semibold px-2 py-1 rounded ${
                      quote.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      quote.status === 'accepted' ? 'bg-green-100 text-green-800' :
                      quote.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {quote.status === 'pending' ? 'Pendente' :
                       quote.status === 'accepted' ? 'Aceito' :
                       quote.status === 'rejected' ? 'Rejeitado' : quote.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-left">
            <p className="font-semibold text-gray-900">+ Novo Produto</p>
            <p className="text-sm text-gray-600">Adicionar produto à loja</p>
          </button>
          <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition text-left">
            <p className="font-semibold text-gray-900">+ Nova Página</p>
            <p className="text-sm text-gray-600">Criar página personalizada</p>
          </button>
          <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition text-left">
            <p className="font-semibold text-gray-900">+ Menu</p>
            <p className="text-sm text-gray-600">Adicionar item ao menu</p>
          </button>
          <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition text-left">
            <p className="font-semibold text-gray-900">Ver Pedidos</p>
            <p className="text-sm text-gray-600">Gerenciar pedidos</p>
          </button>
        </div>
      </div>
    </div>
  );
}
