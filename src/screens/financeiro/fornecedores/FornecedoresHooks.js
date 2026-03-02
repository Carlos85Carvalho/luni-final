// src/screens/financeiro/fornecedores/FornecedoresHooks.js
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../../../services/supabase';

export const useFornecedores = () => {
  const [fornecedores, setFornecedores] = useState([]);
  const [loading, setLoading] = useState(true);

  const carregarFornecedores = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: usuario } = await supabase
        .from('usuarios')
        .select('salao_id')
        .eq('id', user.id)
        .single();

      if (!usuario?.salao_id) return;

      const { data, error } = await supabase
        .from('fornecedores')
        .select('*')
        .eq('salao_id', usuario.salao_id)
        .order('nome');

      if (error) throw error;
      setFornecedores(data || []);
    } catch (error) {
      console.error('Erro ao carregar fornecedores:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarFornecedores();
  }, [carregarFornecedores]);

  return {
    fornecedores,
    loading,
    refresh: carregarFornecedores
  };
};

export const useFornecedoresKPIs = (fornecedores) => {
  const [kpis, setKpis] = useState({
    ranking: [],
    totalGasto: 0,
    fornecedorTop: null,
    indiceDependencia: 0
  });

  const [rankingLoading, setRankingLoading] = useState(true);

  const carregarRanking = useCallback(async () => {
    setRankingLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: usuario } = await supabase
        .from('usuarios')
        .select('salao_id')
        .eq('id', user.id)
        .single();

      if (!usuario?.salao_id) return;

      const { data: rankingData } = await supabase
        .from('vw_ranking_fornecedores')
        .select('*')
        .eq('salao_id', usuario.salao_id)
        .limit(5);

      const ranking = rankingData || [];
      
      // 1. Calcula o total somando os gastos de todos os fornecedores
      const totalGasto = ranking.reduce((acc, f) => acc + Number(f.total_gasto || 0), 0);
      
      // 2. Pega o Fornecedor Top 1
      const fornecedorTop = ranking.length > 0 ? ranking[0] : null;
      
      // 3. 🚀 MATEMÁTICA REAL DO ÍNDICE DE DEPENDÊNCIA
      let indiceDependencia = 0;
      if (totalGasto > 0 && fornecedorTop) {
        // (Gasto com o Top 1 / Total Gasto) * 100
        const calculoReal = (Number(fornecedorTop.total_gasto) / totalGasto) * 100;
        indiceDependencia = Math.round(calculoReal); // Arredonda para não ficar números quebrados (ex: 73.54%)
      }

      setKpis({
        ranking,
        totalGasto,
        fornecedorTop,
        indiceDependencia
      });
    } catch (error) {
      console.error('Erro ao carregar ranking:', error);
    } finally {
      setRankingLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarRanking();
  }, [carregarRanking, fornecedores]);

  return {
    ...kpis,
    rankingLoading
  };
};