import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../services/supabase';
import { HorizontalCalendar } from '../../components/ui/HorizontalCalendar';
import { NovoAgendamentoModal } from './NovoAgendamentoModal';
import { RemarcarModal } from './RemarcarModal'; // 1. IMPORTAÇÃO DO NOVO MODAL

import { 
  Calendar, Clock, Scissors, MessageCircle, Plus, 
  Lock, Search, X, CalendarDays, Loader2, CheckCheck,
  Edit2, Trash2, MoreVertical, AlertCircle, Check,
  CalendarClock, PhoneCall, Mail, User, DollarSign,
  Filter, ChevronDown, XCircle
} from 'lucide-react';

export const AgendaScreen = () => {
  const [loading, setLoading] = useState(true);
  const [agendamentos, setAgendamentos] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date()); 
  const [busca, setBusca] = useState(''); 
  const [visualizacao, setVisualizacao] = useState('proximos');
  const [filtroStatus, setFiltroStatus] = useState('todos'); 
  const [showFiltros, setShowFiltros] = useState(false);
  
  // Estados para modais e menus
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRemarcarOpen, setIsRemarcarOpen] = useState(false); // 2. ESTADO DO NOVO MODAL
  const [modalTipo, setModalTipo] = useState('agendamento');
  const [agendamentoParaEditar, setAgendamentoParaEditar] = useState(null);
  const [menuAberto, setMenuAberto] = useState(null); 
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState(null);

  const fetchDados = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: usu } = await supabase.from('usuarios').select('salao_id').eq('id', user.id).maybeSingle();
      if (!usu?.salao_id) return;

      const { data, error } = await supabase
        .from('agendamentos')
        .select('*, profissionais(nome)')
        .eq('salao_id', usu.salao_id)
        .order('data', { ascending: true })
        .order('horario', { ascending: true });

      if (error) throw error;
      setAgendamentos(data || []);
    } catch (e) {
      console.error('Erro ao carregar agenda:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDados(); }, []);

  useEffect(() => {
    const handleClickOutside = () => setMenuAberto(null);
    if (menuAberto) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [menuAberto]);

  const agendamentosFiltrados = useMemo(() => {
    let res = agendamentos;

    if (busca.trim()) {
      const b = busca.toLowerCase();
      res = res.filter(a => 
        a.cliente_nome?.toLowerCase().includes(b) || 
        a.profissionais?.nome?.toLowerCase().includes(b) ||
        a.servico?.toLowerCase().includes(b)
      );
    }

    if (filtroStatus !== 'todos') {
      res = res.filter(a => a.status === filtroStatus);
    }

    const hojeObj = new Date();
    const hojeStr = hojeObj.toISOString().split('T')[0];
    const agoraHora = hojeObj.toLocaleTimeString('pt-BR', { hour12: false }).slice(0, 5);

    if (visualizacao === 'proximos') {
      return res.filter(a => {
        const eNoFuturo = a.data > hojeStr || (a.data === hojeStr && a.horario >= agoraHora);
        return eNoFuturo && (a.status === 'agendado' || a.status === 'confirmado');
      }).slice(0, 15); 
    }

    if (visualizacao === 'dia') {
      const diaAlvo = selectedDate.toISOString().split('T')[0];
      return res.filter(a => a.data === diaAlvo);
    }

    if (visualizacao === 'semana') {
      const d = new Date();
      const segunda = new Date(d.setDate(d.getDate() - d.getDay() + 1)).toISOString().split('T')[0];
      const domingo = new Date(d.setDate(d.getDate() - d.getDay() + 7)).toISOString().split('T')[0];
      return res.filter(a => a.data >= segunda && a.data <= domingo);
    }

    if (visualizacao === 'todos') {
      const inicioMes = hojeStr.substring(0, 8) + '01';
      return res.filter(a => a.data >= inicioMes);
    }

    return res;
  }, [agendamentos, busca, visualizacao, selectedDate, filtroStatus]);

  const formatDataCard = (dataString) => {
    if (!dataString) return '';
    const date = new Date(dataString + 'T00:00:00');
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);

    if (date.getTime() === hoje.getTime()) return 'HOJE';
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);
    if (date.getTime() === amanha.getTime()) return 'AMANHÃ';
    
    const [y, m, d] = dataString.split('-');
    return `${d}/${m}`;
  };

  const confirmarAgendamento = async (id) => {
    await supabase.from('agendamentos').update({ status: 'confirmado' }).eq('id', id);
    fetchDados();
    setMenuAberto(null);
  };

  const concluirAgendamento = async (id) => {
    await supabase.from('agendamentos').update({ status: 'concluido' }).eq('id', id);
    fetchDados();
    setMenuAberto(null);
  };

  const cancelarAgendamento = async (id) => {
    if (!confirm('Tem certeza que deseja cancelar este agendamento?')) return;
    await supabase.from('agendamentos').update({ status: 'cancelado' }).eq('id', id);
    fetchDados();
    setMenuAberto(null);
  };

  // 3. FUNÇÃO DE REMARCAR ATUALIZADA
  const remarcarAgendamento = (agendamento) => {
    setAgendamentoSelecionado(agendamento); 
    setIsRemarcarOpen(true);
    setMenuAberto(null);
  };

  const removerBloqueio = async (id) => {
    if (!confirm('Remover este bloqueio?')) return;
    await supabase.from('agendamentos').delete().eq('id', id);
    fetchDados();
    setMenuAberto(null);
  };

  const getStatusBadge = (status) => {
    const badges = {
      agendado: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', label: 'Agendado', icon: Clock },
      confirmado: { color: 'bg-green-500/20 text-green-400 border-green-500/30', label: 'Confirmado', icon: Check },
      concluido: { color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', label: 'Concluído', icon: CheckCheck },
      bloqueado: { color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', label: 'Bloqueado', icon: Lock },
      cancelado: { color: 'bg-red-500/20 text-red-400 border-red-500/30', label: 'Cancelado', icon: XCircle }
    };
    
    const badge = badges[status] || badges.agendado;
    const Icon = badge.icon;
    
    return (
      <div className={`text-[9px] px-2.5 py-1.5 rounded-full font-bold uppercase border flex items-center gap-1 ${badge.color}`}>
        <Icon size={10} />
        {badge.label}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] to-[#15151a] text-white pb-32">
      <NovoAgendamentoModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setAgendamentoParaEditar(null);
        }} 
        onSuccess={() => {
          fetchDados();
          setAgendamentoParaEditar(null);
        }}
        profissionalId={null} 
        tipo={modalTipo}
        agendamentoParaEditar={agendamentoParaEditar}
      />

      {/* 4. COMPONENTE REMARCAR MODAL INTEGRADO */}
      <RemarcarModal 
        isOpen={isRemarcarOpen} 
        onClose={() => setIsRemarcarOpen(false)} 
        onSuccess={fetchDados} 
        agendamento={agendamentoSelecionado} 
      />

      <div className="bg-gradient-to-br from-[#18181b] via-[#1a1a20] to-[#0a0a0f] p-6 pt-8 pb-10 rounded-b-[40px] border-b border-white/5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/5 rounded-full blur-3xl"></div>
        <div className="relative z-10">
          <h1 className="text-2xl font-bold mb-1">Agenda do Salão</h1>
          <p className="text-gray-400 text-sm mb-6">Gerenciamento completo da equipe</p>

          <div className="flex gap-3">
            <button 
              onClick={() => { 
                setAgendamentoParaEditar(null);
                setModalTipo('agendamento'); 
                setIsModalOpen(true); 
              }} 
              className="flex-1 bg-gradient-to-r from-[#5B2EFF] to-[#7C3EFF] hover:from-[#4a24cc] hover:to-[#6a30dd] py-4 rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-purple-500/30 transition-all"
            >
              <Plus size={20}/> Novo Agendamento
            </button>
            <button 
              onClick={() => { 
                setModalTipo('bloqueio'); 
                setIsModalOpen(true); 
              }} 
              className="bg-[#1c1c24] hover:bg-white/5 px-5 rounded-2xl border border-white/10 hover:border-orange-500/30 transition-all active:scale-95"
            >
              <Lock size={20} className="text-gray-400 hover:text-orange-400"/>
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 -mt-4 relative z-20 space-y-4">
        <div className="flex bg-[#1c1c24] p-1.5 rounded-2xl border border-white/10 shadow-xl backdrop-blur-sm">
          {[
            { value: 'proximos', label: 'Próximos', icon: CalendarClock },
            { value: 'dia', label: 'Dia', icon: Calendar },
            { value: 'semana', label: 'Semana', icon: CalendarDays },
            { value: 'todos', label: 'Todos', icon: Filter }
          ].map(v => {
            const Icon = v.icon;
            return (
              <button 
                key={v.value} 
                onClick={() => setVisualizacao(v.value)} 
                className={`flex-1 py-3 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 ${
                  visualizacao === v.value 
                    ? 'bg-gradient-to-r from-[#5B2EFF] to-[#7C3EFF] text-white shadow-lg shadow-purple-500/30' 
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <Icon size={14} />
                {v.label}
              </button>
            );
          })}
        </div>

        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"/>
          <input 
            type="text" 
            value={busca} 
            onChange={(e) => setBusca(e.target.value)} 
            placeholder="Buscar..." 
            className="w-full bg-[#1c1c24] border border-white/10 rounded-2xl pl-12 pr-12 py-4 text-white outline-none focus:border-purple-500/50 transition-all"
          />
        </div>

        {visualizacao === 'dia' && <HorizontalCalendar selectedDate={selectedDate} onSelectDate={setSelectedDate} />}

        <div className="space-y-3 pb-4">
          {loading ? (
            <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-purple-500" size={40}/></div>
          ) : agendamentosFiltrados.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center border-2 border-dashed border-white/10 rounded-3xl bg-white/5 opacity-50">
              <CalendarDays size={40} className="mb-2"/>
              <p className="text-sm">Vazio por aqui</p>
            </div>
          ) : (
            agendamentosFiltrados.map(item => (
              <div 
                key={item.id} 
                className={`bg-[#15151a] relative rounded-2xl p-4 border shadow-lg ${
                  item.status === 'bloqueado' ? 'border-orange-500/20 bg-orange-500/5' : 'border-white/5'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex gap-3 flex-1">
                    <div className="bg-[#1c1c24] p-3 rounded-xl text-center min-w-[70px] border border-white/10">
                      <span className="text-[10px] block font-bold mb-0.5 uppercase text-purple-400">
                        {formatDataCard(item.data)}
                      </span>
                      <span className="text-xl font-bold">{item.horario?.slice(0,5)}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-base leading-tight truncate text-white">{item.cliente_nome}</h3>
                      <p className="text-xs text-gray-400 flex items-center gap-1.5 mt-1 truncate">
                        <Scissors size={12}/> {item.servico}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center text-[10px] text-purple-400 font-bold border border-purple-500/30">
                          {item.profissionais?.nome?.charAt(0)}
                        </div>
                        <span className="text-[10px] text-purple-300 font-bold uppercase">
                          {item.profissionais?.nome}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {getStatusBadge(item.status)}
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuAberto(menuAberto === item.id ? null : item.id);
                        }}
                        className="p-2 hover:bg-white/10 rounded-lg"
                      >
                        <MoreVertical size={18} className="text-gray-400"/>
                      </button>

                      {menuAberto === item.id && (
                        <div className="absolute right-0 top-full mt-2 w-56 bg-[#1c1c24] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                            {item.status !== 'bloqueado' ? (
                              <>
                                {item.status === 'agendado' && <button onClick={() => confirmarAgendamento(item.id)} className="w-full px-4 py-3 flex items-center gap-3 hover:bg-green-500/10 text-green-400 text-sm border-b border-white/5"><Check size={16}/> Confirmar</button>}
                                {(item.status === 'agendado' || item.status === 'confirmado') && <button onClick={() => concluirAgendamento(item.id)} className="w-full px-4 py-3 flex items-center gap-3 hover:bg-blue-500/10 text-blue-400 text-sm border-b border-white/5"><CheckCheck size={16}/> Concluir</button>}
                                {item.telefone && <button onClick={() => window.open(`https://wa.me/55${item.telefone.replace(/\D/g,'')}`)} className="w-full px-4 py-3 flex items-center gap-3 hover:bg-green-500/10 text-green-400 text-sm border-b border-white/5"><MessageCircle size={16}/> WhatsApp</button>}
                                {item.status !== 'concluido' && <button onClick={() => remarcarAgendamento(item)} className="w-full px-4 py-3 flex items-center gap-3 hover:bg-purple-500/10 text-purple-400 text-sm border-b border-white/5"><CalendarClock size={16}/> Remarcar</button>}
                                {item.status !== 'concluido' && <button onClick={() => cancelarAgendamento(item.id)} className="w-full px-4 py-3 flex items-center gap-3 hover:bg-red-500/10 text-red-400 text-sm"><XCircle size={16}/> Cancelar</button>}
                              </>
                            ) : (
                              <button onClick={() => removerBloqueio(item.id)} className="w-full px-4 py-3 flex items-center gap-3 hover:bg-orange-500/10 text-orange-400 text-sm"><Trash2 size={16}/> Remover Bloqueio</button>
                            )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-white/5">
                  <span className="font-bold text-base text-emerald-400">
                    R$ {parseFloat(item.valor_total || item.valor || 0).toFixed(2)}
                  </span>
                  <div className="flex gap-2">
                    {item.status === 'agendado' && <button onClick={() => confirmarAgendamento(item.id)} className="px-3 py-2 bg-green-500/10 text-green-400 rounded-lg border border-green-500/20 text-xs font-bold flex items-center gap-1"><Check size={14}/> Confirmar</button>}
                    {(item.status === 'agendado' || item.status === 'confirmado') && <button onClick={() => concluirAgendamento(item.id)} className="px-3 py-2 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20 text-xs font-bold flex items-center gap-1"><CheckCheck size={14}/> Concluir</button>}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};