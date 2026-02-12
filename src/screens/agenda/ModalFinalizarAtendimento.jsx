// src/screens/agenda/ModalFinalizarAtendimento.jsx
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom'; 
import { X, CheckCircle, Search, Package, Trash2, Loader2, DollarSign, MessageCircle, User, Scissors } from 'lucide-react';
import { supabase } from '../../services/supabase';

// --- Componente Interno: Modal de Sucesso ---
const ModalSucessoAgenda = ({ isOpen, onClose, dados }) => {
  if (!isOpen || !dados) return null;

  const { cliente_nome, telefone, servico, total, itens, profissional } = dados;

  const enviarWhatsApp = () => {
    if (!telefone) {
      alert("Cliente sem telefone cadastrado.");
      return;
    }

    const num = telefone.replace(/\D/g, '');
    let mensagem = `*COMPROVANTE DE ATENDIMENTO*\n\n`;
    mensagem += `Olá ${cliente_nome}, tudo bem?\n`;
    mensagem += `Aqui está o resumo do seu atendimento com *${profissional}*:\n\n`;
    mensagem += `✅ *Serviço:* ${servico}\n`;
    
    if (itens && itens.length > 0) {
      mensagem += `🛍️ *Produtos:*\n`;
      itens.forEach(item => {
        mensagem += `   • ${item.nome} (R$ ${item.preco.toFixed(2)})\n`;
      });
    }

    mensagem += `\n💰 *Total: R$ ${total.toFixed(2)}*\n\n`;
    mensagem += `Obrigado pela preferência! Volte sempre. ✨`;

    window.open(`https://wa.me/55${num}?text=${encodeURIComponent(mensagem)}`, '_blank');
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[10000] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-[#18181b] border border-white/10 w-full max-w-sm rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-400"></div>
        <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6 ring-1 ring-green-500/30">
          <CheckCircle size={40} className="text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Sucesso!</h2>
        <p className="text-gray-400 text-sm mb-8 leading-relaxed">Atendimento finalizado.<br/>Deseja enviar o comprovante?</p>

        {telefone ? (
          <button onClick={enviarWhatsApp} className="w-full py-4 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-2xl font-bold flex items-center justify-center gap-3 transition-all active:scale-95 mb-4 shadow-lg shadow-green-900/20">
            <MessageCircle size={22} /> Enviar no WhatsApp
          </button>
        ) : (
          <div className="w-full p-4 bg-white/5 rounded-2xl text-gray-500 text-sm mb-4 border border-white/5">Sem telefone cadastrado.</div>
        )}
        <button onClick={onClose} className="text-gray-500 hover:text-white text-sm font-medium py-2 px-4 rounded-xl hover:bg-white/5 transition-colors">Fechar Janela</button>
      </div>
    </div>,
    document.body
  );
};

// --- Componente Principal ---
export const ModalFinalizarAtendimento = ({ isOpen, onClose, agendamento, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [valorServico, setValorServico] = useState('');
  const [listaProdutos, setListaProdutos] = useState([]);
  const [buscaProduto, setBuscaProduto] = useState('');
  const [carrinho, setCarrinho] = useState([]);
  const [modalSucessoOpen, setModalSucessoOpen] = useState(false);

  // --- 1. REGRA PARA ESCONDER O RODAPÉ (Igual ao Novo Agendamento) ---
  useEffect(() => {
    if (isOpen) {
      const style = document.createElement('style');
      style.id = 'hide-footer-finalizar';
      style.innerHTML = `
        #rodape-principal, .fixed.bottom-0, nav.fixed.bottom-0, footer { 
          display: none !important; 
          opacity: 0 !important;
          pointer-events: none !important;
          z-index: -1 !important;
        }
        body { overflow: hidden !important; }
      `;
      document.head.appendChild(style);
      return () => {
        const existingStyle = document.getElementById('hide-footer-finalizar');
        if (existingStyle) document.head.removeChild(existingStyle);
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  // --- 2. CARREGAR DADOS E VALORES ---
  useEffect(() => {
    if (isOpen && agendamento) {
      const fetchProdutos = async () => {
        const { data } = await supabase.from('produtos').select('*').gt('estoque', 0).order('nome');
        setListaProdutos(data || []);
      };
      fetchProdutos();

      // --- CORREÇÃO: Garante que pega o valor numérico ---
      // Tenta 'valor' primeiro, depois 'valor_total', se não achar, assume 0.
      const valorInicial = agendamento.valor !== undefined && agendamento.valor !== null 
        ? Number(agendamento.valor) 
        : (Number(agendamento.valor_total) || 0);
        
      setValorServico(valorInicial);
      
      setCarrinho([]);
      setBuscaProduto('');
      setModalSucessoOpen(false);
    }
  }, [isOpen, agendamento]);

  if (!isOpen || !agendamento) return null;

  // Tenta pegar o nome do profissional (pode vir como objeto 'profissionais' ou direto)
  const nomeProfissional = agendamento.profissionais?.nome || agendamento.profissional_nome || 'Profissional';

  const adicionarProduto = (produto) => {
    setCarrinho([...carrinho, { ...produto, qtd: 1 }]);
    setBuscaProduto('');
  };

  const removerProduto = (index) => {
    const novoCarrinho = [...carrinho];
    novoCarrinho.splice(index, 1);
    setCarrinho(novoCarrinho);
  };

  const valorServicoNum = valorServico === '' ? 0 : Number(valorServico);
  const totalGeral = valorServicoNum + carrinho.reduce((acc, item) => acc + Number(item.preco), 0);

  const handleFinalizar = async () => {
    setLoading(true);
    try {
      for (const item of carrinho) {
        if (item.id) await supabase.from('produtos').update({ estoque: Math.max(0, item.estoque - 1) }).eq('id', item.id);
      }
      const { error } = await supabase.from('agendamentos').update({ status: 'concluido', valor_total: totalGeral, valor: valorServicoNum }).eq('id', agendamento.id);
      if (error) throw error;
      setModalSucessoOpen(true);
      onSuccess(); 
    } catch (err) { 
      alert('Erro: ' + err.message); 
    } finally { 
      setLoading(false); 
    }
  };

  const produtosFiltrados = listaProdutos.filter(p => p.nome.toLowerCase().includes(buscaProduto.toLowerCase()));

  // --- 3. USO DO PORTAL PRINCIPAL ---
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      
      {/* Container Principal (Estilo Mobile-First) */}
      <div 
        className="bg-[#18181b] w-full sm:max-w-md sm:rounded-[32px] rounded-t-[32px] border border-white/10 shadow-2xl relative flex flex-col animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-4 duration-300 overflow-hidden"
        style={{ maxHeight: '95dvh' }}
      >
        
        {/* Header */}
        <div className="flex justify-between items-start p-6 border-b border-white/5 bg-[#18181b]">
          <div>
             <h2 className="text-xl font-bold text-white flex items-center gap-2">
               <CheckCircle className="text-green-500" size={24}/> Finalizar
             </h2>
             <div className="mt-2 space-y-1">
                <p className="text-gray-200 text-sm flex items-center gap-2 font-medium">
                  <User size={14} className="text-purple-400"/> {agendamento.cliente_nome}
                </p>
                {/* Exibindo o Profissional */}
                <p className="text-gray-500 text-xs flex items-center gap-2 pl-0.5">
                  <Scissors size={12}/> {nomeProfissional}
                </p>
             </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
            <X size={18}/>
          </button>
        </div>

        {/* Conteúdo Scrollável */}
        <div className="overflow-y-auto flex-1 p-6 space-y-6 custom-scrollbar bg-[#09090b]">
          
          {/* Card Valor Serviço */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">Valor do Serviço</label>
            <div className="bg-[#18181b] rounded-2xl p-4 border border-white/10 shadow-lg flex flex-col gap-1 relative group focus-within:border-green-500/50 transition-colors">
              <span className="text-xs text-purple-400 font-medium">{agendamento.servico}</span>
              <div className="flex items-center gap-1">
                <span className="text-2xl text-gray-400 font-light">R$</span>
                <input 
                  type="number" 
                  value={valorServico} 
                  onChange={e => setValorServico(e.target.value)}
                  placeholder="0.00"
                  className="bg-transparent text-white text-3xl font-bold outline-none w-full placeholder-gray-700"
                />
              </div>
            </div>
          </div>

          {/* Produtos */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">Produtos Adicionais</label>
            <div className="relative">
              <div className="absolute left-3 top-3 text-gray-500 pointer-events-none"><Search size={16} /></div>
              <input 
                placeholder="Buscar produto..." 
                className="w-full bg-[#18181b] border border-white/10 rounded-xl py-3 pl-10 text-white text-sm outline-none focus:border-green-500/50 transition-all"
                value={buscaProduto} 
                onChange={e => setBuscaProduto(e.target.value)}
              />
              {buscaProduto && (
                <div className="absolute top-full left-0 w-full bg-[#27272a] border border-white/10 rounded-xl mt-2 max-h-48 overflow-y-auto z-50 shadow-2xl custom-scrollbar">
                  {produtosFiltrados.length > 0 ? (
                    produtosFiltrados.map(p => (
                      <div key={p.id} onClick={() => adicionarProduto(p)} className="p-3 hover:bg-white/5 cursor-pointer flex justify-between items-center border-b border-white/5 last:border-0 active:bg-white/10">
                        <span className="text-white text-sm font-medium">{p.nome}</span>
                        <span className="text-green-400 text-xs font-bold">R$ {p.preco}</span>
                      </div>
                    ))
                  ) : <div className="p-4 text-center text-gray-500 text-xs">Não encontrado.</div>}
                </div>
              )}
            </div>

            {carrinho.length > 0 && (
              <div className="flex flex-col gap-2 mt-2">
                {carrinho.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-[#18181b] p-3 rounded-xl border border-white/5 animate-in slide-in-from-bottom-2">
                    <div className="flex gap-3 items-center">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-400"><Package size={14}/></div>
                      <span className="text-sm text-gray-200 font-medium">{item.nome}</span>
                    </div>
                    <div className="flex gap-3 items-center">
                      <span className="text-sm font-bold text-white">R$ {item.preco}</span>
                      <button onClick={() => removerProduto(idx)} className="text-red-400 hover:text-red-300 p-1.5 rounded-lg"><Trash2 size={14}/></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Fixo */}
        <div className="p-6 pt-4 border-t border-white/5 bg-[#18181b]">
          <div className="flex justify-between items-end mb-4 px-1">
            <span className="text-gray-400 text-xs font-medium">Total Final</span>
            <span className="text-2xl font-bold text-white tracking-tight flex items-baseline gap-1">
              <span className="text-green-500 text-sm font-normal">R$</span>{totalGeral.toFixed(2)}
            </span>
          </div>
          <button 
            onClick={handleFinalizar} 
            disabled={loading} 
            className="w-full py-4 bg-green-600 hover:bg-green-500 text-white rounded-2xl font-bold shadow-lg transition-all active:scale-95 flex justify-center items-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={20}/> : <><CheckCircle size={20}/> Confirmar Finalização</>}
          </button>
        </div>

      </div>

      <ModalSucessoAgenda 
        isOpen={modalSucessoOpen} 
        onClose={onClose} 
        dados={{
            cliente_nome: agendamento.cliente_nome || agendamento.clientes?.nome,
            telefone: agendamento.telefone || agendamento.clientes?.telefone,
            servico: agendamento.servico,
            total: totalGeral,
            itens: carrinho,
            profissional: nomeProfissional // Passando para o modal de sucesso
        }}
      />
    </div>,
    document.body
  );
};