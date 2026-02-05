import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Loader2, Package, Tag, DollarSign, Layers, AlertTriangle, FileText } from 'lucide-react';
import { supabase } from '../../services/supabase';

export const ProdutoModal = ({ aberto, onFechar, onSucesso, produto }) => {
  const [salvando, setSalvando] = useState(false);
  const [salaoId, setSalaoId] = useState(null);

  // Categorias sugeridas
  const categorias = [
    'Cabelo', 'Unhas', 'Estética', 'Barba', 'Sobrancelha', 
    'Massagem', 'Depilação', 'Maquiagem', 'Perfumaria', 'Outros'
  ];

  const [formData, setFormData] = useState({
    nome: '',
    categoria: '',
    custo: '',
    preco_venda: '',
    estoque_minimo: '10',
    ativo: true,
    observacoes: '' // Adicionado caso sua tabela suporte, senão será ignorado se não enviado
  });

  // 1. Buscar ID do Salão
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

  // 2. Preencher formulário ao editar
  useEffect(() => {
    if (produto) {
      setFormData({
        nome: produto.nome || '',
        categoria: produto.categoria || '',
        custo: produto.custo_unitario ? produto.custo_unitario.toString() : '',
        preco_venda: produto.preco_venda ? produto.preco_venda.toString() : '',
        estoque_minimo: produto.estoque_minimo ? produto.estoque_minimo.toString() : '10',
        ativo: produto.ativo !== false,
        observacoes: produto.observacoes || ''
      });
    } else {
      setFormData({
        nome: '',
        categoria: '',
        custo: '',
        preco_venda: '',
        estoque_minimo: '10',
        ativo: true,
        observacoes: ''
      });
    }
  }, [produto, aberto]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!salaoId) return alert("Erro: Salão não identificado.");
    if (!formData.nome || !formData.custo || !formData.preco_venda || !formData.estoque_minimo) {
      return alert("Preencha todos os campos obrigatórios (*).");
    }

    setSalvando(true);
    try {
      const payload = {
        salao_id: salaoId,
        nome: formData.nome,
        categoria: formData.categoria || null,
        custo_unitario: parseFloat(formData.custo.replace(',', '.')),
        preco_venda: parseFloat(formData.preco_venda.replace(',', '.')),
        estoque_minimo: parseInt(formData.estoque_minimo),
        ativo: formData.ativo,
        // Se estiver editando, mantém a quantidade, senão 0
        quantidade_atual: produto ? produto.quantidade_atual : 0
        // observacoes: formData.observacoes // Descomente se tiver coluna observacoes na tabela produtos
      };

      if (produto?.id) {
        await supabase.from('produtos').update(payload).eq('id', produto.id);
      } else {
        await supabase.from('produtos').insert([payload]);
      }
      onSucesso();
      onFechar();
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao salvar produto.');
    } finally {
      setSalvando(false);
    }
  };

  const calcularMargem = () => {
    const custo = parseFloat(formData.custo.replace(',', '.')) || 0;
    const venda = parseFloat(formData.preco_venda.replace(',', '.')) || 0;
    if (custo === 0 || venda === 0) return 0;
    return ((venda - custo) / custo) * 100;
  };

  const margem = calcularMargem();

  if (!aberto) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
      
      {/* Container Principal */}
      <div className="bg-gray-900 border border-gray-700 w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden relative">
        
        {/* Cabeçalho */}
        <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between bg-gray-900/95 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Package className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white leading-tight">
                {produto ? 'Editar Produto' : 'Novo Produto'}
              </h3>
              <p className="text-xs text-gray-400">Cadastre itens para venda ou consumo</p>
            </div>
          </div>
          <button 
            onClick={onFechar} 
            className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo com Scroll */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
          
          {/* Nome do Produto */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Nome do Produto*</label>
            <div className="relative group">
              <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-purple-500 transition-colors" />
              <input
                type="text"
                autoFocus
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all outline-none placeholder-gray-600 text-sm"
                placeholder="Ex: Shampoo Hidratante"
              />
            </div>
          </div>

          {/* Categoria */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Categoria</label>
            <div className="relative group">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-purple-500 transition-colors" />
              <input
                type="text"
                list="categorias-list"
                value={formData.categoria}
                onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all outline-none placeholder-gray-600 text-sm"
                placeholder="Ex: Cabelo, Unha, Estética"
              />
              <datalist id="categorias-list">
                {categorias.map((cat) => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Custo */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Custo (R$)*</label>
              <div className="relative group">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-purple-500 transition-colors" />
                <input
                  type="number"
                  step="0.01"
                  value={formData.custo}
                  onChange={(e) => setFormData({ ...formData, custo: e.target.value })}
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all outline-none placeholder-gray-600 text-sm"
                  placeholder="0,00"
                />
              </div>
            </div>

            {/* Preço Venda */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Preço Venda (R$)*</label>
              <div className="relative group">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500 group-focus-within:text-green-400 transition-colors" />
                <input
                  type="number"
                  step="0.01"
                  value={formData.preco_venda}
                  onChange={(e) => setFormData({ ...formData, preco_venda: e.target.value })}
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all outline-none placeholder-gray-600 text-sm"
                  placeholder="0,00"
                />
              </div>
            </div>
          </div>

          {/* Feedback de Margem */}
          {margem > 0 && (
            <div className={`text-xs px-3 py-2 rounded-lg flex justify-between items-center ${margem >= 50 ? 'bg-green-500/10 text-green-400' : margem >= 30 ? 'bg-yellow-500/10 text-yellow-400' : 'bg-red-500/10 text-red-400'}`}>
              <span>Margem estimada:</span>
              <span className="font-bold">{margem.toFixed(1)}%</span>
            </div>
          )}

          {/* Estoque Mínimo */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Estoque Mínimo*</label>
            <div className="relative group">
              <AlertTriangle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-purple-500 transition-colors" />
              <input
                type="number"
                min="0"
                value={formData.estoque_minimo}
                onChange={(e) => setFormData({ ...formData, estoque_minimo: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all outline-none placeholder-gray-600 text-sm"
              />
            </div>
            <p className="text-[10px] text-gray-500 pl-1">Quantidade mínima para receber alerta de reposição.</p>
          </div>

          {/* Produto Ativo */}
          <div 
            onClick={() => setFormData(prev => ({ ...prev, ativo: !prev.ativo }))}
            className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
              formData.ativo 
                ? 'bg-purple-500/10 border-purple-500/50' 
                : 'bg-gray-800/50 border-gray-700 hover:bg-gray-800'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                formData.ativo 
                  ? 'bg-purple-500 border-purple-500' 
                  : 'border-gray-500 bg-transparent'
              }`}>
                {formData.ativo && <Package className="w-3.5 h-3.5 text-white" />}
              </div>
              <div className="flex flex-col">
                <span className={`text-sm font-medium ${formData.ativo ? 'text-purple-400' : 'text-gray-300'}`}>
                  Produto Ativo
                </span>
                <span className="text-[10px] text-gray-500">Disponível para uso e venda</span>
              </div>
            </div>
          </div>

        </div>

        {/* Rodapé */}
        <div className="p-4 border-t border-gray-800 bg-gray-900/95 flex gap-3 shrink-0">
          <button
            onClick={onFechar}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-300 hover:bg-gray-800 rounded-xl transition-colors border border-transparent hover:border-gray-700"
            disabled={salvando}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={salvando}
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-purple-900/20 disabled:opacity-50 transition-all hover:scale-[1.02]"
          >
            {salvando ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Salvar Produto
              </>
            )}
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};