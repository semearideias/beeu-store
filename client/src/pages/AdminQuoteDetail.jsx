import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, Download, Plus, Trash2, ArrowLeft, FileText, Paperclip, Mail } from 'lucide-react';
import api from '../api';
import { useQuoteSync } from '../hooks/useQuoteSync';
import html2pdf from 'html2pdf.js';

export default function AdminQuoteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quote, setQuote] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [company, setCompany] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState([]);
  const [shippingMethods, setShippingMethods] = useState([]);
  const [selectedShipping, setSelectedShipping] = useState(null);
  const [newItem, setNewItem] = useState({
    product_id: '',
    quantity: 1,
    unit_price: 0.00,
    customization_description: ''
  });
  const [productPrices, setProductPrices] = useState({});
  const [sendingEmail, setSendingEmail] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);

  // Sincronização em tempo real - DESATIVADA temporariamente
  // useQuoteSync(id, (updatedQuote) => {
  //   setQuote(updatedQuote);
  // });

  useEffect(() => {
    fetchQuoteDetail();
    fetchProducts();
    fetchShippingMethods();
    fetchCompanySettings();
  }, [id]);

  // NÃO carregar preços de todos os produtos - apenas quando selecionado

  // Filtrar produtos quando o usuário digita
  useEffect(() => {
    if (productSearch.trim() === '') {
      setFilteredProducts([]);
    } else {
      const search = productSearch.toLowerCase();
      const filtered = products.filter(p => 
        (p.name && p.name.toLowerCase().includes(search)) ||
        (p.reference && p.reference.toLowerCase().includes(search)) ||
        (p.sku && p.sku.toLowerCase().includes(search))
      ).slice(0, 10); // Limitar a 10 resultados
      setFilteredProducts(filtered);
    }
  }, [productSearch, products]);

  const fetchQuoteDetail = async () => {
    try {
      const response = await api.get(`/admin/quotes/${id}`);
      setQuote(response.data);
      if (response.data.customer_id) {
        fetchCustomer(response.data.customer_id);
      }
    } catch (error) {
      console.error('Erro ao carregar orçamento:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomer = async (customerId) => {
    try {
      const response = await api.get(`/customers/${customerId}`);
      setCustomer(response.data);
    } catch (error) {
      console.error('Erro ao carregar cliente:', error);
    }
  };

  const fetchCompanySettings = async () => {
    try {
      const response = await api.get('/admin/settings');
      const companyData = {};
      Object.keys(response.data).forEach(key => {
        if (key.startsWith('company_')) {
          companyData[key] = response.data[key].value;
        }
      });
      setCompany(companyData);
    } catch (error) {
      console.error('Erro ao carregar dados da empresa:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products');
      // NÃO carregar preços aqui - apenas quando o produto é selecionado
      setProducts(response.data.map(p => ({
        ...p,
        unit_price: 0,
        has_prices: false
      })));
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    }
  };

  const fetchShippingMethods = async () => {
    try {
      const response = await api.get('/admin/shipping');
      setShippingMethods(response.data);
    } catch (error) {
      console.error('Erro ao carregar métodos de envio:', error);
    }
  };

  const fetchProductPrices = async (productId) => {
    try {
      const response = await api.get(`/admin/product-prices/${productId}`);
      setProductPrices(prev => ({
        ...prev,
        [productId]: response.data
      }));
    } catch (error) {
      console.error('Erro ao carregar preços:', error);
    }
  };

  const getPriceForQuantity = (productId, quantity) => {
    const prices = productPrices[productId] || [];
    if (prices.length === 0) return null;

    const applicablePrice = prices.find(p => {
      const minOk = quantity >= p.quantity_min;
      const maxOk = !p.quantity_max || quantity <= p.quantity_max;
      return minOk && maxOk;
    });

    return applicablePrice ? parseFloat(applicablePrice.price) : null;
  };

  const handleAddItem = async () => {
    if (!newItem.product_id) {
      alert('Selecione um produto');
      return;
    }

    try {
      // Adicionar item ao orçamento
      const product = products.find(p => p.id === parseInt(newItem.product_id));
      
      // Buscar preço por quantidade se não foi especificado
      let unitPrice = newItem.unit_price;
      if (!unitPrice || unitPrice === 0) {
        // Buscar preços se ainda não foram carregados
        const prices = productPrices[newItem.product_id];
        if (!prices) {
          await fetchProductPrices(newItem.product_id);
        }
        
        const priceForQty = getPriceForQuantity(newItem.product_id, newItem.quantity);
        console.log('Preço encontrado:', priceForQty, 'Quantidade:', newItem.quantity);
        unitPrice = priceForQty || product?.unit_price || 0;
      }

      const item = {
        product_id: newItem.product_id,
        product_name: product.name,
        quantity: newItem.quantity,
        unit_price: unitPrice,
        base_price: product.unit_price, // Preço sem personalização
        total_price: unitPrice * newItem.quantity,
        customization_description: newItem.customization_description
      };

      // Atualizar estado local
      const updatedItems = [...(quote.items || []), item];
      const subtotal = updatedItems.reduce((sum, item) => sum + item.total_price, 0);
      const tax = subtotal * 0.23;

      setQuote({
        ...quote,
        items: updatedItems,
        subtotal,
        tax,
        total: subtotal + (quote.shipping_cost || 0) + tax
      });

      setNewItem({
        product_id: '',
        quantity: 1,
        unit_price: 0,
        customization_description: ''
      });
    } catch (error) {
      console.error('Erro ao adicionar item:', error);
      alert('Erro ao adicionar item');
    }
  };

  const handleSendEmailNotification = async () => {
    try {
      setSendingEmail(true);
      await api.post(`/admin/quotes/${id}/send-email`, {
        customer_id: quote.customer_id,
        quote_id: id
      });
      alert('Email enviado com sucesso!');
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      alert('Erro ao enviar email');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleRemoveItem = (index) => {
    const updatedItems = quote.items.filter((_, i) => i !== index);
    const subtotal = updatedItems.reduce((sum, item) => sum + item.total_price, 0);
    const tax = subtotal * 0.23;

    setQuote({
      ...quote,
      items: updatedItems,
      subtotal,
      tax,
      total: subtotal + tax
    });
  };

  const handleUpdateItem = (index, field, value) => {
    const updatedItems = [...quote.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: field === 'quantity' || field === 'unit_price' ? parseFloat(value) : value
    };

    // Recalcular total do item
    if (field === 'quantity' || field === 'unit_price') {
      updatedItems[index].total_price = updatedItems[index].quantity * updatedItems[index].unit_price;
    }

    const subtotal = updatedItems.reduce((sum, item) => sum + item.total_price, 0);
    const tax = subtotal * 0.23;

    setQuote({
      ...quote,
      items: updatedItems,
      subtotal,
      tax,
      total: subtotal + tax
    });
  };

  const handleAddShipping = (shippingCost) => {
    setQuote({
      ...quote,
      shipping_cost: shippingCost,
      total: quote.subtotal + quote.tax + shippingCost
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.put(`/admin/quotes/${id}`, {
        status: quote.status,
        subtotal: quote.subtotal,
        tax: quote.tax,
        total: quote.total,
        shipping_cost: quote.shipping_cost,
        notes: quote.notes,
        items: quote.items
      });
      alert('Orçamento atualizado com sucesso');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar orçamento: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleGeneratePDF = () => {
    try {
      // Criar elemento HTML para o PDF
      const element = document.createElement('div');
      element.style.padding = '20px';
      element.style.fontFamily = 'Arial, sans-serif';
      element.style.fontSize = '12px';
      element.style.lineHeight = '1.6';
      element.style.color = '#333';

      // Criar HTML do PDF
      element.innerHTML = `
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px;">
          <h1 style="margin: 0; font-size: 28px; color: #333;">ORÇAMENTO</h1>
          <p style="margin: 10px 0; font-size: 16px; font-weight: bold;">#${quote.quote_number}</p>
          <p style="margin: 5px 0; color: #666;">Data: ${new Date().toLocaleDateString('pt-PT')}</p>
        </div>

        <div style="margin-bottom: 30px;">
          <h3 style="margin: 0 0 15px 0; font-size: 14px; font-weight: bold; border-bottom: 1px solid #ddd; padding-bottom: 5px;">DADOS DO CLIENTE</h3>
          <table style="width: 100%; font-size: 11px;">
            <tr>
              <td style="padding: 5px 0;"><strong>Empresa:</strong></td>
              <td style="padding: 5px 0;">${quote.company_name}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0;"><strong>Contacto:</strong></td>
              <td style="padding: 5px 0;">${quote.contact_name || '-'}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0;"><strong>Email:</strong></td>
              <td style="padding: 5px 0;">${quote.email}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0;"><strong>Telefone:</strong></td>
              <td style="padding: 5px 0;">${quote.phone || '-'}</td>
            </tr>
          </table>
        </div>

        <div style="margin-bottom: 30px;">
          <h3 style="margin: 0 0 15px 0; font-size: 14px; font-weight: bold; border-bottom: 1px solid #ddd; padding-bottom: 5px;">ITENS DO ORÇAMENTO</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
            <thead>
              <tr style="background-color: #f5f5f5; border-bottom: 2px solid #333;">
                <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Produto</th>
                <th style="text-align: center; padding: 8px; border: 1px solid #ddd;">Qtd</th>
                <th style="text-align: right; padding: 8px; border: 1px solid #ddd;">Preço Unit.</th>
                <th style="text-align: right; padding: 8px; border: 1px solid #ddd;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${quote.items?.map((item, idx) => `
                <tr style="border-bottom: 1px solid #ddd;">
                  <td style="padding: 8px; border: 1px solid #ddd;">
                    <strong>${item.product_name}</strong>
                    ${item.customization_description ? `<br/><small style="color: #666;">📝 ${item.customization_description}</small>` : ''}
                  </td>
                  <td style="text-align: center; padding: 8px; border: 1px solid #ddd;">${item.quantity}</td>
                  <td style="text-align: right; padding: 8px; border: 1px solid #ddd;">€${parseFloat(item.unit_price).toFixed(2)}</td>
                  <td style="text-align: right; padding: 8px; border: 1px solid #ddd;">€${parseFloat(item.total_price).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div style="margin-bottom: 30px; border-top: 2px solid #333; padding-top: 20px;">
          <h3 style="margin: 0 0 15px 0; font-size: 14px; font-weight: bold;">RESUMO FINANCEIRO</h3>
          <table style="width: 100%; font-size: 12px; margin-left: auto; margin-right: 0; width: 300px;">
            <tr>
              <td style="padding: 8px 0; text-align: left;">Subtotal:</td>
              <td style="padding: 8px 0; text-align: right; font-weight: bold;">€${parseFloat(quote.subtotal).toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; text-align: left;">IVA (23%):</td>
              <td style="padding: 8px 0; text-align: right; font-weight: bold;">€${parseFloat(quote.tax).toFixed(2)}</td>
            </tr>
            ${quote.shipping_cost && parseFloat(quote.shipping_cost) > 0 ? `
            <tr>
              <td style="padding: 8px 0; text-align: left;">Envio:</td>
              <td style="padding: 8px 0; text-align: right; font-weight: bold;">€${parseFloat(quote.shipping_cost).toFixed(2)}</td>
            </tr>
            ` : ''}
            <tr style="border-top: 2px solid #333; border-bottom: 2px solid #333;">
              <td style="padding: 12px 0; text-align: left; font-size: 14px; font-weight: bold;">TOTAL:</td>
              <td style="padding: 12px 0; text-align: right; font-size: 14px; font-weight: bold;">€${parseFloat(quote.total).toFixed(2)}</td>
            </tr>
          </table>
        </div>

        ${quote.notes ? `
        <div style="border-top: 1px solid #ddd; padding-top: 15px;">
          <h3 style="margin: 0 0 10px 0; font-size: 12px; font-weight: bold;">NOTAS</h3>
          <p style="margin: 0; white-space: pre-wrap; font-size: 11px;">${quote.notes}</p>
        </div>
        ` : ''}

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; font-size: 10px; color: #999;">
          <p style="margin: 0;">Gerado em ${new Date().toLocaleDateString('pt-PT')} às ${new Date().toLocaleTimeString('pt-PT')}</p>
        </div>
      `;

      const options = {
        margin: 10,
        filename: `Orcamento-${quote.quote_number}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { useCORS: true, allowTaint: true },
        jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
      };

      html2pdf().set(options).from(element).save();
      alert('PDF gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert(`Erro ao gerar PDF: ${error.message}`);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Carregando orçamento...</div>;
  }

  if (!quote) {
    return <div className="p-8 text-center">Orçamento não encontrado</div>;
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/quotes')}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-3xl font-bold">Orçamento {quote.quote_number}</h1>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleGeneratePDF}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
          >
            <Download size={20} />
            Gerar PDF
          </button>
          <button
            onClick={handleSendEmailNotification}
            disabled={sendingEmail}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition disabled:opacity-50"
          >
            <Mail size={20} />
            {sendingEmail ? 'Enviando...' : 'Enviar Email'}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50"
          >
            <Save size={20} />
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Itens do Orçamento */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-2xl font-bold mb-6">Itens</h2>

            {/* Adicionar Novo Item */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <h3 className="font-bold mb-4">Adicionar Novo Item</h3>
              <div className="space-y-4">
                <div className="relative">
                  <label className="block text-sm font-bold mb-2">Pesquisar Produto (Nome, Referência ou SKU)</label>
                  <input
                    type="text"
                    placeholder="Digite para pesquisar..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  />
                  
                  {/* Lista de produtos filtrados */}
                  {filteredProducts.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded shadow-lg z-50 max-h-64 overflow-y-auto">
                      {filteredProducts.map(p => {
                        const hasPrices = productPrices[p.id] && productPrices[p.id].length > 0;
                        return (
                          <button
                            key={p.id}
                            onClick={async () => {
                              // Buscar preços para este produto
                              if (!productPrices[p.id]) {
                                await fetchProductPrices(p.id);
                              }
                              
                              // Buscar preço para quantidade atual
                              let priceToUse = p.unit_price || 0;
                              if (productPrices[p.id]) {
                                const priceForQty = getPriceForQuantity(p.id, newItem.quantity);
                                if (priceForQty) {
                                  priceToUse = priceForQty;
                                }
                              }
                              
                              setNewItem({
                                ...newItem,
                                product_id: p.id.toString(),
                                unit_price: priceToUse
                              });
                              setProductSearch('');
                              setFilteredProducts([]);
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-200 transition"
                          >
                            <div className="font-semibold">[{p.id}] {p.name}</div>
                            <div className="text-sm text-gray-600">
                              Ref: {p.reference || '-'} | SKU: {p.sku || '-'} | €{(p.unit_price || 0).toFixed(2)} {hasPrices ? '✅' : ''}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Produto selecionado */}
                  {newItem.product_id && (
                    <div className="mt-2 p-3 bg-blue-50 rounded border border-blue-200">
                      {(() => {
                        const selected = products.find(p => p.id === parseInt(newItem.product_id));
                        const hasPrices = productPrices[newItem.product_id] && productPrices[newItem.product_id].length > 0;
                        return (
                          <div>
                            <p className="font-semibold">[{newItem.product_id}] {selected?.name}</p>
                            <p className="text-sm text-gray-600">Ref: {selected?.reference || '-'} {hasPrices ? '✅' : ''}</p>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-bold mb-2">Quantidade</label>
                    <input
                      type="number"
                      min="1"
                      value={newItem.quantity}
                      onChange={(e) => {
                        const qty = parseInt(e.target.value) || 1;
                        
                        // Buscar preço para esta quantidade
                        if (newItem.product_id && productPrices[newItem.product_id]) {
                          const priceForQty = getPriceForQuantity(newItem.product_id, qty);
                          if (priceForQty) {
                            console.log(`💰 Preço para quantidade ${qty}: €${priceForQty}`);
                            setNewItem({ ...newItem, quantity: qty, unit_price: priceForQty });
                          } else {
                            setNewItem({ ...newItem, quantity: qty });
                          }
                        } else {
                          setNewItem({ ...newItem, quantity: qty });
                        }
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2">Preço Unit. (€)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={isNaN(newItem.unit_price) ? 0 : newItem.unit_price}
                      onChange={(e) => {
                        const price = parseFloat(e.target.value);
                        setNewItem({ ...newItem, unit_price: isNaN(price) ? 0 : price });
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                    />
                    {newItem.product_id && productPrices[newItem.product_id] && productPrices[newItem.product_id].length > 0 && (
                      <p className="text-xs text-green-600 mt-1">
                        ✅ {productPrices[newItem.product_id].length} faixa(s) de preço disponível(is)
                      </p>
                    )}
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={handleAddItem}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition flex items-center justify-center gap-2"
                    >
                      <Plus size={20} />
                      Adicionar
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2">Personalização (opcional)</label>
                  <textarea
                    value={newItem.customization_description}
                    onChange={(e) => setNewItem({ ...newItem, customization_description: e.target.value })}
                    placeholder="Ex: Cores especiais, tamanho customizado, etc..."
                    rows="2"
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Lista de Itens */}
            <div className="space-y-3">
              {quote.items && quote.items.map((item, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h4 className="font-bold">{item.product_name}</h4>
                      {item.customization_description && (
                        <p className="text-sm text-gray-600 mt-1">📝 {item.customization_description}</p>
                      )}
                      {item.base_price && item.base_price !== item.unit_price && (
                        <p className="text-xs text-blue-600 mt-1">
                          Preço sem personalização: €{item.base_price.toFixed(2)}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveItem(index)}
                      className="text-red-600 hover:text-red-800 transition"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>

                  <div className="grid grid-cols-4 gap-3">
                    <div>
                      <label className="text-xs font-bold text-gray-600">Qtd</label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleUpdateItem(index, 'quantity', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-600">Preço Unit.</label>
                      <input
                        type="number"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) => handleUpdateItem(index, 'unit_price', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-600">Total</label>
                      <div className="px-2 py-1 bg-white rounded text-sm font-bold">
                        €{item.total_price.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Resumo e Envio */}
        <div>
          {/* Resumo Financeiro */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-2xl font-bold mb-6">Resumo</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-bold">€{quote.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>IVA (23%):</span>
                <span className="font-bold">€{quote.tax.toFixed(2)}</span>
              </div>
              <div className="border-t pt-3 flex justify-between text-lg">
                <span className="font-bold">Total:</span>
                <span className="font-bold text-blue-600">€{quote.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Métodos de Envio */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-6">Envio</h2>
            
            {/* Envio Selecionado */}
            {selectedShipping && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg">{selectedShipping.name}</h3>
                    {selectedShipping.description && (
                      <p className="text-sm text-gray-600 mt-1">{selectedShipping.description}</p>
                    )}
                    <p className="text-lg font-bold text-blue-600 mt-2">€{selectedShipping.base_price.toFixed(2)}</p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedShipping(null);
                      setQuote({
                        ...quote,
                        shipping_cost: 0,
                        total: quote.subtotal + quote.tax
                      });
                    }}
                    className="text-red-600 hover:text-red-800 transition"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            )}

            {/* Selecionar Método */}
            {!selectedShipping && (
              <div className="space-y-2">
                <p className="text-sm text-gray-600 mb-3">Selecione um método de envio:</p>
                {shippingMethods.map(method => (
                  <button
                    key={method.id}
                    onClick={() => {
                      setSelectedShipping(method);
                      handleAddShipping(method.base_price);
                    }}
                    className="w-full p-3 text-left border border-gray-300 rounded hover:bg-blue-50 transition"
                  >
                    <div className="font-bold">{method.name}</div>
                    {method.description && (
                      <div className="text-xs text-gray-600 mt-1">{method.description}</div>
                    )}
                    <div className="text-sm text-blue-600 font-semibold mt-1">€{method.base_price.toFixed(2)}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notas */}
          <div className="bg-white rounded-lg shadow p-6 mt-6">
            <h2 className="text-lg font-bold mb-4">Notas Internas</h2>
            <textarea
              value={quote.notes || ''}
              onChange={(e) => setQuote({ ...quote, notes: e.target.value })}
              placeholder="Adicione notas sobre este orçamento..."
              rows="4"
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Ficheiros e Notas do Cliente */}
          <div className="bg-white rounded-lg shadow p-6 mt-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Paperclip size={20} />
              Ficheiros e Notas do Cliente
            </h2>
            
            {quote.customer_notes ? (
              <div className="mb-4 p-3 bg-gray-50 rounded border border-gray-200">
                <p className="text-sm text-gray-700">{quote.customer_notes}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-600 mb-4">Sem notas do cliente</p>
            )}

            {quote.customer_files && quote.customer_files.length > 0 ? (
              <div className="space-y-2">
                {quote.customer_files.map((file, index) => (
                  <a
                    key={index}
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 text-blue-600 hover:text-blue-800 transition"
                  >
                    <FileText size={16} />
                    {file.name}
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-600">Sem ficheiros anexados</p>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
