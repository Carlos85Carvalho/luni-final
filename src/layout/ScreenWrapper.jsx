import React from 'react';

export const ScreenWrapper = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white pb-24 md:pb-8">
      {/* max-w-5xl: Limita a largura máxima (não estica até o infinito em monitores grandes)
         mx-auto: Centraliza na tela
         px-4: Dá um respiro nas laterais no celular
         pt-6: Espaço no topo
      */}
      <div className="w-full max-w-5xl mx-auto px-4 pt-6 md:px-8">
        {children}
      </div>
    </div>
  );
};