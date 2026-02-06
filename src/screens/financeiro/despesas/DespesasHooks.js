// Salve este arquivo como: src/screens/financeiro/despesas/DespesasHooks.js
import { useState, useCallback, useEffect } from 'react';
// Certifique-se que o caminho do supabase está correto
import { supabase } from '../../../services/supabase';

export const useDespesas = () => {
  const [despesas, setDespesas] = useState([]);
  const [loading, setLoading] = useState(true);

  const carregarDespesas = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('despesas')
        .select('*')
        .order('data_vencimento', { ascending: false });

      if (error) throw error;
      setDespesas(data || []);
    } catch (error) {
      console.error('Erro ao carregar despesas:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarDespesas();
  }, [carregarDespesas]);

  return {
    despesas,
    loading,
    refresh: carregarDespesas
  };
};