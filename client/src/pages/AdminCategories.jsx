import React, { useState, useEffect } from 'react';
import { Edit2, Trash2, Plus, Package, AlertCircle } from 'lucide-react';
import axios from 'axios';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image_url: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const headers = {
    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/categories', { headers });
      setCategories(response.data);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      setError('Erro ao carregar categorias');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.name.trim()) {
      setError('Nome da categoria é obrigatório');
      return;
    }

    try {
      if (editingId) {
        await axios.put(`/api/admin/categories/${editingId}`, formData, { headers });
        setSuccess('Categoria atualizada com sucesso');
      } else {
        await axios.post('/api/admin/categories', formData, { headers });
        setSuccess('Categoria criada com sucesso');
      }
      
      setFormData({ name: '', description: '', image_url: '' });
      setEditingId(null);
      setShowForm(false);
      fetchCategories();
    } catch (error) {
      setError(error.response?.data?.error || 'Erro ao salvar categoria');
    }
  };

  const handleEdit = (category) => {
    setFormData({
      name: category.name,
      description: category.description || '',
      image_url: category.image_url || ''
    });
    setEditingId(category.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem a certeza que quer deletar esta categoria?')) {
      return;
    }

    try {
      await axios.delete(`/api/admin/categories/${id}`, { headers });
      setSuccess('Categoria deletada com sucesso');
      fetchCategories();
    } catch (error) {
      setError(error.response?.data?.error || 'Erro ao deletar categoria');
    }
  };

  const handleCancel = () => {
    setFormData({ name: '', description: '', image_url: '' });
    setEditingId(null);
    setShowForm(false);
    setError('');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Gestão de Categorias</h1>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-primary text-dark px-4 py-2 rounded font-semibold hover:opacity-90 transition flex items-center gap-2"
          >
            <Plus size={20} />
            Nova Categoria
          </button>
        )}
      </div>

      {/* Mensagens */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      {/* Formulário */}
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">
            {editingId ? 'Editar Categoria' : 'Nova Categoria'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold mb-2">Nome *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Ex: Escritório e Negócios"
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">Descrição</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Descrição da categoria..."
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">URL da Imagem</label>
              <input
                type="text"
                name="image_url"
                value={formData.image_url}
                onChange={handleInputChange}
                placeholder="https://..."
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-primary text-dark px-4 py-2 rounded font-semibold hover:opacity-90 transition"
              >
                {editingId ? 'Atualizar' : 'Criar'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded font-semibold hover:opacity-90 transition"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de Categorias */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-600">Carregando categorias...</div>
        ) : categories.length === 0 ? (
          <div className="p-8 text-center text-gray-600">Nenhuma categoria encontrada</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Nome</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Slug</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Descrição</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">
                    <Package size={18} className="inline" /> Produtos
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {categories.map(category => (
                  <tr key={category.id} className="hover:bg-gray-50 transition">
                    <td className="py-3 px-4 font-semibold text-gray-900">{category.name}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      <code className="bg-gray-100 px-2 py-1 rounded">{category.slug}</code>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {category.description ? category.description.substring(0, 50) + '...' : '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="bg-primary text-dark px-3 py-1 rounded-full text-sm font-semibold">
                        {category.product_count}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => handleEdit(category)}
                          className="text-blue-600 hover:text-blue-700 p-2"
                          title="Editar"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(category.id)}
                          className="text-red-600 hover:text-red-700 p-2"
                          title="Deletar"
                          disabled={category.product_count > 0}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Nota */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded p-4 text-sm text-blue-700">
        <strong>Nota:</strong> Categorias com produtos não podem ser deletadas. Mova os produtos para outra categoria primeiro.
      </div>
    </div>
  );
}
