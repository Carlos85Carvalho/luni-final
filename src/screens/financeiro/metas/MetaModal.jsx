// src/screens/financeiro/metas/MetaModal.jsx
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Loader2, Target, DollarSign, TrendingUp, Receipt, Users, Calendar, ShoppingCart } from 'lucide-react';
import { supabase } from '../../../services/supabase';

export const MetaModal = ({ aberto, onFechar, onSucesso, meta }) => {
  const [salvando, setSalvando] = useState(false);
  const [salaoId, setSalaoId] = useState(null);

  const [formData, setFormData] = useState({
    tipo: 'faturamento',
    titulo: '',
    valor_meta: '',
    periodo: 'Mensal',
    cor: 'purple',
    inverso: false,
    descricao: ''
  });

  // Inicializar com dados da meta se for edição
  useEffect(() => {
    if (meta) {
      setFormData({
        tipo: meta.tipo || 'faturamento',
        titulo: meta.titulo || '',
        valor_meta: meta.valor_meta?.toString().replace('.', ',') || '',
        periodo: meta.periodo || 'Mensal',
        cor: meta.cor || 'purple',
        inverso: meta.inverso || false,
        descricao: meta.descricao || ''
      });
    } else {
      // Limpa o formulário se for nova meta
      setFormData({
        tipo: 'faturamento',
        titulo: '',
        valor_meta: '',
        periodo: 'Mensal',
        cor: 'purple',
        inverso: false,
        descricao: ''
      });
    }
  }, [meta, aberto]);

  useEffect(() => {
    const fetchSalao = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: usuario } = await supabase
        .from('usuarios')
        .select('salao_id')
        .eq('id', user.id)
        .single();

      if (usuario?.salao_id) {
        setSalaoId(usuario.salao_id);
      }
    };

    if (aberto) fetchSalao();
  }, [aberto]);

  const tiposMeta = [
    { value: 'faturamento', label: 'Faturamento', icon: DollarSign, cor: 'green' },
    { value: 'lucro', label: 'Lucro', icon: TrendingUp, cor: 'blue' },
    { value: 'despesas', label: 'Despesas', icon: Receipt, cor: 'orange' },
    { value: 'clientes', label: 'Clientes', icon: Users, cor: 'purple' },
    { value: 'vendas', label: 'Vendas', icon: ShoppingCart, cor: 'red' }
  ];

  const periodos = ['Diário', 'Semanal', 'Mensal', 'Trimestral', 'Semestral', 'Anual'];
  const cores = [
    { value: 'green', label: 'Verde', class: 'bg-green-500' },
    { value: 'blue', label: 'Azul', class: 'bg-blue-500' },
    { value: 'orange', label: 'Laranja', class: 'bg-orange-500' },
    { value: 'purple', label: 'Roxo', class: 'bg-purple-500' },
    { value: 'red', label: 'Vermelho', class: 'bg-red-500' }
  ];

  const parseMoeda = (valor) => {
    if (!valor) return 0;
    const numeroLimpo = valor.toString().replace(/[^0-9.,]/g, '').replace(',', '.');
    return parseFloat(numeroLimpo) || 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!salaoId || !formData.titulo || !formData.valor_meta) {
      return alert("Preencha os campos obrigatórios.");
    }

    setSalvando(true);
    try {
      const valorMeta = parseMoeda(formData.valor_meta);
      
      // Determinar valor atual com base no tipo
      let valorAtual = 0;
      // Nota: Futuramente, buscaríamos esses valores reais do banco de dados
      // Por enquanto, fica 0 ou mantém o valor antigo se for edição (idealmente não sobrescrever valor_atual se for edição)
      
      const metaData = {
        salao_id: salaoId,
        tipo: formData.tipo,
        titulo: formData.titulo,
        valor_meta: valorMeta,
        // valor_atual: Não alteramos aqui para não zerar o progresso real se já existir
        periodo: formData.periodo,
        cor: formData.cor,
        inverso: formData.inverso,
        descricao: formData.descricao || null,
        data_atualizacao: new Date().toISOString()
      };

      if (meta) {
        // Atualizar meta existente
        const { error } = await supabase
          .from('metas')
          .update(metaData)
          .eq('id', meta.id);

        if (error) throw error;
      } else {
        // Criar nova meta
        const { error } = await supabase
          .from('metas')
          .insert([{
            ...metaData,
            valor_atual: valorAtual, // Inicializa com 0
            data_criacao: new Date().toISOString() // Só cria data_criacao aqui
          }]);

        if (error) throw error;
      }

      onSucesso();
      onFechar();
    } catch (error) {
      console.error('Erro ao salvar meta:', error);
      alert('Erro ao salvar meta.');
    } finally {
      setSalvando(false);
    }
  };

  if (!aberto) return null;

  const IconComponent = tiposMeta.find(t => t.value === formData.tipo)?.icon || Target;

  return createPortal(
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
      <div className="bg-gray-900 border border-gray-700 w-full max-w-md rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden relative">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className={`p-2 ${formData.inverso ? 'bg-red-500/20' : 'bg-purple-500/20'} rounded-lg`}>
              <IconComponent className={`w-5 h-5 ${formData.inverso ? 'text-red-400' : 'text-purple-400'}`} />
            </div>
            <h2 className="text-xl font-bold text-white">
              {meta ? 'Editar Meta' : 'Nova Meta'}
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
              Título da Meta*
            </label>
            <input
              type="text"
              value={formData.titulo}
              onChange={e => setFormData({...formData, titulo: e.target.value})}
              className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white outline-none text-sm"
              placeholder="Ex: Meta de Faturamento Mensal"
              disabled={salvando}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              Tipo de Meta
            </label>
            <div className="grid grid-cols-3 gap-2">
              {tiposMeta.map((tipo) => {
                const Icon = tipo.icon;
                const isSelected = formData.tipo === tipo.value;
                return (
                  <button
                    key={tipo.value}
                    type="button"
                    onClick={() => setFormData({...formData, tipo: tipo.value, cor: tipo.cor })}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                      isSelected 
                        ? `border-${tipo.cor}-500 bg-${tipo.cor}-500/10` 
                        : 'border-gray-700 bg-gray-800/30 hover:bg-gray-800/50'
                    }`}
                    disabled={salvando}
                  >
                    <Icon className={`w-4 h-4 ${isSelected ? `text-${tipo.cor}-400` : 'text-gray-400'}`} />
                    <span className={`text-xs ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                      {tipo.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                Valor Meta (R$)*
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={formData.valor_meta}
                  onChange={e => setFormData({...formData, valor_meta: e.target.value})}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white outline-none text-sm"
                  placeholder="0,00"
                  disabled={salvando}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                Período
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <select
                  value={formData.periodo}
                  onChange={e => setFormData({...formData, periodo: e.target.value})}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white outline-none text-sm"
                  disabled={salvando}
                >
                  {periodos.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              Cor da Meta
            </label>
            <div className="flex gap-2">
              {cores.map(cor => (
                <button
                  key={cor.value}
                  type="button"
                  onClick={() => setFormData({...formData, cor: cor.value })}
                  className={`flex-1 p-3 rounded-xl border flex items-center justify-center gap-2 ${
                    formData.cor === cor.value 
                      ? 'border-white ring-2 ring-white/20' 
                      : 'border-gray-700 hover:border-gray-500'
                  }`}
                  disabled={salvando}
                >
                  <div className={`w-4 h-4 rounded-full ${cor.class}`}></div>
                  <span className={`text-xs ${formData.cor === cor.value ? 'text-white' : 'text-gray-400'}`}>
                    {cor.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-800/30 rounded-xl">
            <input
              type="checkbox"
              id="inverso"
              checked={formData.inverso}
              onChange={e => setFormData({...formData, inverso: e.target.checked})}
              className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-red-500 focus:ring-red-500"
              disabled={salvando}
            />
            <label htmlFor="inverso" className="text-sm text-gray-300">
              Meta inversa (limite máximo)
            </label>
            <span className="text-xs text-gray-500 ml-auto">Ex: Limite de despesas</span>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              Descrição
            </label>
            <textarea
              value={formData.descricao}
              onChange={e => setFormData({...formData, descricao: e.target.value})}
              className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white outline-none text-sm min-h-[80px] resize-none"
              placeholder="Detalhes sobre esta meta..."
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
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg hover:from-purple-600 hover:to-pink-600 transition-all"
          >
            {salvando ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {meta ? 'Atualizar Meta' : 'Criar Meta'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};