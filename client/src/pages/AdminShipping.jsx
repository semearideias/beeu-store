import React, { useState, useEffect } from 'react';
import { Edit2, Trash2, Plus } from 'lucide-react';
import api from '../api';

export default function AdminShipping() {
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    weight_min: 0,
    weight_max: null,
    base_price: 0,
    price_per_kg: 0,
    free_shipping_min_amount: null,
    is_active: true,
    position: 0
  });

  useEffect(() => {
    fetchMethods();
  }, []);

  const fetchMethods = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/shipping');
      setMethods(response.data);
    } catch (error) {
      console.error('Erro ao carregar métodos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Validação básica
      if (!formData.name || formData.base_price === '' || formData.base_price === null) {
        alert('Nome e preço base são obrigatórios');
        return;
      }

      if (editingId) {
        await api.put(`/admin/shipping/${editingId}`, formData);
        alert('Método atualizado com sucesso');
      } else {
        await api.post('/admin/shipping', formData);
        alert('Método criado com sucesso');
      }
      fetchMethods();
      resetForm();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      const errorMessage = error.response?.data?.error || 'Erro ao salvar método';
      alert(errorMessage);
    }
  };

  const handleEdit = (method) => {
    setFormData(method);
    setEditingId(method.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem a certeza que deseja deletar este método?')) return;

    try {
      await api.delete(`/admin/shipping/${id}`);
      alert('Método deletado com sucesso');
      fetchMethods();
    } catch (error) {
      console.error('Erro ao deletar:', error);
      alert('Erro ao deletar método');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      weight_min: 0,
      weight_max: null,
      base_price: 0,
      price_per_kg: 0,
      free_shipping_min_amount: null,
      is_active: true,
      position: 0
    });
    setEditingId(null);
    setShowForm(false);
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Métodos de Envio</h1>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            <Plus size={20} />
            Novo Método
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Carregando métodos...</p>
          </div>
        ) : methods.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">Nenhum método de envio configurado</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Nome</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Peso (g)</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Preço Base</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Preço/kg</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Envio Grátis</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Ativo</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {methods.map((method) => (
                  <tr key={method.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-semibold text-gray-900">{method.name}</td>
                    <td className="px-6 py-4 text-gray-700">
                      {method.weight_min}-{method.weight_max ? method.weight_max : '∞'}g
                    </td>
                    <td className="px-6 py-4 text-gray-700">€{parseFloat(method.base_price).toFixed(2)}</td>
                    <td className="px-6 py-4 text-gray-700">€{parseFloat(method.price_per_kg).toFixed(2)}</td>
                    <td className="px-6 py-4 text-gray-700">
                      {method.free_shipping_min_amount ? `€${parseFloat(method.free_shipping_min_amount).toFixed(2)}` : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${method.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {method.is_active ? 'Sim' : 'Não'}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex gap-2">
                      <button
                        onClick={() => handleEdit(method)}
                        className="text-blue-600 hover:text-blue-800 transition"
                        title="Editar"
                      >
                        <Edit2 size={20} />
                      </button>
                      <button
                        onClick={() => handleDelete(method.id)}
                        className="text-red-600 hover:text-red-800 transition"
                        title="Deletar"
                      >
                        <Trash2 size={20} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Formulário */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-2xl font-bold">
                {editingId ? 'Editar Método' : 'Novo Método de Envio'}
              </h2>
              <button
                onClick={resetForm}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold mb-2">Nome *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: CTT, DHL..."
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">Descrição</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição do método..."
                  rows="2"
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-2">Peso Mínimo (g)</label>
                  <input
                    type="number"
                    value={formData.weight_min}
                    onChange={(e) => setFormData({ ...formData, weight_min: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2">Peso Máximo (g)</label>
                  <input
                    type="number"
                    value={formData.weight_max || ''}
                    onChange={(e) => setFormData({ ...formData, weight_max: e.target.value ? parseInt(e.target.value) : null })}
                    placeholder="Deixar vazio para sem limite"
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-2">Preço Base (€) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.base_price}
                    onChange={(e) => setFormData({ ...formData, base_price: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2">Preço por kg (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price_per_kg}
                    onChange={(e) => setFormData({ ...formData, price_per_kg: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">Envio Grátis a partir de (€)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.free_shipping_min_amount || ''}
                  onChange={(e) => setFormData({ ...formData, free_shipping_min_amount: e.target.value ? parseFloat(e.target.value) : null })}
                  placeholder="Deixar vazio para desativar"
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-2">Posição</label>
                  <input
                    type="number"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="font-semibold">Ativo</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                >
                  {editingId ? 'Atualizar' : 'Criar'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
