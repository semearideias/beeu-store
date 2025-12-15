import React, { useState, useEffect } from 'react';
import { GripVertical, AlertCircle, ChevronRight } from 'lucide-react';
import axios from 'axios';

export default function AdminProductsManager() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [draggedProduct, setDraggedProduct] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState(new Set());
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

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
      
      // Selecionar primeira categoria por padrão
      const rootCategories = categoriesRes.data.filter(c => !c.parent_id);
      if (rootCategories.length > 0) {
        setSelectedCategory(rootCategories[0]);
      }
    } catch (error) {
      console.error('Erro ao carregar:', error);
      setError('Erro ao carregar categorias e produtos');
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (e, product) => {
    // Se o produto não está selecionado, seleciona apenas ele
    if (!selectedProducts.has(product.id)) {
      setSelectedProducts(new Set([product.id]));
      setDraggedProduct(product);
    } else {
      // Se está selecionado, arrasta todos os selecionados
      setDraggedProduct(product);
    }
    
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify(product));
    console.log('Drag start:', { product, selectedCount: selectedProducts.size });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDropProduct = async (e, targetCategoryId) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Drop event:', { draggedProduct, targetCategoryId, selectedCount: selectedProducts.size });
    
    if (!draggedProduct) {
      setDraggedProduct(null);
      return;
    }

    try {
      // Se há múltiplos selecionados, mover todos
      if (selectedProducts.size > 1) {
        const productIds = Array.from(selectedProducts);
        
        // Filtrar produtos que não estão na categoria de destino
        const productsToMove = productIds.filter(id => {
          const product = getFilteredProducts(selectedCategory.id).find(p => p.id === id);
          return product && product.category_id !== targetCategoryId;
        });

        if (productsToMove.length === 0) {
          setDraggedProduct(null);
          return;
        }

        console.log('Movendo múltiplos produtos:', productsToMove);
        
        await Promise.all(
          productsToMove.map(productId =>
            axios.put(
              `/api/admin/products/${productId}`,
              { category_id: targetCategoryId },
              { headers }
            )
          )
        );

        setSuccess(`${productsToMove.length} produto(s) movido(s) para ${getCategoryName(targetCategoryId)}`);
        setSelectedProducts(new Set());
        fetchCategoriesAndProducts();
      } else {
        // Mover apenas um produto
        if (draggedProduct.category_id === targetCategoryId) {
          setDraggedProduct(null);
          return;
        }

        console.log('Enviando PUT para:', `/api/admin/products/${draggedProduct.id}`, { category_id: targetCategoryId });
        
        const response = await axios.put(
          `/api/admin/products/${draggedProduct.id}`,
          { category_id: targetCategoryId },
          { headers }
        );
        
        console.log('Resposta:', response.data);
        setSuccess(`${draggedProduct.name} movido para ${getCategoryName(targetCategoryId)}`);
        fetchCategoriesAndProducts();
      }
    } catch (error) {
      console.error('Erro completo:', error);
      console.error('Erro response:', error.response);
      setError(error.response?.data?.error || error.message || 'Erro ao mover produto');
    } finally {
      setDraggedProduct(null);
    }
  };

  const getCategoryName = (categoryId) => {
    const cat = categories.find(c => c.id === categoryId);
    return cat ? cat.name : 'Desconhecida';
  };

  const getFilteredProducts = (categoryId) => {
    const categoryProducts = products[categoryId] || [];
    if (!searchTerm) return categoryProducts;
    
    return categoryProducts.filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const getSubcategories = (parentId) => {
    return categories.filter(c => c.parent_id === parentId);
  };

  const rootCategories = categories.filter(c => !c.parent_id);

  const toggleProductSelection = (productId) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const selectAllProducts = () => {
    const currentProducts = getFilteredProducts(selectedCategory.id);
    if (selectedProducts.size === currentProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(currentProducts.map(p => p.id)));
    }
  };

  const moveSelectedProducts = async (targetCategoryId) => {
    if (selectedProducts.size === 0) {
      setError('Selecione pelo menos um produto');
      return;
    }

    try {
      const productIds = Array.from(selectedProducts);
      
      // Mover todos os produtos selecionados
      await Promise.all(
        productIds.map(productId =>
          axios.put(
            `/api/admin/products/${productId}`,
            { category_id: targetCategoryId },
            { headers }
          )
        )
      );

      setSuccess(`${productIds.length} produto(s) movido(s) com sucesso`);
      setSelectedProducts(new Set());
      fetchCategoriesAndProducts();
    } catch (error) {
      console.error('Erro ao mover produtos:', error);
      setError(error.response?.data?.error || 'Erro ao mover produtos');
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">Gestor de Produtos</h1>
        <p className="text-sm text-gray-600 mt-1">Mova produtos entre categorias com drag & drop</p>
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
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Menu de Categorias */}
        <div className="bg-white border-b border-gray-200 overflow-x-auto">
          <div className="flex flex-wrap">
            {rootCategories.map(category => (
              <div key={category.id} className="flex flex-col">
                <button
                  onClick={() => setSelectedCategory(category)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDropProduct(e, category.id)}
                  className={`
                    px-4 py-3 font-semibold whitespace-nowrap transition border-b-2 text-sm
                    ${selectedCategory?.id === category.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                    }
                  `}
                >
                  {category.name}
                  <span className="text-xs ml-2 bg-gray-200 px-2 py-1 rounded-full">
                    {(products[category.id] || []).length}
                  </span>
                </button>

                {/* Submenu de Subcategorias - Sempre Visível */}
                {getSubcategories(category.id).length > 0 && (
                  <div className="flex flex-wrap bg-gray-50 border-b border-gray-200">
                    {getSubcategories(category.id).map(subcat => (
                      <button
                        key={subcat.id}
                        onClick={() => setSelectedCategory(subcat)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDropProduct(e, subcat.id)}
                        className={`
                          px-4 py-2 whitespace-nowrap transition text-xs font-medium
                          ${selectedCategory?.id === subcat.id
                            ? 'bg-primary bg-opacity-20 text-primary'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                          }
                        `}
                      >
                        └─ {subcat.name}
                        <span className="text-xs ml-1 bg-gray-300 px-1.5 py-0.5 rounded">
                          {(products[subcat.id] || []).length}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Área de Produtos */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {loading ? (
            <div className="flex items-center justify-center h-full text-gray-600">
              Carregando...
            </div>
          ) : !selectedCategory ? (
            <div className="flex items-center justify-center h-full text-gray-600">
              Selecione uma categoria
            </div>
          ) : (
            <>
              {/* Barra de Pesquisa e Ações */}
              <div className="bg-white border-b border-gray-200 px-6 py-4 space-y-3">
                <input
                  type="text"
                  placeholder="Pesquisar por nome ou SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary"
                />

                {/* Barra de Ações para Produtos Selecionados */}
                {selectedProducts.size > 0 && (
                  <div className="bg-primary bg-opacity-10 border border-primary rounded p-3 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="font-semibold text-primary">
                        {selectedProducts.size} produto(s) selecionado(s)
                      </span>
                      <button
                        onClick={() => setSelectedProducts(new Set())}
                        className="text-sm text-primary hover:underline"
                      >
                        Limpar seleção
                      </button>
                    </div>

                    {/* Dropdown para Mover Selecionados */}
                    <div className="relative group">
                      <button className="bg-primary text-dark px-4 py-2 rounded font-semibold hover:opacity-90 transition text-sm">
                        Mover Selecionados
                        <ChevronRight size={16} className="inline ml-1" />
                      </button>

                      <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded shadow-lg hidden group-hover:block z-30 min-w-max">
                        {rootCategories.map(cat => (
                          <div key={cat.id}>
                            <button
                              onClick={() => moveSelectedProducts(cat.id)}
                              className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition whitespace-nowrap"
                            >
                              {cat.name}
                            </button>
                            {getSubcategories(cat.id).map(subcat => (
                              <button
                                key={subcat.id}
                                onClick={() => moveSelectedProducts(subcat.id)}
                                className="block w-full text-left px-4 py-2 pl-6 text-sm hover:bg-gray-100 transition whitespace-nowrap"
                              >
                                └─ {subcat.name}
                              </button>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Checkbox Selecionar Tudo */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="selectAll"
                    checked={selectedProducts.size > 0 && selectedProducts.size === getFilteredProducts(selectedCategory.id).length}
                    onChange={selectAllProducts}
                    className="w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="selectAll" className="text-sm font-medium text-gray-700 cursor-pointer">
                    Selecionar todos ({getFilteredProducts(selectedCategory.id).length})
                  </label>
                </div>
              </div>

              {/* Grid de Produtos */}
              <div className="flex-1 overflow-y-auto p-4">
                {getFilteredProducts(selectedCategory.id).length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                      <p className="text-lg font-semibold mb-2">Nenhum produto encontrado</p>
                      <p className="text-sm">
                        {searchTerm ? 'Tente outro termo de pesquisa' : 'Esta categoria não tem produtos'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                    {getFilteredProducts(selectedCategory.id).map(product => (
                      <div
                        key={product.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, product)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        className={`
                          bg-white rounded-lg shadow-md hover:shadow-lg transition cursor-move flex flex-col relative
                          ${draggedProduct?.id === product.id && selectedProducts.size > 1 ? 'ring-2 ring-blue-500 opacity-75 scale-95' : ''}
                          ${draggedProduct?.id === product.id && selectedProducts.size === 1 ? 'ring-2 ring-blue-500 opacity-75' : ''}
                          ${selectedProducts.has(product.id) ? 'ring-2 ring-primary' : ''}
                        `}
                      >
                        {/* Checkbox */}
                        <div className="absolute top-2 left-2 z-10">
                          <input
                            type="checkbox"
                            checked={selectedProducts.has(product.id)}
                            onChange={() => toggleProductSelection(product.id)}
                            className="w-4 h-4 cursor-pointer"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>

                        {/* Badge de Múltiplos Selecionados */}
                        {draggedProduct?.id === product.id && selectedProducts.size > 1 && (
                          <div className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded text-xs font-bold z-10">
                            +{selectedProducts.size - 1}
                          </div>
                        )}

                        {/* Imagem */}
                        <div className="relative bg-gray-100 h-24 rounded-t-lg overflow-hidden">
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                              Sem imagem
                            </div>
                          )}
                          <div className="absolute top-1 right-1 bg-black bg-opacity-50 text-white px-1.5 py-0.5 rounded text-xs">
                            <GripVertical size={12} className="inline" />
                          </div>
                        </div>

                        {/* Informações */}
                        <div className="p-2 flex-1 flex flex-col">
                          <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 text-xs">
                            {product.name}
                          </h3>
                          <p className="text-xs text-gray-500 mb-2">
                            <code className="bg-gray-100 px-0.5 rounded">{product.sku}</code>
                          </p>

                          {/* Dropdown de Categorias */}
                          <div className="relative group mt-auto">
                            <button className="w-full flex items-center justify-center bg-primary bg-opacity-10 text-primary px-2 py-1 rounded text-xs font-semibold hover:bg-opacity-20 transition">
                              Mover
                              <ChevronRight size={12} className="ml-0.5" />
                            </button>

                            {/* Menu Dropdown */}
                            <div className="absolute left-0 right-0 top-full mt-0.5 bg-white border border-gray-200 rounded shadow-lg hidden group-hover:block z-30 min-w-max">
                              {rootCategories.map(cat => (
                                <div key={cat.id}>
                                  {/* Categoria Principal */}
                                  <button
                                    onClick={async (e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      if (product.category_id !== cat.id) {
                                        try {
                                          await axios.put(
                                            `/api/admin/products/${product.id}`,
                                            { category_id: cat.id },
                                            { headers }
                                          );
                                          setSuccess(`${product.name} movido para ${cat.name}`);
                                          fetchCategoriesAndProducts();
                                        } catch (error) {
                                          setError(error.response?.data?.error || 'Erro ao mover produto');
                                        }
                                      }
                                    }}
                                    className={`
                                      w-full text-left px-3 py-1.5 text-xs transition whitespace-nowrap
                                      ${product.category_id === cat.id
                                        ? 'bg-primary bg-opacity-20 text-primary font-semibold'
                                        : 'hover:bg-gray-100'
                                      }
                                    `}
                                  >
                                    {cat.name}
                                  </button>

                                  {/* Subcategorias */}
                                  {getSubcategories(cat.id).map(subcat => (
                                    <button
                                      key={subcat.id}
                                      onClick={async (e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        if (product.category_id !== subcat.id) {
                                          try {
                                            await axios.put(
                                              `/api/admin/products/${product.id}`,
                                              { category_id: subcat.id },
                                              { headers }
                                            );
                                            setSuccess(`${product.name} movido para ${subcat.name}`);
                                            fetchCategoriesAndProducts();
                                          } catch (error) {
                                            setError(error.response?.data?.error || 'Erro ao mover produto');
                                          }
                                        }
                                      }}
                                      className={`
                                        w-full text-left px-3 py-1.5 pl-5 text-xs transition whitespace-nowrap
                                        ${product.category_id === subcat.id
                                          ? 'bg-primary bg-opacity-20 text-primary font-semibold'
                                          : 'hover:bg-gray-100'
                                        }
                                      `}
                                    >
                                      └─ {subcat.name}
                                    </button>
                                  ))}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Footer com Dicas */}
      <div className="bg-white border-t border-gray-200 px-6 py-3 text-xs text-gray-600">
        <p>💡 Dica: Arraste produtos entre cards ou use o menu "Mover para" para mudar de categoria</p>
      </div>
    </div>
  );
}
