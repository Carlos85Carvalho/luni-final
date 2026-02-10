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
    // 1. Busca as metas do banco
    const metas = await this.getMetas(salaoId);
    
    // DEBUG: Mostra no console o que tem dentro dos dados financeiros
    // Isso ajuda a saber se o número de vendas/clientes está chegando
    console.log("📊 Calculando Metas. Dados disponíveis:", dadosFinanceiros);

    // 2. Calcula o progresso de cada uma
    return metas.map(meta => {
      let valorAtual = 0;
      
      // Normaliza o texto (tudo minúsculo para evitar erros de digitação)
      const tipo = meta.tipo ? meta.tipo.toLowerCase().trim() : '';
      
      // --- LÓGICA DE FATURAMENTO ---
      if (tipo.includes('faturamento') || tipo.includes('receita')) {
        valorAtual = dadosFinanceiros?.receita_bruta || 0;
      } 
      // --- LÓGICA DE LUCRO ---
      else if (tipo.includes('lucro')) {
        valorAtual = dadosFinanceiros?.lucro_liquido || 0;
      } 
      // --- LÓGICA DE DESPESAS ---
      else if (tipo.includes('despesa') || tipo.includes('gasto')) {
        valorAtual = (dadosFinanceiros?.despesas_pagas || 0) + (dadosFinanceiros?.despesas_pendentes || 0);
      }
      // --- LÓGICA DE VENDAS (Novo) ---
      else if (tipo.includes('venda')) {
        // Tenta encontrar o campo de quantidade de vendas
        valorAtual = dadosFinanceiros?.quantidade_vendas || dadosFinanceiros?.total_vendas || 0;
      }
      // --- LÓGICA DE CLIENTES (Novo) ---
      else if (tipo.includes('cliente')) {
        // Tenta pegar clientes atendidos, se não tiver, tenta novos clientes
        valorAtual = dadosFinanceiros?.clientes_atendidos || dadosFinanceiros?.novos_clientes || dadosFinanceiros?.total_clientes || 0;
      }
      
      return {
        ...meta,
        valor_atual: valorAtual
      };
    });
  },

  async createMeta(metaData) {
    // Tratamento de segurança
    const dadosParaEnviar = {
      ...metaData,
      valor: parseFloat(metaData.valor), // Garante que é número
      id: undefined // Remove ID para criar um novo
    };

    if (!dadosParaEnviar.salao_id) throw new Error("ID do salão não fornecido.");

    const { data, error } = await supabase
      .from('metas')
      .insert([dadosParaEnviar])
      .select()
      .single();

    if (error) {
      console.error("Erro Supabase ao criar meta:", error);
      throw error;
    }
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