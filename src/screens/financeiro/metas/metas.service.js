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
    
    // Debug para ver o que chegou
    console.log("📊 Calculando Metas. Dados disponíveis:", dadosFinanceiros);

    return metas.map(meta => {
      let valorAtual = 0;
      
      // Normaliza o texto (tudo minúsculo para evitar erros)
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
      // --- LÓGICA DE VENDAS ---
      else if (tipo.includes('venda')) {
        valorAtual = dadosFinanceiros?.quantidade_vendas || dadosFinanceiros?.total_vendas || 0;
      }
      // --- LÓGICA DE NOVOS CLIENTES (Específico) ---
      else if (tipo === 'novos_clientes' || (tipo.includes('novo') && tipo.includes('cliente'))) {
        valorAtual = dadosFinanceiros?.novos_clientes || 0;
      }
      // --- LÓGICA DE CLIENTES ATENDIDOS (Geral) ---
      else if (tipo === 'clientes_atendidos' || tipo.includes('cliente')) {
        valorAtual = dadosFinanceiros?.clientes_atendidos || dadosFinanceiros?.total_clientes || 0;
      }
      
      return {
        ...meta,
        valor_atual: valorAtual
      };
    });
  },

  async createMeta(metaData) {
    const dadosParaEnviar = {
      ...metaData,
      valor: parseFloat(metaData.valor),
      id: undefined
    };

    if (!dadosParaEnviar.salao_id) throw new Error("ID do salão não fornecido.");

    const { data, error } = await supabase
      .from('metas')
      .insert([dadosParaEnviar])
      .select()
      .single();

    if (error) {
      console.error("Erro Supabase:", error);
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