import { useEffect, useCallback } from 'react';
import api from '../api';

export function useQuoteSync(quoteId, onUpdate) {
  useEffect(() => {
    if (!quoteId) return;

    // Polling para sincronização (a cada 5 segundos)
    const interval = setInterval(async () => {
      try {
        const response = await api.get(`/admin/quotes/${quoteId}`);
        if (response.data) {
          onUpdate(response.data);
        }
      } catch (error) {
        console.error('Erro ao sincronizar orçamento:', error);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [quoteId, onUpdate]);
}

export function useQuoteAutoSave(quoteId, quote, saveCallback) {
  useEffect(() => {
    if (!quoteId || !quote) return;

    // Auto-save a cada 30 segundos se houver mudanças
    const timer = setTimeout(async () => {
      try {
        await saveCallback(quote);
        console.log('Orçamento auto-salvo');
      } catch (error) {
        console.error('Erro ao auto-salvar:', error);
      }
    }, 30000);

    return () => clearTimeout(timer);
  }, [quoteId, quote, saveCallback]);
}

export default {
  useQuoteSync,
  useQuoteAutoSave
};
