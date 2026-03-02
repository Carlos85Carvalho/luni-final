// src/screens/agenda/ModalFinalizarAtendimento.jsx
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom'; 
import { X, CheckCircle, Search, Package, Trash2, Loader2, User, Scissors, Beaker, ClipboardEdit, Sparkles, MessageCircle, FileText } from 'lucide-react';
import { supabase } from '../../services/supabase';

// 🚀 AQUI ESTÁ A PRIMEIRA CORREÇÃO: Importação segura do gerador de PDF
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; 

// --- Componente Interno: Modal de Sucesso com PDF ---
const ModalSucessoAgenda = ({ isOpen, onClose, dados }) => {
  if (!isOpen || !dados) return null;

  const { cliente_nome, telefone, servico, valor_servico, total, itens, profissional } = dados;

  // Função Mágica que desenha o PDF
  const gerarPDF = () => {
    try {
      const doc = new jsPDF();
      
      // 🚀 Proteções extras caso falte algum dado
      const nomeSeguro = cliente_nome || 'Cliente';
      const profSeguro = profissional || 'Equipe';
      const servicoSeguro = servico || 'Atendimento';
      const valServ = Number(valor_servico) || 0;
      const valTot = Number(total) || 0;

      // Cabeçalho do Salão
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(91, 46, 255); // Roxo Luni
      doc.text("COMPROVANTE DE ATENDIMENTO", 105, 20, { align: "center" });

      // Informações do Cliente
      doc.setFontSize(11);
      doc.setTextColor(50, 50, 50);
      doc.setFont("helvetica", "normal");
      doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}`, 14, 35);
      doc.text(`Cliente: ${nomeSeguro}`, 14, 42);
      doc.text(`Profissional: ${profSeguro}`, 14, 49);

      // Preparando os dados da Tabela
      const tableColumn = ["Descrição", "Tipo", "Valor"];
      const tableRows = [];

      // Adiciona o Serviço na tabela
      tableRows.push([servicoSeguro, "Serviço", `R$ ${valServ.toFixed(2)}`]);

      // Adiciona os Produtos na tabela
      if (itens && itens.length > 0) {
        itens.forEach(item => {
          tableRows.push([item.nome, "Produto", `R$ ${Number(item.preco_venda || item.preco || 0).toFixed(2)}`]);
        });
      }

      // 🚀 SEGUNDA CORREÇÃO: Usando a tabela do jeito que o Vite aceita sem travar
      autoTable(doc, {
        startY: 60,
        head: [tableColumn],
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: [91, 46, 255], textColor: [255, 255, 255] },
        styles: { fontSize: 10, cellPadding: 4 },
      });

      // Totalizador
      const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : 60;
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text(`TOTAL PAGO: R$ ${valTot.toFixed(2)}`, 14, finalY + 15);

      // Rodapé
      doc.setFontSize(10);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(120, 120, 120);
      doc.text("Obrigado pela preferência! Volte sempre. ✨", 105, finalY + 30, { align: "center" });

      // Baixa o arquivo
      const nomeArquivo = `Recibo_${nomeSeguro.replace(/\s+/g, '_')}.pdf`;
      doc.save(nomeArquivo);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert("Ocorreu um erro ao gerar o PDF. Verifique o console.");
    }
  };

  const enviarWhatsApp = () => {
    if (!telefone) {
      alert("Cliente sem telefone cadastrado.");
      return;
    }
    
    gerarPDF(); // Primeiro baixa o PDF

    // Depois abre o WhatsApp com a mensagem
    const num = String(telefone).replace(/\D/g, '');
    const nomeSeguro = cliente_nome ? cliente_nome.split(' ')[0] : 'Cliente';
    const mensagem = `Olá ${nomeSeguro}! ✨\n\nFoi um prazer te receber hoje. Segue em anexo o seu *Comprovante de Atendimento*.\n\nQualquer dúvida, estamos à disposição!`;
    
    setTimeout(() => {
      window.open(`https://wa.me/55${num}?text=${encodeURIComponent(mensagem)}`, '_blank');
    }, 1000); // Espera 1 segundo para o download terminar
  };

  // 🚀 TERCEIRA CORREÇÃO: style={{ zIndex: 99999 }} Força o modal a ficar na frente do vidro invisível!
  return createPortal(
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300" style={{ zIndex: 99999 }}>
      <div className="bg-[#18181b] border border-white/10 w-full max-w-sm rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-400"></div>
        <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6 ring-1 ring-green-500/30">
          <CheckCircle size={40} className="text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Sucesso!</h2>
        <p className="text-gray-400 text-sm mb-8 leading-relaxed">Atendimento salvo com sucesso.<br/>Escolha como enviar o recibo:</p>

        <div className="flex flex-col gap-3 w-full mb-4">
          {telefone ? (
            <button onClick={enviarWhatsApp} className="w-full py-4 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-2xl font-bold flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-green-900/20">
              <MessageCircle size={22} /> WhatsApp + PDF
            </button>
          ) : (
            <div className="w-full p-3 bg-white/5 rounded-2xl text-gray-500 text-sm border border-white/5">Sem telefone cadastrado.</div>
          )}
          
          <button onClick={gerarPDF} className="w-full py-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all border border-white/10">
            <FileText size={18} /> Apenas Baixar PDF
          </button>
        </div>

        <button 
          onClick={() => {
            if (dados.onSuccess) dados.onSuccess();
            onClose();
          }} 
          className="text-gray-500 hover:text-white text-sm font-medium py-2 px-4 rounded-xl hover:bg-white/5 transition-colors mt-2"
        >
          Fechar Janela
        </button>
      </div>
    </div>,
    document.body
  );
};

