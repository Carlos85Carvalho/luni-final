// src/screens/financeiro/relatorios/Relatorios.service.js
import { supabase } from '../../../services/supabase';

// --- BIBLIOTECAS DE EXPORTAÇÃO ---
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; // 1. MUDANÇA NO IMPORT

export const relatoriosService = {
  // --- Buscas de Dados (Data Fetching) ---

  async getDadosFinanceiros(salaoId, dataInicio, dataFim) {
    if (!salaoId) return null;

    const [receitas, despesas, produtos] = await Promise.all([
      supabase
        .from('eventos')
        .select('*')
        .eq('salao_id', salaoId)
        .eq('tipo', 'receita')
        .gte('data', dataInicio)
        .lte('data', dataFim),
      
      supabase
        .from('despesas')
        .select('*')
        .eq('salao_id', salaoId)
        .gte('data_vencimento', dataInicio)
        .lte('data_vencimento', dataFim),
      
      supabase
        .from('vw_lucro_produtos')
        .select('*')
        .eq('salao_id', salaoId)
        .then(res => res).catch(() => ({ data: [] }))
    ]);

    return {
      receitas: receitas.data || [],
      despesas: despesas.data || [],
      produtos: produtos.data || []
    };
  },

  async getDadosEstoque(salaoId) {
    const { data } = await supabase.from('produtos').select('*').eq('salao_id', salaoId);
    return data || [];
  },

  async getDadosFornecedores(salaoId) {
    const { data } = await supabase.from('fornecedores').select('*, despesas(*)').eq('salao_id', salaoId);
    return data || [];
  },

  async getDadosMetas(salaoId) {
    const { data } = await supabase.from('metas').select('*').eq('salao_id', salaoId);
    return data || [];
  },

  // --- Função Principal de Geração ---

  async gerarRelatorioCompleto(salaoId, tipo, periodo, filtros = {}) {
    const { dataInicio, dataFim } = this.calcularPeriodo(periodo);
    
    let relatorio = {
      tipo,
      periodo,
      titulo: `Relatório de ${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`,
      dataGeracao: new Date().toISOString(),
      filtros
    };

    switch (tipo) {
      case 'financeiro': {
        const dadosFin = await this.getDadosFinanceiros(salaoId, dataInicio, dataFim);
        relatorio = { ...relatorio, ...this.processarRelatorioFinanceiro(dadosFin) };
        break;
      }
      case 'estoque': {
        const dadosEst = await this.getDadosEstoque(salaoId);
        relatorio = { ...relatorio, ...this.processarRelatorioEstoque(dadosEst) };
        break;
      }
      case 'fornecedores': {
        const dadosForn = await this.getDadosFornecedores(salaoId);
        relatorio = { ...relatorio, ...this.processarRelatorioFornecedores(dadosForn) };
        break;
      }
      case 'metas': {
        const dadosMetas = await this.getDadosMetas(salaoId);
        relatorio = { ...relatorio, ...this.processarRelatorioMetas(dadosMetas) };
        break;
      }
      default:
        console.warn(`Tipo de relatório não implementado: ${tipo}`);
        break;
    }
    return relatorio;
  },

  // --- Processamento de Dados ---

  processarRelatorioFinanceiro(dados) {
    if (!dados) return {};
    const receitaTotal = dados.receitas.reduce((acc, r) => acc + (Number(r.valor) || 0), 0);
    const despesaTotal = dados.despesas.reduce((acc, d) => acc + (Number(d.valor) || 0), 0);
    const lucroLiquido = receitaTotal - despesaTotal;
    const margemLucro = receitaTotal > 0 ? (lucroLiquido / receitaTotal * 100) : 0;

    return {
      resumo: { receitaTotal, despesaTotal, lucroLiquido, margemLucro, totalTransacoes: dados.receitas.length },
      detalhes: this.agruparPorCategoria(dados.receitas),
      graficos: [
        { name: 'Receitas', valor: receitaTotal, fill: '#10B981' },
        { name: 'Despesas', valor: despesaTotal, fill: '#EF4444' }
      ]
    };
  },

  processarRelatorioEstoque(produtos) {
    const totalItens = produtos.reduce((acc, p) => acc + (p.quantidade_atual || 0), 0);
    const valorTotalEstoque = produtos.reduce((acc, p) => acc + ((p.quantidade_atual || 0) * (p.custo_unitario || 0)), 0);
    const produtosCriticos = produtos.filter(p => (p.quantidade_atual || 0) <= (p.quantidade_minima || 0));

    return {
      resumo: { totalItens, valorTotalEstoque, qtdProdutosCriticos: produtosCriticos.length },
      detalhes: produtos.map(p => ({
        produto: p.nome,
        estoque: p.quantidade_atual,
        minimo: p.quantidade_minima,
        custo: p.custo_unitario,
        status: p.quantidade_atual <= p.quantidade_minima ? 'Crítico' : 'Normal'
      }))
    };
  },

  processarRelatorioFornecedores(fornecedores) {
    const totalFornecedores = fornecedores.length;
    const ativos = fornecedores.filter(f => f.ativo).length;
    return {
      resumo: { totalFornecedores, ativos, inativos: totalFornecedores - ativos },
      detalhes: fornecedores.map(f => ({
        nome: f.nome,
        telefone: f.telefone,
        status: f.ativo ? 'Ativo' : 'Inativo'
      }))
    };
  },

  processarRelatorioMetas(metas) {
    const atingidas = metas.filter(m => {
        if(m.inverso) return m.valor_atual <= m.valor_meta;
        return m.valor_atual >= m.valor_meta;
    }).length;
    return {
      resumo: { totalMetas: metas.length, atingidas, pendentes: metas.length - atingidas },
      detalhes: metas.map(m => ({
        titulo: m.titulo,
        meta: m.valor_meta,
        atual: m.valor_atual,
        progresso: m.inverso ? (m.valor_atual <= m.valor_meta ? 100 : 0) : Math.min(100, (m.valor_atual / m.valor_meta) * 100)
      }))
    };
  },

  // --- Utilitários ---

  calcularPeriodo(periodo) {
    const hoje = new Date();
    let dataInicio = new Date();
    let dataFim = new Date();

    switch (periodo) {
      case 'hoje':
        dataInicio.setHours(0, 0, 0, 0);
        dataFim.setHours(23, 59, 59, 999);
        break;
      case 'semana': {
        const diaSemana = hoje.getDay();
        const diff = diaSemana === 0 ? 6 : diaSemana - 1;
        dataInicio.setDate(hoje.getDate() - diff);
        dataInicio.setHours(0, 0, 0, 0);
        dataFim.setDate(dataInicio.getDate() + 6);
        dataFim.setHours(23, 59, 59, 999);
        break;
      }
      case 'mes':
        dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        dataFim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
      case 'ano':
        dataInicio = new Date(hoje.getFullYear(), 0, 1);
        dataFim = new Date(hoje.getFullYear(), 11, 31, 23, 59, 59, 999);
        break;
      default:
        dataInicio.setDate(hoje.getDate() - 30);
        dataFim.setHours(23, 59, 59, 999);
    }
    return { dataInicio: dataInicio.toISOString(), dataFim: dataFim.toISOString() };
  },

  agruparPorCategoria(items) {
    const agrupado = items.reduce((acc, item) => {
      const categoria = item.categoria || 'Outros';
      if (!acc[categoria]) acc[categoria] = 0;
      acc[categoria] += Number(item.valor) || 0;
      return acc;
    }, {});
    
    return Object.entries(agrupado).map(([cat, val]) => ({
      categoria: cat,
      total: val
    }));
  },

  // --- Exportação ---

  async exportarParaExcel(dados, nomeArquivo = 'relatorio') {
    const workbook = XLSX.utils.book_new();
    
    if (dados.resumo) {
      const resumoSheet = XLSX.utils.json_to_sheet([dados.resumo]);
      XLSX.utils.book_append_sheet(workbook, resumoSheet, 'Resumo');
    }

    if (dados.detalhes && Array.isArray(dados.detalhes)) {
      const detalhesSheet = XLSX.utils.json_to_sheet(dados.detalhes);
      XLSX.utils.book_append_sheet(workbook, detalhesSheet, 'Detalhes');
    }

    XLSX.writeFile(workbook, `${nomeArquivo}_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.xlsx`);
  },

  async exportarParaPDF(dados, titulo) {
    const doc = new jsPDF();
    
    // Título e Data
    doc.setFontSize(18);
    doc.text(titulo, 14, 22);
    
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 30);
    
    // Tabela de Resumo
    if (dados.resumo) {
      doc.setFontSize(14);
      doc.text('Resumo', 14, 45);
      
      const resumoData = Object.entries(dados.resumo).map(([key, value]) => [
        key.replace(/([A-Z])/g, ' $1').toUpperCase(),
        typeof value === 'number' ? value.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : value
      ]);
      
      // 2. CORREÇÃO: Usando a função importada
      autoTable(doc, {
        startY: 50,
        head: [['Métrica', 'Valor']],
        body: resumoData,
        theme: 'striped',
        headStyles: { fillColor: [124, 58, 237] }
      });
    }

    // Tabela de Detalhes
    if (dados.detalhes && Array.isArray(dados.detalhes) && dados.detalhes.length > 0) {
      const lastY = doc.lastAutoTable?.finalY || 50;
      doc.text('Detalhamento', 14, lastY + 15);

      const headers = Object.keys(dados.detalhes[0]).map(k => k.toUpperCase());
      const body = dados.detalhes.map(item => Object.values(item).map(val => 
        typeof val === 'number' ? val.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : val
      ));

      // 2. CORREÇÃO: Usando a função importada
      autoTable(doc, {
        startY: lastY + 20,
        head: [headers],
        body: body,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [40, 40, 40] }
      });
    }

    // Rodapé
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(
        `Página ${i} de ${pageCount} • Relatório Luni`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }

    doc.save(`${titulo.replace(/\s+/g, '_')}.pdf`);
  }
};