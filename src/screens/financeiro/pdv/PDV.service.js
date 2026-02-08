import { supabase } from '../../services/supabase';
import jsPDF from 'jspdf';
import * as QRCodeGenerator from 'qrcode';

export const pdvService = {
  // --- CARREGAMENTO DE DADOS ---
  async carregarDadosIniciais(userId) {
    // 1. Buscar ID do Salão do usuário logado
    const { data: userData } = await supabase
      .from('usuarios')
      .select('salao_id')
      .eq('id', userId)
      .single();

    if (!userData) throw new Error('Usuário não encontrado');
    const salaoId = userData.salao_id;

    // 2. Buscar Dados em Paralelo
    const [config, ultimaVenda, produtos, servicos, clientes, agendamentos, vendasPendentes] = await Promise.all([
      // Configurações
      supabase.from('config_salao').select('*').eq('salao_id', salaoId).single(),
      
      // Última Venda (para gerar próximo número)
      supabase.from('vendas').select('numero_venda').eq('salao_id', salaoId).order('numero_venda', { ascending: false }).limit(1).single(),
      
      // Produtos Ativos com Estoque
      supabase.from('produtos').select('*').eq('salao_id', salaoId).eq('ativo', true).gt('quantidade_atual', 0).order('nome'),
      
      // Serviços Ativos
      supabase.from('servicos').select('*').eq('salao_id', salaoId).eq('ativo', true).order('nome'),
      
      // Clientes
      supabase.from('clientes').select('*').eq('salao_id', salaoId).eq('ativo', true).order('nome'),
      
      // Agendamentos de Hoje
      supabase.from('agendamentos')
        .select(`*, clientes (nome, telefone, whatsapp), servicos (nome, preco_base)`)
        .eq('salao_id', salaoId)
        .gte('data', new Date().toISOString().split('T')[0])
        .lte('data', new Date().toISOString().split('T')[0])
        .eq('status', 'confirmado')
        .order('hora_inicio'),

      // Vendas Pendentes
      supabase.from('vendas')
        .select('*, clientes(nome)')
        .eq('salao_id', salaoId)
        .eq('status', 'pendente')
        .order('created_at', { ascending: false })
    ]);

    // Processar Clientes (Status e Dias sem Visita)
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
      ultimoNumeroVenda: ultimaVenda.data?.numero_venda || 0,
      produtos: produtos.data || [],
      servicos: servicos.data || [],
      clientes: clientesProcessados,
      agendamentos: agendamentos.data || [],
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
      salaoId, carrinho, cliente, total, subtotal, desconto, 
      formaPagamento, ultimoNumeroVenda, pontosGanhos, valorCashback 
    } = dadosVenda;

    // 1. Gerar Número da Venda
    let numeroVenda = ultimoNumeroVenda + 1;
    // Tenta pegar do banco para garantir sequência (opcional, se tiver RPC)
    // const { data: rpcNum } = await supabase.rpc('get_proximo_numero_venda', { p_salao_id: salaoId });
    // if (rpcNum) numeroVenda = rpcNum;

    // 2. Criar Venda
    const { data: venda, error } = await supabase
      .from('vendas')
      .insert([{
        salao_id: salaoId,
        cliente_id: cliente?.id || null,
        subtotal,
        desconto,
        total,
        forma_pagamento: formaPagamento,
        status: 'concluida',
        numero_venda: numeroVenda,
        pontos_gerados: pontosGanhos,
        cashback_gerado: valorCashback
      }])
      .select()
      .single();

    if (error) throw error;

    // 3. Salvar Itens e Atualizar Estoque
    for (const item of carrinho) {
      await supabase.from('itens_venda').insert([{
        venda_id: venda.id,
        produto_id: item.tipo === 'produto' ? item.id : null,
        servico_id: item.tipo === 'servico' ? item.id : null,
        tipo: item.tipo,
        quantidade: item.qtd,
        preco_unitario: item.preco_venda,
        total: item.preco_venda * item.qtd,
        nome: item.nome
      }]);

      if (item.tipo === 'produto') {
        // Baixa no Estoque
        const { data: prod } = await supabase.from('produtos').select('quantidade_atual').eq('id', item.id).single();
        if (prod) {
          await supabase.from('produtos')
            .update({ quantidade_atual: prod.quantidade_atual - item.qtd })
            .eq('id', item.id);
            
          // Registro de Movimentação
          await supabase.from('movimentacoes_estoque').insert([{
            salao_id: salaoId,
            produto_id: item.id,
            tipo: 'saida',
            quantidade: item.qtd,
            observacoes: `Venda #${venda.numero_venda}`
          }]);
        }
      } else if (item.tipo === 'servico' && item.agendamento_id) {
        // Concluir Agendamento
        await supabase.from('agendamentos').update({ status: 'concluido' }).eq('id', item.agendamento_id);
      }
    }

    // 4. Atualizar Cliente (Fidelidade)
    if (cliente) {
      await supabase.from('clientes')
        .update({ 
          pontos: (cliente.pontos || 0) + pontosGanhos,
          saldo_cashback: (cliente.saldo_cashback || 0) + valorCashback,
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

    // Cabeçalho
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(dadosSalao.nome || 'Salão', 40, y, { align: 'center' });
    y += 5;
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Venda #${venda.numero_venda}`, margin, y);
    y += 4;
    doc.text(new Date().toLocaleString('pt-BR'), margin, y);
    y += 6;

    doc.line(margin, y, 76, y); // Linha
    y += 5;

    // Itens
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

    // Totais
    doc.setFont('helvetica', 'bold');
    doc.text(`TOTAL: R$ ${venda.total.toFixed(2)}`, 76, y, { align: 'right' });
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.text(`Pagamento: ${venda.forma_pagamento.toUpperCase()}`, margin, y);
    
    // QR Code PIX (Se for o caso)
    if (venda.forma_pagamento === 'pix') {
       y += 10;
       // Aqui entraria a lógica do QRCodeGenerator se necessário
       doc.text('Pagamento via PIX', 40, y, { align: 'center' });
    }

    y += 10;
    doc.text('Obrigado pela preferência!', 40, y, { align: 'center' });

    return doc.output('blob');
  }
};