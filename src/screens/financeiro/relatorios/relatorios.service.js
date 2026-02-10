// src/screens/financeiro/relatorios/relatorios.service.js
import { supabase } from '../../../services/supabase';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const relatoriosService = {
  // ==================== BUSCAS DE DADOS ====================
  
  async getDadosFinanceiros(salaoId, dataInicio, dataFim) {
    console.log('📊 [SERVICE] Buscando dados financeiros:', { salaoId, dataInicio, dataFim });
    
    if (!salaoId) {
      console.error('❌ [SERVICE] salaoId não fornecido');
      return { agendamentos: [], vendas: [], despesas: [] };
    }

    try {
      const [agendamentosResult, vendasResult, despesasResult] = await Promise.all([
        // 1. Agendamentos
        supabase
          .from('agendamentos')
          .select('*')
          .eq('salao_id', salaoId)
          .gte('data', dataInicio)
          .lte('data', dataFim)
          .neq('status', 'cancelado'),
        
        // 2. Vendas
        supabase
          .from('vendas')
          .select('*, itens_venda(*)')
          .eq('salao_id', salaoId)
          .gte('data', dataInicio)
          .lte('data', dataFim),

        // 3. Despesas
        supabase
          .from('despesas')
          .select('*')
          .eq('salao_id', salaoId)
          .gte('data_vencimento', dataInicio)
          .lte('data_vencimento', dataFim)
      ]);

      // Verificar erros individuais
      if (agendamentosResult.error) {
        console.error('❌ [SERVICE] Erro agendamentos:', agendamentosResult.error);
      }
      if (vendasResult.error) {
        console.error('❌ [SERVICE] Erro vendas:', vendasResult.error);
      }
      if (despesasResult.error) {
        console.error('❌ [SERVICE] Erro despesas:', despesasResult.error);
      }

      const dados = {
        agendamentos: agendamentosResult.data || [],
        vendas: vendasResult.data || [],
        despesas: despesasResult.data || []
      };

      console.log('✅ [SERVICE] Dados carregados:', {
        agendamentos: dados.agendamentos.length,
        vendas: dados.vendas.length,
        despesas: dados.despesas.length
      });

      // LOG DETALHADO: Mostra um exemplo de cada tipo de dado
      if (dados.agendamentos.length > 0) {
        console.log('📝 [SERVICE] Exemplo agendamento:', dados.agendamentos[0]);
      }
      if (dados.vendas.length > 0) {
        console.log('📝 [SERVICE] Exemplo venda:', dados.vendas[0]);
      }
      if (dados.despesas.length > 0) {
        console.log('📝 [SERVICE] Exemplo despesa:', dados.despesas[0]);
      }

      return dados;

    } catch (error) {
      console.error('❌ [SERVICE] Erro geral ao buscar dados:', error);
      return { agendamentos: [], vendas: [], despesas: [] };
    }
  },

  async getDadosEstoque(salaoId) {
    console.log('📦 [SERVICE] Buscando estoque para salao:', salaoId);
    
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .eq('salao_id', salaoId);

      if (error) {
        console.error('❌ [SERVICE] Erro ao buscar estoque:', error);
        return [];
      }

      console.log('✅ [SERVICE] Produtos carregados:', data?.length || 0);
      return data || [];

    } catch (error) {
      console.error('❌ [SERVICE] Erro geral ao buscar estoque:', error);
      return [];
    }
  },

  async getDadosClientes(salaoId, dataInicio, dataFim) {
    console.log('👥 [SERVICE] Buscando clientes:', { salaoId, dataInicio, dataFim });
    
    try {
      const { data, error } = await supabase
        .from('agendamentos')
        .select('cliente_id, valor, valor_total, clientes(nome)')
        .eq('salao_id', salaoId)
        .gte('data', dataInicio)
        .lte('data', dataFim)
        .neq('status', 'cancelado');

      if (error) {
        console.error('❌ [SERVICE] Erro ao buscar clientes:', error);
        return [];
      }

      console.log('✅ [SERVICE] Dados clientes carregados:', data?.length || 0);
      return data || [];

    } catch (error) {
      console.error('❌ [SERVICE] Erro geral ao buscar clientes:', error);
      return [];
    }
  },

  async getDadosFornecedores(salaoId) {
    console.log('🚚 [SERVICE] Buscando fornecedores para salao:', salaoId);
    
    try {
      const { data, error } = await supabase
        .from('fornecedores')
        .select('*, despesas(*)')
        .eq('salao_id', salaoId);

      if (error) {
        console.error('❌ [SERVICE] Erro ao buscar fornecedores:', error);
        return [];
      }

      console.log('✅ [SERVICE] Fornecedores carregados:', data?.length || 0);
      return data || [];

    } catch (error) {
      console.error('❌ [SERVICE] Erro geral ao buscar fornecedores:', error);
      return [];
    }
  },

  // ==================== GERAÇÃO DE RELATÓRIO ====================
  
  async gerarRelatorioCompleto(salaoId, tipo, periodo, filtros = {}) {
    console.log('🎯 [SERVICE] ========== INICIANDO GERAÇÃO DE RELATÓRIO ==========');
    console.log('🎯 [SERVICE] Parâmetros:', { salaoId, tipo, periodo, filtros });
    
    const { dataInicio, dataFim } = this.calcularPeriodo(periodo);
    
    let relatorio = {
      tipo,
      periodo,
      titulo: `Relatório de ${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`,
      dataGeracao: new Date().toISOString(),
      filtros
    };

    try {
      switch (tipo) {
        case 'financeiro':
        case 'vendas': { 
          const dadosFin = await this.getDadosFinanceiros(salaoId, dataInicio, dataFim);
          const processado = this.processarRelatorioFinanceiro(dadosFin);
          relatorio = { ...relatorio, ...processado };
          
          if (tipo === 'vendas') {
            relatorio.titulo = "Relatório de Vendas Detalhado";
          }
          
          console.log('✅ [SERVICE] Relatório financeiro processado:', processado);
          break;
        }
        
        case 'estoque': {
          const dadosEst = await this.getDadosEstoque(salaoId);
          const processado = this.processarRelatorioEstoque(dadosEst);
          relatorio = { ...relatorio, ...processado };
          console.log('✅ [SERVICE] Relatório estoque processado:', processado);
          break;
        }
        
        case 'clientes': {
          const dadosCli = await this.getDadosClientes(salaoId, dataInicio, dataFim);
          const processado = this.processarRelatorioClientes(dadosCli);
          relatorio = { ...relatorio, ...processado };
          console.log('✅ [SERVICE] Relatório clientes processado:', processado);
          break;
        }
        
        case 'fornecedores': {
          const dadosForn = await this.getDadosFornecedores(salaoId);
          const processado = this.processarRelatorioFornecedores(dadosForn);
          relatorio = { ...relatorio, ...processado };
          console.log('✅ [SERVICE] Relatório fornecedores processado:', processado);
          break;
        }
        
        default: {
          console.warn('⚠️ [SERVICE] Tipo não implementado, usando financeiro:', tipo);
          const dadosFin = await this.getDadosFinanceiros(salaoId, dataInicio, dataFim);
          const processado = this.processarRelatorioFinanceiro(dadosFin);
          relatorio = { ...relatorio, ...processado };
          break;
        }
      }

      console.log('🎉 [SERVICE] ========== RELATÓRIO GERADO COM SUCESSO ==========');
      console.log('📄 [SERVICE] Relatório final:', relatorio);
      
      return relatorio;

    } catch (error) {
      console.error('❌ [SERVICE] Erro ao gerar relatório:', error);
      return relatorio;
    }
  },

  // ==================== PROCESSAMENTO ====================
  
  processarRelatorioFinanceiro(dados) {
    console.log('🔄 [SERVICE] Processando relatório financeiro...');
    
    if (!dados || !dados.agendamentos) {
      console.warn('⚠️ [SERVICE] Dados inválidos para processamento');
      return { 
        resumo: {
          receitaTotal: 0,
          lucroLiquido: 0,
          despesaTotal: 0,
          margemLucro: 0,
          qtdServicos: 0,
          qtdVendas: 0
        }, 
        detalhes: [], 
        graficos: [] 
      };
    }

    // Calcular totais com logs detalhados
    const totalServicos = dados.agendamentos.reduce((acc, r) => {
      const valor = Number(r.valor_total) || Number(r.valor) || 0;
      return acc + valor;
    }, 0);
    console.log('💰 [SERVICE] Total Serviços:', totalServicos);

    const totalVendas = dados.vendas.reduce((acc, v) => {
      const valor = Number(v.valor_total) || Number(v.total) || 0;
      return acc + valor;
    }, 0);
    console.log('🛒 [SERVICE] Total Vendas:', totalVendas);

    const receitaTotal = totalServicos + totalVendas;
    console.log('💵 [SERVICE] Receita Total:', receitaTotal);

    const despesaTotal = dados.despesas.reduce((acc, d) => {
      const valor = Number(d.valor) || 0;
      return acc + valor;
    }, 0);
    console.log('💸 [SERVICE] Total Despesas:', despesaTotal);

    const lucroLiquido = receitaTotal - despesaTotal;
    const margemLucro = receitaTotal > 0 ? (lucroLiquido / receitaTotal * 100) : 0;

    const resultado = {
      resumo: { 
        receitaTotal, 
        lucroLiquido, 
        despesaTotal,
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

    console.log('✅ [SERVICE] Resultado processamento:', resultado);
    return resultado;
  },

  processarRelatorioEstoque(produtos) {
    console.log('🔄 [SERVICE] Processando relatório de estoque...');
    
    const valorTotalEstoque = produtos.reduce((acc, p) => {
      const qtd = Number(p.quantidade_atual) || 0;
      const custo = Number(p.custo) || Number(p.custo_unitario) || 0;
      return acc + (qtd * custo);
    }, 0);

    const produtosCriticos = produtos.filter(p => {
      const atual = Number(p.quantidade_atual) || 0;
      const minimo = Number(p.estoque_minimo) || Number(p.quantidade_minima) || 5;
      return atual <= minimo;
    });

    return {
      resumo: { 
        itensCadastrados: produtos.length, 
        valorTotalEstoque, 
        produtosCriticos: produtosCriticos.length 
      },
      detalhes: produtos.map(p => ({
        nome: p.nome,
        qtd: p.quantidade_atual || 0,
        custo: p.custo || p.custo_unitario || 0,
        status: (p.quantidade_atual || 0) <= (p.estoque_minimo || p.quantidade_minima || 5) ? 'CRÍTICO' : 'OK'
      }))
    };
  },

  processarRelatorioClientes(dados) {
    console.log('🔄 [SERVICE] Processando relatório de clientes...');
    
    const mapClientes = {};
    
    dados.forEach(item => {
      const nome = item.clientes?.nome || 'Cliente Não Identificado';
      if (!mapClientes[nome]) {
        mapClientes[nome] = { total: 0, visitas: 0 };
      }
      mapClientes[nome].total += (Number(item.valor_total) || Number(item.valor) || 0);
      mapClientes[nome].visitas += 1;
    });

    const lista = Object.entries(mapClientes)
      .map(([nome, info]) => ({
        cliente: nome,
        gasto_total: info.total,
        visitas: info.visitas
      }))
      .sort((a, b) => b.gasto_total - a.gasto_total);

    const totalGasto = lista.reduce((acc, c) => acc + c.gasto_total, 0);
    const ticketMedio = lista.length > 0 ? (totalGasto / lista.length) : 0;

    return {
      resumo: { 
        clientesAtendidos: lista.length, 
        ticketMedio 
      },
      detalhes: lista.slice(0, 15),
      graficos: lista.slice(0, 5).map(c => ({ 
        name: c.cliente, 
        valor: c.gasto_total 
      }))
    };
  },

  processarRelatorioFornecedores(fornecedores) {
    console.log('🔄 [SERVICE] Processando relatório de fornecedores...');
    
    const ativos = fornecedores.filter(f => f.ativo !== false);

    return {
      resumo: { 
        total: fornecedores.length, 
        ativos: ativos.length 
      },
      detalhes: fornecedores.map(f => ({
        nome: f.nome,
        contato: f.telefone || f.email || '-',
        status: f.ativo !== false ? 'Ativo' : 'Inativo'
      }))
    };
  },

  // ==================== UTILITÁRIOS ====================
  
  calcularPeriodo(periodo) {
    const hoje = new Date();
    let dataInicio = new Date();
    let dataFim = new Date();
    hoje.setHours(0, 0, 0, 0);

    switch (periodo) {
      case 'hoje':
        dataInicio = new Date(hoje);
        dataFim = new Date(hoje);
        dataFim.setHours(23, 59, 59, 999);
        break;
      
      case 'semana': {
        const diff = hoje.getDay() === 0 ? 6 : hoje.getDay() - 1;
        dataInicio.setDate(hoje.getDate() - diff);
        dataInicio.setHours(0, 0, 0, 0);
        dataFim = new Date(dataInicio);
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
        dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        dataFim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    const resultado = {
      dataInicio: dataInicio.toISOString(), 
      dataFim: dataFim.toISOString()
    };

    console.log('📅 [SERVICE] Período calculado:', {
      periodo,
      dataInicio: dataInicio.toLocaleDateString('pt-BR'),
      dataFim: dataFim.toLocaleDateString('pt-BR')
    });

    return resultado;
  },

  agruparPorCategoria(items, tipoOrigem) {
    const agrupado = items.reduce((acc, item) => {
      const categoria = item.categoria || item.servico || 'Geral';
      if (!acc[categoria]) acc[categoria] = 0;
      
      const valor = Number(item.valor_total) || 
                   Number(item.valor) || 
                   Number(item.total) || 0;
      acc[categoria] += valor;
      return acc;
    }, {});
    
    return Object.entries(agrupado).map(([cat, val]) => ({
      categoria: cat,
      tipo: tipoOrigem,
      total: val
    }));
  },

  // ==================== EXPORTAÇÃO ====================
  
  async exportarParaExcel(dados, nomeArquivo = 'relatorio') {
    console.log('📊 [SERVICE] Exportando para Excel:', nomeArquivo);
    
    try {
      const workbook = XLSX.utils.book_new();
      
      if (dados.resumo) {
        const resumoSheet = XLSX.utils.json_to_sheet([dados.resumo]);
        XLSX.utils.book_append_sheet(workbook, resumoSheet, 'Resumo');
      }
      
      if (dados.detalhes && dados.detalhes.length > 0) {
        const detalhesSheet = XLSX.utils.json_to_sheet(dados.detalhes);
        XLSX.utils.book_append_sheet(workbook, detalhesSheet, 'Detalhes');
      }
      
      XLSX.writeFile(workbook, `${nomeArquivo}_${new Date().getTime()}.xlsx`);
      console.log('✅ [SERVICE] Excel exportado com sucesso');
      
    } catch (error) {
      console.error('❌ [SERVICE] Erro ao exportar Excel:', error);
      throw error;
    }
  },

  async exportarParaPDF(dados, titulo) {
    console.log('📄 [SERVICE] Exportando para PDF:', titulo);
    
    try {
      const doc = new jsPDF();
      
      doc.setFontSize(18);
      doc.text(titulo, 14, 22);
      
      doc.setFontSize(10);
      doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 30);
      
      if (dados.resumo) {
        const resumoData = Object.entries(dados.resumo).map(([key, value]) => [
          key.toUpperCase(),
          typeof value === 'number' 
            ? value.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) 
            : value
        ]);
        
        autoTable(doc, {
          startY: 40,
          head: [['Métrica', 'Valor']],
          body: resumoData,
          headStyles: { fillColor: [124, 58, 237] }
        });
      }

      if (dados.detalhes && dados.detalhes.length > 0) {
        const headers = Object.keys(dados.detalhes[0]).map(k => k.toUpperCase());
        const body = dados.detalhes.map(item => 
          Object.values(item).map(val => 
            typeof val === 'number' 
              ? val.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) 
              : val
          )
        );
        
        autoTable(doc, {
          startY: doc.lastAutoTable ? doc.lastAutoTable.finalY + 15 : 100,
          head: [headers],
          body: body,
          headStyles: { fillColor: [40, 40, 40] }
        });
      }
      
      doc.save(`${titulo.replace(/\s+/g, '_')}.pdf`);
      console.log('✅ [SERVICE] PDF exportado com sucesso');
      
    } catch (error) {
      console.error('❌ [SERVICE] Erro ao exportar PDF:', error);
      throw error;
    }
  }
};