import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { requestNotificationPermission } from '../../services/firebase';
// Importa o calendário horizontal
import { HorizontalCalendar } from '../../components/ui/HorizontalCalendar';

import { 
  Calendar, Clock, User, LogOut, CheckCircle, 
  Wallet, Scissors, Star, Bell, MessageCircle, Plus
} from 'lucide-react';

export const ProfessionalDashboard = ({ profissional, onLogout }) => {
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('agenda'); 
  const [agendamentos, setAgendamentos] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date()); // Data selecionada na barra
  const [resumo, setResumo] = useState({ hoje: 0, mes: 0, proximos: 0 });

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

    // Busca agendamentos do mês
    const { data: todosAgendamentos } = await supabase
      .from('agendamentos')
      .select('*')
      .eq('profissional_id', profissional.id)
      .gte('data', inicioMes)
      .neq('status', 'cancelado')
      .order('horario', { ascending: true });

    // Filtra resumo
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

  // Filtra agendamentos pela data selecionada no calendário novo
  const agendamentosFiltrados = agendamentos.filter(ag => {
    const dateAg = ag.data;
    const dateSel = selectedDate.toLocaleDateString('en-CA');
    return dateAg === dateSel;
  });

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white pb-24 font-sans selection:bg-purple-500">
      
      {/* --- 1. O CABEÇALHO ORIGINAL (AMANDA DASHBOARD) VOLTOU --- */}
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
             <button 
                onClick={() => requestNotificationPermission(profissional.id)}
                className="p-3 bg-white/5 rounded-2xl hover:bg-purple-500/20 hover:text-purple-400 transition-all border border-white/5"
             >
                <Bell size={20}/>
             </button>
             <button onClick={onLogout} className="p-3 bg-white/5 rounded-2xl hover:bg-red-500/20 hover:text-red-400 transition-all border border-white/5">
                <LogOut size={20}/>
             </button>
          </div>
        </div>

        {/* CARDS DE RESUMO ORIGINAIS */}
        <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#1c1c24] p-4 rounded-2xl border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-10 h-10 bg-green-500/10 rounded-bl-2xl"></div>
                <p className="text-[10px] text-green-400 font-bold uppercase mb-1 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Hoje</p>
                <p className="text-lg font-bold text-white">R$ {resumo.hoje}</p>
            </div>
            <div className="bg-[#1c1c24] p-4 rounded-2xl border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-10 h-10 bg-blue-500/10 rounded-bl-2xl"></div>
                <p className="text-[10px] text-blue-400 font-bold uppercase mb-1 flex items-center gap-1"><Scissors size={10}/> Próximos</p>
                <p className="text-lg font-bold text-white">{resumo.proximos}</p>
            </div>
            <div className="bg-[#1c1c24] p-4 rounded-2xl border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-10 h-10 bg-purple-500/10 rounded-bl-2xl"></div>
                <p className="text-[10px] text-purple-400 font-bold uppercase mb-1 flex items-center gap-1"><Wallet size={10}/> Mês</p>
                <p className="text-lg font-bold text-white">R$ {resumo.mes}</p>
            </div>
        </div>
      </div>

      {/* --- 2. BOTÕES DE NAVEGAÇÃO --- */}
      <div className="px-6 -mt-6 relative z-20 mb-8">
        <div className="flex bg-[#1c1c24] p-1.5 rounded-2xl border border-white/10 shadow-xl">
          <button 
            onClick={() => setTab('agenda')}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${tab === 'agenda' ? 'bg-[#5B2EFF] text-white shadow-lg shadow-purple-900/30' : 'text-gray-400 hover:text-white'}`}
          >
            <Calendar size={16}/> Minha Agenda
          </button>
          <button 
            onClick={() => setTab('financeiro')}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${tab === 'financeiro' ? 'bg-[#5B2EFF] text-white shadow-lg shadow-purple-900/30' : 'text-gray-400 hover:text-white'}`}
          >
            <Wallet size={16}/> Financeiro
          </button>
        </div>
      </div>

      {tab === 'agenda' && (
        <>
            {/* BOTÃO GRANDE DE NOVO AGENDAMENTO (Restaurado) */}
            <div className="px-6 mb-8">
                <button className="w-full bg-[#5B2EFF] hover:bg-[#4a24cc] text-white font-bold py-4 rounded-2xl shadow-lg shadow-purple-900/20 flex items-center justify-center gap-2 transition-all active:scale-95">
                    <Plus size={20} /> Novo Agendamento
                </button>
            </div>

            {/* --- 3. AQUI ENTRA O NOVO CALENDÁRIO HORIZONTAL (DENTRO DO DASHBOARD) --- */}
            <div className="pl-6 mb-6">
                <HorizontalCalendar 
                    selectedDate={selectedDate} 
                    onSelectDate={setSelectedDate} 
                />
            </div>

            {/* LISTA DE AGENDAMENTOS (Visual Novo) */}
            <div className="px-6 space-y-4 pb-10">
                <div className="flex justify-between items-end mb-2">
                    <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                    {selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric' })}
                    </h2>
                    <span className="text-xs bg-white/5 px-2 py-1 rounded text-gray-400">
                    {agendamentosFiltrados.length} agendamentos
                    </span>
                </div>

                {agendamentosFiltrados.length === 0 ? (
                    <div className="py-12 flex flex-col items-center justify-center text-center border-2 border-dashed border-[#1c1c24] rounded-3xl opacity-50">
                        <Calendar size={40} className="text-gray-600 mb-3"/>
                        <p className="text-gray-400 font-medium">Agenda livre neste dia</p>
                    </div>
                ) : (
                    agendamentosFiltrados.map((item) => (
                    <div key={item.id} className={`bg-[#15151a] relative rounded-[22px] p-5 border border-white/5 shadow-xl flex gap-5 items-center ${item.status === 'concluido' ? 'opacity-50 grayscale' : ''}`}>
                        <div className="flex flex-col items-center justify-center pr-4 border-r border-white/5">
                            <span className="text-lg font-bold text-white">{item.horario}</span>
                            <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">HRS</span>
                        </div>

                        <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold text-white truncate">{item.cliente_nome}</h3>
                            <p className="text-purple-300 text-sm flex items-center gap-1.5 truncate">
                                <Scissors size={14}/> {item.servico}
                            </p>
                            <div className="flex items-center gap-3 mt-2">
                                {item.telefone && (
                                    <button onClick={() => window.open(`https://wa.me/55${item.telefone.replace(/\D/g, '')}`, '_blank')} className="text-green-500 hover:text-green-400 transition-colors flex items-center gap-1 text-xs">
                                        <MessageCircle size={14}/> WhatsApp
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col items-end gap-3">
                            <span className="text-base font-bold text-emerald-400">R$ {item.valor}</span>
                            {item.status !== 'concluido' && (
                                <button 
                                    onClick={() => concluirAtendimento(item.id)}
                                    className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:bg-gray-200 transition-all active:scale-90"
                                >
                                    <CheckCircle size={18} className="text-[#5B2EFF]"/>
                                </button>
                            )}
                        </div>
                    </div>
                    ))
                )}
            </div>
        </>
      )}
    </div>
  );
};