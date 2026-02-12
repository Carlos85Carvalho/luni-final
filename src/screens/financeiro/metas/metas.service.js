import { supabase } from '../../../services/supabase';

// Função auxiliar para pegar o intervalo do mês atual
const getIntervaloMensal = () => {
  const data = new Date();
  const inicio = new Date(data.getFullYear(), data.getMonth(), 1).toISOString();
  const fim = new Date(data.getFullYear(), data.getMonth() + 1, 0, 23, 59, 59).toISOString();
  return { inicio, fim };
};

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

  // CORREÇÃO AQUI: Agora a função busca os dados reais no banco
  async getMetasComProgresso(salaoId) {
    // 1. Busca as metas cadastradas
    const metas = await this.getMetas(salaoId);
    
    // 2. Define o período (Mês Atual) para cálculo do histórico
    const { inicio, fim } = getIntervaloMensal();

    // 3. Busca Agendamentos (Faturamento e Atendimentos)
    const { data: agendamentos } = await supabase
      .from('agendamentos')
      .select('valor_total, status')
      .eq('salao_id', salaoId)
      .gte('data', inicio)
      .lte('data', fim)
      .neq('status', 'cancelado');

    // 4. Busca Despesas
    const { data: despesas } = await supabase
      .from('despesas')
      .select('valor')
      .eq('salao_id', salaoId)
      .gte('data_vencimento', inicio)
      .lte('data_vencimento', fim);

    // 5. Busca Vendas (Caso você tenha uma tabela separada de vendas de produtos)
    // Se não tiver tabela de vendas, pode comentar essa parte ou usar agendamentos como base
    const { data: vendas } = await supabase
      .from('vendas') 
      .select('valor_total')
      .eq('salao_id', salaoId)
      .gte('data_venda', inicio)
      .lte('data_venda', fim);

    // --- CÁLCULOS DOS TOTAIS ---
    const faturamentoTotal = agendamentos?.reduce((acc, curr) => acc + (Number(curr.valor_total) || 0), 0) || 0;
    const vendasTotal = vendas?.reduce((acc, curr) => acc + (Number(curr.valor_total) || 0), 0) || 0;
    const despesasTotal = despesas?.reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0) || 0;
    const lucroTotal = faturamentoTotal - despesasTotal;
    const atendimentosTotal = agendamentos?.length || 0;
    
    console.log("📊 Totais Calculados:", { faturamentoTotal, despesasTotal, lucroTotal });

    // --- MAPEAMENTO PARA AS METAS ---
    return metas.map(meta => {
      let valorAtual = 0;
      const tipo = meta.tipo ? meta.tipo.toLowerCase().trim() : '';
      
      if (tipo.includes('faturamento') || tipo.includes('receita')) {
        valorAtual = faturamentoTotal;
      } 
      else if (tipo.includes('lucro')) {
        valorAtual = lucroTotal;
      } 
      else if (tipo.includes('despesa') || tipo.includes('gasto')) {
        valorAtual = despesasTotal;
      }
      else if (tipo.includes('venda')) {
        // Se a meta for em valor monetário, usa o total de vendas, senão a quantidade
        valorAtual = vendasTotal > 0 ? vendasTotal : faturamentoTotal; 
      }
      else if (tipo === 'clientes_atendidos' || tipo.includes('cliente')) {
        valorAtual = atendimentosTotal;
      }
      
      return {
        ...meta,
        valor_atual: valorAtual // Agora envia o valor real calculado do banco
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