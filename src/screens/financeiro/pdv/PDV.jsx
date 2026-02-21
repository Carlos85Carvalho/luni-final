import { supabase } from '../../../services/supabase';
import jsPDF from 'jspdf';


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

  // --- FINALIZAÇÃO DE VENDA (Serviço) ---
  async finalizarVenda(dadosVenda) {
    const { 
      salaoId, carrinho, cliente, total, subtotal, desconto, 
      formaPagamento, ultimoNumeroVenda, pontosGanhos, valorCashback 
    } = dadosVenda;

    let numeroVenda = ultimoNumeroVenda + 1;

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

    for (const item of carrinho) {
      await supabase.from('itens_venda').insert([{
        venda_id: venda.id,
        produto_id: item.tipo === 'produto' ? item.id : null,
        servico_id: (item.tipo === 'servico' || item.tipo === 'agendamento') ? item.servico_id : null,
        tipo: item.tipo,
        quantidade: item.qtd,
        preco_unitario: item.preco_venda,
        total: item.preco_venda * item.qtd,
        nome: item.nome
      }]);

      if (item.tipo === 'produto') {
        const { data: prod } = await supabase.from('produtos').select('quantidade_atual').eq('id', item.id).single();
        if (prod) {
          await supabase.from('produtos')
            .update({ quantidade_atual: prod.quantidade_atual - item.qtd })
            .eq('id', item.id);
            
          await supabase.from('movimentacoes_estoque').insert([{
            salao_id: salaoId,
            produto_id: item.id,
            tipo: 'saida',
            quantidade: item.qtd,
            observacoes: `Venda #${venda.numero_venda}`
          }]);
        }
      } else if (item.tipo === 'servico' && item.agendamento_id) {
        await supabase.from('agendamentos').update({ status: 'concluido' }).eq('id', item.agendamento_id);
      }
    }

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


import React, { useState, useEffect, useCallback } from 'react';
import { PDVGrid } from './PDVGrid';
import { PDVCart } from './PDVCart';
import { PDVModals } from './PDVModals';
import { ShoppingBag, Loader2 } from 'lucide-react';

export const PDV = () => {
  // ========== ESTADO DE DADOS ==========
  const [produtos, setProdutos] = useState([]);
  const [agendamentosProx, setAgendamentosProx] = useState([]);
  const [categorias, setCategorias] = useState([]);
  
  // ========== ESTADO DE UI ==========
  const [abaAtiva, setAbaAtiva] = useState('agendamentos');
  const [busca, setBusca] = useState('');
  const [categoriaAtiva, setCategoriaAtiva] = useState('todas');
  const [processando, setProcessando] = useState(false);
  const [carregando, setCarregando] = useState(true);
  
  // ========== CARRINHO E CLIENTE ==========
  const [carrinho, setCarrinho] = useState([]);
  const [cliente, setCliente] = useState(null);
  const [desconto, setDesconto] = useState(0);
  const [tipoDesconto, setTipoDesconto] = useState('valor');
  const [modalState, setModalState] = useState({ view: null, dados: null, isOpen: false });

  // ========== BUSCA DE DADOS ==========
  const fetchDados = useCallback(async (silencioso = false) => {
    try {
      if (!silencioso) setCarregando(true);
      const hoje = new Date().toISOString().split('T')[0];

      const [agendamentosRes, produtosRes] = await Promise.all([
        supabase.from('agendamentos').select(`*, clientes (id, nome, telefone)`)
          .gte('data', hoje).order('data', { ascending: true }).order('horario', { ascending: true }).limit(20),
        supabase.from('produtos').select('*').order('nome')
      ]);

      if (!agendamentosRes.error) {
        setAgendamentosProx((agendamentosRes.data || []).map(a => ({
          ...a,
          hora: a.horario,
          cliente_nome: a.clientes?.nome || a.cliente_nome || 'Cliente sem nome',
          cliente_telefone: a.clientes?.telefone || a.cliente_telefone || '',
          servico_nome: a.servico || 'Serviço Agendado',
          preco: Number(a.valor || a.valor_total || 0)
        })));
      }

      if (!produtosRes.error) {
        setProdutos(produtosRes.data || []);
        setCategorias([...new Set((produtosRes.data || []).map(p => p.categoria).filter(Boolean))]);
      }
    } catch (error) {
      console.error("Erro geral PDV:", error);
    } finally {
      if (!silencioso) setCarregando(false);
    }
  }, []);

  useEffect(() => { fetchDados(); }, [fetchDados]);

  // ========== CÁLCULOS ==========
  const subtotal = carrinho.reduce((acc, item) => acc + (item.preco_venda * item.qtd), 0);
  const valorDescontoCalculado = tipoDesconto === 'percentual' ? (subtotal * desconto) / 100 : desconto;
  const total = Math.max(0, subtotal - valorDescontoCalculado);

  // ========== FINALIZAR VENDA (CORRIGIDA) ==========
  const handleFinalizarVenda = async (formaPagamento) => {
    setProcessando(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const salaoId = user?.user_metadata?.salao_id || carrinho[0]?.salao_id || user?.id;

      // 1. Salva a Capa da Venda
      const { data: venda, error: errVenda } = await supabase.from('vendas').insert({
        cliente_id: cliente?.id || null,
        salao_id: salaoId,
        total, subtotal,
        desconto: valorDescontoCalculado,
        forma_pagamento: formaPagamento,
        status: 'concluida',
        data_venda: new Date().toISOString(),
      }).select().single();

      if (errVenda) throw new Error(`Erro ao criar venda: ${errVenda.message}`);

      // 2. CORREÇÃO DA TABELA: 'vendas_itens' com colunas corretas
      const itensParaSalvar = carrinho.map(item => ({
        venda_id: venda.id,
        produto_id: item.tipo === 'produto' ? item.id : null,
        // CORREÇÃO: Usamos o servico_id que capturamos no carrinho, não o ID do agendamento
        servico_id: (item.tipo === 'agendamento' || item.tipo === 'servico') ? item.servico_id : null,
        salao_id: salaoId,
        quantidade: item.qtd,
        valor_unitario: item.preco_venda,
        valor_total: item.preco_venda * item.qtd
      }));

      const { error: errItens } = await supabase.from('vendas_itens').insert(itensParaSalvar);
      
      if (errItens) {
        console.error("Erro ao salvar itens:", errItens);
        throw new Error(`Erro ao salvar os produtos da venda. O Giro não será calculado.`);
      }

      // 3. Baixa de Estoque Real
      await Promise.all(carrinho.map(async (item) => {
        if (item.tipo === 'produto') {
          const novoEstoque = (item.estoque || 0) - item.qtd;
          return Promise.all([
            supabase.from('produtos').update({ estoque: novoEstoque, quantidade_atual: novoEstoque }).eq('id', item.id),
            supabase.from('movimentacoes_estoque').insert({
              salao_id: salaoId, 
              produto_id: item.id, 
              tipo: 'saida', 
              origem: 'PDV',
              quantidade: item.qtd, 
              valor_total: item.preco_venda * item.qtd,
              custo_unitario: item.custo, 
              data_movimentacao: new Date().toISOString(),
              observacoes: `Venda PDV #${venda.id}`
            })
          ]);
        } else if (item.tipo === 'agendamento') {
          // Usamos item.id porque aqui é o ID do agendamento para mudar o status
          return supabase.from('agendamentos').update({ status: 'concluido' }).eq('id', item.id);
        }
      }));

      // 4. Modal de Sucesso / PDF
      setModalState({ 
        view: 'sucesso', 
        isOpen: true,
        dados: { 
            vendaId: venda.id, 
            total, 
            subtotal, 
            desconto: valorDescontoCalculado,
            carrinho: [...carrinho], 
            cliente, 
            formaPagamento 
        }
      });

      setCarrinho([]);
      setCliente(null);
      setDesconto(0);
      await fetchDados(true);
      
    } catch (error) {
      alert('Erro ao finalizar venda: ' + error.message);
    } finally {
      setProcessando(false);
    }
  };

  // ========== AÇÕES DO CARRINHO ==========
  const adicionarAoCarrinho = (item, tipo) => {
    if (tipo === 'agendamento' && (item.cliente_id || item.clientes?.id)) {
      setCliente({ nome: item.cliente_nome, id: item.cliente_id || item.clientes?.id, telefone: item.cliente_telefone });
    }
    setCarrinho(prev => {
      const existente = prev.find(i => i.id === item.id && i.tipo === tipo);
      if (existente) return prev.map(i => i.id === item.id && i.tipo === tipo ? { ...i, qtd: i.qtd + 1 } : i);
      const precoFinal = tipo === 'produto' ? (item.preco || item.preco_venda || 0) : (item.preco || 0);
      const nomeFinal = tipo === 'produto' ? item.nome : `${item.servico_nome} (${item.cliente_nome})`;
      
      return [...prev, { 
        id: item.id, 
        // CORREÇÃO: Guardamos o servico_id aqui para usar na finalização
        servico_id: item.servico_id || (tipo === 'servico' ? item.id : null),
        salao_id: item.salao_id, 
        nome: nomeFinal, 
        tipo, 
        qtd: 1, 
        preco_venda: precoFinal, 
        estoque: item.estoque, 
        custo: item.custo || item.custo_unitario || 0 
      }];
    });
  };

  const removerDoCarrinho = (id, tipo) => setCarrinho(prev => prev.filter(i => !(i.id === id && i.tipo === tipo)));
  
  const ajustarQuantidade = (id, tipo, delta) => {
    setCarrinho(prev => prev.map(item => {
      if (item.id === id && item.tipo === tipo) {
        const novaQtd = Math.max(1, item.qtd + delta);
        if (item.tipo === 'produto' && item.estoque && novaQtd > item.estoque) {
          alert(`Estoque insuficiente! Disponível: ${item.estoque}`);
          return item;
        }
        return { ...item, qtd: novaQtd };
      }
      return item;
    }));
  };

  const limparCarrinho = () => {
    if (carrinho.length === 0) return;
    if (window.confirm('Limpar todo o carrinho?')) { setCarrinho([]); setCliente(null); setDesconto(0); }
  };

  const abrirModal = (view, dados = null) => setModalState({ view, dados, isOpen: true });
  const fecharModal = () => setModalState({ view: null, dados: null, isOpen: false });

  // ========== FILTROS ==========
  const produtosFiltrados = produtos.filter(p => {
    const matchBusca = p.nome.toLowerCase().includes(busca.toLowerCase());
    const matchCategoria = categoriaAtiva === 'todas' || p.categoria === categoriaAtiva;
    return matchBusca && matchCategoria;
  });
  const agendamentosFiltrados = agendamentosProx.filter(a =>
    a.cliente_nome.toLowerCase().includes(busca.toLowerCase()) ||
    a.servico_nome.toLowerCase().includes(busca.toLowerCase())
  );

  // ========== LOADING ==========
  if (carregando) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <Loader2 className="w-10 h-10 text-purple-500 animate-spin mx-auto" />
          <p className="text-gray-400 text-sm">Carregando PDV...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-white pb-24">
      <div className="max-w-[1600px] mx-auto p-4 lg:p-6">
        
        {/* HEADER */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600/20 border border-purple-500/20 rounded-xl flex items-center justify-center">
              <ShoppingBag size={20} className="text-purple-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Ponto de Venda</h1>
              <p className="text-xs text-gray-500">
                {carrinho.length === 0 ? 'Carrinho vazio' : `${carrinho.reduce((a, i) => a + i.qtd, 0)} itens · R$ ${total.toFixed(2)}`}
              </p>
            </div>
          </div>

          {cliente && (
            <div className="hidden md:flex items-center gap-2 bg-purple-600/10 border border-purple-500/20 rounded-xl px-4 py-2">
              <div className="w-6 h-6 rounded-lg bg-purple-600/20 flex items-center justify-center text-purple-400 text-xs font-bold">
                {cliente.nome.charAt(0)}
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Cliente</p>
                <p className="text-sm font-semibold text-white">{cliente.nome}</p>
              </div>
            </div>
          )}
        </div>

        {/* GRID LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          
          {/* ÁREA DE PRODUTOS/AGENDAMENTOS */}
          <div className="lg:col-span-2 space-y-4">
            <PDVGrid
              abaAtiva={abaAtiva} setAbaAtiva={setAbaAtiva}
              busca={busca} setBusca={setBusca}
              categorias={categorias} categoriaAtiva={categoriaAtiva} setCategoriaAtiva={setCategoriaAtiva}
              produtos={produtosFiltrados} agendamentos={agendamentosFiltrados}
              onAdicionarItem={adicionarAoCarrinho}
              onEditarPreco={(item) => abrirModal('editar-preco', item)}
            />
          </div>

          {/* CARRINHO + FINALIZAR */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-3">
              <PDVCart
                carrinho={carrinho} cliente={cliente}
                desconto={desconto} setDesconto={setDesconto}
                tipoDesconto={tipoDesconto} setTipoDesconto={setTipoDesconto}
                subtotal={subtotal} total={total} valorDesconto={valorDescontoCalculado}
                onRemoverItem={removerDoCarrinho} onAjustarQtd={ajustarQuantidade}
                onLimparCarrinho={limparCarrinho}
                onSelecionarCliente={() => abrirModal('selecionar-cliente')}
              />

              <button
                onClick={() => abrirModal('pagamento')}
                disabled={carrinho.length === 0 || processando}
                className="w-full py-4 bg-purple-600 hover:bg-purple-500
                           disabled:bg-[#1c1c22] disabled:border disabled:border-white/5
                           disabled:cursor-not-allowed disabled:text-gray-600
                           text-white rounded-2xl font-bold text-base
                           shadow-lg shadow-purple-900/30
                           transition-all duration-200 active:scale-95"
              >
                {processando ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 size={18} className="animate-spin" />
                    Processando...
                  </span>
                ) : carrinho.length === 0 ? (
                  'Adicione itens ao carrinho'
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <span>Finalizar Venda</span>
                    <span className="bg-white/20 px-3 py-0.5 rounded-lg font-black">R$ {total.toFixed(2)}</span>
                  </span>
                )}
              </button>

              {/* STATS RÁPIDAS */}
              {carrinho.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-[#1c1c22] border border-white/5 rounded-xl p-3 text-center">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Itens</p>
                    <p className="text-xl font-black text-white">{carrinho.reduce((a, i) => a + i.qtd, 0)}</p>
                  </div>
                  <div className="bg-[#1c1c22] border border-white/5 rounded-xl p-3 text-center">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Desconto</p>
                    <p className="text-xl font-black text-emerald-400">R$ {valorDescontoCalculado.toFixed(2)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <PDVModals
        modalState={modalState} onClose={fecharModal}
        totalPagamento={total} cliente={cliente} setCliente={setCliente}
        onFinalizarPagamento={handleFinalizarVenda} processandoPagamento={processando}
        carrinho={carrinho}
        onRecuperarVenda={(venda) => console.log('Recuperar', venda)}
        onUsarCliente={(c) => setCliente(c)}
        onSalvarPreco={(id, novoPreco) => setCarrinho(prev => prev.map(item => item.id === id ? { ...item, preco_venda: novoPreco } : item))}
        vendasPendentes={[]}
      />
    </div>
  );
};