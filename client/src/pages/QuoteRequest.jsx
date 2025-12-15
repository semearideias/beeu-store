import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { quotes } from '../api';

export default function QuoteRequest() {
  const [formData, setFormData] = useState({
    email: '',
    company_name: '',
    contact_name: '',
    phone: '',
    address: '',
    city: '',
    postal_code: '',
    tax_id: '',
    items: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await quotes.create({
        email: formData.email,
        company_name: formData.company_name,
        contact_name: formData.contact_name,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        postal_code: formData.postal_code,
        tax_id: formData.tax_id,
        notes: formData.notes,
        items: []
      });

      alert('Orçamento enviado com sucesso! Número: ' + response.data.quote.quote_number);
      navigate('/');
    } catch (error) {
      console.error('Erro ao enviar orçamento:', error);
      alert('Erro ao enviar orçamento');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container py-12">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Pedir Orçamento</h1>

        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow">
          <p className="text-gray-600 mb-8">
            Preencha o formulário abaixo para solicitar um orçamento personalizado. Entraremos em contacto em breve.
          </p>

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
            <label className="block text-sm font-bold mb-2">Descrição do Orçamento *</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              required
              rows="6"
              placeholder="Descreva os produtos que pretende, cores, quantidades, personalizações desejadas, etc."
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full btn-primary disabled:opacity-50"
          >
            {submitting ? 'Enviando...' : 'Enviar Orçamento'}
          </button>
        </form>
      </div>
    </div>
  );
}
