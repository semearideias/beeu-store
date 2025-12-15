import React, { useState, useEffect } from 'react';
import { Eye, Truck, Package, Search } from 'lucide-react';
import api from '../api';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showTracking, setShowTracking] = useState(false);
  const [trackingData, setTrackingData] = useState({
    status: 'shipped',
    carrier: '',
    tracking_number: '',
    tracking_url: '',
    shipped_at: new Date().toISOString().split('T')[0],
    estimated_delivery: '',
    delivered_at: '',
    notes: ''
  });

  useEffect(() => {
    fetchOrders();
  }, [search, statusFilter, paymentFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      if (paymentFilter) params.append('payment_status', paymentFilter);

      const response = await api.get(`/admin/orders?${params.toString()}`);
      setOrders(response.data);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (id) => {
    try {
      const response = await api.get(`/admin/orders/${id}`);
      setSelectedOrder(response.data);
      setShowDetail(true);
      if (response.data.tracking) {
        setTrackingData(response.data.tracking);
      }
    } catch (error) {
      console.error('Erro ao carregar detalhes:', error);
    }
  };

  const handleUpdateTracking = async () => {
    try {
      await api.put(`/admin/orders/${selectedOrder.id}/tracking`, trackingData);
      alert('Rastreamento atualizado com sucesso');
      fetchOrders();
      setShowTracking(false);
    } catch (error) {
      console.error('Erro ao atualizar rastreamento:', error);
      alert('Erro ao atualizar rastreamento');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-6">Pedidos</h1>

        {/* Filtros */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-bold mb-2">Pesquisar</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Número, email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              >
                <option value="">Todos</option>
                <option value="pending">Pendente</option>
                <option value="processing">Processando</option>
                <option value="shipped">Enviado</option>
                <option value="delivered">Entregue</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">Pagamento</label>
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              >
                <option value="">Todos</option>
                <option value="pending">Pendente</option>
                <option value="paid">Pago</option>
                <option value="failed">Falhou</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearch('');
                  setStatusFilter('');
                  setPaymentFilter('');
                }}
                className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
              >
                Limpar
              </button>
            </div>
          </div>
        </div>

        {/* Tabela */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Carregando pedidos...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">Nenhum pedido encontrado</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Número</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Empresa</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Total</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Pagamento</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Data</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-semibold text-gray-900">{order.order_number}</td>
                    <td className="px-6 py-4 text-gray-700">{order.company_name}</td>
                    <td className="px-6 py-4 text-gray-700 text-sm">{order.email}</td>
                    <td className="px-6 py-4 font-semibold text-gray-900">€{parseFloat(order.total).toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getPaymentColor(order.payment_status)}`}>
                        {order.payment_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-700 text-sm">
                      {new Date(order.created_at).toLocaleDateString('pt-PT')}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleViewDetail(order.id)}
                        className="text-blue-600 hover:text-blue-800 transition"
                        title="Ver detalhes"
                      >
                        <Eye size={20} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Detalhes */}
      {showDetail && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full max-h-96 overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-2xl font-bold">Pedido {selectedOrder.order_number}</h2>
              <button
                onClick={() => setShowDetail(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              {/* Dados do Cliente */}
              <div className="mb-6 pb-6 border-b">
                <h3 className="text-lg font-bold mb-4">Dados do Cliente</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Empresa</p>
                    <p className="font-semibold">{selectedOrder.company_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Contacto</p>
                    <p className="font-semibold">{selectedOrder.contact_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-semibold">{selectedOrder.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Telefone</p>
                    <p className="font-semibold">{selectedOrder.phone || '-'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">Endereço</p>
                    <p className="font-semibold">{selectedOrder.address || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Itens */}
              <div className="mb-6 pb-6 border-b">
                <h3 className="text-lg font-bold mb-4">Itens</h3>
                <div className="space-y-2">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <div>
                        <p className="font-semibold">{item.product_name}</p>
                        <p className="text-sm text-gray-600">Qtd: {item.quantity}</p>
                      </div>
                      <p className="font-semibold">€{parseFloat(item.total_price).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resumo */}
              <div className="mb-6 pb-6 border-b">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-semibold">€{parseFloat(selectedOrder.subtotal).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>IVA:</span>
                    <span className="font-semibold">€{parseFloat(selectedOrder.tax).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg">
                    <span className="font-bold">Total:</span>
                    <span className="font-bold">€{parseFloat(selectedOrder.total).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Rastreamento */}
              {selectedOrder.tracking && (
                <div className="mb-6 pb-6 border-b">
                  <h3 className="text-lg font-bold mb-4">Rastreamento</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-semibold">Status:</span> {selectedOrder.tracking.status}</div>
                    <div><span className="font-semibold">Transportadora:</span> {selectedOrder.tracking.carrier || '-'}</div>
                    <div><span className="font-semibold">Número:</span> {selectedOrder.tracking.tracking_number || '-'}</div>
                    {selectedOrder.tracking.tracking_url && (
                      <div>
                        <a href={selectedOrder.tracking.tracking_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          Ver rastreamento
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Ações */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowTracking(true)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                >
                  <Truck size={20} />
                  Atualizar Rastreamento
                </button>
                <button
                  onClick={() => setShowDetail(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Rastreamento */}
      {showTracking && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-2xl font-bold">Atualizar Rastreamento</h2>
              <button
                onClick={() => setShowTracking(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold mb-2">Status</label>
                <select
                  value={trackingData.status}
                  onChange={(e) => setTrackingData({ ...trackingData, status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                >
                  <option value="pending">Pendente</option>
                  <option value="shipped">Enviado</option>
                  <option value="in_transit">Em Trânsito</option>
                  <option value="delivered">Entregue</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-2">Transportadora</label>
                  <input
                    type="text"
                    value={trackingData.carrier}
                    onChange={(e) => setTrackingData({ ...trackingData, carrier: e.target.value })}
                    placeholder="Ex: CTT, DHL..."
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2">Número de Rastreamento</label>
                  <input
                    type="text"
                    value={trackingData.tracking_number}
                    onChange={(e) => setTrackingData({ ...trackingData, tracking_number: e.target.value })}
                    placeholder="Número..."
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">URL de Rastreamento</label>
                <input
                  type="url"
                  value={trackingData.tracking_url}
                  onChange={(e) => setTrackingData({ ...trackingData, tracking_url: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-2">Data de Envio</label>
                  <input
                    type="date"
                    value={trackingData.shipped_at}
                    onChange={(e) => setTrackingData({ ...trackingData, shipped_at: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2">Entrega Estimada</label>
                  <input
                    type="date"
                    value={trackingData.estimated_delivery}
                    onChange={(e) => setTrackingData({ ...trackingData, estimated_delivery: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">Notas</label>
                <textarea
                  value={trackingData.notes}
                  onChange={(e) => setTrackingData({ ...trackingData, notes: e.target.value })}
                  placeholder="Notas adicionais..."
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleUpdateTracking}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
                >
                  Guardar
                </button>
                <button
                  onClick={() => setShowTracking(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
