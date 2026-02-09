// src/screens/agenda/ModalFinalizarAtendimento.jsx
import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Search, Package, Trash2, Loader2, DollarSign } from 'lucide-react';
import { supabase } from '../../services/supabase'; 
import jsPDF from 'jspdf';

export const ModalFinalizarAtendimento = ({ isOpen, onClose, agendamento, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [valorServico, setValorServico] = useState(0);
  const [listaProdutos, setListaProdutos] = useState([]);
  const [buscaProduto, setBuscaProduto] = useState('');
  const [carrinho, setCarrinho] = useState([]);

  useEffect(() => {
    const fetchProdutos = async () => {
      const { data } = await supabase.from('produtos').select('*').gt('estoque', 0).order('nome');
      setListaProdutos(data || []);
    };
    if (isOpen && agendamento) {
        fetchProdutos();
        setValorServico(agendamento.valor || 0);
        setCarrinho([]);
        setBuscaProduto('');
    }
  }, [isOpen, agendamento]);

  if (!isOpen || !agendamento) return null;

  const adicionarProduto = (produto) => {
    setCarrinho([...carrinho, { ...produto, qtd: 1 }]);
    setBuscaProduto('');
  };

  const removerProduto = (index) => {
    const novoCarrinho = [...carrinho];
    novoCarrinho.splice(index, 1);
    setCarrinho(novoCarrinho);
  };

  const totalGeral = Number(valorServico) + carrinho.reduce((acc, item) => acc + Number(item.preco), 0);

  const gerarPDF = () => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: [80, 200] });
    doc.setFontSize(10); doc.text("LUNI SYSTEM", 40, 10, null, null, "center");
    doc.setFontSize(8); doc.text("Resumo do Atendimento", 40, 15, null, null, "center");
    doc.line(5, 18, 75, 18);
    let y = 25;
    doc.text(`Cliente: ${agendamento.cliente_nome}`, 5, y); y += 5;
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 5, y); y += 8;
    doc.setFont(undefined, 'bold'); doc.text("SERVIÇO", 5, y); y += 5;
    doc.setFont(undefined, 'normal'); doc.text(`${agendamento.servico}`, 5, y);
    doc.text(`R$ ${Number(valorServico).toFixed(2)}`, 75, y, null, null, "right"); y += 8;
    if (carrinho.length > 0) {
      doc.setFont(undefined, 'bold'); doc.text("PRODUTOS", 5, y); y += 5;
      doc.setFont(undefined, 'normal');
      carrinho.forEach(prod => {
        const nomeProd = prod.nome.length > 20 ? prod.nome.substring(0, 20) + '...' : prod.nome;
        doc.text(`${nomeProd}`, 5, y); doc.text(`R$ ${prod.preco.toFixed(2)}`, 75, y, null, null, "right"); y += 5;
      });
      y += 3;
    }
    doc.line(5, y, 75, y); y += 7;
    doc.setFontSize(12); doc.setFont(undefined, 'bold');
    doc.text(`TOTAL: R$ ${totalGeral.toFixed(2)}`, 75, y, null, null, "right");
    doc.save(`recibo_${agendamento.cliente_nome.replace(/ /g, '_')}.pdf`);
  };

  const handleFinalizar = async () => {
    setLoading(true);
    try {
      for (const item of carrinho) {
        if (item.id) await supabase.from('produtos').update({ estoque: Math.max(0, item.estoque - 1) }).eq('id', item.id);
      }
      const { error } = await supabase.from('agendamentos').update({ status: 'concluido', valor_total: totalGeral }).eq('id', agendamento.id);
      if (error) throw error;
      gerarPDF();
      if (agendamento.telefone) {
        const link = `https://wa.me/55${agendamento.telefone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá ${agendamento.cliente_nome}! Total: R$ ${totalGeral.toFixed(2)}`)}`;
        window.open(link, '_blank');
      }
      onSuccess(); onClose();
    } catch (err) { alert('Erro: ' + err.message); } finally { setLoading(false); }
  };

  const produtosFiltrados = listaProdutos.filter(p => p.nome.toLowerCase().includes(buscaProduto.toLowerCase()));

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-[#18181b] border border-white/10 w-full max-w-lg rounded-3xl p-6 shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
          <h2 className="text-xl font-bold text-white flex gap-2"><CheckCircle className="text-green-500"/> Finalizar</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20}/></button>
        </div>
        <div className="space-y-6 overflow-y-auto pr-2 custom-scrollbar">
          <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
            <div className="flex justify-between mb-2"><label className="text-xs text-purple-400 font-bold">SERVIÇO</label><span className="text-xs text-gray-500">{agendamento.servico}</span></div>
            <div className="flex items-center gap-3 bg-[#0a0a0f] p-3 rounded-xl border border-white/10"><DollarSign className="text-green-500" size={20}/><input type="number" value={valorServico} onChange={e => setValorServico(e.target.value)} className="bg-transparent text-white w-full outline-none font-bold text-lg"/></div>
          </div>
          <div>
            <label className="text-xs text-gray-400 font-bold mb-2 block">PRODUTOS</label>
            <div className="relative group"><Search className="absolute left-3 top-3 text-gray-500" size={18} /><input placeholder="Buscar produto..." className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl py-3 pl-10 text-white text-sm outline-none focus:border-purple-500" value={buscaProduto} onChange={e => setBuscaProduto(e.target.value)}/>
              {buscaProduto && <div className="absolute top-full left-0 w-full bg-[#1c1c24] border border-white/10 rounded-xl mt-2 max-h-40 overflow-y-auto z-20 shadow-xl">{produtosFiltrados.map(p => <div key={p.id} onClick={() => adicionarProduto(p)} className="p-3 hover:bg-white/5 cursor-pointer flex justify-between"><span className="text-white text-sm">{p.nome}</span><span className="text-green-400 text-xs">R$ {p.preco}</span></div>)}</div>}
            </div>
            {carrinho.length > 0 && <div className="mt-4 space-y-2">{carrinho.map((item, idx) => <div key={idx} className="flex justify-between bg-white/5 p-3 rounded-xl border border-white/5"><div className="flex gap-3"><Package size={16} className="text-purple-400"/><span className="text-sm text-gray-200">{item.nome}</span></div><div className="flex gap-4"><span className="text-sm font-bold text-white">R$ {item.preco}</span><button onClick={() => removerProduto(idx)} className="text-red-400"><Trash2 size={16}/></button></div></div>)}</div>}
          </div>
        </div>
        <div className="mt-6 pt-4 border-t border-white/10">
          <div className="flex justify-between mb-4"><span className="text-gray-400">Total</span><span className="text-2xl font-bold text-white"><span className="text-green-500 text-lg mr-1">R$</span>{totalGeral.toFixed(2)}</span></div>
          <button onClick={handleFinalizar} disabled={loading} className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-xl flex justify-center gap-2">{loading ? <Loader2 className="animate-spin" /> : <><CheckCircle size={20}/> Confirmar</>}</button>
        </div>
      </div>
    </div>
  );
};