// src/screens/metas/pdv/PDV.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../services/supabase';
import { PDVGrid } from './PDVGrid';
import { PDVCart } from './PDVCart';
import { PDVModals } from './PDVModals';
import { ShoppingBag, Loader2 } from 'lucide-react';

export const PDV = () => {
  const [produtos, setProdutos] = useState([]);
  const [agendamentosProx, setAgendamentosProx] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [abaAtiva, setAbaAtiva] = useState('agendamentos');
  const [busca, setBusca] = useState('');
  const [categoriaAtiva, setCategoriaAtiva] = useState('todas');
  const [processando, setProcessando] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [carrinho, setCarrinho] = useState([]);
  const [cliente, setCliente] = useState(null);
  const [desconto, setDesconto] = useState(0);
  const [tipoDesconto, setTipoDesconto] = useState('valor');
  const [modalState, setModalState] = useState({ view: null, dados: null, isOpen: false });

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
          ...a, hora: a.horario,
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

  const subtotal = carrinho.reduce((acc, item) => acc + (item.preco_venda * item.qtd), 0);
  const valorDescontoCalculado = tipoDesconto === 'percentual' ? (subtotal * desconto) / 100 : desconto;
  const total = Math.max(0, subtotal - valorDescontoCalculado);

  const handleFinalizarVenda = async (formaPagamento) => {
    setProcessando(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const salaoId = user?.user_metadata?.salao_id || carrinho[0]?.salao_id || user?.id;

      const { data: venda, error: errVenda } = await supabase.from('vendas').insert({
        cliente_id: cliente?.id || null, salao_id: salaoId, total, subtotal,
        desconto: valorDescontoCalculado, forma_pagamento: formaPagamento,
        status: 'concluida', data_venda: new Date().toISOString(),
      }).select().single();

      if (errVenda) throw new Error(`Erro ao criar venda: ${errVenda.message}`);

      await supabase.from('venda_itens').insert(carrinho.map(item => ({
        venda_id: venda.id,
        produto_id: item.tipo === 'produto' ? item.id : null,
        agendamento_id: item.tipo === 'agendamento' ? item.id : null,
        nome_item: item.nome, quantidade: item.qtd,
        preco: item.preco_venda, preco_unitario: item.preco_venda,
        valor_total: item.preco_venda * item.qtd
      })));

      await Promise.all(carrinho.map(async (item) => {
        if (item.tipo === 'produto') {
          const novoEstoque = (item.estoque || 0) - item.qtd;
          return Promise.all([
            supabase.from('produtos').update({ estoque: novoEstoque, quantidade_atual: novoEstoque }).eq('id', item.id),
            supabase.from('movimentacoes_estoque').insert({
              salao_id: salaoId, produto_id: item.id, tipo: 'saida', origem: 'PDV',
              quantidade: item.qtd, valor_total: item.preco_venda * item.qtd,
              custo_unitario: item.custo, data_movimentacao: new Date().toISOString(),
              observacoes: `Venda PDV #${venda.id}`
            })
          ]);
        } else if (item.tipo === 'agendamento') {
          return supabase.from('agendamentos').update({ status: 'concluido' }).eq('id', item.id);
        }
      }));

      setModalState({
        view: 'sucesso', isOpen: true,
        dados: { vendaId: venda.id, total, carrinho: [...carrinho], cliente, formaPagamento }
      });
      setCarrinho([]); setCliente(null); setDesconto(0);
      await fetchDados(true);
    } catch (error) {
      alert('Erro ao finalizar venda: ' + error.message);
    } finally {
      setProcessando(false);
    }
  };

  const adicionarAoCarrinho = (item, tipo) => {
    if (tipo === 'agendamento' && (item.cliente_id || item.clientes?.id)) {
      setCliente({ nome: item.cliente_nome, id: item.cliente_id || item.clientes?.id, telefone: item.cliente_telefone });
    }
    setCarrinho(prev => {
      const existente = prev.find(i => i.id === item.id && i.tipo === tipo);
      if (existente) return prev.map(i => i.id === item.id && i.tipo === tipo ? { ...i, qtd: i.qtd + 1 } : i);
      const precoFinal = tipo === 'produto' ? (item.preco || item.preco_venda || 0) : (item.preco || 0);
      const nomeFinal = tipo === 'produto' ? item.nome : `${item.servico_nome} (${item.cliente_nome})`;
      return [...prev, { id: item.id, salao_id: item.salao_id, nome: nomeFinal, tipo, qtd: 1, preco_venda: precoFinal, estoque: item.estoque, custo: item.custo || item.custo_unitario || 0 }];
    });
  };

  const removerDoCarrinho = (id, tipo) => setCarrinho(prev => prev.filter(i => !(i.id === id && i.tipo === tipo)));

  const ajustarQuantidade = (id, tipo, delta) => {
    setCarrinho(prev => prev.map(item => {
      if (item.id === id && item.tipo === tipo) {
        const novaQtd = Math.max(1, item.qtd + delta);
        if (item.tipo === 'produto' && item.estoque && novaQtd > item.estoque) {
          alert(`Estoque insuficiente! Disponível: ${item.estoque}`); return item;
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

  const produtosFiltrados = produtos.filter(p =>
    p.nome.toLowerCase().includes(busca.toLowerCase()) &&
    (categoriaAtiva === 'todas' || p.categoria === categoriaAtiva)
  );
  const agendamentosFiltrados = agendamentosProx.filter(a =>
    a.cliente_nome.toLowerCase().includes(busca.toLowerCase()) ||
    a.servico_nome.toLowerCase().includes(busca.toLowerCase())
  );

  if (carregando) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <Loader2 className="w-10 h-10 text-purple-400 animate-spin mx-auto" />
          <p className="text-gray-400 text-sm">Carregando PDV...</p>
        </div>
      </div>
    );
  }

  return (
    // ✅ TEMA MAIS CLARO: bg-[#16161f] em vez de #09090b
    <div className="min-h-screen bg-[#16161f] text-white pb-24">
      <div className="max-w-[1600px] mx-auto p-4 lg:p-6">
        
        {/* HEADER */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/15 border border-purple-400/25 rounded-xl flex items-center justify-center">
              <ShoppingBag size={20} className="text-purple-300" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Ponto de Venda</h1>
              <p className="text-xs text-gray-400">
                {carrinho.length === 0 ? 'Carrinho vazio' : `${carrinho.reduce((a, i) => a + i.qtd, 0)} itens · R$ ${total.toFixed(2)}`}
              </p>
            </div>
          </div>

          {cliente && (
            <div className="hidden md:flex items-center gap-2 bg-purple-500/10 border border-purple-400/20 rounded-xl px-4 py-2">
              <div className="w-6 h-6 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-300 text-xs font-bold">
                {cliente.nome.charAt(0)}
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Cliente</p>
                <p className="text-sm font-semibold text-white">{cliente.nome}</p>
              </div>
            </div>
          )}
        </div>

        {/* GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            <PDVGrid
              abaAtiva={abaAtiva} setAbaAtiva={setAbaAtiva}
              busca={busca} setBusca={setBusca}
              categorias={categorias} categoriaAtiva={categoriaAtiva} setCategoriaAtiva={setCategoriaAtiva}
              produtos={produtosFiltrados} agendamentos={agendamentosFiltrados}
              onAdicionarItem={adicionarAoCarrinho}
              onEditarPreco={(item) => abrirModal('editar-preco', item)}
            />
          </div>

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
                          disabled:bg-white/[0.05] disabled:border disabled:border-white/8
                          disabled:cursor-not-allowed disabled:text-gray-600
                          text-white rounded-2xl font-bold text-base
                          shadow-lg shadow-purple-900/30
                          transition-all duration-200 active:scale-95"
              >
                {processando ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 size={18} className="animate-spin" /> Processando...
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

              {carrinho.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-[#2a2a35] border border-white/8 rounded-xl p-3 text-center">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Itens</p>
                    <p className="text-xl font-black text-white">{carrinho.reduce((a, i) => a + i.qtd, 0)}</p>
                  </div>
                  <div className="bg-[#2a2a35] border border-white/8 rounded-xl p-3 text-center">
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
        totalPagamento={total} setCliente={setCliente}
        onFinalizarPagamento={handleFinalizarVenda} processandoPagamento={processando}
        onRecuperarVenda={(venda) => console.log('Recuperar', venda)}
        onSalvarPreco={(id, novoPreco) => setCarrinho(prev => prev.map(item => item.id === id ? { ...item, preco_venda: novoPreco } : item))}
        vendasPendentes={[]}
      />
    </div>
  );
};