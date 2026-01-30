import React, { useEffect, useState } from 'react';

export const SplashScreen = ({ onFinish }) => {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // Fica na tela por 3.5 segundos
    const timer = setTimeout(() => {
      setFading(true);
      // Espera a animação de "sumir" terminar para liberar o app
      setTimeout(() => {
        onFinish();
      }, 500);
    }, 3500);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-opacity duration-500 ease-in-out ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      // COR DE FUNDO EXATA DA IDENTIDADE (#0E0822)
      style={{ backgroundColor: '#0E0822' }}
    >
      {/* Efeito de Luz de Fundo (Glow) usando o Roxo Médio (#321C69) */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#321C69] rounded-full blur-[120px] opacity-30 animate-pulse"></div>
      </div>

      {/* Container da Logo */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Usando a logo que já está na sua pasta public */}
        <img 
          src="/logo-luni.png" 
          alt="LUNI" 
          className="w-48 md:w-64 object-contain mb-8 animate-pulse"
        />

        {/* Barra de Carregamento Estilizada com degrade Lilás */}
        <div className="w-48 h-1 bg-[#321C69] rounded-full overflow-hidden mt-4">
          <div className="h-full bg-gradient-to-r from-[#805EBC] via-[#A785D7] to-[#805EBC] w-1/2 rounded-full animate-ping"></div>
        </div>
        
        <p className="mt-6 text-[#A785D7] text-xs font-medium tracking-[0.3em] uppercase opacity-80">
          Carregando experiência...
        </p>
      </div>
      
      {/* Rodapé sutil */}
      <div className="absolute bottom-8 text-[#57379C] text-[10px] tracking-widest">
        LUNI SYSTEM
      </div>
    </div>
  );
};