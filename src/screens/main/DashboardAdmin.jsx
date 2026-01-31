import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { 
  TrendingUp, Calendar, Bell, Clock, DollarSign, Users, 
  Award, ArrowRight, Heart, Phone, Shield
} from 'lucide-react';
// Certifique-se que o TeamScreen existe nessa pasta, se der erro nele, avise
import { TeamScreen } from '../professional/TeamScreen';

export const DashboardAdmin = ({ onNavigate }) => {
  const [loading, setLoading] = useState(true);
  const [showTeam, setShowTeam] = useState(false);
  
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
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const { data: usu } = await supabase.from('usuarios').select('salao_id').eq('id', user.id).maybeSingle();
        
        if (!usu) return;

        const hoje = new Date();
        const hojeISO = new Date().toISOString().split('T')[0];
        
        const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString();
        const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString();
        
        // 1. DADOS DE HOJE
        const { data: agendamentosHoje } = await supabase
          .from('agendamentos')
          .select('*')
          .eq('salao_id', usu.salao_id)
          .eq('data', hojeISO)
          .neq('status', 'cancelado');

        const fatHoje = agendamentosHoje?.reduce((acc, curr) => acc + Number(curr.valor_total || curr.valor || 0), 0) || 0;
        const qtdHoje = agendamentosHoje?.length || 0;
        const clientesUnicos = new Set(agendamentosHoje?.map(a => a.cliente_nome)).size;
        const ticketHoje = qtdHoje > 0 ? fatHoje / qtdHoje : 0;

        // 2. DADOS DO MÊS
        const { data: agendamentosMes } = await supabase
          .from('agendamentos')
          .select('*')
          .eq('salao_id', usu.salao_id)
          .gte('data', inicioMes)
          .lte('data', fimMes)
          .neq('status', 'cancelado');

        const fatMes = agendamentosMes?.reduce((acc, curr) => acc + Number(curr.valor_total || curr.valor || 0), 0) || 0;
        const meta = 15000;
        const diasRestantes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate() - hoje.getDate();

        // 3. PRÓXIMOS
        const { data: proximos } = await supabase
          .from('agendamentos')
          .select('*')
          .eq('salao_id', usu.salao_id)
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
          valor: Number(a.valor_total || a.valor || 0)
        })) || [];

        // 4. CLIENTES RECENTES
        const { data: clientesRecentesData } = await supabase
            .from('clientes')
            .select('*')
            .eq('salao_id', usu.salao_id)
            .order('created_at', { ascending: false })
            .limit(3);

        setDados({
          hoje: { faturamento: fatHoje, agendamentos: qtdHoje, clientes: clientesUnicos, ticket: ticketHoje },
          mes: { faturamento: fatMes, meta: meta, percentual: Math.min((fatMes / meta) * 100, 100), diasRestantes },
          proximosAgendamentos: proximosFormatados,
          alertas: qtdHoje === 0 ? [{ tipo: 'info', titulo: 'Dia tranquilo', mensagem: 'Sem agendamentos hoje.', icon: Clock }] : [],
          rankingServicos: [], 
          clientesRecentes: clientesRecentesData || []
        });

      } catch (error) {
        console.error("Erro dashboard:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const nomeUsuario = "Parceiro";
  const dataExtenso = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

  // Componentes visuais auxiliares (dentro do arquivo para não dar erro de import)
  const KPICard = ({ label, value, icon: Icon, color, onClick }) => (
    <div 
      onClick={onClick}
      className={`bg-[#15151a] border border-${color}-500/20 rounded-3xl p-5 relative overflow-hidden group hover:border-${color}-500/50 transition-all ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform"><Icon size={48}/></div>
      <p className={`text-${color}-400 text-[10px] font-bold uppercase tracking-widest mb-1`}>{label}</p>
      <h3 className="text-2xl md:text-3xl font-bold text-white truncate">{value}</h3>
    </div>
  );

  const ActionButton = ({ label, sub, icon: Icon, color, onClick, isPro }) => (
    <button onClick={onClick} className="bg-[#1c1c24] p-5 rounded-3xl border border-white/5 flex flex-col items-start hover:bg-white/10 transition-all group relative h-32 justify-between w-full">
      {isPro && <div className="absolute top-3 right-3 bg-indigo-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">PRO</div>}
      <div className={`p-3 rounded-2xl bg-${color}-500/10 text-${color}-400 mb-2 group-hover:scale-110 transition-transform`}><Icon size={24}/></div>
      <div className="text-left w-full">
        <span className="font-bold text-base text-white block">{label}</span>
        <span className="text-xs text-gray-500">{sub}</span>
      </div>
    </button>
  );

  if (loading) return <div className="flex items-center justify-center h-screen bg-[#0a0a0f] text-white">Carregando...</div>;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white pb-24 md:pb-8">
      {/* CONTAINER RESPONSIVO (Substitui o ScreenWrapper)
          max-w-7xl: Limita a largura em monitores grandes
          mx-auto: Centraliza
          px-4: Margem lateral
      */}
      <div className="w-full max-w-7xl mx-auto px-4 pt-6 md:px-8 md:pt-10 animate-in fade-in duration-700">

        {/* HEADER */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Olá, {nomeUsuario} 👋</h1>
            <p className="text-sm text-gray-400 font-medium uppercase tracking-wide">{dataExtenso}</p>
          </div>
          <button className="bg-white/10 p-3 rounded-xl hover:bg-white/20 transition-all relative">
            <Bell size={24} className="text-white" />
            {dados.alertas.length > 0 && <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full"></span>}
          </button>
        </div>

        {/* GRID DE KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <KPICard label="Faturamento" value={`R$ ${dados.hoje.faturamento.toFixed(0)}`} icon={DollarSign} color="emerald" />
          <KPICard label="Agenda" value={dados.hoje.agendamentos} icon={Calendar} color="blue" onClick={() => onNavigate('agenda')} />
          <KPICard label="Clientes" value={dados.hoje.clientes} icon={Users} color="purple" onClick={() => onNavigate('clientes')} />
          <KPICard label="Ticket Médio" value={`R$ ${dados.hoje.ticket.toFixed(0)}`} icon={Award} color="amber" />
        </div>

        {/* META MENSAL */}
        <div className="bg-gradient-to-r from-[#2a1b52] to-[#1c1c24] border border-purple-500/30 rounded-3xl p-6 md:p-8 relative overflow-hidden mb-8 shadow-lg">
          <div className="flex justify-between items-end mb-4 relative z-10">
            <div>
              <h3 className="text-xl font-bold text-white mb-1">Meta Mensal</h3>
              <p className="text-sm text-purple-200">Faltam {dados.mes.diasRestantes} dias</p>
            </div>
            <span className="text-4xl font-bold text-white block">{dados.mes.percentual.toFixed(0)}%</span>
          </div>
          <div className="w-full h-4 bg-black/40 rounded-full overflow-hidden relative z-10">
            <div className="h-full bg-gradient-to-r from-fuchsia-600 to-purple-600 rounded-full transition-all duration-1000" style={{ width: `${dados.mes.percentual}%` }}></div>
          </div>
          <div className="absolute right-0 top-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
        </div>

        {/* GRID DE AÇÕES RÁPIDAS (Responsivo) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <ActionButton label="Agenda" sub="Horários" icon={Calendar} color="blue" onClick={() => onNavigate('agenda')} />
          <ActionButton label="Financeiro" sub="Relatórios" icon={DollarSign} color="emerald" onClick={() => onNavigate('financeiro')} />
          <ActionButton label="Clientes" sub="Base CRM" icon={Users} color="purple" onClick={() => onNavigate('clientes')} />
          <ActionButton label="Equipe" sub="Gestão" icon={Shield} color="indigo" onClick={() => setShowTeam(true)} isPro />
        </div>

        {/* GRID INFERIOR (2 Colunas no PC, 1 no Mobile) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* LISTA PRÓXIMOS */}
          <div className="bg-[#1c1c24] border border-white/5 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-white flex items-center gap-2"><Clock className="text-blue-400"/> Próximos</h3>
              <button onClick={() => onNavigate('agenda')} className="text-sm text-gray-400 hover:text-white transition-colors">Ver todos</button>
            </div>
            <div className="space-y-4">
              {dados.proximosAgendamentos.length > 0 ? dados.proximosAgendamentos.map(ag => (
                <div key={ag.id} className="flex items-center justify-between p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-all cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-sm font-bold text-blue-400">{ag.horario}</div>
                    <div>
                      <p className="font-bold text-white">{ag.cliente}</p>
                      <p className="text-xs text-gray-400">{ag.servico}</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-emerald-400">R$ {ag.valor}</span>
                </div>
              )) : <p className="text-gray-500 text-center py-4">Agenda livre hoje.</p>}
            </div>
          </div>

          {/* LISTA NOVOS CLIENTES */}
          <div className="bg-[#1c1c24] border border-white/5 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-white flex items-center gap-2"><Heart className="text-pink-400"/> Novos Clientes</h3>
              <button onClick={() => onNavigate('clientes')} className="text-sm text-gray-400 hover:text-white transition-colors">Ver base</button>
            </div>
            <div className="space-y-4">
              {dados.clientesRecentes.map((c, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center font-bold text-white">{c.nome.charAt(0)}</div>
                    <div>
                      <p className="font-bold text-white">{c.nome}</p>
                      <p className="text-xs text-gray-400 flex items-center gap-1"><Phone size={10}/> {c.telefone}</p>
                    </div>
                  </div>
                  <span className="bg-emerald-500/10 text-emerald-400 text-[10px] px-2 py-1 rounded-full font-bold uppercase">Novo</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* MODAL DE EQUIPE */}
        {showTeam && (
          <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex justify-center items-end md:items-center p-4">
            <div className="w-full h-[85vh] md:max-w-4xl bg-[#0a0a0f] rounded-t-[40px] md:rounded-[40px] overflow-hidden shadow-2xl relative animate-in slide-in-from-bottom-10 border border-white/10">
              <TeamScreen onClose={() => setShowTeam(false)} />
            </div>
          </div>
        )}

      </div>
    </div>
  );
};