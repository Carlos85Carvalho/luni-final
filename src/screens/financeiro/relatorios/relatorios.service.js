// src/screens/financeiro/relatorios/relatorios.service.js
import { supabase } from '../../../services/supabase';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const relatoriosService = {
  
  // ==============================================================================
  // 1. BUSCAS DE DADOS (DATA FETCHING)
  // ==============================================================================

  async getDadosVendasProdutos(salaoId, dataInicio, dataFim) {
    try {
      const { data, error } = await supabase
        .from('vendas_itens') 
        .select(`
          quantidade, valor_total, valor_unitario,
          produtos(nome), 
          vendas!inner(data_venda, status, salao_id)
        `)
        .eq('vendas.salao_id', salaoId)
        .not('produto_id', 'is', null) 
        .gte('vendas.data_venda', dataInicio)
        .lte('vendas.data_venda', dataFim)
        .neq('vendas.status', 'cancelado');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar vendas de produtos:', error);
      return [];
    }
  },

  async getDadosFinanceiros(salaoId, dataInicio, dataFim) {
    if (!salaoId) return { agendamentos: [], vendas: [], despesas: [] };

    try {
      const [agendamentosResult, vendasResult, despesasResult] = await Promise.all([
        supabase.from('agendamentos').select('*, clientes(nome)').eq('salao_id', salaoId)
          .gte('data', dataInicio).lte('data', dataFim).neq('status', 'cancelado'),
        supabase.from('vendas').select('*, vendas_itens(*, produtos(nome), servicos(nome))') 
          .eq('salao_id', salaoId)
          .gte('data_venda', dataInicio).lte('data_venda', dataFim).neq('status', 'cancelado'),
        supabase.from('despesas').select('*').eq('salao_id', salaoId)
          .gte('data_vencimento', dataInicio).lte('data_vencimento', dataFim)
      ]);

      return {
        agendamentos: agendamentosResult.data || [],
        vendas: vendasResult.data || [],
        despesas: despesasResult.data || []
      };
    } catch (error) {
      console.error('❌ [SERVICE] Erro financeiro:', error);
      return { agendamentos: [], vendas: [], despesas: [] };
    }
  },

  async getDadosEstoque(salaoId) {
    try {
      const { data } = await supabase.from('produtos').select('*').eq('salao_id', salaoId);
      return data || [];
    } catch { return []; }
  },

  async getDadosClientes(salaoId, dataInicio, dataFim) {
    try {
      const { data } = await supabase
        .from('agendamentos')
        .select('cliente_id, valor, valor_total, clientes(nome)')
        .eq('salao_id', salaoId)
        .gte('data', dataInicio)
        .lte('data', dataFim)
        .neq('status', 'cancelado');
      return data || [];
    } catch { return []; }
  },

  async getDadosFornecedores(salaoId) {
    try {
      const { data } = await supabase.from('fornecedores').select('*, despesas(*)').eq('salao_id', salaoId);
      return data || [];
    } catch { return []; }
  },

  // ==============================================================================
  // 2. CONTROLADOR DE RELATÓRIOS (CORRIGIDO PARA METAS)
  // ==============================================================================
  
  async gerarRelatorioCompleto(salaoId, tipo, periodo, filtros = {}) {
    const { dataInicio, dataFim } = this.calcularPeriodo(periodo);
    
    let relatorio = {
      tipo, periodo, filtros,
      titulo: `Relatório de ${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`,
      dataGeracao: new Date().toISOString(),
      resumo: {}, detalhes: [], graficos: []
    };

    try {
      switch (tipo) {
        case 'vendas_produtos': {
          relatorio.titulo = "Relatório de Vendas de Produtos";
          const dados = await this.getDadosVendasProdutos(salaoId, dataInicio, dataFim);
          const agrupado = {};
          let totalFaturado = 0;
          let totalItens = 0;
          dados.forEach(item => {
            const nome = item.produtos?.nome || 'Produto sem nome'; 
            if (!agrupado[nome]) agrupado[nome] = { produto: nome, qtd: 0, total: 0 };
            const qtd = Number(item.quantidade) || 0;
            const val = Number(item.valor_total) || 0;
            agrupado[nome].qtd += qtd;
            agrupado[nome].total += val;
            totalFaturado += val;
            totalItens += qtd;
          });
          relatorio.resumo = { faturamentoTotal: totalFaturado, produtosVendidos: totalItens, itensDistintos: Object.keys(agrupado).length };
          relatorio.detalhes = Object.values(agrupado).sort((a, b) => b.total - a.total).map(item => ({
            Produto: item.produto, 'Qtd. Vendida': item.qtd, 'Total (R$)': this.formatarMoeda(item.total)
          }));
          break;
        }

        // --- AQUI ESTÁ A GRANDE DIFERENÇA: CASO DE METAS ---
        case 'metas': {
          relatorio.titulo = "Relatório de Metas e Performance";
          const dadosFin = await this.getDadosFinanceiros(salaoId, dataInicio, dataFim);
          // Busca meta ou usa R$ 5.000 como padrão
          const { data: metaConfig } = await supabase.from('metas').select('*').eq('salao_id', salaoId).maybeSingle();
          relatorio = { ...relatorio, ...this.processarRelatorioMetas(dadosFin, metaConfig) };
          break;
        }

        case 'financeiro':
        case 'vendas': { 
          const dadosFin = await this.getDadosFinanceiros(salaoId, dataInicio, dataFim);
          const processado = this.processarRelatorioFinanceiro(dadosFin);
          relatorio = { ...relatorio, ...processado };
          if (tipo === 'vendas') relatorio.titulo = "Relatório Geral de Vendas";
          break;
        }
        case 'estoque': {
          const dadosEst = await this.getDadosEstoque(salaoId);
          relatorio = { ...relatorio, ...this.processarRelatorioEstoque(dadosEst) };
          break;
        }
        case 'clientes': {
          const dadosCli = await this.getDadosClientes(salaoId, dataInicio, dataFim);
          relatorio = { ...relatorio, ...this.processarRelatorioClientes(dadosCli) };
          break;
        }
        case 'fornecedores': {
          const dadosForn = await this.getDadosFornecedores(salaoId);
          relatorio = { ...relatorio, ...this.processarRelatorioFornecedores(dadosForn) };
          break;
        }
        default: {
          const dadosFin = await this.getDadosFinanceiros(salaoId, dataInicio, dataFim);
          relatorio = { ...relatorio, ...this.processarRelatorioFinanceiro(dadosFin) };
        }
      }
      return relatorio;
    } catch (error) {
      console.error('❌ Erro geração:', error);
      return relatorio;
    }
  },

  // ==============================================================================
  // 3. PROCESSADORES DE DADOS
  // ==============================================================================

  // NOVA FUNÇÃO: Transforma dados financeiros em progresso de metas
  processarRelatorioMetas(dados, metaConfig) {
    const fin = this.processarRelatorioFinanceiro(dados);
    const valorObjetivo = metaConfig?.valor_objetivo || 5000;
    const progresso = (fin.resumo.receitaTotal / valorObjetivo) * 100;

    return {
      resumo: {
        receitaTotal: fin.resumo.receitaTotal,
        metaMensal: valorObjetivo,
        progressoMeta: progresso,
        faltaParaMeta: Math.max(0, valorObjetivo - fin.resumo.receitaTotal),
        qtdServicos: fin.resumo.qtdServicos
      },
      detalhes: fin.detalhes,
      graficos: fin.graficos
    };
  },

  processarRelatorioFinanceiro(dados) {
    if (!dados) return { resumo: {}, detalhes: [], graficos: [] };
    const totalVendas = dados.vendas.reduce((acc, v) => acc + (Number(v.total) || Number(v.valor_total) || 0), 0);
    const totalServicos = dados.agendamentos.reduce((acc, r) => acc + (Number(r.valor_total) || Number(r.valor) || 0), 0);
    const despesaTotal = dados.despesas.reduce((acc, d) => acc + (Number(d.valor) || 0), 0);
    const receitaTotal = totalServicos + totalVendas;
    const lucroLiquido = receitaTotal - despesaTotal;
    const margemLucro = receitaTotal > 0 ? (lucroLiquido / receitaTotal * 100) : 0;

    return {
      resumo: { receitaTotal, lucroLiquido, despesaTotal, totalServicos, totalVendas, margemLucro, qtdServicos: dados.agendamentos.length, qtdVendas: dados.vendas.length },
      detalhes: [
        ...this.agruparPorCategoria(dados.agendamentos, 'Serviço'),
        ...this.agruparPorCategoria(dados.vendas, 'Venda'),
        ...this.agruparPorCategoria(dados.despesas, 'Despesa')
      ],
      graficos: [
        { name: 'Serviços', valor: totalServicos, fill: '#8B5CF6' },
        { name: 'Produtos', valor: totalVendas, fill: '#10B981' },
        { name: 'Despesas', valor: despesaTotal, fill: '#EF4444' }
      ]
    };
  },

  processarRelatorioEstoque(produtos) {
    const valorTotalEstoque = produtos.reduce((acc, p) => {
      const qtd = Number(p.quantidade_atual) || Number(p.estoque) || 0;
      const custo = Number(p.custo) || Number(p.custo_unitario) || 0;
      return acc + (qtd * custo);
    }, 0);
    const produtosCriticos = produtos.filter(p => {
      const atual = Number(p.quantidade_atual) || Number(p.estoque) || 0;
      return atual <= (p.estoque_minimo || 5);
    });
    return {
      resumo: { itensCadastrados: produtos.length, valorTotalEstoque, produtosCriticos: produtosCriticos.length },
      detalhes: produtos.map(p => ({
        Produto: p.nome, Estoque: p.quantidade_atual || p.estoque || 0,
        Custo: this.formatarMoeda(p.custo || p.custo_unitario || 0),
        'Preço Venda': this.formatarMoeda(p.preco_venda || 0),
        Status: (p.quantidade_atual || p.estoque || 0) <= (p.estoque_minimo || 5) ? 'CRÍTICO' : 'OK'
      }))
    };
  },

  processarRelatorioClientes(dados) {
    const mapClientes = {};
    dados.forEach(item => {
      const nome = item.clientes?.nome || 'Cliente Não Identificado';
      if (!mapClientes[nome]) mapClientes[nome] = { total: 0, visitas: 0 };
      mapClientes[nome].total += (Number(item.valor_total) || Number(item.valor) || 0);
      mapClientes[nome].visitas += 1;
    });
    const lista = Object.entries(mapClientes).map(([nome, info]) => ({ 
      Cliente: nome, 'Gasto Total': this.formatarMoeda(info.total), Visitas: info.visitas, rawTotal: info.total 
    })).sort((a, b) => b.rawTotal - a.rawTotal);

    const totalGasto = lista.reduce((acc, c) => acc + c.rawTotal, 0);
    const ticketMedio = lista.length > 0 ? (totalGasto / lista.length) : 0;
    
    // CORREÇÃO ESLINT: Limpa sem alertas
    const detalhesLimpos = lista.map(item => {
      const copia = { ...item };
      delete copia.rawTotal;
      return copia;
    });
    return { resumo: { clientesAtendidos: lista.length, ticketMedio }, detalhes: detalhesLimpos.slice(0, 50) };
  },

  processarRelatorioFornecedores(fornecedores) {
    return {
      resumo: { total: fornecedores.length, ativos: fornecedores.filter(f => f.ativo !== false).length },
      detalhes: fornecedores.map(f => ({
        Fornecedor: f.nome, Contato: f.telefone || f.email || '-', Status: f.ativo !== false ? 'Ativo' : 'Inativo'
      }))
    };
  },

  // ==============================================================================
  // 4. UTILITÁRIOS
  // ==============================================================================

  calcularPeriodo(periodo) {
    const hoje = new Date();
    let dataInicio = new Date();
    let dataFim = new Date();
    hoje.setHours(0, 0, 0, 0);
    switch (periodo) {
      case 'mes':
        dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        dataFim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
        break;
      default:
        dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        dataFim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
    }
    dataInicio.setHours(0, 0, 0, 0);
    dataFim.setHours(23, 59, 59, 999);
    return { dataInicio: dataInicio.toISOString(), dataFim: dataFim.toISOString() };
  },

  formatarMoeda: (valor) => Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),

  formatarLabel(label) {
    const dicionario = {
      receitaTotal: 'Receita Total', lucroLiquido: 'Lucro Líquido', despesaTotal: 'Despesas',
      totalServicos: 'Serviços', totalVendas: 'Vendas', margemLucro: 'Margem (%)',
      metaMensal: 'Meta do Mês', progressoMeta: 'Progresso (%)', faltaParaMeta: 'Falta p/ Meta',
      qtdServicos: 'Atendimentos', qtdVendas: 'Qtd. Vendas', itensCadastrados: 'Itens em Estoque',
      valorTotalEstoque: 'Valor em Estoque', produtosCriticos: 'Itens Críticos',
      clientesAtendidos: 'Clientes', ticketMedio: 'Ticket Médio', faturamentoTotal: 'Faturamento Total', 
      produtosVendidos: 'Itens Vendidos'
    };
    return dicionario[label] || label;
  },

  agruparPorCategoria(items, tipoOrigem) {
    const agrupado = items.reduce((acc, item) => {
      const categoria = item.produtos?.nome || item.servicos?.nome || item.nome || 'Geral';
      if (!acc[categoria]) acc[categoria] = 0;
      acc[categoria] += (Number(item.total) || Number(item.valor_total) || 0);
      return acc;
    }, {});
    return Object.entries(agrupado).map(([cat, val]) => ({
      Categoria: cat, Tipo: tipoOrigem, Valor: this.formatarMoeda(val)
    }));
  },

  async exportarParaExcel(dados, nomeArquivo) {
    try {
      const workbook = XLSX.utils.book_new();
      if (dados.resumo) XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([dados.resumo]), 'Resumo');
      if (dados.detalhes?.length) XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(dados.detalhes), 'Detalhes');
      XLSX.writeFile(workbook, `${nomeArquivo}_${Date.now()}.xlsx`);
    } catch (e) { console.error('Erro Excel', e); }
  },

  async exportarParaPDF(dados) {
    try {
      const doc = new jsPDF();
      const corLuni = [139, 92, 246];
      doc.setFillColor(corLuni[0], corLuni[1], corLuni[2]);
      doc.rect(0, 0, 210, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.text(dados.titulo ? dados.titulo.toUpperCase() : 'RELATÓRIO', 14, 25);
      doc.setFontSize(10);
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 35);

      let yPos = 50;
      if (dados.resumo) {
        doc.setTextColor(corLuni[0], corLuni[1], corLuni[2]);
        doc.setFontSize(14);
        doc.text("RESUMO EXECUTIVO", 14, yPos);
        const resumoBody = Object.entries(dados.resumo).map(([k, v]) => {
          let valor = v;
          if (k.toLowerCase().includes('margem') || k.toLowerCase().includes('progresso')) valor = `${Number(v).toFixed(2)}%`;
          else if (typeof v === 'number' && k.toLowerCase().match(/valor|receita|despesa|lucro|faturamento|total|meta|falta/)) valor = this.formatarMoeda(v);
          return [this.formatarLabel(k), valor];
        });
        autoTable(doc, { startY: yPos + 5, head: [['Indicador', 'Resultado']], body: resumoBody, theme: 'striped', headStyles: { fillColor: corLuni } });
        yPos = doc.lastAutoTable.finalY + 15;
      }

      if (dados.detalhes?.length > 0) {
        doc.setTextColor(corLuni[0], corLuni[1], corLuni[2]);
        doc.setFontSize(14);
        doc.text("DETALHAMENTO", 14, yPos);
        autoTable(doc, { startY: yPos + 5, head: [Object.keys(dados.detalhes[0])], body: dados.detalhes.map(obj => Object.values(obj)), theme: 'grid', headStyles: { fillColor: [75, 85, 99] }, styles: { fontSize: 9 } });
      }
      return doc;
    } catch (error) { console.error('Erro PDF:', error); return null; }
  }
};