import React, { useState, useEffect } from 'react';
import { supabase } from '../../../services/supabase'; 
import { PDVGrid } from './PDVGrid';
import { PDVCart } from './PDVCart';
import { PDVModals } from './PDVModals'; 

export const PDV = () => {
  // Estado de Dados
  const [produtos, setProdutos] = useState([]);
  const [agendamentosProx, setAgendamentosProx] = useState([]);
  const [categorias, setCategorias] = useState([]);
  
  // Estado de UI
  const [abaAtiva, setAbaAtiva] = useState('agendamentos'); 
  const [busca, setBusca] = useState('');
  const [categoriaAtiva, setCategoriaAtiva] = useState('todas');
  const [processando, setProcessando] = useState(false);
  
  // Carrinho e Cliente
  const [carrinho, setCarrinho] = useState([]);
  const [cliente, setCliente] = useState(null);
  const [desconto, setDesconto] = useState(0);
  const [tipoDesconto, setTipoDesconto] = useState('valor');

  const [modalState, setModalState] = useState({ view: null, dados: null, isOpen: false });

  // === BUSCA DE DADOS (CORRIGIDO: REMOVIDA A RELAÇÃO QUEBRAVÉL) ===
  useEffect(() => {
    const fetchDados = async () => {
      try {
        console.log("--- INICIANDO BUSCA PDV (MODO SEGURO) ---");
        const hoje = new Date().toISOString().split('T')[0];

        // 1. Busca Agendamentos
        // CORREÇÃO CRÍTICA: Removi "servicos (...)" do select pois a relação não existe.
        // Mantivemos "clientes" pois essa parece existir.
        const { data: agends, error: erroAgenda } = await supabase
          .from('agendamentos')
          .select(`
            *,
            clientes (id, nome)
          `)
          .gte('data', hoje) 
          .order('data', { ascending: true })
          .limit(20);

        if (erroAgenda) {
            console.error("Erro ao buscar agendamentos:", erroAgenda);
        } else {
            console.log("Agendamentos carregados:", agends);
        }

        // Formatação Manual e Segura
        const agendamentosFormatados = (agends || []).map(a => {
            // Tenta pegar nome do cliente da relação (clientes.nome) OU da coluna texto (cliente_nome)
            const nomeCliente = a.clientes?.nome || a.cliente_nome || 'Cliente sem nome';
            
            // Pega o nome do serviço direto da coluna texto 'servico' (que vimos no seu SQL que existe)
            const nomeServico = a.servico || 'Serviço Agendado';
            
            // Pega o valor da coluna 'valor' ou 'valor_total'
            const precoServico = Number(a.valor || a.valor_total || 0);

            return {
                ...a,
                cliente_nome: nomeCliente,
                servico_nome: nomeServico,
                preco: precoServico
            };
        });
        setAgendamentosProx(agendamentosFormatados);

        // 2. Busca Produtos
        const { data: prods, error: erroProd } = await supabase
          .from('produtos')
          .select('*')
          .gt('estoque', 0) 
          .order('nome');
        
        if (erroProd) console.error("Erro Produtos:", erroProd);
        
        setProdutos(prods || []);

        // 3. Categorias
        if (prods) {
          const catsUnicas = [...new Set(prods.map(p => p.categoria).filter(Boolean))];
          setCategorias(catsUnicas);
        }

      } catch (error) {
        console.error("Erro geral PDV:", error);
      }
    };

    fetchDados();
  }, []);

  // --- CÁLCULOS ---
  const subtotal = carrinho.reduce((acc, item) => acc + (item.preco_venda * item.qtd), 0);
  const valorDescontoCalculado = tipoDesconto === 'percentual' ? (subtotal * desconto) / 100 : desconto;
  const total = Math.max(0, subtotal - valorDescontoCalculado);

  // --- FINALIZAR VENDA ---
  const handleFinalizarVenda = async (formaPagamento) => {
    setProcessando(true);
    try {
      // 1. Cria a Venda
      const { data: venda, error: errVenda } = await supabase
        .from('vendas')
        .insert({
          cliente_id: cliente?.id || null,
          total: total,
          subtotal: subtotal,
          desconto: valorDescontoCalculado,
          forma_pagamento: formaPagamento,
          status: 'concluida',
          data_venda: new Date()
        })
        .select()
        .single();

      if (errVenda) throw errVenda;

      // 2. Prepara os Itens
      const itensVenda = carrinho.map(item => ({
        venda_id: venda.id,
        produto_id: item.tipo === 'produto' ? item.id : null,
        // Agendamento usa UUID, então passamos se existir
        agendamento_id: item.tipo === 'agendamento' ? item.id : null, 
        nome_item: item.nome,
        quantidade: item.qtd,
        preco_unitario: item.preco_venda
      }));

      // 3. Salva os Itens
      const { error: errItens } = await supabase.from('venda_itens').insert(itensVenda);
      if (errItens) throw errItens;

      // 4. Baixa Estoque e Atualiza Status
      for (const item of carrinho) {
        if (item.tipo === 'produto') {
          const novoEstoque = (item.estoque || 0) - item.qtd;
          await supabase.from('produtos').update({ estoque: novoEstoque }).eq('id', item.id);
        } else if (item.tipo === 'agendamento') {
          // Marca como concluído
          await supabase.from('agendamentos').update({ status: 'concluido' }).eq('id', item.id);
        }
      }

      alert('Venda realizada com sucesso!');
      setCarrinho([]);
      setCliente(null);
      setDesconto(0);
      setModalState({ isOpen: false });

    } catch (error) {
      alert('Erro ao finalizar venda: ' + error.message);
      console.error(error);
    } finally {
      setProcessando(false);
    }
  };

  // --- AÇÕES DO CARRINHO ---
  const adicionarAoCarrinho = (item, tipo) => {
    if (tipo === 'agendamento') {
       if (item.cliente_id || item.clientes?.id) {
          setCliente({ 
              nome: item.cliente_nome, 
              id: item.cliente_id || item.clientes?.id 
          });
       }
    }

    setCarrinho(prev => {
      const existente = prev.find(i => i.id === item.id && i.tipo === tipo);
      if (existente) return prev.map(i => i.id === item.id && i.tipo === tipo ? { ...i, qtd: i.qtd + 1 } : i);
      
      let precoFinal = 0;
      let nomeFinal = '';

      if (tipo === 'produto') {
        precoFinal = item.preco || item.preco_venda || 0; 
        nomeFinal = item.nome;
      } else if (tipo === 'agendamento') {
        precoFinal = item.preco || 0;
        nomeFinal = `${item.servico_nome} (${item.cliente_nome})`;
      }

      return [...prev, { 
        id: item.id, 
        nome: nomeFinal, 
        tipo, 
        qtd: 1, 
        preco_venda: precoFinal,
        estoque: item.estoque
      }];
    });
  };

  const removerDoCarrinho = (id, tipo) => setCarrinho(prev => prev.filter(i => !(i.id === id && i.tipo === tipo)));
  
  const ajustarQuantidade = (id, tipo, delta) => {
    setCarrinho(prev => prev.map(item => {
      if (item.id === id && item.tipo === tipo) return { ...item, qtd: Math.max(1, item.qtd + delta) };
      return item;
    }));
  };

  const abrirModal = (view, dados = null) => setModalState({ view, dados, isOpen: true });

  return (
    // LAYOUT CORRIGIDO: 
    // 1. Usamos calc(100vh - 140px) para garantir que cabe na tela descontando o header
    // 2. Adicionamos mb-20 para dar margem segura no rodapé
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-140px)] text-white p-2 mb-20">
      
      {/* GRID (Lado Esquerdo) */}
      <div className="flex-1 flex flex-col bg-[#18181b] rounded-2xl border border-gray-800 overflow-hidden shadow-2xl min-h-0">
        <PDVGrid 
          produtos={produtos}
          agendamentos={agendamentosProx}
          categorias={categorias}
          abaAtiva={abaAtiva}
          setAbaAtiva={setAbaAtiva}
          busca={busca}
          setBusca={setBusca}
          categoriaAtiva={categoriaAtiva}
          setCategoriaAtiva={setCategoriaAtiva}
          onAdicionar={adicionarAoCarrinho}
          onEditarPreco={(item) => abrirModal('editar-preco', item)}
        />
      </div>

      {/* CARRINHO (Lado Direito) */}
      <div className="w-full lg:w-[380px] flex-none bg-[#18181b] rounded-2xl border border-gray-800 overflow-hidden flex flex-col shadow-2xl min-h-0">
        <PDVCart 
          carrinho={carrinho}
          cliente={cliente}
          subtotal={subtotal}
          desconto={desconto}
          total={total}
          tipoDesconto={tipoDesconto}
          setDesconto={setDesconto}
          setTipoDesconto={setTipoDesconto}
          onRemover={removerDoCarrinho}
          onAjustarQtd={ajustarQuantidade}
          onLimpar={() => setCarrinho([])}
          onSelecionarCliente={() => abrirModal('selecionar-cliente')}
        />

        <div className="p-4 bg-[#18181b] border-t border-gray-800">
            <button 
              onClick={() => abrirModal('pagamento')}
              disabled={carrinho.length === 0}
              className="w-full py-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed text-white rounded-xl font-bold text-lg shadow-lg shadow-purple-900/40 transition-all active:scale-95"
            >
              FINALIZAR (R$ {total.toFixed(2)})
            </button>
        </div>
      </div>

      {/* MODAIS */}
      <PDVModals 
        modalState={modalState}
        onClose={() => setModalState({ ...modalState, isOpen: false })}
        totalPagamento={total}
        setCliente={setCliente} 
        onFinalizarPagamento={handleFinalizarVenda}
        processandoPagamento={processando}
      />
    </div>
  );
};