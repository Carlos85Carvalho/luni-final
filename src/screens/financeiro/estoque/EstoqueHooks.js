import { useState, useCallback, useEffect, useMemo } from 'react';
import { supabase } from '../../../services/supabase';

export const useEstoque = () => {
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);

  const carregarProdutos = useCallback(async () => {
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
        .from('vw_lucro_produtos')
        .select('*')
        .eq('salao_id', usuario.salao_id)
        .order('lucro_total', { ascending: false });

      if (error) throw error;
      setProdutos(data || []);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarProdutos();
  }, [carregarProdutos]);

  return {
    produtos,
    loading,
    refresh: carregarProdutos
  };
};

// 🚀 O NOVO MOTOR DE KPIS
export const useEstoqueKPIs = (produtos) => {
  const kpis = useMemo(() => {
    const estadoInicial = {
      valorTotal: 0,
      lucroEstimado: 0, // Agora ele existe!
      qtdCriticos: 0,
      giroMedio: 0,
      margemMedia: 0,
      totalItens: 0
    };

    if (!produtos || produtos.length === 0) return estadoInicial;

    let totalCusto = 0;
    let lucroEstimado = 0;
    let qtdCriticos = 0;
    let somaGiro = 0;

    produtos.forEach(p => {
      const qtd = parseFloat(p.quantidade_atual) || 0;
      const custo = parseFloat(p.custo_unitario) || 0;
      const venda = parseFloat(p.preco_venda) || 0;
      const giro = parseFloat(p.rotatividade) || 0;

      // 1. Soma o capital investido na prateleira
      totalCusto += (qtd * custo);

      // 2. Calcula o Lucro (Apenas se for revenda E se tiver estoque positivo)
      if (venda > custo && qtd > 0) {
        lucroEstimado += (venda - custo) * qtd;
      }

      // 3. Verifica produtos críticos
      if (qtd <= (p.estoque_minimo || 0)) {
        qtdCriticos += 1;
      }

      somaGiro += giro;
    });

    // 4. Calcula as médias
    const giroMedio = produtos.length > 0 ? (somaGiro / produtos.length) : 0;
    const margemMedia = totalCusto > 0 ? (lucroEstimado / totalCusto) * 100 : 0;

    // 5. Devolve exatamente os nomes que a tela EstoqueKPIs.jsx está esperando
    return {
      valorTotal: totalCusto,
      lucroEstimado: lucroEstimado,
      qtdCriticos: qtdCriticos,
      giroMedio: giroMedio,
      margemMedia: margemMedia,
      totalItens: produtos.length
    };
  }, [produtos]);

  return kpis;
};