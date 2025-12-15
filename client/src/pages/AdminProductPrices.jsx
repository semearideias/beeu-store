import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, Plus, Trash2, ArrowLeft } from 'lucide-react';
import api from '../api';

export default function AdminProductPrices() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newPrice, setNewPrice] = useState({
    quantity_min: 1,
    quantity_max: null,
    price: 0
  });

  useEffect(() => {
    fetchProduct();
    fetchPrices();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const response = await api.get(`/products/${productId}`);
      setProduct(response.data);
    } catch (error) {
      console.error('Erro ao carregar produto:', error);
    }
  };

  const fetchPrices = async () => {
    try {
      const response = await api.get(`/admin/product-prices/${productId}`);
      setPrices(response.data);
    } catch (error) {
      console.error('Erro ao carregar preços:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPrice = async () => {
    if (!newPrice.quantity_min || !newPrice.price) {
      alert('Quantidade mínima e preço são obrigatórios');
      return;
    }

    try {
      setSaving(true);
      await api.post(`/admin/product-prices/${productId}`, newPrice);
      setNewPrice({
        quantity_min: 1,
        quantity_max: null,
        price: 0
      });
      fetchPrices();
    } catch (error) {
      console.error('Erro ao adicionar preço:', error);
      alert('Erro ao adicionar preço');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePrice = async (priceId) => {
    if (!window.confirm('Tem a certeza que deseja deletar esta faixa de preço?')) return;

    try {
      await api.delete(`/admin/product-prices/${productId}/${priceId}`);
      fetchPrices();
    } catch (error) {
      console.error('Erro ao deletar preço:', error);
      alert('Erro ao deletar preço');
    }
  };

  const handleUpdatePrice = async (priceId, updatedPrice) => {
    try {
      setSaving(true);
      await api.put(`/admin/product-prices/${productId}/${priceId}`, updatedPrice);
      fetchPrices();
    } catch (error) {
      console.error('Erro ao atualizar preço:', error);
      alert('Erro ao atualizar preço');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Carregando...</div>;
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center gap-4">
        <button
          onClick={() => navigate('/admin/products')}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-bold">Tabela de Preços</h1>
          <p className="text-gray-600 mt-1">{product?.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Lista de Preços */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-6">Faixas de Preço</h2>

            {prices.length === 0 ? (
              <p className="text-gray-600 text-center py-8">Nenhuma faixa de preço configurada</p>
            ) : (
              <div className="space-y-3">
                {prices.map(price => (
                  <div key={price.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold">
                          A partir de {price.quantity_min} unidades
                          {price.quantity_max && ` até ${price.quantity_max}`}
                        </h3>
                        <p className="text-lg text-blue-600 font-bold mt-1">
                          €{parseFloat(price.price).toFixed(2)} por unidade
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeletePrice(price.id)}
                        className="text-red-600 hover:text-red-800 transition"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Adicionar Nova Faixa */}
        <div>
          <div className="bg-white rounded-lg shadow p-6 sticky top-8">
            <h2 className="text-xl font-bold mb-6">Nova Faixa de Preço</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-2">Quantidade Mínima</label>
                <input
                  type="number"
                  min="1"
                  value={newPrice.quantity_min}
                  onChange={(e) => setNewPrice({ ...newPrice, quantity_min: parseInt(e.target.value) || 1 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">Quantidade Máxima (opcional)</label>
                <input
                  type="number"
                  min="1"
                  value={newPrice.quantity_max || ''}
                  onChange={(e) => setNewPrice({ ...newPrice, quantity_max: e.target.value ? parseInt(e.target.value) : null })}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  placeholder="Deixar vazio para sem limite"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">Preço (€)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newPrice.price}
                  onChange={(e) => setNewPrice({ ...newPrice, price: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                onClick={handleAddPrice}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50"
              >
                <Plus size={20} />
                {saving ? 'Adicionando...' : 'Adicionar Faixa'}
              </button>
            </div>

            {/* Informação */}
            <div className="mt-6 p-4 bg-blue-50 rounded border border-blue-200">
              <h3 className="font-bold text-blue-900 mb-2">ℹ️ Como Funciona</h3>
              <p className="text-sm text-blue-800">
                Defina diferentes preços para diferentes quantidades. O sistema aplicará automaticamente o preço correto ao criar orçamentos.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
