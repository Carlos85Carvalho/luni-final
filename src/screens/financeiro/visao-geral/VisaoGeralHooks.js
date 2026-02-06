// src/screens/financeiro/visao-geral/VisaoGeralHooks.js
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../../../services/supabase';

export const useVisaoGeral = () => {
  const [kpis, setKpis] = useState({
    receita: 0,
    despesas: 0,
    lucro: 0,
    saldo: 0
  });
  const [loading, setLoading] = useState(true);

  const carregarDadosDashboard = useCallback(async () => {
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

      const hoje = new Date();
      const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString();
      const ultimoDiaMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59).toISOString();

      // 1. Buscar Receitas do Mês (Tabela 'eventos' ou 'vendas')
      const { data: receitasData, error: errRec } = await supabase
        .from('eventos') // Ajuste se sua tabela for 'transacoes' ou 'vendas'
        .select('valor_total') // Ajuste o nome da coluna de valor
        .eq('salao_id', usuario.salao_id)
        .eq('tipo', 'receita')
        .gte('data', primeiroDiaMes)
        .lte('data', ultimoDiaMes);

      // 2. Buscar Despesas do Mês
      const { data: despesasData, error: errDesp } = await supabase
        .from('despesas')
        .select('valor')
        .eq('salao_id', usuario.salao_id)
        .gte('data_vencimento', primeiroDiaMes)
        .lte('data_vencimento', ultimoDiaMes);

      if (errRec) console.error('Erro receitas:', errRec);
      if (errDesp) console.error('Erro despesas:', errDesp);

      // Calcular Totais
      const totalReceita = (receitasData || []).reduce((acc, curr) => acc + (Number(curr.valor_total) || 0), 0);
      const totalDespesas = (despesasData || []).reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0);
      const lucro = totalReceita - totalDespesas;

      setKpis({
        receita: totalReceita,
        despesas: totalDespesas,
        lucro: lucro,
        saldo: lucro // Pode ser diferente se considerar saldo acumulado, mas por enquanto igual ao lucro do mês
      });

    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarDadosDashboard();
  }, [carregarDadosDashboard]);

  return {
    kpis,
    loading,
    refresh: carregarDadosDashboard
  };
};