import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Loader2, Package, DollarSign, Truck, Calendar, FileText, Hash } from 'lucide-react';
import { supabase } from '../../services/supabase';

export const EstoqueModal = ({ aberto, onFechar, onSucesso }) => {
  const [salvando, setSalvando] = useState(false);
  const [salaoId, setSalaoId] = useState(null);
  
  // Listas para os Selects
  const [produtos, setProdutos] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  
  const [formData, setFormData] = useState({
    produto_id: '',
    quantidade: '1',
    custo_unitario: '',
    fornecedor_id: '',
    data_entrada: new Date().toISOString().split('T')[0],
    observacoes: ''
  });

  // 1. Busca ID do Salão
  useEffect(() => {
    const fetchSalao = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('usuarios').select('salao_id').eq('id', user.id).single();
        if (data) setSalaoId(data.salao_id);
      }
    };
    fetchSalao();
  }, []);

  // 2. Carrega Produtos e Fornecedores existentes
  useEffect(() => {
    const fetchDados = async () => {
      if (!salaoId) return;
      
      try {
        const [prodRes, fornRes] = await Promise.all([
          supabase.from('produtos').select('id, nome, custo_unitario, quantidade_atual').eq('salao_id', salaoId).eq('ativo', true).order('nome'),
          supabase.from('fornecedores').select('id, nome').eq('salao_id', salaoId).eq('ativo', true).order('nome')
        ]);

        if (prodRes.data) setProdutos(prodRes.data);
        if (fornRes.data) setFornecedores(fornRes.data);
      } catch (error) {
        console.error('Erro ao carregar listas:', error);
      }
    };

    if (salaoId && aberto) fetchDados();
  }, [salaoId, aberto]);

  // Função para tratar moeda
  const parseMoeda = (valor) => {
    if (!valor) return 0;
    const numeroLimpo = valor.toString().replace(/[^0-9.,]/g, '').replace(',', '.');
    return parseFloat(numeroLimpo) || 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!salaoId || !formData.produto_id || !formData.quantidade || !formData.custo_unitario) {
      return alert("Preencha: Produto, Quantidade e Custo.");
    }

    setSalvando(true);
    try {
      const custoReal = parseMoeda(formData.custo_unitario);
      const qtdReal = parseInt(formData.quantidade);

      // 1. Registra a Movimentação
      const { data: mov, error: movError } = await supabase.from('movimentacoes_estoque').insert([{
        salao_id: salaoId,
        produto_id: formData.produto_id,
        tipo: 'entrada',
        quantidade: qtdReal,
        custo_unitario: custoReal,
        fornecedor_id: formData.fornecedor_id || null,
        data_movimentacao: formData.data_entrada,
        observacoes: formData.observacoes || null
      }]).select().single();

      if (movError) throw movError;

      // 2. Atualiza o Estoque do Produto (Soma)
      const produtoAtual = produtos.find(p => p.id == formData.produto_id);
      const novaQuantidade = (produtoAtual?.quantidade_atual || 0) + qtdReal;
      
      // AQUI ESTÁ A CORREÇÃO: Enviamos para 'custo_unitario' E para 'custo'
      await supabase.from('produtos').update({ 
        quantidade_atual: novaQuantidade,
        custo_unitario: custoReal,
        custo: custoReal // <--- Isso satisfaz o banco antigo e resolve o erro
      }).eq('id', formData.produto_id);

      // 3. Lança a Despesa
      await supabase.from('despesas').insert([{
        salao_id: salaoId,
        descricao: `Compra Estoque: ${produtoAtual?.nome}`,
        categoria: 'Produtos',
        valor: qtdReal * custoReal,
        data_vencimento: formData.data_entrada,
        pago: true,
        movimentacao_estoque_id: mov.id,
        fornecedor_id: formData.fornecedor_id || null
      }]);

      onSucesso();
      onFechar();
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao dar entrada no estoque: ' + (error.message || 'Verifique os dados'));
    } finally {
      setSalvando(false);
    }
  };

  const totalCompra = parseMoeda(formData.custo_unitario) * (parseInt(formData.quantidade) || 0);

  if (!aberto) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
      
      <div className="bg-gray-900 border border-gray-700 w-full max-w-md rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden relative">
        
        <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between bg-gray-900/95 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Package className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white leading-tight">Entrada de Estoque</h3>
              <p className="text-xs text-gray-400">Adicionar itens comprados</p>
            </div>
          </div>
          <button onClick={onFechar} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
          
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Produto*</label>
            <div className="relative group">
              <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
              <select 
                value={formData.produto_id} 
                onChange={e => {
                  const pid = e.target.value;
                  const p = produtos.find(x => x.id == pid);
                  setFormData({
                    ...formData, 
                    produto_id: pid, 
                    custo_unitario: p?.custo_unitario?.toString().replace('.', ',') || ''
                  });
                }} 
                className="w-full pl-10 pr-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none appearance-none text-sm"
              >
                <option value="">Selecione o produto...</option>
                {produtos.map(p => (
                  <option key={p.id} value={p.id}>{p.nome} (Atual: {p.quantidade_atual})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
             <div className="space-y-1.5">
               <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Qtd (Unid)*</label>
               <div className="relative group">
                 <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                 <input 
                   type="number" 
                   min="1"
                   value={formData.quantidade} 
                   onChange={e => setFormData({...formData, quantidade: e.target.value})} 
                   className="w-full pl-9 pr-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none text-sm" 
                   placeholder="1"
                 />
               </div>
             </div>

             <div className="space-y-1.5">
               <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Custo Unit. (R$)*</label>
               <div className="relative group">
                 <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                 <input 
                   type="text" 
                   value={formData.custo_unitario} 
                   onChange={e => setFormData({...formData, custo_unitario: e.target.value})} 
                   className="w-full pl-9 pr-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none text-sm" 
                   placeholder="0,00" 
                 />
               </div>
             </div>
          </div>

          {totalCompra > 0 && (
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl flex justify-between items-center text-sm animate-in fade-in slide-in-from-top-2">
              <span className="text-blue-200">Total desta Compra:</span>
              <span className="font-bold text-white text-base">R$ {totalCompra.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Fornecedor</label>
            <div className="relative group">
              <Truck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
              <select 
                value={formData.fornecedor_id} 
                onChange={e => setFormData({...formData, fornecedor_id: e.target.value})} 
                className="w-full pl-10 pr-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none appearance-none text-sm"
              >
                <option value="">Sem fornecedor (Opcional)</option>
                {fornecedores.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Data da Entrada</label>
            <div className="relative group">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
              <input 
                type="date" 
                value={formData.data_entrada} 
                onChange={e => setFormData({...formData, data_entrada: e.target.value})} 
                className="w-full pl-10 pr-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none text-sm [color-scheme:dark]" 
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Observações</label>
            <div className="relative group">
              <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
              <textarea 
                value={formData.observacoes} 
                onChange={e => setFormData({...formData, observacoes: e.target.value})} 
                className="w-full pl-10 pr-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none text-sm h-20 resize-none placeholder-gray-600" 
                placeholder="Nº da Nota Fiscal, Lote, etc..." 
              />
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-800 bg-gray-900/95 flex gap-3 shrink-0">
          <button onClick={onFechar} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-300 hover:bg-gray-800 rounded-xl transition-colors border border-transparent hover:border-gray-700" disabled={salvando}>Cancelar</button>
          <button onClick={handleSubmit} disabled={salvando} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 disabled:opacity-50 transition-all hover:scale-[1.02]">
            {salvando ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</> : <><Save className="w-4 h-4" /> Confirmar Entrada</>}
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};