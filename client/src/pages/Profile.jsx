import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, FileText } from 'lucide-react';
import { auth } from '../api';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await auth.getMe();
      setUser(response.data);
      setFormData(response.data);
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
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
    try {
      await auth.updateProfile(formData);
      setUser(formData);
      setEditing(false);
      alert('Perfil atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      alert('Erro ao atualizar perfil');
    }
  };

  if (loading) {
    return <div className="container py-12 text-center">Carregando...</div>;
  }

  if (!user) {
    return <div className="container py-12 text-center">Erro ao carregar perfil</div>;
  }

  return (
    <div className="container py-12">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Meu Perfil</h1>

        <div className="bg-white p-8 rounded-lg shadow">
          {!editing ? (
            <div>
              <div className="space-y-4 mb-8">
                <div>
                  <p className="text-gray-600 text-sm">Email</p>
                  <p className="font-bold">{user.email}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Empresa</p>
                  <p className="font-bold">{user.company_name}</p>
                </div>
                {user.contact_name && (
                  <div>
                    <p className="text-gray-600 text-sm">Nome de Contacto</p>
                    <p className="font-bold">{user.contact_name}</p>
                  </div>
                )}
                {user.phone && (
                  <div>
                    <p className="text-gray-600 text-sm">Telefone</p>
                    <p className="font-bold">{user.phone}</p>
                  </div>
                )}
                {user.address && (
                  <div>
                    <p className="text-gray-600 text-sm">Endereço</p>
                    <p className="font-bold">{user.address}</p>
                  </div>
                )}
              </div>

              {/* Botões de Ações */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <button
                  onClick={() => setEditing(true)}
                  className="btn-primary"
                >
                  Editar Perfil
                </button>
                <Link
                  to="/orders"
                  className="btn-primary flex items-center justify-center gap-2"
                >
                  <ShoppingBag size={20} />
                  Minhas Compras
                </Link>
                <Link
                  to="/my-quotes"
                  className="bg-secondary text-dark px-4 py-2 rounded font-bold hover:shadow-lg transition flex items-center justify-center gap-2"
                >
                  <FileText size={20} />
                  Meus Orçamentos
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">Empresa</label>
                <input
                  type="text"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">Nome de Contacto</label>
                <input
                  type="text"
                  name="contact_name"
                  value={formData.contact_name || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">Telefone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">Endereço</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex gap-4">
                <button type="submit" className="btn-primary">
                  Guardar Alterações
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setFormData(user);
                  }}
                  className="btn-outline"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
