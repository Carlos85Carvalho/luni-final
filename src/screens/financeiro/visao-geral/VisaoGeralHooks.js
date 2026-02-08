// src/screens/financeiro/visao-geral/VisaoGeralHooks.js
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../../../services/supabase';

export const useVisaoGeral = () => {
  // Estado dos KPIs (Cards do topo)
  const [kpis, setKpis] = useState({
    receita: 0,
    despesas: 0,
    lucro: 0,
    saldo: 0
  });

  // Novos estados para os Gráficos
  const [graficoEvolucao, setGraficoEvolucao] = useState([]);
  const [graficoDistribuicao, setGraficoDistribuicao] = useState([]);
  
  const [loading, setLoading] = useState(true);

  const carregarDadosDashboard = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Identifica o usuário e o salão
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let salaoId = user.user_metadata?.salao_id;

      if (!salaoId) {
          const { data: usuario } = await supabase
            .from('usuarios')
            .select('salao_id')
            .eq('id', user.id)
            .single();
          salaoId = usuario?.salao_id;
      }
      
      // Fallback final
      if (!salaoId) salaoId = user.id;

      // ==========================================================
      // BUSCA 1: KPIs (Cards do Topo - Mês Atual)
      // ==========================================================
      const { data: dataKPI, error: errorKPI } = await supabase
        .from('vw_visao_geral_kpis')
        .select('*')
        .eq('salao_id', salaoId)
        .maybeSingle();

      if (errorKPI) console.error('Erro KPIs:', errorKPI);

      const receita = Number(dataKPI?.receita || 0);
      const despesas = Number(dataKPI?.despesas || 0);
      const lucro = receita - despesas;

      setKpis({
        receita,
        despesas,
        lucro,
        saldo: lucro
      });

      // ==========================================================
      // BUSCA 2: Gráfico de Evolução (Barras - Últimos 6 meses)
      // ==========================================================
      const { data: evolucaoData, error: errorEvo } = await supabase
        .from('vw_grafico_evolucao')
        .select('mes_abreviado, receita, despesa')
        .eq('salao_id', salaoId)
        .order('data_ordenacao', { ascending: true });

      if (errorEvo) console.error('Erro Gráfico Evolução:', errorEvo);

      // Formata para o Recharts (Array de objetos com chaves numéricas)
      const evolucaoFormatada = (evolucaoData || []).map(item => ({
        name: item.mes_abreviado,      // Eixo X (Jan, Fev...)
        Receita: Number(item.receita), // Barra Roxa
        Despesa: Number(item.despesa)  // Barra Rosa
      }));
      setGraficoEvolucao(evolucaoFormatada);

      // ==========================================================
      // BUSCA 3: Gráfico de Distribuição (Pizza - Despesas do Mês)
      // ==========================================================
      const { data: distribuicaoData, error: errorDist } = await supabase
        .from('vw_grafico_distribuicao')
        .select('categoria, valor_total')
        .eq('salao_id', salaoId);

      if (errorDist) console.error('Erro Gráfico Pizza:', errorDist);

      // Formata para o Recharts (name e value)
      const distribuicaoFormatada = (distribuicaoData || []).map(item => ({
        name: item.categoria || 'Outros', // Legenda
        value: Number(item.valor_total)   // Tamanho da fatia
      }));
      setGraficoDistribuicao(distribuicaoFormatada);

    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarDadosDashboard();
  }, [carregarDadosDashboard]);

  // Retorna tudo para a tela usar
  return {
    kpis,
    graficoEvolucao,
    graficoDistribuicao,
    loading,
    refresh: carregarDadosDashboard
  };
};