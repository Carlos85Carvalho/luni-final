import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom'; 
import { supabase } from '../../services/supabase';
import { 
  Calendar, Bell, Clock, DollarSign, Users, 
  Award, Activity, Gift, MessageCircle, X
} from 'lucide-react';

import { StatCard } from '../../components/ui/StatCard';
import { SectionCard } from '../../components/ui/SectionCard';
import { QuickAction } from '../../components/ui/QuickAction';

// --- Modal de Envio de Mensagem de Aniversário ---
const ModalMensagemAniversario = ({ isOpen, onClose, cliente }) => {
  const [mensagem, setMensagem] = useState('');

  useEffect(() => {
    if (cliente) {
      const primeiroNome = cliente.nome.split(' ')[0];
      setMensagem(`Olá ${primeiroNome}, parabéns pelo seu dia! 🎉\n\nNós do salão desejamos muitas felicidades, saúde e sucesso!\n\nComo presente, liberamos um cupom de *20% de desconto* em qualquer serviço para você usar esta semana. Vamos agendar seu momento de beleza? ✨`);
    }
  }, [cliente]);

  if (!isOpen || !cliente) return null;

  const enviarWhatsApp = () => {
    if (!cliente.telefone) {
      alert("Este cliente não tem telefone cadastrado.");
      return;
    }
    const num = cliente.telefone.replace(/\D/g, '');
    window.open(`https://wa.me/55${num}?text=${encodeURIComponent(mensagem)}`, '_blank');
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#18181b] border border-white/10 w-full max-w-sm rounded-3xl p-6 shadow-2xl relative flex flex-col animate-in slide-in-from-bottom-4">
        
        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/5 rounded-full text-gray-400 hover:bg-white/10 transition-colors">
          <X size={18}/>
        </button>

        <div className="flex items-center gap-3 mb-4 mt-2">
          <div className="w-12 h-12 bg-pink-500/10 rounded-full flex items-center justify-center text-pink-500 border border-pink-500/20">
            <Gift size={24}/>
          </div>
          <div>
            <h2 className="text-lg font-bold text-white leading-tight">Feliz Aniversário</h2>
            <p className="text-sm text-gray-400">Para: <span className="text-white font-medium">{cliente.nome}</span></p>
          </div>
        </div>

        <div className="space-y-2 mb-6">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">Editar Mensagem (Opcional)</label>
          <textarea
            className="w-full bg-[#09090b] border border-white/10 rounded-xl p-4 text-sm text-white outline-none focus:border-pink-500 transition-all min-h-[140px] resize-none custom-scrollbar"
            value={mensagem}
            onChange={(e) => setMensagem(e.target.value)}
          />
        </div>

        <button 
          onClick={enviarWhatsApp} 
          className="w-full py-4 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-2xl font-bold flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-green-900/20"
        >
          <MessageCircle size={22} /> Enviar Mensagem
        </button>
      </div>
    </div>,
    document.body
  );
};


