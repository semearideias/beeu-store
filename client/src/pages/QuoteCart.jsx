import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ArrowLeft, Upload, AlertCircle } from 'lucide-react';
import { products } from '../api';

export default function QuoteCart() {
  const navigate = useNavigate();
  const [quoteItems, setQuoteItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Dados de personalização
  const [customization, setCustomization] = useState({
    logoFile: null,
    logoFileName: '',
    description: ''
  });

  // Dados do cliente
  const [clientData, setClientData] = useState({
    name: '',
    company: '',
    city: '',
    email: '',
    phone: '',
    wantAccount: false
  });

  useEffect(() => {
    // Carregar itens do localStorage
    const saved = localStorage.getItem('quoteCart');
    console.log('localStorage quoteCart:', saved);
    if (saved) {
      try {
        const items = JSON.parse(saved);
        console.log('Itens carregados:', items);
        setQuoteItems(items);
      } catch (err) {
        console.error('Erro ao fazer parse de quoteCart:', err);
        setQuoteItems([]);
      }
    } else {
      console.log('Nenhum quoteCart no localStorage');
      setQuoteItems([]);
    }

    // Verificar se está autenticado
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
  }, []);

  const removeItem = (index) => {
    const updated = quoteItems.filter((_, i) => i !== index);
    setQuoteItems(updated);
    localStorage.setItem('quoteCart', JSON.stringify(updated));
  };

  const clearCart = () => {
    setQuoteItems([]);
    localStorage.removeItem('quoteCart');
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCustomization({
        ...customization,
        logoFile: file,
        logoFileName: file.name
      });
    }
  };

  const handleSubmitQuote = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Recarregar itens do localStorage para garantir que temos os dados mais recentes
      const savedItems = localStorage.getItem('quoteCart');
      console.log('localStorage no submit:', savedItems);
      
      let itemsToSubmit = quoteItems;
      if (savedItems) {
        try {
          itemsToSubmit = JSON.parse(savedItems);
          console.log('Itens recarregados do localStorage:', itemsToSubmit);
        } catch (err) {
          console.error('Erro ao fazer parse:', err);
        }
      }

      // Validar se há itens
      if (!itemsToSubmit || itemsToSubmit.length === 0) {
        throw new Error('Nenhum produto selecionado');
      }

      console.log('Itens a enviar:', itemsToSubmit);

      // Preparar dados do orçamento
      const formData = new FormData();
      
      // Adicionar itens como JSON string
      formData.append('items', JSON.stringify(itemsToSubmit));
      
      // Adicionar dados de personalização
      formData.append('customization_description', customization.description);
      if (customization.logoFile) {
        formData.append('logo_file', customization.logoFile);
      }

      // Adicionar dados do cliente se não autenticado
      if (!isAuthenticated) {
        formData.append('client_name', clientData.name);
        formData.append('client_company', clientData.company);
        formData.append('client_city', clientData.city);
        formData.append('client_email', clientData.email);
        formData.append('client_phone', clientData.phone);
        formData.append('want_account', clientData.wantAccount);
      }

      console.log('FormData a enviar:', {
        items: itemsToSubmit,
        customization: customization.description,
        client: !isAuthenticated ? clientData : 'autenticado'
      });

      // Enviar para o backend
      const response = await fetch('/api/quotes/request', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });

      const data = await response.json();

      console.log('Resposta do servidor:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao submeter orçamento');
      }

      setSuccess('Orçamento submetido com sucesso! Receberá uma resposta em breve.');
      
      // Limpar carrinho
      setQuoteItems([]);
      localStorage.removeItem('quoteCart');
      
      // Redirecionar após 2 segundos
      setTimeout(() => {
        navigate('/products');
      }, 2000);
    } catch (err) {
      const errorMsg = err.message || 'Erro ao submeter orçamento';
      setError(errorMsg);
      console.error('Erro completo:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-12">
      <Link to="/products" className="text-primary hover:underline mb-6 flex items-center gap-2">
        <ArrowLeft size={18} />
        Voltar ao catálogo
      </Link>

      <h1 className="text-4xl font-bold mb-8">Carrinho de Orçamento</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
          {success}
        </div>
      )}

      {quoteItems.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-600 text-lg mb-6">Nenhum produto adicionado ao carrinho de orçamento</p>
          <Link to="/products" className="btn-primary inline-block">
            Continuar Comprando
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Itens e Personalização */}
          <div className="lg:col-span-2 space-y-6">
            {/* Produtos */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6 border-b">
                <h2 className="text-xl font-bold">Produtos para Orçamento ({quoteItems.length})</h2>
              </div>
              <div className="divide-y">
                {quoteItems.map((item, idx) => (
                  <div key={idx} className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg">{item.name}</h3>
                        <p className="text-gray-600 text-sm mb-2">SKU: {item.sku}</p>
                      </div>
                      <button
                        onClick={() => removeItem(idx)}
                        className="text-red-600 hover:text-red-800 transition p-2"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-full border-2 border-gray-300"
                          style={{ backgroundColor: item.colorHex }}
                        />
                        <span>{item.color}</span>
                      </div>
                      <span className="text-gray-600">Quantidade: {item.quantity}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Personalização */}
            {!showForm && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-xl font-bold mb-4">Personalização</h3>
                
                {/* Upload de Logótipo */}
                <div className="mb-6">
                  <label className="block text-sm font-bold mb-2">Logótipo/Ficheiro</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition cursor-pointer">
                    <input
                      type="file"
                      onChange={handleLogoUpload}
                      className="hidden"
                      id="logo-upload"
                      accept="image/*,.pdf,.ai,.psd"
                    />
                    <label htmlFor="logo-upload" className="cursor-pointer">
                      <Upload size={32} className="mx-auto mb-2 text-gray-400" />
                      <p className="font-bold mb-1">Clique para carregar ficheiro</p>
                      <p className="text-xs text-gray-600">ou arraste o ficheiro aqui</p>
                      {customization.logoFileName && (
                        <p className="text-sm text-primary mt-2">✓ {customization.logoFileName}</p>
                      )}
                    </label>
                  </div>
                </div>

                {/* Descrição */}
                <div className="mb-6">
                  <label className="block text-sm font-bold mb-2">Descrição da Personalização</label>
                  <textarea
                    value={customization.description}
                    onChange={(e) => setCustomization({ ...customization, description: e.target.value })}
                    placeholder="Descreva como pretende que os produtos sejam personalizados..."
                    className="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:border-primary"
                    rows="5"
                  />
                </div>

                <button
                  onClick={() => setShowForm(true)}
                  className="w-full bg-secondary text-dark py-3 rounded-lg font-bold hover:shadow-lg transition"
                >
                  Continuar para Submissão
                </button>
              </div>
            )}

            {/* Formulário de Submissão */}
            {showForm && (
              <form onSubmit={handleSubmitQuote} className="bg-white rounded-lg shadow p-6">
                <h3 className="text-xl font-bold mb-4">Dados do Pedido</h3>

                {!isAuthenticated && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div>
                        <label className="block text-sm font-bold mb-2">Nome *</label>
                        <input
                          type="text"
                          required
                          value={clientData.name}
                          onChange={(e) => setClientData({ ...clientData, name: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold mb-2">Empresa</label>
                        <input
                          type="text"
                          value={clientData.company}
                          onChange={(e) => setClientData({ ...clientData, company: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold mb-2">Cidade</label>
                        <input
                          type="text"
                          value={clientData.city}
                          onChange={(e) => setClientData({ ...clientData, city: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold mb-2">Email *</label>
                        <input
                          type="email"
                          required
                          value={clientData.email}
                          onChange={(e) => setClientData({ ...clientData, email: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold mb-2">Telemóvel *</label>
                        <input
                          type="tel"
                          required
                          value={clientData.phone}
                          onChange={(e) => setClientData({ ...clientData, phone: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary"
                        />
                      </div>
                    </div>

                    <div className="mb-6 p-4 bg-light rounded">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={clientData.wantAccount}
                          onChange={(e) => setClientData({ ...clientData, wantAccount: e.target.checked })}
                          className="w-4 h-4"
                        />
                        <span className="text-sm">Desejo criar uma conta para acompanhar meus orçamentos</span>
                      </label>
                    </div>
                  </>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 border-2 border-gray-300 text-gray-600 py-3 rounded-lg font-bold hover:bg-gray-50 transition"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-primary text-white py-3 rounded-lg font-bold hover:shadow-lg transition disabled:opacity-50"
                  >
                    {loading ? 'Enviando...' : 'Submeter Orçamento'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Resumo */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-20">
              <h3 className="font-bold text-lg mb-6">Resumo</h3>
              
              <div className="space-y-4 mb-6 pb-6 border-b">
                <div className="flex justify-between">
                  <span className="text-gray-600">Produtos:</span>
                  <span className="font-bold">{quoteItems.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Quantidade Total:</span>
                  <span className="font-bold">{quoteItems.reduce((sum, item) => sum + item.quantity, 0)}</span>
                </div>
              </div>

              {!showForm && (
                <button
                  onClick={clearCart}
                  className="w-full border-2 border-red-600 text-red-600 py-3 rounded-lg font-bold hover:bg-red-50 transition"
                >
                  Limpar Carrinho
                </button>
              )}

              <p className="text-xs text-gray-600 mt-6 text-center">
                Preencha os dados de personalização e submeta o seu pedido de orçamento.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
