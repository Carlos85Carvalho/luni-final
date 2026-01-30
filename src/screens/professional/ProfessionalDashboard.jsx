import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase'; 
import { 
  Calendar, Clock, User, DollarSign, LogOut, CheckCircle, 
  MapPin, ChevronRight, Wallet, Scissors, TrendingUp, Bell,
  Plus, X, Save, Lock, Unlock, Edit2, Trash2, CalendarPlus,
  AlertCircle, Check
} from 'lucide-react';

export const ProfessionalDashboard = ({ profissional, onLogout }) => {
  const [setLoading] = useState(true);
  const [tab, setTab] = useState('agenda');
  const [agendamentos, setAgendamentos] = useState([]);
  const [bloqueios, setBloqueios] = useState([]);
  const [resumo, setResumo] = useState({ hoje: 0, mes: 0, atendimentos: 0 });
  
  // Estados para modais
  const [showNovoAgendamento, setShowNovoAgendamento] = useState(false);
  const [showNovoBloqueio, setShowNovoBloqueio] = useState(false);
  
  // Estados para formulários
  const [novoAgendamento, setNovoAgendamento] = useState({
    cliente_nome: '',
    servico: '',
    data: '',
    horario: '',
    valor: '',
    telefone: ''
  });
  
  const [novoBloqueio, setNovoBloqueio] = useState({
    motivo: '',
    data: '',
    horario_inicio: '',
    horario_fim: '',
    dia_completo: false
  });

  // Busca dados do profissional
  useEffect(() => {
    fetchDados();
  }, [profissional.id]);

  const fetchDados = async () => {
    setLoading(true);
    
    // Datas
    const hoje = new Date();
    const hojeISO = hoje.toLocaleDateString('en-CA');
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString();

    // 1. Busca Produção do Mês
    const { data: producaoMes } = await supabase
      .from('agendamentos')
      .select('valor, valor_total')
      .eq('profissional_id', profissional.id)
      .gte('data', inicioMes)
      .neq('status', 'cancelado');

    // 2. Busca Agendamentos de HOJE
    const { data: agendaHoje } = await supabase
      .from('agendamentos')
      .select('valor, valor_total')
      .eq('profissional_id', profissional.id)
      .eq('data', hojeISO)
      .neq('status', 'cancelado');

    // 3. Busca PRÓXIMOS AGENDAMENTOS (Lista principal)
    const { data: proximosAgendamentos } = await supabase
      .from('agendamentos')
      .select('*')
      .eq('profissional_id', profissional.id)
      .gte('data', hojeISO) 
      .neq('status', 'cancelado')
      .order('data', { ascending: true })
      .order('horario', { ascending: true })
      .limit(10);

    // Busca Bloqueios de HOJE
    const { data: bloqueiosHoje } = await supabase
      .from('bloqueios')
      .select('*')
      .eq('profissional_id', profissional.id)
      .eq('data', hojeISO)
      .order('horario_inicio', { ascending: true });

    // Cálculos
    const totalMes = producaoMes?.reduce((acc, curr) => acc + (curr.valor_total || curr.valor || 0), 0) || 0;
    const totalHoje = agendaHoje?.reduce((acc, curr) => acc + (curr.valor_total || curr.valor || 0), 0) || 0;
    
    // CORREÇÃO: O total de atendimentos deve considerar a lista de próximos ou do mês
    const totalAtendimentosFuturos = proximosAgendamentos?.length || 0;

    setAgendamentos(proximosAgendamentos || []);
    setBloqueios(bloqueiosHoje || []);
    setResumo({
      hoje: totalHoje,
      mes: totalMes,
      atendimentos: totalAtendimentosFuturos // Mostra quantos clientes tem na fila
    });
    setLoading(false);
  };

  const concluirAtendimento = async (id) => {
    const { error } = await supabase
      .from('agendamentos')
      .update({ status: 'concluido' })
      .eq('id', id);

    if (!error) {
      setAgendamentos(prev => prev.map(a => a.id === id ? { ...a, status: 'concluido' } : a));
    }
  };

  const formatarData = (dataString) => {
    if (!dataString) return '';
    const [ano, mes, dia] = dataString.split('-');
    return `${dia}/${mes}`;
  };

  const isHoje = (dataString) => {
    const hoje = new Date().toLocaleDateString('en-CA');
    return dataString === hoje;
  };

  const criarNovoAgendamento = async () => {
    if (!novoAgendamento.cliente_nome || !novoAgendamento.data || !novoAgendamento.horario) {
      alert('Preencha os campos obrigatórios');
      return;
    }

    const { data, error } = await supabase
      .from('agendamentos')
      .insert([{
        profissional_id: profissional.id,
        cliente_nome: novoAgendamento.cliente_nome,
        servico: novoAgendamento.servico,
        data: novoAgendamento.data,
        horario: novoAgendamento.horario,
        valor: parseFloat(novoAgendamento.valor) || 0,
        telefone: novoAgendamento.telefone,
        status: 'agendado'
      }]);

    if (!error) {
      setShowNovoAgendamento(false);
      setNovoAgendamento({ cliente_nome: '', servico: '', data: '', horario: '', valor: '', telefone: '' });
      fetchDados();
    }
  };

  const criarBloqueio = async () => {
    if (!novoBloqueio.data || (!novoBloqueio.dia_completo && (!novoBloqueio.horario_inicio || !novoBloqueio.horario_fim))) {
      alert('Preencha os campos obrigatórios');
      return;
    }

    const { error } = await supabase
      .from('bloqueios')
      .insert([{
        profissional_id: profissional.id,
        motivo: novoBloqueio.motivo,
        data: novoBloqueio.data,
        horario_inicio: novoBloqueio.dia_completo ? '00:00' : novoBloqueio.horario_inicio,
        horario_fim: novoBloqueio.dia_completo ? '23:59' : novoBloqueio.horario_fim,
        dia_completo: novoBloqueio.dia_completo
      }]);

    if (!error) {
      setShowNovoBloqueio(false);
      setNovoBloqueio({ motivo: '', data: '', horario_inicio: '', horario_fim: '', dia_completo: false });
      fetchDados();
    }
  };

  const removerBloqueio = async (id) => {
    const { error } = await supabase
      .from('bloqueios')
      .delete()
      .eq('id', id);

    if (!error) {
      fetchDados();
    }
  };

  // CORREÇÃO PRINCIPAL: Pega o primeiro da lista independente do status
  // O filtro do supabase já removeu os cancelados e ordenou por data
  const proximoCliente = agendamentos.length > 0 ? agendamentos[0] : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#0f0f14] to-[#1a1a24] text-white pb-24 font-sans">
      
      {/* HEADER */}
      <div className="bg-gradient-to-br from-[#18181b] to-[#0f0f14] p-6 rounded-b-3xl border-b border-white/10 shadow-2xl mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/5 rounded-full blur-3xl"></div>
        
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#5B2EFF] to-cyan-500 flex items-center justify-center text-2xl font-bold text-white shadow-xl border-2 border-white/10">
                {profissional.nome?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white mb-1">Olá, {profissional.nome?.split(' ')[0]}</h1>
                <p className="text-sm text-gray-400 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50"></span> 
                  Online agora
                </p>
              </div>
            </div>
            <button 
              onClick={onLogout} 
              className="p-3 bg-white/5 rounded-xl hover:bg-red-500/20 hover:text-red-400 transition-all border border-white/5 hover:border-red-500/30"
            >
              <LogOut size={20}/>
            </button>
          </div>

          {/* CARDS DE RESUMO */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 p-4 rounded-2xl border border-emerald-500/20 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-emerald-500/20 rounded-xl">
                  <DollarSign size={20} className="text-emerald-400"/>
                </div>
                <p className="text-xs text-emerald-300 uppercase font-bold">Hoje</p>
              </div>
              <p className="text-2xl font-bold text-white">R$ {resumo.hoje.toLocaleString()}</p>
            </div>

            <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 p-4 rounded-2xl border border-blue-500/20 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-500/20 rounded-xl">
                  <Scissors size={20} className="text-blue-400"/>
                </div>
                <p className="text-xs text-blue-300 uppercase font-bold">Próximos</p>
              </div>
              <p className="text-2xl font-bold text-white">{resumo.atendimentos}</p>
            </div>

            <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 p-4 rounded-2xl border border-purple-500/20 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-500/20 rounded-xl">
                  <TrendingUp size={20} className="text-purple-400"/>
                </div>
                <p className="text-xs text-purple-300 uppercase font-bold">Mês</p>
              </div>
              <p className="text-2xl font-bold text-white">R$ {resumo.mes.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ABAS */}
      <div className="px-6 mb-6">
        <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10 backdrop-blur-sm">
          <button 
            onClick={() => setTab('agenda')}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              tab === 'agenda' 
                ? 'bg-gradient-to-r from-[#5B2EFF] to-[#7C3EFF] text-white shadow-lg shadow-purple-500/30' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Calendar size={16}/> Minha Agenda
          </button>
          <button 
            onClick={() => setTab('financeiro')}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              tab === 'financeiro' 
                ? 'bg-gradient-to-r from-[#5B2EFF] to-[#7C3EFF] text-white shadow-lg shadow-purple-500/30' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Wallet size={16}/> Financeiro
          </button>
        </div>
      </div>

      {/* BOTÕES DE AÇÃO */}
      <div className="px-6 mb-6 flex gap-3">
        <button
          onClick={() => setShowNovoAgendamento(true)}
          className="flex-1 py-3 bg-gradient-to-r from-[#5B2EFF] to-[#7C3EFF] text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-purple-500/30 transition-all active:scale-95"
        >
          <Plus size={18}/> Novo Agendamento
        </button>
        <button
          onClick={() => setShowNovoBloqueio(true)}
          className="flex-1 py-3 bg-white/5 border border-white/10 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-white/10 transition-all active:scale-95"
        >
          <Lock size={18}/> Bloquear Horário
        </button>
      </div>

      {/* CONTEÚDO: AGENDA */}
      {tab === 'agenda' && (
        <div className="px-6 space-y-6">
          
          {/* PRÓXIMO CLIENTE DESTAQUE */}
          {proximoCliente && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-gray-400 uppercase ml-1">Próximo Atendimento</h2>
                <span className={`text-xs px-3 py-1 rounded-full border font-bold ${isHoje(proximoCliente.data) ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-blue-500/20 text-blue-300 border-blue-500/30'}`}>
                  {isHoje(proximoCliente.data) ? 'HOJE' : formatarData(proximoCliente.data)}
                </span>
              </div>
              <div className="bg-gradient-to-br from-violet-600/20 via-fuchsia-600/20 to-purple-600/20 border border-violet-500/30 p-6 rounded-3xl relative overflow-hidden shadow-2xl shadow-purple-900/20">
                <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl -mr-10 -mt-10"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-fuchsia-500/20 rounded-full blur-3xl -ml-10 -mb-10"></div>
                
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-white/10 px-4 py-2 rounded-xl backdrop-blur-md border border-white/20">
                      <Clock size={16} className="text-purple-300 inline mr-2"/>
                      <span className="text-lg font-bold text-white">{proximoCliente.horario.slice(0,5)}</span>
                    </div>
                    <div className="bg-white/10 px-4 py-2 rounded-xl backdrop-blur-md border border-white/20">
                      <DollarSign size={16} className="text-green-300 inline mr-1"/>
                      <span className="text-lg font-bold text-white">R$ {proximoCliente.valor_total || proximoCliente.valor}</span>
                    </div>
                  </div>

                  <h3 className="text-3xl font-bold text-white mb-2">{proximoCliente.cliente_nome}</h3>
                  <p className="text-purple-200 text-base mb-1 flex items-center gap-2">
                    <Scissors size={16}/> {proximoCliente.servico}
                  </p>
                  {proximoCliente.telefone && (
                    <p className="text-purple-300 text-sm mb-4">📱 {proximoCliente.telefone}</p>
                  )}

                  <button 
                    onClick={() => concluirAtendimento(proximoCliente.id)}
                    className="w-full py-4 bg-white text-purple-900 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-gray-100 transition-all active:scale-95 shadow-xl mt-4"
                  >
                    <CheckCircle size={20}/> Concluir Atendimento
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* REMOVIDO: Bloco de "Agenda Livre" (Else) */}

          {/* BLOQUEIOS DE HOJE */}
          {bloqueios.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-gray-400 uppercase mb-3 ml-1">Bloqueios Hoje</h2>
              <div className="space-y-3">
                {bloqueios.map((bloqueio) => (
                  <div key={bloqueio.id} className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-orange-500/20 rounded-xl">
                        <Lock size={20} className="text-orange-400"/>
                      </div>
                      <div>
                        <h4 className="font-bold text-white">{bloqueio.motivo || 'Bloqueio'}</h4>
                        <p className="text-sm text-orange-300">
                          {bloqueio.dia_completo 
                            ? 'Dia inteiro bloqueado' 
                            : `${bloqueio.horario_inicio.slice(0,5)} - ${bloqueio.horario_fim.slice(0,5)}`
                          }
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removerBloqueio(bloqueio.id)}
                      className="p-2 bg-red-500/20 rounded-lg hover:bg-red-500/30 text-red-400 transition-all"
                    >
                      <Trash2 size={18}/>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* LISTA DE PRÓXIMOS */}
          <div>
            <h2 className="text-sm font-bold text-gray-400 uppercase mb-3 ml-1">Próximos Agendamentos</h2>
            <div className="space-y-3">
              {agendamentos.filter(a => a.id !== proximoCliente?.id).length > 0 ? (
                agendamentos.filter(a => a.id !== proximoCliente?.id).map((item) => (
                  <div 
                    key={item.id} 
                    className={`p-4 rounded-2xl border backdrop-blur-sm transition-all ${
                      item.status === 'concluido' 
                        ? 'bg-white/5 border-white/5 opacity-60' 
                        : 'bg-[#18181b]/80 border-white/10 hover:border-purple-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        
                        <div className="text-center min-w-[60px] bg-white/5 rounded-xl p-2 border border-white/10">
                          <span className={`block text-xs font-bold mb-1 ${isHoje(item.data) ? 'text-green-400' : 'text-gray-400'}`}>
                            {isHoje(item.data) ? 'Hoje' : formatarData(item.data)}
                          </span>
                          <span className="block text-base font-bold text-white">{item.horario.slice(0,5)}</span>
                        </div>

                        <div className="flex-1">
                          <h4 className={`font-bold text-lg ${item.status === 'concluido' ? 'text-gray-400 line-through' : 'text-white'}`}>
                            {item.cliente_nome}
                          </h4>
                          <p className="text-sm text-gray-400">{item.servico}</p>
                          {item.telefone && <p className="text-xs text-gray-500 mt-1">📱 {item.telefone}</p>}
                        </div>
                      </div>
                      
                      {item.status === 'concluido' ? (
                        <div className="bg-green-500/20 p-3 rounded-xl">
                          <CheckCircle size={24} className="text-green-400"/>
                        </div>
                      ) : (
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-400">R$ {item.valor_total || item.valor}</div>
                          <button
                            onClick={() => concluirAtendimento(item.id)}
                            className="text-xs text-gray-500 hover:text-green-400 transition-all mt-1"
                          >
                            Concluir
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                /* Mensagem discreta caso a lista esteja realmente vazia */
                !proximoCliente && (
                   <p className="text-gray-500 text-sm text-center italic py-8">Nenhum agendamento futuro.</p>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* CONTEÚDO: FINANCEIRO */}
      {tab === 'financeiro' && (
        <div className="px-6 space-y-6">
          <div className="bg-gradient-to-br from-emerald-600/30 via-teal-600/20 to-green-600/20 border border-emerald-500/30 p-8 rounded-3xl text-center relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl"></div>
            <div className="relative z-10">
              <div className="w-20 h-20 bg-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/50">
                <TrendingUp size={40} className="text-emerald-300"/>
              </div>
              <p className="text-emerald-300 text-sm font-bold uppercase mb-2 tracking-wider">Produção Mensal</p>
              <h2 className="text-5xl font-bold text-white mb-3">R$ {resumo.mes.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</h2>
              <p className="text-sm text-emerald-200/70">Total acumulado neste mês</p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-white font-bold text-lg">Histórico Recente</h3>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
              <p className="text-gray-400">Detalhes do extrato em breve...</p>
              <p className="text-gray-500 text-sm mt-2">Em desenvolvimento</p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: NOVO AGENDAMENTO */}
      {showNovoAgendamento && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-[#18181b] border border-white/10 rounded-3xl p-6 max-w-md w-full shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                <CalendarPlus className="text-purple-400"/> Novo Agendamento
              </h3>
              <button 
                onClick={() => setShowNovoAgendamento(false)}
                className="p-2 hover:bg-white/10 rounded-xl transition-all"
              >
                <X size={24} className="text-gray-400"/>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2">Cliente *</label>
                <input
                  type="text"
                  value={novoAgendamento.cliente_nome}
                  onChange={(e) => setNovoAgendamento({...novoAgendamento, cliente_nome: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-all"
                  placeholder="Nome do cliente"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2">Serviço</label>
                <input
                  type="text"
                  value={novoAgendamento.servico}
                  onChange={(e) => setNovoAgendamento({...novoAgendamento, servico: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-all"
                  placeholder="Ex: Corte + Barba"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-2">Data *</label>
                  <input
                    type="date"
                    value={novoAgendamento.data}
                    onChange={(e) => setNovoAgendamento({...novoAgendamento, data: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-2">Horário *</label>
                  <input
                    type="time"
                    value={novoAgendamento.horario}
                    onChange={(e) => setNovoAgendamento({...novoAgendamento, horario: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-2">Valor (R$)</label>
                  <input
                    type="number"
                    value={novoAgendamento.valor}
                    onChange={(e) => setNovoAgendamento({...novoAgendamento, valor: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-all"
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-2">Telefone</label>
                  <input
                    type="tel"
                    value={novoAgendamento.telefone}
                    onChange={(e) => setNovoAgendamento({...novoAgendamento, telefone: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-all"
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>

              <button
                onClick={criarNovoAgendamento}
                className="w-full py-4 bg-gradient-to-r from-[#5B2EFF] to-[#7C3EFF] text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-purple-500/30 transition-all active:scale-95 mt-6"
              >
                <Save size={20}/> Criar Agendamento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: NOVO BLOQUEIO */}
      {showNovoBloqueio && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-[#18181b] border border-white/10 rounded-3xl p-6 max-w-md w-full shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                <Lock className="text-orange-400"/> Bloquear Horário
              </h3>
              <button 
                onClick={() => setShowNovoBloqueio(false)}
                className="p-2 hover:bg-white/10 rounded-xl transition-all"
              >
                <X size={24} className="text-gray-400"/>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2">Motivo</label>
                <input
                  type="text"
                  value={novoBloqueio.motivo}
                  onChange={(e) => setNovoBloqueio({...novoBloqueio, motivo: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-all"
                  placeholder="Ex: Almoço, Compromisso pessoal..."
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2">Data *</label>
                <input
                  type="date"
                  value={novoBloqueio.data}
                  onChange={(e) => setNovoBloqueio({...novoBloqueio, data: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-all"
                />
              </div>

              <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={novoBloqueio.dia_completo}
                    onChange={(e) => setNovoBloqueio({...novoBloqueio, dia_completo: e.target.checked})}
                    className="w-5 h-5 rounded bg-white/5 border-orange-500 text-orange-500 focus:ring-orange-500"
                  />
                  <span className="text-white font-bold">Bloquear dia inteiro</span>
                </label>
              </div>

              {!novoBloqueio.dia_completo && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-bold text-gray-400 mb-2">Início *</label>
                    <input
                      type="time"
                      value={novoBloqueio.horario_inicio}
                      onChange={(e) => setNovoBloqueio({...novoBloqueio, horario_inicio: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-400 mb-2">Fim *</label>
                    <input
                      type="time"
                      value={novoBloqueio.horario_fim}
                      onChange={(e) => setNovoBloqueio({...novoBloqueio, horario_fim: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-all"
                    />
                  </div>
                </div>
              )}

              <button
                onClick={criarBloqueio}
                className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-orange-500/30 transition-all active:scale-95 mt-6"
              >
                <Lock size={20}/> Confirmar Bloqueio
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};