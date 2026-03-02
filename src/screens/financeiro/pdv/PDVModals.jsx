import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom'; // 🚀 A MÁGICA FOI IMPORTADA AQUI
import { X, QrCode, Banknote, CreditCard, Clock3, RefreshCw, User, Search, MessageCircle, CheckCircle, Printer } from 'lucide-react';
import { supabase } from '../../../services/supabase';
import jsPDF from 'jspdf';

// ============================================================================
// 1. COMPONENTES AUXILIARES
// ============================================================================

const BtnPagamento = ({ icon, label, color, onClick, disabled }) => {
  const IconComponent = icon;
  const colors = {
    green: 'border-green-500/30 bg-green-500/5 hover:bg-green-500/10 text-green-400',
    amber: 'border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 text-amber-400',
    blue: 'border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10 text-blue-400',
    orange: 'border-orange-500/30 bg-orange-500/5 hover:bg-orange-500/10 text-orange-400',
  };

  return (
    <button 
      onClick={onClick} 
      disabled={disabled} 
      className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${colors[color]}`}
    >
      <IconComponent size={28} /> <span className="font-bold text-sm">{label}</span>
    </button>
  );
};

// ============================================================================
// 2. COMPONENTES DE MODAL (AGORA COM PORTAL)
// ============================================================================

// --- MODAL DE SELEÇÃO DE CLIENTES ---
export const ClientesSelectionModal = ({ aberto, onClose, onSelecionar }) => {
  const [busca, setBusca] = useState('');
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (aberto) {
      const fetchClientes = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('clientes').select('*').order('nome');
        if (!error) setClientes(data || []);
        setLoading(false);
      };
      fetchClientes();
    }
  }, [aberto]);

  const clientesFiltrados = clientes.filter(c => 
    c.nome.toLowerCase().includes(busca.toLowerCase()) || 
    (c.telefone && c.telefone.includes(busca))
  );

  if (!aberto) return null;

  // 🚀 createPortal GARANTE QUE NADA VAI CORTAR A TELA
  return createPortal(
    <div className="fixed inset-0 bg-black/80 z-[99999] flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm">
      <div 
        className="bg-[#18181b] border border-white/10 w-full sm:max-w-md rounded-t-[32px] sm:rounded-3xl flex flex-col shadow-2xl animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-300 overflow-hidden"
        style={{ maxHeight: '90dvh', minHeight: '50vh' }}
      >
        <div className="p-5 border-b border-white/5 flex justify-between items-center shrink-0 bg-[#18181b]">
          <h3 className="font-bold text-lg text-white flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-xl">
              <User className="text-purple-400" size={18} />
            </div>
            Selecionar Cliente
          </h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 bg-[#18181b] border-b border-white/5 shrink-0">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18}/>
            <input 
              value={busca} onChange={e => setBusca(e.target.value)}
              placeholder="Buscar por nome ou telefone..."
              className="w-full pl-12 pr-4 py-3 bg-[#09090b] rounded-xl border border-white/10 text-white placeholder-gray-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all text-sm"
              autoFocus
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-2 bg-[#09090b] custom-scrollbar">
          {loading ? (
             <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div></div>
          ) : clientesFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-600">
              <User size={48} className="opacity-20 mb-4"/>
              <p className="text-sm">Nenhum cliente encontrado.</p>
            </div>
          ) : (
            clientesFiltrados.map(cliente => (
              <div key={cliente.id} onClick={() => { onSelecionar(cliente); onClose(); }} className="flex justify-between items-center p-4 bg-[#18181b] hover:bg-purple-500/10 hover:border-purple-500/30 border border-white/5 rounded-2xl cursor-pointer transition-all group">
                <div>
                  <div className="font-bold text-gray-200 group-hover:text-purple-300 transition-colors">{cliente.nome}</div>
                  <div className="text-xs text-gray-500 mt-1">{cliente.telefone || 'Sem telefone cadastrado'}</div>
                </div>
                <div className="p-2.5 bg-white/5 group-hover:bg-purple-500/20 rounded-xl text-gray-400 group-hover:text-purple-400 transition-colors">
                   <CheckCircle size={18} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

// --- MODAL DE PAGAMENTO ---
export const PagamentoModal = ({ aberto, onClose, total, onFinalizar, processando }) => {
  if (!aberto) return null;
  const valorTotal = Number(total) || 0;

  return createPortal(
    <div className="fixed inset-0 bg-black/80 z-[99999] flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm">
      <div className="bg-[#18181b] border border-white/10 rounded-t-[32px] sm:rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-300">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h3 className="text-2xl font-bold text-white mb-1">Pagamento</h3>
            <p className="text-gray-400 text-sm">Total a pagar: <span className="font-bold text-emerald-400 text-lg ml-1">R$ {valorTotal.toFixed(2)}</span></p>
          </div>
          <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"><X size={20} /></button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <BtnPagamento icon={QrCode} label="PIX" color="green" onClick={() => onFinalizar('pix')} disabled={processando} />
          <BtnPagamento icon={Banknote} label="Dinheiro" color="amber" onClick={() => onFinalizar('dinheiro')} disabled={processando} />
          <BtnPagamento icon={CreditCard} label="Crédito" color="blue" onClick={() => onFinalizar('credito')} disabled={processando} />
          <BtnPagamento icon={CreditCard} label="Débito" color="orange" onClick={() => onFinalizar('debito')} disabled={processando} />
        </div>
        {processando && (
          <div className="mt-6 flex items-center justify-center gap-2 text-purple-400 animate-pulse bg-purple-500/10 py-3 rounded-xl">
            <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
            <span className="font-bold text-sm">Processando venda...</span>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

// --- MODAL DE VENDAS PENDENTES ---
export const VendasPendentesModal = ({ aberto, onClose, vendasPendentes = [], onRecuperar, onUsarCliente }) => {
  if (!aberto) return null;
  return createPortal(
    <div className="fixed inset-0 bg-black/80 z-[99999] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-[#18181b] border border-white/10 rounded-3xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl animate-in zoom-in-95 overflow-hidden">
        <div className="p-6 border-b border-white/5 flex justify-between items-center shrink-0">
          <h3 className="font-bold text-xl text-white flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-xl"><Clock3 className="text-amber-400" size={20} /></div> 
            Vendas Pendentes
          </h3>
          <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white"><X size={18}/></button>
        </div>
        <div className="p-6 overflow-y-auto flex-1 bg-[#09090b] custom-scrollbar">
          {vendasPendentes.length === 0 ? (
            <div className="text-center py-16 text-gray-600">
              <Clock3 size={48} className="mx-auto mb-4 opacity-20" />
              <p>Nenhuma venda pendente no momento.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {vendasPendentes.map(venda => (
                <div key={venda.id} className="bg-[#18181b] p-5 rounded-2xl border border-amber-500/20 shadow-lg">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="font-bold text-white text-lg">Venda #{venda.numero_venda}</div>
                      <div className="text-xs text-gray-500 mt-1">{new Date(venda.created_at).toLocaleString()}</div>
                      {venda.clientes && <div className="text-sm text-amber-400 mt-2 font-medium bg-amber-500/10 w-fit px-2 py-1 rounded-md">{venda.clientes.nome}</div>}
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-2xl text-emerald-400">R$ {(venda.total || 0).toFixed(2)}</div>
                      <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-1 rounded-md uppercase font-bold mt-1 inline-block">Pendente</span>
                    </div>
                  </div>
                  <div className="flex gap-3 border-t border-white/5 pt-4">
                    <button onClick={() => onRecuperar(venda)} className="flex-1 py-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors">
                      <RefreshCw size={16} /> Recuperar Venda
                    </button>
                    {venda.clientes && (
                      <button onClick={() => onUsarCliente(venda.clientes)} className="px-5 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-bold transition-colors">
                        Usar Cliente
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

// --- MODAL DE EDITAR PREÇO ---
export const EditarPrecoModal = ({ aberto, onClose, item, onSalvar }) => {
  const [preco, setPreco] = useState(item?.preco_venda || item?.preco_base || 0);

  if (!aberto || !item) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/80 z-[99999] flex items-end sm:items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-[#18181b] border border-white/10 rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-in slide-in-from-bottom-10 sm:zoom-in-95">
        <h3 className="font-bold text-xl text-white mb-1">Editar Preço</h3>
        <p className="text-gray-400 text-sm mb-6">{item.nome}</p>
        
        <div className="relative mb-6">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">R$</span>
          <input 
            type="number" 
            value={preco} 
            onChange={e => setPreco(e.target.value)} 
            className="w-full py-4 pl-12 pr-4 bg-[#09090b] border border-white/10 rounded-2xl text-2xl font-bold text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
            autoFocus
          />
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3.5 bg-white/5 hover:bg-white/10 rounded-xl text-white font-bold transition-colors">Cancelar</button>
          <button onClick={() => { onSalvar(item.id, Number(preco)); onClose(); }} className="flex-1 py-3.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold transition-colors shadow-lg shadow-purple-900/30">Salvar</button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ============================================================================
// MODAL DE SUCESSO / WHATSAPP / PDF
// ============================================================================
export const VendaConcluidaModal = ({ aberto, onClose, dadosVenda }) => {
  if (!aberto || !dadosVenda) return null;

  const { cliente, total, carrinho, vendaId, subtotal, desconto, formaPagamento } = dadosVenda;

  const construirPDF = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [80, 200] });
    let y = 10; 

    doc.setFont('courier', 'bold');
    doc.setFontSize(12);
    doc.text('LUNI SISTEMA', 40, y, { align: 'center' }); y += 5;
    doc.setFontSize(8); doc.setFont('courier', 'normal');
    doc.text('Comprovante de Venda', 40, y, { align: 'center' }); y += 6;
    doc.text('--------------------------------', 40, y, { align: 'center' }); y += 5;
    doc.text(`DATA: ${new Date().toLocaleString()}`, 5, y); y += 4;
    doc.text(`VENDA: #${vendaId?.toString().slice(0, 8) || '000'}`, 5, y); y += 6;

    if (cliente) {
      doc.text(`CLIENTE: ${cliente.nome.toUpperCase().substring(0, 30)}`, 5, y); y += 4;
      if (cliente.telefone) { doc.text(`TEL: ${cliente.telefone}`, 5, y); y += 4; }
    } else {
      doc.text('CLIENTE: CONSUMIDOR FINAL', 5, y); y += 4;
    }
    doc.text('--------------------------------', 40, y, { align: 'center' }); y += 5;
    doc.setFont('courier', 'bold'); doc.text('ITEM  QTD   TOTAL', 5, y); y += 4;
    doc.setFont('courier', 'normal');

    carrinho.forEach((item, index) => {
      const nomeProduto = item.nome.toUpperCase().substring(0, 25); 
      doc.text(`${index + 1} ${nomeProduto}`, 5, y); y += 4;
      const valTotalItem = (item.qtd * item.preco_venda).toFixed(2);
      const linhaValores = `${item.qtd}x R$${item.preco_venda.toFixed(2)} = R$${valTotalItem}`;
      doc.text(linhaValores, 10, y); y += 4;
    });

    doc.text('--------------------------------', 40, y, { align: 'center' }); y += 5;
    doc.setFont('courier', 'bold');
    
    if (subtotal) { doc.text(`SUBTOTAL:     R$ ${subtotal.toFixed(2)}`, 75, y, { align: 'right' }); y += 4; }
    if (desconto && desconto > 0) { doc.text(`DESCONTO:    -R$ ${desconto.toFixed(2)}`, 75, y, { align: 'right' }); y += 4; }

    doc.setFontSize(10); doc.text(`TOTAL: R$ ${total.toFixed(2)}`, 75, y, { align: 'right' }); y += 6;
    doc.setFontSize(8); doc.setFont('courier', 'normal');
    doc.text(`PAGAMENTO: ${formaPagamento?.toUpperCase() || 'DINHEIRO'}`, 5, y); y += 8;
    doc.text('Obrigado pela preferencia!', 40, y, { align: 'center' }); y += 6;
    doc.setFontSize(6); doc.text('Gerado via Luni App', 40, y, { align: 'center' });

    return doc;
  };

  const abrirOuBaixarPDF = () => {
    const doc = construirPDF();
    window.open(doc.output('bloburl'), '_blank');
  };

  const compartilharPDFnoWhatsApp = async () => {
    if (!cliente?.telefone) {
      alert("Este cliente não possui telefone cadastrado.");
      return;
    }

    const doc = construirPDF();
    const pdfBlob = doc.output('blob');
    const arquivoPdf = new File([pdfBlob], `comprovante_${vendaId || 'luni'}.pdf`, { type: 'application/pdf' });

    if (navigator.share && navigator.canShare && navigator.canShare({ files: [arquivoPdf] })) {
      try {
        await navigator.share({
          title: 'Comprovante de Venda',
          text: `Olá ${cliente.nome}, muito obrigado pela preferência! Aqui está o seu comprovante.`,
          files: [arquivoPdf]
        });
        return; 
      } catch (error) {
        console.log('Compartilhamento cancelado ou falhou', error);
        return;
      }
    }

    alert("No computador, o comprovante será baixado para você anexar na conversa.");
    doc.save(`comprovante_${vendaId || 'luni'}.pdf`);
    
    const telefone = cliente.telefone.replace(/\D/g, '');
    const mensagem = `Olá ${cliente.nome}, muito obrigado pela preferência! Estou te enviando o comprovante da compra em anexo.`;
    const link = `https://wa.me/55${telefone}?text=${encodeURIComponent(mensagem)}`;
    window.open(link, '_blank');
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/80 z-[99999] flex items-end sm:items-center justify-center p-4 backdrop-blur-md">
      <div className="bg-[#18181b] border border-white/10 rounded-3xl w-full max-w-sm p-8 shadow-2xl animate-in slide-in-from-bottom-10 sm:zoom-in-95 flex flex-col items-center text-center relative overflow-hidden">
        
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-400"></div>

        <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6 ring-1 ring-green-500/30">
          <CheckCircle size={40} className="text-green-500" />
        </div>

        <h2 className="text-2xl font-bold text-white mb-2">Venda Realizada!</h2>
        <p className="text-gray-400 mb-8 text-sm">O pagamento foi confirmado com sucesso.</p>

        <div className="w-full space-y-3">
             <button 
              onClick={abrirOuBaixarPDF}
              className="w-full py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold flex items-center justify-center gap-2 border border-white/10 transition-all active:scale-95"
            >
              <Printer size={20} /> Visualizar Comprovante
            </button>

            {cliente ? (
              <button 
                onClick={compartilharPDFnoWhatsApp}
                className="w-full py-4 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-2xl font-bold flex items-center justify-center gap-3 shadow-lg shadow-green-900/20 transition-all active:scale-95"
              >
                <MessageCircle size={22} /> Enviar no WhatsApp
              </button>
            ) : (
              <div className="w-full p-3 bg-white/5 rounded-2xl text-gray-500 text-xs border border-white/5">Cliente não identificado para envio.</div>
            )}
        </div>

        <button onClick={onClose} className="mt-6 py-2 px-4 rounded-xl text-gray-500 hover:text-white hover:bg-white/5 font-medium text-sm transition-colors">
          Fechar Janela
        </button>
      </div>
    </div>,
    document.body
  );
};


