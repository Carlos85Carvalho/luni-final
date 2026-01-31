import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';
import { 
  X, Target, TrendingUp, TrendingDown, Calendar, Zap, 
  AlertTriangle, Users, Award, Minus, Clock, BrainCircuit,
  ArrowUpRight, BarChart3, CheckCircle2, Loader2
} from 'lucide-react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, CartesianGrid, YAxis } from 'recharts';

export const RelatorioAvancadoModal = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState('visao');
  
  const [kpis, setKpis] = useState({});
  const [ranking, setRanking] = useState([]);
  const [meta, setMeta] = useState(15000); 
  const [insights, setInsights] = useState([]);

  useEffect(() => {
    if (!isOpen) return;

    const carregarInteligencia = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const { data: usu } = await supabase.from('usuarios').select('salao_id').eq('id', user.id).maybeSingle();
        
        if (!usu?.salao_id) { setLoading(false); return; }

        const hoje = new Date();
        const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0];
        const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().split('T')[0];

        // Busca dados reais
        const { data: agendamentos } = await supabase
          .from('agendamentos')
          .select('*, profissionais(nome)')
          .eq('salao_id', usu.salao_id)
          .gte('data', inicioMes)
          .lte('data', fimMes);

        if (agendamentos) {
          // --- CÁLCULOS NO FRONTEND (Sem View) ---
          const realizado = agendamentos.filter(a => a.status === 'concluido')
            .reduce((acc, curr) => acc + Number(curr.valor_total || curr.valor || 0), 0);
          
          const totalAtendimentos = agendamentos.filter(a => a.status === 'concluido').length;
          const noShows = agendamentos.filter(a => a.status === 'cancelado').length;

          // Ticket Médio
          const ticket = totalAtendimentos > 0 ? realizado / totalAtendimentos : 0;

          // Projeção
          const diasNoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate();
          const diaAtual = hoje.getDate();
          const mediaPorDia = diaAtual > 0 ? realizado / diaAtual : 0; 
          const projecaoFinal = mediaPorDia * diasNoMes;

          // Ranking
          const profEficiencia = {};
          agendamentos.filter(a => a.status === 'concluido').forEach(a => {
             const nome = a.profissionais?.nome || 'Equipe';
             if (!profEficiencia[nome]) profEficiencia[nome] = { total: 0, qtd: 0 };
             profEficiencia[nome].total += Number(a.valor_total || a.valor || 0);
             profEficiencia[nome].qtd += 1;
          });

          const rankingFinal = Object.entries(profEficiencia).map(([nome, v]) => ({
             servico: nome,
             valor_atual: v.total,
             qtd_atual: v.qtd,
             tendencia: v.qtd > 0 && (v.total / v.qtd) > ticket ? 'up' : 'down'
          })).sort((a, b) => b.valor_atual - a.valor_atual);

          setKpis({
            fat_atual: realizado,
            projecao: projecaoFinal,
            ticket,
            taxaNoShow: agendamentos.length > 0 ? (noShows / agendamentos.length) * 100 : 0,
            qtd_noshow: noShows
          });

          setRanking(rankingFinal);

          // Insights
          const listInsights = [];
          if (projecaoFinal < meta) {
            listInsights.push({ tipo: 'alerta', texto: `Tendência de queda: Sua projeção final (R$ ${Math.round(projecaoFinal)}) está abaixo da meta.` });
          } else {
            listInsights.push({ tipo: 'sucesso', texto: `Excelente ritmo! Sua projeção indica superação da meta.` });
          }
          if (noShows > 3) {
            listInsights.push({ tipo: 'aviso', texto: `Você teve ${noShows} cancelamentos. Isso representa R$ ${Math.round(noShows * ticket)} a menos no caixa.` });
          }

          setInsights(listInsights);
        }
      } catch (e) {
        console.error("Erro Relatorio:", e);
      } finally {
        setLoading(false);
      }
    };

    carregarInteligencia();
  }, [isOpen, meta]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-hidden">
      <div className="bg-[#fcfcfd] rounded-[40px] w-full max-w-5xl h-[92vh] flex flex-col relative animate-in zoom-in-95 duration-300 shadow-[0_0_50px_rgba(0,0,0,0.3)] border border-white/20">
        
        <div className="bg-white px-10 py-8 border-b border-gray-100 flex justify-between items-center rounded-t-[40px]">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#5B2EFF] rounded-2xl shadow-lg shadow-purple-500/20"><BrainCircuit className="text-white" size={28}/></div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Luni <span className="text-[#5B2EFF]">Intelligence</span></h2>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2"><BarChart3 size={12}/> Relatório Analítico Mensal</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 bg-gray-50 rounded-2xl hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all"><X size={24}/></button>
        </div>

        <div className="flex-1 overflow-y-auto p-10 bg-[#fcfcfd]">
          <div className="flex bg-gray-100/50 p-1.5 rounded-2xl w-fit mb-10 border border-gray-200">
            <button onClick={() => setAbaAtiva('visao')} className={`px-8 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${abaAtiva === 'visao' ? 'bg-white text-[#5B2EFF] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>Visão Estratégica</button>
            <button onClick={() => setAbaAtiva('insights')} className={`px-8 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 ${abaAtiva === 'insights' ? 'bg-white text-[#5B2EFF] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>Insights de IA <span className="bg-[#5B2EFF] text-white text-[10px] px-2 py-0.5 rounded-full">{insights.length}</span></button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center h-96 gap-4"><Loader2 className="animate-spin text-[#5B2EFF]" size={40}/><p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Analisando dados...</p></div>
          ) : (
            <>
              {abaAtiva === 'visao' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                    <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm group">
                      <p className="text-gray-400 text-[10px] font-black uppercase tracking-tighter mb-4">Projeção Final</p>
                      <div className="flex items-center justify-between"><h3 className="text-2xl font-bold text-gray-900">R$ {Math.round(kpis.projecao || 0)}</h3><div className="p-2 bg-blue-50 text-blue-500 rounded-xl group-hover:rotate-12 transition-transform"><ArrowUpRight size={20}/></div></div>
                      <p className="text-[10px] text-blue-500 font-bold mt-2 italic">Expectativa de fechamento</p>
                    </div>
                    <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm group">
                      <p className="text-gray-400 text-[10px] font-black uppercase tracking-tighter mb-4">Perda por No-Show</p>
                      <div className="flex items-center justify-between"><h3 className="text-2xl font-bold text-red-600">R$ {Math.round(kpis.qtd_noshow * kpis.ticket)}</h3><div className="p-2 bg-red-50 text-red-500 rounded-xl group-hover:shake transition-transform"><AlertTriangle size={20}/></div></div>
                      <p className="text-[10px] text-red-400 font-bold mt-2 uppercase">{kpis.taxaNoShow?.toFixed(1)}% de evasão</p>
                    </div>
                    <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm group md:col-span-2">
                       <div className="flex justify-between items-center mb-4"><p className="text-gray-400 text-[10px] font-black uppercase tracking-tighter">Status da Meta</p><span className="text-xs font-black text-[#5B2EFF]">{Math.round((kpis.fat_atual / meta) * 100)}%</span></div>
                       <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-3"><div className="h-full bg-gradient-to-r from-[#5B2EFF] to-fuchsia-500 transition-all duration-1000" style={{width: `${(kpis.fat_atual / meta) * 100}%`}}></div></div>
                       <p className="text-[10px] text-gray-400 font-bold">Faltam R$ {Math.max(0, meta - kpis.fat_atual).toLocaleString()} para atingir o objetivo.</p>
                    </div>
                  </div>
                  <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-xl">
                    <h3 className="text-lg font-black text-gray-900 mb-8 flex items-center gap-2"><Award className="text-amber-500"/> Performance Financeira por Profissional</h3>
                    <div className="space-y-6">
                      {ranking.map((r, i) => (
                        <div key={i} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-3xl transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-gray-900 flex items-center justify-center text-white font-bold text-lg">{i + 1}</div>
                            <div><p className="font-black text-gray-800 uppercase text-xs tracking-wider">{r.servico}</p><p className="text-[10px] text-gray-400 font-bold">{r.qtd_atual} atendimentos concluídos</p></div>
                          </div>
                          <div className="text-right">
                             <p className="text-lg font-black text-gray-900">R$ {r.valor_atual.toLocaleString()}</p>
                             <span className={`text-[10px] font-black uppercase ${r.tendencia === 'up' ? 'text-emerald-500' : 'text-red-400'}`}>{r.tendencia === 'up' ? 'Acima do Ticket Médio' : 'Abaixo do Ticket Médio'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {abaAtiva === 'insights' && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                  <div className="bg-[#5B2EFF] p-10 rounded-[40px] text-white relative overflow-hidden mb-10 shadow-2xl shadow-purple-500/20">
                     <BrainCircuit className="absolute -right-10 -bottom-10 opacity-10 w-64 h-64 rotate-12"/><h3 className="text-3xl font-black mb-4">Análise de IA</h3><p className="text-purple-100 text-sm max-w-md font-medium leading-relaxed">Sugestões baseadas nos seus dados atuais.</p>
                  </div>
                  {insights.map((insight, index) => (
                    <div key={index} className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm flex gap-6 items-start hover:border-[#5B2EFF]/30 transition-all">
                      <div className={`p-4 rounded-2xl shrink-0 ${insight.tipo === 'sucesso' ? 'bg-emerald-50 text-emerald-600' : insight.tipo === 'alerta' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>{insight.tipo === 'sucesso' ? <CheckCircle2 size={28}/> : <Zap size={28}/>}</div>
                      <div><h4 className="font-black text-gray-900 uppercase text-xs tracking-widest mb-2">{insight.tipo}</h4><p className="text-gray-500 text-sm font-medium leading-relaxed">{insight.texto}</p></div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};