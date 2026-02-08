import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Search, Package, Trash2 } from 'lucide-react';
import { supabase } from '../../services/supabase'; 
import jsPDF from 'jspdf';

export const ModalFinalizarAtendimento = ({ isOpen, onClose, agendamento, onSuccess }) => {
  
  // --- PARTE IMPORTANTE: OS HOOKS DEVEM VIR PRIMEIRO ---
  
  const [loading, setLoading] = useState(false);
  // Garante que não quebre se o agendamento vier vazio
  const [valorServico, setValorServico] = useState(0);
  
  // Estados dos Produtos
  const [listaProdutos, setListaProdutos] = useState([]);
  const [buscaProduto, setBuscaProduto] = useState('');
  const [carrinho, setCarrinho] = useState([]);

  // useEffect também é um Hook e deve ficar aqui no topo
  useEffect(() => {
    const fetchProdutos = async () => {
      const { data } = await supabase
        .from('produtos')
        .select('*')
        .gt('estoque', 0) 
        .order('nome');
      setListaProdutos(data || []);
    };
    
    // Só carrega os dados se o modal estiver aberto e tiver agendamento
    if (isOpen && agendamento) {
        fetchProdutos();
        setValorServico(agendamento.valor || 0);
        setCarrinho([]);
    }
  }, [isOpen, agendamento]);

  // --- SÓ AGORA PODEMOS FAZER O RETURN (GUARD CLAUSE) ---
  if (!isOpen || !agendamento) return null;

  // --- DAQUI PRA BAIXO É A LÓGICA NORMAL ---

  const adicionarProduto = (produto) => {
    setCarrinho([...carrinho, { ...produto, qtd: 1 }]);
    setBuscaProduto('');
  };

  const removerProduto = (index) => {
    const novoCarrinho = [...carrinho];
    novoCarrinho.splice(index, 1);
    setCarrinho(novoCarrinho);
  };

  const totalGeral = parseFloat(valorServico) + carrinho.reduce((acc, item) => acc + item.preco, 0);

  const gerarPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text("Resumo do Atendimento", 105, 20, null, null, "center");
    
    doc.setFontSize(12);
    doc.text(`Cliente: ${agendamento.cliente_nome}`, 20, 40);
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 20, 50);

    let linha = 70;
    
    doc.text(`Serviço: ${agendamento.servico}`, 20, linha);
    doc.text(`R$ ${parseFloat(valorServico).toFixed(2)}`, 170, linha);
    linha += 10;

    carrinho.forEach(prod => {
      doc.text(`Prod: ${prod.nome}`, 20, linha);
      doc.text(`R$ ${prod.preco.toFixed(2)}`, 170, linha);
      linha += 10;
    });

    doc.line(20, linha, 190, linha);
    linha += 10;
    doc.setFontSize(14);
    doc.text(`TOTAL: R$ ${totalGeral.toFixed(2)}`, 170, linha, null, null, "right");

    const nomeArquivo = `recibo_${agendamento.cliente_nome.replace(/ /g, '_')}.pdf`;
    doc.save(nomeArquivo);
  };

  const handleFinalizar = async () => {
    setLoading(true);
    try {
      // 1. Baixa no estoque
      for (const item of carrinho) {
        const novoEstoque = item.estoque - 1;
        await supabase.from('produtos').update({ estoque: novoEstoque }).eq('id', item.id);
      }

      // 2. Atualizar Agendamento
      const { error } = await supabase
        .from('agendamentos')
        .update({ 
          status: 'concluido',
          valor_total: totalGeral 
        })
        .eq('id', agendamento.id);

      if (error) throw error;

      // 3. Gerar PDF e WhatsApp
      gerarPDF();

      if (agendamento.telefone) {
        const numero = agendamento.telefone.replace(/\D/g, '');
        const texto = `Olá ${agendamento.cliente_nome}! Atendimento finalizado. Total: R$ ${totalGeral.toFixed(2)}.`;
        window.open(`https://wa.me/55${numero}?text=${encodeURIComponent(texto)}`, '_blank');
      }

      onSuccess();
      onClose();

    } catch (err) {
      alert('Erro ao finalizar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const produtosFiltrados = listaProdutos.filter(p => 
    p.nome.toLowerCase().includes(buscaProduto.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-[#18181b] border border-white/10 w-full max-w-lg rounded-3xl p-6 shadow-2xl animate-in zoom-in-95">
        
        <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
          <h2 className="text-xl font-bold text-white">Fechar Conta</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-white"><X size={20}/></button>
        </div>

        <div className="space-y-6">
          {/* Valor do Serviço */}
          <div className="bg-white/5 p-4 rounded-xl border border-white/5">
            <label className="text-xs text-gray-400 uppercase font-bold block mb-2">Serviço: {agendamento.servico}</label>
            <div className="flex items-center gap-2 bg-[#0a0a0f] p-2 rounded-lg border border-white/10">
              <span className="text-green-400 font-bold">R$</span>
              <input 
                type="number" 
                value={valorServico} 
                onChange={e => setValorServico(e.target.value)}
                className="bg-transparent text-white w-full outline-none font-bold"
              />
            </div>
          </div>

          {/* Produtos */}
          <div>
            <label className="text-xs text-gray-400 uppercase font-bold block mb-2">Adicionar Produtos</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-500" size={16} />
              <input 
                placeholder="Buscar produto..." 
                className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white text-sm outline-none focus:border-purple-500"
                value={buscaProduto}
                onChange={e => setBuscaProduto(e.target.value)}
              />
              {buscaProduto && (
                <div className="absolute top-full left-0 w-full bg-[#27272a] border border-white/10 rounded-xl mt-1 max-h-40 overflow-y-auto z-10 shadow-xl">
                  {produtosFiltrados.map(prod => (
                    <div key={prod.id} onClick={() => adicionarProduto(prod)} className="p-3 hover:bg-purple-500/20 cursor-pointer flex justify-between border-b border-white/5">
                      <span className="text-white text-sm">{prod.nome}</span>
                      <span className="text-green-400 text-xs font-bold">R$ {prod.preco}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Lista Carrinho */}
            <div className="mt-3 space-y-2">
              {carrinho.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center bg-white/5 p-2 rounded-lg border border-white/5">
                  <div className="flex items-center gap-2">
                    <Package size={14} className="text-purple-400"/>
                    <span className="text-sm text-gray-300">{item.nome}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-white">R$ {item.preco}</span>
                    <button onClick={() => removerProduto(idx)} className="text-red-400 hover:text-red-300"><Trash2 size={14}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="flex justify-between items-center pt-4 border-t border-white/10">
            <span className="text-gray-400 text-sm">Total a pagar:</span>
            <span className="text-2xl font-bold text-emerald-400">R$ {totalGeral.toFixed(2)}</span>
          </div>

          <button onClick={handleFinalizar} disabled={loading} className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all">
            {loading ? 'Processando...' : <><CheckCircle size={20}/> Finalizar e Gerar PDF</>}
          </button>
        </div>
      </div>
    </div>
  );
};