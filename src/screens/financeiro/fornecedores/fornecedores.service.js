// src/screens/financeiro/services/fornecedores.service.js
import { supabase } from '../../../services/supabase';

export const fornecedoresService = {
  async getFornecedores(salaoId) {
    if (!salaoId) return [];
    
    const { data, error } = await supabase
      .from('fornecedores')
      .select('*')
      .eq('salao_id', salaoId)
      .order('nome');

    if (error) throw error;
    return data || [];
  },

  async getRankingFornecedores(salaoId) {
    if (!salaoId) return [];
    
    const { data, error } = await supabase
      .from('vw_ranking_fornecedores')
      .select('*')
      .eq('salao_id', salaoId)
      .limit(5);

    if (error) throw error;
    return data || [];
  },

  async getComprasFornecedor(fornecedorId, salaoId) {
    if (!fornecedorId || !salaoId) return [];
    
    const { data, error } = await supabase
      .from('compras')
      .select(`
        *,
        produtos:produto_id(nome)
      `)
      .eq('fornecedor_id', fornecedorId)
      .eq('salao_id', salaoId)
      .order('data_compra', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createFornecedor(fornecedorData) {
    const { data, error } = await supabase
      .from('fornecedores')
      .insert([fornecedorData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateFornecedor(fornecedorId, fornecedorData) {
    const { error } = await supabase
      .from('fornecedores')
      .update(fornecedorData)
      .eq('id', fornecedorId);

    if (error) throw error;
  }
};