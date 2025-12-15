import React, { useEffect, useState } from 'react';
import { Edit2, Trash2, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import axios from 'axios';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: '',
    stock: 0,
    weight: '',
    active: true,
    prices: [],
    colors: [],
    seo: {}
  });

  const token = localStorage.getItem('adminToken');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/products', { headers });
      setProducts(response.data);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product) => {
    setFormData({
      name: product.name,
      description: product.description || '',
      category_id: product.category_id || '',
      stock: product.stock || 0,
      weight: product.weight || '',
      active: product.active,
      prices: product.prices || [],
      colors: product.colors || [],
      seo: product.seo || {}
    });
    setEditingId(product.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja deletar este produto?')) {
      try {
        await axios.delete(`/api/admin/products/${id}`, { headers });
        fetchProducts();
      } catch (error) {
        console.error('Erro ao deletar produto:', error);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`/api/admin/products/${editingId}`, formData, { headers });
      }
      setShowForm(false);
      setEditingId(null);
      fetchProducts();
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
    }
  };

  const addPrice = () => {
    setFormData(prev => ({
      ...prev,
      prices: [...prev.prices, { quantity_min: 1, quantity_max: null, price: 0 }]
    }));
  };

  const addColor = () => {
    setFormData(prev => ({
      ...prev,
      colors: [...prev.colors, { color_name: '', color_hex: '', image_url: '' }]
    }));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Gestão de Produtos</h1>
        <button
          onClick={() => {
            setFormData({
              name: '',
              description: '',
              category_id: '',
              stock: 0,
              weight: '',
              active: true,
              prices: [],
              colors: [],
              seo: {}
            });
            setEditingId(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
        >
          <Plus size={20} />
          Novo Produto
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingId ? 'Editar Produto' : 'Novo Produto'}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Informações Básicas */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações Básicas</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      rows="4"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                      <input
                        type="number"
                        value={formData.stock}
                        onChange={(e) => setFormData(prev => ({ ...prev, stock: parseInt(e.target.value) }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Peso</label>
                      <input
                        type="text"
                        value={formData.weight}
                        onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                        placeholder="ex: 500g"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Preços */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Preços por Quantidade</h3>
                  <button
                    type="button"
                    onClick={addPrice}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    + Adicionar Preço
                  </button>
                </div>
                <div className="space-y-3">
                  {formData.prices.map((price, idx) => (
                    <div key={idx} className="grid grid-cols-3 gap-3">
                      <input
                        type="number"
                        placeholder="Qtd. Mín"
                        value={price.quantity_min}
                        onChange={(e) => {
                          const newPrices = [...formData.prices];
                          newPrices[idx].quantity_min = parseInt(e.target.value);
                          setFormData(prev => ({ ...prev, prices: newPrices }));
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                      <input
                        type="number"
                        placeholder="Qtd. Máx (opcional)"
                        value={price.quantity_max || ''}
                        onChange={(e) => {
                          const newPrices = [...formData.prices];
                          newPrices[idx].quantity_max = e.target.value ? parseInt(e.target.value) : null;
                          setFormData(prev => ({ ...prev, prices: newPrices }));
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                      <input
                        type="number"
                        placeholder="Preço"
                        value={price.price}
                        onChange={(e) => {
                          const newPrices = [...formData.prices];
                          newPrices[idx].price = parseFloat(e.target.value);
                          setFormData(prev => ({ ...prev, prices: newPrices }));
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Cores */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Cores Disponíveis</h3>
                  <button
                    type="button"
                    onClick={addColor}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    + Adicionar Cor
                  </button>
                </div>
                <div className="space-y-3">
                  {formData.colors.map((color, idx) => (
                    <div key={idx} className="grid grid-cols-3 gap-3">
                      <input
                        type="text"
                        placeholder="Nome da cor"
                        value={color.color_name}
                        onChange={(e) => {
                          const newColors = [...formData.colors];
                          newColors[idx].color_name = e.target.value;
                          setFormData(prev => ({ ...prev, colors: newColors }));
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                      <input
                        type="color"
                        value={color.color_hex || '#000000'}
                        onChange={(e) => {
                          const newColors = [...formData.colors];
                          newColors[idx].color_hex = e.target.value;
                          setFormData(prev => ({ ...prev, colors: newColors }));
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-lg cursor-pointer"
                      />
                      <input
                        type="text"
                        placeholder="URL da imagem"
                        value={color.image_url || ''}
                        onChange={(e) => {
                          const newColors = [...formData.colors];
                          newColors[idx].image_url = e.target.value;
                          setFormData(prev => ({ ...prev, colors: newColors }));
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* SEO */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">SEO</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Meta Title</label>
                    <input
                      type="text"
                      value={formData.seo?.meta_title || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        seo: { ...prev.seo, meta_title: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description</label>
                    <textarea
                      value={formData.seo?.meta_description || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        seo: { ...prev.seo, meta_description: e.target.value }
                      }))}
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Meta Keywords</label>
                    <input
                      type="text"
                      value={formData.seo?.meta_keywords || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        seo: { ...prev.seo, meta_keywords: e.target.value }
                      }))}
                      placeholder="palavra1, palavra2, palavra3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-6 border-t border-gray-200">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
                >
                  {editingId ? 'Atualizar' : 'Criar'} Produto
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

      {/* Contagem de Produtos */}
      {!loading && products.length > 0 && (
        <div className="mb-6 flex items-center justify-between">
          <p className="text-gray-600 font-semibold">
            Total de produtos: <span className="text-blue-600 text-lg font-bold">{products.length}</span>
          </p>
          <p className="text-sm text-gray-500">
            Mostrando {Math.min((currentPage - 1) * itemsPerPage + 1, products.length)} a {Math.min(currentPage * itemsPerPage, products.length)} de {products.length}
          </p>
        </div>
      )}

      {/* Products List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-600">Carregando produtos...</div>
        ) : products.length === 0 ? (
          <div className="p-8 text-center text-gray-600">Nenhum produto encontrado</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Nome</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Categoria</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Stock</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Preços</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {products.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-600 truncate">{product.description}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{product.category_name || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{product.stock}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{product.prices?.length || 0} preços</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleEdit(product)}
                          className="text-blue-600 hover:text-blue-700 mr-4"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {Math.ceil(products.length / itemsPerPage) > 1 && (
              <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  ← Anterior
                </button>

                <div className="flex gap-1">
                  {Array.from({ length: Math.ceil(products.length / itemsPerPage) }).map((_, idx) => (
                    <button
                      key={idx + 1}
                      onClick={() => setCurrentPage(idx + 1)}
                      className={`px-3 py-2 rounded transition ${
                        currentPage === idx + 1
                          ? 'bg-blue-600 text-white font-bold'
                          : 'border border-gray-300 hover:bg-white'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(Math.ceil(products.length / itemsPerPage), prev + 1))}
                  disabled={currentPage === Math.ceil(products.length / itemsPerPage)}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Próxima →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
