import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, 
  ResponsiveContainer, CartesianGrid, Cell, Legend
} from 'recharts';
import { TrendingUp } from 'lucide-react';

export const MetasChart = ({ metas = [], metaCalculations = {} }) => {
  const { calcularProgresso } = metaCalculations;
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Monitora redimensionamento da tela para ajustar gráfico
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const chartData = metas.map(meta => {
    // Verifica se a função existe, senão calcula simples (progresso já vindo do banco ou cálculo manual)
    const progresso = calcularProgresso 
      ? calcularProgresso(meta) 
      : (meta.valor_atual / meta.valor) * 100 || 0;

    const cor = meta.cor || 'purple';
    
    const colorMap = {
      green: '#10B981',
      blue: '#3B82F6',
      orange: '#F59E0B',
      purple: '#8B5CF6',
      red: '#EF4444'
    };

    return {
      name: meta.titulo,
      progresso: Math.min(100, Math.max(0, progresso)), // Trava entre 0 e 100
      cor: colorMap[cor] || '#8B5CF6',
      valorAtual: meta.valor_atual,
      valorMeta: meta.valor
    };
  });

  const progressoMedio = chartData.length > 0 
    ? chartData.reduce((acc, item) => acc + item.progresso, 0) / chartData.length
    : 0;

  return (
    <div className="bg-[#18181b] rounded-3xl border border-white/5 p-6 shadow-xl animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-500" />
            Progresso Geral das Metas
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            Progresso médio: <span className="font-bold text-emerald-400">{progressoMedio.toFixed(1)}%</span>
          </p>
        </div>
      </div>

      <div className="h-64 w-full">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={chartData} 
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              barSize={isMobile ? 30 : 50} // Barras mais finas no mobile
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
              
              <XAxis 
                dataKey="name" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#9ca3af', fontSize: 11 }}
                interval={0} // Tenta mostrar todos
                hide={isMobile} // Esconde nomes no mobile se não couber
              />
              
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 'bold' }}
                tickFormatter={(value) => `${value}%`}
                domain={[0, 100]}
              />
              
              <Tooltip 
                cursor={{ fill: 'transparent' }}
                contentStyle={{ 
                  backgroundColor: '#18181b', 
                  borderRadius: '12px', 
                  border: '1px solid #333', 
                  padding: '12px'
                }}
                itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                labelStyle={{ color: '#9ca3af', marginBottom: '5px' }}
                formatter={(value) => [`${value.toFixed(1)}%`, 'Progresso']}
              />

              <Bar 
                dataKey="progresso" 
                radius={[6, 6, 0, 0]}
                // AQUI ESTÁ A COR DO FUNDO DA BARRA (CINZA ESCURO)
                background={{ fill: '#27272a', radius: [6, 6, 0, 0] }}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.cor} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
           <div className="h-full flex flex-col items-center justify-center text-gray-500 text-sm">
             <p>Nenhuma meta cadastrada</p>
           </div>
        )}
      </div>
    </div>
  );
};