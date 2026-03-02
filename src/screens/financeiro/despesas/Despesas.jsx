// src/screens/financeiro/despesas/Despesas.jsx
import React, { useState, useMemo } from 'react';
import { supabase } from '../../../services/supabase'; 
import { useDespesas } from './DespesasHooks'; 
import { DespesasFilters } from './DespesasFilters';
import { DespesasTable } from './DespesasTable';
import { DespesasSummary } from './DespesasSummary';
import { Filter } from 'lucide-react';

export const Despesas = ({ onAbrirModal }) => {
  const { despesas, loading: despesasLoading, refresh, periodo, setPeriodo, filtroAtivo, setFiltroAtivo, aplicarAtalho } = useDespesas();
  
  const [filtro, setFiltro] = useState('todas');
  const [categoriaFiltro, setCategoriaFiltro] = useState('todas');
  const [busca, setBusca] = useState('');

  const handleAbrirModalSeguro = (tipo, dados = null) => {
    if (typeof onAbrirModal === 'function') onAbrirModal(tipo, dados);
  };

  const categorias = ['Aluguel', 'Energia', 'Água', 'Produtos', 'Salários', 'Marketing', 'Manutenção', 'Outros'];

  // Segundo filtro (Para a barra de pesquisa e status da tela)
  const despesasExibidas = useMemo(() => {
    return (despesas || []).filter(d => {
      const isPaga = d.status === 'pago' || d.pago === true;
      const matchFiltro = filtro === 'todas' || (filtro === 'pagas' && isPaga) || (filtro === 'pendentes' && !isPaga);
      const matchCategoria = categoriaFiltro === 'todas' || d.categoria === categoriaFiltro;
      const matchBusca = busca === '' || d.descricao?.toLowerCase().includes(busca.toLowerCase());
      return matchFiltro && matchCategoria && matchBusca;
    });
  }, [despesas, filtro, categoriaFiltro, busca]);

  return (
    <div className="min-h-screen relative overflow-hidden pb-20 p-2 md:p-4 space-y-6">
      
      {/* LUZES DE FUNDO (LUNI DEEP) */}
      <div className="absolute top-[-10%] left-[-5%] w-[60%] h-[50%] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[0%] right-[-5%] w-[50%] h-[40%] bg-blue-600/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto space-y-6">
        
        {/* BARRA DE PERÍODO (Estilo Performance/Dashboard) */}
        <div className="bg-[#1c1c22] border border-gray-800 p-4 md:p-6 rounded-3xl space-y-4 shadow-lg">
          <div className="flex items-center gap-2 px-2">
            <Filter className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-bold text-white uppercase tracking-wider">Período de Apuração</span>
          </div>
          
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {['hoje', 'semana', 'mes', 'ano'].map((t) => (
              <button key={t} onClick={() => aplicarAtalho(t)} 
                className={`flex-1 min-w-[90px] py-2.5 rounded-2xl text-xs font-bold transition-all border 
                ${filtroAtivo === t ? 'bg-purple-600 border-purple-500 text-white' : 'bg-transparent border-gray-700 text-gray-400 hover:border-gray-500'}`}>
                {t === 'mes' ? 'Mês' : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-800">
            <div className="flex flex-col">
               <span className="text-[10px] text-gray-500 mb-1 ml-1">Data Inicial</span>
               <input type="date" value={periodo.inicio} onChange={e => { setPeriodo({...periodo, inicio: e.target.value}); setFiltroAtivo('custom'); }} className="bg-gray-900 border border-gray-700 text-white text-[11px] rounded-xl px-4 py-2.5 outline-none [color-scheme:dark] w-full" />
            </div>
            <div className="flex flex-col">
               <span className="text-[10px] text-gray-500 mb-1 ml-1">Data Final</span>
               <input type="date" value={periodo.fim} onChange={e => { setPeriodo({...periodo, fim: e.target.value}); setFiltroAtivo('custom'); }} className="bg-gray-900 border border-gray-700 text-white text-[11px] rounded-xl px-4 py-2.5 outline-none [color-scheme:dark] w-full" />
            </div>
          </div>
        </div>

        <DespesasSummary despesas={despesasExibidas} />

        <div className="bg-[#1c1c22]/50 backdrop-blur-md rounded-3xl border border-white/5 p-4 md:p-6 shadow-lg">
          <DespesasFilters
            filtro={filtro} setFiltro={setFiltro}
            categoriaFiltro={categoriaFiltro} setCategoriaFiltro={setCategoriaFiltro}
            busca={busca} setBusca={setBusca}
            categorias={categorias}
            onNovaDespesa={() => handleAbrirModalSeguro('nova-despesa')}
          />

          <div className="mt-6">
            <DespesasTable
              despesas={despesasExibidas}
              loading={despesasLoading}
              onMarcarComoPaga={async (d) => {
                await supabase.from('despesas').update({ status: 'pago', pago: true }).eq('id', d.id);
                refresh();
              }}
              onEditar={(despesa) => handleAbrirModalSeguro('editar-despesa', despesa)}
              onExcluir={async (id) => {
                if (window.confirm('Excluir esta despesa?')) {
                  await supabase.from('despesas').delete().eq('id', id);
                  refresh();
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};