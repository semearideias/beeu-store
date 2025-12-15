import React from 'react';

export default function QuotePDFTemplate({ quote, company, customer }) {
  const subtotal = quote.subtotal || 0;
  const tax = quote.tax || 0;
  const shipping = quote.shipping_cost || 0;
  const total = subtotal + tax + shipping;

  return (
    <div className="w-full bg-white p-12 text-gray-800" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div className="flex justify-between items-start mb-8 pb-8 border-b-2 border-gray-300">
        <div>
          <h1 className="text-4xl font-bold text-blue-600 mb-2">{company?.company_name || 'Empresa'}</h1>
          <p className="text-sm text-gray-600">{company?.company_address}</p>
          <p className="text-sm text-gray-600">{company?.company_postal_code} {company?.company_city}</p>
          <p className="text-sm text-gray-600 mt-2">
            NIF: {company?.company_nif} | Tel: {company?.company_phone}
          </p>
          <p className="text-sm text-gray-600">Email: {company?.company_email}</p>
        </div>

        <div className="text-right">
          <h2 className="text-3xl font-bold text-gray-700 mb-2">ORÇAMENTO</h2>
          <p className="text-lg font-semibold text-blue-600">#{quote.quote_number}</p>
          <p className="text-sm text-gray-600 mt-4">
            Data: {new Date(quote.created_at).toLocaleDateString('pt-PT')}
          </p>
          {quote.valid_until && (
            <p className="text-sm text-gray-600">
              Válido até: {new Date(quote.valid_until).toLocaleDateString('pt-PT')}
            </p>
          )}
        </div>
      </div>

      {/* Cliente */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase">Dados do Cliente</h3>
          <p className="font-semibold text-lg">{customer?.name}</p>
          <p className="text-sm text-gray-600">{customer?.email}</p>
          <p className="text-sm text-gray-600">{customer?.phone}</p>
          {customer?.company && <p className="text-sm text-gray-600 mt-2">{customer.company}</p>}
          {customer?.address && (
            <>
              <p className="text-sm text-gray-600">{customer.address}</p>
              <p className="text-sm text-gray-600">
                {customer.postal_code} {customer.city}
              </p>
            </>
          )}
        </div>

        <div>
          <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase">Informações</h3>
          <p className="text-sm"><span className="font-semibold">Status:</span> {quote.status}</p>
          <p className="text-sm"><span className="font-semibold">Itens:</span> {quote.items?.length || 0}</p>
        </div>
      </div>

      {/* Itens */}
      <div className="mb-8">
        <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase">Itens do Orçamento</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100 border-b-2 border-gray-300">
              <th className="text-left p-3 font-bold">Descrição</th>
              <th className="text-center p-3 font-bold">Qtd</th>
              <th className="text-right p-3 font-bold">Preço Unit.</th>
              <th className="text-right p-3 font-bold">Total</th>
            </tr>
          </thead>
          <tbody>
            {quote.items && quote.items.map((item, index) => (
              <tr key={index} className="border-b border-gray-200">
                <td className="p-3">
                  <div className="font-semibold">{item.product_name}</div>
                  {item.customization_description && (
                    <div className="text-xs text-gray-600 mt-1">
                      📝 {item.customization_description}
                    </div>
                  )}
                </td>
                <td className="text-center p-3">{item.quantity}</td>
                <td className="text-right p-3">€{parseFloat(item.unit_price).toFixed(2)}</td>
                <td className="text-right p-3 font-semibold">€{parseFloat(item.total_price).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Resumo Financeiro */}
      <div className="flex justify-end mb-8">
        <div className="w-80">
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <div className="flex justify-between mb-3 pb-3 border-b border-gray-300">
              <span>Subtotal:</span>
              <span className="font-semibold">€{subtotal.toFixed(2)}</span>
            </div>

            <div className="flex justify-between mb-3 pb-3 border-b border-gray-300">
              <span>IVA (23%):</span>
              <span className="font-semibold">€{tax.toFixed(2)}</span>
            </div>

            {shipping > 0 && (
              <div className="flex justify-between mb-3 pb-3 border-b border-gray-300">
                <span>Envio:</span>
                <span className="font-semibold">€{shipping.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between text-lg">
              <span className="font-bold">TOTAL:</span>
              <span className="font-bold text-blue-600">€{total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notas */}
      {quote.notes && (
        <div className="mb-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-sm font-bold text-gray-700 mb-2 uppercase">Notas</h3>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{quote.notes}</p>
        </div>
      )}

      {/* Footer */}
      <div className="mt-12 pt-8 border-t-2 border-gray-300 text-center text-xs text-gray-600">
        <p>Obrigado pelo seu interesse! Para dúvidas, contacte-nos.</p>
        <p className="mt-2">{company?.company_website}</p>
        <p className="mt-4 text-gray-400">Documento gerado em {new Date().toLocaleDateString('pt-PT')} às {new Date().toLocaleTimeString('pt-PT')}</p>
      </div>
    </div>
  );
}
