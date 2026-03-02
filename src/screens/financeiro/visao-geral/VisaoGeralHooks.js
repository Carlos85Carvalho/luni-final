// src/screens/financeiro/visao-geral/VisaoGeralHooks.js
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../../../services/supabase';

export const useVisaoGeral = () => {
  const [kpis, setKpis] = useState({ receita: 0, despesas: 0, lucro: 0, saldo: 0, labelFiltro: 'Este Mês' });
  const [graficoEvolucao, setGraficoEvolucao] = useState([]);
  const [graficoDistribuicao, setGraficoDistribuicao] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroAtivo, setFiltroAtivo] = useState('mes');

  // Inicializa o estado com o mês atual
  const [periodo, setPeriodo] = useState({
    inicio: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    fim: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]
  });

  const aplicarAtalho = (tipo) => {
    const hoje = new Date();
    // Ajuste de fuso horário do Brasil
    const fuso = hoje.getTimezoneOffset() * 60000;
    const hojeLocal = new Date(hoje - fuso).toISOString().split('T')[0];
    
    let inicio, fim, label;

    if (tipo === 'hoje') {
      inicio = hojeLocal;
      fim = hojeLocal;
      label = 'Hoje';
    } else if (tipo === 'semana') {
      const d = new Date(hoje - fuso);
      const diff = d.getDate() - d.getDay(); // Vai para o Domingo
      inicio = new Date(d.setDate(diff)).toISOString().split('T')[0];
      fim = hojeLocal;
      label = 'Esta Semana';
    } else if (tipo === 'mes') {
      inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0];
      fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().split('T')[0];
      label = 'Este Mês';
    } else if (tipo === 'ano') {
      inicio = new Date(hoje.getFullYear(), 0, 1).toISOString().split('T')[0];
      fim = new Date(hoje.getFullYear(), 11, 31).toISOString().split('T')[0];
      label = 'Este Ano';
    }

    setFiltroAtivo(tipo);
    setPeriodo({ inicio, fim });
    setKpis(prev => ({ ...prev, labelFiltro: label }));
  };

  const carregarDadosDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      let salaoId = user.user_metadata?.salao_id || user.id;

      // 🚀 CORREÇÃO CRÍTICA DO 'HOJE': Adiciona a hora final para não perder as vendas do dia
      const dataInicioQuery = `${periodo.inicio} 00:00:00`;
      const dataFimQuery = `${periodo.fim} 23:59:59`;

      const [vendas, agendamentos, despesasData] = await Promise.all([
        supabase.from('vendas').select('total').eq('salao_id', salaoId).in('status', ['concluida', 'pago']).gte('data_venda', dataInicioQuery).lte('data_venda', dataFimQuery),
        supabase.from('agendamentos').select('valor, valor_total, preco').eq('salao_id', salaoId).eq('status', 'concluido').gte('data', dataInicioQuery).lte('data', dataFimQuery),
        supabase.from('despesas').select('valor, categoria, status, data_vencimento, recorrente').eq('salao_id', salaoId)
      ]);

      const recTotal = (vendas.data || []).reduce((acc, v) => acc + Number(v.total), 0) + 
                       (agendamentos.data || []).reduce((acc, a) => acc + Number(a.valor || a.valor_total || a.preco || 0), 0);

      // 🚀 LÓGICA DE DESPESAS (Atuais + Atrasadas + Projeção do Ano)
      let despTotal = 0;
      const catMap = {};
      const mesesRestantes = 12 - (new Date().getMonth() + 1); 

      (despesasData.data || []).forEach(d => {
        const valor = Number(d.valor);
        const dataVenc = d.data_vencimento ? d.data_vencimento.split('T')[0] : '';
        
        const noPeriodo = dataVenc >= periodo.inicio && dataVenc <= periodo.fim;
        const atrasada = d.status === 'pendente' && dataVenc < periodo.inicio;

        if (noPeriodo || atrasada) {
          despTotal += valor;
          catMap[d.categoria || 'Outros'] = (catMap[d.categoria || 'Outros'] || 0) + valor;
        }

        // Se filtrar o ANO, projeta o Aluguel para o futuro
        if (filtroAtivo === 'ano' && d.recorrente) {
          const projecao = valor * mesesRestantes;
          despTotal += projecao;
          catMap[d.categoria || 'Outros'] = (catMap[d.categoria || 'Outros'] || 0) + projecao;
        }
      });

      setKpis(prev => ({ ...prev, receita: recTotal, despesas: despTotal, lucro: recTotal - despTotal, saldo: recTotal - despTotal }));
      setGraficoDistribuicao(Object.keys(catMap).map(c => ({ name: c, value: catMap[c] })));

      const { data: evo } = await supabase.from('vw_grafico_evolucao').select('mes_abreviado, receita, despesa').eq('salao_id', salaoId).order('data_ordenacao');
      setGraficoEvolucao((evo || []).map(i => ({ name: i.mes_abreviado, Receita: Number(i.receita), Despesa: Number(i.despesa) })));

    } catch (e) { console.error("Erro Dashboard:", e); } finally { setLoading(false); }
  }, [periodo, filtroAtivo]);

  useEffect(() => { carregarDadosDashboard(); }, [carregarDadosDashboard]);

  return { kpis, periodo, setPeriodo, filtroAtivo, setFiltroAtivo, aplicarAtalho, graficoEvolucao, graficoDistribuicao, loading, refresh: carregarDadosDashboard };
};