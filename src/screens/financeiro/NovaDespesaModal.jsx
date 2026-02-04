import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { X, Save, Loader2 } from 'lucide-react';

export const NovaMetaModal = ({ onClose, onRefresh }) => {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    titulo: '',
    valor_alvo: '',
    data_limite: ''
  });

  // Oculta rodapé quando modal abre
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const footer = document.querySelector('footer, nav, [class*="bottom-0"], [class*="fixed bottom"]');
    if (footer) {
      footer.style.display = 'none';
    }
    
    return () => {
      document.body.style.overflow = '';
      if (footer) {
        footer.style.display = '';
      }
    };
  }, []);

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
      <div className="w-full max-w-lg bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* HEADER */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800/50">
          <h2 className="text-lg font-bold text-white">Nova Meta</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-700/50 transition-colors"
            type="button"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* FORM */}
        <div className="p-4 space-y-3">
          
          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Título da Meta <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              placeholder="Ex: Meta de Faturamento Mensal"
              className="w-full px-3 py-2 rounded-lg bg-gray-700/50 border border-gray-600 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none text-sm"
              value={form.titulo}
              onChange={e => setForm({ ...form, titulo: e.target.value })}
              maxLength={100}
            />
          </div>

          {/* Valor Alvo */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Valor Alvo (R$) <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              placeholder="0,00"
              step="0.01"
              min="0"
              className="w-full px-3 py-2 rounded-lg bg-gray-700/50 border border-gray-600 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none text-sm"
              value={form.valor_alvo}
              onChange={e => setForm({ ...form, valor_alvo: e.target.value })}
            />
            <p className="text-xs text-gray-500 mt-1">
              Defina o valor que deseja alcançar
            </p>
          </div>

          {/* Data Limite */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Data Limite <span className="text-red-400">*</span>
            </label>
            <input
              type="date"
              className="w-full px-3 py-2 rounded-lg bg-gray-700/50 border border-gray-600 text-white focus:border-purple-500 focus:outline-none text-sm"
              value={form.data_limite}
              onChange={e => setForm({ ...form, data_limite: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
            />
            <p className="text-xs text-gray-500 mt-1">
              Prazo para atingir a meta
            </p>
          </div>

          {/* Preview */}
          {form.titulo && form.valor_alvo && form.data_limite && (
            <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
              <h4 className="text-xs font-semibold text-purple-300 mb-1.5">Preview da Meta</h4>
              <div className="space-y-1 text-xs text-gray-400">
                <p><strong className="text-white">{form.titulo}</strong></p>
                <p>Valor: <strong className="text-purple-400">R$ {parseFloat(form.valor_alvo).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></p>
                <p>Prazo: <strong className="text-purple-400">{new Date(form.data_limite).toLocaleDateString('pt-BR')}</strong></p>
              </div>
            </div>
          )}

        </div>

        {/* FOOTER */}
        <div className="p-4 border-t border-gray-700 bg-gray-800/50 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700/50 font-medium transition-all text-sm"
          >
            Cancelar
          </button>
          <button
            onClick={salvarMeta}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
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
  );
};