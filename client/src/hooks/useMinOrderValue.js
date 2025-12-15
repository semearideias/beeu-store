import { useState, useEffect } from 'react';
import api from '../api';

export function useMinOrderValue() {
  const [minOrderValue, setMinOrderValue] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMinOrderValue();
  }, []);

  const fetchMinOrderValue = async () => {
    try {
      const response = await api.get('/admin/settings/min_order_value');
      setMinOrderValue(parseFloat(response.data.setting_value) || 0);
    } catch (error) {
      console.error('Erro ao carregar valor mínimo:', error);
      setMinOrderValue(0);
    } finally {
      setLoading(false);
    }
  };

  const isValidOrder = (subtotal) => {
    return parseFloat(subtotal) >= minOrderValue;
  };

  const getRemainingAmount = (subtotal) => {
    const remaining = minOrderValue - parseFloat(subtotal);
    return remaining > 0 ? remaining : 0;
  };

  return {
    minOrderValue,
    loading,
    isValidOrder,
    getRemainingAmount
  };
}
