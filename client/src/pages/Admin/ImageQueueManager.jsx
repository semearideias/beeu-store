import React, { useState, useEffect } from 'react';
import { Download, RefreshCw, AlertCircle, CheckCircle, Clock } from 'lucide-react';

export default function ImageQueueManager() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [autoProcess, setAutoProcess] = useState(false);

  // Buscar status da fila
  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/import/image-queue-status');
      const data = await response.json();
      setStatus(data);
      setError('');
    } catch (err) {
      setError('Erro ao buscar status: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Processar fila (5 imagens)
  const processQueue = async () => {
    try {
      setProcessing(true);
      const response = await fetch('/api/import/process-image-queue', {
        method: 'POST'
      });
      const data = await response.json();
      
      if (data.processed > 0) {
        setError(`✅ ${data.successful} imagens descarregadas, ${data.remaining} restantes`);
      } else {
        setError('Nenhuma imagem na fila para processar');
      }
      
      // Atualizar status
      await fetchStatus();
    } catch (err) {
      setError('Erro ao processar fila: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  // Auto-processar a cada 30 segundos
  useEffect(() => {
    if (autoProcess) {
      const interval = setInterval(() => {
        processQueue();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [autoProcess]);

  // Buscar status ao carregar
  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000); // Atualizar a cada 10 segundos
    return () => clearInterval(interval);
  }, []);

  if (!status) {
    return <div className="container py-12 text-center">Carregando...</div>;
  }

  const totalImages = status.total;
  const completedPercentage = totalImages > 0 ? (status.completed / totalImages) * 100 : 0;
  const pendingPercentage = totalImages > 0 ? (status.pending / totalImages) * 100 : 0;
  const failedPercentage = totalImages > 0 ? (status.failed / totalImages) * 100 : 0;

  return (
    <div className="container py-12">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Gestor de Fila de Imagens</h1>
        <p className="text-gray-600 mb-8">Monitore e processe o download progressivo de imagens</p>

        {/* Status Cards */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <p className="text-sm text-gray-600">Total</p>
            <p className="text-3xl font-bold text-blue-600">{totalImages}</p>
          </div>
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
            <p className="text-sm text-gray-600">Pendentes</p>
            <p className="text-3xl font-bold text-yellow-600">{status.pending}</p>
          </div>
          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
            <p className="text-sm text-gray-600">Concluídas</p>
            <p className="text-3xl font-bold text-green-600">{status.completed}</p>
          </div>
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <p className="text-sm text-gray-600">Falhadas</p>
            <p className="text-3xl font-bold text-red-600">{status.failed}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <p className="font-bold">Progresso Geral</p>
            <p className="text-sm text-gray-600">{completedPercentage.toFixed(1)}% concluído</p>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div className="flex h-full">
              <div
                style={{ width: `${completedPercentage}%` }}
                className="bg-green-500 transition-all duration-300"
              />
              <div
                style={{ width: `${pendingPercentage}%` }}
                className="bg-yellow-500 transition-all duration-300"
              />
              <div
                style={{ width: `${failedPercentage}%` }}
                className="bg-red-500 transition-all duration-300"
              />
            </div>
          </div>
          <div className="flex gap-6 mt-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <span>Concluídas: {status.completed}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full" />
              <span>Pendentes: {status.pending}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full" />
              <span>Falhadas: {status.failed}</span>
            </div>
          </div>
        </div>

        {/* Mensagens */}
        {error && (
          <div className={`mb-6 p-4 rounded border-l-4 ${
            error.includes('✅') 
              ? 'bg-green-50 border-green-500 text-green-700' 
              : 'bg-red-50 border-red-500 text-red-700'
          }`}>
            <div className="flex items-center gap-2">
              {error.includes('✅') ? (
                <CheckCircle size={20} />
              ) : (
                <AlertCircle size={20} />
              )}
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Controles */}
        <div className="space-y-4">
          <div className="flex gap-4">
            <button
              onClick={fetchStatus}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white font-bold py-3 rounded hover:bg-blue-700 transition disabled:opacity-50"
            >
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
              Atualizar Status
            </button>
            <button
              onClick={processQueue}
              disabled={processing || status.pending === 0}
              className="flex-1 flex items-center justify-center gap-2 bg-primary text-dark font-bold py-3 rounded hover:opacity-90 transition disabled:opacity-50"
            >
              <Download size={20} />
              Processar Fila (5 imagens)
            </button>
          </div>

          {/* Auto-processar */}
          <div className="bg-light p-4 rounded border-2 border-gray-300">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={autoProcess}
                onChange={(e) => setAutoProcess(e.target.checked)}
                className="w-5 h-5"
              />
              <div>
                <p className="font-bold">Processar Automaticamente</p>
                <p className="text-sm text-gray-600">
                  {autoProcess 
                    ? '✅ Processando a cada 30 segundos' 
                    : 'Clique para ativar processamento automático'}
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Informações */}
        <div className="mt-8 bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
          <p className="font-bold mb-2 flex items-center gap-2">
            <Clock size={20} />
            Informações
          </p>
          <ul className="text-sm space-y-1 text-gray-700">
            <li>• Cada processamento descarrega 5 imagens</li>
            <li>• Há 2 segundos de espera entre downloads</li>
            <li>• Máximo 3 tentativas por imagem</li>
            <li>• Auto-processar tenta a cada 30 segundos</li>
            <li>• Status atualizado a cada 10 segundos</li>
          </ul>
        </div>

        {/* Estimativa de Tempo */}
        {status.pending > 0 && (
          <div className="mt-4 bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
            <p className="font-bold mb-2">Estimativa de Tempo</p>
            <p className="text-sm text-gray-700">
              Com {status.pending} imagens pendentes:
              <br />
              • Processamento manual: ~{Math.ceil(status.pending / 5) * 0.5} minutos
              <br />
              • Auto-processar: ~{Math.ceil(status.pending / 5) * 0.5} minutos
            </p>
          </div>
        )}

        {status.pending === 0 && status.completed > 0 && (
          <div className="mt-4 bg-green-50 border-l-4 border-green-500 p-4 rounded">
            <div className="flex items-center gap-2">
              <CheckCircle size={20} className="text-green-600" />
              <p className="font-bold text-green-600">✅ Todas as imagens foram descarregadas!</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
