import React from 'react';
import { ArrowLeft, Wifi, WifiOff, Scissors, AlertTriangle } from 'lucide-react';

export const PDVHeader = ({ 
  onVoltar, 
  onlineStatus, 
  salaoId, 
  onOpenServicos, 
  agendamentosCount,
  carrinhoNaoSalvo,
  onSalvarPendente
}) => {
  return (
    <div className="bg-white border-b border-gray-200 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onVoltar} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${onlineStatus ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <h1 className="text-xl font-bold text-gray-800">PDV</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className={`px-3 py-1.5 rounded-full text-sm flex items-center gap-2 ${onlineStatus ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {onlineStatus ? <><Wifi className="w-3 h-3" /> Online</> : <><WifiOff className="w-3 h-3" /> Offline</>}
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-sm text-gray-600">ID: {salaoId}</p>
            <p className="text-xs text-gray-500">{new Date().toLocaleDateString('pt-BR')}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={onOpenServicos}
          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg flex items-center gap-2 text-sm shadow-sm"
        >
          <Scissors className="w-4 h-4" />
          Serviços & Agendamentos
          {agendamentosCount > 0 && (
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">
              {agendamentosCount}
            </span>
          )}
        </button>
        
        {carrinhoNaoSalvo && (
          <div className="flex-1 p-2 px-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span className="text-amber-700 text-sm font-medium">Carrinho não salvo</span>
            </div>
            <button
              onClick={onSalvarPendente}
              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-bold"
            >
              Salvar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};