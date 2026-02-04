import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { X, Save, Target, DollarSign, Calendar, Loader2 } from 'lucide-react';

export const NovaMetaModal = ({ onClose, onRefresh }) => {
  const [loading, setLoading] = useState(false);

  // Oculta o rodapé quando o modal abre
  useEffect(() => {
    document.body.classList.add('modal-open');
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, []);
  const [form, setForm] = useState({
    titulo: '',
    valor_alvo: '',
    data_limite: ''
  });

  const salvarMeta = async (e) => {
    e?.preventDefault();

    if (!form.titulo || !form.valor_alvo || !form.data_limite) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        alert('Usuário não autenticado');
        return;
      }

      const { data: usuario, error: userError } = await supabase
        .from('usuarios')
        .select('salao_id')
        .eq('id', user.id)
        .single();

      if (userError || !usuario?.salao_id) {
        alert('Salão não identificado');
        return;
      }

      const { error } = await supabase.from('metas').insert({
        salao_id: usuario.salao_id,
        titulo: form.titulo.trim(),
        valor_alvo: parseFloat(form.valor_alvo),
        data_limite: form.data_limite
      });

      if (error) throw error;

      onClose();
      onRefresh();
    } catch (err) {
      console.error('Erro ao salvar meta:', err);
      alert('Erro ao cadastrar meta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        className="w-full max-w-md bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl flex flex-col animate-in fade-in slide-in-from-bottom-4"
        style={{ maxHeight: 'min(550px, calc(100vh - 32px))' }}
      >
        
        {/* HEADER FIXO */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-700 shrink-0">
          <h2 className="text-lg sm:text-xl font-bold text-white">Nova Meta</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-700/50 transition-colors"
            type="button"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* CONTEÚDO COM SCROLL */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div className="p-4 sm:p-5 space-y-3">
            
            {/* Título */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Título da Meta <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Target className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Ex: Meta de Faturamento Mensal"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-700/50 border border-gray-600 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none text-sm"
                  value={form.titulo}
                  onChange={e => setForm({ ...form, titulo: e.target.value })}
                  maxLength={100}
                />
              </div>
            </div>

            {/* Valor Alvo */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Valor Alvo (R$) <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="number"
                  placeholder="0,00"
                  step="0.01"
                  min="0"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-700/50 border border-gray-600 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none text-sm"
                  value={form.valor_alvo}
                  onChange={e => setForm({ ...form, valor_alvo: e.target.value })}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1.5">
                Defina o valor que deseja alcançar
              </p>
            </div>

            {/* Data Limite */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Data Limite <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                <input
                  type="date"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-700/50 border border-gray-600 text-white focus:border-purple-500 focus:outline-none text-sm"
                  value={form.data_limite}
                  onChange={e => setForm({ ...form, data_limite: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1.5">
                Prazo para atingir a meta
              </p>
            </div>

            {/* Preview da Meta */}
            {form.titulo && form.valor_alvo && form.data_limite && (
              <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                <h4 className="text-xs font-semibold text-purple-300 mb-2">Preview da Meta</h4>
                <div className="space-y-1 text-xs text-gray-400">
                  <p><strong className="text-white">{form.titulo}</strong></p>
                  <p>Valor: <strong className="text-purple-400">R$ {parseFloat(form.valor_alvo).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></p>
                  <p>Prazo: <strong className="text-purple-400">{new Date(form.data_limite).toLocaleDateString('pt-BR')}</strong></p>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* FOOTER FIXO */}
        <div className="p-4 sm:p-5 border-t border-gray-700 shrink-0">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border-2 border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700/50 font-medium transition-all text-sm"
            >
              Cancelar
            </button>
            <button
              onClick={salvarMeta}
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl text-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  SALVAR
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};