// src/screens/financeiro/pdv/PDV.service.js
import { supabase } from '../../../services/supabase';
import jsPDF from 'jspdf';

export const pdvService = {
  // --- CARREGAMENTO DE DADOS ---
  async carregarDadosIniciais(userId) {
    const { data: userData } = await supabase
      .from('usuarios')
      .select('salao_id')
      .eq('id', userId)
      .single();

    if (!userData) throw new Error('Usuário não encontrado');
    const salaoId = userData.salao_id;

    // 🚀 REMOVIDA A BUSCA PELO "numero_venda" AQUI TAMBÉM
    const [config, produtos, servicos, clientes, vendasPendentes] = await Promise.all([
      supabase.from('config_salao').select('*').eq('salao_id', salaoId).single(),
      
      supabase.from('produtos')
        .select('*')
        .eq('salao_id', salaoId)
        .eq('ativo', true)
        .eq('exibir_pdv', true) 
        .order('nome'),
      
      supabase.from('servicos').select('*').eq('salao_id', salaoId).eq('ativo', true).order('nome'),
      supabase.from('clientes').select('*').eq('salao_id', salaoId).eq('ativo', true).order('nome'),
      supabase.from('vendas').select('*, clientes(nome)').eq('salao_id', salaoId).eq('status', 'pendente').order('created_at', { ascending: false })
    ]);

    const clientesProcessados = (clientes.data || []).map(cliente => ({
      ...cliente,
      dias_sem_visita: cliente.ultima_visita 
        ? Math.floor((new Date() - new Date(cliente.ultima_visita)) / (1000 * 60 * 60 * 24)) 
        : 999,
      status: (cliente.pontos > 100) ? 'vip' : (cliente.total_gasto > 500) ? 'regular' : 'novo'
    }));

    return {
      salaoId,
      config: config.data?.config_fidelidade || { ativo: true, pontosPorReal: 1, valorMinimoParaPontos: 10, cashbackPercentual: 5 },
      produtos: produtos.data || [],
      servicos: servicos.data || [],
      clientes: clientesProcessados,
      agendamentos: [], 
      vendasPendentes: vendasPendentes.data || []
    };
  },

  async carregarHistoricoCliente(clienteId, salaoId) {
    const { data } = await supabase
      .from('vendas')
      .select(`*, itens_venda (*, produtos (nome, categoria)), clientes (nome, whatsapp)`)
      .eq('cliente_id', clienteId)
      .eq('salao_id', salaoId)
      .eq('status', 'concluida')
      .order('created_at', { ascending: false })
      .limit(20);
    return data || [];
  },

  // --- FINALIZAÇÃO DE VENDA ---
  async finalizarVenda(dadosVenda) {
    const { 
      salaoId, carrinho, cliente, total, subtotal, desconto, formaPagamento 
    } = dadosVenda;

    // 1. Salva a Capa da Venda
    const { data: venda, error } = await supabase
      .from('vendas')
      .insert([{
        salao_id: salaoId,
        empresa_id: salaoId, 
        cliente_id: cliente?.id || null,
        subtotal,
        desconto,
        total,
        forma_pagamento: formaPagamento,
        status: 'concluida'
        // 🚀 APAGADO: numero_venda. O banco vai aceitar a venda livremente agora!
      }])
      .select()
      .single();

    if (error) throw error;

    // 2. Salva os Itens da Venda
    for (const item of carrinho) {
      await supabase.from('itens_venda').insert([{
        venda_id: venda.id,
        empresa_id: salaoId, 
        produto_id: item.tipo === 'produto' ? item.id : null,
        servico_id: (item.tipo === 'servico') ? item.servico_id : null,
        tipo: item.tipo,
        quantidade: item.qtd,
        preco_unitario: item.preco_venda,
        total: item.preco_venda * item.qtd,
        nome: item.nome
      }]);

      // Dá baixa no estoque
      if (item.tipo === 'produto') {
        const { data: prod } = await supabase.from('produtos').select('quantidade_atual').eq('id', item.id).single();
        if (prod) {
          await supabase.from('produtos')
            .update({ quantidade_atual: prod.quantidade_atual - item.qtd })
            .eq('id', item.id);
            
          await supabase.from('movimentacoes_estoque').insert([{
            salao_id: salaoId,
            empresa_id: salaoId, 
            produto_id: item.id,
            tipo: 'saida',
            quantidade: item.qtd,
            observacoes: `Venda PDV (Balcão)`
          }]);
        }
      }
    }

    // 3. Atualiza Cliente
    if (cliente) {
      await supabase.from('clientes')
        .update({ 
          total_gasto: (cliente.total_gasto || 0) + total,
          total_compras: (cliente.total_compras || 0) + 1,
          ultima_visita: new Date().toISOString(),
          ultima_compra: new Date().toISOString()
        })
        .eq('id', cliente.id);
    }

    return venda;
  },

  // --- GERADOR DE PDF ---
  async gerarReciboPDF(venda, cliente, carrinho, dadosSalao) {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [80, 297] });
    let y = 5;
    const margin = 4;

    // 🚀 Gera um código curto e bonito usando o ID da venda do banco
    const codigoVenda = venda?.id ? String(venda.id).substring(0, 6).toUpperCase() : '001';

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(dadosSalao.nome || 'Salão', 40, y, { align: 'center' });
    y += 5;
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Venda #${codigoVenda}`, margin, y);
    y += 4;
    doc.text(new Date().toLocaleString('pt-BR'), margin, y);
    y += 6;

    doc.line(margin, y, 76, y);
    y += 5;

    doc.setFont('helvetica', 'bold');
    doc.text('ITENS', margin, y);
    y += 4;
    doc.setFont('helvetica', 'normal');

    carrinho.forEach(item => {
      const nome = item.nome.substring(0, 25);
      doc.text(`${item.qtd}x ${nome}`, margin, y);
      doc.text(item.preco_venda.toFixed(2), 76, y, { align: 'right' });
      y += 4;
    });

    y += 2;
    doc.line(margin, y, 76, y);
    y += 5;

    doc.setFont('helvetica', 'bold');
    doc.text(`TOTAL: R$ ${venda.total.toFixed(2)}`, 76, y, { align: 'right' });
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.text(`Pagamento: ${venda.forma_pagamento.toUpperCase()}`, margin, y);
    
    if (venda.forma_pagamento === 'pix') {
        y += 10;
        doc.text('Pagamento via PIX', 40, y, { align: 'center' });
    }

    y += 10;
    doc.text('Obrigado pela preferência!', 40, y, { align: 'center' });

    return doc.output('blob');
  }
};