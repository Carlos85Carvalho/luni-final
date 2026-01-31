import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../../services/supabase';
import { requestNotificationPermission } from '../../services/firebase';
import { HorizontalCalendar } from '../../components/ui/HorizontalCalendar';
import { NovoAgendamentoModal } from '../agenda/NovoAgendamentoModal';
import { RemarcarModal } from '../agenda/RemarcarModal';

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
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRemarcarOpen, setIsRemarcarOpen] = useState(false);
  const [modalTipo, setModalTipo] = useState('agendamento'); 

  // Função Auxiliar Segura para Data
  const getDataLocal = (dataObj) => {
    if (!dataObj) return '';
    try {
      const d = new Date(dataObj);
      const ano = d.getFullYear();
      const mes = String(d.getMonth() + 1).padStart(2, '0');
      const dia = String(d.getDate()).padStart(2, '0');
      return `${ano}-${mes}-${dia}`;
    } catch { return ''; }
  };

  const fetchDados = useCallback(async () => {
    if (!profissional?.id) return;

    setLoading(true);
    const hoje = new Date();
    const hojeStr = getDataLocal(hoje);
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

      // Filtros seguros
      const agendaHoje = todosAgendamentos?.filter(a => a.data && a.data.substring(0,10) === hojeStr && a.status !== 'cancelado') || [];
      
      const proximos = todosAgendamentos?.filter(a => {
        if (!a.data) return false;
        const dataAg = new Date(`${a.data.substring(0,10)}T${a.horario}`);
        return dataAg >= hoje && (a.status === 'agendado' || a.status === 'confirmado');
      }) || [];

      const totalMes = todosAgendamentos
        ?.filter(a => a.status !== 'cancelado' && a.status !== 'bloqueado')
        ?.reduce((acc, curr) => acc + Number(curr.valor_total || curr.valor || 0), 0) || 0;
      
      const totalHoje = agendaHoje
        ?.filter(a => a.status !== 'bloqueado')
        ?.reduce((acc, curr) => acc + Number(curr.valor_total || curr.valor || 0), 0) || 0;

      const clientesUnicos = new Set(
        todosAgendamentos
          ?.filter(a => a.status !== 'cancelado' && a.status !== 'bloqueado')
          ?.map(a => a.cliente_nome.toLowerCase())
      ).size;

      const producaoPorDia = {};
      todosAgendamentos?.forEach(ag => {
        if (ag.status !== 'cancelado' && ag.status !== 'bloqueado' && ag.data) {
          const dia = parseInt(ag.data.substring(8, 10));
          producaoPorDia[dia] = (producaoPorDia[dia] || 0) + Number(ag.valor_total || ag.valor || 0);
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
  }, [profissional?.id]);

  useEffect(() => { fetchDados(); }, [fetchDados]);

  useEffect(() => {
    const handleClickOutside = () => setMenuAberto(null);
    if (menuAberto) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [menuAberto]);

  const confirmarAgendamento = async (id) => { await supabase.from('agendamentos').update({ status: 'confirmado' }).eq('id', id); fetchDados(); setMenuAberto(null); };
  const concluirAtendimento = async (id) => { await supabase.from('agendamentos').update({ status: 'concluido' }).eq('id', id); fetchDados(); setMenuAberto(null); };
  const cancelarAgendamento = async (id) => { if (!confirm('Tem certeza que deseja cancelar?')) return; await supabase.from('agendamentos').update({ status: 'cancelado' }).eq('id', id); fetchDados(); setMenuAberto(null); };
  const removerBloqueio = async (id) => { if (!confirm('Remover este bloqueio?')) return; await supabase.from('agendamentos').delete().eq('id', id); fetchDados(); setMenuAberto(null); };
  
  const remarcarAgendamento = (agendamento) => {
    setAgendamentoSelecionado(agendamento);
    setIsRemarcarOpen(true);
    setMenuAberto(null);
  };

  const abrirNovoAgendamento = () => { setAgendamentoParaEditar(null); setModalTipo('agendamento'); setIsModalOpen(true); };
  const abrirBloqueio = () => { setModalTipo('bloqueio'); setIsModalOpen(true); };
  const handleAgendamentoSucesso = () => { setIsModalOpen(false); setAgendamentoParaEditar(null); fetchDados(); };

  const agendamentosFiltrados = useMemo(() => {
    let resultado = agendamentos;

    if (busca.trim()) {
      resultado = resultado.filter(ag => ag.cliente_nome.toLowerCase().includes(busca.toLowerCase()) || ag.servico?.toLowerCase().includes(busca.toLowerCase()));
    }

    if (filtroStatus !== 'todos') {
      resultado = resultado.filter(ag => ag.status === filtroStatus);
    }

    const hoje = new Date();
    const hojeStr = getDataLocal(hoje);
    const agoraHora = hoje.toLocaleTimeString('pt-BR', { hour12: false }).slice(0, 5);

    if (visualizacao === 'proximos') {
      return resultado.filter(ag => {
        if (!ag.data) return false;
        const d = ag.data.substring(0, 10);
        return (d > hojeStr || (d === hojeStr && ag.horario >= agoraHora)) && ag.status !== 'concluido' && ag.status !== 'cancelado';
      }).slice(0, 10);
    }
    
    if (visualizacao === 'dia') {
      const alvo = getDataLocal(selectedDate);
      return resultado.filter(ag => ag.data && ag.data.substring(0, 10) === alvo);
    }
    
    if (visualizacao === 'semana') {
      const d = new Date();
      const seg = new Date(d.setDate(d.getDate() - d.getDay() + 1));
      const dom = new Date(d.setDate(d.getDate() - d.getDay() + 7));
      const segStr = getDataLocal(seg);
      const domStr = getDataLocal(dom);
      return resultado.filter(ag => ag.data && ag.data.substring(0, 10) >= segStr && ag.data.substring(0, 10) <= domStr);
    }
    
    if (visualizacao === 'todos') {
      const inicioMesStr = hoje.toISOString().substring(0, 8) + '01';
      return resultado.filter(a => a.data && a.data >= inicioMesStr);
    }

    return resultado;
  }, [agendamentos, busca, filtroStatus, visualizacao, selectedDate]);

  const formatDataCard = (dataString) => {
    if (!dataString) return '';
    try {
      const [ano, mes, dia] = dataString.split('-').map(Number);
      const dataAtual = new Date(ano, mes - 1, dia);
      const hoje = new Date(); hoje.setHours(0,0,0,0);
      if (dataAtual.getTime() === hoje.getTime()) return 'HOJE';
      const amanha = new Date(hoje); amanha.setDate(amanha.getDate() + 1);
      if (dataAtual.getTime() === amanha.getTime()) return 'AMANHÃ';
      return `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}`;
    } catch { return ''; }
  };

  const getStatusBadge = (status) => {
    const badges = {
      agendado: { color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: Clock, label: 'Agendado' },
      confirmado: { color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: Check, label: 'Confirmado' },
      concluido: { color: 'bg-white/5 text-gray-400 border-white/10', icon: CheckCheck, label: 'Concluído' },
      bloqueado: { color: 'bg-orange-500/10 text-orange-400 border-orange-500/20', icon: Lock, label: 'Bloqueado' },
      cancelado: { color: 'bg-red-500/10 text-red-400 border-red-500/20', icon: XCircle, label: 'Cancelado' }
    };
    const badge = badges[status] || badges.agendado;
    const Icon = badge.icon;
    return (
      <div className={`text-[9px] px-2 py-0.5 rounded-md font-bold uppercase border flex items-center gap-1 shadow-sm mt-1 w-fit ${badge.color}`}>
        <Icon size={10} /> {badge.label}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <NovoAgendamentoModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setAgendamentoParaEditar(null); }} onSuccess={handleAgendamentoSucesso} profissionalId={profissional.id} tipo={modalTipo} agendamentoParaEditar={agendamentoParaEditar} />
      <RemarcarModal isOpen={isRemarcarOpen} onClose={() => setIsRemarcarOpen(false)} onSuccess={fetchDados} agendamento={agendamentoSelecionado} />

      {/* HEADER FIXO TOPO */}
      <div className="bg-[#15151a] border-b border-white/5 pt-6 pb-6 px-4 md:px-8">
        <div className="w-full max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#5B2EFF] to-cyan-500 flex items-center justify-center text-xl font-bold text-white shadow-lg border border-white/10">
                {profissional.nome?.charAt(0).toUpperCase()}
              </div>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[#15151a]"></div>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Olá, {profissional.nome?.split(' ')[0]}</h1>
              <p className="text-xs text-gray-400 flex items-center gap-1"><Star size={10} className="text-yellow-500 fill-yellow-500"/> Online agora</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => requestNotificationPermission(profissional.id)} className="p-2.5 bg-white/5 rounded-xl hover:bg-purple-500/20 text-gray-400 hover:text-purple-400 transition-all border border-white/5"><Bell size={18}/></button>
            <button onClick={onLogout} className="p-2.5 bg-white/5 rounded-xl hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-all border border-white/5"><LogOut size={18}/></button>
          </div>
        </div>
      </div>

      {/* CONTAINER RESPONSIVO */}
      <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-6 pb-24">
        
        {/* SELETOR DE ABAS */}
        <div className="flex bg-[#1c1c24] p-1 rounded-2xl border border-white/10 mb-6 max-w-md mx-auto md:mx-0">
          <button onClick={() => setTab('agenda')} className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${tab === 'agenda' ? 'bg-[#5B2EFF] text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}><Calendar size={14}/> Agenda</button>
          <button onClick={() => setTab('financeiro')} className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${tab === 'financeiro' ? 'bg-[#5B2EFF] text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}><Wallet size={14}/> Financeiro</button>
        </div>

        {tab === 'agenda' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Grid de Ações e Filtros */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="flex gap-3">
                <button onClick={abrirNovoAgendamento} className="flex-1 bg-gradient-to-r from-[#5B2EFF] to-[#7C3EFF] hover:from-[#4a24cc] hover:to-[#6a30dd] text-white font-bold py-3 rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95"><Plus size={18} /> Novo Agendamento</button>
                <button onClick={abrirBloqueio} className="bg-[#1c1c24] border border-white/10 text-gray-400 hover:text-orange-400 px-4 rounded-2xl flex items-center justify-center transition-all active:scale-95"><Lock size={18} /></button>
              </div>
              <div className="relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"/>
                <input type="text" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar cliente..." className="w-full bg-[#1c1c24] border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-white outline-none focus:border-purple-500/50 transition-all text-sm" />
              </div>
            </div>

            {/* Filtros de Data */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mb-6">
              {['proximos', 'dia', 'semana', 'todos'].map(v => (
                <button key={v} onClick={() => setVisualizacao(v)} className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${visualizacao === v ? 'bg-[#5B2EFF] text-white shadow-lg' : 'bg-[#1c1c24] text-gray-400 border border-white/10'}`}>
                  {v === 'proximos' ? 'PRÓXIMOS' : v.toUpperCase()}
                </button>
              ))}
            </div>

            {visualizacao === 'dia' && <div className="mb-6"><HorizontalCalendar selectedDate={selectedDate} onSelectDate={setSelectedDate} /></div>}

            {/* LISTA DE AGENDAMENTOS (GRID RESPONSIVO) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {agendamentosFiltrados.map((item) => (
                <div key={item.id} className={`bg-[#15151a] relative rounded-2xl p-4 border shadow-lg transition-all hover:border-purple-500/30 ${item.status === 'bloqueado' ? 'border-orange-500/20 bg-orange-500/5' : 'border-white/5'}`}>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex flex-col items-center justify-center bg-[#1c1c24] rounded-xl px-3 py-2 border border-white/10 min-w-[60px]">
                        <span className={`text-[9px] font-black uppercase ${item.status === 'bloqueado' ? 'text-orange-500' : 'text-[#5B2EFF]'}`}>{formatDataCard(item.data)}</span>
                        <span className="text-base font-bold text-white mt-0.5">{item.horario.slice(0, 5)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold truncate text-white">{item.cliente_nome}</h3>
                        <p className="text-gray-400 text-xs truncate mt-0.5">{item.status === 'bloqueado' ? <Lock size={10} className="inline mr-1"/> : <Scissors size={10} className="inline mr-1"/>} {item.servico}</p>
                        {getStatusBadge(item.status)}
                      </div>
                    </div>
                    
                    <div className="relative">
                      <button onClick={(e) => { e.stopPropagation(); setMenuAberto(menuAberto === item.id ? null : item.id); }} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white"><MoreVertical size={16}/></button>
                      {menuAberto === item.id && (
                        <div className="absolute right-0 top-full mt-2 w-48 bg-[#1c1c24] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                          {item.status !== 'bloqueado' ? (
                            <>
                              {item.status === 'agendado' && <button onClick={() => confirmarAgendamento(item.id)} className="w-full px-4 py-3 flex items-center gap-3 hover:bg-green-500/10 text-green-400 text-xs font-bold border-b border-white/5"><Check size={14}/> Confirmar</button>}
                              {(item.status === 'agendado' || item.status === 'confirmado') && <button onClick={() => concluirAtendimento(item.id)} className="w-full px-4 py-3 flex items-center gap-3 hover:bg-blue-500/10 text-blue-400 text-xs font-bold border-b border-white/5"><CheckCheck size={14}/> Concluir</button>}
                              {item.telefone && <button onClick={() => window.open(`https://wa.me/55${item.telefone.replace(/\D/g,'')}`)} className="w-full px-4 py-3 flex items-center gap-3 hover:bg-green-500/10 text-green-400 text-xs font-bold border-b border-white/5"><MessageCircle size={14}/> WhatsApp</button>}
                              {item.status !== 'concluido' && <button onClick={() => remarcarAgendamento(item)} className="w-full px-4 py-3 flex items-center gap-3 hover:bg-purple-500/10 text-purple-400 text-xs font-bold border-b border-white/5"><CalendarClock size={14}/> Remarcar</button>}
                              {item.status !== 'concluido' && <button onClick={() => cancelarAgendamento(item.id)} className="w-full px-4 py-3 flex items-center gap-3 hover:bg-red-500/10 text-red-400 text-xs font-bold"><XCircle size={14}/> Cancelar</button>}
                            </>
                          ) : (
                            <button onClick={() => removerBloqueio(item.id)} className="w-full px-4 py-3 flex items-center gap-3 hover:bg-orange-500/10 text-orange-400 text-xs font-bold"><Trash2 size={14}/> Remover Bloqueio</button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center pt-3 border-t border-white/5">
                    <span className={`text-sm font-bold ${item.status === 'concluido' ? 'text-gray-500 line-through' : 'text-emerald-400'}`}>R$ {Number(item.valor_total || item.valor || 0).toFixed(2)}</span>
                    <div className="flex gap-2">
                      {item.status === 'agendado' && <button onClick={() => confirmarAgendamento(item.id)} className="px-3 py-1.5 bg-green-500/10 text-green-400 rounded-lg border border-green-500/20 text-[10px] font-bold hover:bg-green-500/20 transition-all flex items-center gap-1"><Check size={12}/> Confirmar</button>}
                      {(item.status === 'agendado' || item.status === 'confirmado') && <button onClick={() => concluirAtendimento(item.id)} className="px-3 py-1.5 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20 text-[10px] font-bold hover:bg-blue-500/20 transition-all flex items-center gap-1"><CheckCheck size={12}/> Concluir</button>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'financeiro' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500 grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* CARD PRODUÇÃO (Destaque) */}
            <div className="bg-gradient-to-br from-emerald-600/20 via-green-600/10 to-teal-600/10 border border-emerald-500/30 p-8 rounded-3xl text-center relative overflow-hidden md:col-span-2">
              <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/30"><TrendingUp size={32} className="text-emerald-300"/></div>
                <p className="text-emerald-300 text-xs font-bold uppercase mb-2">Produção Mensal</p>
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-2">R$ {resumo.mes.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</h2>
                <p className="text-xs text-emerald-200/60">Total acumulado neste mês</p>
              </div>
            </div>

            {/* KPIS MENORES */}
            <div className="grid grid-cols-2 gap-4 md:col-span-2 lg:col-span-1">
              <div className="bg-[#1c1c24] border border-white/10 p-5 rounded-2xl">
                <p className="text-[10px] text-gray-400 uppercase font-bold mb-2">Ticket Médio</p>
                <p className="text-2xl font-bold text-white">R$ {resumo.total_clientes > 0 ? (resumo.mes / resumo.total_clientes).toFixed(2) : '0.00'}</p>
              </div>
              <div className="bg-[#1c1c24] border border-white/10 p-5 rounded-2xl">
                <p className="text-[10px] text-gray-400 uppercase font-bold mb-2">Clientes</p>
                <p className="text-2xl font-bold text-white">{resumo.total_clientes}</p>
              </div>
            </div>

            {/* GRÁFICO BARRAS */}
            <div className="bg-[#1c1c24] border border-white/10 rounded-2xl p-6 md:col-span-2 lg:col-span-1">
              <h3 className="text-white font-bold mb-6 flex items-center gap-2 text-sm"><History size={16} className="text-purple-400"/> Produção Diária</h3>
              <div className="flex items-end justify-between gap-1 h-32">
                {producaoMensal.slice(-14).map((item, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center group">
                    <div className="w-full bg-gradient-to-t from-purple-600 to-purple-400 rounded-t-sm transition-all group-hover:from-purple-500 group-hover:to-purple-300" style={{ height: `${Math.max(10, (item.valor / (Math.max(...producaoMensal.map(p => p.valor)) || 1)) * 100)}%` }}></div>
                    <span className="text-[9px] text-gray-500 mt-2">{item.dia}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* LISTA ÚLTIMOS */}
            <div className="bg-[#1c1c24] border border-white/10 rounded-2xl p-6 md:col-span-2">
              <h3 className="text-white font-bold mb-4 text-sm">Últimos Atendimentos</h3>
              <div className="space-y-2">
                {agendamentos.filter(a => a.status === 'concluido').slice(0, 5).map((item) => (
                  <div key={item.id} className="flex justify-between items-center py-3 border-b border-white/5 last:border-0 hover:bg-white/5 px-2 rounded-lg transition-colors">
                    <div><p className="text-white font-bold text-sm">{item.cliente_nome}</p><p className="text-gray-500 text-xs">{item.servico}</p></div>
                    <div className="text-right"><p className="text-emerald-400 font-bold text-sm">R$ {Number(item.valor_total || item.valor || 0).toFixed(2)}</p><p className="text-gray-600 text-[10px]">{formatDataCard(item.data)}</p></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};