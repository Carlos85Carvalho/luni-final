// src/screens/financeiro/despesas/DespesasHooks.js
import { useState, useCallback, useEffect, useMemo } from 'react';
import { supabase } from '../../../services/supabase';

export const useDespesas = () => {
  // 🚀 Agora guardamos TODAS as despesas na memória para filtrar super rápido
  const [todasDespesas, setTodasDespesas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroAtivo, setFiltroAtivo] = useState('mes');

  const [periodo, setPeriodo] = useState({
    inicio: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    fim: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]
  });

  const aplicarAtalho = (tipo) => {
    const hoje = new Date();
    const fuso = hoje.getTimezoneOffset() * 60000;
    const hojeLocal = new Date(hoje - fuso).toISOString().split('T')[0];

    let inicio, fim;

    if (tipo === 'hoje') {
      inicio = hojeLocal;
      fim = hojeLocal;
    } else if (tipo === 'semana') {
      const d = new Date(hoje - fuso);
      const diff = d.getDate() - d.getDay();
      inicio = new Date(d.setDate(diff)).toISOString().split('T')[0];
      fim = hojeLocal;
    } else if (tipo === 'mes') {
      inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0];
      fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().split('T')[0];
    } else if (tipo === 'ano') {
      inicio = new Date(hoje.getFullYear(), 0, 1).toISOString().split('T')[0];
      fim = new Date(hoje.getFullYear(), 11, 31).toISOString().split('T')[0];
    }

    setFiltroAtivo(tipo);
    setPeriodo({ inicio, fim });
  };

  const fetchDespesas = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      let salaoId = user.user_metadata?.salao_id || user.id;

      // Busca tudo uma vez só, sem restrição de data!
      const { data, error } = await supabase
        .from('despesas')
        .select('*')
        .eq('salao_id', salaoId)
        .order('data_vencimento', { ascending: false });

      if (error) throw error;
      setTodasDespesas(data || []);
    } catch (error) {
      console.error('Erro ao buscar despesas:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDespesas();
  }, [fetchDespesas]);

  // 🚀 A MÁGICA INSTANTÂNEA: Filtra o que está na memória toda vez que a data muda
  const despesasFiltradas = useMemo(() => {
    return todasDespesas.filter(d => {
      const dataVenc = d.data_vencimento ? d.data_vencimento.split('T')[0] : '';
      const isPendente = d.status === 'pendente' || d.pago === false;
      
      // A conta é do período que você clicou?
      const noPeriodo = dataVenc >= periodo.inicio && dataVenc <= periodo.fim;
      
      // É uma dívida velha que ficou pra trás?
      const atrasada = isPendente && dataVenc < periodo.inicio;

      // Se for de hoje/mês, ou se for atrasada, ELA APARECE!
      return noPeriodo || atrasada;
    });
  }, [todasDespesas, periodo]);

  return { 
    despesas: despesasFiltradas, // Manda pra tela só as filtradas!
    loading, 
    refresh: fetchDespesas,
    periodo, setPeriodo,
    filtroAtivo, setFiltroAtivo,
    aplicarAtalho
  };
};