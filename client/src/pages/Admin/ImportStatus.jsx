import React, { useState, useEffect } from 'react';
import { Activity, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

export default function ImportStatus() {
  const [imageQueueStatus, setImageQueueStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdate, setLastUpdate] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Buscar status da fila de imagens
  const fetchImageQueueStatus = async () => {
    try {
      const response = await fetch('/api/import/image-queue-status');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      console.log('Status recebido:', data);
      setImageQueueStatus(data);
      setLastUpdate(new Date().toLocaleTimeString('pt-PT'));
      setError('');
    } catch (err) {
      console.error('Erro ao obter status:', err);
      setError('Erro ao obter status: ' + err.message);
      // Mostrar dados vazios mesmo com erro
      setImageQueueStatus({
        pending: 0,
        completed: 0,
        failed: 0,
        total: 0
      });
    } finally {
      setLoading(false);
    }
  };

  // Atualizar status
  const handleRefresh = async () => {
    setLoading(true);
    await fetchImageQueueStatus();
  };

  // Processar fila de imagens
  const handleProcessQueue = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/import/process-image-queue', { method: 'POST' });
      const data = await response.json();
      console.log('Processadas:', data);
      await fetchImageQueueStatus();
    } catch (err) {
      setError('Erro ao processar fila: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh
  useEffect(() => {
    fetchImageQueueStatus();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(async () => {
      await fetchImageQueueStatus();
    }, 3000); // Atualizar a cada 3 segundos

    return () => clearInterval(interval);
  }, [autoRefresh]);

  return (
    <div className="bg-white p-8 rounded-lg shadow-lg space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Status de Importação</h1>
        <p className="text-gray-600">Acompanhe o progresso do download de imagens</p>
      </div>

      {/* Controls */}
      <div className="flex gap-4 items-center">
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center gap-2 bg-primary text-dark font-bold px-6 py-3 rounded hover:opacity-90 transition disabled:opacity-50"
        >
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          Atualizar
        </button>

        <button
          onClick={handleProcessQueue}
          disabled={loading}
          className="flex items-center gap-2 bg-blue-600 text-white font-bold px-6 py-3 rounded hover:opacity-90 transition disabled:opacity-50"
        >
          <Activity size={20} />
          Processar Fila
        </button>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-sm font-medium">Auto-atualizar (3s)</span>
        </label>

        {lastUpdate && (
          <span className="text-sm text-gray-500 ml-auto">
            Última atualização: {lastUpdate}
          </span>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {/* Status Cards */}
      {imageQueueStatus ? (
        <div className="space-y-6">
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded">
              <p className="text-sm text-gray-600 font-bold">Pendentes</p>
              <p className="text-4xl font-bold text-blue-600">{imageQueueStatus.pending}</p>
            </div>
            <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded">
              <p className="text-sm text-gray-600 font-bold">Concluídas</p>
              <p className="text-4xl font-bold text-green-600">{imageQueueStatus.completed}</p>
            </div>
            <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded">
              <p className="text-sm text-gray-600 font-bold">Falhadas</p>
              <p className="text-4xl font-bold text-red-600">{imageQueueStatus.failed}</p>
            </div>
            <div className="bg-purple-50 border-l-4 border-purple-500 p-6 rounded">
              <p className="text-sm text-gray-600 font-bold">Total</p>
              <p className="text-4xl font-bold text-purple-600">{imageQueueStatus.total}</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <p className="font-bold text-lg">Progresso Geral</p>
              <p className="text-2xl font-bold text-primary">
                {imageQueueStatus.total > 0 ? Math.round((imageQueueStatus.completed / imageQueueStatus.total) * 100) : 0}%
              </p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-green-500 h-full transition-all duration-500 flex items-center justify-center"
                style={{
                  width: `${imageQueueStatus.total > 0 ? (imageQueueStatus.completed / imageQueueStatus.total) * 100 : 0}%`
                }}
              >
                {imageQueueStatus.total > 0 && (
                  <span className="text-white text-xs font-bold">
                    {imageQueueStatus.completed}/{imageQueueStatus.total}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Status Message */}
          {imageQueueStatus.pending === 0 ? (
            <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded flex items-start gap-4">
              <CheckCircle size={24} className="text-green-600 flex-shrink-0 mt-1" />
              <div>
                <p className="text-green-700 font-bold text-lg">✓ Importação Concluída!</p>
                <p className="text-green-600 text-sm mt-1">Todas as imagens foram descarregadas com sucesso.</p>
              </div>
            </div>
          ) : (
            <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded flex items-start gap-4">
              <Activity size={24} className="text-blue-600 flex-shrink-0 mt-1 animate-spin" />
              <div>
                <p className="text-blue-700 font-bold text-lg">⏳ Importação em Progresso</p>
                <p className="text-blue-600 text-sm mt-1">
                  {imageQueueStatus.pending} imagens ainda estão sendo descarregadas. 
                  {autoRefresh ? ' Status atualizado automaticamente.' : ' Clique em Atualizar para ver o progresso.'}
                </p>
              </div>
            </div>
          )}

          {/* Statistics */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h3 className="font-bold text-lg mb-4">Estatísticas</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Taxa de Sucesso</p>
                <p className="text-2xl font-bold text-green-600">
                  {imageQueueStatus.total > 0 ? Math.round((imageQueueStatus.completed / imageQueueStatus.total) * 100) : 0}%
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Taxa de Falha</p>
                <p className="text-2xl font-bold text-red-600">
                  {imageQueueStatus.total > 0 ? Math.round((imageQueueStatus.failed / imageQueueStatus.total) * 100) : 0}%
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Tempo Estimado</p>
                <p className="text-2xl font-bold text-blue-600">
                  {imageQueueStatus.pending > 0 ? `~${Math.ceil(imageQueueStatus.pending / 10)} min` : 'Concluído'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Velocidade</p>
                <p className="text-2xl font-bold text-purple-600">
                  ~10/min
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
          <Activity size={40} className="mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 font-bold text-lg">Nenhuma importação em andamento</p>
          <p className="text-gray-500 text-sm mt-2">Inicie uma importação para ver o progresso aqui</p>
        </div>
      )}

      {loading && !imageQueueStatus && (
        <div className="text-center py-12">
          <Activity size={40} className="animate-spin mx-auto mb-4 text-primary" />
          <p className="text-gray-600 font-bold">Carregando status...</p>
        </div>
      )}
    </div>
  );
}
