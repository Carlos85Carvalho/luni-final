import React from 'react';
import { theme } from '../../services/constants';

export const LoadingState = ({ message = 'Carregando...', fullScreen = false }) => {
  const content = (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="w-12 h-12 rounded-full border-4 border-t-[#5B2EFF] border-gray-200 animate-spin"></div>
      <p style={{ color: theme.colors.textSecondary }}>{message}</p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#F8F9FC]">
        {content}
      </div>
    );
  }
  
  return <div className="py-10">{content}</div>;
};
