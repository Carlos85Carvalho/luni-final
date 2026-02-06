// src/screens/financeiro/metas/MetasHooks.js
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../../../services/supabase';
// Adicionei os imports que faltavam do lucide-react
import { DollarSign, TrendingUp, Receipt, Users, ShoppingCart, Scissors, Target } from 'lucide-react';

export const useMetas = () => {
  const [metas, setMetas] = useState([]);
  const [loading, setLoading] = useState(true);

  // Função auxiliar para criar metas padrão caso não existam no banco
  const criarMetasPadrao = useCallback(() => {
    // Valores padrão zerados se não houver resumo financeiro disponível
    const metasPadrao = [
      {
        id: 'meta-fat-1',
        tipo: 'faturamento',
        titulo: 'Meta de Faturamento',
        valor_meta: 50000,
        valor_atual: 0, // Será atualizado quando integrar com o dashboard real
        periodo: 'Mensal',
        cor: 'green',
        data_criacao: new Date().toISOString()
      },
      {
        id: 'meta-lucro-1',
        tipo: 'lucro',
        titulo: 'Meta de Lucro',
        valor_meta: 15000,
        valor_atual: 0,
        periodo: 'Mensal',
        cor: 'blue',
        data_criacao: new Date().toISOString()
      },
      {
        id: 'meta-desp-1',
        tipo: 'despesas',
        titulo: 'Limite de Despesas',
        valor_meta: 35000,
        valor_atual: 0,
        periodo: 'Mensal',
        cor: 'orange',
        inverso: true, // Meta de teto (não ultrapassar)
        data_criacao: new Date().toISOString()
      }
    ];
    
    setMetas(metasPadrao);
  }, []);

  const carregarMetas = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: usuario } = await supabase
        .from('usuarios')
        .select('salao_id')
        .eq('id', user.id)
        .single();

      if (!usuario?.salao_id) {
        criarMetasPadrao();
        return;
      }

      // Busca as metas salvas no banco
      const { data, error } = await supabase
        .from('metas')
        .select('*')
        .eq('salao_id', usuario.salao_id)
        .order('data_criacao', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        setMetas(data);
      } else {
        // Se não tiver metas salvas, mostra as padrão (mock)
        criarMetasPadrao();
      }
    } catch (error) {
      console.error('Erro ao carregar metas:', error);
      criarMetasPadrao();
    } finally {
      setLoading(false);
    }
  }, [criarMetasPadrao]);

  useEffect(() => {
    carregarMetas();
  }, [carregarMetas]);

  return {
    metas,
    loading,
    refresh: carregarMetas
  };
};

export const useMetaCalculations = () => {
  const calcularProgresso = (meta) => {
    if (!meta || !meta.valor_meta || meta.valor_meta === 0) return 0;
    
    const atual = parseFloat(meta.valor_atual || 0);
    const alvo = parseFloat(meta.valor_meta);

    if (meta.inverso) {
      // Para despesas: quanto menor melhor. 
      // Se atual <= meta, está 100% ok. Se passou, o progresso cai.
      return atual <= alvo 
        ? 100 
        : Math.max(0, 100 - ((atual - alvo) / alvo * 100));
    }
    // Para receitas: quanto maior melhor.
    return Math.min(100, (atual / alvo) * 100);
  };

  const getStatusMeta = (progresso, inverso = false) => {
    if (inverso) {
      if (progresso >= 90) return { label: 'Dentro do Limite', color: 'text-green-400', bg: 'bg-green-500/20' };
      if (progresso >= 70) return { label: 'Atenção', color: 'text-yellow-400', bg: 'bg-yellow-500/20' };
      return { label: 'Acima do Limite', color: 'text-red-400', bg: 'bg-red-500/20' };
    }
    if (progresso >= 100) return { label: 'Atingida', color: 'text-green-400', bg: 'bg-green-500/20' };
    if (progresso >= 70) return { label: 'Em Progresso', color: 'text-blue-400', bg: 'bg-blue-500/20' };
    return { label: 'Em Risco', color: 'text-red-400', bg: 'bg-red-500/20' };
  };

  const getIcon = (tipo) => {
    const icons = {
      faturamento: DollarSign,
      lucro: TrendingUp,
      despesas: Receipt,
      clientes: Users,
      vendas: ShoppingCart,
      servicos: Scissors,
      default: Target
    };
    return icons[tipo] || icons.default;
  };

  const getColorClass = (cor) => {
    const classes = {
      green: 'from-green-500 to-green-600',
      blue: 'from-blue-500 to-blue-600',
      orange: 'from-orange-500 to-orange-600',
      purple: 'from-purple-500 to-purple-600',
      red: 'from-red-500 to-red-600',
      default: 'from-purple-500 to-purple-600'
    };
    return classes[cor] || classes.default;
  };

  const getBgColorClass = (cor) => {
    const classes = {
      green: 'bg-green-500/10',
      blue: 'bg-blue-500/10',
      orange: 'bg-orange-500/10',
      purple: 'bg-purple-500/10',
      red: 'bg-red-500/10',
      default: 'bg-purple-500/10'
    };
    return classes[cor] || classes.default;
  };

  const getTextColorClass = (cor) => {
    const classes = {
      green: 'text-green-400',
      blue: 'text-blue-400',
      orange: 'text-orange-400',
      purple: 'text-purple-400',
      red: 'text-red-400',
      default: 'text-purple-400'
    };
    return classes[cor] || classes.default;
  };

  return {
    calcularProgresso,
    getStatusMeta,
    getIcon,
    getColorClass,
    getBgColorClass,
    getTextColorClass
  };
};