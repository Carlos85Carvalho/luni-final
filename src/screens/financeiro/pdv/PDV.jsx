// src/screens/metas/pdv/PDV.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../services/supabase';
import { PDVGrid } from './PDVGrid';
import { PDVCart } from './PDVCart';
import { PDVModals } from './PDVModals';

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
  const [modalState, setModalState] = useState({ 
    view: null, 
    dados: null, 
    isOpen: false 
  });

  // ========== BUSCA DE DADOS (REFATORADA) ==========
  const fetchDados = useCallback(async (silencioso = false) => {
    try {
      if (!silencioso) setCarregando(true);
      const hoje = new Date().toISOString().split('T')[0];

      const [agendamentosRes, produtosRes] = await Promise.all([
        // 1. Busca Agendamentos
        supabase
          .from('agendamentos')
          .select(`
            *,
            clientes (id, nome, telefone)
          `)
          .gte('data', hoje)
          .order('data', { ascending: true })
          .order('horario', { ascending: true })
          .limit(20),
        
        // 2. Busca Produtos
        supabase
          .from('produtos')
          .select('*')
          .order('nome')
      ]);

      // Processa Agendamentos
      if (agendamentosRes.error) {
        console.error("Erro ao buscar agendamentos:", agendamentosRes.error);
      } else {
        const agendamentosFormatados = (agendamentosRes.data || []).map(a => ({
          ...a,
          hora: a.horario, 
          cliente_nome: a.clientes?.nome || a.cliente_nome || 'Cliente sem nome',
          cliente_telefone: a.clientes?.telefone || a.cliente_telefone || '',
          servico_nome: a.servico || 'Serviço Agendado',
          preco: Number(a.valor || a.valor_total || 0)
        }));
        setAgendamentosProx(agendamentosFormatados);
      }

      // Processa Produtos
      if (produtosRes.error) {
        console.error("Erro ao buscar produtos:", produtosRes.error);
      } else {
        setProdutos(produtosRes.data || []);
        const catsUnicas = [...new Set(
          (produtosRes.data || [])
            .map(p => p.categoria)
            .filter(Boolean)
        )];
        setCategorias(catsUnicas);
      }

    } catch (error) {
      console.error("Erro geral PDV:", error);
    } finally {
      if (!silencioso) setCarregando(false);
    }
  }, []);

  // Carrega dados ao montar a tela
  useEffect(() => {
    fetchDados();
  }, [fetchDados]);

  // ========== CÁLCULOS DO CARRINHO ==========
  const subtotal = carrinho.reduce((acc, item) => 
    acc + (item.preco_venda * item.qtd), 0
  );
  
  const valorDescontoCalculado = tipoDesconto === 'percentual' 
    ? (subtotal * desconto) / 100 
    : desconto;
  
  const total = Math.max(0, subtotal - valorDescontoCalculado);

  // ========== FINALIZAR VENDA (CORRIGIDA) ==========
  const handleFinalizarVenda = async (formaPagamento) => {
    setProcessando(true);
    console.log('🛒 [PDV] Iniciando finalização de venda...');
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const salaoId = user?.user_metadata?.salao_id || carrinho[0]?.salao_id || user?.id;

      // 1. Cria a Venda (CORRIGIDO: nome da coluna para data_venda)
      const vendaPayload = {
        cliente_id: cliente?.id || null,
        salao_id: salaoId,
        total: total,
        subtotal: subtotal,
        desconto: valorDescontoCalculado,
        forma_pagamento: formaPagamento,
        status: 'concluida',
        data_venda: new Date().toISOString(), // <--- CORREÇÃO AQUI
      };

      console.log('🛒 [PDV] Payload da Venda:', vendaPayload);

      const { data: venda, error: errVenda } = await supabase
        .from('vendas')
        .insert(vendaPayload)
        .select()
        .single();

      if (errVenda) {
        console.error('❌ Erro ao criar venda:', errVenda);
        throw new Error(`Erro ao criar venda: ${errVenda.message}`);
      }

      console.log('✅ Venda criada com ID:', venda.id);

      // 2. Salva os Itens
      const itensVenda = carrinho.map(item => ({
        venda_id: venda.id,
        produto_id: item.tipo === 'produto' ? item.id : null,
        agendamento_id: item.tipo === 'agendamento' ? item.id : null,
        nome_item: item.nome,
        quantidade: item.qtd,
        preco: item.preco_venda, 
        preco_unitario: item.preco_venda,
        valor_total: item.preco_venda * item.qtd
      }));

      console.log('🛒 [PDV] Salvando itens:', itensVenda);

      const { error: errItens } = await supabase
        .from('venda_itens')
        .insert(itensVenda);
      
      if (errItens) {
        console.error('❌ Erro ao salvar itens:', errItens);
      }

      // 3. Atualiza Estoque e Status Agendamento
      const updates = carrinho.map(async (item) => {
        if (item.tipo === 'produto') {
          const novoEstoque = (item.estoque || 0) - item.qtd;
          
          const updateProduto = supabase
            .from('produtos')
            .update({ 
              estoque: novoEstoque,
              quantidade_atual: novoEstoque 
            })
            .eq('id', item.id);

          const insertMovimentacao = supabase
            .from('movimentacoes_estoque')
            .insert({
              salao_id: salaoId,
              produto_id: item.id,
              tipo: 'saida',
              origem: 'PDV',
              quantidade: item.qtd,
              valor_total: item.preco_venda * item.qtd,
              custo_unitario: item.custo,
              data_movimentacao: new Date().toISOString(),
              observacoes: `Venda PDV #${venda.id}`
            });

          return Promise.all([updateProduto, insertMovimentacao]);

        } else if (item.tipo === 'agendamento') {
          return supabase
            .from('agendamentos')
            .update({ status: 'concluido' })
            .eq('id', item.id);
        }
      });

      await Promise.all(updates);

      // SUCESSO!
      alert('✅ Venda realizada com sucesso!');
      
      setCarrinho([]);
      setCliente(null);
      setDesconto(0);
      setModalState({ isOpen: false, view: null, dados: null });
      
      await fetchDados(true); 
      
    } catch (error) {
      alert('❌ Erro ao finalizar venda: ' + error.message);
      console.error(error);
    } finally {
      setProcessando(false);
    }
  };

  // ========== AÇÕES DO CARRINHO ==========
  const adicionarAoCarrinho = (item, tipo) => {
    if (tipo === 'agendamento' && (item.cliente_id || item.clientes?.id)) {
      setCliente({
        nome: item.cliente_nome,
        id: item.cliente_id || item.clientes?.id,
        telefone: item.cliente_telefone
      });
    }

    setCarrinho(prev => {
      const existente = prev.find(i => i.id === item.id && i.tipo === tipo);
      if (existente) {
        return prev.map(i => 
          i.id === item.id && i.tipo === tipo 
            ? { ...i, qtd: i.qtd + 1 } 
            : i
        );
      }
      const precoFinal = tipo === 'produto' 
        ? (item.preco || item.preco_venda || 0)
        : (item.preco || 0);
      
      const nomeFinal = tipo === 'produto'
        ? item.nome
        : `${item.servico_nome} (${item.cliente_nome})`;

      return [...prev, {
        id: item.id,
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

  const removerDoCarrinho = (id, tipo) => {
    setCarrinho(prev => prev.filter(i => !(i.id === id && i.tipo === tipo)));
  };

  const ajustarQuantidade = (id, tipo, delta) => {
    setCarrinho(prev => prev.map(item => {
      if (item.id === id && item.tipo === tipo) {
        const novaQtd = Math.max(1, item.qtd + delta);
        if (item.tipo === 'produto' && item.estoque && novaQtd > item.estoque) {
          alert(`⚠️ Estoque insuficiente! Disponível: ${item.estoque}`);
          return item;
        }
        return { ...item, qtd: novaQtd };
      }
      return item;
    }));
  };

  const limparCarrinho = () => {
    if (carrinho.length === 0) return;
    if (window.confirm('🗑️ Limpar todo o carrinho?')) {
      setCarrinho([]);
      setCliente(null);
      setDesconto(0);
    }
  };

  const abrirModal = (view, dados = null) => {
    setModalState({ view, dados, isOpen: true });
  };

  const fecharModal = () => {
    setModalState({ view: null, dados: null, isOpen: false });
  };

  // ========== FILTROS ==========
  const produtosFiltrados = produtos.filter(p => {
    const matchBusca = p.nome.toLowerCase().includes(busca.toLowerCase());
    const matchCategoria = categoriaAtiva === 'todas' || p.categoria === categoriaAtiva;
    return matchBusca && matchCategoria;
  });

  const agendamentosFiltrados = agendamentosProx.filter(a => {
    const matchBusca = 
      a.cliente_nome.toLowerCase().includes(busca.toLowerCase()) ||
      a.servico_nome.toLowerCase().includes(busca.toLowerCase());
    return matchBusca;
  });

  // ========== RENDER ==========
  if (carregando) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-white text-lg font-medium">Carregando PDV...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 pb-24">
      <div className="max-w-[1920px] mx-auto p-4 lg:p-6">
        
        {/* HEADER */}
        <div className="mb-6 bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/20 shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">
                💎 Ponto de Venda
              </h1>
              <p className="text-gray-400">
                {carrinho.length} {carrinho.length === 1 ? 'item' : 'itens'} no carrinho
              </p>
            </div>
            
            {cliente && (
              <div className="bg-purple-600/20 border border-purple-500/30 rounded-xl px-6 py-3">
                <p className="text-xs text-purple-300 uppercase tracking-wide mb-1">
                  Cliente Selecionado
                </p>
                <p className="text-white font-semibold text-lg">
                  {cliente.nome}
                </p>
                {cliente.telefone && (
                  <p className="text-gray-300 text-sm">
                    {cliente.telefone}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* GRID LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <PDVGrid
              abaAtiva={abaAtiva}
              setAbaAtiva={setAbaAtiva}
              busca={busca}
              setBusca={setBusca}
              categorias={categorias}
              categoriaAtiva={categoriaAtiva}
              setCategoriaAtiva={setCategoriaAtiva}
              produtos={produtosFiltrados}
              agendamentos={agendamentosFiltrados}
              onAdicionarItem={adicionarAoCarrinho}
              onEditarPreco={(item) => abrirModal('editar-preco', item)}
            />
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-4">
              <PDVCart
                carrinho={carrinho}
                cliente={cliente}
                desconto={desconto}
                setDesconto={setDesconto}
                tipoDesconto={tipoDesconto}
                setTipoDesconto={setTipoDesconto}
                subtotal={subtotal}
                total={total}
                valorDesconto={valorDescontoCalculado}
                onRemoverItem={removerDoCarrinho}
                onAjustarQtd={ajustarQuantidade}
                onLimparCarrinho={limparCarrinho}
                onSelecionarCliente={() => abrirModal('selecionar-cliente')}
              />

              <button
                onClick={() => abrirModal('pagamento')}
                disabled={carrinho.length === 0 || processando}
                className="w-full py-5 bg-gradient-to-r from-purple-600 to-pink-600 
                          hover:from-purple-700 hover:to-pink-700 
                          disabled:from-gray-700 disabled:to-gray-800
                          disabled:cursor-not-allowed
                          text-white rounded-2xl font-bold text-xl 
                          shadow-2xl shadow-purple-900/60 
                          transition-all duration-300 
                          active:scale-95
                          border border-purple-400/30
                          relative overflow-hidden group"
              >
                {processando ? (
                  <span className="flex items-center justify-center gap-3">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processando...
                  </span>
                ) : (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-400/0 via-white/20 to-purple-400/0 
                                  translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                    <span className="relative flex items-center justify-center gap-2">
                      <span>💳 FINALIZAR</span>
                      <span className="text-2xl font-black">
                        R$ {total.toFixed(2)}
                      </span>
                    </span>
                  </>
                )}
              </button>

              {/* ESTATÍSTICAS RÁPIDAS */}
              {carrinho.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-800/50 backdrop-blur rounded-xl p-4 border border-gray-700">
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Itens</p>
                    <p className="text-2xl font-bold text-white">{carrinho.reduce((acc, item) => acc + item.qtd, 0)}</p>
                  </div>
                  <div className="bg-gray-800/50 backdrop-blur rounded-xl p-4 border border-gray-700">
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Economia</p>
                    <p className="text-2xl font-bold text-green-400">R$ {valorDescontoCalculado.toFixed(2)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <PDVModals
        modalState={modalState}
        onClose={fecharModal}
        totalPagamento={total}
        cliente={cliente}
        setCliente={setCliente}
        onFinalizarPagamento={handleFinalizarVenda}
        processandoPagamento={processando}
        carrinho={carrinho}
        onRecuperarVenda={(venda) => console.log('Recuperar', venda)}
        onUsarCliente={(c) => setCliente(c)}
        onSalvarPreco={(id, novoPreco) => {
           setCarrinho(prev => prev.map(item => item.id === id ? { ...item, preco_venda: novoPreco } : item));
        }}
        vendasPendentes={[]} 
      />
    </div>
  );
};