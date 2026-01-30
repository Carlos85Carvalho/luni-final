import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { 
  X, Calendar, Clock, User, Scissors, DollarSign, Lock, AlertCircle, 
  Phone, Mail, Save, Loader2, CheckCircle, XCircle, CalendarRange
} from 'lucide-react';

export const NovoAgendamentoModal = ({ isOpen, onClose, onSuccess, profissionalId, tipo = 'agendamento', agendamentoParaEditar = null }) => {
  const [loading, setLoading] = useState(false);
  const [profissionais, setProfissionais] = useState([]);
  const [errors, setErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Form States
  const [selectedProfissional, setSelectedProfissional] = useState(profissionalId || '');
  const [clienteNome, setClienteNome] = useState('');
  const [clienteTelefone, setClienteTelefone] = useState('');
  const [clienteEmail, setClienteEmail] = useState('');
  const [data, setData] = useState('');
  const [horario, setHorario] = useState('');
  const [servico, setServico] = useState('');
  const [valor, setValor] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [duracao, setDuracao] = useState('60');
  
  // Estados específicos para bloqueio
  const [bloqueioMotivo, setBloqueioMotivo] = useState('');
  const [dataFim, setDataFim] = useState(''); 
  const [horarioFim, setHorarioFim] = useState(''); 
  const [bloqueioDiaCompleto, setBloqueioDiaCompleto] = useState(false);

  const isBloqueio = tipo === 'bloqueio';
  const isEdicao = !!agendamentoParaEditar;

  useEffect(() => {
    if (profissionalId) setSelectedProfissional(profissionalId);
  }, [profissionalId]);

  useEffect(() => {
    if (isOpen && !profissionalId) {
       const fetchProfs = async () => {
         const { data } = await supabase.from('profissionais').select('*');
         setProfissionais(data || []);
       };
       fetchProfs();
    }
    
    // Edição
    if (isOpen && agendamentoParaEditar) {
      setSelectedProfissional(agendamentoParaEditar.profissional_id);
      setClienteNome(agendamentoParaEditar.cliente_nome);
      setClienteTelefone(agendamentoParaEditar.telefone || '');
      setClienteEmail(agendamentoParaEditar.email || '');
      setData(agendamentoParaEditar.data);
      setHorario(agendamentoParaEditar.horario);
      setServico(agendamentoParaEditar.servico);
      // Pega valor_total ou valor
      setValor(agendamentoParaEditar.valor_total?.toString() || agendamentoParaEditar.valor?.toString() || '');
      setObservacoes(agendamentoParaEditar.observacoes || '');
      setDuracao(agendamentoParaEditar.duracao?.toString() || '60');
      
      if (agendamentoParaEditar.status === 'bloqueado') {
        setDataFim(agendamentoParaEditar.data_fim || '');
        setHorarioFim(agendamentoParaEditar.horario_fim || '');
        setBloqueioMotivo(agendamentoParaEditar.observacoes || '');
      }
    }
    
    // Novo
    if (isOpen && !agendamentoParaEditar) {
        const hoje = new Date().toLocaleDateString('en-CA');
        setData(hoje);
        setDataFim(hoje);
        setHorario('09:00');
        
        if (isBloqueio) {
            setClienteNome('BLOQUEIO');
            setServico('Bloqueio de Agenda');
            setValor('0');
            setBloqueioMotivo('');
            setHorarioFim('18:00');
            setBloqueioDiaCompleto(false);
        } else {
            setClienteNome('');
            setClienteTelefone('');
            setClienteEmail('');
            setServico('');
            setValor('');
            setObservacoes('');
            setDuracao('60');
        }
        setErrors({});
    }
  }, [isOpen, profissionalId, tipo, isBloqueio, agendamentoParaEditar]);

  const validateForm = () => {
    const newErrors = {};
    if (!selectedProfissional) newErrors.profissional = 'Selecione um profissional';
    if (!data) newErrors.data = 'Data obrigatória';
    if (!horario && !bloqueioDiaCompleto) newErrors.horario = 'Horário obrigatório';
    
    if (isBloqueio) {
      if (!bloqueioMotivo || bloqueioMotivo.trim().length < 3) newErrors.bloqueioMotivo = 'Descreva o motivo';
      if (!bloqueioDiaCompleto && !horarioFim) newErrors.horarioFim = 'Informe o horário final';
      if (dataFim && new Date(dataFim) < new Date(data)) newErrors.dataFim = 'Data final inválida';
    } else {
      if (!clienteNome || clienteNome.trim().length < 3) newErrors.clienteNome = 'Nome muito curto';
      if (!servico) newErrors.servico = 'Informe o serviço';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calcularDiasBloqueio = () => {
    if (!data || !dataFim) return 1;
    const inicio = new Date(data);
    const fim = new Date(dataFim);
    const diffTime = Math.abs(fim - inicio);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
        if (isBloqueio && dataFim && new Date(dataFim) > new Date(data)) {
          // Lógica de Bloqueio Múltiplo (Igual)
          const diasBloqueio = [];
          const dataInicio = new Date(data);
          const dataFinal = new Date(dataFim);
          
          for (let d = new Date(dataInicio); d <= dataFinal; d.setDate(d.getDate() + 1)) {
            diasBloqueio.push(new Date(d).toLocaleDateString('en-CA'));
          }
          
          const bloqueiosParaInserir = diasBloqueio.map(dia => ({
            profissional_id: selectedProfissional,
            cliente_nome: `BLOQUEIO: ${bloqueioMotivo}`,
            data: dia,
            horario: bloqueioDiaCompleto ? '00:00' : horario,
            horario_fim: bloqueioDiaCompleto ? '23:59' : horarioFim,
            servico: 'Bloqueio de Agenda',
            valor: 0,
            valor_total: 0,
            duracao: 0,
            observacoes: bloqueioMotivo,
            status: 'bloqueado',
            dia_completo: bloqueioDiaCompleto
          }));
          
          const { error } = await supabase.from('agendamentos').insert(bloqueiosParaInserir);
          if (error) throw error;
          
        } else {
          // Agendamento Normal - SALVANDO EM AMBOS OS CAMPOS
          const dadosAgendamento = {
            profissional_id: selectedProfissional,
            cliente_nome: isBloqueio ? `BLOQUEIO: ${bloqueioMotivo}` : clienteNome.trim(),
            telefone: clienteTelefone?.replace(/\D/g, '') || null,
            email: clienteEmail || null,
            data,
            horario: (isBloqueio && bloqueioDiaCompleto) ? '00:00' : horario,
            horario_fim: isBloqueio ? (bloqueioDiaCompleto ? '23:59' : horarioFim) : null,
            servico: isBloqueio ? 'Bloqueio de Agenda' : servico.trim(),
            // --- AQUI ESTÁ O TRUQUE: SALVA NO VALOR E NO VALOR_TOTAL ---
            valor: parseFloat(valor || 0),
            valor_total: parseFloat(valor || 0),
            // -----------------------------------------------------------
            duracao: parseInt(duracao || 60),
            observacoes: isBloqueio ? bloqueioMotivo : observacoes,
            status: isBloqueio ? 'bloqueado' : 'agendado',
            dia_completo: isBloqueio ? bloqueioDiaCompleto : false
          };

          let error;
          if (isEdicao) {
            ({ error } = await supabase.from('agendamentos').update(dadosAgendamento).eq('id', agendamentoParaEditar.id));
          } else {
            ({ error } = await supabase.from('agendamentos').insert([dadosAgendamento]));
          }
          if (error) throw error;
        }
        
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          onSuccess();
          onClose();
        }, 1500);
        
    } catch (error) {
        console.error('Erro:', error);
        setErrors({ submit: error.message });
    } finally {
        setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-gradient-to-b from-[#18181b] to-[#15151a] w-full max-w-md rounded-3xl border border-white/10 shadow-2xl relative animate-in slide-in-from-bottom-10 duration-300 max-h-[90vh] overflow-y-auto">
        
        {showSuccess && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center rounded-3xl">
            <div className="text-center">
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-in zoom-in duration-300">
                <CheckCircle size={40} className="text-green-500" />
              </div>
              <p className="text-white font-bold text-xl">{isEdicao ? 'Atualizado!' : isBloqueio ? 'Bloqueio criado!' : 'Agendado!'}</p>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
             <div className={`p-3 rounded-xl backdrop-blur-sm ${isBloqueio ? 'bg-orange-500/20 text-orange-500' : 'bg-[#5B2EFF]/20 text-[#5B2EFF]'}`}>
                {isBloqueio ? <Lock size={24}/> : <Calendar size={24}/>}
             </div>
             <div>
                <h2 className="text-xl font-bold text-white">{isBloqueio ? 'Bloquear Horário' : 'Novo Agendamento'}</h2>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-4">
          {!profissionalId && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase ml-1">Profissional</label>
                <select value={selectedProfissional} onChange={e => setSelectedProfissional(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl p-3.5 text-white outline-none focus:border-[#5B2EFF]">
                    <option value="">Selecione...</option>
                    {profissionais.map(p => (<option key={p.id} value={p.id}>{p.nome}</option>))}
                </select>
              </div>
          )}

          {isBloqueio ? (
             <div className="space-y-4">
               <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 flex gap-3 items-start">
                  <AlertCircle className="text-orange-500 shrink-0" size={20} />
                  <p className="text-sm text-orange-200/90">{dataFim && new Date(dataFim) > new Date(data) ? `Bloqueio de ${calcularDiasBloqueio()} dias` : 'Horário indisponível'}</p>
               </div>
               <div className="space-y-2">
                  <label className="text-xs font-bold text-orange-300 uppercase">Motivo *</label>
                  <input placeholder="Ex: Almoço, Pessoal..." className="w-full bg-orange-500/5 border border-orange-500/20 rounded-lg p-3 text-white text-sm outline-none focus:border-orange-500/50" value={bloqueioMotivo} onChange={e => setBloqueioMotivo(e.target.value)}/>
               </div>
               <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                 <input type="checkbox" checked={bloqueioDiaCompleto} onChange={e => setBloqueioDiaCompleto(e.target.checked)} className="w-5 h-5 rounded bg-white/10 border-white/20 text-orange-500 focus:ring-orange-500"/>
                 <label className="text-sm text-white font-medium">Bloquear o dia todo</label>
               </div>
               <div className="grid grid-cols-2 gap-3">
                 <div className="space-y-2"><label className="text-xs text-gray-400 uppercase">Início</label><input type="date" className="w-full bg-black/20 border border-white/10 rounded-xl p-3.5 text-white [color-scheme:dark]" value={data} onChange={e => setData(e.target.value)}/></div>
                 <div className="space-y-2"><label className="text-xs text-gray-400 uppercase">Fim</label><input type="date" className="w-full bg-black/20 border border-white/10 rounded-xl p-3.5 text-white [color-scheme:dark]" value={dataFim} onChange={e => setDataFim(e.target.value)}/></div>
               </div>
               {!bloqueioDiaCompleto && (
                 <div className="grid grid-cols-2 gap-3">
                   <div className="space-y-2"><label className="text-xs text-gray-400 uppercase">Hora Início</label><input type="time" className="w-full bg-black/20 border border-white/10 rounded-xl p-3.5 text-white [color-scheme:dark]" value={horario} onChange={e => setHorario(e.target.value)}/></div>
                   <div className="space-y-2"><label className="text-xs text-gray-400 uppercase">Hora Fim</label><input type="time" className="w-full bg-black/20 border border-white/10 rounded-xl p-3.5 text-white [color-scheme:dark]" value={horarioFim} onChange={e => setHorarioFim(e.target.value)}/></div>
                 </div>
               )}
             </div>
          ) : (
              <>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase ml-1">Cliente</label>
                    <input placeholder="Nome do Cliente" className="w-full bg-black/20 border border-white/10 rounded-xl p-3.5 text-white outline-none focus:border-[#5B2EFF]" value={clienteNome} onChange={e => setClienteNome(e.target.value)}/>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <input placeholder="Telefone" className="w-full bg-black/20 border border-white/10 rounded-xl p-3.5 text-white outline-none focus:border-[#5B2EFF]" value={clienteTelefone} onChange={e => setClienteTelefone(e.target.value)}/>
                    <input type="email" placeholder="Email" className="w-full bg-black/20 border border-white/10 rounded-xl p-3.5 text-white outline-none focus:border-[#5B2EFF]" value={clienteEmail} onChange={e => setClienteEmail(e.target.value)}/>
                </div>
                <div className="grid grid-cols-2 gap-3">
                   <div className="space-y-2"><label className="text-xs text-gray-400 uppercase">Data</label><input type="date" className="w-full bg-black/20 border border-white/10 rounded-xl p-3.5 text-white [color-scheme:dark]" value={data} onChange={e => setData(e.target.value)}/></div>
                   <div className="space-y-2"><label className="text-xs text-gray-400 uppercase">Horário</label><input type="time" className="w-full bg-black/20 border border-white/10 rounded-xl p-3.5 text-white [color-scheme:dark]" value={horario} onChange={e => setHorario(e.target.value)}/></div>
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase ml-1">Serviço</label>
                    <input placeholder="Ex: Corte" className="w-full bg-black/20 border border-white/10 rounded-xl p-3.5 text-white outline-none focus:border-[#5B2EFF]" value={servico} onChange={e => setServico(e.target.value)}/>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2"><label className="text-xs text-gray-400 uppercase">Valor (R$)</label><input type="number" step="0.01" className="w-full bg-black/20 border border-white/10 rounded-xl p-3.5 text-white outline-none focus:border-[#5B2EFF]" value={valor} onChange={e => setValor(e.target.value)}/></div>
                    <div className="space-y-2"><label className="text-xs text-gray-400 uppercase">Duração (min)</label><input type="number" step="15" className="w-full bg-black/20 border border-white/10 rounded-xl p-3.5 text-white outline-none focus:border-[#5B2EFF]" value={duracao} onChange={e => setDuracao(e.target.value)}/></div>
                </div>
              </>
          )}

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} disabled={loading} className="flex-1 py-3.5 rounded-xl font-bold text-gray-400 bg-white/5 border border-white/10 hover:text-white">Cancelar</button>
            <button onClick={handleSubmit} disabled={loading} className={`flex-1 py-3.5 rounded-xl font-bold text-white shadow-lg flex justify-center items-center gap-2 ${isBloqueio ? 'bg-gradient-to-r from-orange-500 to-red-500' : 'bg-gradient-to-r from-[#5B2EFF] to-[#8B5CF6]'}`}>
              {loading ? <Loader2 size={18} className="animate-spin" /> : <><Save size={18} /> {isBloqueio ? 'Bloquear' : 'Agendar'}</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};