// ============================================================================
// 3. COMPONENTE AGREGADOR PRINCIPAL
// ============================================================================

export const PDVModals = ({
  modalState, onClose, onFinalizarPagamento, onRecuperarVenda,
  onUsarCliente, onSalvarPreco, setCliente, totalPagamento, processandoPagamento, vendasPendentes,
}) => {
  const { view, dados, isOpen } = modalState || {};

  return (
    <>
      <PagamentoModal aberto={isOpen && view === 'pagamento'} onClose={onClose} total={totalPagamento} onFinalizar={onFinalizarPagamento} processando={processandoPagamento} />
      <ClientesSelectionModal aberto={isOpen && view === 'selecionar-cliente'} onClose={onClose} onSelecionar={setCliente} />
      <VendasPendentesModal aberto={isOpen && view === 'vendas-pendentes'} onClose={onClose} vendasPendentes={vendasPendentes} onRecuperar={onRecuperarVenda} onUsarCliente={onUsarCliente} />
      <EditarPrecoModal key={dados?.id || 'editor'} aberto={isOpen && view === 'editar-preco'} onClose={onClose} item={dados} onSalvar={onSalvarPreco} />
      <VendaConcluidaModal aberto={isOpen && view === 'sucesso'} onClose={onClose} dadosVenda={dados} />
    </>
  );
};