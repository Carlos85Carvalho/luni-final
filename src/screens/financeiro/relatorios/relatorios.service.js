// src/screens/financeiro/relatorios/relatorios.service.js
import { supabase } from '../../../services/supabase';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const relatoriosService = {
  
  // ==============================================================================
  // 1. BUSCAS DE DADOS (DATA FETCHING)
  // ==============================================================================

  // --- NOVO: Busca específica para Itens de Venda (Relatório de Produtos) ---
  async getDadosVendasProdutos(salaoId, dataInicio, dataFim) {
    try {
      const { data, error } = await supabase
        .from('venda_itens')
        .select(`
          nome_item, quantidade, valor_total, tipo, preco_unitario,
          vendas!inner(data_venda, status, salao_id)
        `)
        .eq('vendas.salao_id', salaoId)
        .eq('tipo', 'produto') // Filtra apenas produtos físicos
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

  // --- ORIGINAL: Busca Financeira Robusta ---
  async getDadosFinanceiros(salaoId, dataInicio, dataFim) {
    if (!salaoId) return { agendamentos: [], vendas: [], despesas: [] };

    try {
      const colunaDataVenda = 'data_venda'; 

      const [agendamentosResult, vendasResult, despesasResult, itensVendaResult] = await Promise.all([
        supabase
          .from('agendamentos')
          .select('*, clientes(nome)')
          .eq('salao_id', salaoId)
          .gte('data', dataInicio)
          .lte('data', dataFim)
          .neq('status', 'cancelado'),
        
        supabase
          .from('vendas')
          .select('*, venda_itens(*)')
          .eq('salao_id', salaoId)
          .gte(colunaDataVenda, dataInicio)
          .lte(colunaDataVenda, dataFim)
          .neq('status', 'cancelado'),

        supabase
          .from('despesas')
          .select('*')
          .eq('salao_id', salaoId)
          .gte('data_vencimento', dataInicio)
          .lte('data_vencimento', dataFim),

        // Fallback para itens se a venda não tiver total
        supabase
          .from('venda_itens')
          .select('*, vendas!inner(*)')
          .eq('vendas.salao_id', salaoId)
          .gte(`vendas.${colunaDataVenda}`, dataInicio)
          .lte(`vendas.${colunaDataVenda}`, dataFim)
      ]);

      let listaVendas = vendasResult.data || [];
      
      // Lógica de recuperação se a tabela de vendas vier vazia mas tiver itens
      if (listaVendas.length === 0 && itensVendaResult.data?.length > 0) {
        const vendasMap = {};
        itensVendaResult.data.forEach(item => {
          const vendaId = item.venda_id;
          if (!vendasMap[vendaId]) {
            vendasMap[vendaId] = {
              id: vendaId,
              data_venda: item.vendas?.data_venda || item.vendas?.created_at, 
              salao_id: item.vendas?.salao_id,
              valor_total: 0,
              itens_venda: []
            };
          }
          vendasMap[vendaId].itens_venda.push(item);
          const preco = Number(item.preco) || Number(item.valor) || Number(item.valor_unitario) || 0;
          const qtd = Number(item.quantidade) || Number(item.qtd) || 1;
          vendasMap[vendaId].valor_total += (preco * qtd);
        });
        listaVendas = Object.values(vendasMap);
      }

      return {
        agendamentos: agendamentosResult.data || [],
        vendas: listaVendas,
        despesas: despesasResult.data || []
      };

    } catch (error) {
      console.error('❌ [SERVICE] Erro geral:', error);
      return { agendamentos: [], vendas: [], despesas: [] };
    }
  },

  async getDadosEstoque(salaoId) {
    try {
      // Tenta buscar da view ou tabela produtos
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
  // 2. CONTROLADOR DE RELATÓRIOS (DECIDE QUAL GERAR)
  // ==============================================================================
  
  async gerarRelatorioCompleto(salaoId, tipo, periodo, filtros = {}) {
    const { dataInicio, dataFim } = this.calcularPeriodo(periodo);
    
    let relatorio = {
      tipo, periodo, filtros,
      titulo: `Relatório de ${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`,
      dataGeracao: new Date().toISOString(),
      resumo: {},
      detalhes: [],
      graficos: []
    };

    try {
      switch (tipo) {
        
        // --- CASO NOVO: VENDAS DE PRODUTOS ---
        case 'vendas_produtos': {
          relatorio.titulo = "Relatório de Vendas de Produtos";
          const dados = await this.getDadosVendasProdutos(salaoId, dataInicio, dataFim);
          
          // Agrupa os itens por nome
          const agrupado = {};
          let totalFaturado = 0;
          let totalItens = 0;

          dados.forEach(item => {
            const nome = item.nome_item || 'Produto sem nome';
            if (!agrupado[nome]) agrupado[nome] = { produto: nome, qtd: 0, total: 0 };
            
            const qtd = Number(item.quantidade) || 0;
            const val = Number(item.valor_total) || 0;
            
            agrupado[nome].qtd += qtd;
            agrupado[nome].total += val;
            totalFaturado += val;
            totalItens += qtd;
          });

          relatorio.resumo = {
            faturamentoTotal: totalFaturado,
            produtosVendidos: totalItens,
            itensDistintos: Object.keys(agrupado).length
          };

          relatorio.detalhes = Object.values(agrupado)
            .sort((a, b) => b.total - a.total)
            .map(item => ({
              Produto: item.produto,
              'Qtd. Vendida': item.qtd,
              'Total (R$)': this.formatarMoeda(item.total)
            }));
          break;
        }

        // --- DEMAIS CASOS ORIGINAIS ---
        case 'financeiro':
        case 'vendas': { // Vendas Geral (inclui serviços)
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

  processarRelatorioFinanceiro(dados) {
    if (!dados) return { resumo: {}, detalhes: [], graficos: [] };

    const totalVendas = dados.vendas.reduce((acc, v) => {
      let valor = Number(v.total) || Number(v.valor_total) || 0;
      return acc + valor;
    }, 0);

    const totalServicos = dados.agendamentos.reduce((acc, r) => {
      return acc + (Number(r.valor_total) || Number(r.valor) || 0);
    }, 0);

    const despesaTotal = dados.despesas.reduce((acc, d) => {
      return acc + (Number(d.valor) || 0);
    }, 0);

    const receitaTotal = totalServicos + totalVendas;
    const lucroLiquido = receitaTotal - despesaTotal;
    const margemLucro = receitaTotal > 0 ? (lucroLiquido / receitaTotal * 100) : 0;

    return {
      resumo: { 
        receitaTotal, 
        lucroLiquido, 
        despesaTotal,
        totalServicos,
        totalVendas, 
        margemLucro,
        qtdServicos: dados.agendamentos.length,
        qtdVendas: dados.vendas.length
      },
      detalhes: [
        ...this.agruparPorCategoria(dados.agendamentos, 'Serviço'),
        ...this.agruparPorCategoria(dados.vendas, 'Produto'),
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
      const minimo = Number(p.estoque_minimo) || 5;
      return atual <= minimo;
    });

    return {
      resumo: { 
        itensCadastrados: produtos.length, 
        valorTotalEstoque, 
        produtosCriticos: produtosCriticos.length 
      },
      detalhes: produtos.map(p => ({
        Produto: p.nome_produto || p.nome,
        Estoque: p.quantidade_atual || p.estoque || 0,
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

    const lista = Object.entries(mapClientes)
      .map(([nome, info]) => ({ Cliente: nome, 'Gasto Total': this.formatarMoeda(info.total), Visitas: info.visitas, rawTotal: info.total }))
      .sort((a, b) => b.rawTotal - a.rawTotal);

    const totalGasto = lista.reduce((acc, c) => acc + c.rawTotal, 0);
    const ticketMedio = lista.length > 0 ? (totalGasto / lista.length) : 0;

    // Remove o rawTotal antes de enviar para a tabela
    const detalhesLimpos = lista.map(({ rawTotal, ...resto }) => resto);

    return {
      resumo: { clientesAtendidos: lista.length, ticketMedio },
      detalhes: detalhesLimpos.slice(0, 50), // Top 50 clientes
      graficos: []
    };
  },

  processarRelatorioFornecedores(fornecedores) {
    return {
      resumo: { total: fornecedores.length, ativos: fornecedores.filter(f => f.ativo !== false).length },
      detalhes: fornecedores.map(f => ({
        Fornecedor: f.nome,
        Contato: f.telefone || f.email || '-',
        Status: f.ativo !== false ? 'Ativo' : 'Inativo'
      }))
    };
  },

  // ==============================================================================
  // 4. UTILITÁRIOS (Datas, Formatação, Exportação)
  // ==============================================================================

  calcularPeriodo(periodo) {
    const hoje = new Date();
    let dataInicio = new Date();
    let dataFim = new Date();
    hoje.setHours(0, 0, 0, 0);

    switch (periodo) {
      case 'hoje':
        dataInicio = new Date(hoje);
        dataFim = new Date(hoje);
        break;
      case 'semana': { 
        const diff = hoje.getDay() === 0 ? 6 : hoje.getDay() - 1;
        dataInicio.setDate(hoje.getDate() - diff);
        dataFim = new Date(dataInicio);
        dataFim.setDate(dataInicio.getDate() + 6);
        break;
      }
      case 'mes':
        dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        dataFim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
        break;
      case 'ano':
        dataInicio = new Date(hoje.getFullYear(), 0, 1);
        dataFim = new Date(hoje.getFullYear(), 11, 31);
        break;
      default:
        dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        dataFim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
    }
    dataInicio.setHours(0, 0, 0, 0);
    dataFim.setHours(23, 59, 59, 999);
    
    return { dataInicio: dataInicio.toISOString(), dataFim: dataFim.toISOString() };
  },

  formatarMoeda(valor) {
    return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  },

  formatarLabel(label) {
    const dicionario = {
      receitaTotal: 'Receita Total',
      lucroLiquido: 'Lucro Líquido',
      despesaTotal: 'Despesas',
      totalServicos: 'Serviços',
      totalVendas: 'Vendas',
      margemLucro: 'Margem (%)',
      qtdServicos: 'Qtd. Atendimentos',
      qtdVendas: 'Qtd. Vendas',
      itensCadastrados: 'Itens em Estoque',
      valorTotalEstoque: 'Valor em Estoque',
      produtosCriticos: 'Itens Críticos',
      clientesAtendidos: 'Clientes',
      ticketMedio: 'Ticket Médio',
      total: 'Total',
      ativos: 'Ativos',
      faturamentoTotal: 'Faturamento Total',
      produtosVendidos: 'Itens Vendidos',
      itensDistintos: 'Produtos Diferentes'
    };
    return dicionario[label] || label;
  },

  agruparPorCategoria(items, tipoOrigem) {
    const agrupado = items.reduce((acc, item) => {
      const categoria = item.nome_produto || item.nome || item.descricao || item.categoria || item.servico || 'Geral';
      if (!acc[categoria]) acc[categoria] = 0;
      
      let valor = Number(item.valor_total) || Number(item.total) || Number(item.valor) || 0;
      
      // Tenta pegar do itens_venda se o valor principal for zero
      const itens = item.venda_itens || item.itens_venda || [];
      if (tipoOrigem === 'Produto' && valor === 0 && itens.length > 0) {
        valor = itens.reduce((s, i) => {
            const p = Number(i.preco) || Number(i.valor) || 0;
            const q = Number(i.quantidade) || Number(i.qtd) || 1;
            return s + (p * q);
        }, 0);
      }
      acc[categoria] += valor;
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

      // Cabeçalho
      doc.setFillColor(corLuni[0], corLuni[1], corLuni[2]);
      doc.rect(0, 0, 210, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.text(dados.titulo ? dados.titulo.toUpperCase() : 'RELATÓRIO', 14, 25);
      
      doc.setFontSize(10);
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 35);

      let yPos = 50;

      // Resumo
      if (dados.resumo) {
        doc.setTextColor(corLuni[0], corLuni[1], corLuni[2]);
        doc.setFontSize(14);
        doc.text("RESUMO EXECUTIVO", 14, yPos);
        
        const resumoBody = Object.entries(dados.resumo).map(([k, v]) => {
          let valor = v;
          if (k.toLowerCase().includes('margem')) valor = `${Number(v).toFixed(2)}%`;
          else if (typeof v === 'number' && k.toLowerCase().match(/valor|receita|despesa|lucro|faturamento|total|ticket|custo|gasto/)) {
            valor = this.formatarMoeda(v);
          }
          return [this.formatarLabel(k), valor];
        });

        autoTable(doc, {
          startY: yPos + 5,
          head: [['Indicador', 'Resultado']],
          body: resumoBody,
          theme: 'striped',
          headStyles: { fillColor: corLuni },
          styles: { fontSize: 10 },
          columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } }
        });
        yPos = doc.lastAutoTable.finalY + 15;
      }

      // Detalhes
      if (dados.detalhes && dados.detalhes.length > 0) {
        doc.setTextColor(corLuni[0], corLuni[1], corLuni[2]);
        doc.setFontSize(14);
        doc.text("DETALHAMENTO", 14, yPos);

        const colunas = Object.keys(dados.detalhes[0]);
        const body = dados.detalhes.map(obj => 
          Object.values(obj).map(v => {
            // Verifica se é número grande para formatar, senão retorna o valor normal
            return (typeof v === 'number' && v > 1000) ? this.formatarMoeda(v) : v;
          })
        );

        autoTable(doc, {
          startY: yPos + 5,
          head: [colunas],
          body: body,
          theme: 'grid',
          headStyles: { fillColor: [75, 85, 99] }, 
          styles: { fontSize: 9 }
        });
      }

      // Numeração de Página
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Página ${i} de ${pageCount}`, 190, 285, { align: 'right' });
      }

      return doc;
    } catch (error) {
      console.error('Erro na geração do PDF:', error);
      return null;
    }
  }
};