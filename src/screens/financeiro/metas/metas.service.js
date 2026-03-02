// src/screens/financeiro/metas/metas.service.js
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

  async getMetasComProgresso(salaoId, periodo) {
    const metas = await this.getMetas(salaoId);
    
    if (!periodo || !periodo.inicio || !periodo.fim) return metas;

    const dataInicioQuery = `${periodo.inicio} 00:00:00`;
    const dataFimQuery = `${periodo.fim} 23:59:59`;

    // 1. Busca Agendamentos (Atendimentos do mês)
    const { data: agendamentos } = await supabase
      .from('agendamentos')
      .select('valor, valor_total, preco')
      .eq('salao_id', salaoId)
      .eq('status', 'concluido')
      .gte('data', dataInicioQuery)
      .lte('data', dataFimQuery);

    // 2. Busca Despesas do Ciclo
    const { data: despesas } = await supabase
      .from('despesas')
      .select('valor')
      .eq('salao_id', salaoId)
      .gte('data_vencimento', dataInicioQuery)
      .lte('data_vencimento', dataFimQuery);

    // 3. Busca Vendas
    const { data: vendas } = await supabase
      .from('vendas') 
      .select('total, valor_total')
      .eq('salao_id', salaoId)
      .in('status', ['concluida', 'pago'])
      .gte('data_venda', dataInicioQuery)
      .lte('data_venda', dataFimQuery);

    // 🚀 4. NOVO: BUSCA OS CLIENTES CADASTRADOS NO PERÍODO
    // Nota: Usei 'created_at' que é o padrão do Supabase. 
    // Se o seu banco usar 'data_cadastro', é só trocar aqui embaixo!
    const { data: novosClientes } = await supabase
      .from('clientes')
      .select('id')
      .eq('salao_id', salaoId)
      .gte('created_at', dataInicioQuery)
      .lte('created_at', dataFimQuery);

    // --- CÁLCULOS DOS TOTAIS ---
    const faturamentoAgenda = agendamentos?.reduce((acc, curr) => acc + (Number(curr.valor || curr.valor_total || curr.preco) || 0), 0) || 0;
    const vendasTotal = vendas?.reduce((acc, curr) => acc + (Number(curr.total || curr.valor_total) || 0), 0) || 0;
    
    const faturamentoTotal = faturamentoAgenda + vendasTotal; 
    const despesasTotal = despesas?.reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0) || 0;
    const lucroTotal = faturamentoTotal - despesasTotal;
    
    const atendimentosTotal = agendamentos?.length || 0;
    const totalNovosClientesCadastrados = novosClientes?.length || 0; // 🚀 Número real de cadastros
    
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
        valorAtual = vendasTotal > 0 ? vendasTotal : faturamentoTotal; 
      }
      // 🚀 SEPARAÇÃO INTELIGENTE DA LÓGICA
      else if (tipo.includes('novo') && tipo.includes('cliente')) {
        // Se a meta for "Novos Clientes", conta só os cadastros novos
        valorAtual = totalNovosClientesCadastrados;
      }
      else if (tipo === 'clientes_atendidos' || tipo.includes('atendimento') || tipo.includes('cliente')) {
        // Se for "Meta de Atendimentos", conta os agendamentos concluídos
        valorAtual = atendimentosTotal;
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