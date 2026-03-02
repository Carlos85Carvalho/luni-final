// src/screens/financeiro/relatorios/relatoriosHooks.js
import { useState, useCallback } from 'react';
import { supabase } from '../../../services/supabase';
import { relatoriosService } from './relatorios.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; // 🚀 A mágica que desenha as tabelas no PDF

export const useRelatorios = () => {
  const [loading, setLoading] = useState(false);
  const [relatoriosGerados, setRelatoriosGerados] = useState([]);

  const gerarRelatorio = useCallback(async (tipo, periodo) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');
      const { data: usuario } = await supabase.from('usuarios').select('salao_id').eq('id', user.id).single();
      
      const dadosRelatorio = await relatoriosService.gerarRelatorioCompleto(usuario.salao_id, tipo, periodo);
      if (!dadosRelatorio || !dadosRelatorio.resumo) return dadosRelatorio;

      const novoHistorico = { id: Date.now(), tipo, titulo: dadosRelatorio.titulo, periodo, data: new Date().toISOString(), dados: dadosRelatorio };
      setRelatoriosGerados(prev => [novoHistorico, ...prev]);
      return dadosRelatorio;
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      alert(`Erro ao gerar relatório: ${error.message}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // 🚀 NOVO MOTOR DE EXPORTAÇÃO EM PDF GERENCIAL
  const exportarDadosPDF = useCallback(async (periodo) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: usuario } = await supabase.from('usuarios').select('salao_id').eq('id', user.id).single();
      const salaoId = usuario?.salao_id;

      // 1. Calcula as Datas
      const hoje = new Date();
      const fuso = hoje.getTimezoneOffset() * 60000;
      const hojeLocal = new Date(hoje - fuso).toISOString().split('T')[0];
      let inicio, fim;

      if (periodo === 'hoje') { inicio = hojeLocal; fim = hojeLocal; } 
      else if (periodo === 'semana') {
        const d = new Date(hoje - fuso);
        inicio = new Date(d.setDate(d.getDate() - d.getDay())).toISOString().split('T')[0];
        fim = hojeLocal;
      } else if (periodo === 'mes') {
        inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0];
        fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().split('T')[0];
      } else if (periodo === 'ano') {
        inicio = new Date(hoje.getFullYear(), 0, 1).toISOString().split('T')[0];
        fim = new Date(hoje.getFullYear(), 11, 31).toISOString().split('T')[0];
      }

      const dataInicioQuery = `${inicio} 00:00:00`;
      const dataFimQuery = `${fim} 23:59:59`;

      // 2. BUSCA TODOS OS DADOS COM RELACIONAMENTOS (Profissional, Serviço, Cliente, Fornecedor)
      const [despesasReq, agendamentosReq, vendasReq] = await Promise.all([
        // Tenta buscar o nome do fornecedor, se não tiver, agrupa pela categoria
        supabase.from('despesas').select('*, fornecedor:fornecedores(nome)').eq('salao_id', salaoId).gte('data_vencimento', dataInicioQuery).lte('data_vencimento', dataFimQuery),
        supabase.from('agendamentos').select('*, cliente:clientes(nome), servico:servicos(nome), profissional:profissionais(nome)').eq('salao_id', salaoId).eq('status', 'concluido').gte('data', dataInicioQuery).lte('data', dataFimQuery),
        supabase.from('vendas').select('*, cliente:clientes(nome)').eq('salao_id', salaoId).in('status', ['concluida', 'pago']).gte('data_venda', dataInicioQuery).lte('data_venda', dataFimQuery)
      ]);

      const despesas = despesasReq.data || [];
      const agendamentos = agendamentosReq.data || [];
      const vendas = vendasReq.data || [];

      // 3. MATEMÁTICA GERENCIAL
      const formatMoeda = (v) => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
      
      const totalDespesas = despesas.reduce((acc, d) => acc + Number(d.valor || 0), 0);
      const totalAgenda = agendamentos.reduce((acc, a) => acc + Number(a.valor || a.valor_total || a.preco || 0), 0);
      const totalVendas = vendas.reduce((acc, v) => acc + Number(v.total || v.valor_total || 0), 0);
      const totalReceita = totalAgenda + totalVendas;

      // --- Performance da Equipe ---
      const perfEquipe = {};
      agendamentos.forEach(a => {
        const nomeProf = a.profissional?.nome || 'Sem Profissional Vinculado';
        const valor = Number(a.valor || a.valor_total || a.preco || 0);
        if (!perfEquipe[nomeProf]) perfEquipe[nomeProf] = { valor: 0, qtd: 0 };
        perfEquipe[nomeProf].valor += valor;
        perfEquipe[nomeProf].qtd += 1;
      });
      const rankingEquipe = Object.entries(perfEquipe)
        .map(([nome, data]) => ({ nome, valor: data.valor, qtd: data.qtd, pct: totalAgenda > 0 ? ((data.valor / totalAgenda) * 100).toFixed(1) : 0 }))
        .sort((a, b) => b.valor - a.valor);

      // --- Top 10 Serviços/Produtos ---
      const topServicos = {};
      agendamentos.forEach(a => {
        const nome = a.servico?.nome || 'Serviço Diversos';
        topServicos[nome] = (topServicos[nome] || 0) + 1;
      });
      const rankingServicos = Object.entries(topServicos).map(([nome, qtd]) => ({ nome, qtd })).sort((a, b) => b.qtd - a.qtd).slice(0, 10);

      // --- Top 3 Fornecedores (Maiores Custos) ---
      const topFornecedores = {};
      despesas.forEach(d => {
        const nome = d.fornecedor?.nome || d.descricao || 'Outros Custos';
        topFornecedores[nome] = (topFornecedores[nome] || 0) + Number(d.valor);
      });
      const rankingFornecedores = Object.entries(topFornecedores).map(([nome, valor]) => ({ nome, valor })).sort((a, b) => b.valor - a.valor).slice(0, 3);


      // ==========================================
      // 🚀 DESENHANDO O PDF
      // ==========================================
      const doc = new jsPDF();
      let yY = 15;

      // Cabeçalho
      doc.setFontSize(18);
      doc.setTextColor(139, 92, 246); // Roxo
      doc.text("LUNI - RELATÓRIO GERENCIAL EXECUTIVO", 14, yY);
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      yY += 6;
      doc.text(`Período de Apuração: ${new Date(inicio).toLocaleDateString('pt-BR')} até ${new Date(fim).toLocaleDateString('pt-BR')}`, 14, yY);
      yY += 5;
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, yY);

      // 1. Resumo Financeiro
      yY += 10;
      autoTable(doc, {
        startY: yY,
        head: [['Resumo Financeiro', 'Valor (R$)']],
        body: [
          ['Receita Bruta Total', formatMoeda(totalReceita)],
          ['Total de Despesas', formatMoeda(totalDespesas)],
          ['Lucro Líquido do Período', formatMoeda(totalReceita - totalDespesas)],
        ],
        theme: 'grid',
        headStyles: { fillColor: [17, 24, 39] }
      });
      yY = doc.lastAutoTable.finalY + 15;

      // 2. Performance da Equipe
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text("Performance e Faturamento da Equipe", 14, yY);
      autoTable(doc, {
        startY: yY + 5,
        head: [['Profissional', 'Atendimentos', 'Faturamento Gerado', '% do Salão']],
        body: rankingEquipe.map(p => [p.nome, p.qtd, formatMoeda(p.valor), `${p.pct}%`]),
        theme: 'striped',
        headStyles: { fillColor: [139, 92, 246] }
      });
      yY = doc.lastAutoTable.finalY + 15;

      // 3. Top 10 Mais Vendidos & Top 3 Fornecedores (Lado a Lado ou Sequencial)
      // Checa se precisa pular de página
      if (yY > 230) { doc.addPage(); yY = 20; }

      doc.setFontSize(14);
      doc.text("Top 10 - Serviços e Produtos Mais Vendidos", 14, yY);
      autoTable(doc, {
        startY: yY + 5,
        head: [['Ranking', 'Serviço / Produto', 'Qtd Realizada']],
        body: rankingServicos.map((s, i) => [`#${i + 1}`, s.nome, s.qtd]),
        theme: 'striped',
        headStyles: { fillColor: [236, 72, 153] } // Rosa
      });
      yY = doc.lastAutoTable.finalY + 15;

      if (yY > 230) { doc.addPage(); yY = 20; }

      doc.setFontSize(14);
      doc.text("Top 3 - Maior Concentração de Despesas (Fornecedores)", 14, yY);
      autoTable(doc, {
        startY: yY + 5,
        head: [['Ranking', 'Fornecedor / Despesa', 'Valor Total Pago']],
        body: rankingFornecedores.map((f, i) => [`#${i + 1}`, f.nome, formatMoeda(f.valor)]),
        theme: 'grid',
        headStyles: { fillColor: [245, 158, 11] } // Laranja
      });

      // Salva o PDF
      doc.save(`Luni_Relatorio_Gerencial_${periodo}.pdf`);

    } catch (error) {
      console.error("Erro na exportação PDF:", error);
      alert("Houve um erro ao gerar o PDF. Verifique o console.");
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    relatoriosGerados,
    gerarRelatorio,
    exportarDadosPDF // 🚀 Exporta a nova função
  };
};