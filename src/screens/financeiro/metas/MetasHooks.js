// src/screens/financeiro/metas/MetasHooks.js
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../../../services/supabase';
import { metasService } from './metas.service'; 
import { DollarSign, TrendingUp, Receipt, Users, ShoppingCart, Scissors, Target } from 'lucide-react';

// 🚀 AGORA O HOOK RECEBE O PERÍODO DA TELA
export const useMetas = (periodo) => {
  const [metas, setMetas] = useState([]);
  const [loading, setLoading] = useState(true);

  const criarMetasPadrao = useCallback(() => {
    const metasPadrao = [
      { id: 'meta-fat-1', tipo: 'faturamento', titulo: 'Meta de Faturamento', valor: 50000, valor_atual: 0, periodo: 'Mensal', cor: 'green', data_criacao: new Date().toISOString() },
      { id: 'meta-lucro-1', tipo: 'lucro', titulo: 'Meta de Lucro', valor: 15000, valor_atual: 0, periodo: 'Mensal', cor: 'blue', data_criacao: new Date().toISOString() },
      { id: 'meta-desp-1', tipo: 'despesas', titulo: 'Limite de Despesas', valor: 35000, valor_atual: 0, periodo: 'Mensal', cor: 'orange', inverso: true, data_criacao: new Date().toISOString() }
    ];
    setMetas(metasPadrao);
  }, []);

  const carregarMetas = useCallback(async () => {
    // Se o período ainda não foi carregado pela tela, aguarda.
    if (!periodo?.inicio || !periodo?.fim) return;

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

      // 🚀 ENVIAMOS AS DATAS (INÍCIO E FIM) PARA O SERVIÇO CALCULAR O PROGRESSO REAL!
      const metasComProgresso = await metasService.getMetasComProgresso(usuario.salao_id, periodo);

      if (metasComProgresso && metasComProgresso.length > 0) {
        setMetas(metasComProgresso);
      } else {
        criarMetasPadrao();
      }
    } catch (error) {
      console.error('Erro ao carregar metas:', error);
    } finally {
      setLoading(false);
    }
  }, [criarMetasPadrao, periodo]); // 🚀 Atualiza sempre que o período mudar!

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
    const metaAlvo = meta.valor || meta.valor_meta; 
    if (!meta || !metaAlvo || metaAlvo === 0) return 0;
    
    const atual = parseFloat(meta.valor_atual || 0);
    const alvo = parseFloat(metaAlvo);
    
    return Math.min(100, Math.max(0, (atual / alvo) * 100));
  };

  const getStatusMeta = (meta) => {
    const progresso = calcularProgresso(meta);
    const inverso = meta.inverso; 

    if (inverso) {
      if (progresso < 70) return { label: 'Dentro do Limite', color: 'text-green-400', bg: 'bg-green-500/20' };
      if (progresso < 90) return { label: 'Atenção', color: 'text-yellow-400', bg: 'bg-yellow-500/20' };
      return { label: 'Limite Excedido', color: 'text-red-400', bg: 'bg-red-500/20' };
    }
    
    if (progresso >= 100) return { label: 'Atingida', color: 'text-green-400', bg: 'bg-green-500/20' };
    if (progresso >= 50) return { label: 'Em Progresso', color: 'text-blue-400', bg: 'bg-blue-500/20' };
    return { label: 'Em Risco', color: 'text-red-400', bg: 'bg-red-500/20' };
  };

  const getIcon = (tipo) => {
    if (!tipo) return Target;
    const t = tipo.toLowerCase().trim();
    if (t.includes('faturamento') || t.includes('receita')) return DollarSign;
    if (t.includes('lucro')) return TrendingUp;
    if (t.includes('despesa') || t.includes('gasto')) return Receipt;
    if (t.includes('cliente')) return Users;
    if (t.includes('venda')) return ShoppingCart;
    if (t.includes('serviço')) return Scissors;
    return Target;
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

  return { calcularProgresso, getStatusMeta, getIcon, getColorClass, getBgColorClass, getTextColorClass };
};