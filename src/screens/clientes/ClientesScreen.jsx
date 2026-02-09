import React, { useState, useMemo } from 'react';
import { Search, X, ArrowLeft } from 'lucide-react';

// CORREÇÃO 1: Apenas 2 níveis para voltar até 'src' e entrar em 'hooks'
import { useClientes } from '../../hooks/useClientes';

// CORREÇÃO 2: Apontando para a pasta 'componentes' (em português)
import { StatsCards } from './components/StatsCards';
import { ClientList } from './components/ClientList';
import { Rankings } from './components/Rankings'; 
import { ClientDetailsModal } from './components/ClientDetailsModal';

export const ClientesScreen = ({ onClose }) => {
  const { clientes, loading } = useClientes();
  
  const [busca, setBusca] = useState('');
  const [filtroAtivo, setFiltroAtivo] = useState('todos');
  const [clienteSelecionado, setClienteSelecionado] = useState(null);
  
  // Estado para controlar visualização (Dashboard ou Lista)
  const [modoVisualizacao, setModoVisualizacao] = useState('dashboard');

  const handleFiltroClick = (novoFiltro) => {
    setFiltroAtivo(novoFiltro);
    setModoVisualizacao('lista');
  };

  const voltarParaDashboard = () => {
    setModoVisualizacao('dashboard');
    setBusca('');
    setFiltroAtivo('todos');
  };

  const clientesFiltrados = useMemo(() => {
    if (!clientes) return [];
    
    return clientes.filter(c => {
       const matchTexto = c.nome.toLowerCase().includes(busca.toLowerCase()) || 
                          (c.telefone && c.telefone.includes(busca));
       
       if (!matchTexto) return false;

       if (filtroAtivo === 'todos') return true;
       if (filtroAtivo === 'vip') return c.status === 'vip';
       if (filtroAtivo === 'novos') return c.total_atendimentos <= 3;
       if (filtroAtivo === 'perdidos') return c.dias_sem_visita > 45;

       return true;
    });
  }, [clientes, busca, filtroAtivo]);

  const stats = useMemo(() => ({
    total: clientes.length,
    vips: clientes.filter(c => c.status === 'vip').length,
    novos: clientes.filter(c => c.total_atendimentos <= 3).length,
    perdidos: clientes.filter(c => c.dias_sem_visita > 45).length
  }), [clientes]);

  const deveMostrarLista = modoVisualizacao === 'lista' || busca.length > 0;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32">
      
      {/* HEADER */}
      <div className="mb-6 px-4 pt-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              {deveMostrarLista ? 'Lista de Clientes' : 'Dashboard'}
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              {deveMostrarLista ? 'Gerencie seus contatos' : 'Visão geral do seu negócio'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all">
            <X size={24} />
          </button>
        </div>

        <StatsCards 
          stats={stats} 
          filtroAtivo={filtroAtivo} 
          setFiltroAtivo={handleFiltroClick} 
        />
      </div>

      {/* BARRA DE BUSCA */}
      <div className="px-4 mb-6 sticky top-0 z-10 bg-[#0a0a0f] pb-2 pt-2 space-y-2">
        <div className="bg-white/10 border border-white/10 rounded-2xl p-3 flex items-center gap-3 focus-within:border-purple-500 transition-colors shadow-lg">
          <Search className="text-gray-400" size={20} />
          <input 
            placeholder="Buscar cliente..." 
            className="bg-transparent outline-none text-white w-full placeholder-gray-500"
            value={busca}
            onChange={e => {
              setBusca(e.target.value);
              if(e.target.value.length > 0) setModoVisualizacao('lista');
            }}
          />
          {(busca || modoVisualizacao === 'lista') && (
            <X 
              size={18} 
              className="text-gray-400 cursor-pointer hover:text-white"
              onClick={voltarParaDashboard}
            />
          )}
        </div>
        
        {modoVisualizacao === 'lista' && (
          <div className="flex items-center justify-between animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Exibindo:</span>
              <span className="text-xs font-bold px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full uppercase flex items-center gap-1">
                {filtroAtivo}
              </span>
            </div>
            <button 
              onClick={voltarParaDashboard}
              className="text-xs flex items-center gap-1 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={12}/> Voltar para Dashboard
            </button>
          </div>
        )}
      </div>

      {/* CONTEÚDO */}
      {!deveMostrarLista ? (
        <div className="animate-in fade-in duration-500">
           <Rankings clientes={clientes} />
        </div>
      ) : (
        <div className="animate-in slide-in-from-bottom-8 duration-500">
           <ClientList 
            loading={loading} 
            clientes={clientesFiltrados} 
            onSelect={setClienteSelecionado} 
          />
        </div>
      )}

      {/* MODAL */}
      {clienteSelecionado && (
        <ClientDetailsModal 
          cliente={clienteSelecionado} 
          onClose={() => setClienteSelecionado(null)} 
        />
      )}
    </div>
  );
};