import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import api from '../api';

export default function AdminStoreSettings() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/settings');
      setSettings(response.data);
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      setMessage('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key, value) => {
    setSettings({
      ...settings,
      [key]: {
        ...settings[key],
        value
      }
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Validação básica
      if (!settings || Object.keys(settings).length === 0) {
        setMessage('Nenhuma configuração para salvar');
        return;
      }

      await api.put('/admin/settings', settings);
      setMessage('Configurações salvas com sucesso!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Erro ao salvar:', error);
      const errorMessage = error.response?.data?.error || 'Erro ao salvar configurações';
      setMessage(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <p className="text-gray-600">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-6">Configurações da Loja</h1>

        {message && (
          <div className={`mb-6 p-4 rounded ${message.includes('sucesso') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Dados da Empresa */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-2xl font-bold mb-6">Dados da Empresa</h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold mb-2">Nome da Empresa</label>
                <input
                  type="text"
                  value={settings.company_name?.value || ''}
                  onChange={(e) => handleChange('company_name', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">NIF/NIPC</label>
                <input
                  type="text"
                  value={settings.company_nif?.value || ''}
                  onChange={(e) => handleChange('company_nif', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">Endereço</label>
                <input
                  type="text"
                  value={settings.company_address?.value || ''}
                  onChange={(e) => handleChange('company_address', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-2">Código Postal</label>
                  <input
                    type="text"
                    value={settings.company_postal_code?.value || ''}
                    onChange={(e) => handleChange('company_postal_code', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">Cidade</label>
                  <input
                    type="text"
                    value={settings.company_city?.value || ''}
                    onChange={(e) => handleChange('company_city', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-2">Telefone</label>
                  <input
                    type="text"
                    value={settings.company_phone?.value || ''}
                    onChange={(e) => handleChange('company_phone', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">Email</label>
                  <input
                    type="email"
                    value={settings.company_email?.value || ''}
                    onChange={(e) => handleChange('company_email', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">Website</label>
                <input
                  type="url"
                  value={settings.company_website?.value || ''}
                  onChange={(e) => handleChange('company_website', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Configurações Gerais */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-2xl font-bold mb-6">Compras</h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold mb-2">
                  Valor Mínimo de Compra (sem IVA e portes)
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold">€</span>
                  <input
                    type="number"
                    step="0.01"
                    value={settings.min_order_value?.value || '0'}
                    onChange={(e) => handleChange('min_order_value', e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  />
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {settings.min_order_value?.description}
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded border border-blue-200">
                <h3 className="font-bold text-blue-900 mb-2">ℹ️ Informação</h3>
                <p className="text-sm text-blue-800">
                  Este valor será validado no carrinho e checkout. Se o cliente tentar adicionar um valor inferior, será exibida uma mensagem de erro.
                </p>
              </div>
            </div>
          </div>

          {/* Envios */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-2xl font-bold mb-6">Envios</h2>

            <div className="space-y-6">
              <div className="bg-yellow-50 p-4 rounded border border-yellow-200">
                <h3 className="font-bold text-yellow-900 mb-2">⚙️ Configuração</h3>
                <p className="text-sm text-yellow-800 mb-3">
                  Os métodos de envio são configurados na seção "Métodos de Envio".
                </p>
                <a
                  href="/admin/shipping"
                  className="inline-block px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition"
                >
                  Ir para Métodos de Envio
                </a>
              </div>

              <div className="bg-gray-50 p-4 rounded">
                <h3 className="font-bold text-gray-900 mb-3">Cálculo de Envio</h3>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li>✓ Baseado no peso total do produto (em gramas)</li>
                  <li>✓ Suporta múltiplos métodos por faixa de peso</li>
                  <li>✓ Envio gratuito a partir de um valor mínimo</li>
                  <li>✓ Preço base + preço por kg</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Botão de Salvar */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={20} />
            {saving ? 'Guardando...' : 'Guardar Configurações'}
          </button>
        </div>
      </div>

      {/* Informações Adicionais */}
      <div className="mt-12 bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-6">Informações do Sistema</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-bold text-gray-900 mb-3">Tabelas Configuradas</h3>
            <ul className="text-sm text-gray-700 space-y-2">
              <li>✓ shipping_methods</li>
              <li>✓ order_tracking</li>
              <li>✓ store_settings</li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-gray-900 mb-3">Funcionalidades Ativas</h3>
            <ul className="text-sm text-gray-700 space-y-2">
              <li>✓ Validação de compra mínima</li>
              <li>✓ Cálculo de envio por peso</li>
              <li>✓ Rastreamento de pedidos</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
