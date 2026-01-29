import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';
import { X, Target, TrendingUp, TrendingDown, Calendar, Zap, AlertTriangle, Users, Award, Minus, Clock } from 'lucide-react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, CartesianGrid, YAxis } from 'recharts';

export const RelatorioAvancadoModal = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState('visao'); // 'visao' ou 'insights'
  
  // Estados de Dados
  const [grafico, setGrafico] = useState([]);
  const [kpis, setKpis] = useState({});
  const [ranking, setRanking] = useState([]);
  const [meta, setMeta] = useState(10000);
  const [insights, setInsights] = useState([]);
  const [ritmoDiario, setRitmoDiario] = useState({ faltamDias: 0, necessarioPorDia: 0 });

  useEffect(() => {
    if (!isOpen) return;

    const carregarTudo = async () => {
      setLoading(true);
      
      // 1. Gráfico Comparativo
      const { data: graf } = await supabase.from('vw_grafico_comparativo').select('*').order('dia');
      if (graf) setGrafico(graf);

      // 2. KPIs Avançados (Calculados no SQL)
      const { data: kpiData } = await supabase.from('vw_kpis_avancados').select('*').single();
      
      // 3. Ranking Inteligente
      const { data: rank } = await supabase.from('vw_ranking_inteligente').select('*').limit(5);
      if (rank) setRanking(rank);

      // 4. Meta
      const hojeISO = new Date().toISOString().slice(0, 7);
      const { data: metaDb } = await supabase.from('metas').select('valor').ilike('mes', `${hojeISO}%`).maybeSingle();
      const valorMeta = metaDb ? metaDb.valor : 10000;
      setMeta(valorMeta);

      // --- CÁLCULOS NO FRONTEND (Luni Intelligence) ---
      
      if (kpiData) {
        // Cálculo Taxa No-Show
        const taxaNoShow = kpiData.total_agendamentos > 0 
          ? (kpiData.qtd_noshow / kpiData.total_agendamentos) * 100 
          : 0;

        // Cálculo Receita por Dia Ativo
        const receitaPorDia = kpiData.dias_ativos > 0 
          ? kpiData.fat_atual / kpiData.dias_ativos 
          : 0;

        // Cálculo "Ritmo de Meta" (Quantos dias faltam?)
        const hoje = new Date();
        const ultimoDiaMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate();
        const diasRestantes = Math.max(0, ultimoDiaMes - hoje.getDate());
        const faltaParaMeta = Math.max(0, valorMeta - kpiData.fat_atual);
        const necessarioDia = diasRestantes > 0 ? faltaParaMeta / diasRestantes : 0;

        setRitmoDiario({ faltamDias: diasRestantes, necessarioPorDia: necessarioDia });

        setKpis({
          ...kpiData,
          taxaNoShow,
          receitaPorDia,
          crescimento: kpiData.fat_anterior > 0 ? ((kpiData.fat_atual - kpiData.fat_anterior) / kpiData.fat_anterior) * 100 : 0
        });

        // Gerar Insights de Texto
        const novosInsights = [];
        
        // Insight 1: Meta
        if (kpiData.fat_atual >= valorMeta) {
          novosInsights.push({ tipo: 'sucesso', texto: 'Incrível! Meta batida com antecedência. 🚀' });
        } else if (necessarioDia > (receitaPorDia * 1.5)) {
          novosInsights.push({ tipo: 'alerta', texto: `Atenção: Para bater a meta, você precisa vender R$ ${Math.round(necessarioDia)}/dia (acima da sua média atual).` });
        } else {
          novosInsights.push({ tipo: 'aviso', texto: `Ritmo bom! Faltam ${diasRestantes} dias. Mantenha o foco.` });
        }

        // Insight 2: No-Show
        if (taxaNoShow > 15) {
          novosInsights.push({ tipo: 'alerta', texto: `Cuidado: Sua taxa de faltas está em ${taxaNoShow.toFixed(1)}%. Tente confirmar agendamentos no WhatsApp.` });
        }

        setInsights(novosInsights);
      }

      setLoading(false);
    };

    carregarTudo();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#F8F9FC] rounded-[32px] w-full max-w-4xl h-[90vh] overflow-hidden flex flex-col relative animate-in fade-in zoom-in duration-300 shadow-2xl">
        
        {/* Header */}
        <div className="bg-white px-8 py-6 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Zap className="text-[#5B2EFF] fill-[#5B2EFF]" size={24}/> Luni Intelligence
            </h2>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span className="bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded text-xs">Meta: R$ {meta.toLocaleString()}</span>
              {ritmoDiario.necessarioPorDia > 0 && (
                <span className="text-orange-500 font-medium text-xs flex items-center gap-1">
                  <Clock size={12}/> Meta diária necessária: R$ {Math.round(ritmoDiario.necessarioPorDia)}
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-gray-50 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"><X size={20}/></button>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto p-8">
          
          <div className="flex gap-4 mb-8">
            <button onClick={() => setAbaAtiva('visao')} className={`px-6 py-2 rounded-full font-bold text-sm transition-all ${abaAtiva === 'visao' ? 'bg-[#5B2EFF] text-white shadow-lg' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>Visão Geral</button>
            <button onClick={() => setAbaAtiva('insights')} className={`px-6 py-2 rounded-full font-bold text-sm transition-all flex items-center gap-2 ${abaAtiva === 'insights' ? 'bg-[#5B2EFF] text-white shadow-lg' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>
              Insights <span className="bg-red-500 text-white text-[10px] px-1.5 rounded-full">{insights.length}</span>
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64 text-gray-400">Analisando dados...</div>
          ) : (
            <>
              {/* === ABA VISÃO GERAL === */}
              {abaAtiva === 'visao' && (
                <div className="space-y-6">
                  
                  {/* Cards KPI Eficiência */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Card 1: Faturamento/Dia */}
                    <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
                      <p className="text-gray-400 text-xs font-bold uppercase mb-1">Média Diária</p>
                      <div className="flex items-center gap-2">
                        <Award className="text-blue-500"/>
                        <h3 className="text-2xl font-bold text-blue-600">R$ {Math.round(kpis.receitaPorDia)}</h3>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">Em dias ativos</p>
                    </div>

                    {/* Card 2: No-Show */}
                    <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
                      <p className="text-gray-400 text-xs font-bold uppercase mb-1">Taxa de Faltas</p>
                      <div className="flex items-center gap-2">
                        <AlertTriangle className={kpis.taxaNoShow > 10 ? "text-red-500" : "text-green-500"}/>
                        <h3 className={`text-2xl font-bold ${kpis.taxaNoShow > 10 ? "text-red-600" : "text-green-600"}`}>
                          {kpis.taxaNoShow.toFixed(1)}%
                        </h3>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">{kpis.qtd_noshow} agendamentos perdidos</p>
                    </div>

                    {/* Card 3: Crescimento */}
                    <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
                      <p className="text-gray-400 text-xs font-bold uppercase mb-1">Performance (Mês)</p>
                      <div className="flex items-center gap-2">
                        {kpis.crescimento >= 0 ? <TrendingUp className="text-green-500"/> : <TrendingDown className="text-red-500"/>}
                        <h3 className={`text-2xl font-bold ${kpis.crescimento >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {kpis.crescimento.toFixed(1)}%
                        </h3>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">Vs. mês passado</p>
                    </div>
                  </div>

                  {/* Gráfico Comparativo */}
                  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="font-bold text-gray-800 flex items-center gap-2"><Calendar size={18} className="text-purple-600"/> Tendência Diária</h3>
                      <div className="flex gap-4 text-xs font-bold">
                        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#5B2EFF]"></div> Atual</span>
                        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-gray-300"></div> Anterior</span>
                      </div>
                    </div>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={grafico}>
                          <defs>
                            <linearGradient id="colorAtual" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#5B2EFF" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#5B2EFF" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                          <XAxis dataKey="dia" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#aaa'}} />
                          <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
                          <Area type="monotone" dataKey="valor_anterior" stroke="#E5E7EB" strokeWidth={2} fill="transparent" name="Mês Passado" />
                          <Area type="monotone" dataKey="valor_atual" stroke="#5B2EFF" strokeWidth={3} fill="url(#colorAtual)" name="Este Mês" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Ranking Inteligente */}
                  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <h3 className="font-bold text-gray-800 mb-4">🥇 Serviços Mais Rentáveis</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="text-xs text-gray-400 border-b border-gray-50 uppercase tracking-wider">
                            <th className="pb-3 pl-2">Serviço</th>
                            <th className="pb-3 text-center">Tendência</th>
                            <th className="pb-3 text-right">Qtd</th>
                            <th className="pb-3 text-right pr-2">Total</th>
                          </tr>
                        </thead>
                        <tbody className="text-sm">
                          {ranking.map((r, i) => (
                            <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                              <td className="py-3 pl-2 font-bold text-gray-700">{r.servico}</td>
                              <td className="py-3 text-center">
                                {r.tendencia === 'up' && <span className="bg-green-100 text-green-700 px-2 py-1 rounded-md text-xs font-bold inline-flex items-center gap-1"><TrendingUp size={12}/> Sobe</span>}
                                {r.tendencia === 'down' && <span className="bg-red-100 text-red-700 px-2 py-1 rounded-md text-xs font-bold inline-flex items-center gap-1"><TrendingDown size={12}/> Cai</span>}
                                {r.tendencia === 'equal' && <span className="bg-gray-100 text-gray-500 px-2 py-1 rounded-md text-xs font-bold inline-flex items-center gap-1"><Minus size={12}/> Igual</span>}
                              </td>
                              <td className="py-3 text-right text-gray-500">{r.qtd_atual}</td>
                              <td className="py-3 pr-2 text-right font-bold text-[#5B2EFF]">R$ {r.valor_atual}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* === ABA INSIGHTS === */}
              {abaAtiva === 'insights' && (
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-6 rounded-3xl text-white shadow-lg mb-6">
                    <h3 className="text-xl font-bold mb-2">🧠 Inteligência Artificial</h3>
                    <p className="opacity-90 text-sm">Analisamos seus números para te dar sugestões práticas.</p>
                  </div>
                  {insights.map((insight, index) => (
                    <div key={index} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex gap-4 items-start">
                      <div className={`p-3 rounded-xl shrink-0 ${
                        insight.tipo === 'sucesso' ? 'bg-green-100 text-green-600' :
                        insight.tipo === 'alerta' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'
                      }`}>
                        {insight.tipo === 'sucesso' ? <TrendingUp size={24}/> : insight.tipo === 'alerta' ? <AlertTriangle size={24}/> : <Target size={24}/>}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-800 capitalize mb-1">{insight.tipo}</h4>
                        <p className="text-gray-500 text-sm leading-relaxed">{insight.texto}</p>
                      </div>
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