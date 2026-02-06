// src/screens/financeiro/estoque/EstoqueHooks.js
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

      // Certifique-se de que a view 'vw_lucro_produtos' existe no seu Supabase
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

export const useEstoqueKPIs = (produtos) => {
  // Substituí useState/useEffect por useMemo para corrigir o erro de renderização
  const kpis = useMemo(() => {
    const estadoInicial = {
      capitalParado: 0,
      produtosCriticos: 0,
      maiorGiro: null,
      maisLucrativo: null
    };

    if (!produtos || produtos.length === 0) return estadoInicial;

    const capitalParado = produtos.reduce((acc, p) => 
      acc + (p.quantidade_atual * (p.custo_unitario || 0)), 0);
    
    const produtosCriticos = produtos.filter(p => 
      p.quantidade_atual <= (p.estoque_minimo || 0)).length;
    
    const maiorGiro = produtos.reduce((max, p) => 
      (p.rotatividade || 0) > (max?.rotatividade || 0) ? p : max, null);
    
    const maisLucrativo = produtos.reduce((max, p) => 
      (p.lucro_total || 0) > (max?.lucro_total || 0) ? p : max, null);

    return {
      capitalParado,
      produtosCriticos,
      maiorGiro,
      maisLucrativo
    };
  }, [produtos]);

  return kpis;
};