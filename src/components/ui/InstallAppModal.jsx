import React, { useState, useEffect } from 'react';
import { X, Share, PlusSquare, Smartphone, Download } from 'lucide-react';

export const InstallAppModal = () => {
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // 1. Verifica se já está rodando como APP (Standalone)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    
    // 2. Verifica se é iOS (iPhone/iPad)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIphone = /iphone|ipad|ipod/.test(userAgent);

    // 3. Verifica se o usuário já fechou este modal antes (para não ser chato)
    const hasClosedModal = localStorage.getItem('luni_install_modal_closed');

    // Só mostra se NÃO estiver instalado e NÃO tiver fechado o modal recentemente
    if (!isStandalone && !hasClosedModal) {
      setIsIOS(isIphone);
      // Pequeno delay para não aparecer "na cara" assim que entra
      const timer = setTimeout(() => setShow(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setShow(false);
    // Salva no navegador para não mostrar novamente (ou use sessionStorage para mostrar a cada nova sessão)
    localStorage.setItem('luni_install_modal_closed', 'true');
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-[#18181b] border border-white/10 w-full max-w-md rounded-3xl p-6 shadow-2xl relative animate-in slide-in-from-bottom-10 duration-500">
        
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-[#5B2EFF] to-[#7C3EFF] rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-purple-500/20">
            <Smartphone size={32} className="text-white" />
          </div>
          
          <h3 className="text-xl font-bold text-white mb-2">Instale o App Luni</h3>
          <p className="text-gray-400 text-sm mb-6 leading-relaxed">
            Tenha acesso rápido e receba notificações dos seus agendamentos diretamente no seu celular.
          </p>

          {isIOS ? (
            // INSTRUÇÕES PARA IPHONE (iOS)
            <div className="bg-white/5 rounded-2xl p-4 w-full text-left space-y-4 border border-white/5">
              <div className="flex items-center gap-3 text-sm text-gray-300">
                <div className="bg-[#2c2c30] p-2 rounded-lg">
                  <Share size={20} className="text-blue-400" />
                </div>
                <span>1. Toque no botão <strong>Compartilhar</strong> na barra inferior.</span>
              </div>
              <div className="w-full h-px bg-white/10"></div>
              <div className="flex items-center gap-3 text-sm text-gray-300">
                <div className="bg-[#2c2c30] p-2 rounded-lg">
                  <PlusSquare size={20} className="text-gray-200" />
                </div>
                <span>2. Selecione <strong>Adicionar à Tela de Início</strong>.</span>
              </div>
            </div>
          ) : (
            // INSTRUÇÕES PARA ANDROID / CHROME
            <div className="bg-white/5 rounded-2xl p-4 w-full text-left space-y-4 border border-white/5">
              <div className="flex items-center gap-3 text-sm text-gray-300">
                <div className="bg-[#2c2c30] p-2 rounded-lg">
                  <Download size={20} className="text-green-400" />
                </div>
                <span>
                  Toque no menu do navegador (três pontinhos) e selecione <strong>Instalar aplicativo</strong> ou <strong>Adicionar à tela inicial</strong>.
                </span>
              </div>
            </div>
          )}

          <button 
            onClick={handleClose}
            className="w-full mt-6 py-3.5 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors active:scale-95"
          >
            Entendi, vou instalar!
          </button>
        </div>
      </div>
    </div>
  );
};