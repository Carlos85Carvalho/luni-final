// src/screens/financeiro/metas/MetasChart.jsx
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, 
  ResponsiveContainer, CartesianGrid, Cell 
} from 'recharts';
import { TrendingUp } from 'lucide-react';

export const MetasChart = ({ metas = [], metaCalculations = {} }) => {
  const { calcularProgresso } = metaCalculations;

  const chartData = metas.map(meta => {
    // Verifica se a função existe antes de chamar
    const progresso = calcularProgresso ? calcularProgresso(meta) : 0;
    const cor = meta.cor || 'purple';
    
    // Extrair cores do gradiente para cores sólidas do gráfico
    const colorMap = {
      green: '#10B981',
      blue: '#3B82F6',
      orange: '#F59E0B',
      purple: '#8B5CF6',
      red: '#EF4444'
    };

    return {
      name: meta.titulo,
      progresso: Math.min(100, progresso),
      cor: colorMap[cor] || '#8B5CF6',
      valorAtual: meta.valor_atual,
      valorMeta: meta.valor_meta
    };
  });

  const progressoMedio = chartData.length > 0 
    ? chartData.reduce((acc, item) => acc + item.progresso, 0) / chartData.length
    : 0;

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-400" />
            Progresso Geral das Metas
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            Progresso médio: <span className="font-bold text-white">{progressoMedio.toFixed(1)}%</span>
          </p>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis 
              dataKey="name" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9ca3af', fontSize: 11 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9ca3af', fontSize: 10 }}
              tickFormatter={(value) => `${value}%`}
              domain={[0, 100]}
            />
            <Tooltip 
              formatter={(value) => [`${value.toFixed(1)}%`, 'Progresso']}
              labelFormatter={(label) => label}
              contentStyle={{ 
                backgroundColor: '#1f2937',
                borderRadius: '12px', 
                border: '1px solid rgba(255,255,255,0.1)',
                padding: '12px'
              }}
              labelStyle={{ color: '#fff' }}
              cursor={{ fill: 'rgba(255,255,255,0.05)' }}
            />
            <Bar 
              dataKey="progresso" 
              name="Progresso" 
              radius={[4, 4, 0, 0]}
              barSize={40}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.cor} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};