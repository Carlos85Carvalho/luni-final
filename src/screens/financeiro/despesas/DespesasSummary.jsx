// src/screens/financeiro/despesas/DespesasSummary.jsx
import { Receipt, CheckCircle, Clock } from 'lucide-react';

export const DespesasSummary = ({ despesas = [] }) => {
  const totalDespesas = despesas.reduce((acc, d) => acc + (d.valor || 0), 0);
  const totalPagas = despesas.filter(d => d.pago).reduce((acc, d) => acc + (d.valor || 0), 0);
  const totalPendentes = despesas.filter(d => !d.pago).reduce((acc, d) => acc + (d.valor || 0), 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="bg-gray-800/50 backdrop-blur-sm p-4 rounded-xl border border-gray-700">
        <div className="flex items-center justify-between">
          <div className="truncate pr-2">
            <p className="text-sm text-gray-400">Total</p>
            <p className="text-xl sm:text-2xl font-bold text-white mt-1 truncate">
              R$ {totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="p-2 bg-purple-500/10 rounded-lg">
            <Receipt className="w-8 h-8 text-purple-400 shrink-0" />
          </div>
        </div>
      </div>

      <div className="bg-gray-800/50 backdrop-blur-sm p-4 rounded-xl border border-gray-700">
        <div className="flex items-center justify-between">
          <div className="truncate pr-2">
            <p className="text-sm text-gray-400">Pagas</p>
            <p className="text-xl sm:text-2xl font-bold text-green-400 mt-1 truncate">
              R$ {totalPagas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="p-2 bg-green-500/10 rounded-lg">
            <CheckCircle className="w-8 h-8 text-green-400 shrink-0" />
          </div>
        </div>
      </div>

      <div className="bg-gray-800/50 backdrop-blur-sm p-4 rounded-xl border border-gray-700">
        <div className="flex items-center justify-between">
          <div className="truncate pr-2">
            <p className="text-sm text-gray-400">Pendentes</p>
            <p className="text-xl sm:text-2xl font-bold text-orange-400 mt-1 truncate">
              R$ {totalPendentes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="p-2 bg-orange-500/10 rounded-lg">
            <Clock className="w-8 h-8 text-orange-400 shrink-0" />
          </div>
        </div>
      </div>
    </div>
  );
};