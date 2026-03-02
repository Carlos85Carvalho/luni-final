// src/screens/financeiro/pdv/PDV.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { PDVGrid } from './PDVGrid';
import { PDVCart } from './PDVCart';
import { PDVModals } from './PDVModals';
import { ShoppingBag, Loader2 } from 'lucide-react';
import { pdvService } from './PDV.service';
import { supabase } from '../../../services/supabase';

export const PDV = () => {
  // ========== ESTADO DE DADOS ==========
  const [produtos, setProdutos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [configSalao, setConfigSalao] = useState(null);
  const [ultimoNumero, setUltimoNumero] = useState(0);
  
  // ========== ESTADO DE UI ==========
  const [abaAtiva, setAbaAtiva] = useState('produtos'); 
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const dados = await pdvService.carregarDadosIniciais(user.id);

      setProdutos(dados.produtos);
      setCategorias([...new Set(dados.produtos.map(p => p.categoria).filter(Boolean))]);
      setConfigSalao(dados.config);
      setUltimoNumero(dados.ultimoNumeroVenda);
      
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

  // ========== FINALIZAR VENDA ==========
  const handleFinalizarVenda = async (formaPagamento) => {
    setProcessando(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const salaoId = user?.user_metadata?.salao_id || carrinho[0]?.salao_id || user?.id;

      const vendaFeita = await pdvService.finalizarVenda({
        salaoId, 
        carrinho, 
        cliente, 
        total, 
        subtotal, 
        desconto: valorDescontoCalculado, 
        formaPagamento, 
        ultimoNumeroVenda: ultimoNumero
      });

      setModalState({ 
        view: 'sucesso', 
        isOpen: true,
        dados: { 
            vendaId: vendaFeita.id, 
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
    setCarrinho(prev => {
      const existente = prev.find(i => i.id === item.id && i.tipo === tipo);
      if (existente) return prev.map(i => i.id === item.id && i.tipo === tipo ? { ...i, qtd: i.qtd + 1 } : i);
      const precoFinal = tipo === 'produto' ? (item.preco || item.preco_venda || 0) : (item.preco || 0);
      
      return [...prev, { 
        id: item.id, 
        salao_id: item.salao_id, 
        nome: item.nome, 
        tipo, 
        qtd: 1, 
        preco_venda: precoFinal, 
        estoque: item.estoque || item.quantidade_atual, 
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

  // ========== LOADING ==========
  if (carregando) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <Loader2 className="w-10 h-10 text-purple-500 animate-spin mx-auto" />
          <p className="text-gray-400 text-sm">Carregando Vitrine...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-white pb-24 relative overflow-x-hidden">
      <div className="max-w-[1600px] mx-auto p-4 lg:p-6">
        
        {/* HEADER */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600/20 border border-purple-500/20 rounded-xl flex items-center justify-center shrink-0">
              <ShoppingBag size={20} className="text-purple-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white leading-tight">Venda Rápida (PDV)</h1>
              <p className="text-xs text-gray-500">
                {carrinho.length === 0 ? 'Carrinho vazio' : `${carrinho.reduce((a, i) => a + i.qtd, 0)} itens · R$ ${total.toFixed(2)}`}
              </p>
            </div>
          </div>

          {cliente && (
            <div className="hidden md:flex items-center gap-2 bg-purple-600/10 border border-purple-500/20 rounded-xl px-4 py-2">
              <div className="w-6 h-6 rounded-lg bg-purple-600/20 flex items-center justify-center text-purple-400 text-xs font-bold shrink-0">
                {cliente.nome.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Cliente (Opcional)</p>
                <p className="text-sm font-semibold text-white truncate">{cliente.nome}</p>
              </div>
            </div>
          )}
        </div>

        {/* GRID LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          
          {/* ÁREA DE PRODUTOS */}
          <div className="lg:col-span-2 space-y-4">
            <PDVGrid
              abaAtiva={'produtos'} setAbaAtiva={() => {}} 
              busca={busca} setBusca={setBusca}
              categorias={categorias} categoriaAtiva={categoriaAtiva} setCategoriaAtiva={setCategoriaAtiva}
              produtos={produtosFiltrados} agendamentos={[]} 
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
                    <span className="bg-white/20 px-3 py-0.5 rounded-lg font-black tracking-tight">R$ {total.toFixed(2)}</span>
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
                    <p className="text-xl font-black text-emerald-400 tracking-tight">R$ {valorDescontoCalculado.toFixed(2)}</p>
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
        onUsarCliente={(c) => setCliente(c)}
        onSalvarPreco={(id, novoPreco) => setCarrinho(prev => prev.map(item => item.id === id ? { ...item, preco_venda: novoPreco } : item))}
      />
    </div>
  );
};