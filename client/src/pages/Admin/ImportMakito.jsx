import React, { useState } from 'react';
import { Upload, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { importData } from '../../api';

export default function ImportMakito() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
        setError('');
      } else {
        setError('Por favor, selecione um arquivo CSV válido');
        setFile(null);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Por favor, selecione um arquivo');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await importData.uploadProducts(file);
      setResult(response.data);
      setFile(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao importar produtos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-12">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Importar Produtos Makito</h1>

        <div className="bg-white p-8 rounded-lg shadow-lg">
          {/* Instruções */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-8">
            <h2 className="font-bold text-blue-900 mb-2">Como usar:</h2>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>1. Baixe o arquivo CSV do Makito</li>
              <li>2. Selecione o arquivo abaixo</li>
              <li>3. Clique em "Importar Produtos"</li>
              <li>4. O sistema processará automaticamente</li>
            </ul>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* File Input */}
            <div>
              <label className="block text-sm font-bold mb-4">Selecionar arquivo CSV</label>
              <div className="border-2 border-dashed border-primary rounded-lg p-8 text-center hover:bg-primary/5 transition">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                  id="csv-input"
                />
                <label htmlFor="csv-input" className="cursor-pointer">
                  <Upload size={40} className="text-primary mx-auto mb-2" />
                  <p className="font-semibold text-dark">
                    {file ? file.name : 'Clique para selecionar ou arraste o arquivo'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">Apenas arquivos CSV</p>
                </label>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center gap-2">
                <AlertCircle size={20} />
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!file || loading}
              className="w-full bg-primary text-dark font-bold py-3 rounded hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader size={20} className="animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <Upload size={20} />
                  Importar Produtos
                </>
              )}
            </button>
          </form>

          {/* Result */}
          {result && (
            <div className="mt-8 p-6 bg-green-50 border-l-4 border-green-500 rounded">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle size={24} className="text-green-600" />
                <h3 className="font-bold text-green-900 text-lg">Importação Concluída!</h3>
              </div>
              <div className="space-y-2 text-green-800">
                <p>✓ <strong>{result.imported_rows}</strong> produtos importados com sucesso</p>
                {result.skipped_rows > 0 && (
                  <p>⚠ <strong>{result.skipped_rows}</strong> linhas ignoradas</p>
                )}
              </div>

              {result.errors && result.errors.length > 0 && (
                <div className="mt-4 pt-4 border-t border-green-300">
                  <p className="font-bold text-sm mb-2">Avisos:</p>
                  <ul className="text-sm space-y-1">
                    {result.errors.map((err, idx) => (
                      <li key={idx} className="text-yellow-700">• {err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-light p-6 rounded-lg">
          <h3 className="font-bold mb-3">Formato esperado do CSV:</h3>
          <div className="bg-white p-4 rounded text-sm font-mono text-gray-600 overflow-x-auto">
            <p>sku,name,description,category_id,stock,active,customization_options,</p>
            <p>price_below_500,price_500,price_2000,price_5000</p>
          </div>
          <p className="text-sm text-gray-600 mt-3">
            O arquivo deve conter as colunas exatas conforme o formato do Makito.
          </p>
        </div>
      </div>
    </div>
  );
}
