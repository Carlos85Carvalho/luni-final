// src/screens/professional/ProfessionalDashboard.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../../services/supabase';
import { requestNotificationPermission } from '../../services/firebase';
import { HorizontalCalendar } from '../../components/ui/HorizontalCalendar';
import { NovoAgendamentoModal } from '../agenda/NovoAgendamentoModal';
import { RemarcarModal } from '../agenda/RemarcarModal';

import { 
  Calendar, Clock, LogOut, Scissors, Star, Bell, MessageCircle, Plus, Lock, Search, 
  TrendingUp, Trash2, History, CheckCheck, XCircle, Loader2,
  MoreVertical, CalendarClock, Check, Wallet, TrendingDown, Target,
  Users, DollarSign, BarChart3, PieChart, ArrowUpRight, ArrowDownRight,
  Award, Zap, Package
} from 'lucide-react';

export const ProfessionalDashboard = ({ profissional, onLogout }) => {
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('agenda'); 
  const [agendamentos, setAgendamentos] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date()); 
  const [busca, setBusca] = useState(''); 
  const [resumo, setResumo] = useState({ hoje: 0, mes: 0, proximos: 0, total_clientes: 0 });
  const [visualizacao, setVisualizacao] = useState('proximos'); 
  const [producaoMensal, setProducaoMensal] = useState([]);
  const [menuAberto, setMenuAberto] = useState(null);
  const [agendamentoParaEditar, setAgendamentoParaEditar] = useState(null);
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState(null);
  const [periodoFinanceiro, setPeriodoFinanceiro] = useState('mes'); // mes, trimestre, ano
  const [dadosFinanceiros, setDadosFinanceiros] = useState({
    mesAtual: 0,
    mesAnterior: 0,
    taxaCrescimento: 0,
    taxaConfirmacao: 0,
    taxaCancelamento: 0,
    servicosMaisRentaveis: [],
    horariosMaisProdutivos: [],
    evolucaoMensal: [],
    metaMensal: 5000,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRemarcarOpen, setIsRemarcarOpen] = useState(false);
  const [modalTipo, setModalTipo] = useState('agendamento'); 

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

  const calcularDadosFinanceiros = useCallback((agendamentos) => {
    const hoje = new Date();
    const mesAtual = hoje.getMonth();
    const anoAtual = hoje.getFullYear();
    
    // Dados do mês atual
    const agendamentosMesAtual = agendamentos.filter(a => {
      if (!a.data) return false;
      const d = new Date(a.data);
      return d.getMonth() === mesAtual && d.getFullYear() === anoAtual && a.status !== 'cancelado' && a.status !== 'bloqueado';
    });

    // Dados do mês anterior
    const mesAnterior = mesAtual === 0 ? 11 : mesAtual - 1;
    const anoMesAnterior = mesAtual === 0 ? anoAtual - 1 : anoAtual;
    const agendamentosMesAnterior = agendamentos.filter(a => {
      if (!a.data) return false;
      const d = new Date(a.data);
      return d.getMonth() === mesAnterior && d.getFullYear() === anoMesAnterior && a.status !== 'cancelado' && a.status !== 'bloqueado';
    });

    const totalMesAtual = agendamentosMesAtual.reduce((acc, a) => acc + Number(a.valor_total || a.valor || 0), 0);
    const totalMesAnterior = agendamentosMesAnterior.reduce((acc, a) => acc + Number(a.valor_total || a.valor || 0), 0);
    
    const taxaCrescimento = totalMesAnterior > 0 ? ((totalMesAtual - totalMesAnterior) / totalMesAnterior) * 100 : 0;

    // Taxa de confirmação
    const totalAgendados = agendamentosMesAtual.filter(a => a.status === 'agendado' || a.status === 'confirmado' || a.status === 'concluido').length;
    const totalConfirmados = agendamentosMesAtual.filter(a => a.status === 'confirmado' || a.status === 'concluido').length;
    const taxaConfirmacao = totalAgendados > 0 ? (totalConfirmados / totalAgendados) * 100 : 0;

    // Taxa de cancelamento
    const totalCancelados = agendamentos.filter(a => {
      if (!a.data) return false;
      const d = new Date(a.data);
      return d.getMonth() === mesAtual && d.getFullYear() === anoAtual && a.status === 'cancelado';
    }).length;
    const totalAtendimentos = totalAgendados + totalCancelados;
    const taxaCancelamento = totalAtendimentos > 0 ? (totalCancelados / totalAtendimentos) * 100 : 0;

    // Serviços mais rentáveis
    const servicosPorValor = {};
    agendamentosMesAtual.forEach(a => {
      const servico = a.servico || 'Outros';
      servicosPorValor[servico] = (servicosPorValor[servico] || 0) + Number(a.valor_total || a.valor || 0);
    });
    const servicosMaisRentaveis = Object.entries(servicosPorValor)
      .map(([servico, valor]) => ({ servico, valor }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 5);

    // Horários mais produtivos
    const horariosPorValor = {};
    agendamentosMesAtual.forEach(a => {
      if (!a.horario) return;
      const hora = parseInt(a.horario.split(':')[0]);
      const periodo = hora < 12 ? 'Manhã (6h-12h)' : hora < 18 ? 'Tarde (12h-18h)' : 'Noite (18h-22h)';
      horariosPorValor[periodo] = (horariosPorValor[periodo] || 0) + Number(a.valor_total || a.valor || 0);
    });
    const horariosMaisProdutivos = Object.entries(horariosPorValor)
      .map(([periodo, valor]) => ({ periodo, valor }))
      .sort((a, b) => b.valor - a.valor);

    // Evolução dos últimos 6 meses
    const evolucaoMensal = [];
    for (let i = 5; i >= 0; i--) {
      const mes = mesAtual - i;
      const ano = mes < 0 ? anoAtual - 1 : anoAtual;
      const mesAjustado = mes < 0 ? 12 + mes : mes;
      
      const totalMes = agendamentos
        .filter(a => {
          if (!a.data) return false;
          const d = new Date(a.data);
          return d.getMonth() === mesAjustado && d.getFullYear() === ano && a.status !== 'cancelado' && a.status !== 'bloqueado';
        })
        .reduce((acc, a) => acc + Number(a.valor_total || a.valor || 0), 0);
      
      const nomeMes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][mesAjustado];
      evolucaoMensal.push({ mes: nomeMes, valor: totalMes });
    }

    return {
      mesAtual: totalMesAtual,
      mesAnterior: totalMesAnterior,
      taxaCrescimento,
      taxaConfirmacao,
      taxaCancelamento,
      servicosMaisRentaveis,
      horariosMaisProdutivos,
      evolucaoMensal,
      metaMensal: 5000,
    };
  }, []);

  const fetchDados = useCallback(async () => {
    if (!profissional?.id) return;

    setLoading(true);
    const hoje = new Date();
    const hojeStr = getDataLocal(hoje);
    
    // Buscar últimos 6 meses para análises financeiras
    const seisMesesAtras = new Date(hoje.getFullYear(), hoje.getMonth() - 6, 1).toISOString();

    try {
      const { data: todosAgendamentos, error } = await supabase
        .from('agendamentos')
        .select('*')
        .eq('profissional_id', profissional.id)
        .gte('data', seisMesesAtras)
        .order('data', { ascending: true })
        .order('horario', { ascending: true });

      if (error) throw error;

      const agendaHoje = todosAgendamentos?.filter(a => a.data && a.data.substring(0,10) === hojeStr && a.status !== 'cancelado') || [];
      
      const proximos = todosAgendamentos?.filter(a => {
        if (!a.data) return false;
        const dataAg = new Date(`${a.data.substring(0,10)}T${a.horario}`);
        return dataAg >= hoje && (a.status === 'agendado' || a.status === 'confirmado');
      }) || [];

      // Filtrar apenas mês atual para o resumo principal
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString();
      const agendamentosMesAtual = todosAgendamentos?.filter(a => a.data && a.data >= inicioMes) || [];

      const totalMes = agendamentosMesAtual
        ?.filter(a => a.status !== 'cancelado' && a.status !== 'bloqueado')
        ?.reduce((acc, curr) => acc + Number(curr.valor_total || curr.valor || 0), 0) || 0;
      
      const totalHoje = agendaHoje
        ?.filter(a => a.status !== 'bloqueado')
        ?.reduce((acc, curr) => acc + Number(curr.valor_total || curr.valor || 0), 0) || 0;

      const clientesUnicos = new Set(
        agendamentosMesAtual
          ?.filter(a => a.status !== 'cancelado' && a.status !== 'bloqueado')
          ?.map(a => a.cliente_nome.toLowerCase())
      ).size;

      const producaoPorDia = {};
      agendamentosMesAtual?.forEach(ag => {
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

      // Calcular dados financeiros detalhados
      const dadosFinan = calcularDadosFinanceiros(todosAgendamentos || []);
      setDadosFinanceiros(dadosFinan);

    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
    }
  }, [profissional?.id, calcularDadosFinanceiros]);

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
      const seg = new Date(d.setDate(d.getDate() - d.getDate() + 1));
      const dom = new Date(d.setDate(d.getDate() - d.getDate() + 7));
      const segStr = getDataLocal(seg);
      const domStr = getDataLocal(dom);
      return resultado.filter(ag => ag.data && ag.data.substring(0, 10) >= segStr && ag.data.substring(0, 10) <= domStr);
    }
    
    if (visualizacao === 'todos') {
      const inicioMesStr = hoje.toISOString().substring(0, 8) + '01';
      return resultado.filter(a => a.data && a.data >= inicioMesStr);
    }

    return resultado;
  }, [agendamentos, busca, visualizacao, selectedDate]);

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

  const porcentagemMeta = (dadosFinanceiros.mesAtual / dadosFinanceiros.metaMensal) * 100;

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center text-white">
      <Loader2 className="animate-spin text-[#5B2EFF]" size={40} />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <NovoAgendamentoModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setAgendamentoParaEditar(null); }} onSuccess={handleAgendamentoSucesso} profissionalId={profissional.id} tipo={modalTipo} agendamentoParaEditar={agendamentoParaEditar} />
      <RemarcarModal isOpen={isRemarcarOpen} onClose={() => setIsRemarcarOpen(false)} onSuccess={fetchDados} agendamento={agendamentoSelecionado} />

      {/* Header */}
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

      <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-6 pb-24">
        
        {/* Tabs */}
        <div className="flex bg-[#1c1c24] p-1 rounded-2xl border border-white/10 mb-6 max-w-md mx-auto md:mx-0">
          <button onClick={() => setTab('agenda')} className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${tab === 'agenda' ? 'bg-[#5B2EFF] text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}><Calendar size={14}/> Agenda</button>
          <button onClick={() => setTab('financeiro')} className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${tab === 'financeiro' ? 'bg-[#5B2EFF] text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}><Wallet size={14}/> Financeiro</button>
        </div>

        {/* Aba Agenda */}
        {tab === 'agenda' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
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

            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mb-6">
              {['proximos', 'dia', 'semana', 'todos'].map(v => (
                <button key={v} onClick={() => setVisualizacao(v)} className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${visualizacao === v ? 'bg-[#5B2EFF] text-white shadow-lg' : 'bg-[#1c1c24] text-gray-400 border border-white/10'}`}>
                  {v === 'proximos' ? 'PRÓXIMOS' : v.toUpperCase()}
                </button>
              ))}
            </div>

            {visualizacao === 'dia' && <div className="mb-6"><HorizontalCalendar selectedDate={selectedDate} onSelectDate={setSelectedDate} /></div>}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {agendamentosFiltrados.map((item) => (
                <div key={item.id} className={`bg-[#15151a] relative rounded-2xl p-4 border shadow-lg transition-all hover:border-purple-500/30 ${item.status === 'bloqueado' ? 'border-orange-500/20 bg-orange-500/5' : 'border-white/5'}`}>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex flex-col items-center justify-center bg-[#1c1c24] rounded-xl px-3 py-2 border border-white/10 min-w-[60px]">
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

        {/* Aba Financeiro - MELHORADA */}
        {tab === 'financeiro' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-6">
            
            {/* Card principal - Produção Mensal */}
            <div className="bg-gradient-to-br from-emerald-600/20 via-green-600/10 to-teal-600/10 border border-emerald-500/30 p-8 rounded-3xl text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
                  <TrendingUp size={32} className="text-emerald-300"/>
                </div>
                <p className="text-emerald-300 text-xs font-bold uppercase mb-2">Produção Mensal</p>
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-2">
                  R$ {dadosFinanceiros.mesAtual.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                </h2>
                <div className="flex items-center justify-center gap-2 mt-3">
                  {dadosFinanceiros.taxaCrescimento >= 0 ? (
                    <div className="flex items-center gap-1 text-emerald-300 text-sm font-bold">
                      <ArrowUpRight size={16} />
                      <span>+{dadosFinanceiros.taxaCrescimento.toFixed(1)}%</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-red-300 text-sm font-bold">
                      <ArrowDownRight size={16} />
                      <span>{dadosFinanceiros.taxaCrescimento.toFixed(1)}%</span>
                    </div>
                  )}
                  <span className="text-xs text-emerald-200/60">vs mês anterior</span>
                </div>

                {/* Barra de progresso da meta */}
                <div className="mt-6 bg-white/10 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min(porcentagemMeta, 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-emerald-200/80 mt-2">
                  {porcentagemMeta.toFixed(0)}% da meta mensal (R$ {dadosFinanceiros.metaMensal.toLocaleString('pt-BR')})
                </p>
              </div>
            </div>

            {/* Cards de métricas principais */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#1c1c24] border border-white/10 p-5 rounded-2xl hover:border-purple-500/30 transition-all">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <DollarSign size={18} className="text-purple-400"/>
                  </div>
                  <p className="text-[10px] text-gray-400 uppercase font-bold">Ticket Médio</p>
                </div>
                <p className="text-2xl font-bold text-white">
                  R$ {resumo.total_clientes > 0 ? (dadosFinanceiros.mesAtual / resumo.total_clientes).toFixed(2) : '0.00'}
                </p>
              </div>

              <div className="bg-[#1c1c24] border border-white/10 p-5 rounded-2xl hover:border-blue-500/30 transition-all">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Users size={18} className="text-blue-400"/>
                  </div>
                  <p className="text-[10px] text-gray-400 uppercase font-bold">Clientes</p>
                </div>
                <p className="text-2xl font-bold text-white">{resumo.total_clientes}</p>
              </div>

              <div className="bg-[#1c1c24] border border-white/10 p-5 rounded-2xl hover:border-green-500/30 transition-all">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <CheckCheck size={18} className="text-green-400"/>
                  </div>
                  <p className="text-[10px] text-gray-400 uppercase font-bold">Confirmação</p>
                </div>
                <p className="text-2xl font-bold text-white">{dadosFinanceiros.taxaConfirmacao.toFixed(0)}%</p>
              </div>

              <div className="bg-[#1c1c24] border border-white/10 p-5 rounded-2xl hover:border-red-500/30 transition-all">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-red-500/10 rounded-lg">
                    <XCircle size={18} className="text-red-400"/>
                  </div>
                  <p className="text-[10px] text-gray-400 uppercase font-bold">Cancelamento</p>
                </div>
                <p className="text-2xl font-bold text-white">{dadosFinanceiros.taxaCancelamento.toFixed(0)}%</p>
              </div>
            </div>

            {/* Evolução Mensal (gráfico de linha) */}
            <div className="bg-[#1c1c24] border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-white font-bold flex items-center gap-2 text-sm">
                  <BarChart3 size={16} className="text-purple-400"/> 
                  Evolução dos Últimos 6 Meses
                </h3>
              </div>
              <div className="flex items-end justify-between gap-2 h-48">
                {dadosFinanceiros.evolucaoMensal.map((item, idx) => {
                  const maxValor = Math.max(...dadosFinanceiros.evolucaoMensal.map(m => m.valor));
                  const altura = maxValor > 0 ? (item.valor / maxValor) * 100 : 0;
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center group relative">
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-purple-600 text-white px-2 py-1 rounded text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        R$ {item.valor.toFixed(2)}
                      </div>
                      <div 
                        className="w-full bg-gradient-to-t from-purple-600 to-purple-400 rounded-t-lg transition-all group-hover:from-purple-500 group-hover:to-purple-300" 
                        style={{ height: `${Math.max(5, altura)}%` }}
                      ></div>
                      <span className="text-[10px] text-gray-500 mt-2 font-bold">{item.mes}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Serviços Mais Rentáveis */}
              <div className="bg-[#1c1c24] border border-white/10 rounded-2xl p-6">
                <h3 className="text-white font-bold mb-4 text-sm flex items-center gap-2">
                  <Award size={16} className="text-yellow-400"/> 
                  Serviços Mais Rentáveis
                </h3>
                <div className="space-y-3">
                  {dadosFinanceiros.servicosMaisRentaveis.map((item, idx) => {
                    const maxValor = dadosFinanceiros.servicosMaisRentaveis[0]?.valor || 1;
                    const porcentagem = (item.valor / maxValor) * 100;
                    return (
                      <div key={idx} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-300 font-medium truncate flex-1">{item.servico}</span>
                          <span className="text-sm font-bold text-emerald-400 ml-2">R$ {item.valor.toFixed(2)}</span>
                        </div>
                        <div className="bg-white/5 rounded-full h-2 overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-yellow-500 to-orange-400 h-full rounded-full transition-all duration-1000"
                            style={{ width: `${porcentagem}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                  {dadosFinanceiros.servicosMaisRentaveis.length === 0 && (
                    <p className="text-gray-500 text-sm text-center py-4">Nenhum serviço registrado este mês</p>
                  )}
                </div>
              </div>

              {/* Horários Mais Produtivos */}
              <div className="bg-[#1c1c24] border border-white/10 rounded-2xl p-6">
                <h3 className="text-white font-bold mb-4 text-sm flex items-center gap-2">
                  <Zap size={16} className="text-cyan-400"/> 
                  Horários Mais Produtivos
                </h3>
                <div className="space-y-4">
                  {dadosFinanceiros.horariosMaisProdutivos.map((item, idx) => {
                    const maxValor = dadosFinanceiros.horariosMaisProdutivos[0]?.valor || 1;
                    const porcentagem = (item.valor / maxValor) * 100;
                    const cores = ['from-cyan-500 to-blue-400', 'from-purple-500 to-pink-400', 'from-orange-500 to-red-400'];
                    return (
                      <div key={idx} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-300 font-medium">{item.periodo}</span>
                          <span className="text-sm font-bold text-emerald-400">R$ {item.valor.toFixed(2)}</span>
                        </div>
                        <div className="bg-white/5 rounded-full h-2 overflow-hidden">
                          <div 
                            className={`bg-gradient-to-r ${cores[idx % cores.length]} h-full rounded-full transition-all duration-1000`}
                            style={{ width: `${porcentagem}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                  {dadosFinanceiros.horariosMaisProdutivos.length === 0 && (
                    <p className="text-gray-500 text-sm text-center py-4">Nenhum dado disponível</p>
                  )}
                </div>
              </div>
            </div>

            {/* Produção Diária */}
            <div className="bg-[#1c1c24] border border-white/10 rounded-2xl p-6">
              <h3 className="text-white font-bold mb-6 flex items-center gap-2 text-sm">
                <History size={16} className="text-purple-400"/> 
                Produção Diária do Mês
              </h3>
              <div className="flex items-end justify-between gap-1 h-32 overflow-x-auto">
                {producaoMensal.map((item, idx) => {
                  const maxValor = Math.max(...producaoMensal.map(p => p.valor));
                  const altura = maxValor > 0 ? (item.valor / maxValor) * 100 : 0;
                  return (
                    <div key={idx} className="flex-shrink-0 flex flex-col items-center group relative min-w-[20px]">
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-purple-600 text-white px-2 py-1 rounded text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        R$ {item.valor.toFixed(2)}
                      </div>
                      <div 
                        className="w-full bg-gradient-to-t from-purple-600 to-purple-400 rounded-t-sm transition-all group-hover:from-purple-500 group-hover:to-purple-300" 
                        style={{ height: `${Math.max(10, altura)}%`, minWidth: '20px' }}
                      ></div>
                      <span className="text-[9px] text-gray-500 mt-2">{item.dia}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Últimos Atendimentos */}
            <div className="bg-[#1c1c24] border border-white/10 rounded-2xl p-6">
              <h3 className="text-white font-bold mb-4 text-sm flex items-center gap-2">
                <Package size={16} className="text-blue-400"/> 
                Últimos Atendimentos Concluídos
              </h3>
              <div className="space-y-2">
                {agendamentos.filter(a => a.status === 'concluido').slice(0, 8).map((item) => (
                  <div key={item.id} className="flex justify-between items-center py-3 border-b border-white/5 last:border-0 hover:bg-white/5 px-3 rounded-lg transition-colors">
                    <div className="flex-1">
                      <p className="text-white font-bold text-sm">{item.cliente_nome}</p>
                      <p className="text-gray-500 text-xs flex items-center gap-1 mt-1">
                        <Scissors size={10}/> {item.servico} • {item.data?.substring(8,10)}/{item.data?.substring(5,7)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-emerald-400 font-bold text-sm">R$ {Number(item.valor_total || item.valor || 0).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
                {agendamentos.filter(a => a.status === 'concluido').length === 0 && (
                  <p className="text-gray-500 text-sm text-center py-8">Nenhum atendimento concluído ainda</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};