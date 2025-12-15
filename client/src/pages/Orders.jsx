import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { orders } from '../api';

export default function Orders() {
  const [orderList, setOrderList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Token:', token ? 'Sim' : 'Não');
      
      const response = await orders.getAll();
      console.log('Response:', response);
      console.log('Response data:', response.data);
      
      setOrderList(response.data || []);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
      setOrderList([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="container py-12 text-center">Carregando pedidos...</div>;
  }

  return (
    <div className="container py-12">
      <h1 className="text-4xl font-bold mb-8">Meus Pedidos</h1>

      {orderList.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <p className="text-gray-600 mb-4">Não tem pedidos</p>
          <Link to="/products" className="btn-primary inline-block">
            Fazer Compra
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-dark text-white">
              <tr>
                <th className="px-6 py-4 text-left">Número</th>
                <th className="px-6 py-4 text-left">Data</th>
                <th className="px-6 py-4 text-left">Total</th>
                <th className="px-6 py-4 text-left">Status</th>
                <th className="px-6 py-4 text-left">Ação</th>
              </tr>
            </thead>
            <tbody>
              {orderList.map(order => (
                <tr key={order.id} className="border-b hover:bg-light">
                  <td className="px-6 py-4 font-bold">{order.order_number}</td>
                  <td className="px-6 py-4">{new Date(order.created_at).toLocaleDateString('pt-PT')}</td>
                  <td className="px-6 py-4 font-bold">€{order.total.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded text-sm font-bold ${
                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                      order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                      order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Link to={`/orders/${order.id}`} className="text-primary hover:underline">
                      Ver Detalhes
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
