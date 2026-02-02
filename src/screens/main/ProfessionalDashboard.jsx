import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { requestNotificationPermission } from '../../services/firebase';
import { HorizontalCalendar } from '../../components/ui/HorizontalCalendar';
import { CalendarView } from '../../components/ui/CalendarView'; 
import { NovoAgendamentoModal } from '../agenda/NovoAgendamentoModal';

import { 
  Calendar, Clock, User, LogOut, CheckCircle, 
  Wallet, Scissors, Star, Bell, MessageCircle, Plus, Lock, Search, X
} from 'lucide-react';

export const ProfessionalDashboard = ({ profissional, onLogout }) => {
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('agenda'); 
  const [agendamentos, setAgendamentos] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date()); 
  const [busca, setBusca] = useState(''); 
  const [resumo, setResumo] = useState({ hoje: 0, mes: 0, proximos: 0 });

  // ESTADOS PARA O MODAL (Importante!)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTipo, setModalTipo] = useState('agendamento'); 

  useEffect(() => {
    if (profissional?.id) {
      fetchDados();
    }
  }, [profissional?.id]);

  const fetchDados = async () => {
    setLoading(true);
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
    const totalMes = todosAgendamentos?.reduce((acc, curr) => acc + (curr.valor || 0), 0) || 0;
    const totalHoje = agendaHoje.reduce((acc, curr) => acc + (curr.valor || 0), 0);

    setAgendamentos(todosAgendamentos || []);
    setResumo({
      hoje: totalHoje,
      mes: totalMes,
      proximos: proximos.length
    });
    setLoading(false);
  };

  const concluirAtendimento = async (id) => {
    const { error } = await supabase.from('agendamentos').update({ status: 'concluido' }).eq('id', id);
    if (!error) {
      setAgendamentos(prev => prev.map(a => a.id === id ? { ...a, status: 'concluido' } : a));
    }
  };

  // --- FUNÇÕES DE AÇÃO DOS BOTÕES ---
  const abrirNovoAgendamento = () => {
    setModalTipo('agendamento');
    setIsModalOpen(true);
  };

  const abrirBloqueio = () => {
    setModalTipo('bloqueio'); // Isso avisa o modal que é um BLOQUEIO
    setIsModalOpen(true);
  };

  const handleAgendamentoSucesso = () => {
    setIsModalOpen(false);
    fetchDados();
  };

  const getProximoCliente = () => {
    const agora = new Date();
    return agendamentos.find(ag => {
        if (ag.status !== 'agendado') return false;
        const dataAg = new Date(`${ag.data}T${ag.horario}`);
        return dataAg >= agora;
    });
  };
  const proximoCliente = getProximoCliente();

  const agendamentosFiltrados = agendamentos.filter(ag => {
    if (busca.length > 0) return ag.cliente_nome.toLowerCase().includes(busca.toLowerCase());
    return ag.data === selectedDate.toLocaleDateString('en-CA');
  });

  const formatDataCard = (dataString) => {
    const date = new Date(dataString + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white pb-24 font-sans selection:bg-purple-500">
      
      {/* O MODAL FICA AQUI */}
      <NovoAgendamentoModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={handleAgendamentoSucesso}
        profissionalId={profissional.id} // Passamos o ID aqui! Isso faz sumir a lista de profissionais
        tipo={modalTipo}
      />

      {/* HEADER */}
      <div className="bg-gradient-to-b from-[#18181b] to-[#0a0a0f] p-6 pt-8 pb-10 rounded-b-[40px] border-b border-white/5 shadow-2xl relative z-10">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-4">
            <div className="relative">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#5B2EFF] to-cyan-500 flex items-center justify-center text-2xl font-bold text-white shadow-lg border-4 border-[#0a0a0f]">
                  {profissional.nome?.charAt(0).toUpperCase()}
                </div>
                <div className="absolute bottom-0 right-0 w-5 h-5 bg-green-500 rounded-full border-4 border-[#0a0a0f]"></div>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Olá, {profissional.nome?.split(' ')[0]}</h1>
              <p className="text-sm text-gray-400 flex items-center gap-1">
                <Star size={12} className="text-yellow-500 fill-yellow-500"/> Online agora
              </p>
            </div>
          </div>
          <div className="flex gap-2">
             <button onClick={() => requestNotificationPermission(profissional.id)} className="p-3 bg-white/5 rounded-2xl hover:bg-purple-500/20 hover:text-purple-400 transition-all border border-white/5"><Bell size={20}/></button>
             <button onClick={onLogout} className="p-3 bg-white/5 rounded-2xl hover:bg-red-500/20 hover:text-red-400 transition-all border border-white/5"><LogOut size={20}/></button>
          </div>
        </div>

        {/* RESUMOS */}
        <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#1c1c24] p-4 rounded-2xl border border-white/5">
                <p className="text-[10px] text-green-400 font-bold uppercase mb-1">Hoje</p>
                <p className="text-lg font-bold text-white">R$ {resumo.hoje}</p>
            </div>
            <div className="bg-[#1c1c24] p-4 rounded-2xl border border-white/5">
                <p className="text-[10px] text-blue-400 font-bold uppercase mb-1">Próximos</p>
                <p className="text-lg font-bold text-white">{resumo.proximos}</p>
            </div>
            <div className="bg-[#1c1c24] p-4 rounded-2xl border border-white/5">
                <p className="text-[10px] text-purple-400 font-bold uppercase mb-1">Mês</p>
                <p className="text-lg font-bold text-white">R$ {resumo.mes}</p>
            </div>
        </div>
      </div>

      <div className="px-6 -mt-6 relative z-20 mb-6">
        <div className="flex bg-[#1c1c24] p-1.5 rounded-2xl border border-white/10 shadow-xl">
          <button onClick={() => setTab('agenda')} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${tab === 'agenda' ? 'bg-[#5B2EFF] text-white shadow-lg shadow-purple-900/30' : 'text-gray-400 hover:text-white'}`}>
            <Calendar size={16}/> Agenda
          </button>
          <button onClick={() => setTab('financeiro')} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${tab === 'financeiro' ? 'bg-[#5B2EFF] text-white shadow-lg shadow-purple-900/30' : 'text-gray-400 hover:text-white'}`}>
            <Wallet size={16}/> Financeiro
          </button>
        </div>
      </div>

      {tab === 'agenda' && (
        <>
            <div className="px-6 mb-6 flex gap-3">
                <button onClick={abrirNovoAgendamento} className="flex-1 bg-[#5B2EFF] hover:bg-[#4a24cc] text-white font-bold py-4 rounded-2xl shadow-lg shadow-purple-900/20 flex items-center justify-center gap-2 transition-all active:scale-95">
                    <Plus size={20} /> Novo Agendamento
                </button>
                <button onClick={abrirBloqueio} className="bg-[#1c1c24] border border-white/10 text-gray-400 hover:text-white px-5 rounded-2xl flex items-center justify-center transition-all active:scale-95" title="Bloquear Horário">
                    <Lock size={20} />
                </button>
            </div>

            {proximoCliente && !busca && (
                <div className="px-6 mb-8">
                    <h2 className="text-xs font-bold text-gray-400 uppercase mb-3 ml-1">Próximo Atendimento</h2>
                    <div className="bg-gradient-to-br from-violet-900 via-[#2d1b69] to-black border border-violet-500/30 p-6 rounded-[32px] relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-4">
                                <div className="bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-sm font-bold text-white flex items-center gap-2 border border-white/5">
                                    <Clock size={14} className="text-purple-300"/> {proximoCliente.horario}
                                </div>
                                {proximoCliente.telefone && (
                                    <button onClick={() => window.open(`https://wa.me/55${proximoCliente.telefone.replace(/\D/g, '')}`, '_blank')} className="p-2 bg-green-500/20 text-green-400 rounded-full">
                                        <MessageCircle size={20}/>
                                    </button>
                                )}
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-1">{proximoCliente.cliente_nome}</h3>
                            <p className="text-purple-200 text-sm mb-4 flex items-center gap-2"><Scissors size={14}/> {proximoCliente.servico}</p>
                            
                            <button onClick={() => concluirAtendimento(proximoCliente.id)} className="w-full py-3 bg-white text-[#0a0a0f] font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-gray-100 active:scale-95 shadow-lg">
                                <CheckCircle size={18} className="text-green-600"/> Concluir Atendimento
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="px-6 mb-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input 
                  type="text"
                  placeholder="Buscar cliente..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="w-full bg-[#1c1c24] border border-white/10 rounded-xl py-3 pl-12 pr-10 text-white placeholder-gray-600 focus:outline-none focus:border-[#5B2EFF] transition-all"
                />
                {busca && (
                  <button onClick={() => setBusca('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white p-1"><X size={16} /></button>
                )}
              </div>
            </div>

            {busca === '' && (
              <div className="pl-6 mb-6">
                  <HorizontalCalendar selectedDate={selectedDate} onSelectDate={setSelectedDate} />
              </div>
            )}

            <div className="px-6 space-y-4 pb-10">
                <div className="flex justify-between items-end mb-2">
                    <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                       {busca ? 'Resultados' : selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric' })}
                    </h2>
                    <span className="text-xs bg-white/5 px-2 py-1 rounded text-gray-400">{agendamentosFiltrados.length} agendados</span>
                </div>

                {agendamentosFiltrados.length === 0 ? (
                    <div className="py-8 flex flex-col items-center justify-center text-center border-2 border-dashed border-[#1c1c24] rounded-3xl opacity-50">
                        <Calendar size={32} className="text-gray-600 mb-2"/>
                        <p className="text-gray-400 font-medium text-sm">Livre</p>
                    </div>
                ) : (
                    agendamentosFiltrados.map((item) => (
                    <div key={item.id} className={`bg-[#15151a] relative rounded-[22px] p-4 border border-white/5 shadow-xl flex gap-4 items-center ${item.status === 'concluido' ? 'opacity-50 grayscale' : ''}`}>
                        <div className="flex flex-col items-center justify-center pr-4 border-r border-white/5 min-w-[60px]">
                            {busca && <span className="text-[10px] font-bold text-[#5B2EFF] uppercase mb-0.5">{formatDataCard(item.data)}</span>}
                            <span className="text-xl font-bold text-white">{item.horario}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-base font-bold text-white truncate">{item.cliente_nome}</h3>
                            <p className="text-purple-300 text-xs flex items-center gap-1 truncate mt-1"><Scissors size={12}/> {item.servico}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <span className="text-sm font-bold text-emerald-400">R$ {item.valor}</span>
                            {item.status !== 'concluido' && (
                                <button onClick={() => concluirAtendimento(item.id)} className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:bg-gray-200 transition-all active:scale-90">
                                    <CheckCircle size={16} className="text-[#5B2EFF]"/>
                                </button>
                            )}
                        </div>
                    </div>
                    ))
                )}
            </div>

            {!busca && (
                <div className="px-6 pb-20 animate-in slide-in-from-bottom-8 duration-700">
                    <h2 className="text-xs font-bold text-gray-400 uppercase mb-4 ml-1 mt-8 border-t border-white/5 pt-8">Visão Geral do Mês</h2>
                    <CalendarView agendamentos={agendamentos} />
                </div>
            )}
        </>
      )}
    </div>
  );
};