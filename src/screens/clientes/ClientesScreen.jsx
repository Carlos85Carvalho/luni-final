import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, ArrowLeft, MessageCircle, Sparkles } from 'lucide-react';

// CORREÇÃO 1: Apenas 2 níveis para voltar até 'src' e entrar em 'hooks'
import { useClientes } from '../../hooks/useClientes';

// CORREÇÃO 2: Apontando para a pasta 'componentes' (em português)
import { StatsCards } from './components/StatsCards';
import { ClientList } from './components/ClientList';
import { Rankings } from './components/Rankings'; 
import { ClientDetailsModal } from './components/ClientDetailsModal';

// --- NOVO COMPONENTE: Modal de Mensagem para Clientes Perdidos ---
const ModalMensagemReconquista = ({ isOpen, onClose, cliente }) => {
  const [mensagem, setMensagem] = useState('');

  // Preenche a mensagem com gatilho mental de saudade e escassez
  useEffect(() => {
    if (cliente) {
      const primeiroNome = cliente.nome.split(' ')[0];
      setMensagem(`Olá ${primeiroNome}, que saudade de você! ✨\n\nNotamos que faz um tempinho que você não vem cuidar da sua beleza com a gente.\n\nPara celebrar o seu retorno, liberamos um presente especial de *15% OFF* em qualquer serviço para você usar esta semana. Vamos agendar seu momento? 💜`);
    }
  }, [cliente]);

  if (!isOpen || !cliente) return null;

  const enviarWhatsApp = () => {
    if (!cliente.telefone) {
      alert("Este cliente não tem telefone cadastrado.");
      return;
    }
    const num = cliente.telefone.replace(/\D/g, '');
    window.open(`https://wa.me/55${num}?text=${encodeURIComponent(mensagem)}`, '_blank');
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#18181b] border border-white/10 w-full max-w-sm rounded-3xl p-6 shadow-2xl relative flex flex-col animate-in slide-in-from-bottom-4">
        
        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/5 rounded-full text-gray-400 hover:bg-white/10 transition-colors">
          <X size={18}/>
        </button>

        <div className="flex items-center gap-3 mb-4 mt-2">
          <div className="w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center text-purple-500 border border-purple-500/20">
            <Sparkles size={24}/>
          </div>
          <div>
            <h2 className="text-lg font-bold text-white leading-tight">Reconquistar Cliente</h2>
            <p className="text-sm text-gray-400">Para: <span className="text-white font-medium">{cliente.nome}</span></p>
          </div>
        </div>

        <div className="space-y-2 mb-6">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">Editar Mensagem (Opcional)</label>
          <textarea
            className="w-full bg-[#09090b] border border-white/10 rounded-xl p-4 text-sm text-white outline-none focus:border-purple-500 transition-all min-h-[140px] resize-none custom-scrollbar"
            value={mensagem}
            onChange={(e) => setMensagem(e.target.value)}
          />
        </div>

        <button 
          onClick={enviarWhatsApp} 
          className="w-full py-4 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-2xl font-bold flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-green-900/20"
        >
          <MessageCircle size={22} /> Enviar Promoção
        </button>
      </div>
    </div>,
    document.body
  );
};

export const ClientesScreen = ({ onClose }) => {
  const { clientes, loading } = useClientes();
  
  const [busca, setBusca] = useState('');
  const [filtroAtivo, setFiltroAtivo] = useState('todos');
  const [clienteSelecionado, setClienteSelecionado] = useState(null);
  
  // 🚀 ESTADO DO MODAL DE RECONQUISTA
  const [modalCampanha, setModalCampanha] = useState({ open: false, cliente: null });

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
      
      {/* 🚀 Renderizando o Modal de Campanha aqui */}
      <ModalMensagemReconquista 
        isOpen={modalCampanha.open} 
        onClose={() => setModalCampanha({ open: false, cliente: null })} 
        cliente={modalCampanha.cliente} 
      />

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
           {/* 🚀 Passando o onSelect para os Rankings virarem botões clicáveis */}
           <Rankings 
             clientes={clientes} 
             onSelect={setClienteSelecionado} 
           />
        </div>
      ) : (
        <div className="animate-in slide-in-from-bottom-8 duration-500">
           <ClientList 
            loading={loading} 
            clientes={clientesFiltrados} 
            onSelect={setClienteSelecionado} 
            filtroAtivo={filtroAtivo} // 🚀 Passando para a lista saber quando mostrar o botão de Winback
            onDispararCampanha={(cliente) => setModalCampanha({ open: true, cliente })} // 🚀 Função que abre o modal
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