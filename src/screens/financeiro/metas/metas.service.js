// src/screens/financeiro/services/metas.service.js
import { supabase } from '../../../services/supabase';

export const metasService = {
  async getMetas(salaoId) {
    if (!salaoId) return [];
    
    const { data, error } = await supabase
      .from('metas')
      .select('*')
      .eq('salao_id', salaoId)
      .order('data_criacao', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getMetasComProgresso(salaoId, dadosFinanceiros) {
    const metas = await this.getMetas(salaoId);
    
    // Calcular valores atuais com base nos dados financeiros
    return metas.map(meta => {
      let valorAtual = 0;
      
      switch(meta.tipo) {
        case 'faturamento':
          valorAtual = dadosFinanceiros?.receita_bruta || 0;
          break;
        case 'lucro':
          valorAtual = dadosFinanceiros?.lucro_liquido || 0;
          break;
        case 'despesas':
          valorAtual = (dadosFinanceiros?.despesas_pagas || 0) + (dadosFinanceiros?.despesas_pendentes || 0);
          break;
        // Adicionar mais tipos conforme necessário
      }
      
      return {
        ...meta,
        valor_atual: valorAtual
      };
    });
  },

  async createMeta(metaData) {
    const { data, error } = await supabase
      .from('metas')
      .insert([metaData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateMeta(metaId, metaData) {
    const { error } = await supabase
      .from('metas')
      .update(metaData)
      .eq('id', metaId);

    if (error) throw error;
  },

  async deleteMeta(metaId) {
    const { error } = await supabase
      .from('metas')
      .delete()
      .eq('id', metaId);

    if (error) throw error;
  }
};