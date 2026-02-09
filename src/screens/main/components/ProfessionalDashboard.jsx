import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../../services/supabase';
import { requestNotificationPermission } from '../../services/firebase';

// Componentes Lógicos/Modais
import { HorizontalCalendar } from '../../components/ui/HorizontalCalendar';
import { CalendarView } from '../../components/ui/CalendarView'; 
import { NovoAgendamentoModal } from '../agenda/NovoAgendamentoModal';

// Componentes Visuais
import { StatCard } from '../../components/ui/StatCard';
import { SectionCard } from '../../components/ui/SectionCard';

// Ícones
import { 
  Calendar, Clock, LogOut, CheckCircle, 
  Wallet, Scissors, Star, Bell, MessageCircle, Plus, Lock, Search, X, Check, Loader2 
} from 'lucide-react';

export const ProfessionalDashboard = ({ profissional, onLogout }) => {
  // 1. Loading é usado, então mantemos
  const [loading, setLoading] = useState(true);
  
  const [tab, setTab] = useState('agenda'); 
  const [agendamentos, setAgendamentos] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date()); 
  const [busca, setBusca] = useState(''); 
  const [resumo, setResumo] = useState({ hoje: 0, mes: 0, proximos: 0 });

  // CORREÇÃO: Removidos os estados de filtro não utilizados (setFiltroStatus, showFiltros, etc.)
  // para limpar os erros do ESLint.

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTipo, setModalTipo] = useState('agendamento'); 

  // --- BUSCA DE DADOS ---
  const fetchDados = useCallback(async () => {
    if (!profissional?.id) return;

    const hoje = new Date();
    const hojeISO = hoje.toLocaleDateString('en-CA');
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString();

    const { data: todosAgendamentos } = await supabase
      .from('agendamentos')
      .select('*')
      .eq('profissional_id', profissional.id)
      .gte('data', inicioMes)
      .neq('status', 'cancelado')
      .order('data', { ascending: true })
      .order('horario', { ascending: true });

    const agendaHoje = todosAgendamentos?.filter(a => a.data === hojeISO) || [];
    const proximos = todosAgendamentos?.filter(a => a.status === 'agendado') || [];
    
    const calcValor = (item) => Number(item.valor_total || item.valor || 0);

    const totalMes = todosAgendamentos?.reduce((acc, curr) => acc + calcValor(curr), 0) || 0;
    const totalHoje = agendaHoje.reduce((acc, curr) => acc + calcValor(curr), 0);

    setAgendamentos(todosAgendamentos || []);
    setResumo({
      hoje: totalHoje,
      mes: totalMes,
      proximos: proximos.length
    });
    
    setLoading(false);
  }, [profissional]);

  // --- EFEITOS ---
  useEffect(() => {
    fetchDados();
  }, [fetchDados]);

  const handleRefresh = () => {
    setLoading(true);
    fetchDados();
  };

  const concluirAtendimento = async (id) => {
    const { error } = await supabase.from('agendamentos').update({ status: 'concluido' }).eq('id', id);
    if (!error) {
      setAgendamentos(prev => prev.map(a => a.id === id ? { ...a, status: 'concluido' } : a));
    }
  };

  const abrirNovoAgendamento = () => { setModalTipo('agendamento'); setIsModalOpen(true); };
  const abrirBloqueio = () => { setModalTipo('bloqueio'); setIsModalOpen(true); };
  
  const handleAgendamentoSucesso = () => { 
    setIsModalOpen(false); 
    handleRefresh();
  };

  const getProximoCliente = () => {
    const agora = new Date();
    const hojeStr = agora.toLocaleDateString('en-CA');
    
    return agendamentos.find(ag => {
        if (ag.status !== 'agendado') return false;
        if (ag.data !== hojeStr) return false;
        
        const [hora, min] = ag.horario.split(':');
        const dataAg = new Date();
        dataAg.setHours(hora, min, 0);
        
        return dataAg >= agora;
    });
  };
  const proximoCliente = getProximoCliente();

  const agendamentosFiltrados = useMemo(() => {
    return agendamentos.filter(ag => {
      // Filtros básicos
      if (busca.length > 0) return ag.cliente_nome.toLowerCase().includes(busca.toLowerCase());
      return ag.data === selectedDate.toLocaleDateString('en-CA');
    });
  }, [agendamentos, busca, selectedDate]);

  const formatDataCard = (dataString) => {
    const [, mes, dia] = dataString.split('-');
    return `${dia}/${mes}`;
  };

  // CORREÇÃO: Implementação visual do loading para resolver o erro "loading is assigned but never used"
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center text-white">
        <Loader2 className="animate-spin text-[#5B2EFF]" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white w-full overflow-x-hidden">
      
      <NovoAgendamentoModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={handleAgendamentoSucesso}
        profissionalId={profissional.id}
        tipo={modalTipo}
      />

      <div className="w-full max-w-7xl mx-auto px-4 pt-6 md:px-8 md:pt-10 pb-24 space-y-8 animate-in fade-in duration-700">
        
        {/* HEADER */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className="relative">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#5B2EFF] to-cyan-500 flex items-center justify-center text-xl font-bold text-white border-2 border-white/10">
                  {profissional.nome?.charAt(0).toUpperCase()}
                </div>
                <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-[#0a0a0f]"></div>
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Olá, {profissional.nome?.split(' ')[0]}</h1>
              <p className="text-sm text-gray-400 flex items-center gap-1">
                <Star size={12} className="text-yellow-500 fill-yellow-500"/> Online agora
              </p>
            </div>
          </div>
          <div className="flex gap-2">
             <button onClick={() => requestNotificationPermission(profissional.id)} className="p-3 bg-white/5 rounded-xl hover:bg-white/10 border border-white/5 transition-all"><Bell size={20} className="text-gray-300"/></button>
             <button onClick={onLogout} className="p-3 bg-white/5 rounded-xl hover:bg-red-500/20 hover:border-red-500/30 border border-white/5 transition-all group"><LogOut size={20} className="text-gray-300 group-hover:text-red-400"/></button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <StatCard title="Hoje" value={`R$ ${resumo.hoje.toFixed(0)}`} subtext="Produção do dia" icon={Wallet} colorTheme="emerald" />
            <StatCard title="Próximos" value={resumo.proximos} subtext="Agendados" icon={Clock} colorTheme="blue" />
            <StatCard title="Mês" value={`R$ ${resumo.mes.toFixed(0)}`} subtext="Total mensal" icon={Calendar} colorTheme="purple" />
        </div>

        {/* CONTROLES PRINCIPAIS */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-[#15151a] p-2 rounded-2xl border border-white/5">
            <div className="flex bg-[#1c1c24] p-1 rounded-xl w-full md:w-auto">
                <button onClick={() => setTab('agenda')} className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${tab === 'agenda' ? 'bg-[#5B2EFF] text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>
                    <Calendar size={16}/> Agenda
                </button>
                <button onClick={() => setTab('financeiro')} className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${tab === 'financeiro' ? 'bg-[#5B2EFF] text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>
                    <Wallet size={16}/> Financeiro
                </button>
            </div>

            {tab === 'agenda' && (
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                    <input 
                        type="text"
                        placeholder="Buscar cliente..."
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl py-2 pl-10 pr-10 text-white text-sm focus:outline-none focus:border-[#5B2EFF] transition-all"
                    />
                    {busca && <button onClick={() => setBusca('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"><X size={14} /></button>}
                </div>
            )}
        </div>

        {/* CONTEÚDO DA ABA AGENDA */}
        {tab === 'agenda' && (
           <div className="space-y-6">
             
             {/* BOTÕES DE AÇÃO */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <button onClick={abrirNovoAgendamento} className="bg-gradient-to-r from-[#5B2EFF] to-[#7C3EFF] hover:brightness-110 text-white font-bold py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95">
                     <Plus size={20} /> Novo Agendamento
                 </button>
                 <button onClick={abrirBloqueio} className="bg-[#1c1c24] border border-white/10 hover:border-white/30 text-gray-400 hover:text-white py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95">
                     <Lock size={20} /> Bloquear Horário
                 </button>
             </div>

             {/* PRÓXIMO CLIENTE */}
             {proximoCliente && !busca && (
               <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-900 to-[#0a0a0f] border border-violet-500/30 p-6 md:p-8 shadow-2xl">
                   <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                   <div className="relative z-10">
                       <div className="flex justify-between items-start mb-6">
                           <span className="bg-white/10 backdrop-blur border border-white/10 text-white px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2">
                               <Clock size={14} className="text-purple-300"/> Próximo: {proximoCliente.horario.slice(0,5)}
                           </span>
                           {proximoCliente.telefone && (
                               <button onClick={() => window.open(`https://wa.me/55${proximoCliente.telefone.replace(/\D/g, '')}`, '_blank')} className="p-2 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-full transition-colors">
                                   <MessageCircle size={24}/>
                               </button>
                           )}
                       </div>
                       
                       <div className="mb-6">
                           <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">{proximoCliente.cliente_nome}</h2>
                           <p className="text-purple-200 text-lg flex items-center gap-2"><Scissors size={18}/> {proximoCliente.servico}</p>
                       </div>

                       <button onClick={() => concluirAtendimento(proximoCliente.id)} className="w-full bg-white text-[#0a0a0f] font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-100 transition-all shadow-lg active:scale-95">
                           <CheckCircle size={20} className="text-green-600"/> Concluir Atendimento
                       </button>
                   </div>
               </div>
             )}

             {/* CALENDÁRIO */}
             {!busca && (
                 <div className="bg-[#15151a] p-4 rounded-2xl border border-white/5">
                    <HorizontalCalendar selectedDate={selectedDate} onSelectDate={setSelectedDate} />
                 </div>
             )}

             {/* LISTA */}
             <SectionCard title={busca ? "Resultados da Busca" : `Agenda de ${selectedDate.toLocaleDateString('pt-BR', { weekday: 'long' })}`} Icon={Calendar} iconColor="text-blue-400">
                 {agendamentosFiltrados.length === 0 ? (
                     <div className="py-12 flex flex-col items-center justify-center text-center opacity-40">
                         <Calendar size={48} className="text-gray-500 mb-3"/>
                         <p className="text-gray-400 font-medium">Nenhum agendamento para este período</p>
                     </div>
                 ) : (
                     agendamentosFiltrados.map((item) => (
                       <div key={item.id} className={`flex items-center justify-between p-4 bg-[#0a0a0f] border border-white/5 rounded-xl hover:border-purple-500/30 transition-all ${item.status === 'concluido' ? 'opacity-50 grayscale' : ''}`}>
                           <div className="flex items-center gap-4 min-w-0">
                               <div className="flex flex-col items-center justify-center w-14 h-14 bg-[#1c1c24] rounded-xl border border-white/10 shrink-0">
                                   {busca && <span className="text-[10px] font-bold text-purple-400 uppercase">{formatDataCard(item.data)}</span>}
                                   <span className="text-lg font-bold text-white">{item.horario.slice(0,5)}</span>
                               </div>
                               <div className="min-w-0">
                                   <h3 className="text-base font-bold text-white truncate">{item.cliente_nome}</h3>
                                   <p className="text-sm text-gray-400 truncate flex items-center gap-1"><Scissors size={12}/> {item.servico}</p>
                               </div>
                           </div>
                           
                           <div className="flex flex-col items-end gap-2 shrink-0">
                               <span className="text-sm font-bold text-emerald-400">R$ {item.valor}</span>
                               {item.status !== 'concluido' && (
                                   <button onClick={() => concluirAtendimento(item.id)} className="p-2 bg-white/10 hover:bg-green-500/20 hover:text-green-400 rounded-lg transition-all" title="Concluir">
                                       <Check size={16}/>
                                   </button>
                               )}
                           </div>
                       </div>
                     ))
                 )}
             </SectionCard>

             {/* VISÃO GERAL */}
             {!busca && (
               <SectionCard title="Visão Geral do Mês" Icon={Calendar} iconColor="text-purple-400">
                   <CalendarView agendamentos={agendamentos} />
               </SectionCard>
             )}
           </div>
        )}

        {/* ABA FINANCEIRO */}
        {tab === 'financeiro' && (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in">
              <StatCard title="Total do Mês" value={`R$ ${resumo.mes.toFixed(2)}`} subtext="Acumulado" icon={Wallet} colorTheme="emerald" />
              <SectionCard title="Extrato Rápido" Icon={Wallet} iconColor="text-emerald-400">
                  <p className="text-gray-500 text-center py-4">Detalhes financeiros em breve...</p>
              </SectionCard>
           </div>
        )}

      </div>
    </div>
  );
};