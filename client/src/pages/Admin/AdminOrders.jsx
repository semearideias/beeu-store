import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { Eye, Truck, CheckCircle, Clock, Search } from 'lucide-react';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setOrders(data || []);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      fetchOrders();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'pending': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pendente', icon: Clock },
      'confirmed': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Confirmado', icon: CheckCircle },
      'processing': { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Em Processamento', icon: Clock },
      'shipped': { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Enviado', icon: Truck },
      'delivered': { bg: 'bg-green-100', text: 'text-green-800', label: 'Entregue', icon: CheckCircle },
      'cancelled': { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelado', icon: Clock }
    };
    const s = statusMap[status] || statusMap['pending'];
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>
        {s.label}
      </span>
    );
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.order_number.includes(searchTerm) || 
                         o.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         o.company_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold text-gray-800">Gestão de Pedidos</h2>
          <div className="text-sm text-gray-600">
            Total: <span className="font-bold text-lg">{orders.length}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-600 text-sm">Pendentes</p>
            <p className="text-2xl font-bold text-yellow-600">{orders.filter(o => o.status === 'pending').length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-600 text-sm">Confirmados</p>
            <p className="text-2xl font-bold text-blue-600">{orders.filter(o => o.status === 'confirmed').length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-600 text-sm">Enviados</p>
            <p className="text-2xl font-bold text-orange-600">{orders.filter(o => o.status === 'shipped').length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-600 text-sm">Entregues</p>
            <p className="text-2xl font-bold text-green-600">{orders.filter(o => o.status === 'delivered').length}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 flex gap-4">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Pesquisar por número, email ou empresa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
          >
            <option value="all">Todos os Status</option>
            <option value="pending">Pendentes</option>
            <option value="confirmed">Confirmados</option>
            <option value="processing">Em Processamento</option>
            <option value="shipped">Enviados</option>
            <option value="delivered">Entregues</option>
            <option value="cancelled">Cancelados</option>
          </select>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-600">Carregando pedidos...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-8 text-center text-gray-600">Nenhum pedido encontrado</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Número</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Cliente</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Empresa</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Total</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Data</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(order => (
                  <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">{order.order_number}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{order.contact_name || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{order.company_name}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-800">€{parseFloat(order.total || 0).toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm">{getStatusBadge(order.status)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(order.created_at).toLocaleDateString('pt-PT')}
                    </td>
                    <td className="px-6 py-4 text-sm flex gap-2">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Ver detalhes"
                      >
                        <Eye size={18} />
                      </button>
                      {order.status === 'pending' && (
                        <button
                          onClick={() => updateStatus(order.id, 'confirmed')}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                          title="Confirmar"
                        >
                          <CheckCircle size={18} />
                        </button>
                      )}
                      {order.status === 'confirmed' && (
                        <button
                          onClick={() => updateStatus(order.id, 'shipped')}
                          className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition"
                          title="Marcar como enviado"
                        >
                          <Truck size={18} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Detail Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">
                Pedido {selectedOrder.order_number}
              </h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Cliente</p>
                    <p className="font-semibold">{selectedOrder.contact_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-semibold">{selectedOrder.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Empresa</p>
                    <p className="font-semibold">{selectedOrder.company_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Telefone</p>
                    <p className="font-semibold">{selectedOrder.phone || 'N/A'}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Endereço</p>
                  <p className="font-semibold">{selectedOrder.address || 'N/A'}</p>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between mb-2">
                    <p className="text-gray-600">Subtotal</p>
                    <p className="font-semibold">€{parseFloat(selectedOrder.subtotal || 0).toFixed(2)}</p>
                  </div>
                  <div className="flex justify-between mb-4">
                    <p className="text-gray-600">IVA (23%)</p>
                    <p className="font-semibold">€{parseFloat(selectedOrder.tax || 0).toFixed(2)}</p>
                  </div>
                  <div className="flex justify-between text-lg">
                    <p className="font-bold">Total</p>
                    <p className="text-2xl font-bold text-primary">€{parseFloat(selectedOrder.total || 0).toFixed(2)}</p>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg font-semibold hover:bg-gray-300 transition"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
