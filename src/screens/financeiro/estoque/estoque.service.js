// src/screens/financeiro/services/estoque.service.js
import { supabase } from '../../../services/supabase';

export const estoqueService = {
  async getProdutos(salaoId) {
    if (!salaoId) return [];
    
    const { data, error } = await supabase
      .from('vw_lucro_produtos')
      .select('*')
      .eq('salao_id', salaoId)
      .order('lucro_total', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getEstoqueCritico(salaoId) {
    if (!salaoId) return [];
    
    const { data, error } = await supabase
      .from('vw_estoque_critico')
      .select('*')
      .eq('salao_id', salaoId);

    if (error) throw error;
    return data || [];
  },

  async registrarMovimentacao(movimentacao) {
    const { data, error } = await supabase
      .from('movimentacoes_estoque')
      .insert([movimentacao])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async atualizarEstoque(produtoId, quantidadeAtual) {
    const { error } = await supabase
      .from('produtos')
      .update({ quantidade_atual: quantidadeAtual })
      .eq('id', produtoId);

    if (error) throw error;
  }
};