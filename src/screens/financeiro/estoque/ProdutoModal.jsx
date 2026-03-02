// src/screens/financeiro/estoque/ProdutoModal.jsx
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Loader2, Package, DollarSign, Hash, Tag, Scale, ShoppingBag } from 'lucide-react';
import { supabase } from '../../../services/supabase';

export const ProdutoModal = ({ aberto, onFechar, onSucesso, produto }) => {
  const [salvando, setSalvando] = useState(false);
  const [salaoId, setSalaoId] = useState(null);
  const [categorias, setCategorias] = useState([]);
  
  // Controle se o usuário quer digitar uma categoria nova
  const [isNovaCategoria, setIsNovaCategoria] = useState(false);

  const [formData, setFormData] = useState({
    nome: '',
    categoria: '',
    custo_unitario: '',
    preco_venda: '',
    estoque_minimo: '5',
    quantidade_atual: '0',
    descricao: '',
    capacidade_medida: '1', 
    unidade_medida: 'un',
    exibir_pdv: false // 🚀 NOVO CAMPO: Define se o produto vai pra vitrine do PDV
  });

  useEffect(() => {
    if (produto) {
      setFormData({
        nome: produto.nome || '',
        categoria: produto.categoria || '',
        custo_unitario: produto.custo_unitario?.toString().replace('.', ',') || '',
        preco_venda: produto.preco_venda?.toString().replace('.', ',') || '',
        estoque_minimo: produto.estoque_minimo?.toString() || '5',
        quantidade_atual: produto.quantidade_atual?.toString() || '0',
        descricao: produto.descricao || '',
        capacidade_medida: produto.capacidade_medida?.toString() || '1',
        unidade_medida: produto.unidade_medida || 'un',
        exibir_pdv: produto.exibir_pdv ?? false // 🚀 Puxa do banco se existir, se não, false
      });
    } else {
      setFormData({
        nome: '',
        categoria: '',
        custo_unitario: '',
        preco_venda: '',
        estoque_minimo: '5',
        quantidade_atual: '0',
        descricao: '',
        capacidade_medida: '1',
        unidade_medida: 'un',
        exibir_pdv: false // Por padrão, não vai pro PDV (ideal para químicas)
      });
    }
    // Sempre reseta o modo de "nova categoria" ao abrir a tela
    setIsNovaCategoria(false);
  }, [produto, aberto]);

  useEffect(() => {
    const fetchDados = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: usuario } = await supabase
        .from('usuarios')
        .select('salao_id')
        .eq('id', user.id)
        .single();

      if (usuario?.salao_id) {
        setSalaoId(usuario.salao_id);
        
        const { data: produtos } = await supabase
          .from('produtos')
          .select('categoria')
          .eq('salao_id', usuario.salao_id)
          .not('categoria', 'is', null);

        const categoriasUnicas = [...new Set(produtos?.map(p => p.categoria).filter(Boolean))];
        setCategorias(categoriasUnicas);
      }
    };

    if (aberto) fetchDados();
  }, [aberto]);

  const parseMoeda = (valor) => {
    if (!valor) return 0;
    const numeroLimpo = valor.toString().replace(/[^0-9.,]/g, '').replace(',', '.');
    return parseFloat(numeroLimpo) || 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!salaoId || !formData.nome || !formData.custo_unitario || !formData.preco_venda) {
      return alert("Preencha os campos obrigatórios.");
    }

    setSalvando(true);
    try {
      const produtoData = {
        salao_id: salaoId,
        nome: formData.nome,
        categoria: formData.categoria || 'Geral',
        custo_unitario: parseMoeda(formData.custo_unitario),
        preco_venda: parseMoeda(formData.preco_venda),
        estoque_minimo: parseInt(formData.estoque_minimo) || 5,
        quantidade_atual: produto ? (parseFloat(formData.quantidade_atual) || 0) : 0,
        descricao: formData.descricao || null,
        ativo: true,
        capacidade_medida: parseFloat(formData.capacidade_medida) || 1,
        unidade_medida: formData.unidade_medida,
        exibir_pdv: formData.exibir_pdv, // 🚀 SALVA O INTERRUPTOR NO BANCO
        ...(produto ? {} : { data_criacao: new Date().toISOString() })
      };

      if (produto) {
        const { error } = await supabase
          .from('produtos')
          .update(produtoData)
          .eq('id', produto.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('produtos')
          .insert([produtoData]);
        if (error) throw error;
      }

      onSucesso();
      onFechar();
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      alert('Erro ao salvar produto.');
    } finally {
      setSalvando(false);
    }
  };

  const calcularMargem = () => {
    const custo = parseMoeda(formData.custo_unitario);
    const venda = parseMoeda(formData.preco_venda);
    if (!custo || !venda || custo === 0) return 0;
    return ((venda - custo) / custo * 100).toFixed(1);
  };

  const handleCategoriaChange = (e) => {
    if (e.target.value === 'nova_categoria') {
      setIsNovaCategoria(true);
      setFormData({ ...formData, categoria: '' });
    } else {
      setFormData({ ...formData, categoria: e.target.value });
    }
  };

  if (!aberto) return null;

  const margem = calcularMargem();
  
  const categoriasBase = ['Shampoo', 'Condicionador', 'Tratamento', 'Tintura', 'Creme', 'Óleo'];
  const listaCategoriasFinal = [...new Set([...categoriasBase, ...categorias])].sort();

  return createPortal(
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
      <div className="bg-gray-900 border border-gray-700 w-full max-w-md rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden relative">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Package className="w-5 h-5 text-blue-400" />
            </div>
            <h2 className="text-xl font-bold text-white">
              {produto ? 'Editar Produto' : 'Novo Produto'}
            </h2>
          </div>
          <button
            onClick={onFechar}
            className="p-2 hover:bg-gray-800/50 rounded-lg transition-colors"
            disabled={salvando}
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          
          {/* 🚀 O INTERRUPTOR DO PDV VAI AQUI, EM DESTAQUE! */}
          <div 
            className="bg-gray-800/40 border border-purple-500/20 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-gray-800/60 transition-colors"
            onClick={() => setFormData({...formData, exibir_pdv: !formData.exibir_pdv})}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${formData.exibir_pdv ? 'bg-purple-500/20 text-purple-400' : 'bg-gray-800 text-gray-500'}`}>
                <ShoppingBag size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Vender no PDV (Vitrine)</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Ative apenas para produtos de Revenda (Home Care)</p>
              </div>
            </div>
            
            {/* Toggle Switch Visual */}
            <div className={`w-11 h-6 rounded-full transition-colors relative ${formData.exibir_pdv ? 'bg-purple-600' : 'bg-gray-700'}`}>
              <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${formData.exibir_pdv ? 'left-6' : 'left-1'}`} />
            </div>
          </div>

          <div className="space-y-1.5 pt-2">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              Nome do Produto*
            </label>
            <div className="relative">
              <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={formData.nome}
                onChange={e => setFormData({...formData, nome: e.target.value})}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white outline-none text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                placeholder="Ex: Shampoo Revitalizante"
                disabled={salvando}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* CAMPO DE CATEGORIA INTELIGENTE */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                Categoria
              </label>
              <div className="relative flex gap-2">
                {!isNovaCategoria ? (
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <select
                      value={formData.categoria}
                      onChange={handleCategoriaChange}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white outline-none text-sm appearance-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all cursor-pointer"
                      disabled={salvando}
                    >
                      <option value="">Selecionar...</option>
                      {listaCategoriasFinal.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                      <option value="nova_categoria" className="text-purple-400 font-bold bg-gray-800">➕ Adicionar nova...</option>
                    </select>
                  </div>
                ) : (
                  <div className="relative flex-1 flex items-center gap-2 animate-in slide-in-from-right-2 duration-200">
                    <div className="relative flex-1">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500" />
                      <input
                        type="text"
                        value={formData.categoria}
                        onChange={e => setFormData({...formData, categoria: e.target.value})}
                        placeholder="Digite a categoria..."
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-purple-500/50 rounded-xl text-white outline-none text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all shadow-[0_0_10px_rgba(168,85,247,0.1)]"
                        autoFocus
                        disabled={salvando}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => { setIsNovaCategoria(false); setFormData({...formData, categoria: ''}); }}
                      className="p-2.5 bg-gray-800 border border-gray-700 rounded-xl hover:bg-gray-700 transition-colors"
                      title="Voltar para a lista"
                    >
                      <X className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                Estoque Mínimo
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="number"
                  min="1"
                  value={formData.estoque_minimo}
                  onChange={e => setFormData({...formData, estoque_minimo: e.target.value})}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white outline-none text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                  placeholder="5"
                  disabled={salvando}
                />
              </div>
            </div>
          </div>

          {/* SEÇÃO: UNIDADE E CAPACIDADE */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider" title="Como este produto é fracionado no salão?">
                Unidade de Medida
              </label>
              <div className="relative">
                <Scale className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <select
                  value={formData.unidade_medida}
                  onChange={e => setFormData({...formData, unidade_medida: e.target.value})}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white outline-none text-sm appearance-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all cursor-pointer"
                  disabled={salvando}
                >
                  <option value="un">Inteiro (Unidades)</option>
                  <option value="g">Peso (Gramas)</option>
                  <option value="ml">Líquido (Mililitros)</option>
                  <option value="app">Por Aplicação (Rendimento)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider" title="Qual o tamanho ou rendimento de 1 tubo/frasco?">
                {formData.unidade_medida === 'g' ? 'Peso do Tubo (g)' : 
                 formData.unidade_medida === 'ml' ? 'Volume do Frasco (ml)' : 
                 formData.unidade_medida === 'app' ? 'Rende Quantas Mãos?' : 
                 'Qtd. da Embalagem'}
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="number"
                  min="1"
                  step="0.1"
                  value={formData.capacidade_medida}
                  onChange={e => setFormData({...formData, capacidade_medida: e.target.value})}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white outline-none text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                  placeholder="Ex: 60"
                  disabled={salvando || formData.unidade_medida === 'un'}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                Custo (R$)*
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={formData.custo_unitario}
                  onChange={e => setFormData({...formData, custo_unitario: e.target.value})}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white outline-none text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                  placeholder="0,00"
                  disabled={salvando}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                Preço Venda (R$)*
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={formData.preco_venda}
                  onChange={e => setFormData({...formData, preco_venda: e.target.value})}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white outline-none text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                  placeholder="0,00"
                  disabled={salvando}
                />
              </div>
            </div>
          </div>

          {/* Margem Calculada */}
          {formData.custo_unitario && formData.preco_venda && (
            <div className={`p-3 rounded-xl ${
              parseFloat(margem) >= 50 ? 'bg-green-500/10 border border-green-500/20' :
              parseFloat(margem) >= 30 ? 'bg-yellow-500/10 border border-yellow-500/20' :
              'bg-red-500/10 border border-red-500/20'
            }`}>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-300">Margem:</span>
                <span className={`font-bold text-lg ${
                  parseFloat(margem) >= 50 ? 'text-green-400' :
                  parseFloat(margem) >= 30 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {margem}%
                </span>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              Descrição
            </label>
            <textarea
              value={formData.descricao}
              onChange={e => setFormData({...formData, descricao: e.target.value})}
              className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white outline-none text-sm min-h-[80px] resize-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
              placeholder="Detalhes sobre o produto..."
              disabled={salvando}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-800 bg-gray-900/95 flex gap-3 shrink-0">
          <button
            onClick={onFechar}
            className="flex-1 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800 rounded-xl transition-colors"
            disabled={salvando}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={salvando}
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg hover:from-blue-600 hover:to-purple-600 transition-all active:scale-95"
          >
            {salvando ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {produto ? 'Atualizar' : 'Criar Produto'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};