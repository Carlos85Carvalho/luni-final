// src/screens/financeiro/visao-geral/VisaoGeralHooks.js
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../../../services/supabase';

export const useVisaoGeral = () => {
  const [kpis, setKpis] = useState({ receita: 0, despesas: 0, lucro: 0, saldo: 0 });
  const [graficoEvolucao, setGraficoEvolucao] = useState([]);
  const [graficoDistribuicao, setGraficoDistribuicao] = useState([]);
  const [loading, setLoading] = useState(true);

  const carregarDadosDashboard = useCallback(async () => {
    setLoading(true);
    try {
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
      if (!salaoId) salaoId = user.id;

      // 1. BUSCA DAS VIEWS (Agora o Supabase já traz a soma completa da Receita!)
      const { data: dataKPI } = await supabase.from('vw_visao_geral_kpis').select('*').eq('salao_id', salaoId).maybeSingle();
      const { data: evolucaoData } = await supabase.from('vw_grafico_evolucao').select('mes_abreviado, receita, despesa').eq('salao_id', salaoId).order('data_ordenacao', { ascending: true });
      const { data: distribuicaoData } = await supabase.from('vw_grafico_distribuicao').select('categoria, valor_total').eq('salao_id', salaoId);

      // 2. BUSCA DA AGENDA (Apenas para arrumar o Gráfico de Barras dos últimos 6 meses)
      const hoje = new Date();
      const mesAtualIndex = hoje.getMonth();
      const anoAtual = hoje.getFullYear();

      const dataSeisMesesAtras = new Date(anoAtual, mesAtualIndex - 5, 1);
      const dataInicialStr = dataSeisMesesAtras.toISOString().split('T')[0];

      const { data: agendamentosData } = await supabase
        .from('agendamentos')
        .select('*, servicos(preco_base)')
        .eq('salao_id', salaoId)
        .eq('status', 'concluido')
        .gte('data', dataInicialStr);

      // 3. CÁLCULO DA AGENDA POR MÊS (Para o Gráfico)
      const receitaAgendaPorMes = {};
      const mesesNomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

      (agendamentosData || []).forEach(ag => {
        const valorAgendamento = Number(ag.valor || ag.valor_total || ag.preco || ag.servicos?.preco_base || 0);
        if (valorAgendamento === 0) return;

        const [ano, mes] = ag.data?.split('T')[0].split('-') || [];
        if (!ano || !mes) return;
        
        const mesAg = parseInt(mes, 10) - 1;
        const nomeMes = mesesNomes[mesAg];
        
        if (!receitaAgendaPorMes[nomeMes]) receitaAgendaPorMes[nomeMes] = 0;
        receitaAgendaPorMes[nomeMes] += valorAgendamento;
      });

      // 4. ATUALIZANDO OS KPIS (Puxando direto da View Consertada do Supabase)
      const receitaTotal = Number(dataKPI?.receita || 0); // 🚀 O Supabase já manda o valor perfeito!
      const despesas = Number(dataKPI?.despesas || 0);
      const lucro = receitaTotal - despesas;

      setKpis({
        receita: receitaTotal,
        despesas,
        lucro,
        saldo: lucro
      });

      // 5. ATUALIZANDO O GRÁFICO DE BARRAS
      const evolucaoFormatada = (evolucaoData || []).map(item => {
        const extraAgenda = receitaAgendaPorMes[item.mes_abreviado] || 0;
        return {
          name: item.mes_abreviado,
          Receita: Number(item.receita) + extraAgenda,
          Despesa: Number(item.despesa)
        };
      });
      setGraficoEvolucao(evolucaoFormatada);

      // 6. ATUALIZANDO O GRÁFICO DE PIZZA
      const distribuicaoFormatada = (distribuicaoData || []).map(item => ({
        name: item.categoria || 'Outros',
        value: Number(item.valor_total)
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

  return { kpis, graficoEvolucao, graficoDistribuicao, loading, refresh: carregarDadosDashboard };
};