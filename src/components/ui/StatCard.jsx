import React from 'react';

export const StatCard = ({ title, value, subtext, icon: Icon, colorTheme, onClick }) => {
  const themes = {
    emerald: { bg: 'from-emerald-900/30 to-teal-900/30', border: 'border-emerald-700/30', text: 'text-emerald-400', glow: 'bg-emerald-500/20' },
    blue:    { bg: 'from-blue-900/30 to-cyan-900/30',    border: 'border-blue-700/30',    text: 'text-blue-400',    glow: 'bg-blue-500/20' },
    purple:  { bg: 'from-purple-900/30 to-fuchsia-900/30', border: 'border-purple-700/30',  text: 'text-purple-400',  glow: 'bg-purple-500/20' },
    amber:   { bg: 'from-amber-900/30 to-orange-900/30',  border: 'border-amber-700/30',   text: 'text-amber-400',   glow: 'bg-amber-500/20' },
  };
  
  const t = themes[colorTheme] || themes.blue;

  return (
    <div 
      onClick={onClick}
      className={`bg-gradient-to-br ${t.bg} border ${t.border} rounded-2xl p-5 relative overflow-hidden group hover:scale-105 transition-all ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className={`absolute right-0 top-0 w-24 h-24 ${t.glow} rounded-full blur-2xl -mr-10 -mt-10 opacity-60`}></div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <span className={`${t.text} text-xs font-bold uppercase tracking-wide`}>{title}</span>
          <Icon size={20} className={t.text} />
        </div>
        <div className="text-2xl md:text-3xl font-bold text-white mb-1 truncate">{value}</div>
        <div className="text-sm text-gray-400">{subtext}</div>
      </div>
    </div>
  );
};