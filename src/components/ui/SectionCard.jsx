import React from 'react';
import { ChevronRight } from 'lucide-react';

export const SectionCard = ({ title, icon: Icon, iconColor, actionLabel, onAction, children }) => (
  <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-2xl p-6 h-full">
    <div className="flex items-center justify-between mb-5">
      <h3 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
        <Icon className={iconColor} size={24} />
        {title}
      </h3>
      {actionLabel && (
        <button onClick={onAction} className={`text-sm ${iconColor} hover:brightness-125 font-semibold flex items-center gap-1`}>
          {actionLabel} <ChevronRight size={16} />
        </button>
      )}
    </div>
    <div className="space-y-3">
      {children}
    </div>
  </div>
);