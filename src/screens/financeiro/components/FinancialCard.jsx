// src/screens/financeiro/components/FinancialCard.jsx
import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export const FinancialCard = ({ 
  titulo, 
  valor, 
  icone, // Mudamos de "icone: Icon" para apenas "icone"
  cor = 'purple', 
  trend,
  subTitulo, 
  loading,
  format = 'currency',
  onClick 
}) => {
  const themes = {
    purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
    green: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
    red: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
    orange: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
  };

  const theme = themes[cor] || themes.purple;

  // Atribuímos aqui para garantir que é tratado como componente
  const IconComponent = icone;

  const formatValue = (val) => {
    if (loading) return '...';
    if (format === 'currency') return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    if (format === 'percent') return `${val}%`;
    return val;
  };

  return (
    <div 
      onClick={onClick}
      className={`relative p-6 rounded-2xl border ${theme.border} bg-gray-800/40 backdrop-blur-sm transition-all hover:bg-gray-800/60 ${onClick ? 'cursor-pointer hover:scale-[1.02]' : ''}`}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-sm font-medium text-gray-400">{titulo}</p>
          <h3 className="text-2xl font-bold text-white mt-1">{formatValue(valor)}</h3>
        </div>
        <div className={`p-3 rounded-xl ${theme.bg}`}>
          {/* Usamos a nova variável IconComponent */}
          {IconComponent && <IconComponent className={`w-6 h-6 ${theme.text}`} />}
        </div>
      </div>
      
      {(trend || subTitulo) && (
        <div className="flex items-center gap-2 text-xs">
          {trend && (
            <span className={`flex items-center px-2 py-1 rounded-full ${trend > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
              {trend > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              {Math.abs(trend)}%
            </span>
          )}
          {subTitulo && <span className="text-gray-500">{subTitulo}</span>}
        </div>
      )}
    </div>
  );
};