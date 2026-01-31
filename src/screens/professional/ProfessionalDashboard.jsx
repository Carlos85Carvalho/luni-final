import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../services/supabase';
import { requestNotificationPermission } from '../../services/firebase';
import { HorizontalCalendar } from '../../components/ui/HorizontalCalendar';
import { NovoAgendamentoModal } from '../agenda/NovoAgendamentoModal';
import { RemarcarModal } from '../agenda/RemarcarModal'; // IMPORTAÇÃO DO NOVO MODAL

import { 
  Calendar, Clock, User, LogOut, CheckCircle, 
  Wallet, Scissors, Star, Bell, MessageCircle, Plus, Lock, Search, X, CalendarDays,
  TrendingUp, DollarSign, Filter, Trash2, History, CheckCheck, XCircle, Loader2,
  MoreVertical, CalendarClock, Check
} from 'lucide-react';

export const ProfessionalDashboard = ({ profissional, onLogout }) => {
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('agenda'); 
  const [agendamentos, setAgendamentos] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date()); 
  const [busca, setBusca] = useState(''); 
  const [resumo, setResumo] = useState({ hoje: 0, mes: 0, proximos: 0, total_clientes: 0 });
  const [filtroStatus, setFiltroStatus] = useState('todos'); 
  const [visualizacao, setVisualizacao] = useState('proximos'); 
  const [showFiltros, setShowFiltros] = useState(false);
  const [producaoMensal, setProducaoMensal] = useState([]);
  const [menuAberto, setMenuAberto] = useState(null);
  const [agendamentoParaEditar, setAgendamentoParaEditar] = useState(null);
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState(null); // ESTADO PARA REMARCAR

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRemarcarOpen, setIsRemarcarOpen] = useState(false); // ESTADO DO NOVO MODAL
  const [modalTipo, setModalTipo] = useState('agendamento'); 

  const fetchDados = async () => {
    if (!profissional?.id) return;

    setLoading(true);
    const hoje = new Date();
    const hojeISO = hoje.toLocaleDateString('en-CA');
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString();

    try {
      const { data: todosAgendamentos, error } = await supabase
        .from('agendamentos')
        .select('*')
        .eq('profissional_id', profissional.id)
        .gte('data', inicioMes)
        .order('data', { ascending: true })
        .order('horario', { ascending: true });

      if (error) throw error;

      const agendaHoje = todosAgendamentos?.filter(a => a.data === hojeISO && a.status !== 'cancelado') || [];
      const proximos = todosAgendamentos?.filter(a => {
        const dataAg = new Date(`${a.data}T${a.horario}`);
        return dataAg >= hoje && (a.status === 'agendado' || a.status === 'confirmado');
      }) || [];

      const totalMes = todosAgendamentos
        ?.filter(a => a.status !== 'cancelado' && a.status !== 'bloqueado')
        ?.reduce((acc, curr) => acc + (curr.valor_total || curr.valor || 0), 0) || 0;
      
      const totalHoje = agendaHoje
        ?.filter(a => a.status !== 'bloqueado')
        ?.reduce((acc, curr) => acc + (curr.valor_total || curr.valor || 0), 0) || 0;

      const clientesUnicos = new Set(
        todosAgendamentos
          ?.filter(a => a.status !== 'cancelado' && a.status !== 'bloqueado')
          ?.map(a => a.cliente_nome.toLowerCase())
      ).size;

      const producaoPorDia = {};
      todosAgendamentos?.forEach(ag => {
        if (ag.status !== 'cancelado' && ag.status !== 'bloqueado') {
          const dia = new Date(ag.data).getDate();
          producaoPorDia[dia] = (producaoPorDia[dia] || 0) + (ag.valor_total || ag.valor || 0);
        }
      });

      setAgendamentos(todosAgendamentos || []);
      setProducaoMensal(Object.entries(producaoPorDia).map(([dia, valor]) => ({ dia: parseInt(dia), valor })));
      setResumo({
        hoje: totalHoje,
        mes: totalMes,
        proximos: proximos.length,
        total_clientes: clientesUnicos
      });
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDados();
  }, [profissional?.id]);

  useEffect(() => {
    const handleClickOutside = () => setMenuAberto(null);
    if (menuAberto) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [menuAberto]);

  const confirmarAgendamento = async (id) => {
    await supabase.from('agendamentos').update({ status: 'confirmado' }).eq('id', id);
    fetchDados();
    setMenuAberto(null);
  };

  const concluirAtendimento = async (id) => {
    const { error } = await supabase.from('agendamentos').update({ status: 'concluido' }).eq('id', id);
    if (!error) {
      setAgendamentos(prev => prev.map(a => a.id === id ? { ...a, status: 'concluido' } : a));
      fetchDados(); 
    }
    setMenuAberto(null);
  };

  const cancelarAgendamento = async (id) => {
    if (!confirm('Tem certeza que deseja cancelar?')) return;
    const { error } = await supabase.from('agendamentos').update({ status: 'cancelado' }).eq('id', id);
    if (!error) {
      setAgendamentos(prev => prev.filter(a => a.id !== id));
      fetchDados();
    }
    setMenuAberto(null);
  };

  // FUNÇÃO DE REMARCAR COM O NOVO MODAL INTELIGENTE
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

  const abrirNovoAgendamento = () => {
    setAgendamentoParaEditar(null);
    setModalTipo('agendamento');
    setIsModalOpen(true);
  };

  const abrirBloqueio = () => {
    setModalTipo('bloqueio');
    setIsModalOpen(true);
  };

  const handleAgendamentoSucesso = () => {
    setIsModalOpen(false);
    setAgendamentoParaEditar(null);
    fetchDados();
  };

  const agendamentosFiltrados = useMemo(() => {
    let resultado = agendamentos;

    if (busca.trim()) {
      resultado = resultado.filter(ag => 
        ag.cliente_nome.toLowerCase().includes(busca.toLowerCase()) ||
        ag.servico?.toLowerCase().includes(busca.toLowerCase())
      );
    }

    if (filtroStatus !== 'todos') {
      resultado = resultado.filter(ag => ag.status === filtroStatus);
    }

    const hoje = new Date();

    switch (visualizacao) {
      case 'proximos':
        resultado = resultado.filter(ag => {
          const dataAg = new Date(`${ag.data}T${ag.horario}`);
          return dataAg >= new Date() && ag.status !== 'concluido' && ag.status !== 'cancelado';
        }).slice(0, 10);
        break;
      
      case 'dia':
        const diaISO = selectedDate.toLocaleDateString('en-CA');
        resultado = resultado.filter(ag => ag.data === diaISO);
        break;
      
      case 'semana':
        const inicioDaSemana = new Date(hoje);
        inicioDaSemana.setDate(hoje.getDate() - hoje.getDay());
        const fimDaSemana = new Date(inicioDaSemana);
        fimDaSemana.setDate(inicioDaSemana.getDate() + 6);
        
        resultado = resultado.filter(ag => {
          const dataAg = new Date(ag.data);
          return dataAg >= inicioDaSemana && dataAg <= fimDaSemana;
        });
        break;
      
      case 'todos':
        const inicioMesStr = hoje.toISOString().split('T')[0].substring(0, 8) + '01';
        resultado = resultado.filter(a => a.data >= inicioMesStr);
        break;
    }

    return resultado;
  }, [agendamentos, busca, filtroStatus, visualizacao, selectedDate]);

  const formatDataCard = (dataString) => {
    const date = new Date(dataString + 'T00:00:00');
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);

    if (date.getTime() === hoje.getTime()) return 'HOJE';
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);
    if (date.getTime() === amanha.getTime()) return 'AMANHÃ';
    
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  const getStatusBadge = (status) => {
    const badges = {
      agendado: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: Clock, label: 'Agendado' },
      confirmado: { color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: Check, label: 'Confirmado' },
      concluido: { color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: CheckCheck, label: 'Concluído' },
      bloqueado: { color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', icon: Lock, label: 'Bloqueado' },
      cancelado: { color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: XCircle, label: 'Cancelado' }
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
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] to-[#15151a] text-white pb-24 font-sans selection:bg-purple-500">
      
      <NovoAgendamentoModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setAgendamentoParaEditar(null);
        }} 
        onSuccess={handleAgendamentoSucesso}
        profissionalId={profissional.id}
        tipo={modalTipo}
        agendamentoParaEditar={agendamentoParaEditar}
      />

      <RemarcarModal 
        isOpen={isRemarcarOpen} 
        onClose={() => setIsRemarcarOpen(false)} 
        onSuccess={fetchDados} 
        agendamento={agendamentoSelecionado} 
      />

      {/* HEADER */}
      <div className="bg-gradient-to-br from-[#18181b] via-[#1a1a20] to-[#0a0a0f] p-6 pt-8 pb-12 rounded-b-[40px] border-b border-white/5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/5 rounded-full blur-3xl"></div>
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#5B2EFF] to-cyan-500 flex items-center justify-center text-2xl font-bold text-white shadow-xl border-2 border-white/10">
                  {profissional.nome?.charAt(0).toUpperCase()}
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-4 border-[#18181b] shadow-lg"></div>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Olá, {profissional.nome?.split(' ')[0]}</h1>
                <p className="text-sm text-gray-400 flex items-center gap-2 mt-1">
                  <Star size={12} className="text-yellow-500 fill-yellow-500"/> 
                  <span>Online agora</span>
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => requestNotificationPermission(profissional.id)} 
                className="p-3 bg-white/5 rounded-xl hover:bg-purple-500/20 hover:text-purple-400 transition-all border border-white/5 backdrop-blur-sm"
              >
                <Bell size={20}/>
              </button>
              <button 
                onClick={onLogout} 
                className="p-3 bg-white/5 rounded-xl hover:bg-red-500/20 hover:text-red-400 transition-all border border-white/5 backdrop-blur-sm"
              >
                <LogOut size={20}/>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gradient-to-br from-emerald-500/10 to-green-500/5 p-4 rounded-2xl border border-emerald-500/20 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-emerald-500/20 rounded-lg"><DollarSign size={16} className="text-emerald-400"/></div>
                <p className="text-[10px] text-emerald-300 font-bold uppercase">Hoje</p>
              </div>
              <p className="text-xl font-bold text-white">R$ {resumo.hoje.toFixed(2)}</p>
            </div>
            <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 p-4 rounded-2xl border border-blue-500/20 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-blue-500/20 rounded-lg"><Calendar size={16} className="text-blue-400"/></div>
                <p className="text-[10px] text-blue-300 font-bold uppercase">Próximos</p>
              </div>
              <p className="text-xl font-bold text-white">{resumo.proximos}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ABAS */}
      <div className="px-6 -mt-6 relative z-20 mb-6">
        <div className="flex bg-[#1c1c24] p-1.5 rounded-2xl border border-white/10 shadow-xl backdrop-blur-sm">
          <button onClick={() => setTab('agenda')} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${tab === 'agenda' ? 'bg-gradient-to-r from-[#5B2EFF] to-[#7C3EFF] text-white shadow-lg shadow-purple-900/30' : 'text-gray-400 hover:text-white'}`}><Calendar size={16}/> Agenda</button>
          <button onClick={() => setTab('financeiro')} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${tab === 'financeiro' ? 'bg-gradient-to-r from-[#5B2EFF] to-[#7C3EFF] text-white shadow-lg shadow-purple-900/30' : 'text-gray-400 hover:text-white'}`}><Wallet size={16}/> Financeiro</button>
        </div>
      </div>

      {tab === 'agenda' && (
        <>
          <div className="px-6 mb-6 flex gap-3">
            <button onClick={abrirNovoAgendamento} className="flex-1 bg-gradient-to-r from-[#5B2EFF] to-[#7C3EFF] hover:from-[#4a24cc] hover:to-[#6a30dd] text-white font-bold py-4 rounded-2xl shadow-lg shadow-purple-900/30 flex items-center justify-center gap-2 transition-all active:scale-95"><Plus size={20} /> Novo Agendamento</button>
            <button onClick={abrirBloqueio} className="bg-[#1c1c24] border border-white/10 text-gray-400 hover:text-orange-400 hover:border-orange-500/30 px-5 rounded-2xl flex items-center justify-center transition-all active:scale-95"><Lock size={20} /></button>
          </div>

          <div className="px-6 mb-6 space-y-3">
            <div className="relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"/>
              <input type="text" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar cliente ou serviço..." className="w-full bg-[#1c1c24] border border-white/10 rounded-2xl pl-12 pr-12 py-4 text-white outline-none focus:border-purple-500/50 transition-all" />
              {busca && <button onClick={() => setBusca('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"><X size={18}/></button>}
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {['proximos', 'dia', 'semana', 'todos'].map(v => (
                <button key={v} onClick={() => setVisualizacao(v)} className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${visualizacao === v ? 'bg-[#5B2EFF] text-white shadow-lg' : 'bg-[#1c1c24] text-gray-400 border border-white/10'}`}>
                  {v === 'proximos' ? '📅 PRÓXIMOS 10' : v.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {visualizacao === 'dia' && <div className="pl-6 mb-6"><HorizontalCalendar selectedDate={selectedDate} onSelectDate={setSelectedDate} /></div>}

          <div className="px-6 space-y-3 pb-10">
            {agendamentosFiltrados.map((item) => (
              <div key={item.id} className={`bg-[#15151a] relative rounded-2xl p-4 border shadow-lg ${item.status === 'bloqueado' ? 'border-orange-500/20 bg-orange-500/5' : 'border-white/5'}`}>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex flex-col items-center justify-center bg-[#1c1c24] rounded-xl px-3 py-2 border border-white/10 min-w-[70px]">
                      <span className={`text-[10px] font-bold uppercase ${item.status === 'bloqueado' ? 'text-orange-500' : 'text-[#5B2EFF]'}`}>{formatDataCard(item.data)}</span>
                      <span className="text-lg font-bold text-white mt-0.5">{item.horario.slice(0, 5)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold truncate text-white">{item.cliente_nome}</h3>
                      <p className="text-gray-400 text-xs truncate mt-1">{item.status === 'bloqueado' ? <Lock size={12} className="inline mr-1"/> : <Scissors size={12} className="inline mr-1"/>} {item.servico}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(item.status)}
                    <div className="relative">
                      <button onClick={(e) => { e.stopPropagation(); setMenuAberto(menuAberto === item.id ? null : item.id); }} className="p-2 hover:bg-white/10 rounded-lg"><MoreVertical size={18} className="text-gray-400"/></button>
                      {menuAberto === item.id && (
                        <div className="absolute right-0 top-full mt-2 w-56 bg-[#1c1c24] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                            {item.status !== 'bloqueado' ? (
                              <>
                                {item.status === 'agendado' && <button onClick={() => confirmarAgendamento(item.id)} className="w-full px-4 py-3 flex items-center gap-3 hover:bg-green-500/10 text-green-400 text-sm border-b border-white/5"><Check size={16}/> Confirmar</button>}
                                {(item.status === 'agendado' || item.status === 'confirmado') && <button onClick={() => concluirAtendimento(item.id)} className="w-full px-4 py-3 flex items-center gap-3 hover:bg-blue-500/10 text-blue-400 text-sm border-b border-white/5"><CheckCheck size={16}/> Concluir</button>}
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
                  <span className="text-base font-bold text-emerald-400">R$ {parseFloat(item.valor_total || item.valor || 0).toFixed(2)}</span>
                  <div className="flex gap-2">
                    {item.status === 'agendado' && <button onClick={() => confirmarAgendamento(item.id)} className="px-3 py-2 bg-green-500/10 text-green-400 rounded-lg border border-green-500/20 text-xs font-bold hover:bg-green-500/20 transition-all flex items-center gap-1"><Check size={14}/> Confirmar</button>}
                    {(item.status === 'agendado' || item.status === 'confirmado') && <button onClick={() => concluirAtendimento(item.id)} className="px-3 py-2 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20 text-xs font-bold hover:bg-blue-500/20 transition-all flex items-center gap-1"><CheckCheck size={14}/> Concluir</button>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'financeiro' && (
        <div className="px-6 space-y-6 pb-10">
          <div className="bg-gradient-to-br from-emerald-600/30 via-green-600/20 to-teal-600/20 border border-emerald-500/30 p-8 rounded-3xl text-center relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl"></div>
            <div className="relative z-10">
              <div className="w-20 h-20 bg-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/50"><TrendingUp size={40} className="text-emerald-300"/></div>
              <p className="text-emerald-300 text-sm font-bold uppercase mb-2">Produção Mensal</p>
              <h2 className="text-5xl font-bold text-white mb-3">R$ {resumo.mes.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</h2>
              <p className="text-sm text-emerald-200/70">Total acumulado neste mês</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#1c1c24] border border-white/10 p-4 rounded-2xl"><p className="text-xs text-gray-400 uppercase font-bold mb-2">Ticket Médio</p><p className="text-2xl font-bold text-white">R$ {resumo.total_clientes > 0 ? (resumo.mes / resumo.total_clientes).toFixed(2) : '0.00'}</p></div>
            <div className="bg-[#1c1c24] border border-white/10 p-4 rounded-2xl"><p className="text-xs text-gray-400 uppercase font-bold mb-2">Clientes</p><p className="text-2xl font-bold text-white">{resumo.total_clientes}</p></div>
          </div>
          <div className="bg-[#1c1c24] border border-white/10 rounded-2xl p-6">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2"><History size={18} className="text-purple-400"/> Produção Diária</h3>
            <div className="flex items-end justify-between gap-1 h-32">
              {producaoMensal.slice(-14).map((item, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center">
                  <div className="w-full bg-gradient-to-t from-purple-600 to-purple-400 rounded-t-lg transition-all" style={{ height: `${(item.valor / Math.max(...producaoMensal.map(p => p.valor))) * 100}%` }}></div>
                  <span className="text-[10px] text-gray-500 mt-1">{item.dia}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-[#1c1c24] border border-white/10 rounded-2xl p-6">
            <h3 className="text-white font-bold mb-4">Últimos Atendimentos</h3>
            <div className="space-y-3">
              {agendamentos.filter(a => a.status === 'concluido').slice(0, 5).map((item) => (
                <div key={item.id} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                  <div><p className="text-white font-medium text-sm">{item.cliente_nome}</p><p className="text-gray-500 text-xs">{item.servico}</p></div>
                  <div className="text-right"><p className="text-green-400 font-bold text-sm">R$ {parseFloat(item.valor_total || item.valor || 0).toFixed(2)}</p><p className="text-gray-500 text-xs">{formatDataCard(item.data)}</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};