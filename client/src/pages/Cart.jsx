import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { cart } from '../api';
import { Trash2, ShoppingCart, AlertCircle } from 'lucide-react';
import { useMinOrderValue } from '../hooks/useMinOrderValue';

export default function Cart() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { minOrderValue, loading: settingsLoading, isValidOrder, getRemainingAmount } = useMinOrderValue();

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const sessionId = localStorage.getItem('sessionId') || 'guest-' + Date.now();
      if (!localStorage.getItem('sessionId')) {
        localStorage.setItem('sessionId', sessionId);
      }
      const response = await cart.get();
      setItems(response.data);
    } catch (error) {
      console.error('Erro ao carregar carrinho:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (itemId) => {
    try {
      await cart.remove(itemId);
      setItems(items.filter(item => item.id !== itemId));
    } catch (error) {
      console.error('Erro ao remover item:', error);
    }
  };

  const handleQuantityChange = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    try {
      await cart.update(itemId, newQuantity);
      setItems(items.map(item =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      ));
    } catch (error) {
      console.error('Erro ao atualizar quantidade:', error);
    }
  };

  const subtotal = items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
  const tax = subtotal * 0.23;
  const total = subtotal + tax;

  if (loading) {
    return <div className="container py-12 text-center">Carregando carrinho...</div>;
  }

  if (items.length === 0) {
    return (
      <div className="container py-20 text-center">
        <ShoppingCart size={64} className="mx-auto text-gray-400 mb-4" />
        <h1 className="text-3xl font-bold mb-4">Carrinho Vazio</h1>
        <p className="text-gray-600 mb-8">Não tem produtos no carrinho</p>
        <Link to="/products" className="btn-primary inline-block">
          Continuar Compras
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-12">
      <h1 className="text-4xl font-bold mb-8">Carrinho de Compras</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Itens */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow">
            {items.map(item => (
              <div key={item.id} className="p-6 border-b last:border-b-0 flex gap-6">
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-2">{item.name}</h3>
                  <p className="text-gray-600 text-sm mb-2">SKU: {item.sku}</p>
                  {item.color && <p className="text-gray-600 text-sm">Cor: {item.color}</p>}
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                      className="px-2 py-1 border border-gray-300 rounded hover:bg-light"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                      className="w-16 text-center border border-gray-300 rounded py-1"
                    />
                    <button
                      onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                      className="px-2 py-1 border border-gray-300 rounded hover:bg-light"
                    >
                      +
                    </button>
                  </div>
                  <div className="text-right w-32">
                    <p className="text-sm text-gray-600">€{item.unit_price.toFixed(2)}/un</p>
                    <p className="font-bold">€{(item.unit_price * item.quantity).toFixed(2)}</p>
                  </div>
                  <button
                    onClick={() => handleRemove(item.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Resumo */}
        <div className="bg-white rounded-lg shadow p-6 h-fit">
          <h2 className="font-bold text-xl mb-6">Resumo</h2>
          <div className="space-y-4 mb-6">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>€{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>IVA (23%)</span>
              <span>€{tax.toFixed(2)}</span>
            </div>
            <div className="border-t pt-4 flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="text-primary">€{total.toFixed(2)}</span>
            </div>
          </div>

          {/* Validação de Compra Mínima */}
          {minOrderValue > 0 && !isValidOrder(subtotal) && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex gap-3">
                <AlertCircle className="text-yellow-600 flex-shrink-0" size={20} />
                <div>
                  <p className="font-semibold text-yellow-900 mb-1">Valor Mínimo Não Atingido</p>
                  <p className="text-sm text-yellow-800">
                    Valor mínimo: €{minOrderValue.toFixed(2)}
                  </p>
                  <p className="text-sm text-yellow-800">
                    Faltam: €{getRemainingAmount(subtotal).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={() => navigate('/checkout')}
            disabled={minOrderValue > 0 && !isValidOrder(subtotal)}
            className={`w-full mb-3 ${
              minOrderValue > 0 && !isValidOrder(subtotal)
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'btn-primary'
            }`}
          >
            {minOrderValue > 0 && !isValidOrder(subtotal)
              ? 'Valor Mínimo Não Atingido'
              : 'Prosseguir para Checkout'}
          </button>
          <Link to="/products" className="block text-center text-primary hover:underline">
            Continuar Compras
          </Link>
        </div>
      </div>
    </div>
  );
}
