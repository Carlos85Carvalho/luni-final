import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { 
  Calendar, Sparkles, Bell, Clock, DollarSign, Users, 
  Award, Heart, Phone, Activity, User
} from 'lucide-react';

import { StatCard } from '../../components/ui/StatCard';
import { SectionCard } from '../../components/ui/SectionCard';
import { QuickAction } from '../../components/ui/QuickAction';

export const DashboardAdmin = ({ onNavigate }) => {
  const [loading, setLoading] = useState(true);
  
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
        await supabase.auth.getUser();
        
        const hoje = new Date();
        const hojeISO = new Date().toISOString().split('T')[0];
        const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString();
        const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString();
        
        // 1. DADOS DE HOJE
        const { data: agendamentosHoje } = await supabase
          .from('agendamentos')
          .select('*')
          .eq('data', hojeISO)
          .neq('status', 'cancelado');

        const calcValor = (item) => Number(item.valor_total || item.valor || 0);

        const fatHoje = agendamentosHoje?.reduce((acc, curr) => acc + calcValor(curr), 0) || 0;
        const qtdHoje = agendamentosHoje?.length || 0;
        const clientesUnicos = new Set(agendamentosHoje?.map(a => a.cliente_nome)).size;
        const ticketHoje = qtdHoje > 0 ? fatHoje / qtdHoje : 0;

        // 2. DADOS DO MÊS
        const { data: agendamentosMes } = await supabase
          .from('agendamentos')
          .select('*')
          .gte('data', inicioMes)
          .lte('data', fimMes)
          .neq('status', 'cancelado');

        const fatMes = agendamentosMes?.reduce((acc, curr) => acc + calcValor(curr), 0) || 0;
        const meta = 15000;
        const diasRestantes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate() - hoje.getDate();

        // 3. PRÓXIMOS (CORRIGIDO: Agora busca a relação profissionais)
        const { data: proximos } = await supabase
          .from('agendamentos')
          .select('*, profissionais(nome)') // <--- MUDANÇA AQUI: Traz o nome do profissional
          .gte('data', hojeISO)
          .neq('status', 'cancelado')
          .order('data', { ascending: true })
          .order('horario', { ascending: true })
          .limit(5);

        const proximosFormatados = proximos?.map(a => {
            // Formata data: 2024-02-16 -> 16/02
            const dataParts = a.data.split('-');
            const diaMes = `${dataParts[2]}/${dataParts[1]}`;
            
            // Lógica segura para pegar o nome do profissional
            let nomeProfissional = 'Equipe';
            if (a.profissionais) {
                if (Array.isArray(a.profissionais)) {
                    nomeProfissional = a.profissionais[0]?.nome || 'Equipe';
                } else {
                    nomeProfissional = a.profissionais.nome || 'Equipe';
                }
            }

            return {
                id: a.id,
                dataFormatada: diaMes,
                horario: a.horario ? a.horario.slice(0, 5) : '--:--',
                cliente: a.cliente_nome || 'Cliente',
                servico: a.servico,
                profissional: nomeProfissional, // <--- Usa o nome extraído corretamente
                valor: calcValor(a)
            };
        }) || [];

        // 4. RANKING
        const servicosMap = {};
        agendamentosMes?.forEach(a => {
          const nomeServico = a.servico || 'Outros';
          const valorServico = calcValor(a);

          if (!servicosMap[nomeServico]) servicosMap[nomeServico] = { qtd: 0, faturamento: 0 };
          servicosMap[nomeServico].qtd += 1;
          servicosMap[nomeServico].faturamento += valorServico;
        });
        
        const ranking = Object.entries(servicosMap)
          .map(([k, v], i) => ({ servico: k, ...v, icone: ['🎨', '✂️', '💅', '✨', '🧴'][i % 5] }))
          .sort((a, b) => b.faturamento - a.faturamento)
          .slice(0, 3);

        // 5. CLIENTES RECENTES
        const { data: clientesRecentesData } = await supabase
            .from('clientes')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(3);

        // 6. ALERTAS
        const novosAlertas = [];
        if (qtdHoje === 0) novosAlertas.push({ tipo: 'info', titulo: 'Agenda livre', mensagem: 'Nenhum agendamento hoje.', icon: Clock });
        if (fatMes >= meta) novosAlertas.push({ tipo: 'success', titulo: 'Meta Batida!', mensagem: 'Parabéns, excelente mês!', icon: Activity });

        setDados({
          hoje: { faturamento: fatHoje, agendamentos: qtdHoje, clientes: clientesUnicos, ticket: ticketHoje },
          mes: { faturamento: fatMes, meta, percentual: Math.min((fatMes / meta) * 100, 100), diasRestantes },
          proximosAgendamentos: proximosFormatados,
          alertas: novosAlertas,
          rankingServicos: ranking, 
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

  const formatarNome = (nome) => {
    if (!nome) return "Cliente";
    return nome.split(' ')[0]; // Pega só o primeiro nome
  };

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-[#0a0a0f]">
      <div className="text-center">
        <Activity className="mx-auto mb-4 animate-pulse text-purple-500" size={48} />
        <p className="text-gray-400">Calculando métricas...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white w-full overflow-x-hidden">
      <div className="w-full max-w-7xl mx-auto px-4 pt-6 md:px-8 md:pt-10 pb-24 space-y-8 animate-in fade-in duration-700">

        {/* HEADER */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Olá, {nomeUsuario} 👋</h1>
            <p className="text-sm text-gray-400 font-medium uppercase tracking-wide">{dataExtenso}</p>
          </div>
          <button className="bg-white/5 border border-white/10 p-3 rounded-xl hover:bg-white/10 transition-all relative group">
            <Bell size={24} className="text-gray-300 group-hover:text-white" />
            {dados.alertas.length > 0 && <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></span>}
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Hoje" value={`R$ ${dados.hoje.faturamento.toFixed(0)}`} subtext="Faturamento" icon={DollarSign} colorTheme="emerald" />
          <StatCard title="Agenda" value={dados.hoje.agendamentos} subtext="Agendamentos" icon={Calendar} colorTheme="blue" onClick={() => onNavigate('agenda')} />
          <StatCard title="Clientes" value={dados.hoje.clientes} subtext="Atendidos" icon={Users} colorTheme="purple" onClick={() => onNavigate('clientes')} />
          <StatCard title="Médio" value={`R$ ${dados.hoje.ticket.toFixed(0)}`} subtext="Ticket Médio" icon={Award} colorTheme="amber" />
        </div>

        {/* GRIDS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* PRÓXIMOS AGENDAMENTOS */}
          <SectionCard title="Próximos" icon={Clock} iconColor="text-blue-400" actionLabel="Agenda" onAction={() => onNavigate('agenda')}>
            {dados.proximosAgendamentos.length > 0 ? dados.proximosAgendamentos.map(ag => (
              <div key={ag.id} className="flex items-center justify-between p-3 bg-slate-800/50 border border-slate-700/50 rounded-xl hover:bg-slate-800 transition-all cursor-pointer">
                <div className="flex items-center gap-4 min-w-0">
                  {/* DATA E HORA */}
                  <div className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-blue-500/10 border border-blue-500/20 shrink-0">
                    <span className="text-xs font-bold text-gray-400">{ag.dataFormatada}</span>
                    <span className="text-sm font-bold text-blue-400">{ag.horario}</span>
                  </div>
                  
                  <div className="min-w-0">
                    <p className="font-bold text-white truncate">{formatarNome(ag.cliente)}</p>
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <User size={10} /> 
                        <span className="truncate uppercase font-bold tracking-wide">{ag.profissional}</span>
                    </div>
                  </div>
                </div>
                <span className="text-sm font-bold text-emerald-400 whitespace-nowrap ml-2">R$ {ag.valor}</span>
              </div>
            )) : <p className="text-gray-500 text-center py-4">Agenda livre.</p>}
          </SectionCard>

          {/* TOP SERVIÇOS */}
          <SectionCard title="Top Serviços" icon={Award} iconColor="text-amber-400">
            {dados.rankingServicos.map((s, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="text-xl">{s.icone}</div>
                  <div>
                    <p className="font-bold text-white text-sm">{s.servico}</p>
                    <p className="text-xs text-gray-400">{s.qtd} vendas</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-emerald-400">R$ {Number(s.faturamento).toFixed(0)}</span>
              </div>
            ))}
          </SectionCard>

        </div>

        {/* AÇÕES RÁPIDAS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <QuickAction label="Agenda" sub="Gerenciar horários" icon={Calendar} colorTheme="blue" onClick={() => onNavigate('agenda')} />
          <QuickAction label="Financeiro" sub="Relatórios" icon={DollarSign} colorTheme="emerald" onClick={() => onNavigate('financeiro')} />
          <QuickAction label="Clientes" sub="Base de contatos" icon={Users} colorTheme="purple" onClick={() => onNavigate('clientes')} />
        </div>

      </div>
    </div>
  );
};