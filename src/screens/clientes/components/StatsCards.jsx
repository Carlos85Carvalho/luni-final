import React from 'react';
import { User, Award, TrendingUp, UserX } from 'lucide-react';

export const StatsCards = ({ stats, filtroAtivo, setFiltroAtivo }) => {
  const cards = [
    { id: 'todos', label: 'TOTAL', icon: User, val: stats.total, color: 'violet' },
    { id: 'vip', label: 'VIPS', icon: Award, val: stats.vips, color: 'amber' },
    { id: 'novos', label: 'NOVOS', icon: TrendingUp, val: stats.novos, color: 'blue' },
    { id: 'perdidos', label: 'PERDIDOS', icon: UserX, val: stats.perdidos, color: 'red' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 px-4">
      {cards.map((c) => (
        <div 
          key={c.id}
          onClick={() => setFiltroAtivo(c.id)} 
          className={`bg-white/5 rounded-xl p-4 border cursor-pointer transition-all ${
            filtroAtivo === c.id 
              ? `border-${c.color}-500 bg-${c.color}-500/10` 
              : 'border-white/10 hover:bg-white/10'
          }`}
        >
          <div className={`flex items-center gap-2 mb-1 text-${c.color}-400 font-bold text-xs`}>
            <c.icon size={14}/> {c.label}
          </div>
          <div className="text-2xl font-bold text-white">{c.val}</div>
        </div>
      ))}
    </div>
  );
};