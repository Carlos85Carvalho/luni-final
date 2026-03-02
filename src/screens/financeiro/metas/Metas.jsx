// src/screens/financeiro/metas/Metas.jsx
import React, { useState } from 'react';
import { useMetas, useMetaCalculations } from './MetasHooks';
import { MetasHeader } from './MetasHeader';
import { MetasGrid } from './MetasGrid';
import { MetasChart } from './MetasChart';
import { Filter } from 'lucide-react';

export const Metas = ({ onAbrirModal }) => {
  // 🚀 INICIA PADRÃO NO MÊS ATUAL
  const [filtroAtivo, setFiltroAtivo] = useState('mes');
  const [periodo, setPeriodo] = useState({
    inicio: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    fim: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]
  });

  // 🚀 LÓGICA EXCLUSIVA PARA METAS (Apenas Mês e Ano)
  const aplicarAtalho = (tipo) => {
    const hoje = new Date();
    let inicio, fim;

    if (tipo === 'mes') {
      inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0];
      fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().split('T')[0];
    } else if (tipo === 'ano') {
      inicio = new Date(hoje.getFullYear(), 0, 1).toISOString().split('T')[0];
      fim = new Date(hoje.getFullYear(), 11, 31).toISOString().split('T')[0];
    }

    setFiltroAtivo(tipo);
    setPeriodo({ inicio, fim });
  };

  const { metas, loading: metasLoading, refresh } = useMetas(periodo);
  const metaCalculations = useMetaCalculations();

  return (
    <div className="min-h-screen relative overflow-hidden pb-20 p-2 md:p-4 space-y-6">
      
      {/* LUZES DE FUNDO (LUNI DEEP) */}
      <div className="absolute top-[-10%] left-[-5%] w-[60%] h-[50%] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[0%] right-[-5%] w-[50%] h-[40%] bg-pink-600/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto space-y-6">
        
        <MetasHeader 
          onNovaMeta={() => onAbrirModal('nova-meta')}
          onRefresh={refresh}
          loading={metasLoading}
        />

        {/* 🚀 BARRA DE FILTROS ENXUTA PARA METAS */}
        <div className="bg-[#1c1c22] border border-gray-800 p-4 md:p-6 rounded-3xl space-y-4 shadow-lg">
          <div className="flex items-center gap-2 px-2">
            <Filter className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-bold text-white uppercase tracking-wider">Ciclo da Meta</span>
          </div>
          
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {['mes', 'ano'].map((t) => (
              <button key={t} onClick={() => aplicarAtalho(t)} 
                className={`flex-1 min-w-[120px] py-2.5 rounded-2xl text-xs font-bold transition-all border 
                ${filtroAtivo === t ? 'bg-purple-600 border-purple-500 text-white' : 'bg-transparent border-gray-700 text-gray-400 hover:border-gray-500'}`}>
                {t === 'mes' ? 'Este Mês' : 'Este Ano'}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-800">
            <div className="flex flex-col">
               <span className="text-[10px] text-gray-500 mb-1 ml-1">Início do Ciclo</span>
               <input type="date" value={periodo.inicio} onChange={e => { setPeriodo({...periodo, inicio: e.target.value}); setFiltroAtivo('custom'); }} className="bg-gray-900 border border-gray-700 text-white text-[11px] rounded-xl px-4 py-2.5 outline-none [color-scheme:dark] w-full" />
            </div>
            <div className="flex flex-col">
               <span className="text-[10px] text-gray-500 mb-1 ml-1">Fim do Ciclo</span>
               <input type="date" value={periodo.fim} onChange={e => { setPeriodo({...periodo, fim: e.target.value}); setFiltroAtivo('custom'); }} className="bg-gray-900 border border-gray-700 text-white text-[11px] rounded-xl px-4 py-2.5 outline-none [color-scheme:dark] w-full" />
            </div>
          </div>
        </div>

        {/* COMPONENTES DE METAS */}
        <MetasGrid
          metas={metas}
          loading={metasLoading}
          metaCalculations={metaCalculations}
          onAbrirModal={onAbrirModal}
        />

        {(metas || []).length > 0 && (
          <div className="bg-[#1c1c22]/50 backdrop-blur-md rounded-3xl border border-gray-800 p-4 md:p-6 shadow-lg">
            <MetasChart 
              metas={metas}
              metaCalculations={metaCalculations}
            />
          </div>
        )}
      </div>
    </div>
  );
};