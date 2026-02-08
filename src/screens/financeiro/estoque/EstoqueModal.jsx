// src/screens/financeiro/estoque/EstoqueModal.jsx
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Save, Loader2, Package, DollarSign, Truck, Hash, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { supabase } from '../../../services/supabase';

export const EstoqueModal = ({ aberto, onFechar, onSucesso }) => {
  const [salvando, setSalvando] = useState(false);
  const [salaoId, setSalaoId] = useState(null);
  const [tipoMovimento, setTipoMovimento] = useState('entrada'); // 'entrada' ou 'saida'
  const [produtos, setProdutos] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  
  const [formData, setFormData] = useState({
    produto_id: '',
    quantidade: '1',
    custo_unitario: '',
    fornecedor_id: '',
    data_movimentacao: new Date().toISOString().split('T')[0],
    observacoes: ''
  });

  // Busca o ID do salão do usuário logado
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

  // Busca produtos e fornecedores quando o modal abre
  useEffect(() => {
    const fetchDados = async () => {
      if (!salaoId || !aberto) return;
      
      try {
        const [prodRes, fornRes] = await Promise.all([
          supabase
            .from('produtos')
            .select('id, nome, custo_unitario, quantidade_atual')
            .eq('salao_id', salaoId)
            .eq('ativo', true)
            .order('nome'),
          supabase
            .from('fornecedores')
            .select('id, nome')
            .eq('salao_id', salaoId)
            .eq('ativo', true)
            .order('nome')
        ]);

        if (prodRes.data) setProdutos(prodRes.data);
        if (fornRes.data) setFornecedores(fornRes.data);
      } catch (error) { 
        console.error("Erro ao buscar dados:", error); 
      }
    };

    fetchDados();
  }, [salaoId, aberto]);

  const parseMoeda = (valor) => {
    if (!valor) return 0;
    const numeroLimpo = valor.toString().replace(/[^0-9.,]/g, '').replace(',', '.');
    return parseFloat(numeroLimpo) || 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!salaoId || !formData.produto_id || !formData.quantidade) {
      return alert("Preencha os campos obrigatórios.");
    }

    setSalvando(true);
    try {
      const custoReal = parseMoeda(formData.custo_unitario);
      const qtdReal = parseInt(formData.quantidade);
      const produtoAtual = produtos.find(p => p.id == formData.produto_id);

      // Validação de estoque negativo na saída
      if (tipoMovimento === 'saida' && (produtoAtual?.quantidade_atual || 0) < qtdReal) {
        alert(`Erro: Estoque insuficiente. Atual: ${produtoAtual?.quantidade_atual}`);
        setSalvando(false);
        return;
      }

      // 1. Registra a movimentação
      const { data: mov, error: movError } = await supabase
        .from('movimentacoes_estoque')
        .insert([{
          salao_id: salaoId,
          produto_id: formData.produto_id,
          tipo: tipoMovimento,
          quantidade: qtdReal,
          custo_unitario: custoReal,
          fornecedor_id: tipoMovimento === 'entrada' ? (formData.fornecedor_id || null) : null,
          data_movimentacao: formData.data_movimentacao,
          observacoes: formData.observacoes || (tipoMovimento === 'saida' ? 'Consumo Interno' : null)
        }])
        .select()
        .single();

      if (movError) throw movError;

      // 2. Atualiza a quantidade e custo do produto
      const novaQuantidade = tipoMovimento === 'entrada' 
        ? (produtoAtual?.quantidade_atual || 0) + qtdReal
        : (produtoAtual?.quantidade_atual || 0) - qtdReal;

      const updateData = { 
        quantidade_atual: novaQuantidade,
        // Só atualiza o custo se for entrada (nova compra)
        ...(tipoMovimento === 'entrada' && { custo_unitario: custoReal, custo: custoReal }) 
      };

      const { error: prodError } = await supabase
        .from('produtos')
        .update(updateData)
        .eq('id', formData.produto_id);

      if (prodError) throw prodError;

      // 3. Se for entrada, cria a despesa automaticamente
      if (tipoMovimento === 'entrada') {
        const { error: despError } = await supabase.from('despesas').insert([{
          salao_id: salaoId,
          descricao: `Compra Estoque: ${produtoAtual?.nome}`,
          categoria: 'Produtos',
          valor: qtdReal * custoReal,
          data_vencimento: formData.data_movimentacao,
          pago: true, // Assume pago pois é entrada de estoque imediata (ajustável)
          movimentacao_estoque_id: mov.id,
          fornecedor_id: formData.fornecedor_id || null
        }]);
        
        if (despError) throw despError;
      }

      onSucesso();
      onFechar();
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao registrar movimentação: ' + error.message);
    } finally {
      setSalvando(false);
    }
  };

  const total = parseMoeda(formData.custo_unitario) * (parseInt(formData.quantidade) || 0);

  if (!aberto) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
      <div className="bg-gray-900 border border-gray-700 w-full max-w-md rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden relative">
        
        {/* Abas de Tipo de Movimento */}
        <div className="flex border-b border-gray-800">
          <button 
            onClick={() => setTipoMovimento('entrada')} 
            className={`flex-1 p-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${tipoMovimento === 'entrada' ? 'bg-gray-800 text-blue-400 border-b-2 border-blue-500' : 'text-gray-400 hover:bg-gray-800/50'}`}
          >
            <ArrowUpCircle className="w-5 h-5" /> Entrada (Compra)
          </button>
          <button 
            onClick={() => setTipoMovimento('saida')} 
            className={`flex-1 p-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${tipoMovimento === 'saida' ? 'bg-gray-800 text-red-400 border-b-2 border-red-500' : 'text-gray-400 hover:bg-gray-800/50'}`}
          >
            <ArrowDownCircle className="w-5 h-5" /> Saída (Uso)
          </button>
        </div>

        {/* Formulário Scrollável */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
          
          {/* Seleção de Produto */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Produto*</label>
            <div className="relative group">
              <Package className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${tipoMovimento === 'entrada' ? 'text-blue-500' : 'text-red-500'}`} />
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
                className={`w-full pl-10 pr-4 py-2.5 bg-gray-800/50 border rounded-xl text-white outline-none appearance-none text-sm transition-colors ${tipoMovimento === 'entrada' ? 'border-gray-700 focus:border-blue-500' : 'border-gray-700 focus:border-red-500'}`}
              >
                <option value="">Selecione...</option>
                {produtos.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.nome} (Atual: {p.quantidade_atual})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
             <div className="space-y-1.5">
               <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Qtd*</label>
               <div className="relative group">
                 <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                 <input 
                   type="number" 
                   min="1" 
                   value={formData.quantidade} 
                   onChange={e => setFormData({...formData, quantidade: e.target.value})} 
                   className="w-full pl-9 pr-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white outline-none text-sm" 
                   placeholder="1" 
                 />
               </div>
             </div>
             
             <div className="space-y-1.5">
               <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Custo Unit. (R$)</label>
               <div className="relative group">
                 <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                 <input 
                   type="text" 
                   value={formData.custo_unitario} 
                   onChange={e => setFormData({...formData, custo_unitario: e.target.value})} 
                   disabled={tipoMovimento === 'saida'} 
                   className={`w-full pl-9 pr-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white outline-none text-sm ${tipoMovimento === 'saida' ? 'opacity-50 cursor-not-allowed' : ''}`} 
                 />
               </div>
             </div>
          </div>

          {/* Resumos e Avisos */}
          {tipoMovimento === 'entrada' && total > 0 && (
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl flex justify-between items-center text-sm">
              <span className="text-blue-200">A Pagar:</span>
              <span className="font-bold text-white text-base">R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
          )}
          
          {tipoMovimento === 'saida' && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-sm text-red-200">
              <ArrowDownCircle className="w-4 h-4" />
              <span>Baixa de item para uso interno.</span>
            </div>
          )}

          {/* Campos extras para Entrada */}
          {tipoMovimento === 'entrada' && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Fornecedor</label>
              <div className="relative group">
                <Truck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <select 
                  value={formData.fornecedor_id} 
                  onChange={e => setFormData({...formData, fornecedor_id: e.target.value})} 
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white outline-none text-sm"
                >
                  <option value="">Sem fornecedor</option>
                  {fornecedores.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
                </select>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Data</label>
            <input 
              type="date" 
              value={formData.data_movimentacao} 
              onChange={e => setFormData({...formData, data_movimentacao: e.target.value})} 
              className="w-full pl-4 pr-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white outline-none text-sm [color-scheme:dark]" 
            />
          </div>
        </div>

        {/* Rodapé com Botões */}
        <div className="p-4 border-t border-gray-800 bg-gray-900/95 flex gap-3 shrink-0">
          <button 
            onClick={onFechar} 
            className="flex-1 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800 rounded-xl" 
            disabled={salvando}
          >
            Cancelar
          </button>
          <button 
            onClick={handleSubmit} 
            disabled={salvando} 
            className={`flex-1 px-4 py-2.5 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all ${tipoMovimento === 'entrada' ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/20' : 'bg-red-600 hover:bg-red-500 shadow-red-900/20'}`}
          >
            {salvando ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>} 
            {tipoMovimento === 'entrada' ? 'Confirmar Entrada' : 'Confirmar Baixa'}
          </button>
        </div>
      </div>
    </div>, 
    document.body
  );
};