// src/screens/financeiro/relatorios/relatorios.service.js
import { supabase } from '../../../services/supabase';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const relatoriosService = {
  
  // ==============================================================================
  // 1. BUSCAS DE DADOS (BLINDADAS)
  // ==============================================================================

  async getDadosVendasProdutos(salaoId, dataInicio, dataFim) {
    try {
      const { data, error } = await supabase
        .from('venda_itens') 
        .select(`
          nome_item, quantidade, valor_total, preco_unitario,
          vendas!inner(data_venda, status, salao_id)
        `)
        .eq('vendas.salao_id', salaoId)
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
        supabase.from('agendamentos').select('*, profissionais(nome), clientes(nome)').eq('salao_id', salaoId)
          .gte('data', dataInicio).lte('data', dataFim).neq('status', 'cancelado'),
        
        supabase.from('vendas').select('*') 
          .eq('salao_id', salaoId)
          .gte('data_venda', dataInicio).lte('data_venda', dataFim)
          .neq('status', 'cancelado'),

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
  // 2. CONTROLADOR DE RELATÓRIOS
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
            const nome = item.nome_item || 'Produto Diversos'; 
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

        case 'metas': {
          relatorio.titulo = "Relatório Completo de Metas";
          const dadosFin = await this.getDadosFinanceiros(salaoId, dataInicio, dataFim);
          const { data: listaMetas } = await supabase.from('metas').select('*').eq('salao_id', salaoId);
          relatorio = { ...relatorio, ...this.processarRelatorioMetas(dadosFin, listaMetas || []) };
          break;
        }

        case 'performance': {
          relatorio.titulo = "Performance da Equipe";
          const dadosFin = await this.getDadosFinanceiros(salaoId, dataInicio, dataFim);
          relatorio = { ...relatorio, ...this.processarRelatorioPerformance(dadosFin) };
          break;
        }

        case 'servicos': {
          relatorio.titulo = "Análise de Serviços";
          const dadosFin = await this.getDadosFinanceiros(salaoId, dataInicio, dataFim);
          relatorio = { ...relatorio, ...this.processarRelatorioServicos(dadosFin) };
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

  // --- NOVO RELATÓRIO DE METAS (SEM GRÁFICO E COM CORREÇÃO DE R$) ---
  processarRelatorioMetas(dados, listaMetas) {
    if (!dados) return { resumo: {}, detalhes: [], graficos: [] };

    const calc = (item) => Number(item.total || item.valor_total || item.valor || 0);
    const totalVendas = dados.vendas.reduce((acc, v) => acc + calc(v), 0);
    const totalServicos = dados.agendamentos.reduce((acc, r) => acc + calc(r), 0);
    const receitaTotal = totalServicos + totalVendas;
    const despesaTotal = dados.despesas.reduce((acc, d) => acc + (Number(d.valor) || 0), 0);
    const lucroLiquido = receitaTotal - despesaTotal;
    const qtdAtendimentos = dados.agendamentos.length;

    if (!listaMetas || listaMetas.length === 0) {
        return {
            resumo: { aviso: 'Nenhuma meta cadastrada no painel.' },
            detalhes: [{ Aviso: 'Vá na tela de Metas para cadastrar seus objetivos.' }],
            graficos: []
        };
    }

    let metasBatidas = 0;

    const detalhesMetas = listaMetas.map(meta => {
        const tipo = (meta.tipo || meta.categoria || meta.titulo || 'faturamento').toLowerCase();
        let valorAtual = 0;
        let isDinheiro = true;

        if (tipo.includes('faturamento') || tipo.includes('receita')) {
            valorAtual = receitaTotal;
        } else if (tipo.includes('lucro')) {
            valorAtual = lucroLiquido;
        } else if (tipo.includes('despesa')) {
            valorAtual = despesaTotal;
        } else if (tipo.includes('venda')) {
            valorAtual = totalVendas;
        } else if (tipo.includes('cliente') || tipo.includes('atendimento')) {
            valorAtual = qtdAtendimentos;
            isDinheiro = false;
        } else {
            valorAtual = receitaTotal; 
        }

        const objetivo = Number(meta.valor || meta.valor_meta || meta.meta || meta.valor_objetivo || 0);
        let progresso = objetivo > 0 ? (valorAtual / objetivo) * 100 : 0;
        let falta = Math.max(0, objetivo - valorAtual);
        let status = 'Em Andamento ⏳';

        if (tipo.includes('despesa')) {
            falta = Math.max(0, objetivo - valorAtual); 
            if (valorAtual > objetivo) {
                status = 'Orçamento Estourado 🚨';
                falta = 0;
            } else {
                status = 'Dentro do Orçamento ✅';
                if (valorAtual > 0) metasBatidas++;
            }
        } else {
            if (valorAtual >= objetivo) {
                status = 'Meta Batida! 🏆';
                metasBatidas++;
                falta = 0;
            } else if (progresso < 30) {
                status = 'Em Risco ⚠️';
            }
        }

        return {
            'Objetivo': meta.titulo || tipo.toUpperCase(),
            'Tipo': isDinheiro ? 'Financeiro' : 'Operacional',
            'Resultado Atual': isDinheiro ? this.formatarMoeda(valorAtual) : valorAtual,
            'Meta': isDinheiro ? this.formatarMoeda(objetivo) : objetivo,
            'Progresso (%)': `${progresso.toFixed(1)}%`,
            'Falta/Sobra': isDinheiro ? this.formatarMoeda(falta) : falta,
            'Status': status
        };
    });

    return {
      resumo: {
        // Chaves renomeadas para evitar o formatador de R$
        qtdObjetivos: listaMetas.length, 
        sucessos: metasBatidas,
        receitaAtual: receitaTotal,
        despesaAtual: despesaTotal
      },
      detalhes: detalhesMetas,
      graficos: [] // <-- GRÁFICO REMOVIDO AQUI
    };
  },

  processarRelatorioPerformance(dados) {
    if (!dados) return { resumo: {}, detalhes: [], graficos: [] };
    
    const calc = (item) => Number(item.total || item.valor_total || item.valor || 0);

    const totalVendas = dados.vendas.reduce((acc, v) => acc + calc(v), 0);
    const totalServicos = dados.agendamentos.reduce((acc, r) => acc + calc(r), 0);
    const receitaTotal = totalServicos + totalVendas;
    
    const qtdAtendimentos = dados.agendamentos.length;
    const qtdVendasPDV = dados.vendas.length;

    const ticketMedioGeral = qtdAtendimentos > 0 ? (receitaTotal / qtdAtendimentos) : 0;
    const conversaoProdutos = qtdAtendimentos > 0 ? ((qtdVendasPDV / qtdAtendimentos) * 100) : 0;

    const mapProfissionais = {};
    dados.agendamentos.forEach(a => {
        let nomeProf = 'Equipe';
        if (a.profissionais) {
            if (Array.isArray(a.profissionais)) {
                nomeProf = a.profissionais[0]?.nome || 'Equipe';
            } else {
                nomeProf = a.profissionais.nome || 'Equipe';
            }
        }
        
        if (!mapProfissionais[nomeProf]) mapProfissionais[nomeProf] = { atendimentos: 0, faturamento: 0 };
        mapProfissionais[nomeProf].atendimentos += 1;
        mapProfissionais[nomeProf].faturamento += calc(a);
    });

    const detalhes = Object.entries(mapProfissionais)
        .map(([nome, info]) => ({
            Profissional: nome,
            Atendimentos: info.atendimentos,
            Faturamento: this.formatarMoeda(info.faturamento),
            'Ticket Médio': this.formatarMoeda(info.atendimentos > 0 ? info.faturamento / info.atendimentos : 0)
        })).sort((a, b) => b.Atendimentos - a.Atendimentos);

    return {
      resumo: { 
        receitaTotal,
        ticketMedioGeral, 
        conversaoProdutos,
        totalAtendimentos: qtdAtendimentos
      },
      detalhes,
      graficos: []
    };
  },

  processarRelatorioServicos(dados) {
    if (!dados || !dados.agendamentos) return { resumo: {}, detalhes: [], graficos: [] };
    
    const calc = (item) => Number(item.valor_total || item.valor || 0);
    const totalFaturado = dados.agendamentos.reduce((acc, r) => acc + calc(r), 0);

    const mapServicos = {};
    dados.agendamentos.forEach(a => {
        const nomeServico = a.servico || 'Outros';
        if (!mapServicos[nomeServico]) mapServicos[nomeServico] = { qtd: 0, faturamento: 0 };
        mapServicos[nomeServico].qtd += 1;
        mapServicos[nomeServico].faturamento += calc(a);
    });

    const detalhes = Object.entries(mapServicos)
        .map(([nome, info]) => ({
            Serviço: nome,
            Quantidade: info.qtd,
            'Total (R$)': this.formatarMoeda(info.faturamento)
        })).sort((a, b) => b.Quantidade - a.Quantidade);

    return {
      resumo: { 
        faturamentoTotal: totalFaturado,
        servicosRealizados: dados.agendamentos.length,
        tiposDistintos: Object.keys(mapServicos).length
      },
      detalhes,
      graficos: []
    };
  },

  processarRelatorioFinanceiro(dados) {
    if (!dados) return { resumo: {}, detalhes: [], graficos: [] };
    
    const calc = (item) => Number(item.total || item.valor_total || item.valor || 0);
    const totalVendas = dados.vendas.reduce((acc, v) => acc + calc(v), 0);
    const totalServicos = dados.agendamentos.reduce((acc, r) => acc + calc(r), 0);
    const despesaTotal = dados.despesas.reduce((acc, d) => acc + (Number(d.valor) || 0), 0);
    
    const receitaTotal = totalServicos + totalVendas;
    const lucroLiquido = receitaTotal - despesaTotal;
    const margemLucro = receitaTotal > 0 ? (lucroLiquido / receitaTotal * 100) : 0;

    return {
      resumo: { 
        receitaTotal, lucroLiquido, despesaTotal, totalServicos, totalVendas, margemLucro, 
        qtdServicos: dados.agendamentos.length, qtdVendas: dados.vendas.length 
      },
      detalhes: [
        ...this.agruparPorCategoria(dados.agendamentos, 'Serviço'),
        ...this.agruparPorCategoria(dados.vendas, 'Venda de PDV'),
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
    const valorTotalEstoque = produtos.reduce((acc, p) => acc + ((Number(p.quantidade_atual) || 0) * (Number(p.custo) || 0)), 0);
    const produtosCriticos = produtos.filter(p => (Number(p.quantidade_atual) || 0) <= (p.estoque_minimo || 5));
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
    const ano = hoje.getFullYear();
    const mes = hoje.getMonth();
    
    let dataInicio = new Date(ano, mes, 1).toLocaleDateString('en-CA') + 'T00:00:00';
    let dataFim = new Date(ano, mes + 1, 0).toLocaleDateString('en-CA') + 'T23:59:59';
    
    return { dataInicio, dataFim };
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
      produtosVendidos: 'Itens Vendidos',
      
      ticketMedioGeral: 'Ticket Médio (Geral)',
      conversaoProdutos: 'Conversão Produtos (%)',
      totalAtendimentos: 'Total de Atendimentos',
      servicosRealizados: 'Serviços Realizados',
      tiposDistintos: 'Tipos Distintos',

      // MUDANÇA: Novas labels que não acionam o formatador de moeda no front-end
      qtdObjetivos: 'Total de Metas', 
      sucessos: 'Metas Atingidas',    
      receitaAtual: 'Receita no Mês',
      despesaAtual: 'Despesa no Mês',
      aviso: 'Aviso'
    };
    return dicionario[label] || label;
  },

  agruparPorCategoria(items, tipoOrigem) {
    const agrupado = items.reduce((acc, item) => {
      const categoria = item.nome_item || item.servico || item.nome || 'Geral';
      if (!acc[categoria]) acc[categoria] = 0;
      acc[categoria] += (Number(item.total) || Number(item.valor_total) || Number(item.valor) || 0);
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
          if (k.toLowerCase().includes('margem') || k.toLowerCase().includes('progresso') || k.toLowerCase().includes('conversao')) valor = `${Number(v).toFixed(2)}%`;
          else if (typeof v === 'number' && k.toLowerCase().match(/valor|receita|despesa|lucro|faturamento|total|meta|falta|ticket/)) valor = this.formatarMoeda(v);
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