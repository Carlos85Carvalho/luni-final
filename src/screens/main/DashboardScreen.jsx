import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { 
  TrendingUp, Calendar, Sparkles, ArrowRight, Bell, Clock, DollarSign, Users, 
  Target, Award, AlertCircle, CheckCircle, Star, Zap, TrendingDown, Activity,
  ChevronRight, Gift, Heart, Scissors, User, Phone, XCircle
} from 'lucide-react';

export const DashboardAdmin = ({ onNavigate }) => {
  const [loading, setLoading] = useState(true);
  
  // Estado inicial zerado (será preenchido pelo Supabase)
  const [dados, setDados] = useState({
    hoje: { faturamento: 0, agendamentos: 0, clientes: 0, ticket: 0, crescimentoFaturamento: 0 },
    mes: { faturamento: 0, meta: 15000, percentual: 0, diasRestantes: 0 },
    proximosAgendamentos: [],
    alertas: [],
    rankingServicos: [],
    clientesRecentes: [],
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      const hoje = new Date();
      const hojeISO = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      
      // Datas para o Mês
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString();
      const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString();
      
      // --- 1. BUSCAR DADOS DE HOJE ---
      const { data: agendamentosHoje } = await supabase
        .from('agendamentos')
        .select('*')
        .eq('data', hojeISO)
        .neq('status', 'cancelado');

      const fatHoje = agendamentosHoje?.reduce((acc, curr) => acc + (curr.valor || 0), 0) || 0;
      const qtdHoje = agendamentosHoje?.length || 0;
      // Set unique clients count
      const clientesUnicosHoje = new Set(agendamentosHoje?.map(a => a.cliente_id || a.cliente_nome)).size; 
      const ticketHoje = qtdHoje > 0 ? fatHoje / qtdHoje : 0;

      // --- 2. BUSCAR DADOS DO MÊS (Para Meta e Ranking) ---
      const { data: agendamentosMes } = await supabase
        .from('agendamentos')
        .select('*')
        .gte('data', inicioMes)
        .lte('data', fimMes)
        .neq('status', 'cancelado');

      const fatMes = agendamentosMes?.reduce((acc, curr) => acc + (curr.valor || 0), 0) || 0;
      const meta = 15000; // Meta fixa por enquanto
      const diasRestantes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate() - hoje.getDate();

      // --- 3. PRÓXIMOS AGENDAMENTOS (A partir de agora) ---
      // Pega agendamentos de hoje que ainda não aconteceram ou futuros próximos
      const { data: proximos } = await supabase
        .from('agendamentos')
        .select('*')
        .gte('data', hojeISO)
        .order('data', { ascending: true })
        .order('horario', { ascending: true })
        .limit(3);

      const proximosFormatados = proximos?.map(a => ({
        id: a.id,
        horario: a.horario ? a.horario.slice(0, 5) : '--:--',
        cliente: a.cliente_nome || 'Cliente',
        servico: a.servico,
        status: a.status,
        valor: a.valor
      })) || [];

      // --- 4. RANKING DE SERVIÇOS DO MÊS ---
      const servicosMap = {};
      agendamentosMes?.forEach(a => {
        if (!servicosMap[a.servico]) servicosMap[a.servico] = { qtd: 0, faturamento: 0 };
        servicosMap[a.servico].qtd += 1;
        servicosMap[a.servico].faturamento += a.valor;
      });
      
      // Ícones aleatórios para deixar bonito (pode melhorar depois)
      const icones = ['🎨', '✂️', '💅', '💨', '🧖‍♀️'];
      const ranking = Object.entries(servicosMap)
        .map(([k, v], i) => ({ servico: k, quantidade: v.qtd, faturamento: v.faturamento, icone: icones[i % icones.length] }))
        .sort((a, b) => b.faturamento - a.faturamento)
        .slice(0, 4);

      // --- 5. ALERTAS INTELIGENTES (Lógica Básica) ---
      const novosAlertas = [];
      if (qtdHoje === 0) {
        novosAlertas.push({ tipo: 'info', titulo: 'Dia tranquilo', mensagem: 'Nenhum agendamento para hoje ainda.', icon: Clock });
      }
      if (fatMes >= meta) {
        novosAlertas.push({ tipo: 'success', titulo: 'Meta Batida!', mensagem: 'Parabéns, você superou a meta mensal!', icon: Target });
      } else if (fatMes >= meta * 0.8) {
        novosAlertas.push({ tipo: 'warning', titulo: 'Quase lá!', mensagem: `Faltam R$ ${(meta - fatMes).toLocaleString()} para a meta.`, icon: TrendingUp });
      }
      // Adiciona um alerta padrão se não tiver nada
      if (novosAlertas.length === 0) {
          novosAlertas.push({ tipo: 'info', titulo: 'Sistema Atualizado', mensagem: 'Todos os seus dados estão sincronizados.', icon: CheckCircle });
      }

      // --- 6. CLIENTES RECENTES (Últimos cadastrados ou atendidos) ---
      // Aqui estou pegando da tabela de clientes, mas poderia ser dos agendamentos
      const { data: clientesRecentesData } = await supabase
          .from('clientes')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(3);

      const clientesFormatados = clientesRecentesData?.map(c => ({
          nome: c.nome,
          ultimaVisita: 'Novo', // Simplificado
          status: 'ativo',
          telefone: c.telefone || 'Sem telefone'
      })) || [];


      // --- ATUALIZAR ESTADO ---
      setDados({
        hoje: {
          faturamento: fatHoje,
          agendamentos: qtdHoje,
          clientes: clientesUnicosHoje,
          ticket: ticketHoje,
          crescimentoFaturamento: 0 // Precisaria comparar com ontem (deixei 0 por enquanto)
        },
        mes: {
          faturamento: fatMes,
          meta: meta,
          percentual: Math.min((fatMes / meta) * 100, 100),
          diasRestantes: diasRestantes
        },
        proximosAgendamentos: proximosFormatados,
        alertas: novosAlertas,
        rankingServicos: ranking,
        clientesRecentes: clientesFormatados
      });

      setLoading(false);
    };
    fetchDashboardData();
  }, []);

  const nomeUsuario = "Parceiro";
  const dataExtenso = new Date().toLocaleDateString('pt-BR', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long',
    year: 'numeric'
  });

  const getAlertColor = (tipo) => {
    const colors = {
      success: 'from-emerald-900/40 to-teal-900/40 border-emerald-500/30',
      warning: 'from-amber-900/40 to-yellow-900/40 border-amber-500/30',
      info: 'from-blue-900/40 to-cyan-900/40 border-blue-500/30',
      error: 'from-red-900/40 to-rose-900/40 border-red-500/30'
    };
    return colors[tipo] || colors.info;
  };

  const getAlertIconColor = (tipo) => {
    const colors = {
      success: 'bg-emerald-500/20 text-emerald-300',
      warning: 'bg-amber-500/20 text-amber-300',
      info: 'bg-blue-500/20 text-blue-300',
      error: 'bg-red-500/20 text-red-300'
    };
    return colors[tipo] || colors.info;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Activity className="mx-auto mb-4 animate-pulse text-purple-400" size={48} />
          <p className="text-gray-400">Analisando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-4 animate-in fade-in duration-700">
      
      {/* HEADER COM SAUDAÇÃO */}
      <div className="flex justify-between items-start px-2">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Olá, {nomeUsuario} 👋
          </h1>
          <p className="text-sm text-gray-400 font-medium uppercase tracking-wide">
            {dataExtenso}
          </p>
        </div>
        <div className="flex gap-3">
          <button className="bg-white/10 p-3 rounded-xl border border-white/10 hover:bg-white/20 transition-all relative">
            <Bell size={20} className="text-white" />
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs font-bold flex items-center justify-center">
              {dados.alertas.length}
            </span>
          </button>
        </div>
      </div>

      {/* CARDS DE KPIs PRINCIPAIS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Faturamento Hoje */}
        <div className="bg-gradient-to-br from-emerald-900/30 to-teal-900/30 border border-emerald-700/30 rounded-2xl p-5 relative overflow-hidden group hover:scale-105 transition-all cursor-pointer">
          <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-500/20 rounded-full blur-2xl -mr-10 -mt-10"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <span className="text-emerald-400 text-xs font-bold uppercase tracking-wide">Hoje</span>
              <DollarSign size={20} className="text-emerald-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              R$ {dados.hoje.faturamento.toLocaleString('pt-BR')}
            </div>
            <div className="flex items-center gap-1 text-sm">
              <TrendingUp size={14} className="text-emerald-400" />
              <span className="text-emerald-400 font-semibold">
                Faturamento
              </span>
            </div>
          </div>
        </div>

        {/* Agendamentos Hoje */}
        <div className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border border-blue-700/30 rounded-2xl p-5 relative overflow-hidden group hover:scale-105 transition-all cursor-pointer" onClick={() => onNavigate('agenda')}>
          <div className="absolute right-0 top-0 w-24 h-24 bg-blue-500/20 rounded-full blur-2xl -mr-10 -mt-10"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <span className="text-blue-400 text-xs font-bold uppercase tracking-wide">Agenda</span>
              <Calendar size={20} className="text-blue-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {dados.hoje.agendamentos}
            </div>
            <div className="text-sm text-gray-400">
              agendados hoje
            </div>
          </div>
        </div>

        {/* Clientes Atendidos */}
        <div className="bg-gradient-to-br from-purple-900/30 to-fuchsia-900/30 border border-purple-700/30 rounded-2xl p-5 relative overflow-hidden group hover:scale-105 transition-all cursor-pointer" onClick={() => onNavigate('clientes')}>
          <div className="absolute right-0 top-0 w-24 h-24 bg-purple-500/20 rounded-full blur-2xl -mr-10 -mt-10"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <span className="text-purple-400 text-xs font-bold uppercase tracking-wide">Clientes</span>
              <Users size={20} className="text-purple-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {dados.hoje.clientes}
            </div>
            <div className="text-sm text-gray-400">
              atendidos hoje
            </div>
          </div>
        </div>

        {/* Ticket Médio */}
        <div className="bg-gradient-to-br from-amber-900/30 to-orange-900/30 border border-amber-700/30 rounded-2xl p-5 relative overflow-hidden group hover:scale-105 transition-all cursor-pointer">
          <div className="absolute right-0 top-0 w-24 h-24 bg-amber-500/20 rounded-full blur-2xl -mr-10 -mt-10"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <span className="text-amber-400 text-xs font-bold uppercase tracking-wide">Médio</span>
              <Award size={20} className="text-amber-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              R$ {dados.hoje.ticket.toFixed(0)}
            </div>
            <div className="text-sm text-gray-400">
              por atendimento
            </div>
          </div>
        </div>
      </div>

      {/* META MENSAL */}
      <div className="bg-gradient-to-r from-violet-900/40 to-purple-900/40 border border-violet-500/30 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl -mr-10 -mt-10"></div>
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-white mb-1">Meta Mensal</h3>
              <p className="text-sm text-gray-400">
                Faltam {dados.mes.diasRestantes} dias • R$ {Math.max(0, dados.mes.meta - dados.mes.faturamento).toLocaleString()} para atingir
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-white">
                {dados.mes.percentual.toFixed(0)}%
              </div>
              <div className="text-sm text-purple-300">
                R$ {dados.mes.faturamento.toLocaleString()} / R$ {dados.mes.meta.toLocaleString()}
              </div>
            </div>
          </div>
          
          {/* Barra de Progresso */}
          <div className="h-3 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-1000"
              style={{ width: `${dados.mes.percentual}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* GRID PRINCIPAL */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* PRÓXIMOS AGENDAMENTOS */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Clock className="text-blue-400" size={24} />
              Próximos
            </h3>
            <button 
              onClick={() => onNavigate('agenda')}
              className="text-sm text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
            >
              Ver todos <ChevronRight size={16} />
            </button>
          </div>

          <div className="space-y-3">
            {dados.proximosAgendamentos.length > 0 ? (
                dados.proximosAgendamentos.map((agendamento) => (
                <div 
                    key={agendamento.id}
                    className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 hover:bg-slate-800 hover:border-blue-500/30 transition-all cursor-pointer"
                >
                    <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                        <Clock size={18} className="text-blue-400" />
                        </div>
                        <div>
                        <div className="font-bold text-white">{agendamento.cliente}</div>
                        <div className="text-sm text-gray-400">{agendamento.servico}</div>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-lg font-bold text-blue-400">{agendamento.horario}</div>
                        <span className="text-xs font-bold text-emerald-400">R$ {agendamento.valor}</span>
                    </div>
                    </div>
                </div>
                ))
            ) : (
                <p className="text-gray-500 text-center py-4">Sem mais agendamentos hoje.</p>
            )}
          </div>
        </div>

        {/* ALERTAS E INSIGHTS */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="text-purple-400" size={24} />
              Insights
            </h3>
          </div>

          <div className="space-y-3">
            {dados.alertas.map((alerta, idx) => {
              const Icon = alerta.icon;
              return (
                <div 
                  key={idx}
                  className={`bg-gradient-to-r ${getAlertColor(alerta.tipo)} rounded-xl p-4 border`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${getAlertIconColor(alerta.tipo)}`}>
                      <Icon size={20} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-white mb-1">{alerta.titulo}</h4>
                      <p className="text-sm text-gray-300">{alerta.mensagem}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RANKING DE SERVIÇOS */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Award className="text-amber-400" size={24} />
              Top Serviços
            </h3>
          </div>

          <div className="space-y-3">
            {dados.rankingServicos.length > 0 ? (
                dados.rankingServicos.map((servico, idx) => (
                <div 
                    key={idx}
                    className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 hover:bg-slate-800 transition-all"
                >
                    <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center text-xl">
                        {servico.icone}
                        </div>
                        <div>
                        <div className="font-bold text-white">{servico.servico}</div>
                        <div className="text-sm text-gray-400">{servico.quantidade} vendas</div>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-lg font-bold text-emerald-400">
                        R$ {servico.faturamento.toLocaleString()}
                        </div>
                    </div>
                    </div>
                </div>
                ))
            ) : (
                <p className="text-gray-500 text-center py-4">Sem dados neste mês.</p>
            )}
          </div>
        </div>

        {/* CLIENTES RECENTES */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Heart className="text-pink-400" size={24} />
              Novos Clientes
            </h3>
            <button 
              onClick={() => onNavigate('clientes')}
              className="text-sm text-pink-400 hover:text-pink-300 font-semibold flex items-center gap-1"
            >
              Ver todos <ChevronRight size={16} />
            </button>
          </div>

          <div className="space-y-3">
            {dados.clientesRecentes.map((cliente, idx) => (
              <div 
                key={idx}
                className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 hover:bg-slate-800 hover:border-pink-500/30 transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg bg-gradient-to-br from-purple-500 to-pink-600">
                      {cliente.nome.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-white flex items-center gap-2">
                        {cliente.nome}
                      </div>
                      <div className="text-sm text-gray-400 flex items-center gap-2">
                        <Phone size={12} />
                        {cliente.telefone}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AÇÕES RÁPIDAS (Botões Grandes) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-8">
        <button 
          onClick={() => onNavigate('agenda')}
          className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border border-blue-700/30 hover:border-blue-500/50 rounded-2xl p-6 flex items-center justify-between cursor-pointer group transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="bg-blue-500/20 p-3 rounded-xl text-blue-400">
              <Calendar size={24} />
            </div>
            <div className="text-left">
              <h4 className="font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">
                Agenda
              </h4>
              <p className="text-sm text-gray-400">Ver horários</p>
            </div>
          </div>
          <ArrowRight className="text-gray-500 group-hover:text-blue-400 transition-colors" size={20} />
        </button>

        <button 
          onClick={() => onNavigate('financeiro')}
          className="bg-gradient-to-br from-emerald-900/30 to-teal-900/30 border border-emerald-700/30 hover:border-emerald-500/50 rounded-2xl p-6 flex items-center justify-between cursor-pointer group transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="bg-emerald-500/20 p-3 rounded-xl text-emerald-400">
              <DollarSign size={24} />
            </div>
            <div className="text-left">
              <h4 className="font-bold text-white mb-1 group-hover:text-emerald-400 transition-colors">
                Financeiro
              </h4>
              <p className="text-sm text-gray-400">Ver relatórios</p>
            </div>
          </div>
          <ArrowRight className="text-gray-500 group-hover:text-emerald-400 transition-colors" size={20} />
        </button>

        <button 
          onClick={() => onNavigate('clientes')}
          className="bg-gradient-to-br from-purple-900/30 to-fuchsia-900/30 border border-purple-700/30 hover:border-purple-500/50 rounded-2xl p-6 flex items-center justify-between cursor-pointer group transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="bg-purple-500/20 p-3 rounded-xl text-purple-400">
              <Users size={24} />
            </div>
            <div className="text-left">
              <h4 className="font-bold text-white mb-1 group-hover:text-purple-400 transition-colors">
                Clientes
              </h4>
              <p className="text-sm text-gray-400">Gerenciar base</p>
            </div>
          </div>
          <ArrowRight className="text-gray-500 group-hover:text-purple-400 transition-colors" size={20} />
        </button>
      </div>

    </div>
  );
};