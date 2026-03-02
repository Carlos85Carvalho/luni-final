// src/screens/financeiro/visao-geral/VisaoGeral.jsx
import React from 'react';
import { useVisaoGeral } from './VisaoGeralHooks';
import { KPIcards } from './KPIcards';
import { BarChart3, PieChart as PieChartIcon, Filter } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

export const VisaoGeral = () => {
  const { kpis, periodo, setPeriodo, filtroAtivo, setFiltroAtivo, aplicarAtalho, graficoEvolucao, graficoDistribuicao, loading } = useVisaoGeral();
  const COLORS_PIE = ['#8b5cf6', '#ec4899', '#06b6d4', '#f59e0b', '#10b981'];

  return (
    <div className="space-y-6 pb-20 p-2 md:p-4 relative overflow-hidden">
      {/* 🚀 EFEITO LUNI DEEP (FUNDOS COM BRILHO SUTIL) */}
      <div className="absolute top-[-10%] left-[-5%] w-[60%] h-[50%] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[0%] right-[-5%] w-[50%] h-[40%] bg-blue-600/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative z-10">
        {/* FILTROS RESPONSIVOS SÓLIDOS */}
        <div className="bg-[#1c1c22] border border-gray-800 p-4 md:p-6 rounded-3xl space-y-4 shadow-lg mb-6">
          <div className="flex items-center gap-2 px-2">
            <Filter className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-bold text-white uppercase tracking-wider">Período de Análise</span>
          </div>
          
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {['hoje', 'semana', 'mes', 'ano'].map((t) => (
              <button key={t} onClick={() => aplicarAtalho(t)} 
                className={`flex-1 min-w-[90px] py-2.5 rounded-2xl text-xs font-bold transition-all border 
                ${filtroAtivo === t ? 'bg-purple-600 border-purple-500 text-white' : 'bg-transparent border-gray-700 text-gray-400 hover:border-gray-500'}`}>
                {t === 'mes' ? 'Mês' : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-800">
            <div className="flex flex-col">
               <span className="text-[10px] text-gray-500 mb-1 ml-1">Data Inicial</span>
               <input type="date" value={periodo.inicio} onChange={e => { setPeriodo({...periodo, inicio: e.target.value}); setFiltroAtivo('custom'); }} className="bg-gray-900 border border-gray-700 text-white text-[11px] rounded-xl px-4 py-2.5 outline-none [color-scheme:dark] w-full" />
            </div>
            <div className="flex flex-col">
               <span className="text-[10px] text-gray-500 mb-1 ml-1">Data Final</span>
               <input type="date" value={periodo.fim} onChange={e => { setPeriodo({...periodo, fim: e.target.value}); setFiltroAtivo('custom'); }} className="bg-gray-900 border border-gray-700 text-white text-[11px] rounded-xl px-4 py-2.5 outline-none [color-scheme:dark] w-full" />
            </div>
          </div>
        </div>

        <KPIcards kpis={kpis} loading={loading} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* FLUXO DE CAIXA */}
          <div className="bg-[#1c1c22] rounded-3xl border border-gray-800 p-6 md:p-8 flex flex-col min-h-[400px] shadow-lg">
            <h3 className="text-white font-bold mb-6 flex items-center gap-2 text-sm"><BarChart3 size={18} className="text-purple-400" /> Fluxo de Caixa Histórico</h3>
            <div className="flex-1 w-full h-[300px]">
              {loading ? (
                 <div className="w-full h-full animate-pulse bg-gray-800 rounded-2xl" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={graficoEvolucao}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis dataKey="name" stroke="#666" fontSize={11} axisLine={false} tickLine={false} />
                    <YAxis stroke="#666" fontSize={11} axisLine={false} tickLine={false} />
                    {/* 🚀 TOOLTIP CORRIGIDO PARA O GRÁFICO DE BARRAS */}
                    <Tooltip 
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                      contentStyle={{ backgroundColor: '#18181b', borderRadius: '12px', border: '1px solid #333' }} 
                      itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                      labelStyle={{ color: '#a1a1aa', marginBottom: '4px' }}
                      formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`]}
                    />
                    <Bar dataKey="Receita" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={45} />
                    <Bar dataKey="Despesa" fill="#ec4899" radius={[4, 4, 0, 0]} maxBarSize={45} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* DISTRIBUIÇÃO DE DESPESAS */}
          <div className="bg-[#1c1c22] rounded-3xl border border-gray-800 p-6 md:p-8 flex flex-col min-h-[400px] shadow-lg">
            <h3 className="text-white font-bold mb-6 flex items-center gap-2 text-sm"><PieChartIcon size={18} className="text-pink-400" /> Distribuição de Despesas</h3>
            <div className="flex-1 w-full h-[300px]">
               {loading ? (
                 <div className="w-full h-full animate-pulse bg-gray-800 rounded-2xl" />
              ) : graficoDistribuicao.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={graficoDistribuicao} innerRadius={70} outerRadius={110} paddingAngle={5} dataKey="value">
                      {graficoDistribuicao.map((_, i) => <Cell key={i} fill={COLORS_PIE[i % COLORS_PIE.length]} stroke="none" />)}
                    </Pie>
                    {/* 🚀 TOOLTIP CORRIGIDO PARA O GRÁFICO DE PIZZA */}
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#18181b', borderRadius: '12px', border: '1px solid #333' }} 
                      itemStyle={{ color: '#fff', fontWeight: 'bold', textTransform: 'capitalize' }}
                      formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`]}
                    />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <div className="h-full flex items-center justify-center text-gray-500 text-xs">Sem despesas registradas.</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};