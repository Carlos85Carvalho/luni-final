// src/screens/financeiro/visao-geral/KPIcards.jsx
import { TrendingUp, TrendingDown, DollarSign, Wallet } from 'lucide-react';

export const KPIcards = ({ kpis, loading }) => {
  const cards = [
    {
      titulo: 'Receita Mensal',
      valor: kpis.receita,
      icone: TrendingUp,
      cor: 'green',
      bg: 'from-green-500/10 to-emerald-500/10',
      border: 'border-green-500/20',
      iconBg: 'bg-green-500/20 text-green-400'
    },
    {
      titulo: 'Despesas Mensais',
      valor: kpis.despesas,
      icone: TrendingDown,
      cor: 'red',
      bg: 'from-red-500/10 to-rose-500/10',
      border: 'border-red-500/20',
      iconBg: 'bg-red-500/20 text-red-400'
    },
    {
      titulo: 'Lucro Líquido',
      valor: kpis.lucro,
      icone: DollarSign,
      cor: kpis.lucro >= 0 ? 'blue' : 'orange',
      bg: 'from-blue-500/10 to-cyan-500/10',
      border: 'border-blue-500/20',
      iconBg: 'bg-blue-500/20 text-blue-400'
    },
    {
      titulo: 'Saldo em Caixa',
      valor: kpis.saldo, // Em um app real, isso buscaria o saldo acumulado de contas
      icone: Wallet,
      cor: 'purple',
      bg: 'from-purple-500/10 to-violet-500/10',
      border: 'border-purple-500/20',
      iconBg: 'bg-purple-500/20 text-purple-400'
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-gray-800/50 rounded-2xl animate-pulse border border-gray-700"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card, index) => {
        const Icon = card.icone;
        return (
          <div 
            key={index} 
            className={`relative overflow-hidden rounded-2xl border ${card.border} bg-gradient-to-br ${card.bg} p-6 transition-all hover:scale-[1.02]`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${card.iconBg}`}>
                <Icon className="w-6 h-6" />
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-full bg-gray-900/30 text-gray-400`}>
                Este Mês
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-400 font-medium mb-1">{card.titulo}</p>
              <h3 className="text-2xl font-bold text-white">
                R$ {card.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h3>
            </div>
          </div>
        );
      })}
    </div>
  );
};