import React from 'react';
import { useVisaoGeral } from './VisaoGeralHooks';
import { KPIcards } from './KPIcards';
import { BarChart3, PieChart as PieChartIcon, Activity } from 'lucide-react';
// Importações da biblioteca de gráficos
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

// --- CORREÇÃO: COMPONENTE DECLARADO FORA PARA EVITAR RE-RENDER INFINITO ---
const ChartLoading = () => (
  <div className="h-[300px] flex items-center justify-center animate-pulse">
    <div className="w-full h-full bg-gray-700/30 rounded-xl"></div>
  </div>
);

export const VisaoGeral = () => {
  // Agora pegamos também os dados dos gráficos do hook
  const { kpis, graficoEvolucao, graficoDistribuicao, loading } = useVisaoGeral();

  // Cores para o gráfico de pizza
  const COLORS_PIE = ['#8b5cf6', '#ec4899', '#06b6d4', '#f59e0b', '#10b981'];

  return (
    <div className="space-y-6">
      {/* Cards do Topo (Receita, Despesa, Saldo) */}
      <KPIcards kpis={kpis} loading={loading} />

      {/* Grid dos Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* --- GRÁFICO 1: FLUXO DE CAIXA (BARRAS) --- */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-6 flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gray-700/50 rounded-lg">
              <BarChart3 className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="text-lg font-bold text-white">Fluxo de Caixa (6 Meses)</h3>
          </div>
          
          <div className="flex-1 min-h-[300px]">
            {loading ? <ChartLoading /> : (
              graficoEvolucao.length === 0 ? (
                 <div className="h-full flex items-center justify-center text-gray-500">Sem dados suficientes ainda.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={graficoEvolucao} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                    <XAxis dataKey="name" stroke="#9ca3af" tickLine={false} axisLine={false} fontSize={12} />
                    <YAxis stroke="#9ca3af" tickLine={false} axisLine={false} fontSize={12} 
                           tickFormatter={(value) => `R$${value / 1000}k`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                      itemStyle={{ color: '#e5e7eb' }}
                      formatter={(value) => [`R$ ${Number(value).toFixed(2)}`]}
                    />
                    <Bar dataKey="Receita" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    <Bar dataKey="Despesa" fill="#ec4899" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              )
            )}
          </div>
        </div>

        {/* --- GRÁFICO 2: DISTRIBUIÇÃO DE DESPESAS (PIZZA) --- */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-6 flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gray-700/50 rounded-lg">
              <PieChartIcon className="w-5 h-5 text-pink-400" />
            </div>
            <h3 className="text-lg font-bold text-white">Despesas por Categoria (Mês)</h3>
          </div>

          <div className="flex-1 min-h-[300px]">
             {loading ? <ChartLoading /> : (
               graficoDistribuicao.length === 0 || kpis.despesas === 0 ? (
                 <div className="h-full flex items-center justify-center text-gray-500">Nenhuma despesa este mês.</div>
               ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={graficoDistribuicao}
                      cx="50%" cy="50%"
                      innerRadius={60} outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {graficoDistribuicao.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS_PIE[index % COLORS_PIE.length]} stroke="transparent" />
                      ))}
                    </Pie>
                    <Tooltip 
                       contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                       itemStyle={{ color: '#e5e7eb' }}
                       formatter={(value) => [`R$ ${Number(value).toFixed(2)}`]}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
               )
             )}
          </div>
        </div>
      </div>

      {/* Card Inferior (Insights) */}
      <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 rounded-2xl border border-purple-500/20 p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-purple-500/20 rounded-xl">
            <Activity className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Luni Insights</h3>
            <p className="text-gray-400 text-sm mt-1">
              Saldo atual: <strong className="text-white">R$ {Number(kpis.saldo || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>.
              {kpis.saldo > 0 ? " Ótimo trabalho, caixa positivo! 🚀" : " Atenção ao fluxo de caixa. 👀"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};