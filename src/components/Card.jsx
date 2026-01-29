import React from 'react';
import { theme } from '../../services/constants';

export const Card = ({ children, className = '', hover = false }) => (
  <div 
    className={`p-6 rounded-2xl transition-all duration-300 ${hover ? 'hover:-translate-y-1 hover:shadow-lg cursor-pointer' : ''} ${className}`}
    style={{
      backgroundColor: theme.colors.card,
      boxShadow: theme.shadows.sm,
      // CORREÇÃO: Usando crase (`) aqui para a cor funcionar
      border: `1px solid ${theme.colors.borderLight}`
    }}
  >
    {children}
  </div>
);