import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { Eye, CheckCircle, XCircle, Search, Filter } from 'lucide-react';

export default function AdminQuotes() {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedQuote, setSelectedQuote] = useState(null);

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/quotes', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setQuotes(data || []);
    } catch (error) {
      console.error('Erro ao carregar orçamentos:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (quoteId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/quotes/${quoteId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      fetchQuotes();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'pending': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pendente' },
      'sent': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Enviado' },
      'accepted': { bg: 'bg-green-100', text: 'text-green-800', label: 'Aceite' },
      'rejected': { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejeitado' }
    };
    const s = statusMap[status] || statusMap['pending'];
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>
        {s.label}
      </span>
    );
  };

  const filteredQuotes = quotes.filter(q => {
    const matchesSearch = q.quote_number.includes(searchTerm) || 
                         q.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         q.company_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || q.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold text-gray-800">Gestão de Orçamentos</h2>
          <div className="text-sm text-gray-600">
            Total: <span className="font-bold text-lg">{quotes.length}</span>
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
            <option value="sent">Enviados</option>
            <option value="accepted">Aceites</option>
            <option value="rejected">Rejeitados</option>
          </select>
        </div>

        {/* Quotes Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-600">Carregando orçamentos...</div>
          ) : filteredQuotes.length === 0 ? (
            <div className="p-8 text-center text-gray-600">Nenhum orçamento encontrado</div>
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
                {filteredQuotes.map(quote => (
                  <tr key={quote.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">{quote.quote_number}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{quote.contact_name || quote.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{quote.company_name}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-800">€{parseFloat(quote.total || 0).toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm">{getStatusBadge(quote.status)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(quote.created_at).toLocaleDateString('pt-PT')}
                    </td>
                    <td className="px-6 py-4 text-sm flex gap-2">
                      <button
                        onClick={() => setSelectedQuote(quote)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Ver detalhes"
                      >
                        <Eye size={18} />
                      </button>
                      {quote.status === 'pending' && (
                        <>
                          <button
                            onClick={() => updateStatus(quote.id, 'sent')}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                            title="Marcar como enviado"
                          >
                            <CheckCircle size={18} />
                          </button>
                          <button
                            onClick={() => updateStatus(quote.id, 'rejected')}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Rejeitar"
                          >
                            <XCircle size={18} />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Detail Modal */}
        {selectedQuote && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">
                Orçamento {selectedQuote.quote_number}
              </h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Cliente</p>
                    <p className="font-semibold">{selectedQuote.contact_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-semibold">{selectedQuote.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Empresa</p>
                    <p className="font-semibold">{selectedQuote.company_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Telefone</p>
                    <p className="font-semibold">{selectedQuote.phone || 'N/A'}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Cidade</p>
                  <p className="font-semibold">{selectedQuote.city || 'N/A'}</p>
                </div>

                {selectedQuote.customization_description && (
                  <div>
                    <p className="text-sm text-gray-600">Personalização Solicitada</p>
                    <p className="font-semibold">{selectedQuote.customization_description}</p>
                  </div>
                )}

                <div className="border-t pt-4">
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-primary">€{parseFloat(selectedQuote.total || 0).toFixed(2)}</p>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => setSelectedQuote(null)}
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