export const DashboardAdmin = ({ onNavigate }) => {
  const [loading, setLoading] = useState(true);
  const [nomeAdmin, setNomeAdmin] = useState('Admin'); 
  
  const [dados, setDados] = useState({
    hoje: { faturamento: 0, agendamentos: 0, clientes: 0, ticket: 0 },
    mes: { faturamento: 0, meta: 15000, percentual: 0, diasRestantes: 0 },
    proximosAgendamentos: [],
    alertas: [],
    rankingServicos: [],
    clientesRecentes: [],
    aniversariantesHoje: [] 
  });

  const [modalAniversario, setModalAniversario] = useState({ open: false, cliente: null });

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const nomeGoogle = user.user_metadata?.full_name?.split(' ')[0] 
                        || user.user_metadata?.name?.split(' ')[0] 
                        || 'Admin';
        setNomeAdmin(nomeGoogle);

        const { data: userData } = await supabase
          .from('usuarios')
          .select('salao_id')
          .eq('id', user.id)
          .single();

        const salaoId = userData?.salao_id;
        if (!salaoId) return;

        const hojeData = new Date();
        const hojeISO = hojeData.toLocaleDateString('en-CA'); 
        const inicioMes = new Date(hojeData.getFullYear(), hojeData.getMonth(), 1).toISOString();
        const fimMes = new Date(hojeData.getFullYear(), hojeData.getMonth() + 1, 0).toISOString();
        
        const [, mesHoje, diaHoje] = hojeISO.split('-');
        
        const [agendHoje, vendasHoje, agendMes, vendasMes, proximos, clientesRecentes, clientesComNascimento] = await Promise.all([
          supabase.from('agendamentos').select('*').eq('salao_id', salaoId).eq('data', hojeISO).neq('status', 'cancelado'),
          supabase.from('vendas').select('*').eq('salao_id', salaoId).gte('data_venda', hojeISO + 'T00:00:00').lte('data_venda', hojeISO + 'T23:59:59'),
          supabase.from('agendamentos').select('*').eq('salao_id', salaoId).gte('data', inicioMes).lte('data', fimMes).neq('status', 'cancelado'),
          supabase.from('vendas').select('*').eq('salao_id', salaoId).gte('data_venda', inicioMes).lte('data_venda', fimMes).neq('status', 'cancelado'),
          supabase.from('agendamentos').select('*, profissionais(nome)').eq('salao_id', salaoId).gte('data', hojeISO).neq('status', 'cancelado').order('data', { ascending: true }).order('horario', { ascending: true }).limit(5),
          supabase.from('clientes').select('*').eq('salao_id', salaoId).order('created_at', { ascending: false }).limit(3),
          supabase.from('clientes').select('id, nome, telefone, data_nascimento').eq('salao_id', salaoId).not('data_nascimento', 'is', null)
        ]);

        const aniversariantesDoDia = (clientesComNascimento.data || []).filter(c => {
           const [, mesCli, diaCli] = c.data_nascimento.split('-');
           return mesCli === mesHoje && diaCli === diaHoje;
        });

        const calcValor = (item) => Number(item.total || item.valor_total || item.valor || 0);

        const fatHoje = (agendHoje.data?.reduce((acc, curr) => acc + calcValor(curr), 0) || 0) + 
                        (vendasHoje.data?.reduce((acc, curr) => acc + calcValor(curr), 0) || 0);
        
        const fatMes = (agendMes.data?.reduce((acc, curr) => acc + calcValor(curr), 0) || 0) + 
                       (vendasMes.data?.reduce((acc, curr) => acc + calcValor(curr), 0) || 0);
        
        const qtdAtendimentosHoje = (agendHoje.data?.length || 0);

        setDados({
          hoje: { 
            faturamento: fatHoje, 
            agendamentos: qtdAtendimentosHoje, 
            clientes: new Set(agendHoje.data?.map(a => a.cliente_nome)).size, 
            ticket: qtdAtendimentosHoje > 0 ? fatHoje / qtdAtendimentosHoje : 0 
          },
          mes: { 
            faturamento: fatMes, 
            meta: 15000, 
            percentual: Math.min((fatMes / 15000) * 100, 100), 
            diasRestantes: new Date(hojeData.getFullYear(), hojeData.getMonth() + 1, 0).getDate() - hojeData.getDate() 
          },
          proximosAgendamentos: proximos.data?.map(a => ({
              id: a.id,
              dataFormatada: a.data.split('-').reverse().slice(0, 2).join('/'),
              horario: a.horario ? a.horario.slice(0, 5) : '--:--',
              cliente: a.cliente_nome || 'Cliente',
              servico: a.servico,
              profissional: a.profissionais?.nome || 'Equipe',
              valor: calcValor(a)
          })) || [],
          alertas: qtdAtendimentosHoje === 0 ? [{ tipo: 'info', titulo: 'Agenda livre', mensagem: 'Nenhum agendamento hoje.', icon: Clock }] : [],
          rankingServicos: Object.entries(agendMes.data?.reduce((acc, a) => {
              const n = a.servico || 'Outros';
              if (!acc[n]) acc[n] = { qtd: 0, faturamento: 0 };
              acc[n].qtd += 1;
              acc[n].faturamento += calcValor(a);
              return acc;
          }, {}) || {}).map(([k, v], i) => ({ servico: k, ...v, icone: ['🎨', '✂️', '💅', '✨'][i % 4] })).sort((a, b) => b.faturamento - a.faturamento).slice(0, 3),
          clientesRecentes: clientesRecentes.data || [],
          aniversariantesHoje: aniversariantesDoDia
        });

      } catch (error) {
        console.error("Erro dashboard:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const dataExtenso = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-[#0a0a0f]">
      <div className="text-center">
        <Activity className="mx-auto mb-4 animate-pulse text-purple-500" size={48} />
        <p className="text-gray-400">Carregando painel...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white w-full overflow-x-hidden">
      
      <ModalMensagemAniversario 
        isOpen={modalAniversario.open} 
        onClose={() => setModalAniversario({ open: false, cliente: null })} 
        cliente={modalAniversario.cliente} 
      />

      <div className="w-full max-w-7xl mx-auto px-4 pt-6 md:px-8 md:pt-10 pb-24 space-y-8 animate-in fade-in duration-700">
        
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Olá, {nomeAdmin} 👋</h1>
            <p className="text-sm text-gray-400 font-medium uppercase tracking-wide">{dataExtenso}</p>
          </div>
          <button className="bg-white/5 border border-white/10 p-3 rounded-xl hover:bg-white/10 transition-all">
            <Bell size={24} className="text-gray-300" />
          </button>
        </div>

        {/* 4 Cards de Métricas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Hoje" value={`R$ ${dados.hoje.faturamento.toFixed(0)}`} subtext="Total (PDV+Agenda)" icon={DollarSign} colorTheme="emerald" />
          <StatCard title="Agenda" value={dados.hoje.agendamentos} subtext="Atendimentos" icon={Calendar} colorTheme="blue" onClick={() => onNavigate('agenda')} />
          <StatCard title="Clientes" value={dados.hoje.clientes} subtext="Hoje" icon={Users} colorTheme="purple" onClick={() => onNavigate('clientes')} />
          <StatCard title="Médio" value={`R$ ${dados.hoje.ticket.toFixed(0)}`} subtext="Ticket" icon={Award} colorTheme="amber" />
        </div>

        {/* 🚀 NOVO BANNER EXCLUSIVO E LARGO DE ANIVERSARIANTES */}
        <div className="w-full bg-[#18181b] border border-white/5 rounded-3xl p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 bg-pink-500 h-full"></div>
          
          <div className="flex items-center gap-2 mb-4">
            <Gift className="text-pink-500" size={20}/>
            <h2 className="text-lg font-bold text-white">Aniversariantes de Hoje</h2>
          </div>

          {dados.aniversariantesHoje.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {dados.aniversariantesHoje.map((cliente) => (
                <div key={cliente.id} className="flex items-center justify-between p-3 bg-pink-500/5 border border-pink-500/20 rounded-2xl transition-colors hover:bg-pink-500/10">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-pink-500/20 text-pink-400 flex items-center justify-center font-bold text-lg border border-pink-500/30 shrink-0">
                      {cliente.nome.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-white text-sm truncate">{cliente.nome}</p>
                      <p className="text-[10px] text-pink-400 uppercase font-bold flex items-center gap-1 mt-0.5">
                        <Gift size={10}/> Hoje!
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setModalAniversario({ open: true, cliente })}
                    className="p-2.5 bg-green-500/20 text-green-400 rounded-xl hover:bg-green-500/30 transition-all border border-green-500/30 shadow-sm shrink-0 ml-2"
                    title="Enviar Parabéns no WhatsApp"
                  >
                    <MessageCircle size={18} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Nenhum cliente cadastrado faz aniversário hoje.</p>
          )}
        </div>

        {/* Grid de Agenda e Serviços (Restaurado ao normal) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SectionCard title="Próximos" icon={Clock} iconColor="text-blue-400" actionLabel="Agenda" onAction={() => onNavigate('agenda')}>
            {dados.proximosAgendamentos.length > 0 ? dados.proximosAgendamentos.map(ag => (
              <div key={ag.id} className="flex items-center justify-between p-3 bg-slate-800/50 border border-slate-700/50 rounded-xl">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-blue-500/10 border border-blue-500/20 shrink-0">
                    <span className="text-xs font-bold text-gray-400">{ag.dataFormatada}</span>
                    <span className="text-sm font-bold text-blue-400">{ag.horario}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-white truncate">{ag.cliente.split(' ')[0]}</p>
                    <p className="text-xs text-gray-400 uppercase font-bold">{ag.profissional}</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-emerald-400">R$ {ag.valor}</span>
              </div>
            )) : <p className="text-gray-500 text-center py-4">Agenda livre.</p>}
          </SectionCard>

          <SectionCard title="Top Serviços" icon={Award} iconColor="text-amber-400">
            {dados.rankingServicos.length > 0 ? dados.rankingServicos.map((s, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="text-xl">{s.icone}</div>
                  <div>
                    <p className="font-bold text-white text-sm">{s.servico}</p>
                    <p className="text-xs text-gray-400">{s.qtd} atendimentos</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-emerald-400">R$ {Number(s.faturamento).toFixed(0)}</span>
              </div>
            )) : <p className="text-gray-500 text-center py-4">Sem dados no mês.</p>}
          </SectionCard>
        </div>

        {/* Botões Rápidos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <QuickAction label="Agenda" sub="Gerenciar horários" icon={Calendar} colorTheme="blue" onClick={() => onNavigate('agenda')} />
          <QuickAction label="Financeiro" sub="Relatórios" icon={DollarSign} colorTheme="emerald" onClick={() => onNavigate('financeiro')} />
          <QuickAction label="Clientes" sub="Base de contatos" icon={Users} colorTheme="purple" onClick={() => onNavigate('clientes')} />
        </div>

      </div>
    </div>
  );
};