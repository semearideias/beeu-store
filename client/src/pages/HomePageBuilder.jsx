import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../api';

function ProductByBudgetBlock({ block, settings, products, getProductsByCategory, getAllProducts }) {
  const [selectedBudgetIdx, setSelectedBudgetIdx] = useState(0);
  const [carouselIndex, setCarouselIndex] = useState(0);
  
  const budgets = settings.budgets || [
    { label: '0,25€', maxPrice: 0.25 },
    { label: '0,50€', maxPrice: 0.50 },
    { label: '1,00€', maxPrice: 1.00 },
    { label: '2,00€', maxPrice: 2.00 },
    { label: '5,00€', maxPrice: 5.00 }
  ];
  
  const selectedBudget = budgets[selectedBudgetIdx];
  
  // Calcular o range de preço (min e max do budget atual)
  const minPrice = selectedBudgetIdx > 0 ? budgets[selectedBudgetIdx - 1].maxPrice + 0.01 : 0;
  const maxPrice = selectedBudget.maxPrice;
  
  // Filtrar produtos de TODO o catálogo dentro do range e embaralhá-los
  const budgetProducts = selectedBudget 
    ? getAllProducts(settings.limit || 100)
        .filter(p => {
          const price = p.min_price !== null && p.min_price !== undefined ? p.min_price : (p.unit_price || 0);
          // Apenas mostrar produtos que têm preço configurado
          return price > 0 && price >= minPrice && price <= maxPrice;
        })
        .sort(() => Math.random() - 0.5) // Embaralhar aleatoriamente
    : [];

  // Configurar número de colunas por viewport
  const visibleOnDesktop = 6;
  const visibleOnMobile = 2;
  
  // Determinar número visível (simplificado - assumir desktop)
  const visibleCount = visibleOnDesktop;
  const visibleProducts = budgetProducts.slice(carouselIndex, carouselIndex + visibleCount);

  return (
    <div className="w-full">
      <h3 className="text-2xl font-bold mb-6">{settings.title || 'Procure por Budget'}</h3>
      
      {/* Budget Buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        {budgets.map((budget, idx) => (
          <button
            key={idx}
            onClick={() => {
              setSelectedBudgetIdx(idx);
              setCarouselIndex(0); // Reset carrossel ao mudar budget
            }}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              selectedBudgetIdx === idx
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            {budget.label}
          </button>
        ))}
      </div>

      {/* Products Carousel */}
      <div className="relative">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${visibleOnDesktop}, minmax(0, 1fr))` }}>
          {visibleProducts.map(product => (
            <a
              key={product.id}
              href={`/products/${product.id}`}
              className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden group"
            >
              <div className="w-full h-48 bg-gray-200 overflow-hidden">
                {product.image_url && (
                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition" />
                )}
              </div>
              <div className="p-4">
                <h4 className="font-semibold text-gray-900 line-clamp-2">{product.name}</h4>
                {settings.showPrice !== false && (
                  <p className="text-blue-600 font-bold mt-2 text-sm">
                    {product.min_price !== null && product.min_price !== undefined && product.min_price > 0
                      ? `desde €${product.min_price.toFixed(2)}`
                      : product.unit_price && product.unit_price > 0
                      ? `desde €${product.unit_price.toFixed(2)}`
                      : 'Sob Consulta'}
                  </p>
                )}
              </div>
            </a>
          ))}
        </div>

        {/* Setas de Navegação */}
        {budgetProducts.length > visibleOnDesktop && (
          <>
            <button
              onClick={() => setCarouselIndex(Math.max(0, carouselIndex - 1))}
              disabled={carouselIndex === 0}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 p-2 bg-gray-200 hover:bg-gray-300 rounded-full transition disabled:opacity-50 disabled:cursor-not-allowed z-10"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={() => setCarouselIndex(Math.min(budgetProducts.length - visibleOnDesktop, carouselIndex + 1))}
              disabled={carouselIndex >= budgetProducts.length - visibleOnDesktop}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 p-2 bg-gray-200 hover:bg-gray-300 rounded-full transition disabled:opacity-50 disabled:cursor-not-allowed z-10"
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}
      </div>

      {budgetProducts.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          Nenhum produto encontrado neste budget
        </div>
      )}
    </div>
  );
}

export default function HomePageBuilder() {
  const [sections, setSections] = useState([]);
  const [products, setProducts] = useState({});
  const [categories, setCategories] = useState({});
  const [carouselIndex, setCarouselIndex] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPageContent();
  }, []);

  const loadPageContent = async () => {
    try {
      setLoading(true);
      
      // Carregar seções do page builder
      const sectionsResponse = await api.get('/admin/page-builder/sections/homepage');
      setSections(sectionsResponse.data);

      // Carregar produtos
      const productsResponse = await api.get('/products');
      const productMap = {};
      productsResponse.data.forEach(product => {
        productMap[product.id] = product;
      });
      setProducts(productMap);

      // Carregar categorias
      const categoriesResponse = await api.get('/admin/categories');
      const categoryMap = {};
      categoriesResponse.data.forEach(cat => {
        categoryMap[cat.id] = cat;
      });
      setCategories(categoryMap);
    } catch (error) {
      console.error('Erro ao carregar página:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProductsByCategory = (categoryId, limit) => {
    const allProducts = Object.values(products);
    let filtered = allProducts;

    if (categoryId) {
      filtered = allProducts.filter(p => p.category_id === parseInt(categoryId));
    }

    return filtered.slice(0, limit || 8);
  };

  const getAllProducts = (limit) => {
    const allProducts = Object.values(products);
    return allProducts.slice(0, limit || 100);
  };

  const renderBlock = (block, sectionSettings) => {
    if (!block.is_active) return null;

    const { block_type, settings } = block;

    switch (block_type) {
      case 'slide':
        return (
          <div
            key={block.id}
            className="relative w-full h-96 bg-cover bg-center rounded-lg overflow-hidden"
            style={{
              backgroundImage: settings.image ? `url(${settings.image})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }}
          >
            <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col justify-center items-center text-white text-center">
              <h2 className="text-4xl font-bold mb-4">{settings.title}</h2>
              <p className="text-xl mb-6 max-w-2xl">{settings.subtitle}</p>
              <a
                href={settings.buttonUrl || '#'}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition"
              >
                {settings.buttonText || 'Saiba Mais'}
              </a>
            </div>
          </div>
        );

      case 'productCarousel':
        const carouselProducts = getProductsByCategory(settings.categoryId, settings.limit);
        const currentIndex = carouselIndex[block.id] || 0;
        const visibleCols = settings.visibleColumns || 4;
        const visibleProducts = carouselProducts.slice(currentIndex, currentIndex + visibleCols);

        return (
          <div key={block.id} className="w-full">
            <h3 className="text-2xl font-bold mb-6">{settings.title}</h3>
            <div className="relative">
              <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${visibleCols}, minmax(0, 1fr))` }}>
                {visibleProducts.map(product => (
                  <a
                    key={product.id}
                    href={`/products/${product.id}`}
                    className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden group"
                  >
                    <div className="w-full h-48 bg-gray-200 overflow-hidden">
                      {product.image_url && (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition"
                        />
                      )}
                    </div>
                    <div className="p-4">
                      <h4 className="font-semibold text-gray-900 line-clamp-2">{product.name}</h4>
                      {settings.showPrice !== false && (
                        <p className="text-blue-600 font-bold mt-2 text-sm">
                          {product.min_price !== null && product.min_price !== undefined && product.min_price > 0
                            ? `desde €${product.min_price.toFixed(2)}`
                            : product.unit_price && product.unit_price > 0
                            ? `desde €${product.unit_price.toFixed(2)}`
                            : 'Sob Consulta'}
                        </p>
                      )}
                    </div>
                  </a>
                ))}
              </div>

              {carouselProducts.length > visibleCols && (
                <>
                  <button
                    onClick={() => setCarouselIndex(prev => ({
                      ...prev,
                      [block.id]: Math.max(0, (prev[block.id] || 0) - 1)
                    }))}
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 p-2 bg-gray-200 hover:bg-gray-300 rounded-full transition z-10"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button
                    onClick={() => setCarouselIndex(prev => ({
                      ...prev,
                      [block.id]: Math.min(carouselProducts.length - visibleCols, (prev[block.id] || 0) + 1)
                    }))}
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 p-2 bg-gray-200 hover:bg-gray-300 rounded-full transition z-10"
                  >
                    <ChevronRight size={24} />
                  </button>
                </>
              )}
            </div>
          </div>
        );

      case 'productGrid':
        const gridProducts = getProductsByCategory(settings.categoryId, settings.limit);
        const columns = settings.columns || 4;

        return (
          <div key={block.id} className="w-full">
            <h3 className="text-2xl font-bold mb-6">{settings.title}</h3>
            <div
              className="gap-4"
              style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
            >
              {gridProducts.map(product => (
                <a
                  key={product.id}
                  href={`/products/${product.id}`}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden group"
                >
                  <div className="w-full h-48 bg-gray-200 overflow-hidden">
                    {product.image_url && (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition"
                      />
                    )}
                  </div>
                  <div className="p-4">
                    <h4 className="font-semibold text-gray-900 line-clamp-2">{product.name}</h4>
                    {settings.showPrice !== false && (
                      <p className="text-blue-600 font-bold mt-2 text-sm">
                        {product.min_price !== null && product.min_price !== undefined && product.min_price > 0
                          ? `desde €${product.min_price.toFixed(2)}`
                          : product.unit_price && product.unit_price > 0
                          ? `desde €${product.unit_price.toFixed(2)}`
                          : 'Sob Consulta'}
                      </p>
                    )}
                  </div>
                </a>
              ))}
            </div>
          </div>
        );

      case 'text':
        return (
          <div key={block.id} className="prose max-w-none text-gray-700">
            {settings.content}
          </div>
        );

      case 'image':
        return (
          <div key={block.id} className="w-full">
            <img
              src={settings.src}
              alt={settings.alt || 'Imagem'}
              className="w-full rounded-lg"
            />
          </div>
        );

      case 'button':
        const buttonStyles = {
          primary: 'bg-blue-600 hover:bg-blue-700 text-white',
          secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
          outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50'
        };

        return (
          <div key={block.id} className="flex justify-center">
            <a
              href={settings.url || '#'}
              className={`px-6 py-3 rounded-lg font-semibold transition ${buttonStyles[settings.style] || buttonStyles.primary}`}
            >
              {settings.text || 'Clique aqui'}
            </a>
          </div>
        );

      case 'productByBudget':
        return (
          <ProductByBudgetBlock 
            key={block.id} 
            block={block} 
            settings={settings} 
            products={products}
            getProductsByCategory={getProductsByCategory}
            getAllProducts={getAllProducts}
          />
        );

      case 'feature':
      case 'testimonial':
      case 'cta':
      case 'custom':
        return (
          <div key={block.id} className="w-full">
            {settings.imageUrl && (
              <div className="mb-4 rounded-lg overflow-hidden">
                <img src={settings.imageUrl} alt={settings.title} className="w-full h-auto" />
              </div>
            )}
            {settings.title && <h3 className="text-2xl font-bold mb-4">{settings.title}</h3>}
            {settings.content && <p className="text-gray-700 mb-4">{settings.content}</p>}
            {settings.buttonText && settings.buttonUrl && (
              <a
                href={settings.buttonUrl}
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                {settings.buttonText}
              </a>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const renderSection = (section) => {
    if (!section.is_active) return null;

    const { settings, blocks } = section;
    const sectionStyle = {
      backgroundColor: settings.backgroundColor || '#ffffff',
      padding: settings.padding || '40px 20px',
      minHeight: settings.minHeight || 'auto'
    };

    const layout = settings.layout || 'full';
    let gridStyle = {};
    
    if (layout === '2-columns') {
      gridStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' };
    } else if (layout === '3-columns') {
      gridStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2rem' };
    }

    return (
      <section key={section.id} style={sectionStyle}>
        <div className="max-w-6xl mx-auto" style={gridStyle}>
          {blocks && blocks.map(block => renderBlock(block, settings))}
        </div>
      </section>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando página...</p>
        </div>
      </div>
    );
  }

  if (sections.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Bem-vindo à BEEU</h1>
          <p className="text-gray-600 mb-8">A página inicial está sendo preparada...</p>
          <a href="/products" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Ver Produtos
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white">
      {sections.map(section => renderSection(section))}
    </div>
  );
}
