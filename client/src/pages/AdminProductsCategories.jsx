import React, { useState, useEffect } from 'react';
import { GripVertical, AlertCircle } from 'lucide-react';
import axios from 'axios';

export default function AdminProductsCategories() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState({});
  const [loading, setLoading] = useState(true);
  const [draggedProduct, setDraggedProduct] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const headers = {
    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
  };

  useEffect(() => {
    fetchCategoriesAndProducts();
  }, []);

  const fetchCategoriesAndProducts = async () => {
    try {
      setLoading(true);
      const [categoriesRes, productsRes] = await Promise.all([
        axios.get('/api/admin/categories/flat', { headers }),
        axios.get('/api/products?active=true', { headers })
      ]);

      setCategories(categoriesRes.data);
      
      // Agrupar produtos por categoria
      const productsByCategory = {};
      categoriesRes.data.forEach(cat => {
        productsByCategory[cat.id] = [];
      });
      
      productsRes.data.forEach(product => {
        if (product.category_id && productsByCategory[product.category_id]) {
          productsByCategory[product.category_id].push(product);
        }
      });
      
      setProducts(productsByCategory);
    } catch (error) {
      console.error('Erro ao carregar:', error);
      setError('Erro ao carregar categorias e produtos');
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (e, product) => {
    setDraggedProduct(product);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'product', id: product.id }));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDropProduct = async (e, targetCategoryId) => {
    e.preventDefault();
    
    if (!draggedProduct || draggedProduct.category_id === targetCategoryId) {
      setDraggedProduct(null);
      return;
    }

    try {
      const fromCategoryId = draggedProduct.category_id;
      
      // Mover produto
      await axios.post(
        `/api/admin/categories/${targetCategoryId}/move-products`,
        {
          from_category_id: fromCategoryId,
          product_ids: [draggedProduct.id]
        },
        { headers }
      );

      setSuccess(`${draggedProduct.name} movido com sucesso`);
      fetchCategoriesAndProducts();
    } catch (error) {
      setError(error.response?.data?.error || 'Erro ao mover produto');
    } finally {
      setDraggedProduct(null);
    }
  };

  const renderCategorySection = (category) => {
    const categoryProducts = products[category.id] || [];
    const isTarget = draggedProduct && draggedProduct.category_id !== category.id;

    return (
      <div
        key={category.id}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDropProduct(e, category.id)}
        className={`
          bg-white rounded-lg shadow p-4 mb-4 transition
          ${isTarget ? 'border-2 border-green-500 bg-green-50' : 'border border-gray-200'}
        `}
        style={{ marginLeft: category.parent_id ? '20px' : '0' }}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-900">
            {category.name}
            <span className="text-sm text-gray-500 ml-2">({categoryProducts.length})</span>
          </h3>
          {isTarget && (
            <span className="text-xs bg-green-500 text-white px-2 py-1 rounded">
              Solte aqui
            </span>
          )}
        </div>

        {categoryProducts.length === 0 ? (
          <p className="text-sm text-gray-500 italic">Nenhum produto nesta categoria</p>
        ) : (
          <div className="space-y-2">
            {categoryProducts.map(product => (
              <div
                key={product.id}
                draggable
                onDragStart={(e) => handleDragStart(e, product)}
                className={`
                  flex items-center gap-3 p-3 rounded border-l-4 cursor-move transition
                  ${draggedProduct?.id === product.id 
                    ? 'bg-blue-100 border-blue-500' 
                    : 'bg-gray-50 border-gray-300 hover:bg-gray-100'}
                `}
              >
                <GripVertical size={18} className="text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{product.name}</p>
                  <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                </div>
                {product.image_url && (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-10 h-10 rounded object-cover flex-shrink-0"
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const rootCategories = categories.filter(c => !c.parent_id);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Mover Produtos Entre Categorias</h1>
        <p className="text-gray-600 mt-2">Arraste produtos para reorganizá-los entre categorias</p>
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

      {/* Categorias e Produtos */}
      {loading ? (
        <div className="text-center text-gray-600">Carregando...</div>
      ) : rootCategories.length === 0 ? (
        <div className="text-center text-gray-600">Nenhuma categoria encontrada</div>
      ) : (
        <div>
          {rootCategories.map(category => (
            <div key={category.id}>
              {renderCategorySection(category)}
              
              {/* Subcategorias */}
              {categories
                .filter(c => c.parent_id === category.id)
                .map(subCategory => renderCategorySection(subCategory))
              }
            </div>
          ))}
        </div>
      )}

      {/* Notas */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded p-4 text-sm text-blue-700 space-y-2">
        <p><strong>Como usar:</strong></p>
        <ul className="list-disc list-inside space-y-1">
          <li>Arraste um produto para outra categoria para movê-lo</li>
          <li>A zona de drop fica verde quando está pronta para receber</li>
          <li>Imagens dos produtos aparecem para identificação rápida</li>
          <li>Produtos são organizados por categoria e subcategoria</li>
        </ul>
      </div>
    </div>
  );
}
