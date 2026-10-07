import { useState, useEffect, useCallback } from 'react';
import { bansosService } from '../services/api';

export function useBansos(initialFilters = {}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(initialFilters);

  const fetchData = useCallback(async (customFilters) => {
    setLoading(true);
    setError(null);
    try {
      const activeFilters = customFilters !== undefined ? customFilters : filters;
      const res = await bansosService.getPenerimaBansos(activeFilters);
      setData(res);
      return res;
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateFilters = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  return {
    data,
    loading,
    error,
    filters,
    updateFilters,
    refetch: fetchData,
  };
}

export default useBansos;
