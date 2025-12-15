import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../api';

function ProductByBudgetBlockPreview({ block, settings, products, getProductsByCategory, getAllProducts }) {
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

  const visibleOnDesktop = 6;
  const visibleProducts = budgetProducts.slice(carouselIndex, carouselIndex + visibleOnDesktop);

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
              setCarouselIndex(0);
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
            <div key={product.id} className="bg-white rounded-lg shadow hover:shadow-lg transition">
              <div className="w-full h-48 bg-gray-200 rounded-t-lg overflow-hidden">
                {product.image_url && (
                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                )}
              </div>
              <div className="p-4">
                <h4 className="font-semibold text-gray-900">{product.name}</h4>
                {settings.showPrice !== false && (
                  <p className="text-blue-600 font-bold mt-2">
                    {product.min_price !== null && product.min_price !== undefined && product.min_price > 0
                      ? `desde €${product.min_price.toFixed(2)}`
                      : product.unit_price && product.unit_price > 0
                      ? `desde €${product.unit_price.toFixed(2)}`
                      : 'Sob Consulta'}
                  </p>
                )}
              </div>
            </div>
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

export default function PageBuilderPreview({ sections }) {
  const [products, setProducts] = useState({});
  const [categories, setCategories] = useState({});
  const [carouselIndex, setCarouselIndex] = useState({});

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, [sections]);

  const loadProducts = async () => {
    try {
      const response = await api.get('/products');
      const productMap = {};
      response.data.forEach(product => {
        productMap[product.id] = product;
      });
      setProducts(productMap);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await api.get('/admin/categories');
      const categoryMap = {};
      response.data.forEach(cat => {
        categoryMap[cat.id] = cat;
      });
      setCategories(categoryMap);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
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
              <button className="px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold">
                {settings.buttonText || 'Saiba Mais'}
              </button>
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
                  <div key={product.id} className="bg-white rounded-lg shadow hover:shadow-lg transition">
                    <div className="w-full h-48 bg-gray-200 rounded-t-lg overflow-hidden">
                      {product.image_url && (
                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="p-4">
                      <h4 className="font-semibold text-gray-900">{product.name}</h4>
                      {settings.showPrice !== false && (
                        <p className="text-blue-600 font-bold mt-2">
                          {product.min_price !== null && product.min_price !== undefined && product.min_price > 0
                            ? `desde €${product.min_price.toFixed(2)}`
                            : product.unit_price && product.unit_price > 0
                            ? `desde €${product.unit_price.toFixed(2)}`
                            : 'Sob Consulta'}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {carouselProducts.length > visibleCols && (
                <>
                  <button
                    onClick={() => setCarouselIndex(prev => ({
                      ...prev,
                      [block.id]: Math.max(0, (prev[block.id] || 0) - 1)
                    }))}
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 p-2 bg-gray-200 hover:bg-gray-300 rounded-full"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button
                    onClick={() => setCarouselIndex(prev => ({
                      ...prev,
                      [block.id]: Math.min(carouselProducts.length - visibleCols, (prev[block.id] || 0) + 1)
                    }))}
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 p-2 bg-gray-200 hover:bg-gray-300 rounded-full"
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
            <div className={`grid grid-cols-${columns} gap-4`} style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
              {gridProducts.map(product => (
                <div key={product.id} className="bg-white rounded-lg shadow hover:shadow-lg transition">
                  <div className="w-full h-48 bg-gray-200 rounded-t-lg overflow-hidden">
                    {product.image_url && (
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="p-4">
                    <h4 className="font-semibold text-gray-900">{product.name}</h4>
                    {settings.showPrice !== false && (
                      <p className="text-blue-600 font-bold mt-2">
                        {product.min_price !== null && product.min_price !== undefined && product.min_price > 0
                          ? `desde €${product.min_price.toFixed(2)}`
                          : product.unit_price && product.unit_price > 0
                          ? `desde €${product.unit_price.toFixed(2)}`
                          : 'Sob Consulta'}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'text':
        return (
          <div key={block.id} className="prose max-w-none text-gray-700">
            <p>{settings.content || 'Adicione seu conteúdo aqui...'}</p>
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
          <ProductByBudgetBlockPreview 
            key={block.id} 
            block={block} 
            settings={settings} 
            products={products}
            getProductsByCategory={getProductsByCategory}
            getAllProducts={getAllProducts}
          />
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

  return (
    <div className="w-full bg-white">
      <div className="max-w-6xl mx-auto p-4 mb-4 bg-yellow-50 border border-yellow-200 rounded">
        <p className="text-sm text-yellow-800">
          <strong>Visualização:</strong> Esta é a visualização da sua página. Volte para editar.
        </p>
      </div>
      {sections.map(section => renderSection(section))}
    </div>
  );
}
