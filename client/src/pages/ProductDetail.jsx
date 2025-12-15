import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { products, cart } from '../api';
import { ShoppingCart, AlertCircle } from 'lucide-react';

// Mapa de cores em português para hex
const colorMap = {
  'azul': '#0066cc',
  'preto': '#000000',
  'branco': '#ffffff',
  'vermelho': '#cc0000',
  'verde': '#00aa00',
  'amarelo': '#ffcc00',
  'laranja': '#ff8800',
  'rosa': '#ff69b4',
  'roxo': '#9933cc',
  'cinzento': '#999999',
  'cinza': '#999999',
  'gray': '#999999',
  'marron': '#8b4513',
  'castanho': '#8b4513',
  'bege': '#f5f5dc',
  'turquesa': '#40e0d0',
  'ouro': '#ffd700',
  'prata': '#c0c0c0',
  'natural': '#d4a574',
  'orange': '#ff8800',
};

const getColorHex = (colorName) => {
  if (!colorName) return '#cccccc';
  const normalized = colorName.toLowerCase().trim();
  return colorMap[normalized] || '#cccccc';
};

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(100);
  const [quantityQuote, setQuantityQuote] = useState(100);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedColorImage, setSelectedColorImage] = useState('');
  const [currentPrice, setCurrentPrice] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchProduct();
  }, [id]);

  useEffect(() => {
    if (product && quantity) {
      fetchPrice();
    }
  }, [quantity, product]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await products.getById(id);
      setProduct(response.data);
      if (response.data.colors && response.data.colors.length > 0) {
        const firstColor = response.data.colors[0];
        setSelectedColor(firstColor.color_name);
        setSelectedColorImage(firstColor.image_url || response.data.image_url);
      }
    } catch (error) {
      setError('Erro ao carregar produto');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleColorChange = (colorName) => {
    setSelectedColor(colorName);
    // Encontrar a imagem correspondente à cor
    if (product && product.colors) {
      const color = product.colors.find(c => c.color_name === colorName);
      if (color && color.image_url) {
        setSelectedColorImage(color.image_url);
      } else {
        setSelectedColorImage(product.image_url);
      }
    }
  };

  const fetchPrice = async () => {
    try {
      const response = await products.getPrice(id, quantity);
      setCurrentPrice(response.data.price);
    } catch (error) {
      // Silencioso - preço pode não estar disponível
      setCurrentPrice(null);
    }
  };

  const handleAddToCart = async () => {
    try {
      setError('');
      setSuccess('');
      
      await cart.add({
        product_id: parseInt(id),
        quantity: parseInt(quantity),
        color: selectedColor || null
      });

      setSuccess('Produto adicionado ao carrinho!');
      setTimeout(() => {
        navigate('/cart');
      }, 1500);
    } catch (error) {
      setError('Erro ao adicionar ao carrinho');
      console.error(error);
    }
  };

  const handleAddToQuoteCart = () => {
    try {
      setError('');
      
      // Obter carrinho de orçamento do localStorage
      const saved = localStorage.getItem('quoteCart');
      const quoteCart = saved ? JSON.parse(saved) : [];
      
      // Adicionar novo item
      const newItem = {
        id: product.id,
        name: product.name,
        sku: product.sku,
        color: selectedColor || 'Sem cor',
        colorHex: getColorHex(selectedColor),
        quantity: quantityQuote,
        addedAt: new Date().toISOString()
      };
      
      quoteCart.push(newItem);
      localStorage.setItem('quoteCart', JSON.stringify(quoteCart));
      
      setSuccess('Produto adicionado ao carrinho de orçamento!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Erro ao adicionar ao carrinho de orçamento');
      console.error(error);
    }
  };

  if (loading) {
    return <div className="container py-12 text-center">Carregando...</div>;
  }

  if (!product) {
    return <div className="container py-12 text-center">Produto não encontrado</div>;
  }

  return (
    <div className="container py-12">
      <button
        onClick={() => navigate('/products')}
        className="text-primary hover:underline mb-6"
      >
        ← Voltar ao catálogo
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Imagem */}
        <div className="bg-white rounded-lg p-8 flex items-center justify-center border" style={{ minHeight: '600px' }}>
          {selectedColorImage || product.image_url ? (
            <img 
              src={selectedColorImage || product.image_url} 
              alt={product.name} 
              className="max-w-full max-h-full object-contain" 
              style={{ maxHeight: '550px' }}
            />
          ) : (
            <div className="text-gray-400">Sem imagem</div>
          )}
        </div>

        {/* Detalhes */}
        <div>
          <div className="bg-white rounded-lg p-8 shadow-sm border">
            <h1 className="text-4xl font-bold mb-2">{product.name}</h1>
            <p className="text-gray-600 mb-2">SKU: {product.sku}</p>
            {product.category_name && (
              <p className="text-gray-600 mb-6 pb-6 border-b">Categoria: {product.category_name}</p>
            )}

            <p className="text-gray-700 mb-8">{product.description}</p>

            {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 flex items-center gap-2">
              <AlertCircle size={20} />
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
              {success}
            </div>
          )}
          {/* Cores */}
          {product.colors && product.colors.length > 0 && (
            <div className="mb-8">
              <label className="block text-sm font-bold mb-4">Cores Disponíveis</label>
              <div className="flex flex-wrap gap-6">
                {product.colors.map(color => {
                  const colorHex = getColorHex(color.color_name);
                  const isSelected = selectedColor === color.color_name;
                  return (
                    <button
                      key={color.id}
                      onClick={() => handleColorChange(color.color_name)}
                      className="flex flex-col items-center gap-2 transition hover:opacity-80"
                    >
                      <div
                        className={`w-10 h-10 rounded-full border-3 transition ${
                          isSelected ? 'border-primary shadow-lg' : 'border-gray-300'
                        }`}
                        style={{
                          backgroundColor: colorHex,
                          boxShadow: isSelected ? `0 0 0 2px ${colorHex}40` : 'none'
                        }}
                      />
                      <span className={`text-xs font-medium text-center max-w-12 ${
                        isSelected ? 'text-primary font-bold' : 'text-gray-600'
                      }`}>
                        {color.color_name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tabela de Preços */}
          {product.prices && product.prices.length > 0 && (
            <div className="bg-light p-4 rounded mb-8">
              <h3 className="font-bold mb-3">Tabela de Preços</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-400">
                    {product.prices.map((price, idx) => {
                      let quantityLabel = '';
                      if (price.quantity_min === 1 && price.quantity_max === 499) {
                        quantityLabel = '-500';
                      } else if (price.quantity_min === 500 && price.quantity_max === 1999) {
                        quantityLabel = '+500';
                      } else if (price.quantity_min === 2000 && price.quantity_max === 4999) {
                        quantityLabel = '2000';
                      } else if (price.quantity_min === 5000 && !price.quantity_max) {
                        quantityLabel = '5000+';
                      } else {
                        quantityLabel = `${price.quantity_min}${price.quantity_max ? `-${price.quantity_max}` : '+'}`;
                      }
                      return (
                        <th key={idx} className="text-center py-2 px-2 font-bold">{quantityLabel}</th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {product.prices.map((price, idx) => (
                      <td key={idx} className="text-center py-3 px-2 font-bold text-lg border-t border-gray-300">
                        €{parseFloat(price.price).toFixed(3).replace(/0+$/, '').replace(/\.$/, '')}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
          </div>

          {/* Botões de Compra - Dentro de Caixa Branca */}
          <div className="bg-white rounded-lg shadow p-6 mt-6">
            <div className="flex items-center gap-2 max-w-2xl mx-auto">
              {/* Compra Sem Personalização */}
              <div className="flex-1 btn-primary rounded-lg hover:shadow-lg transition p-4 flex flex-col gap-3">
                <div className="flex flex-col items-center gap-1">
                  <ShoppingCart size={24} />
                  <span className="font-bold">Comprar</span>
                  <span className="text-xs opacity-80">Sem Personalização</span>
                </div>
                <div className="flex items-center justify-center gap-2 border-t pt-2">
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    min="1"
                    className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-sm"
                  />
                  <span className="text-xs">un.</span>
                </div>
                {currentPrice && (
                  <div className="text-center border-t pt-2">
                    <p className="text-xs opacity-80">Total:</p>
                    <p className="font-bold">€{(currentPrice * quantity).toFixed(3).replace(/0+$/, '').replace(/\.$/, '')}</p>
                  </div>
                )}
                <button
                  onClick={handleAddToCart}
                  className="bg-dark text-white py-2 rounded text-sm font-bold hover:opacity-90 transition"
                >
                  Adicionar
                </button>
              </div>

              {/* Separador "OU" */}
              <div className="flex items-center justify-center px-2">
                <span className="text-gray-400 font-bold text-sm">OU</span>
              </div>

              {/* Orçamento com Personalização */}
              <div className="flex-1 bg-secondary text-dark rounded-lg hover:shadow-lg transition p-4 flex flex-col gap-3 border-2 border-secondary">
                <div className="flex flex-col items-center gap-1">
                  <AlertCircle size={24} />
                  <span className="font-bold">Orçamento</span>
                  <span className="text-xs opacity-80">Com Personalização</span>
                </div>
                <div className="flex items-center justify-center gap-2 border-t pt-2">
                  <input
                    type="number"
                    value={quantityQuote}
                    onChange={(e) => setQuantityQuote(parseInt(e.target.value) || 1)}
                    min="1"
                    className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-sm"
                  />
                  <span className="text-xs">un.</span>
                </div>
                <div className="text-center border-t pt-2">
                  <p className="text-xs opacity-80">Solicite um</p>
                  <p className="font-bold text-sm">Orçamento Personalizado</p>
                </div>
                <button
                  onClick={handleAddToQuoteCart}
                  className="bg-dark text-white py-2 rounded text-sm font-bold hover:opacity-90 transition"
                >
                  Adicionar
                </button>
              </div>
            </div>
          </div>

          {/* Informações Adicionais */}
          <div className="mt-12 pt-8 border-t">
            <h3 className="font-bold mb-4">Opções de Compra</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="font-bold text-primary mb-2">Comprar</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>✓ Sem personalização</li>
                  <li>✓ Stock disponível</li>
                  <li>✓ Entrega rápida</li>
                  <li>✓ Preço imediato</li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-secondary mb-2">Orçamento</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>✓ Com personalização</li>
                  <li>✓ Revisão de design</li>
                  <li>✓ Prazos customizados</li>
                  <li>✓ Orçamento detalhado</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
