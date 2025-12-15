import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { orders } from '../api';

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      const response = await orders.getById(id);
      setOrder(response.data);
    } catch (error) {
      console.error('Erro ao carregar pedido:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="container py-12 text-center">Carregando...</div>;
  }

  if (!order) {
    return <div className="container py-12 text-center">Pedido não encontrado</div>;
  }

  return (
    <div className="container py-12">
      <button
        onClick={() => navigate('/orders')}
        className="text-primary hover:underline mb-6"
      >
        ← Voltar aos Pedidos
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white p-8 rounded-lg shadow mb-8">
            <h1 className="text-3xl font-bold mb-4">{order.order_number}</h1>
            <p className="text-gray-600">Data: {new Date(order.created_at).toLocaleDateString('pt-PT')}</p>
          </div>

          <div className="bg-white p-8 rounded-lg shadow mb-8">
            <h2 className="text-2xl font-bold mb-6">Informações de Entrega</h2>
            <div className="space-y-2">
              <p><strong>Empresa:</strong> {order.company_name}</p>
              {order.contact_name && <p><strong>Contacto:</strong> {order.contact_name}</p>}
              {order.email && <p><strong>Email:</strong> {order.email}</p>}
              {order.phone && <p><strong>Telefone:</strong> {order.phone}</p>}
              {order.address && <p><strong>Endereço:</strong> {order.address}</p>}
              {order.city && <p><strong>Cidade:</strong> {order.city}</p>}
              {order.postal_code && <p><strong>Código Postal:</strong> {order.postal_code}</p>}
              {order.tax_id && <p><strong>NIF:</strong> {order.tax_id}</p>}
            </div>
          </div>

          <div className="bg-white p-8 rounded-lg shadow">
            <h2 className="text-2xl font-bold mb-6">Itens do Pedido</h2>
            <div className="space-y-4">
              {order.items && order.items.map(item => (
                <div key={item.id} className="border-b pb-4 last:border-b-0">
                  <div className="flex justify-between mb-2">
                    <h3 className="font-bold">{item.product_name}</h3>
                    <span className="font-bold">€{item.total_price.toFixed(2)}</span>
                  </div>
                  <p className="text-gray-600 text-sm">
                    {item.quantity} x €{item.unit_price.toFixed(2)}
                    {item.color && ` - Cor: ${item.color}`}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-lg shadow h-fit">
          <h2 className="text-2xl font-bold mb-6">Resumo</h2>

          <div className="space-y-4 mb-6">
            <div className="flex justify-between">
              <span>Status</span>
              <span className={`px-3 py-1 rounded text-sm font-bold ${
                order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                'bg-red-100 text-red-800'
              }`}>
                {order.status}
              </span>
            </div>
            {order.payment_status && (
              <div className="flex justify-between">
                <span>Pagamento</span>
                <span>{order.payment_status}</span>
              </div>
            )}
          </div>

          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>€{order.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>IVA (23%)</span>
              <span>€{order.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>Total</span>
              <span className="text-primary">€{order.total.toFixed(2)}</span>
            </div>
          </div>

          {order.notes && (
            <div className="mt-6 pt-6 border-t">
              <h3 className="font-bold mb-2">Notas</h3>
              <p className="text-gray-600 text-sm">{order.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
