import React, { useState, useEffect } from 'react';
import { Eye, Edit2, Download, ShoppingCart, Trash2, Search, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function AdminQuotes() {
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    fetchQuotes();
  }, [search, statusFilter]);

  const fetchQuotes = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);

      const response = await api.get(`/admin/quotes?${params.toString()}`);
      setQuotes(response.data);
    } catch (error) {
      console.error('Erro ao carregar orçamentos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (id) => {
    try {
      const response = await api.get(`/admin/quotes/${id}`);
      setSelectedQuote(response.data);
      setShowDetail(true);
    } catch (error) {
      console.error('Erro ao carregar detalhes:', error);
    }
  };

  const handleConvertToOrder = async (id) => {
    if (!window.confirm('Converter este orçamento em pedido?')) return;

    try {
      const response = await api.post(`/admin/quotes/${id}/convert-to-order`);
      alert(`Pedido criado: ${response.data.orderNumber}`);
      fetchQuotes();
      setShowDetail(false);
    } catch (error) {
      console.error('Erro ao converter:', error);
      alert('Erro ao converter orçamento');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      converted: 'bg-blue-100 text-blue-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-6">Orçamentos</h1>

        {/* Filtros */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold mb-2">Pesquisar</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Número, email ou empresa..."
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
                <option value="">Todos os status</option>
                <option value="pending">Pendente</option>
                <option value="approved">Aprovado</option>
                <option value="rejected">Rejeitado</option>
                <option value="converted">Convertido</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearch('');
                  setStatusFilter('');
                }}
                className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
              >
                Limpar Filtros
              </button>
            </div>
          </div>
        </div>

        {/* Tabela */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Carregando orçamentos...</p>
          </div>
        ) : quotes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">Nenhum orçamento encontrado</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Número</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Empresa</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Itens</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Total</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Data</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {quotes.map((quote) => (
                  <tr key={quote.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-semibold text-gray-900">{quote.quote_number}</td>
                    <td className="px-6 py-4 text-gray-700">{quote.company_name}</td>
                    <td className="px-6 py-4 text-gray-700">{quote.email}</td>
                    <td className="px-6 py-4 text-gray-700">{quote.item_count}</td>
                    <td className="px-6 py-4 font-semibold text-gray-900">€{parseFloat(quote.total).toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(quote.status)}`}>
                        {quote.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-700 text-sm">
                      {new Date(quote.created_at).toLocaleDateString('pt-PT')}
                    </td>
                    <td className="px-6 py-4 flex gap-2">
                      <button
                        onClick={() => handleViewDetail(quote.id)}
                        className="text-blue-600 hover:text-blue-800 transition"
                        title="Ver detalhes"
                      >
                        <Eye size={20} />
                      </button>
                      <button
                        onClick={() => navigate(`/admin/quotes/${quote.id}`)}
                        className="text-green-600 hover:text-green-800 transition"
                        title="Editar"
                      >
                        <Edit2 size={20} />
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
      {showDetail && selectedQuote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-2xl font-bold">Orçamento {selectedQuote.quote_number}</h2>
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
                    <p className="font-semibold">{selectedQuote.company_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Contacto</p>
                    <p className="font-semibold">{selectedQuote.contact_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-semibold">{selectedQuote.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Telefone</p>
                    <p className="font-semibold">{selectedQuote.phone || '-'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">Endereço</p>
                    <p className="font-semibold">{selectedQuote.address || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Itens */}
              <div className="mb-6 pb-6 border-b">
                <h3 className="text-lg font-bold mb-4">Itens</h3>
                <div className="space-y-2">
                  {selectedQuote.items.map((item) => (
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
                    <span className="font-semibold">€{parseFloat(selectedQuote.subtotal).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>IVA:</span>
                    <span className="font-semibold">€{parseFloat(selectedQuote.tax).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg">
                    <span className="font-bold">Total:</span>
                    <span className="font-bold">€{parseFloat(selectedQuote.total).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Ações */}
              <div className="flex gap-3">
                {selectedQuote.status !== 'converted' && (
                  <button
                    onClick={() => handleConvertToOrder(selectedQuote.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
                  >
                    <ShoppingCart size={20} />
                    Converter em Pedido
                  </button>
                )}
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
    </div>
  );
}
