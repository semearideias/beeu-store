import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { Plus, Trash2, Edit2, GripVertical, ChevronDown, ChevronRight } from 'lucide-react';

export default function AdminCategoriesDragDrop() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draggedItem, setDraggedItem] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parent_id: null,
    image_url: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [categoriesRes, productsRes] = await Promise.all([
        fetch('/api/products/categories/list'),
        fetch('/api/products')
      ]);
      
      const categoriesData = await categoriesRes.json();
      const productsData = await productsRes.json();
      
      setCategories(categoriesData || []);
      setProducts(productsData || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (e, item, type) => {
    setDraggedItem({ item, type });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDropOnCategory = async (e, targetCategoryId) => {
    e.preventDefault();
    
    if (!draggedItem) return;

    const { item, type } = draggedItem;

    if (type === 'product') {
      // Mover produto para categoria
      try {
        const token = localStorage.getItem('token');
        await fetch(`/api/products/${item.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ ...item, category_id: targetCategoryId })
        });
        fetchData();
      } catch (error) {
        console.error('Erro ao mover produto:', error);
      }
    } else if (type === 'category') {
      // Mover subcategoria
      try {
        const token = localStorage.getItem('token');
        await fetch(`/api/categories/${item.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ ...item, parent_id: targetCategoryId })
        });
        fetchData();
      } catch (error) {
        console.error('Erro ao mover categoria:', error);
      }
    }

    setDraggedItem(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `/api/categories/${editingId}` : '/api/categories';

      await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      setShowForm(false);
      setEditingId(null);
      setFormData({ name: '', description: '', parent_id: null, image_url: '' });
      fetchData();
    } catch (error) {
      console.error('Erro ao salvar categoria:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem a certeza que deseja eliminar esta categoria?')) {
      try {
        const token = localStorage.getItem('token');
        await fetch(`/api/categories/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        fetchData();
      } catch (error) {
        console.error('Erro ao eliminar categoria:', error);
      }
    }
  };

  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const getProductsByCategory = (categoryId) => {
    return products.filter(p => p.category_id === categoryId);
  };

  const getSubcategories = (parentId) => {
    return categories.filter(c => c.parent_id === parentId);
  };

  const getRootCategories = () => {
    return categories.filter(c => !c.parent_id);
  };

  const CategoryTree = ({ categoryId = null, level = 0 }) => {
    const items = categoryId ? getSubcategories(categoryId) : getRootCategories();
    const categoryProducts = categoryId ? getProductsByCategory(categoryId) : [];

    return (
      <div className={`space-y-2 ${level > 0 ? 'ml-6 mt-2' : ''}`}>
        {items.map(category => {
          const subcategories = getSubcategories(category.id);
          const hasChildren = subcategories.length > 0;
          const isExpanded = expandedCategories[category.id];
          const categoryProds = getProductsByCategory(category.id);

          return (
            <div key={category.id}>
              <div
                onDragOver={handleDragOver}
                onDrop={(e) => handleDropOnCategory(e, category.id)}
                className={`bg-white rounded-lg shadow p-4 border-2 border-dashed transition ${
                  draggedItem ? 'border-primary bg-blue-50' : 'border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  {hasChildren && (
                    <button
                      onClick={() => toggleCategory(category.id)}
                      className="p-1 hover:bg-gray-100 rounded transition"
                    >
                      {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </button>
                  )}
                  {!hasChildren && <div className="w-8" />}

                  <GripVertical
                    size={20}
                    className="text-gray-400 cursor-grab active:cursor-grabbing"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleDragStart(e, category, 'category');
                    }}
                  />

                  {category.image_url && (
                    <img
                      src={category.image_url}
                      alt={category.name}
                      className="w-12 h-12 rounded object-cover"
                    />
                  )}

                  <div className="flex-1">
                    <h4 className="font-bold text-gray-800">{category.name}</h4>
                    <p className="text-xs text-gray-600">{category.description}</p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setFormData(category);
                        setEditingId(category.id);
                        setShowForm(true);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {/* Produtos da categoria */}
                {categoryProds.length > 0 && (
                  <div className="mt-4 pt-4 border-t space-y-2">
                    <p className="text-xs font-semibold text-gray-600">Produtos ({categoryProds.length})</p>
                    {categoryProds.map(product => (
                      <div
                        key={product.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, product, 'product')}
                        className="flex items-center gap-3 bg-gray-50 p-3 rounded cursor-move hover:bg-gray-100 transition"
                      >
                        <GripVertical size={16} className="text-gray-400" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-800">{product.name}</p>
                          <p className="text-xs text-gray-600">{product.sku}</p>
                        </div>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          €{parseFloat(product.base_price).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Subcategorias */}
              {isExpanded && hasChildren && (
                <CategoryTree categoryId={category.id} level={level + 1} />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold text-gray-800">Gestão de Categorias (Drag & Drop)</h2>
          <button
            onClick={() => {
              setShowForm(true);
              setEditingId(null);
              setFormData({ name: '', description: '', parent_id: null, image_url: '' });
            }}
            className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition"
          >
            <Plus size={20} />
            Nova Categoria
          </button>
        </div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            💡 <strong>Dica:</strong> Arraste categorias para reorganizar a hierarquia. Arraste produtos para movê-los entre categorias.
          </p>
        </div>

        {/* Categories Tree */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center text-gray-600 py-8">Carregando categorias...</div>
          ) : (
            <CategoryTree />
          )}
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full mx-4">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">
                {editingId ? 'Editar Categoria' : 'Nova Categoria'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Nome</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Descrição</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                    rows="3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Categoria Pai (Subcategoria)</label>
                  <select
                    value={formData.parent_id || ''}
                    onChange={(e) => setFormData({ ...formData, parent_id: e.target.value ? parseInt(e.target.value) : null })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                  >
                    <option value="">Nenhuma (Categoria Principal)</option>
                    {categories.filter(c => c.id !== editingId).map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">URL da Imagem</label>
                  <input
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                    placeholder="https://..."
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-primary text-white py-2 rounded-lg font-semibold hover:shadow-lg transition"
                  >
                    {editingId ? 'Atualizar' : 'Criar'} Categoria
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg font-semibold hover:bg-gray-300 transition"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