// --- Componente Principal ---
export const ModalFinalizarAtendimento = ({ isOpen, onClose, agendamento, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [salaoId, setSalaoId] = useState(null);
  
  // Valores e Produtos de Venda
  const [valorServico, setValorServico] = useState('');
  const [listaProdutos, setListaProdutos] = useState([]);
  const [buscaProdutoVenda, setBuscaProdutoVenda] = useState('');
  const [carrinhoVenda, setCarrinhoVenda] = useState([]);
  const [dropdownVendaAberto, setDropdownVendaAberto] = useState(false);
  
  // Anamnese e Consumo Interno
  const [abrirAnamnese, setAbrirAnamnese] = useState(false);
  const [anotacoes, setAnotacoes] = useState('');
  const [buscaProdutoConsumo, setBuscaProdutoConsumo] = useState('');
  const [carrinhoConsumo, setCarrinhoConsumo] = useState([]);
  const [categoriaSugerida, setCategoriaSugerida] = useState('');
  const [dropdownConsumoAberto, setDropdownConsumoAberto] = useState(false);

  const [modalSucessoOpen, setModalSucessoOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const style = document.createElement('style');
      style.id = 'hide-footer-finalizar';
      style.innerHTML = `
        #rodape-principal, .fixed.bottom-0, nav.fixed.bottom-0, footer { display: none !important; }
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

  useEffect(() => {
    if (isOpen && agendamento) {
      const fetchSetup = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: u } = await supabase.from('usuarios').select('salao_id').eq('id', user.id).maybeSingle();
          if (u) setSalaoId(u.salao_id);
        }

        const { data: prods } = await supabase
          .from('produtos')
          .select('*')
          .gt('quantidade_atual', 0)
          .order('nome');
        setListaProdutos(prods || []);
      };
      fetchSetup();

      const valorInicial = agendamento.valor !== undefined && agendamento.valor !== null 
        ? Number(agendamento.valor) 
        : (Number(agendamento.valor_total) || 0);
        
      setValorServico(valorInicial);
      setCarrinhoVenda([]);
      setCarrinhoConsumo([]);
      setBuscaProdutoVenda('');
      setBuscaProdutoConsumo('');
      setAnotacoes('');
      setModalSucessoOpen(false);
      setAbrirAnamnese(false);

      setCategoriaSugerida(sugerirCategoriaProduto(agendamento.servico));
    }
  }, [isOpen, agendamento]);

  const sugerirCategoriaProduto = (nomeServico) => {
    const s = (nomeServico || '').toLowerCase();
    if (s.includes('color') || s.includes('mecha') || s.includes('luzes') || s.includes('tinta') || s.includes('retoque')) return 'Tintura';
    if (s.includes('tratamento') || s.includes('hidrata') || s.includes('reconstru') || s.includes('botox')) return 'Tratamento';
    if (s.includes('progressiva') || s.includes('liso') || s.includes('alisamento')) return 'Progressiva'; 
    if (s.includes('unha') || s.includes('mão') || s.includes('pé') || s.includes('manicure') || s.includes('pedicure') || s.includes('esmalta')) return 'Esmalte';
    if (s.includes('lavagem') || s.includes('escova') || s.includes('corte')) return 'Shampoo';
    return ''; 
  };

  if (!isOpen || !agendamento) return null;

  const nomeProfissional = agendamento.profissionais?.nome || agendamento.profissional_nome || 'Profissional';

  const adicionarVenda = (produto) => {
    setCarrinhoVenda([...carrinhoVenda, { ...produto, qtd: 1 }]);
    setBuscaProdutoVenda('');
    setDropdownVendaAberto(false);
  };

  const adicionarConsumo = (produto) => {
    setCarrinhoConsumo([...carrinhoConsumo, { produto, quantidade_usada: '' }]);
    setBuscaProdutoConsumo('');
    setDropdownConsumoAberto(false);
  };

  const atualizarQuantidadeConsumo = (index, valor) => {
    const novo = [...carrinhoConsumo];
    novo[index].quantidade_usada = valor;
    setCarrinhoConsumo(novo);
  };

  const valorServicoNum = valorServico === '' ? 0 : Number(valorServico);
  const totalGeral = valorServicoNum + carrinhoVenda.reduce((acc, item) => acc + (Number(item.preco_venda) || Number(item.preco) || 0), 0);

  const handleFinalizar = async () => {
    setLoading(true);
    try {
      if (!salaoId) throw new Error("Erro de autenticação do salão.");

      await supabase.from('agendamentos').update({ 
        status: 'concluido', 
        valor_total: totalGeral, 
        valor: valorServicoNum 
      }).eq('id', agendamento.id);

      for (const item of carrinhoVenda) {
        await supabase.from('produtos')
          .update({ quantidade_atual: Math.max(0, (item.quantidade_atual || 0) - 1) })
          .eq('id', item.id);
      }

      if (anotacoes || carrinhoConsumo.length > 0) {
        const { data: fichaData, error: fichaError } = await supabase.from('fichas_anamnese').insert([{
          salao_id: salaoId,
          cliente_id: agendamento.cliente_id || agendamento.clientes?.id,
          agendamento_id: agendamento.id,
          anotacoes: anotacoes || null
        }]).select().single();

        if (fichaError) throw fichaError;

        if (fichaData && carrinhoConsumo.length > 0) {
          const insertConsumo = carrinhoConsumo
            .filter(c => c.quantidade_usada && Number(c.quantidade_usada) > 0)
            .map(c => ({
              salao_id: salaoId,
              ficha_id: fichaData.id,
              produto_id: c.produto.id,
              quantidade_usada: Number(c.quantidade_usada) 
            }));

          if (insertConsumo.length > 0) {
            const { error: consumoError } = await supabase.from('consumo_produtos').insert(insertConsumo);
            if (consumoError) throw consumoError;
          }
        }
      }

      setModalSucessoOpen(true);
    } catch (err) { 
      alert('Erro: ' + err.message); 
    } finally { 
      setLoading(false); 
    }
  };

  const produtosVendaFiltrados = listaProdutos.filter(p => p.nome.toLowerCase().includes(buscaProdutoVenda.trim().toLowerCase()));
  
  const produtosConsumoFiltrados = listaProdutos.filter(p => {
    const termo = buscaProdutoConsumo.trim().toLowerCase();
    if (termo) return p.nome.toLowerCase().includes(termo); 
    if (categoriaSugerida) return p.categoria?.toLowerCase() === categoriaSugerida.toLowerCase(); 
    return true; 
  });

  return createPortal(
    <div className="fixed inset-0 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200" style={{ zIndex: 99990 }}>
      
      <div className="bg-[#18181b] w-full sm:max-w-md sm:rounded-[32px] rounded-t-[32px] border border-white/10 shadow-2xl relative flex flex-col animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-4 duration-300 overflow-hidden" style={{ maxHeight: '95dvh' }}>
        
        {/* Header */}
        <div className="flex justify-between items-start p-6 border-b border-white/5 bg-[#18181b] shrink-0">
          <div>
             <h2 className="text-xl font-bold text-white flex items-center gap-2">
               <CheckCircle className="text-green-500" size={24}/> Finalizar
             </h2>
             <div className="mt-2 space-y-1">
                <p className="text-gray-200 text-sm flex items-center gap-2 font-medium">
                  <User size={14} className="text-purple-400"/> {agendamento.cliente_nome || agendamento.clientes?.nome}
                </p>
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
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">Cobrança do Serviço</label>
            <div className="bg-[#18181b] rounded-2xl p-4 border border-white/10 shadow-lg flex flex-col gap-1 relative focus-within:border-green-500/50 transition-colors">
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

          {/* Vendas Adicionais (Revenda) */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">Venda de Produtos (Revenda)</label>
            <div className="relative">
              <div className="absolute left-3 top-3 text-gray-500 pointer-events-none"><Search size={16} /></div>
              <input 
                placeholder="Ex: Shampoo Home Care..." 
                className="w-full bg-[#18181b] border border-white/10 rounded-xl py-3 pl-10 text-white text-sm outline-none focus:border-green-500/50 transition-all"
                value={buscaProdutoVenda} 
                onChange={e => {
                  setBuscaProdutoVenda(e.target.value);
                  setDropdownVendaAberto(true);
                }}
                onFocus={() => setDropdownVendaAberto(true)}
                onBlur={() => setTimeout(() => setDropdownVendaAberto(false), 200)}
              />
              {dropdownVendaAberto && (
                <div className="absolute top-full left-0 w-full bg-[#27272a] border border-white/10 rounded-xl mt-2 max-h-48 overflow-y-auto z-50 shadow-2xl custom-scrollbar">
                  {produtosVendaFiltrados.length > 0 ? (
                    produtosVendaFiltrados.map(p => (
                      <div key={p.id} onClick={() => adicionarVenda(p)} className="p-3 hover:bg-white/5 cursor-pointer flex justify-between items-center border-b border-white/5 last:border-0">
                        <span className="text-white text-sm font-medium">{p.nome}</span>
                        <span className="text-green-400 text-xs font-bold">R$ {p.preco_venda || p.preco || 0}</span>
                      </div>
                    ))
                  ) : <div className="p-4 text-center text-gray-500 text-xs">Não encontrado.</div>}
                </div>
              )}
            </div>

            {carrinhoVenda.length > 0 && (
              <div className="flex flex-col gap-2 mt-2">
                {carrinhoVenda.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-[#18181b] p-3 rounded-xl border border-white/5 animate-in slide-in-from-bottom-2">
                    <div className="flex gap-3 items-center">
                      <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400"><Package size={14}/></div>
                      <span className="text-sm text-gray-200 font-medium">{item.nome}</span>
                    </div>
                    <div className="flex gap-3 items-center">
                      <span className="text-sm font-bold text-white">R$ {item.preco_venda || item.preco || 0}</span>
                      <button onClick={() => {
                        const novo = [...carrinhoVenda]; novo.splice(idx, 1); setCarrinhoVenda(novo);
                      }} className="text-red-400 hover:text-red-300 p-1.5 rounded-lg"><Trash2 size={14}/></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* FICHA QUÍMICA E CONSUMO */}
          <div className="pt-4 border-t border-white/5">
            {!abrirAnamnese ? (
              <button 
                onClick={() => setAbrirAnamnese(true)}
                className="w-full py-3 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 rounded-xl font-bold transition-all flex justify-center items-center gap-2 text-sm"
              >
                <ClipboardEdit size={16}/> Preencher Ficha Técnica / Consumo
              </button>
            ) : (
              <div className="bg-purple-900/10 border border-purple-500/30 rounded-2xl p-4 animate-in fade-in space-y-4">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="text-purple-300 font-bold flex items-center gap-2 text-sm"><Beaker size={16}/> Ficha Química Interna</h3>
                  <button onClick={() => setAbrirAnamnese(false)} className="text-xs text-gray-400 hover:text-white">Ocultar</button>
                </div>
                <p className="text-[10px] text-gray-500 mb-2 leading-tight">Registre o que foi gasto (dá baixa no estoque e salva no histórico da cliente).</p>

                <div className="relative">
                  {categoriaSugerida && !buscaProdutoConsumo && (
                    <div className="absolute -top-2.5 right-3 bg-purple-600 text-[9px] font-bold px-2 py-0.5 rounded text-white flex items-center gap-1 shadow-md">
                      <Sparkles size={10}/> Sugerindo: {categoriaSugerida}
                    </div>
                  )}
                  <div className="absolute left-3 top-3 text-purple-400 pointer-events-none"><Search size={16} /></div>
                  <input 
                    placeholder="Buscar produto utilizado..." 
                    className="w-full bg-[#18181b] border border-purple-500/30 rounded-xl py-3 pl-10 text-white text-sm outline-none focus:border-purple-500 transition-all"
                    value={buscaProdutoConsumo} 
                    onChange={e => {
                      setBuscaProdutoConsumo(e.target.value);
                      setDropdownConsumoAberto(true);
                    }}
                    onFocus={() => setDropdownConsumoAberto(true)}
                    onBlur={() => setTimeout(() => setDropdownConsumoAberto(false), 200)}
                  />
                  {dropdownConsumoAberto && (
                    <div className="absolute top-full left-0 w-full bg-[#27272a] border border-purple-500/50 rounded-xl mt-2 max-h-48 overflow-y-auto z-50 shadow-2xl custom-scrollbar">
                      {produtosConsumoFiltrados.length > 0 ? (
                        produtosConsumoFiltrados.map(p => (
                          <div key={p.id} onClick={() => adicionarConsumo(p)} className="p-3 hover:bg-white/5 cursor-pointer flex justify-between items-center border-b border-white/5 last:border-0">
                            <span className="text-white text-sm font-medium">{p.nome}</span>
                            <span className="text-purple-400 text-[10px] uppercase font-bold bg-purple-500/20 px-2 py-1 rounded">
                              Estoque: {parseFloat(p.quantidade_atual).toFixed(1)} {p.unidade_medida || 'un'}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-gray-500 text-xs">
                          {categoriaSugerida && !buscaProdutoConsumo 
                            ? "Nenhum produto dessa categoria no estoque. Digite para buscar outros."
                            : "Nenhum produto encontrado no estoque."}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {carrinhoConsumo.length > 0 && (
                  <div className="flex flex-col gap-2">
                    {carrinhoConsumo.map((item, idx) => (
                      <div key={idx} className="flex gap-2 items-center bg-[#18181b] p-2 rounded-xl border border-white/5">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-300 font-medium truncate pl-1">{item.produto.nome}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <input 
                            type="number" 
                            placeholder="Qtd." 
                            value={item.quantidade_usada}
                            onChange={(e) => atualizarQuantidadeConsumo(idx, e.target.value)}
                            className="w-16 bg-[#27272a] border border-white/10 rounded-lg py-1.5 px-2 text-white text-xs text-center outline-none focus:border-purple-500"
                          />
                          <span className="text-[10px] text-gray-500 w-4">{item.produto.unidade_medida || 'un'}</span>
                          <button onClick={() => {
                            const novo = [...carrinhoConsumo]; novo.splice(idx, 1); setCarrinhoConsumo(novo);
                          }} className="text-red-400 hover:text-red-300 p-1 rounded-lg ml-1"><Trash2 size={14}/></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <textarea
                  placeholder="Receita ou anotações químicas (Ex: Cabelo poroso, deixei 40 min...)"
                  value={anotacoes}
                  onChange={e => setAnotacoes(e.target.value)}
                  className="w-full bg-[#18181b] border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-purple-500 transition-all min-h-[80px] resize-none custom-scrollbar"
                />
              </div>
            )}
          </div>

        </div>

        {/* Footer Fixo */}
        <div className="p-6 pt-4 border-t border-white/5 bg-[#18181b] shrink-0">
          <div className="flex justify-between items-end mb-4 px-1">
            <span className="text-gray-400 text-xs font-medium">Total Cobrado (Cliente)</span>
            <span className="text-2xl font-bold text-white tracking-tight flex items-baseline gap-1">
              <span className="text-green-500 text-sm font-normal">R$</span>{totalGeral.toFixed(2)}
            </span>
          </div>
          <button 
            onClick={handleFinalizar} 
            disabled={loading} 
            className="w-full py-4 bg-green-600 hover:bg-green-500 text-white rounded-2xl font-bold shadow-lg transition-all active:scale-95 flex justify-center items-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={20}/> : <><CheckCircle size={20}/> Concluir e Salvar Ficha</>}
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
            valor_servico: valorServicoNum, 
            total: totalGeral,
            itens: carrinhoVenda, 
            profissional: nomeProfissional,
            onSuccess: onSuccess 
        }}
      />
    </div>,
    document.body
  );
};