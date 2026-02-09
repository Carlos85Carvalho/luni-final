import React from 'react';
import { ArrowRight } from 'lucide-react';

// Correção na linha abaixo: { icon: Icon }
// Isso pega a prop 'icon' e a transforma na variável 'Icon' para ser usada como componente
export const QuickAction = ({ label, sub, icon: Icon, colorTheme, onClick }) => {
  const themes = {
    blue:    { border: 'hover:border-blue-500/50',    iconBg: 'bg-blue-500/20',    text: 'text-blue-400',    groupText: 'group-hover:text-blue-400' },
    emerald: { border: 'hover:border-emerald-500/50', iconBg: 'bg-emerald-500/20', text: 'text-emerald-400', groupText: 'group-hover:text-emerald-400' },
    purple:  { border: 'hover:border-purple-500/50',  iconBg: 'bg-purple-500/20',  text: 'text-purple-400',  groupText: 'group-hover:text-purple-400' },
  };
  
  // Fallback de segurança caso colorTheme não seja passado
  const t = themes[colorTheme] || themes.blue;

  return (
    <button 
      onClick={onClick}
      className={`bg-gradient-to-br from-[#1c1c24] to-[#15151a] border border-white/5 ${t.border} rounded-2xl p-6 flex items-center justify-between cursor-pointer group transition-all w-full`}
    >
      <div className="flex items-center gap-4">
        <div className={`${t.iconBg} p-3 rounded-xl ${t.text}`}>
          {/* AQUI ESTÁ O SEGREDO: Use 'Icon' com I maiúsculo. 
              Se você usar 'icon' minúsculo aqui, o React acha que é uma tag HTML e o ESLint reclama. */}
          {Icon && <Icon size={24} />}
        </div>
        <div className="text-left">
          <h4 className={`font-bold text-white mb-1 ${t.groupText} transition-colors`}>{label}</h4>
          <p className="text-sm text-gray-400">{sub}</p>
        </div>
      </div>
      <ArrowRight className={`text-gray-600 ${t.groupText} transition-colors`} size={20} />
    </button>
  );
};