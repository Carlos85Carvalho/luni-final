import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { 
  TrendingUp, Calendar, Sparkles, ArrowRight, Bell, Clock, DollarSign, Users, 
  Target, Award, AlertCircle, CheckCircle, Activity, ChevronRight, Heart, Phone
} from 'lucide-react';

export const DashboardAdmin = ({ onNavigate }) => {
  const [loading, setLoading] = useState(true);
  
  // Estado inicial
  const [dados, setDados] = useState({
    hoje: { faturamento: 0, agendamentos: 0, clientes: 0, ticket: 0 },
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
        const hojeISO = new Date().toISOString().split('T')[0];
        
        // Datas para o Mês
        const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString();
        const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString();
        
        // 1. DADOS DE HOJE
        const { data: agendamentosHoje } = await supabase
        .from('agendamentos')
        .select('*')
        .eq('data', hojeISO)
        .neq('status', 'cancelado');

        const fatHoje = agendamentosHoje?.reduce((acc, curr) => acc + (curr.valor || 0), 0) || 0;
        const qtdHoje = agendamentosHoje?.length || 0;
        const ticketHoje = qtdHoje > 0 ? fatHoje / qtdHoje : 0;

        // 2. DADOS DO MÊS
        const { data: agendamentosMes } = await supabase
        .from('agendamentos')
        .select('*')
        .gte('data', inicioMes)
        .lte('data', fimMes)
        .neq('status', 'cancelado');

        const fatMes = agendamentosMes?.reduce((acc, curr) => acc + (curr.valor || 0), 0) || 0;
        const meta = 15000;
        const diasRestantes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate() - hoje.getDate();

        // 3. PRÓXIMOS
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

        // 4. RANKING
        const servicosMap = {};
        agendamentosMes?.forEach(a => {
        if (!servicosMap[a.servico]) servicosMap[a.servico] = { qtd: 0, faturamento: 0 };
        servicosMap[a.servico].qtd += 1;
        servicosMap[a.servico].faturamento += a.valor;
        });
        
        const icones = ['🎨', '✂️', '💅', '💨', '🧖‍♀️'];
        const ranking = Object.entries(servicosMap)
        .map(([k, v], i) => ({ servico: k, quantidade: v.qtd, faturamento: v.faturamento, icone: icones[i % icones.length] }))
        .sort((a, b) => b.faturamento - a.faturamento)
        .slice(0, 4);

        // 5. CLIENTES RECENTES
        const { data: clientesRecentesData } = await supabase
            .from('clientes')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(3);

        const clientesFormatados = clientesRecentesData?.map(c => ({
            nome: c.nome,
            ultimaVisita: 'Novo', 
            status: 'ativo',
            telefone: c.telefone || 'Sem telefone'
        })) || [];

        // ATUALIZAR
        setDados({
        hoje: { faturamento: fatHoje, agendamentos: qtdHoje, clientes: 0, ticket: ticketHoje },
        mes: { faturamento: fatMes, meta: meta, percentual: Math.min((fatMes / meta) * 100, 100), diasRestantes: diasRestantes },
        proximosAgendamentos: proximosFormatados,
        alertas: qtdHoje === 0 ? [{ tipo: 'info', titulo: 'Dia tranquilo', mensagem: 'Sem agendamentos hoje.', icon: Clock }] : [],
        rankingServicos: ranking,
        clientesRecentes: clientesFormatados
        });

        setLoading(false);
    };
    fetchDashboardData();
  }, []);

  const nomeUsuario = "Parceiro";
  const dataExtenso = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

  if (loading) return <div className="flex items-center justify-center h-96"><Activity className="animate-pulse text-purple-400" size={48} /></div>;

  return (
    <div className="space-y-6 pt-4 animate-in fade-in duration-700">
      <div className="flex justify-between items-start px-2">
        <div><h1 className="text-4xl font-bold text-white mb-2">Olá, {nomeUsuario} 👋</h1><p className="text-sm text-gray-400 font-medium uppercase tracking-wide">{dataExtenso}</p></div>
        <div className="flex gap-3"><button className="bg-white/10 p-3 rounded-xl border border-white/10 hover:bg-white/20 transition-all relative"><Bell size={20} className="text-white" /></button></div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-emerald-900/30 to-teal-900/30 border border-emerald-700/30 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3"><span className="text-emerald-400 text-xs font-bold uppercase tracking-wide">Hoje</span><DollarSign size={20} className="text-emerald-400" /></div>
          <div className="text-3xl font-bold text-white mb-1">R$ {dados.hoje.faturamento.toLocaleString('pt-BR')}</div>
        </div>
        <div className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border border-blue-700/30 rounded-2xl p-5 cursor-pointer" onClick={() => onNavigate('agenda')}>
          <div className="flex items-center justify-between mb-3"><span className="text-blue-400 text-xs font-bold uppercase tracking-wide">Agenda</span><Calendar size={20} className="text-blue-400" /></div>
          <div className="text-3xl font-bold text-white mb-1">{dados.hoje.agendamentos}</div>
        </div>
        <div className="bg-gradient-to-br from-purple-900/30 to-fuchsia-900/30 border border-purple-700/30 rounded-2xl p-5 cursor-pointer" onClick={() => onNavigate('clientes')}>
          <div className="flex items-center justify-between mb-3"><span className="text-purple-400 text-xs font-bold uppercase tracking-wide">Clientes</span><Users size={20} className="text-purple-400" /></div>
          <div className="text-3xl font-bold text-white mb-1">{dados.hoje.clientes}</div>
        </div>
        <div className="bg-gradient-to-br from-amber-900/30 to-orange-900/30 border border-amber-700/30 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3"><span className="text-amber-400 text-xs font-bold uppercase tracking-wide">Médio</span><Award size={20} className="text-amber-400" /></div>
          <div className="text-3xl font-bold text-white mb-1">R$ {dados.hoje.ticket.toFixed(0)}</div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-violet-900/40 to-purple-900/40 border border-violet-500/30 rounded-2xl p-6 relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div><h3 className="text-xl font-bold text-white mb-1">Meta Mensal</h3><p className="text-sm text-gray-400">Faltam {dados.mes.diasRestantes} dias</p></div>
          <div className="text-right"><div className="text-3xl font-bold text-white">{dados.mes.percentual.toFixed(0)}%</div></div>
        </div>
        <div className="h-3 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" style={{ width: `${dados.mes.percentual}%` }}></div></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-8">
        <button onClick={() => onNavigate('agenda')} className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border border-blue-700/30 hover:border-blue-500/50 rounded-2xl p-6 flex items-center justify-between cursor-pointer group transition-all">
          <div className="flex items-center gap-4"><div className="bg-blue-500/20 p-3 rounded-xl text-blue-400"><Calendar size={24} /></div><div className="text-left"><h4 className="font-bold text-white mb-1">Agenda</h4><p className="text-sm text-gray-400">Ver horários</p></div></div><ArrowRight className="text-gray-500 group-hover:text-blue-400 transition-colors" size={20} />
        </button>
        <button onClick={() => onNavigate('financeiro')} className="bg-gradient-to-br from-emerald-900/30 to-teal-900/30 border border-emerald-700/30 hover:border-emerald-500/50 rounded-2xl p-6 flex items-center justify-between cursor-pointer group transition-all">
          <div className="flex items-center gap-4"><div className="bg-emerald-500/20 p-3 rounded-xl text-emerald-400"><DollarSign size={24} /></div><div className="text-left"><h4 className="font-bold text-white mb-1">Financeiro</h4><p className="text-sm text-gray-400">Ver relatórios</p></div></div><ArrowRight className="text-gray-500 group-hover:text-emerald-400 transition-colors" size={20} />
        </button>
        <button onClick={() => onNavigate('clientes')} className="bg-gradient-to-br from-purple-900/30 to-fuchsia-900/30 border border-purple-700/30 hover:border-purple-500/50 rounded-2xl p-6 flex items-center justify-between cursor-pointer group transition-all">
          <div className="flex items-center gap-4"><div className="bg-purple-500/20 p-3 rounded-xl text-purple-400"><Users size={24} /></div><div className="text-left"><h4 className="font-bold text-white mb-1">Clientes</h4><p className="text-sm text-gray-400">Gerenciar base</p></div></div><ArrowRight className="text-gray-500 group-hover:text-purple-400 transition-colors" size={20} />
        </button>
      </div>
    </div>
  );
};