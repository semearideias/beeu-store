import React, { useEffect, useState } from 'react';
import { Edit2, Trash2, Plus, ChevronDown, ChevronUp, GripVertical, ArrowUp, ArrowDown } from 'lucide-react';
import axios from 'axios';

export default function AdminMenus() {
  const [menus, setMenus] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [draggedId, setDraggedId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    label: '',
    type: 'link',
    url: '',
    category_id: '',
    icon: '',
    parent_id: '',
    position: 0
  });

  const token = localStorage.getItem('adminToken');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchMenus();
    fetchCategories();
  }, []);

  const fetchMenus = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/menus/with-categories', { headers });
      setMenus(response.data);
    } catch (error) {
      console.error('Erro ao carregar menus:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/products', { headers });
      // Obter categorias únicas dos produtos
      const uniqueCategories = [...new Set(response.data.map(p => p.category_name))].filter(Boolean);
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  const handleEdit = (menu) => {
    setFormData({
      name: menu.name,
      label: menu.label,
      type: menu.type,
      url: menu.url || '',
      category_id: menu.category_id || '',
      icon: menu.icon || '',
      parent_id: menu.parent_id || '',
      position: menu.position
    });
    setEditingId(menu.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja deletar este menu?')) {
      try {
        await axios.delete(`/api/admin/menus/${id}`, { headers });
        fetchMenus();
      } catch (error) {
        console.error('Erro ao deletar menu:', error);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`/api/admin/menus/${editingId}`, formData, { headers });
      } else {
        await axios.post('/api/admin/menus', formData, { headers });
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({
        name: '',
        label: '',
        type: 'link',
        url: '',
        category_id: '',
        icon: '',
        parent_id: '',
        position: 0
      });
      fetchMenus();
    } catch (error) {
      console.error('Erro ao salvar menu:', error);
    }
  };

  const parentMenus = menus.filter(m => !m.parent_id);
  const getChildMenus = (parentId) => menus.filter(m => m.parent_id === parentId);

  const handleMoveUp = async (menu) => {
    try {
      const siblings = menu.parent_id 
        ? menus.filter(m => m.parent_id === menu.parent_id)
        : menus.filter(m => !m.parent_id);
      
      const currentIndex = siblings.findIndex(m => m.id === menu.id);
      if (currentIndex === 0) return;

      const newPosition = siblings[currentIndex - 1].position;
      const oldPosition = menu.position;

      await axios.put(`/api/admin/menus/${menu.id}`, 
        { ...menu, position: newPosition },
        { headers }
      );

      await axios.put(`/api/admin/menus/${siblings[currentIndex - 1].id}`,
        { ...siblings[currentIndex - 1], position: oldPosition },
        { headers }
      );

      fetchMenus();
    } catch (error) {
      console.error('Erro ao mover menu:', error);
    }
  };

  const handleMoveDown = async (menu) => {
    try {
      const siblings = menu.parent_id 
        ? menus.filter(m => m.parent_id === menu.parent_id)
        : menus.filter(m => !m.parent_id);
      
      const currentIndex = siblings.findIndex(m => m.id === menu.id);
      if (currentIndex === siblings.length - 1) return;

      const newPosition = siblings[currentIndex + 1].position;
      const oldPosition = menu.position;

      await axios.put(`/api/admin/menus/${menu.id}`, 
        { ...menu, position: newPosition },
        { headers }
      );

      await axios.put(`/api/admin/menus/${siblings[currentIndex + 1].id}`,
        { ...siblings[currentIndex + 1], position: oldPosition },
        { headers }
      );

      fetchMenus();
    } catch (error) {
      console.error('Erro ao mover menu:', error);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Gestão de Menus</h1>
        <button
          onClick={() => {
            setFormData({
              name: '',
              label: '',
              type: 'link',
              url: '',
              category_id: '',
              icon: '',
              parent_id: '',
              position: 0
            });
            setEditingId(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
        >
          <Plus size={20} />
          Novo Menu
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingId ? 'Editar Menu' : 'Novo Menu'}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome Interno</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="ex: menu-principal"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Label (Visível)</label>
                  <input
                    type="text"
                    value={formData.label}
                    onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
                    placeholder="ex: Produtos"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="link">Link</option>
                  <option value="category">Categoria</option>
                  <option value="dropdown">Dropdown</option>
                </select>
              </div>

              {formData.type === 'link' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                  <input
                    type="text"
                    value={formData.url}
                    onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="ex: /sobre"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              )}

              {formData.type === 'category' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Selecionar categoria</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Menu Pai (Dropdown)</label>
                  <select
                    value={formData.parent_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, parent_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Nenhum (Menu Principal)</option>
                    {parentMenus.map((menu) => (
                      <option key={menu.id} value={menu.id}>{menu.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ícone (Lucide)</label>
                  <input
                    type="text"
                    value={formData.icon}
                    onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                    placeholder="ex: Home, ShoppingCart, Settings"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">Nomes de ícones Lucide React</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
                >
                  {editingId ? 'Atualizar' : 'Criar'} Menu
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-2 px-4 rounded-lg transition"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Menus List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-600">Carregando menus...</div>
        ) : parentMenus.length === 0 ? (
          <div className="p-8 text-center text-gray-600">Nenhum menu encontrado</div>
        ) : (
          <div className="divide-y divide-gray-200">
            {parentMenus.map((menu, index) => {
              const children = getChildMenus(menu.id);
              const isFirst = index === 0;
              const isLast = index === parentMenus.length - 1;
              
              return (
                <div key={menu.id}>
                  <div className="p-4 hover:bg-gray-50 transition flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <GripVertical size={20} className="text-gray-400" />
                      <div>
                        <p className="font-semibold text-gray-900">{menu.label}</p>
                        <p className="text-sm text-gray-600">{menu.type === 'link' ? menu.url : menu.type}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleMoveUp(menu)}
                        disabled={isFirst}
                        className="text-gray-600 hover:text-gray-900 p-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Mover para cima"
                      >
                        <ArrowUp size={18} />
                      </button>
                      <button
                        onClick={() => handleMoveDown(menu)}
                        disabled={isLast}
                        className="text-gray-600 hover:text-gray-900 p-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Mover para baixo"
                      >
                        <ArrowDown size={18} />
                      </button>
                      <button
                        onClick={() => handleEdit(menu)}
                        className="text-blue-600 hover:text-blue-700 p-2"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(menu.id)}
                        className="text-red-600 hover:text-red-700 p-2"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Child Menus */}
                  {children.length > 0 && (
                    <div className="bg-gray-50 divide-y divide-gray-200">
                      {children.map((child, childIndex) => {
                        const isFirstChild = childIndex === 0;
                        const isLastChild = childIndex === children.length - 1;
                        
                        return (
                          <div key={child.id} className="p-4 pl-12 flex items-center justify-between hover:bg-gray-100 transition">
                            <div>
                              <p className="font-medium text-gray-700">└ {child.label}</p>
                              <p className="text-sm text-gray-600">{child.url || child.type}</p>
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleMoveUp(child)}
                                disabled={isFirstChild}
                                className="text-gray-600 hover:text-gray-900 p-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Mover para cima"
                              >
                                <ArrowUp size={18} />
                              </button>
                              <button
                                onClick={() => handleMoveDown(child)}
                                disabled={isLastChild}
                                className="text-gray-600 hover:text-gray-900 p-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Mover para baixo"
                              >
                                <ArrowDown size={18} />
                              </button>
                              <button
                                onClick={() => handleEdit(child)}
                                className="text-blue-600 hover:text-blue-700 p-2"
                              >
                                <Edit2 size={18} />
                              </button>
                              <button
                                onClick={() => handleDelete(child.id)}
                                className="text-red-600 hover:text-red-700 p-2"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
