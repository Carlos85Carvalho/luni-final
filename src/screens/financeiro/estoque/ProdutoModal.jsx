// src/screens/financeiro/estoque/ProdutoModal.jsx
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Loader2, Package, DollarSign, Hash, Tag } from 'lucide-react';
import { supabase } from '../../../services/supabase';

export const ProdutoModal = ({ aberto, onFechar, onSucesso, produto }) => {
  const [salvando, setSalvando] = useState(false);
  const [salaoId, setSalaoId] = useState(null);
  const [categorias, setCategorias] = useState([]);

  const [formData, setFormData] = useState({
    nome: '',
    categoria: '',
    custo_unitario: '',
    preco_venda: '',
    estoque_minimo: '5',
    quantidade_atual: '0',
    descricao: ''
  });

  // Inicializar com dados do produto se for edição
  useEffect(() => {
    if (produto) {
      setFormData({
        nome: produto.nome || '',
        categoria: produto.categoria || '',
        custo_unitario: produto.custo_unitario?.toString().replace('.', ',') || '',
        preco_venda: produto.preco_venda?.toString().replace('.', ',') || '',
        estoque_minimo: produto.estoque_minimo?.toString() || '5',
        quantidade_atual: produto.quantidade_atual?.toString() || '0',
        descricao: produto.descricao || ''
      });
    } else {
      // Limpar formulário se for novo produto
      setFormData({
        nome: '',
        categoria: '',
        custo_unitario: '',
        preco_venda: '',
        estoque_minimo: '5',
        quantidade_atual: '0',
        descricao: ''
      });
    }
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
        
        // Buscar categorias existentes para o autocomplete
        const { data: produtos } = await supabase
          .from('produtos')
          .select('categoria')
          .eq('salao_id', usuario.salao_id)
          .not('categoria', 'is', null);

        // Filtra categorias únicas
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
        // Mantém a quantidade atual se for edição, ou 0 se for novo
        quantidade_atual: produto ? (parseInt(formData.quantidade_atual) || 0) : 0,
        descricao: formData.descricao || null,
        ativo: true,
        // Só adiciona data de criação se for novo
        ...(produto ? {} : { data_criacao: new Date().toISOString() })
      };

      if (produto) {
        // Atualizar produto existente
        const { error } = await supabase
          .from('produtos')
          .update(produtoData)
          .eq('id', produto.id);
        if (error) throw error;
      } else {
        // Criar novo produto
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

  if (!aberto) return null;

  const margem = calcularMargem();

  return createPortal(
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
      <div className="bg-gray-900 border border-gray-700 w-full max-w-md rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden relative">
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
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              Nome do Produto*
            </label>
            <div className="relative">
              <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={formData.nome}
                onChange={e => setFormData({...formData, nome: e.target.value})}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white outline-none text-sm"
                placeholder="Ex: Shampoo Revitalizante"
                disabled={salvando}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                Categoria
              </label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <select
                  value={formData.categoria}
                  onChange={e => setFormData({...formData, categoria: e.target.value})}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white outline-none text-sm appearance-none"
                  disabled={salvando}
                >
                  <option value="">Selecionar...</option>
                  <option value="Shampoo">Shampoo</option>
                  <option value="Condicionador">Condicionador</option>
                  <option value="Tratamento">Tratamento</option>
                  <option value="Tintura">Tintura</option>
                  <option value="Creme">Creme</option>
                  <option value="Óleo">Óleo</option>
                  {categorias.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
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
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white outline-none text-sm"
                  placeholder="5"
                  disabled={salvando}
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
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white outline-none text-sm"
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
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white outline-none text-sm"
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
              className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white outline-none text-sm min-h-[80px] resize-none"
              placeholder="Detalhes sobre o produto..."
              disabled={salvando}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-800 bg-gray-900/95 flex gap-3">
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
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg hover:from-blue-600 hover:to-purple-600 transition-all"
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