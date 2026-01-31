import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { 
  X, Calendar, Clock, User, Scissors, DollarSign, Lock, Save, Loader2, CheckCircle
} from 'lucide-react';

export const NovoAgendamentoModal = ({ isOpen, onClose, onSuccess, profissionalId, tipo = 'agendamento' }) => {
  const [loading, setLoading] = useState(false);
  const [profissionais, setProfissionais] = useState([]);
  const [salaoId, setSalaoId] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const [selectedProfissional, setSelectedProfissional] = useState(profissionalId || '');
  const [clienteNome, setClienteNome] = useState('');
  const [clienteTelefone, setClienteTelefone] = useState('');
  const [data, setData] = useState('');
  const [horario, setHorario] = useState('');
  const [servico, setServico] = useState('');
  const [valor, setValor] = useState('');
  const [bloqueioMotivo, setBloqueioMotivo] = useState('');

  const isBloqueio = tipo === 'bloqueio';

  useEffect(() => {
    if (isOpen) {
      const carregarDadosIniciais = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: usu } = await supabase
            .from('usuarios')
            .select('salao_id')
            .eq('id', user.id)
            .maybeSingle();
          if (usu) setSalaoId(usu.salao_id);
        }

        if (!profissionalId) {
          const { data } = await supabase.from('profissionais').select('*');
          setProfissionais(data || []);
        } else {
          setSelectedProfissional(profissionalId);
        }
      };

      carregarDadosIniciais();
      
      // Correção da Data: Usar toLocaleDateString com 'en-CA' para YYYY-MM-DD local
      const hojeLocal = new Date().toLocaleDateString('en-CA');
      setData(hojeLocal);
      setHorario('09:00');
    }
  }, [isOpen, profissionalId]);

  const handleSubmit = async () => {
    if (!selectedProfissional || !data) return alert("Preencha profissional e data");
    if (!salaoId) return alert("Erro ao identificar o salão. Tente deslogar e logar novamente.");

    setLoading(true);
    try {
        const dados = {
            salao_id: salaoId,
            profissional_id: selectedProfissional,
            cliente_nome: isBloqueio ? `BLOQUEIO: ${bloqueioMotivo}` : clienteNome,
            telefone: clienteTelefone?.replace(/\D/g, ''),
            data,
            horario,
            servico: isBloqueio ? 'Bloqueio' : servico,
            valor: parseFloat(valor || 0),
            valor_total: parseFloat(valor || 0),
            status: isBloqueio ? 'bloqueado' : 'agendado'
        };

        const { error } = await supabase.from('agendamentos').insert([dados]);
        if (error) throw error;
        
        setShowSuccess(true);
        setTimeout(() => { 
          setShowSuccess(false); 
          onSuccess(); 
          onClose(); 
          // Reset fields
          setClienteNome('');
          setClienteTelefone('');
          setServico('');
          setValor('');
          setBloqueioMotivo('');
        }, 1000);
    } catch (e) { 
      alert("Erro ao salvar: " + e.message); 
    } finally { 
      setLoading(false); 
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      {/* Container com altura máxima e scroll inteligente */}
      <div className="bg-[#18181b] w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl border border-white/10 shadow-2xl relative max-h-[95vh] sm:max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-4 duration-300">
        
        {/* Success Overlay */}
        {showSuccess && (
          <div className="absolute inset-0 bg-[#18181b] z-50 flex flex-col items-center justify-center rounded-3xl animate-in fade-in">
            <CheckCircle size={60} className="text-green-500 mb-2" />
            <p className="text-white font-bold">Salvo com sucesso!</p>
          </div>
        )}

        {/* Header Fixo */}
        <div className="flex justify-between items-center p-6 pb-4 border-b border-white/5 flex-shrink-0">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            {isBloqueio ? <Lock className="text-orange-500" size={20}/> : <Calendar className="text-[#5B2EFF]" size={20}/>}
            {isBloqueio ? 'Bloquear Horário' : 'Novo Agendamento'}
          </h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-white p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <X size={20}/>
          </button>
        </div>

        {/* Conteúdo Scrollável (Formulário) */}
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4 custom-scrollbar">
          {!profissionalId && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Profissional</label>
              <select 
                value={selectedProfissional} 
                onChange={e => setSelectedProfissional(e.target.value)} 
                className="w-full bg-black/20 border border-white/10 rounded-xl p-3.5 text-white outline-none focus:border-[#5B2EFF] transition-all appearance-none"
              >
                <option value="">Selecionar Profissional</option>
                {profissionais.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </div>
          )}

          {!isBloqueio ? (
            <>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Cliente</label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500"/>
                  <input 
                    placeholder="Nome da cliente" 
                    className="w-full bg-black/20 border border-white/10 rounded-xl p-3.5 pl-11 text-white outline-none focus:border-[#5B2EFF] transition-all" 
                    value={clienteNome} 
                    onChange={e => setClienteNome(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">WhatsApp</label>
                  <input 
                    placeholder="(00) 00000-0000" 
                    className="w-full bg-black/20 border border-white/10 rounded-xl p-3.5 text-white outline-none focus:border-[#5B2EFF] transition-all" 
                    value={clienteTelefone} 
                    onChange={e => setClienteTelefone(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Valor</label>
                  <div className="relative">
                    <DollarSign size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500"/>
                    <input 
                      type="number" 
                      placeholder="0,00" 
                      className="w-full bg-black/20 border border-white/10 rounded-xl p-3.5 pl-9 text-white outline-none focus:border-[#5B2EFF] transition-all" 
                      value={valor} 
                      onChange={e => setValor(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Serviço</label>
                <div className="relative">
                  <Scissors size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500"/>
                  <input 
                    placeholder="Ex: Corte, Mechas, Hidratação..." 
                    className="w-full bg-black/20 border border-white/10 rounded-xl p-3.5 pl-11 text-white outline-none focus:border-[#5B2EFF] transition-all" 
                    value={servico} 
                    onChange={e => setServico(e.target.value)}
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-orange-400 uppercase ml-1">Motivo do Bloqueio</label>
              <input 
                placeholder="Ex: Almoço, Curso, Compromisso..." 
                className="w-full bg-black/20 border border-orange-500/30 rounded-xl p-3.5 text-white outline-none focus:border-orange-500 transition-all" 
                value={bloqueioMotivo} 
                onChange={e => setBloqueioMotivo(e.target.value)}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 pb-2">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Data</label>
              <input 
                type="date" 
                className="w-full bg-black/20 border border-white/10 rounded-xl p-3.5 text-white [color-scheme:dark] outline-none focus:border-[#5B2EFF] transition-all" 
                value={data} 
                onChange={e => setData(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Horário</label>
              <input 
                type="time" 
                className="w-full bg-black/20 border border-white/10 rounded-xl p-3.5 text-white [color-scheme:dark] outline-none focus:border-[#5B2EFF] transition-all" 
                value={horario} 
                onChange={e => setHorario(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Footer Fixo com Botão */}
        <div className="p-6 pt-4 border-t border-white/5 flex-shrink-0 bg-[#18181b] rounded-b-3xl">
          <button 
            onClick={handleSubmit} 
            disabled={loading} 
            className={`w-full py-4 rounded-2xl font-bold text-white shadow-lg transition-all active:scale-95 flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
              isBloqueio 
                ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-orange-900/30' 
                : 'bg-gradient-to-r from-[#5B2EFF] to-[#7C3EFF] hover:from-[#4a24cc] hover:to-[#6a30dd] shadow-purple-900/30'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20}/>
                Salvando...
              </>
            ) : (
              <>
                <Save size={20}/>
                {isBloqueio ? 'Confirmar Bloqueio' : 'Agendar Cliente'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};