import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { 
  X, Calendar, Clock, User, Save, Loader2, CheckCircle, CalendarClock 
} from 'lucide-react';

export const RemarcarModal = ({ isOpen, onClose, onSuccess, agendamento }) => {
  const [loading, setLoading] = useState(false);
  const [profissionais, setProfissionais] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const [selectedProfissional, setSelectedProfissional] = useState('');
  const [data, setData] = useState('');
  const [horario, setHorario] = useState('');

  // Regra para esconder o rodapé do App principal enquanto o modal está aberto
  useEffect(() => {
    if (isOpen) {
      const style = document.createElement('style');
      style.id = 'hide-footer-remarcar';
      style.innerHTML = `
        #rodape-principal, .fixed.bottom-0, nav.fixed.bottom-0, footer { 
          display: none !important; 
          opacity: 0 !important;
          pointer-events: none !important;
          z-index: -1 !important;
        }
        body { overflow: hidden !important; }
      `;
      document.head.appendChild(style);

      return () => {
        const existingStyle = document.getElementById('hide-footer-remarcar');
        if (existingStyle) document.head.removeChild(existingStyle);
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);


  useEffect(() => {
    if (isOpen && agendamento) {
      setSelectedProfissional(agendamento.profissional_id || '');
      setData(agendamento.data || '');
      setHorario(agendamento.horario || '');

      const fetchProfs = async () => {
        const { data: profsData, error } = await supabase
          .from('profissionais')
          .select('id, nome')
          .order('nome', { ascending: true });
        
        if (!error) setProfissionais(profsData || []);
      };
      fetchProfs();
    }
  }, [isOpen, agendamento]);

  const handleUpdate = async () => {
    if (!data || !horario || !selectedProfissional) {
      return alert("Preencha a nova data, horário e profissional.");
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('agendamentos')
        .update({
          data,
          horario,
          profissional_id: selectedProfissional,
          status: 'agendado' 
        })
        .eq('id', agendamento.id);

      if (error) throw error;

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        onSuccess(); 
        onClose();
      }, 1000);
    } catch (e) {
      alert("Erro ao remarcar: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !agendamento) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      {/* Container Principal com maxHeight para Mobile */}
      <div className="bg-[#18181b] w-full sm:max-w-sm sm:rounded-3xl rounded-t-3xl border border-white/10 shadow-2xl relative animate-in slide-in-from-bottom-10 duration-300 flex flex-col" style={{ maxHeight: '90dvh' }}>
        
        {showSuccess && (
          <div className="absolute inset-0 bg-[#18181b] z-50 flex flex-col items-center justify-center rounded-3xl">
            <CheckCircle size={50} className="text-green-500 mb-2" />
            <p className="text-white font-bold">Horário alterado!</p>
          </div>
        )}

        {/* CABEÇALHO FIXO */}
        <div className="p-6 pb-4 border-b border-white/5 flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-500/20 rounded-xl text-purple-400">
              <CalendarClock size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Reagendar</h2>
              <p className="text-[10px] text-gray-500 truncate max-w-[150px] uppercase font-bold tracking-wider">
                {agendamento.cliente_nome}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-white transition-colors rounded-lg hover:bg-white/5">
            <X size={20}/>
          </button>
        </div>

        {/* CORPO COM ROLAGEM */}
        <div className="overflow-y-auto flex-1 p-6 space-y-5 custom-scrollbar min-h-0">
          
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Trocar Profissional (Opcional)</label>
            <div className="relative">
              <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 z-10"/>
              <select 
                value={selectedProfissional}
                onChange={e => setSelectedProfissional(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-xl p-3.5 pl-11 text-white outline-none focus:border-purple-500 transition-all appearance-none relative"
              >
                {profissionais.map(p => (
                  <option key={p.id} value={p.id} className="bg-[#18181b] text-white">{p.nome}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Nova Data</label>
              <input 
                type="date" 
                value={data}
                onChange={e => setData(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-xl p-3.5 text-white [color-scheme:dark] outline-none focus:border-purple-500 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Novo Horário</label>
              <input 
                type="time" 
                value={horario}
                onChange={e => setHorario(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-xl p-3.5 text-white [color-scheme:dark] outline-none focus:border-purple-500 transition-all"
              />
            </div>
          </div>

          <div className="bg-purple-500/5 border border-purple-500/10 rounded-xl p-3">
             <p className="text-[10px] text-purple-300/70 text-center">
               O valor de <strong>R$ {parseFloat(agendamento.valor_total || agendamento.valor || 0).toFixed(2)}</strong> será mantido.
             </p>
          </div>
        </div>

        {/* RODAPÉ FIXO COM O BOTÃO SALVAR */}
        <div className="p-6 pt-4 border-t border-white/5 flex-shrink-0 bg-[#18181b] rounded-b-3xl">
          <button 
            onClick={handleUpdate}
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-[#5B2EFF] to-[#7C3EFF] rounded-2xl font-bold text-white shadow-lg shadow-purple-900/20 active:scale-95 transition-all flex justify-center items-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={20}/> : <><Save size={20}/> Salvar Alteração</>}
          </button>
        </div>

      </div>
    </div>
  );
};