import React, { useState, useEffect } from 'react';
import { Edit2, Trash2, Plus, ChevronDown, ChevronRight, AlertCircle, GripVertical } from 'lucide-react';
import axios from 'axios';

export default function AdminCategoriesDragDrop() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [draggedItem, setDraggedItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image_url: '',
    parent_id: null
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
      [name]: value === '' ? null : (name === 'parent_id' ? parseInt(value) : value)
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
      
      setFormData({ name: '', description: '', image_url: '', parent_id: null });
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
      image_url: category.image_url || '',
      parent_id: category.parent_id || null
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

  const toggleExpanded = (id) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  const handleDragStart = (e, category) => {
    setDraggedItem(category);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'category', id: category.id }));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, targetCategory) => {
    e.preventDefault();
    
    if (!draggedItem || draggedItem.id === targetCategory.id) {
      setDraggedItem(null);
      return;
    }

    try {
      // Se soltar em uma categoria, torna-a subcategoria
      await axios.post(
        `/api/admin/categories/${draggedItem.id}/move`,
        { parent_id: targetCategory.id, position: 0 },
        { headers }
      );
      
      setSuccess(`${draggedItem.name} movida para ${targetCategory.name}`);
      fetchCategories();
    } catch (error) {
      setError(error.response?.data?.error || 'Erro ao mover categoria');
    } finally {
      setDraggedItem(null);
    }
  };

  const handleDropOnEmpty = async (e) => {
    e.preventDefault();
    
    if (!draggedItem) {
      setDraggedItem(null);
      return;
    }

    try {
      // Se soltar na área vazia, promove a categoria (remove parent)
      await axios.post(
        `/api/admin/categories/${draggedItem.id}/move`,
        { parent_id: null, position: 0 },
        { headers }
      );
      
      setSuccess(`${draggedItem.name} promovida a categoria principal`);
      fetchCategories();
    } catch (error) {
      setError(error.response?.data?.error || 'Erro ao mover categoria');
    } finally {
      setDraggedItem(null);
    }
  };

  const handleCancel = () => {
    setFormData({ name: '', description: '', image_url: '', parent_id: null });
    setEditingId(null);
    setShowForm(false);
    setError('');
  };

  const renderCategoryTree = (cats, level = 0) => {
    return cats.map(category => (
      <div key={category.id}>
        <div
          draggable
          onDragStart={(e) => handleDragStart(e, category)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, category)}
          className={`
            flex items-center gap-2 p-3 rounded border-l-4 mb-2 cursor-move
            ${draggedItem?.id === category.id ? 'bg-blue-100 border-blue-500' : 'bg-white border-gray-300 hover:bg-gray-50'}
            transition
          `}
          style={{ marginLeft: `${level * 20}px` }}
        >
          <GripVertical size={18} className="text-gray-400" />
          
          {category.children && category.children.length > 0 && (
            <button
              onClick={() => toggleExpanded(category.id)}
              className="p-1 hover:bg-gray-200 rounded"
            >
              {expandedIds.has(category.id) ? (
                <ChevronDown size={18} />
              ) : (
                <ChevronRight size={18} />
              )}
            </button>
          )}
          
          <div className="flex-1">
            <p className="font-semibold text-gray-900">{category.name}</p>
            <p className="text-xs text-gray-500">
              {category.product_count} produto(s)
              {category.parent_id && ` • Subcategoria`}
            </p>
          </div>
          
          <div className="flex gap-2">
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
              disabled={category.product_count > 0 || (category.children && category.children.length > 0)}
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
        
        {expandedIds.has(category.id) && category.children && category.children.length > 0 && (
          <div>
            {renderCategoryTree(category.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Gestão de Categorias (Drag & Drop)</h1>
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
              <label className="block text-sm font-bold mb-2">Categoria Pai (Subcategoria)</label>
              <select
                name="parent_id"
                value={formData.parent_id || ''}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary"
              >
                <option value="">Nenhuma (Categoria Principal)</option>
                {categories.filter(c => !c.parent_id).map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
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

      {/* Árvore de Categorias */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        {loading ? (
          <div className="text-center text-gray-600">Carregando categorias...</div>
        ) : categories.length === 0 ? (
          <div className="text-center text-gray-600">Nenhuma categoria encontrada</div>
        ) : (
          <div>
            <p className="text-sm text-gray-600 mb-4">
              💡 Arraste categorias para reorganizar, criar subcategorias ou promover
            </p>
            {renderCategoryTree(categories)}
          </div>
        )}
      </div>

      {/* Zona de Drop para Promover Categorias */}
      <div
        onDragOver={handleDragOver}
        onDrop={handleDropOnEmpty}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition
          ${draggedItem ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-50'}
        `}
      >
        <p className="text-gray-600 font-semibold">
          {draggedItem ? '📤 Solte aqui para promover a categoria principal' : '📤 Zona de promoção'}
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Arraste uma subcategoria aqui para transformá-la em categoria principal
        </p>
      </div>

      {/* Notas */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded p-4 text-sm text-blue-700 space-y-2">
        <p><strong>Como usar:</strong></p>
        <ul className="list-disc list-inside space-y-1">
          <li>Arraste uma categoria para outra para criar uma subcategoria</li>
          <li>Clique na seta para expandir/colapsar subcategorias</li>
          <li>Categorias com produtos não podem ser deletadas</li>
          <li>Categorias com subcategorias não podem ser deletadas</li>
        </ul>
      </div>
    </div>
  );
}
