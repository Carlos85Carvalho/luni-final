import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Loader2, Target, DollarSign, TrendingUp, Receipt, Calendar, FileText, BarChart3 } from 'lucide-react';
import { supabase } from '../../services/supabase';

export const MetaModal = ({ aberto, onFechar, onSucesso, meta }) => {
  const [salvando, setSalvando] = useState(false);
  const [salaoId, setSalaoId] = useState(null);

  const tiposMeta = [
    { id: 'faturamento', label: 'Faturamento', icon: DollarSign, cor: 'green' },
    { id: 'lucro', label: 'Lucro Líquido', icon: TrendingUp, cor: 'blue' },
    { id: 'despesas', label: 'Limite Despesas', icon: Receipt, cor: 'orange' },
    { id: 'vendas', label: 'Total Vendas', icon: Target, cor: 'purple' }
  ];

  const periodos = ['Mensal', 'Semanal', 'Diário', 'Trimestral', 'Anual'];

  const [formData, setFormData] = useState({
    titulo: '',
    tipo: 'faturamento',
    valor_meta: '',
    periodo: 'Mensal',
    data_inicio: new Date().toISOString().split('T')[0],
    data_fim: '',
    descricao: ''
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

  // 2. Preencher formulário (Edição ou Nova)
  useEffect(() => {
    if (meta) {
      // Modo Edição
      setFormData({
        titulo: meta.titulo || '',
        tipo: meta.tipo || 'faturamento',
        valor_meta: meta.valor_meta?.toString() || '',
        periodo: meta.periodo || 'Mensal',
        data_inicio: meta.data_inicio || new Date().toISOString().split('T')[0],
        data_fim: meta.data_fim || '',
        descricao: meta.descricao || ''
      });
    } else {
      // Modo Criação: Calcular data fim sugerida
      const hoje = new Date();
      let dataFim = new Date(hoje);
      
      switch(formData.periodo) {
        case 'Diário': dataFim.setDate(hoje.getDate() + 1); break;
        case 'Semanal': dataFim.setDate(hoje.getDate() + 7); break;
        case 'Mensal': dataFim.setMonth(hoje.getMonth() + 1); break;
        case 'Trimestral': dataFim.setMonth(hoje.getMonth() + 3); break;
        case 'Anual': dataFim.setFullYear(hoje.getFullYear() + 1); break;
        default: dataFim.setMonth(hoje.getMonth() + 1);
      }
      
      setFormData(prev => ({
        ...prev,
        // Só atualiza se não estiver editando
        data_fim: meta ? prev.data_fim : dataFim.toISOString().split('T')[0]
      }));
    }
  }, [meta, formData.periodo, aberto]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!salaoId) return alert("Erro: Salão não identificado.");
    if (!formData.titulo || !formData.valor_meta) return alert("Preencha o título e o valor da meta.");

    setSalvando(true);
    try {
      const payload = {
        salao_id: salaoId,
        titulo: formData.titulo,
        tipo: formData.tipo,
        valor_meta: parseFloat(formData.valor_meta.replace(',', '.')),
        periodo: formData.periodo,
        data_inicio: formData.data_inicio,
        data_fim: formData.data_fim,
        descricao: formData.descricao || null,
        // Se for edição, mantém o valor atual, senão inicia zerado
        valor_atual: meta ? meta.valor_atual : 0,
        atingida: meta ? meta.atingida : false
      };

      if (meta?.id) {
        await supabase.from('metas').update(payload).eq('id', meta.id);
      } else {
        await supabase.from('metas').insert([payload]);
      }

      onSucesso();
      onFechar();
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao salvar meta.');
    } finally {
      setSalvando(false);
    }
  };

  const tipoSelecionado = tiposMeta.find(t => t.id === formData.tipo);
  const IconeTipo = tipoSelecionado?.icon || Target;

  if (!aberto) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
      
      {/* Container Principal */}
      <div className="bg-gray-900 border border-gray-700 w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden relative">
        
        {/* Cabeçalho */}
        <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between bg-gray-900/95 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-${tipoSelecionado?.cor || 'green'}-500/10`}>
              <IconeTipo className={`w-5 h-5 text-${tipoSelecionado?.cor || 'green'}-500`} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white leading-tight">
                {meta ? 'Editar Meta' : 'Nova Meta'}
              </h3>
              <p className="text-xs text-gray-400">Defina objetivos para seu salão</p>
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
        <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
          
          {/* Seleção de Tipo */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Tipo de Meta</label>
            <div className="grid grid-cols-2 gap-2">
              {tiposMeta.map(tipo => {
                const Icon = tipo.icon;
                const ativo = formData.tipo === tipo.id;
                return (
                  <button
                    key={tipo.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, tipo: tipo.id })}
                    className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
                      ativo 
                        ? `border-${tipo.cor}-500 bg-${tipo.cor}-500/10` 
                        : 'border-gray-700 bg-gray-800/50 hover:bg-gray-800'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${ativo ? `text-${tipo.cor}-400` : 'text-gray-400'}`} />
                    <span className={`text-sm font-medium ${ativo ? 'text-white' : 'text-gray-300'}`}>
                      {tipo.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Título */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Título da Meta*</label>
            <div className="relative group">
              <Target className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-white transition-colors" />
              <input
                type="text"
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:border-white focus:ring-0 transition-all outline-none placeholder-gray-600 text-sm"
                placeholder="Ex: Faturamento Janeiro"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Valor Meta */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Valor Alvo (R$)*</label>
              <div className="relative group">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-white transition-colors" />
                <input
                  type="number"
                  step="0.01"
                  value={formData.valor_meta}
                  onChange={(e) => setFormData({ ...formData, valor_meta: e.target.value })}
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:border-white focus:ring-0 transition-all outline-none placeholder-gray-600 text-sm"
                  placeholder="0,00"
                />
              </div>
            </div>

            {/* Período */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Recorrência</label>
              <div className="relative group">
                <BarChart3 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-white transition-colors" />
                <select
                  value={formData.periodo}
                  onChange={(e) => setFormData({ ...formData, periodo: e.target.value })}
                  className="w-full pl-10 pr-2 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:border-white focus:ring-0 transition-all outline-none appearance-none text-sm"
                >
                  {periodos.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Data Início */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Início</label>
              <div className="relative group">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-white transition-colors" />
                <input
                  type="date"
                  value={formData.data_inicio}
                  onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                  className="w-full pl-10 pr-2 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:border-white focus:ring-0 transition-all outline-none text-sm [color-scheme:dark]"
                />
              </div>
            </div>

            {/* Data Fim */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Fim (Previsão)</label>
              <div className="relative group">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-white transition-colors" />
                <input
                  type="date"
                  value={formData.data_fim}
                  onChange={(e) => setFormData({ ...formData, data_fim: e.target.value })}
                  className="w-full pl-10 pr-2 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:border-white focus:ring-0 transition-all outline-none text-sm [color-scheme:dark]"
                />
              </div>
            </div>
          </div>

          {/* Descrição */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Descrição</label>
            <div className="relative group">
              <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-500 group-focus-within:text-white transition-colors" />
              <textarea
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:border-white focus:ring-0 transition-all outline-none text-sm h-20 resize-none placeholder-gray-600"
                placeholder="Objetivo da meta..."
              />
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
            className={`flex-1 px-4 py-2.5 bg-gradient-to-r from-${tipoSelecionado?.cor || 'green'}-600 to-${tipoSelecionado?.cor || 'green'}-500 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 transition-all hover:scale-[1.02]`}
          >
            {salvando ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Salvar Meta
              </>
            )}
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};