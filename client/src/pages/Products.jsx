import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { products } from '../api';
import { Search, Filter } from 'lucide-react';

export default function Products() {
  const [productList, setProductList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const location = useLocation();

  // Ler parâmetros da URL ao carregar
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const categoryParam = params.get('category');
    const searchParam = params.get('search');
    
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
    if (searchParam) {
      setSearch(searchParam);
    }
  }, [location.search]);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    setCurrentPage(1); // Reset para página 1 ao filtrar
  }, [search, selectedCategory]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      console.log('Fetching products with:', { search, selectedCategory });
      const response = await products.getAll({
        search: search || undefined,
        category: selectedCategory || undefined
      });
      console.log('Products received:', response.data);
      setProductList(response.data);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await products.getCategories();
      setCategories(response.data);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  return (
    <div className="container py-12">
      <h1 className="text-4xl font-bold mb-8">Catálogo de Produtos</h1>

      {/* Filtros */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-bold mb-2">Pesquisar</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Nome, SKU ou descrição..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">Categoria</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary"
            >
              <option value="">Todas as categorias</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setSearch('');
                setSelectedCategory('');
              }}
              className="w-full btn-outline"
            >
              Limpar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Contagem e Paginação Info */}
      {!loading && productList.length > 0 && (
        <div className="mb-6 flex items-center justify-between">
          <p className="text-gray-600 font-semibold">
            Total de produtos: <span className="text-primary text-lg">{productList.length}</span>
          </p>
          <p className="text-sm text-gray-500">
            Mostrando {Math.min((currentPage - 1) * itemsPerPage + 1, productList.length)} a {Math.min(currentPage * itemsPerPage, productList.length)} de {productList.length}
          </p>
        </div>
      )}

      {/* Produtos */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Carregando produtos...</p>
        </div>
      ) : productList.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">Nenhum produto encontrado</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {productList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(product => (
              <Link
                key={product.id}
                to={`/products/${product.id}`}
                className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden"
              >
                <div className="bg-white h-56 flex items-center justify-center p-4 border-b">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="max-w-full max-h-full object-contain" />
                  ) : (
                    <div className="text-gray-400">Sem imagem</div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-2 line-clamp-2">{product.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">SKU: {product.sku}</p>
                  {product.colors && (
                    <p className="text-sm text-gray-600 mb-3">
                      Cores: {product.colors.split(',').length}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-primary font-bold">
                      {product.min_price ? `desde €${parseFloat(product.min_price).toFixed(2)}` : 'Contactar'}
                    </span>
                    <span className="text-xs bg-primary text-dark px-2 py-1 rounded">
                      Ver detalhes
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Paginação */}
          {Math.ceil(productList.length / itemsPerPage) > 1 && (
            <div className="mt-12 flex items-center justify-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                ← Anterior
              </button>

              <div className="flex gap-1">
                {Array.from({ length: Math.ceil(productList.length / itemsPerPage) }).map((_, idx) => (
                  <button
                    key={idx + 1}
                    onClick={() => setCurrentPage(idx + 1)}
                    className={`px-3 py-2 rounded transition ${
                      currentPage === idx + 1
                        ? 'bg-primary text-dark font-bold'
                        : 'border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(Math.ceil(productList.length / itemsPerPage), prev + 1))}
                disabled={currentPage === Math.ceil(productList.length / itemsPerPage)}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Próxima →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
