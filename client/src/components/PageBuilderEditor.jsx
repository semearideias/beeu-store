import React, { useState } from 'react';
import { Save, X } from 'lucide-react';

export default function PageBuilderEditor({ item, type, onSave, onCancel }) {
  const [settings, setSettings] = useState(item.settings || {});

  const handleChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = () => {
    console.log('Salvando:', { type, settings });
    onSave({
      settings
    });
  };

  const renderFields = () => {
    const blockType = item.block_type || item.blockType;
    console.log('Renderizando editor:', { type, blockType, item });
    if (type === 'section') {
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cor de Fundo
            </label>
            <input
              type="color"
              value={settings.backgroundColor || '#ffffff'}
              onChange={(e) => handleChange('backgroundColor', e.target.value)}
              className="w-full h-10 rounded border border-gray-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Padding (px)
            </label>
            <input
              type="text"
              value={settings.padding || '40px 20px'}
              onChange={(e) => handleChange('padding', e.target.value)}
              placeholder="40px 20px"
              className="w-full px-3 py-2 border border-gray-300 rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Altura Mínima (px)
            </label>
            <input
              type="number"
              value={parseInt(settings.minHeight) || 400}
              onChange={(e) => handleChange('minHeight', `${e.target.value}px`)}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Layout
            </label>
            <select
              value={settings.layout || 'full'}
              onChange={(e) => handleChange('layout', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            >
              <option value="full">Largura Total</option>
              <option value="2-columns">2 Colunas</option>
              <option value="3-columns">3 Colunas</option>
            </select>
          </div>
        </div>
      );
    }

    // Editor de blocos

    if (blockType === 'slide') {
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Título
            </label>
            <input
              type="text"
              value={settings.title || ''}
              onChange={(e) => handleChange('title', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subtítulo
            </label>
            <textarea
              value={settings.subtitle || ''}
              onChange={(e) => handleChange('subtitle', e.target.value)}
              rows="2"
              className="w-full px-3 py-2 border border-gray-300 rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL da Imagem
            </label>
            <input
              type="url"
              value={settings.image || ''}
              onChange={(e) => handleChange('image', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Texto do Botão
            </label>
            <input
              type="text"
              value={settings.buttonText || ''}
              onChange={(e) => handleChange('buttonText', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL do Botão
            </label>
            <input
              type="url"
              value={settings.buttonUrl || ''}
              onChange={(e) => handleChange('buttonUrl', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            />
          </div>
        </div>
      );
    }

    if (blockType === 'productCarousel') {
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Título
            </label>
            <input
              type="text"
              value={settings.title || 'Produtos em Destaque'}
              onChange={(e) => handleChange('title', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoria (deixe vazio para todas)
            </label>
            <input
              type="text"
              value={settings.categoryId || ''}
              onChange={(e) => handleChange('categoryId', e.target.value)}
              placeholder="ID da categoria"
              className="w-full px-3 py-2 border border-gray-300 rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Limite de Produtos
            </label>
            <input
              type="number"
              value={settings.limit || 8}
              onChange={(e) => handleChange('limit', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Produtos Visíveis por Vez
            </label>
            <select
              value={settings.visibleColumns || 4}
              onChange={(e) => handleChange('visibleColumns', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            >
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
              <option value={4}>4</option>
              <option value={6}>6</option>
            </select>
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.showPrice !== false}
                onChange={(e) => handleChange('showPrice', e.target.checked)}
                className="rounded"
              />
              <span className="text-sm font-medium text-gray-700">Mostrar Preço</span>
            </label>
          </div>
        </div>
      );
    }

    if (blockType === 'productGrid') {
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Título
            </label>
            <input
              type="text"
              value={settings.title || 'Nossos Produtos'}
              onChange={(e) => handleChange('title', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoria (deixe vazio para todas)
            </label>
            <input
              type="text"
              value={settings.categoryId || ''}
              onChange={(e) => handleChange('categoryId', e.target.value)}
              placeholder="ID da categoria"
              className="w-full px-3 py-2 border border-gray-300 rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Limite de Produtos
            </label>
            <input
              type="number"
              value={settings.limit || 12}
              onChange={(e) => handleChange('limit', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Colunas
            </label>
            <select
              value={settings.columns || 4}
              onChange={(e) => handleChange('columns', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            >
              <option value={2}>2</option>
              <option value={3}>3</option>
              <option value={4}>4</option>
              <option value={6}>6</option>
            </select>
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.showPrice !== false}
                onChange={(e) => handleChange('showPrice', e.target.checked)}
                className="rounded"
              />
              <span className="text-sm font-medium text-gray-700">Mostrar Preço</span>
            </label>
          </div>
        </div>
      );
    }

    if (blockType === 'text') {
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Conteúdo
            </label>
            <textarea
              value={settings.content || ''}
              onChange={(e) => handleChange('content', e.target.value)}
              rows="4"
              className="w-full px-3 py-2 border border-gray-300 rounded"
            />
          </div>
        </div>
      );
    }

    if (blockType === 'image') {
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL da Imagem
            </label>
            <input
              type="url"
              value={settings.src || ''}
              onChange={(e) => handleChange('src', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Texto Alternativo
            </label>
            <input
              type="text"
              value={settings.alt || ''}
              onChange={(e) => handleChange('alt', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            />
          </div>
        </div>
      );
    }

    if (blockType === 'button') {
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Texto
            </label>
            <input
              type="text"
              value={settings.text || ''}
              onChange={(e) => handleChange('text', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL
            </label>
            <input
              type="url"
              value={settings.url || ''}
              onChange={(e) => handleChange('url', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estilo
            </label>
            <select
              value={settings.style || 'primary'}
              onChange={(e) => handleChange('style', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            >
              <option value="primary">Primário</option>
              <option value="secondary">Secundário</option>
              <option value="outline">Contorno</option>
            </select>
          </div>
        </div>
      );
    }

    if (blockType === 'feature' || blockType === 'testimonial' || blockType === 'cta' || blockType === 'custom') {
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Título
            </label>
            <input
              type="text"
              value={settings.title || ''}
              onChange={(e) => handleChange('title', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Conteúdo
            </label>
            <textarea
              value={settings.content || ''}
              onChange={(e) => handleChange('content', e.target.value)}
              rows="4"
              className="w-full px-3 py-2 border border-gray-300 rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL da Imagem (opcional)
            </label>
            <input
              type="url"
              value={settings.imageUrl || ''}
              onChange={(e) => handleChange('imageUrl', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            />
          </div>

          {(blockType === 'cta' || blockType === 'custom') && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Texto do Botão (opcional)
                </label>
                <input
                  type="text"
                  value={settings.buttonText || ''}
                  onChange={(e) => handleChange('buttonText', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL do Botão (opcional)
                </label>
                <input
                  type="url"
                  value={settings.buttonUrl || ''}
                  onChange={(e) => handleChange('buttonUrl', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>
            </>
          )}
        </div>
      );
    }

    if (blockType === 'productByBudget') {
      const budgets = settings.budgets || [
        { label: '0,25€', maxPrice: 0.25 },
        { label: '0,50€', maxPrice: 0.50 },
        { label: '1,00€', maxPrice: 1.00 },
        { label: '2,00€', maxPrice: 2.00 },
        { label: '5,00€', maxPrice: 5.00 }
      ];

      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Título
            </label>
            <input
              type="text"
              value={settings.title || 'Procure por Budget'}
              onChange={(e) => handleChange('title', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoria (deixe vazio para todas)
            </label>
            <input
              type="text"
              value={settings.categoryId || ''}
              onChange={(e) => handleChange('categoryId', e.target.value)}
              placeholder="ID da categoria"
              className="w-full px-3 py-2 border border-gray-300 rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Limite de Produtos por Budget
            </label>
            <input
              type="number"
              value={settings.limit || 8}
              onChange={(e) => handleChange('limit', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ranges de Budget
            </label>
            <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-300 rounded p-3 bg-gray-50">
              {budgets.map((budget, idx) => (
                <div key={idx} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="text-xs text-gray-600">Rótulo</label>
                    <input
                      type="text"
                      value={budget.label || ''}
                      onChange={(e) => {
                        const newBudgets = [...budgets];
                        newBudgets[idx].label = e.target.value;
                        handleChange('budgets', newBudgets);
                      }}
                      placeholder="ex: 0,25€"
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-gray-600">Preço Máximo (€)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={budget.maxPrice || ''}
                      onChange={(e) => {
                        const newBudgets = [...budgets];
                        newBudgets[idx].maxPrice = parseFloat(e.target.value);
                        handleChange('budgets', newBudgets);
                      }}
                      placeholder="ex: 0.25"
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <button
                    onClick={() => {
                      const newBudgets = budgets.filter((_, i) => i !== idx);
                      handleChange('budgets', newBudgets);
                    }}
                    className="px-2 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                  >
                    Remover
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => {
                const newBudgets = [...budgets, { label: '', maxPrice: 0 }];
                handleChange('budgets', newBudgets);
              }}
              className="mt-2 w-full py-2 px-3 border border-dashed border-gray-300 rounded hover:border-blue-500 hover:bg-blue-50 text-sm"
            >
              + Adicionar Budget
            </button>
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.showPrice !== false}
                onChange={(e) => handleChange('showPrice', e.target.checked)}
                className="rounded"
              />
              <span className="text-sm font-medium text-gray-700">Mostrar Preço</span>
            </label>
          </div>
        </div>
      );
    }

    return (
      <div className="p-4 bg-gray-100 rounded text-gray-600">
        Editor não disponível para este tipo de bloco
      </div>
    );
  };

  return (
    <div className="bg-gray-50 border-t border-gray-200 p-4 mt-4">
      <div className="space-y-4">
        {renderFields()}

        <div className="flex gap-2 justify-end pt-4 border-t">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
          >
            <X size={18} className="inline mr-2" />
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <Save size={18} className="inline mr-2" />
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
