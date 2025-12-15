import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, Mail, Phone } from 'lucide-react';

export default function MyQuotes() {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      console.log('Token:', token ? 'Sim' : 'Não');
      
      const response = await fetch('/api/quotes/my-quotes', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao carregar orçamentos');
      }

      setQuotes(data);
    } catch (err) {
      setError(err.message);
      console.error('Erro completo:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'pending': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pendente' },
      'approved': { bg: 'bg-green-100', text: 'text-green-800', label: 'Aprovado' },
      'rejected': { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejeitado' },
      'completed': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Concluído' }
    };
    const s = statusMap[status] || statusMap['pending'];
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-bold ${s.bg} ${s.text}`}>
        {s.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-PT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return <div className="container py-12 text-center">Carregando orçamentos...</div>;
  }

  return (
    <div className="container py-12">
      <Link to="/profile" className="text-primary hover:underline mb-6 flex items-center gap-2">
        <ArrowLeft size={18} />
        Voltar ao Perfil
      </Link>

      <h1 className="text-4xl font-bold mb-8">Meus Orçamentos</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {quotes.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-600 text-lg mb-6">Nenhum orçamento encontrado</p>
          <Link to="/products" className="btn-primary inline-block">
            Solicitar Orçamento
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {quotes.map(quote => (
            <div key={quote.id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold mb-2">Orçamento {quote.quote_number}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar size={16} />
                        {formatDate(quote.created_at)}
                      </div>
                      {quote.city && (
                        <div className="flex items-center gap-1">
                          <MapPin size={16} />
                          {quote.city}
                        </div>
                      )}
                    </div>
                  </div>
                  {getStatusBadge(quote.status)}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 pb-4 border-b">
                  {quote.contact_name && (
                    <div>
                      <p className="text-sm text-gray-600">Contacto</p>
                      <p className="font-bold">{quote.contact_name}</p>
                    </div>
                  )}
                  {quote.email && (
                    <div className="flex items-center gap-2">
                      <Mail size={16} className="text-gray-600" />
                      <a href={`mailto:${quote.email}`} className="text-primary hover:underline">
                        {quote.email}
                      </a>
                    </div>
                  )}
                  {quote.phone && (
                    <div className="flex items-center gap-2">
                      <Phone size={16} className="text-gray-600" />
                      <a href={`tel:${quote.phone}`} className="text-primary hover:underline">
                        {quote.phone}
                      </a>
                    </div>
                  )}
                  {quote.company_name && (
                    <div>
                      <p className="text-sm text-gray-600">Empresa</p>
                      <p className="font-bold">{quote.company_name}</p>
                    </div>
                  )}
                </div>

                {quote.customization_description && (
                  <div className="mb-4 p-4 bg-light rounded">
                    <p className="text-sm text-gray-600 mb-2">Personalização Solicitada</p>
                    <p className="text-sm">{quote.customization_description}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button className="btn-primary text-sm">
                    Ver Detalhes
                  </button>
                  {quote.status === 'pending' && (
                    <button className="border-2 border-gray-300 text-gray-600 px-4 py-2 rounded text-sm font-bold hover:bg-gray-50 transition">
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
