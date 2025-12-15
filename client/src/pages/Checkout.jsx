import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cart, orders } from '../api';

export default function Checkout() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    company_name: '',
    contact_name: '',
    phone: '',
    address: '',
    city: '',
    postal_code: '',
    tax_id: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const response = await cart.get();
      setItems(response.data);
    } catch (error) {
      console.error('Erro ao carregar carrinho:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Obter user_id do token se autenticado
      const token = localStorage.getItem('token');
      let userId = null;
      
      if (token) {
        try {
          // Decodificar JWT para obter user_id
          const payload = JSON.parse(atob(token.split('.')[1]));
          userId = payload.id;
          console.log('User ID extraído do token:', userId);
        } catch (err) {
          console.log('Não foi possível extrair user_id do token');
        }
      }

      const orderData = {
        user_id: userId,
        email: formData.email,
        company_name: formData.company_name,
        contact_name: formData.contact_name,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        postal_code: formData.postal_code,
        tax_id: formData.tax_id,
        notes: formData.notes,
        items: items.map(item => ({
          product_id: item.product_id,
          product_name: item.name,
          quantity: item.quantity,
          color: item.color,
          unit_price: item.unit_price,
          total_price: item.unit_price * item.quantity
        }))
      };

      console.log('Criando pedido com user_id:', orderData.user_id);
      const response = await orders.create(orderData);
      await cart.clear();
      navigate(`/orders/${response.data.order.id}`);
    } catch (error) {
      console.error('Erro ao criar pedido:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="container py-12 text-center">Carregando...</div>;
  }

  const subtotal = items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
  const tax = subtotal * 0.23;
  const total = subtotal + tax;

  return (
    <div className="container py-12">
      <h1 className="text-4xl font-bold mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow">
            <h2 className="text-2xl font-bold mb-6">Informações de Entrega</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-bold mb-2">Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">Empresa *</label>
                <input
                  type="text"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">Nome de Contacto</label>
                <input
                  type="text"
                  name="contact_name"
                  value={formData.contact_name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">Telefone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-bold mb-2">Endereço</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">Cidade</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">Código Postal</label>
                <input
                  type="text"
                  name="postal_code"
                  value={formData.postal_code}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">NIF</label>
                <input
                  type="text"
                  name="tax_id"
                  value={formData.tax_id}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-bold mb-2">Notas do Pedido</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="4"
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full btn-primary disabled:opacity-50"
            >
              {submitting ? 'Processando...' : 'Confirmar Pedido'}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow p-6 h-fit">
          <h2 className="font-bold text-xl mb-6">Resumo do Pedido</h2>
          <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
            {items.map(item => (
              <div key={item.id} className="flex justify-between text-sm">
                <span>{item.name} x{item.quantity}</span>
                <span>€{(item.unit_price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>€{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>IVA (23%)</span>
              <span>€{tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>Total</span>
              <span className="text-primary">€{total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
