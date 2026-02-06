// src/screens/financeiro/visao-geral/VisaoGeral.jsx
import { useVisaoGeral } from './VisaoGeralHooks';
import { KPIcards } from './KPIcards';
import { BarChart3, PieChart, Activity } from 'lucide-react';

// Removido 'onAbrirModal' dos argumentos pois não estava sendo usado
export const VisaoGeral = () => {
  const { kpis, loading } = useVisaoGeral();

  return (
    <div className="space-y-6">
      <KPIcards kpis={kpis} loading={loading} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-6 min-h-[300px] flex flex-col items-center justify-center text-center">
          <div className="p-4 bg-gray-700/50 rounded-full mb-4">
            <BarChart3 className="w-8 h-8 text-gray-500" />
          </div>
          <h3 className="text-lg font-bold text-white">Fluxo de Caixa</h3>
          <p className="text-gray-400 text-sm max-w-xs mt-2">
            Gráfico de evolução em breve.
          </p>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-6 min-h-[300px] flex flex-col items-center justify-center text-center">
          <div className="p-4 bg-gray-700/50 rounded-full mb-4">
            <PieChart className="w-8 h-8 text-gray-500" />
          </div>
          <h3 className="text-lg font-bold text-white">Distribuição</h3>
          <p className="text-gray-400 text-sm max-w-xs mt-2">
            Análise detalhada em breve.
          </p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 rounded-2xl border border-purple-500/20 p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-purple-500/20 rounded-xl">
            <Activity className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Luni Insights</h3>
            <p className="text-gray-400 text-sm mt-1">
              Saldo atual: <strong className="text-white">R$ {kpis.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};