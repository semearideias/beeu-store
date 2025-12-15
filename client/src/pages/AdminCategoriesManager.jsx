import React, { useState, useEffect } from 'react';
import { Edit2, Trash2, Plus, ChevronDown, ChevronRight, AlertCircle, GripVertical, X } from 'lucide-react';
import axios from 'axios';

export default function AdminCategoriesManager() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
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
      if (selectedCategory?.id === id) {
        setSelectedCategory(null);
      }
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
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDropOnCategory = async (e, targetCategory) => {
    e.preventDefault();
    
    if (!draggedItem || draggedItem.id === targetCategory.id) {
      setDraggedItem(null);
      return;
    }

    try {
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

  const handleDropOnPromote = async (e) => {
    e.preventDefault();
    
    if (!draggedItem) {
      setDraggedItem(null);
      return;
    }

    try {
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

  const renderCategoryItem = (category, level = 0) => {
    const isSelected = selectedCategory?.id === category.id;
    const isDragged = draggedItem?.id === category.id;

    return (
      <div key={category.id}>
        <div
          draggable
          onDragStart={(e) => handleDragStart(e, category)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDropOnCategory(e, category)}
          onClick={() => setSelectedCategory(category)}
          className={`
            flex items-center gap-2 p-3 rounded cursor-move transition mb-1
            ${isDragged ? 'bg-blue-100 border-l-4 border-blue-500' : ''}
            ${isSelected ? 'bg-primary bg-opacity-20 border-l-4 border-primary' : 'hover:bg-gray-100'}
          `}
          style={{ marginLeft: `${level * 16}px` }}
        >
          <GripVertical size={16} className="text-gray-400 flex-shrink-0" />
          
          {category.children && category.children.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpanded(category.id);
              }}
              className="p-0 hover:bg-gray-300 rounded"
            >
              {expandedIds.has(category.id) ? (
                <ChevronDown size={16} />
              ) : (
                <ChevronRight size={16} />
              )}
            </button>
          )}
          
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 truncate">{category.name}</p>
            <p className="text-xs text-gray-500">{category.product_count} produto(s)</p>
          </div>
        </div>
        
        {expandedIds.has(category.id) && category.children && category.children.length > 0 && (
          <div>
            {category.children.map(child => renderCategoryItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const getSubcategories = (parentId) => {
    const findSubcategories = (cats) => {
      return cats.reduce((acc, cat) => {
        if (cat.parent_id === parentId) {
          acc.push(cat);
        }
        if (cat.children) {
          acc.push(...findSubcategories(cat.children));
        }
        return acc;
      }, []);
    };
    return findSubcategories(categories);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">Gestor de Categorias</h1>
        <p className="text-sm text-gray-600 mt-1">Estrutura vertical para melhor organização</p>
      </div>

      {/* Mensagens */}
      {error && (
        <div className="bg-red-100 border-b border-red-400 text-red-700 px-6 py-3 flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-100 border-b border-green-400 text-green-700 px-6 py-3">
          {success}
        </div>
      )}

      {/* Conteúdo Principal */}
      <div className="flex-1 flex overflow-hidden">
        {/* Painel Esquerdo - Lista de Categorias */}
        <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-4 border-b border-gray-200">
            <button
              onClick={() => {
                setShowForm(true);
                setEditingId(null);
                setFormData({ name: '', description: '', image_url: '', parent_id: null });
              }}
              className="w-full bg-primary text-dark px-4 py-2 rounded font-semibold hover:opacity-90 transition flex items-center justify-center gap-2"
            >
              <Plus size={20} />
              Nova Categoria
            </button>
          </div>

          {loading ? (
            <div className="p-4 text-center text-gray-600">Carregando...</div>
          ) : categories.length === 0 ? (
            <div className="p-4 text-center text-gray-600">Nenhuma categoria</div>
          ) : (
            <div className="p-4 space-y-1">
              {categories.map(cat => renderCategoryItem(cat))}
            </div>
          )}

          {/* Zona de Promoção */}
          <div
            onDragOver={handleDragOver}
            onDrop={handleDropOnPromote}
            className={`
              border-t-2 border-dashed p-4 text-center transition
              ${draggedItem ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-50'}
            `}
          >
            <p className="text-sm font-semibold text-gray-700">
              {draggedItem ? '📤 Solte para promover' : '📤 Zona de Promoção'}
            </p>
          </div>
        </div>

        {/* Painel Direito - Detalhes e Formulário */}
        <div className="flex-1 overflow-y-auto">
          {showForm ? (
            <div className="p-6 max-w-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">
                  {editingId ? 'Editar Categoria' : 'Nova Categoria'}
                </h2>
                <button
                  onClick={handleCancel}
                  className="p-2 hover:bg-gray-200 rounded"
                >
                  <X size={20} />
                </button>
              </div>

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
                  <label className="block text-sm font-bold mb-2">Categoria Pai</label>
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

                <div className="flex gap-2 pt-4">
                  <button
                    type="submit"
                    className="bg-primary text-dark px-6 py-2 rounded font-semibold hover:opacity-90 transition"
                  >
                    {editingId ? 'Atualizar' : 'Criar'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="bg-gray-300 text-gray-700 px-6 py-2 rounded font-semibold hover:opacity-90 transition"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          ) : selectedCategory ? (
            <div className="p-6 max-w-2xl">
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedCategory.name}</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      <code className="bg-gray-100 px-2 py-1 rounded">{selectedCategory.slug}</code>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(selectedCategory)}
                      className="text-blue-600 hover:text-blue-700 p-2"
                      title="Editar"
                    >
                      <Edit2 size={20} />
                    </button>
                    <button
                      onClick={() => handleDelete(selectedCategory.id)}
                      className="text-red-600 hover:text-red-700 p-2"
                      title="Deletar"
                      disabled={selectedCategory.product_count > 0 || (selectedCategory.children && selectedCategory.children.length > 0)}
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Produtos</p>
                    <p className="text-2xl font-bold text-primary">{selectedCategory.product_count}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Subcategorias</p>
                    <p className="text-2xl font-bold text-primary">
                      {selectedCategory.children ? selectedCategory.children.length : 0}
                    </p>
                  </div>
                </div>

                {selectedCategory.description && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">Descrição</p>
                    <p className="text-gray-900">{selectedCategory.description}</p>
                  </div>
                )}

                {selectedCategory.image_url && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Imagem</p>
                    <img
                      src={selectedCategory.image_url}
                      alt={selectedCategory.name}
                      className="max-w-xs rounded"
                    />
                  </div>
                )}
              </div>

              {/* Subcategorias */}
              {selectedCategory.children && selectedCategory.children.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="font-bold text-lg mb-4">Subcategorias</h3>
                  <div className="space-y-2">
                    {selectedCategory.children.map(subcat => (
                      <div
                        key={subcat.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-gray-100 transition"
                      >
                        <div>
                          <p className="font-medium text-gray-900">{subcat.name}</p>
                          <p className="text-xs text-gray-500">{subcat.product_count} produto(s)</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(subcat)}
                            className="text-blue-600 hover:text-blue-700 p-2"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(subcat.id)}
                            className="text-red-600 hover:text-red-700 p-2"
                            disabled={subcat.product_count > 0}
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <p className="text-lg font-semibold mb-2">Selecione uma categoria</p>
                <p className="text-sm">Clique em uma categoria na lista para ver detalhes</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
