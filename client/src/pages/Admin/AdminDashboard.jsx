import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { TrendingUp, Users, ShoppingCart, FileText, DollarSign, AlertCircle } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalQuotes: 0,
    totalProducts: 0,
    pendingQuotes: 0,
    recentOrders: []
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      // Aqui você faria requisições para obter as estatísticas
      // Por enquanto, vamos usar dados de exemplo
      setStats({
        totalOrders: 24,
        totalRevenue: 3450.75,
        totalQuotes: 12,
        totalProducts: 156,
        pendingQuotes: 5,
        recentOrders: [
          { id: 1, number: 'ORD-20251206-0001', customer: 'João Silva', amount: 450.00, status: 'pending' },
          { id: 2, number: 'ORD-20251206-0002', customer: 'Maria Santos', amount: 320.50, status: 'confirmed' },
          { id: 3, number: 'ORD-20251206-0003', customer: 'Pedro Costa', amount: 680.00, status: 'shipped' },
        ]
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const StatCard = ({ icon: Icon, label, value, color }) => (
    <div className="bg-white rounded-lg shadow p-6 border-l-4" style={{ borderColor: color }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{label}</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">{value}</p>
        </div>
        <div className="p-3 rounded-lg" style={{ backgroundColor: color + '20' }}>
          <Icon size={24} style={{ color }} />
        </div>
      </div>
    </div>
  );

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            icon={ShoppingCart} 
            label="Pedidos Totais" 
            value={stats.totalOrders}
            color="#3B82F6"
          />
          <StatCard 
            icon={DollarSign} 
            label="Receita Total" 
            value={`€${stats.totalRevenue.toFixed(2)}`}
            color="#10B981"
          />
          <StatCard 
            icon={FileText} 
            label="Orçamentos" 
            value={stats.totalQuotes}
            color="#F59E0B"
          />
          <StatCard 
            icon={AlertCircle} 
            label="Orçamentos Pendentes" 
            value={stats.pendingQuotes}
            color="#EF4444"
          />
        </div>

        {/* Products and Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Pedidos Recentes</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Número</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Cliente</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Valor</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentOrders.map(order => (
                    <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                      <td className="py-3 px-4 text-sm font-medium text-gray-800">{order.number}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{order.customer}</td>
                      <td className="py-3 px-4 text-sm font-semibold text-gray-800">€{order.amount.toFixed(2)}</td>
                      <td className="py-3 px-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {order.status === 'pending' ? 'Pendente' :
                           order.status === 'confirmed' ? 'Confirmado' : 'Enviado'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Atalhos Rápidos</h2>
            <div className="space-y-3">
              <button className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 py-3 px-4 rounded-lg font-semibold transition">
                + Novo Produto
              </button>
              <button className="w-full bg-green-50 hover:bg-green-100 text-green-700 py-3 px-4 rounded-lg font-semibold transition">
                + Nova Categoria
              </button>
              <button className="w-full bg-orange-50 hover:bg-orange-100 text-orange-700 py-3 px-4 rounded-lg font-semibold transition">
                Ver Orçamentos
              </button>
              <button className="w-full bg-purple-50 hover:bg-purple-100 text-purple-700 py-3 px-4 rounded-lg font-semibold transition">
                Relatórios
              </button>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Produtos em Stock</h2>
            <p className="text-3xl font-bold text-primary">{stats.totalProducts}</p>
            <p className="text-gray-600 text-sm mt-2">Total de produtos cadastrados</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Taxa de Conversão</h2>
            <p className="text-3xl font-bold text-green-600">42%</p>
            <p className="text-gray-600 text-sm mt-2">Orçamentos convertidos em pedidos</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
