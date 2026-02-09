// src/screens/agenda/AgendaScreen.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../services/supabase';
import { HorizontalCalendar } from '../../components/ui/HorizontalCalendar';
import { NovoAgendamentoModal } from './NovoAgendamentoModal';
import { RemarcarModal } from './RemarcarModal';
// IMPORTANTE: .jsx explícito
import { ModalFinalizarAtendimento } from './ModalFinalizarAtendimento.jsx'; 

import { 
  Calendar, Clock, Scissors, MessageCircle, Plus, 
  Lock, Search, X, CalendarDays, Loader2, CheckCheck,
  MoreVertical, Check, CalendarClock, Filter, ChevronDown, XCircle, Trash2, User
} from 'lucide-react';

export const AgendaScreen = () => {
  const [loading, setLoading] = useState(true);
  const [agendamentos, setAgendamentos] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date()); 
  const [busca, setBusca] = useState(''); 
  const [visualizacao, setVisualizacao] = useState('proximos');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [showFiltros, setShowFiltros] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRemarcarOpen, setIsRemarcarOpen] = useState(false);
  const [modalTipo, setModalTipo] = useState('agendamento');
  const [agendamentoParaEditar, setAgendamentoParaEditar] = useState(null);
  const [menuAberto, setMenuAberto] = useState(null);
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [agendamentoCheckout, setAgendamentoCheckout] = useState(null);

  const fetchDados = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: usu } = await supabase.from('usuarios').select('salao_id').eq('id', user.id).maybeSingle();
      if (!usu?.salao_id) return;
      const { data, error } = await supabase.from('agendamentos').select('*, profissionais(nome)').eq('salao_id', usu.salao_id).order('data', { ascending: true }).order('horario', { ascending: true });
      if (error) throw error;
      setAgendamentos(data || []);
    } catch (e) { console.error('Erro agenda:', e); } finally { setLoading(false); }
  };
  useEffect(() => { fetchDados(); }, []);
  useEffect(() => {
    const handleClick = () => setMenuAberto(null);
    if (menuAberto) document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [menuAberto]);

  const getDataLocal = (dataObj) => {
    if (!dataObj) return '';
    try {
      const d = new Date(dataObj);
      const ano = d.getFullYear(); const mes = String(d.getMonth() + 1).padStart(2, '0'); const dia = String(d.getDate()).padStart(2, '0');
      return `${ano}-${mes}-${dia}`;
    } catch { return ''; }
  };

  const agendamentosFiltrados = useMemo(() => {
    let res = agendamentos;
    if (busca.trim()) {
      const b = busca.toLowerCase();
      res = res.filter(a => a.cliente_nome?.toLowerCase().includes(b) || a.profissionais?.nome?.toLowerCase().includes(b) || a.servico?.toLowerCase().includes(b));
    }
    if (filtroStatus !== 'todos') res = res.filter(a => a.status === filtroStatus);
    const hojeStr = getDataLocal(new Date());
    const agoraHora = new Date().toLocaleTimeString('pt-BR', { hour12: false }).slice(0, 5);
    if (visualizacao === 'proximos') {
      return res.filter(a => {
        if (!a.data) return false;
        const dataItem = a.data.substring(0, 10);
        const eNoFuturo = dataItem > hojeStr || (dataItem === hojeStr && a.horario >= agoraHora);
        return eNoFuturo && (a.status === 'agendado' || a.status === 'confirmado');
      }).slice(0, 15);
    }
    if (visualizacao === 'dia') { const alvo = getDataLocal(selectedDate); return res.filter(a => a.data && a.data.substring(0, 10) === alvo); }
    if (visualizacao === 'semana') {
      const d = new Date(); const seg = new Date(d.setDate(d.getDate() - d.getDay() + 1)); const dom = new Date(d.setDate(d.getDate() - d.getDay() + 7));
      const segStr = getDataLocal(seg); const domStr = getDataLocal(dom);
      return res.filter(a => { if (!a.data) return false; const dItem = a.data.substring(0, 10); return dItem >= segStr && dItem <= domStr; });
    }
    if (visualizacao === 'todos') return res.filter(a => a.data && a.data >= hojeStr.substring(0, 8) + '01');
    return res;
  }, [agendamentos, busca, visualizacao, selectedDate, filtroStatus]);

  const formatDataCard = (dataString) => {
    if (!dataString) return '';
    try {
      const [ano, mes, dia] = dataString.split('-').map(Number);
      const dataAtual = new Date(ano, mes - 1, dia); const hoje = new Date(); hoje.setHours(0,0,0,0);
      if (dataAtual.getTime() === hoje.getTime()) return 'HOJE';
      const amanha = new Date(hoje); amanha.setDate(amanha.getDate() + 1);
      if (dataAtual.getTime() === amanha.getTime()) return 'AMANHÃ';
      return `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}`;
    } catch { return dataString; }
  };

  const confirmarAgendamento = async (id) => { await supabase.from('agendamentos').update({ status: 'confirmado' }).eq('id', id); fetchDados(); setMenuAberto(null); };
  const abrirCheckout = (agendamento) => { setAgendamentoCheckout(agendamento); setIsCheckoutOpen(true); setMenuAberto(null); };
  const cancelarAgendamento = async (id) => { if (confirm('Cancelar este agendamento?')) { await supabase.from('agendamentos').update({ status: 'cancelado' }).eq('id', id); fetchDados(); } setMenuAberto(null); };
  const removerBloqueio = async (id) => { if (confirm('Remover bloqueio?')) { await supabase.from('agendamentos').delete().eq('id', id); fetchDados(); } setMenuAberto(null); };
  const remarcarAgendamento = (agendamento) => { setAgendamentoSelecionado(agendamento); setIsRemarcarOpen(true); setMenuAberto(null); };

  const getStatusBadge = (status) => {
    const badges = {
      agendado: { color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', label: 'Agendado', icon: Clock },
      confirmado: { color: 'bg-green-500/10 text-green-400 border-green-500/20', label: 'Confirmado', icon: Check },
      concluido: { color: 'bg-white/5 text-gray-400 border-white/10', label: 'Concluído', icon: CheckCheck },
      bloqueado: { color: 'bg-orange-500/10 text-orange-400 border-orange-500/20', label: 'Bloqueado', icon: Lock },
      cancelado: { color: 'bg-red-500/10 text-red-400 border-red-500/20', label: 'Cancelado', icon: XCircle }
    };
    const badge = badges[status] || badges.agendado; const Icon = badge.icon;
    return <div className={`w-fit text-[9px] px-2 py-0.5 rounded-md font-bold uppercase border flex items-center gap-1.5 shadow-sm mt-2 ${badge.color}`}><Icon size={10} /> {badge.label}</div>;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white pb-24 md:pb-8">
      <NovoAgendamentoModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setAgendamentoParaEditar(null); }} onSuccess={() => { fetchDados(); setAgendamentoParaEditar(null); }} profissionalId={null} tipo={modalTipo} agendamentoParaEditar={agendamentoParaEditar} />
      <RemarcarModal isOpen={isRemarcarOpen} onClose={() => setIsRemarcarOpen(false)} onSuccess={fetchDados} agendamento={agendamentoSelecionado} />
      <ModalFinalizarAtendimento isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} agendamento={agendamentoCheckout} onSuccess={() => { fetchDados(); setIsCheckoutOpen(false); }} />
      <div className="w-full max-w-7xl mx-auto px-4 pt-6 md:px-8 md:pt-10 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div><h1 className="text-3xl md:text-4xl font-bold mb-1">Agenda</h1><p className="text-gray-400 text-sm">Gerenciamento completo</p></div>
          <div className="flex gap-3 w-full md:w-auto">
            <button onClick={() => { setAgendamentoParaEditar(null); setModalTipo('agendamento'); setIsModalOpen(true); }} className="flex-1 md:flex-none bg-gradient-to-r from-[#5B2EFF] to-[#7C3EFF] px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"><Plus size={20}/> Novo Agendamento</button>
            <button onClick={() => { setModalTipo('bloqueio'); setIsModalOpen(true); }} className="px-5 bg-[#1c1c24] rounded-2xl border border-white/10 text-gray-400 hover:text-orange-400" title="Bloquear"><Lock size={20}/></button>
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex bg-[#1c1c24] p-1.5 rounded-2xl border border-white/10 w-full md:w-auto overflow-x-auto">
            {[{ value: 'proximos', label: 'Próximos', icon: CalendarClock }, { value: 'dia', label: 'Dia', icon: Calendar }, { value: 'semana', label: 'Semana', icon: CalendarDays }, { value: 'todos', label: 'Todos', icon: Filter }].map(v => { const Icon = v.icon; return <button key={v.value} onClick={() => setVisualizacao(v.value)} className={`flex-1 md:flex-none px-4 py-2.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-2 whitespace-nowrap transition-all ${visualizacao === v.value ? 'bg-[#5B2EFF] text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}><Icon size={14} /> {v.label}</button>; })}
          </div>
          <div className="relative flex-1"><Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"/><input type="text" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar cliente..." className="w-full bg-[#1c1c24] border border-white/10 rounded-2xl pl-12 pr-12 py-3.5 text-white outline-none focus:border-purple-500/50"/>{busca && <button onClick={() => setBusca('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"><X size={18}/></button>}</div>
          <button onClick={() => setShowFiltros(!showFiltros)} className={`px-4 py-3.5 rounded-2xl font-bold flex items-center gap-2 border ${showFiltros || filtroStatus !== 'todos' ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : 'bg-[#1c1c24] text-gray-400 border-white/10'}`}><Filter size={18}/> <ChevronDown size={16} className={`transition-transform ${showFiltros ? 'rotate-180' : ''}`}/></button>
        </div>
        {showFiltros && <div className="bg-[#1c1c24] border border-white/10 rounded-2xl p-4 mb-6"><h3 className="text-sm font-bold text-white mb-3">Status</h3><div className="flex flex-wrap gap-2">{['todos', 'agendado', 'confirmado', 'concluido', 'bloqueado', 'cancelado'].map(status => <button key={status} onClick={() => setFiltroStatus(status)} className={`px-4 py-2 rounded-xl text-xs font-bold capitalize border ${filtroStatus === status ? 'bg-[#5B2EFF] text-white border-[#5B2EFF]' : 'bg-white/5 text-gray-400 border-transparent'}`}>{status}</button>)}</div></div>}
        {visualizacao === 'dia' && <div className="mb-6"><HorizontalCalendar selectedDate={selectedDate} onSelectDate={setSelectedDate} /></div>}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? <div className="col-span-full py-20 text-center"><Loader2 className="animate-spin mx-auto text-purple-500 mb-2" size={32}/><p className="text-gray-500 text-sm">Carregando...</p></div> : agendamentosFiltrados.length === 0 ? <div className="col-span-full py-12 flex flex-col items-center justify-center text-center border-2 border-dashed border-white/10 rounded-3xl bg-white/5"><CalendarDays size={40} className="text-gray-600 mb-3"/><p className="text-gray-400 font-medium">Nenhum agendamento</p></div> : agendamentosFiltrados.map(item => (
              <div key={item.id} className={`bg-[#15151a] relative rounded-3xl p-5 border shadow-lg hover:border-purple-500/30 transition-all group ${item.status === 'bloqueado' ? 'border-orange-500/20' : item.status === 'concluido' ? 'border-white/10 bg-white/5 opacity-70' : 'border-white/5'}`}>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-4 w-full">
                    <div className="bg-[#1c1c24] px-3 py-2 rounded-2xl text-center border border-white/5 min-w-[70px] h-fit"><span className={`text-[10px] block font-black uppercase mb-0.5 ${item.status === 'bloqueado' ? 'text-orange-500' : 'text-purple-400'}`}>{formatDataCard(item.data)}</span><span className="text-xl font-bold text-white">{item.horario?.slice(0,5)}</span></div>
                    <div className="flex-1 min-w-0"><h3 className={`font-bold text-base leading-tight truncate ${item.status === 'concluido' ? 'text-gray-400' : 'text-white'}`}>{item.cliente_nome}</h3><p className="text-xs text-gray-400 flex items-center gap-1.5 mt-1 truncate"><Scissors size={12}/> {item.servico}</p>{item.profissionais?.nome && <div className="flex items-center gap-2 mt-2"><div className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center text-[10px] text-purple-400 font-bold border border-purple-500/30"><User size={10} /></div><span className="text-[10px] text-purple-300 font-bold uppercase truncate">{item.profissionais.nome}</span></div>}{getStatusBadge(item.status)}</div>
                  </div>
                  <div className="flex flex-col items-end gap-2">{item.status !== 'cancelado' && <div className="relative"><button onClick={(e) => { e.stopPropagation(); setMenuAberto(menuAberto === item.id ? null : item.id); }} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"><MoreVertical size={18}/></button>{menuAberto === item.id && <div className="absolute right-0 top-full mt-2 w-48 bg-[#1c1c24] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden" onClick={(e) => e.stopPropagation()}>{item.status !== 'bloqueado' ? <>{item.status === 'agendado' && <button onClick={() => confirmarAgendamento(item.id)} className="w-full px-4 py-3 flex items-center gap-3 hover:bg-green-500/10 text-green-400 text-sm border-b border-white/5"><Check size={16}/> Confirmar</button>}{(item.status === 'agendado' || item.status === 'confirmado') && <button onClick={() => abrirCheckout(item)} className="w-full px-4 py-3 flex items-center gap-3 hover:bg-blue-500/10 text-blue-400 text-sm border-b border-white/5"><CheckCheck size={16}/> Concluir</button>}{item.telefone && <button onClick={() => window.open(`https://wa.me/55${item.telefone.replace(/\D/g,'')}`)} className="w-full px-4 py-3 flex items-center gap-3 hover:bg-green-500/10 text-green-400 text-sm border-b border-white/5"><MessageCircle size={16}/> WhatsApp</button>}{item.status !== 'concluido' && <button onClick={() => remarcarAgendamento(item)} className="w-full px-4 py-3 flex items-center gap-3 hover:bg-purple-500/10 text-purple-400 text-sm border-b border-white/5"><CalendarClock size={16}/> Remarcar</button>}{item.status !== 'concluido' && <button onClick={() => cancelarAgendamento(item.id)} className="w-full px-4 py-3 flex items-center gap-3 hover:bg-red-500/10 text-red-400 text-sm"><XCircle size={16}/> Cancelar</button>}</> : <button onClick={() => removerBloqueio(item.id)} className="w-full px-4 py-3 flex items-center gap-3 hover:bg-orange-500/10 text-orange-400 text-sm"><Trash2 size={16}/> Remover</button>}</div>}</div>}</div>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-white/5"><span className={`font-bold text-base ${item.status === 'concluido' ? 'text-gray-500 line-through' : 'text-emerald-400'}`}>R$ {parseFloat(item.valor_total || item.valor || 0).toFixed(2)}</span><div className="flex gap-2">{item.status === 'agendado' && <button onClick={() => confirmarAgendamento(item.id)} className="px-3 py-1.5 bg-green-500/10 text-green-400 rounded-lg border border-green-500/20 text-[10px] font-bold hover:bg-green-500/20 transition-all flex items-center gap-1"><Check size={12}/> Confirmar</button>}{(item.status === 'agendado' || item.status === 'confirmado') && <button onClick={() => abrirCheckout(item)} className="px-3 py-1.5 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20 text-[10px] font-bold hover:bg-blue-500/20 transition-all flex items-center gap-1"><CheckCheck size={12}/> Concluir</button>}</div></div>
              </div>
          ))}
        </div>
      </div>
    </div>
  );
};