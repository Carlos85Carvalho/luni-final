import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { 
  User, Search, X, Star, Phone, TrendingUp, UserX, Award, 
  ChevronRight, Trophy, Crown, Loader2, MessageCircle, Clock, Filter
} from 'lucide-react';

export const ClientesScreen = ({ onClose }) => {
  const [loading, setLoading] = useState(true);
  const [clientes, setClientes] = useState([]);
  const [busca, setBusca] = useState('');
  
  // Filtro rápido (todos, vip, novos, perdidos)
  const [filtroAtivo, setFiltroAtivo] = useState('todos'); 

  // Estados do Modal e Histórico
  const [clienteSelecionado, setClienteSelecionado] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [loadingHistorico, setLoadingHistorico] = useState(false);
  const [visualizarHistorico, setVisualizarHistorico] = useState(false);

  // Estados para os Rankings
  const [topMes, setTopMes] = useState([]);
  const [topAno, setTopAno] = useState([]);

  useEffect(() => {
    // --- BUSCA DE DADOS ---
    const fetchClientes = async () => {
      setLoading(true);
      const { data } = await supabase.from('clientes').select('*').order('nome');
      
      // ENRIQUECIMENTO DE DADOS (Simulação inteligente)
      const hoje = new Date();
      
      const clientesProcessados = (data || []).map(c => {
        // Gera uma data aleatória entre hoje e 90 dias atrás para simular a última visita
        const diasAleatorios = Math.floor(Math.random() * 90); 
        const dataVisita = new Date();
        dataVisita.setDate(hoje.getDate() - diasAleatorios);
        
        return {
          ...c,
          total_atendimentos: Math.floor(Math.random() * 20), 
          gasto_total: Math.floor(Math.random() * 2000) + 100, 
          gasto_mes: Math.floor(Math.random() * 500),
          ultima_visita: dataVisita.toISOString(),
          dias_sem_visita: diasAleatorios, // Campo importante para o card de "Perdidos"
          status: Math.random() > 0.8 ? 'vip' : 'ativo'
        };
      });

      // Rankings
      const ordenadosMes = [...clientesProcessados].sort((a, b) => b.gasto_mes - a.gasto_mes).slice(0, 3);
      setTopMes(ordenadosMes);
      const ordenadosAno = [...clientesProcessados].sort((a, b) => b.gasto_total - a.gasto_total).slice(0, 3);
      setTopAno(ordenadosAno);
      
      setClientes(clientesProcessados);
      setLoading(false);
    };
    fetchClientes();
  }, []);

  // --- HISTÓRICO REAL ---
  const fetchHistoricoCliente = async (clienteId) => {
    setLoadingHistorico(true);
    setVisualizarHistorico(true);
    
    const { data } = await supabase
      .from('agendamentos')
      .select('*')
      .eq('cliente_id', clienteId)
      .order('data', { ascending: false });

    setHistorico(data || []);
    setLoadingHistorico(false);
  };

  const abrirWhatsapp = (telefone) => {
    if (!telefone) return;
    const numeroLimpo = telefone.replace(/\D/g, '');
    const numeroFinal = numeroLimpo.length <= 11 ? `55${numeroLimpo}` : numeroLimpo;
    window.open(`https://wa.me/${numeroFinal}`, '_blank');
  };

  // --- LÓGICA DE FILTRAGEM ---
  const clientesFiltrados = clientes.filter(c => {
    // 1. Filtro de Texto
    const matchTexto = c.nome.toLowerCase().includes(busca.toLowerCase()) || 
                       (c.telefone && c.telefone.includes(busca));
    
    // 2. Filtro de Categoria (Cards)
    if (!matchTexto) return false;

    if (filtroAtivo === 'todos') return true;
    if (filtroAtivo === 'vip') return c.status === 'vip';
    if (filtroAtivo === 'novos') return c.total_atendimentos <= 3;
    if (filtroAtivo === 'perdidos') return c.dias_sem_visita > 45; // Mais de 45 dias sumido

    return true;
  });

  // --- ESTATÍSTICAS ---
  const stats = {
    total: clientes.length,
    vips: clientes.filter(c => c.status === 'vip').length,
    novos: clientes.filter(c => c.total_atendimentos <= 3).length,
    perdidos: clientes.filter(c => c.dias_sem_visita > 45).length // Critério: 45 dias
  };

  const RankingRow = ({ cliente, index, colorClass, valor }) => (
    <div className="flex items-center justify-between p-3 border-b border-white/5 last:border-0">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
          index === 0 ? `bg-${colorClass}-500 text-white shadow-lg shadow-${colorClass}-500/50` : 'bg-white/10 text-gray-400'
        }`}>
          {index + 1}º
        </div>
        <div>
          <p className="font-bold text-white text-sm">{cliente.nome}</p>
          <p className="text-[10px] text-gray-400">{cliente.total_atendimentos} visitas</p>
        </div>
      </div>
      <div className={`font-bold text-sm text-${colorClass}-400`}>
        R$ {valor}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32">
      
      {/* HEADER */}
      <div className="mb-6 px-4 pt-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Clientes</h1>
            <p className="text-gray-400 text-sm mt-1">Gerencie sua base de contatos</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all">
            <X size={24} />
          </button>
        </div>

        {/* CARDS DE ESTATÍSTICAS (CLICÁVEIS PARA FILTRAR) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          
          <div onClick={() => setFiltroAtivo('todos')} className={`bg-white/5 rounded-xl p-4 border cursor-pointer transition-all ${filtroAtivo === 'todos' ? 'border-violet-500 bg-violet-500/10' : 'border-white/10 hover:bg-white/10'}`}>
            <div className="flex items-center gap-2 mb-1 text-violet-400 font-bold text-xs"><User size={14}/> TOTAL</div>
            <div className="text-2xl font-bold text-white">{stats.total}</div>
          </div>

          <div onClick={() => setFiltroAtivo('vip')} className={`bg-white/5 rounded-xl p-4 border cursor-pointer transition-all ${filtroAtivo === 'vip' ? 'border-amber-500 bg-amber-500/10' : 'border-white/10 hover:bg-white/10'}`}>
            <div className="flex items-center gap-2 mb-1 text-amber-400 font-bold text-xs"><Award size={14}/> VIPs</div>
            <div className="text-2xl font-bold text-white">{stats.vips}</div>
          </div>

          <div onClick={() => setFiltroAtivo('novos')} className={`bg-white/5 rounded-xl p-4 border cursor-pointer transition-all ${filtroAtivo === 'novos' ? 'border-blue-500 bg-blue-500/10' : 'border-white/10 hover:bg-white/10'}`}>
            <div className="flex items-center gap-2 mb-1 text-blue-400 font-bold text-xs"><TrendingUp size={14}/> NOVOS</div>
            <div className="text-2xl font-bold text-white">{stats.novos}</div>
          </div>

          {/* CARD NOVO: CLIENTES PERDIDOS */}
          <div onClick={() => setFiltroAtivo('perdidos')} className={`bg-white/5 rounded-xl p-4 border cursor-pointer transition-all ${filtroAtivo === 'perdidos' ? 'border-red-500 bg-red-500/10' : 'border-white/10 hover:bg-white/10'}`}>
            <div className="flex items-center gap-2 mb-1 text-red-400 font-bold text-xs"><UserX size={14}/> PERDIDOS (+45d)</div>
            <div className="text-2xl font-bold text-white">{stats.perdidos}</div>
          </div>

        </div>
      </div>

      {/* BARRA DE BUSCA E FEEDBACK DO FILTRO */}
      <div className="px-4 mb-4 sticky top-0 z-10 bg-[#0a0a0f] pb-2 pt-2 space-y-2">
        <div className="bg-white/10 border border-white/10 rounded-2xl p-3 flex items-center gap-3 focus-within:border-purple-500 transition-colors shadow-lg">
          <Search className="text-gray-400" size={20} />
          <input 
            placeholder="Buscar por nome ou telefone..." 
            className="bg-transparent outline-none text-white w-full placeholder-gray-500"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            autoFocus={false}
          />
        </div>
        
        {/* Badge avisando qual filtro está ativo */}
        {filtroAtivo !== 'todos' && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Filtrando por:</span>
            <span className="text-xs font-bold px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full uppercase flex items-center gap-1">
              {filtroAtivo} <X size={12} className="cursor-pointer" onClick={() => setFiltroAtivo('todos')}/>
            </span>
          </div>
        )}
      </div>

      {/* LISTA DE CLIENTES */}
      <div className="px-4 space-y-3 min-h-[200px]">
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-purple-500"/></div>
        ) : clientesFiltrados.length === 0 ? (
          <div className="text-center py-10 text-gray-500 bg-white/5 rounded-2xl border border-white/5 border-dashed">
            Nenhum cliente encontrado com esse critério.
          </div>
        ) : (
          clientesFiltrados.map((cliente) => (
            <div 
              key={cliente.id} 
              className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between hover:bg-white/10 transition-all cursor-pointer group"
              onClick={() => {
                setClienteSelecionado(cliente);
                setVisualizarHistorico(false);
                setHistorico([]);
              }}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg relative ${cliente.status === 'vip' ? 'bg-gradient-to-br from-amber-500 to-yellow-600 text-white' : 'bg-white/10 text-gray-300'}`}>
                  {cliente.nome.charAt(0).toUpperCase()}
                  {/* Bolinha vermelha se for cliente perdido */}
                  {cliente.dias_sem_visita > 45 && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-[#0a0a0f]" title="Cliente Perdido"></div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white">{cliente.nome}</h3>
                    {cliente.status === 'vip' && <Star size={12} className="text-amber-400 fill-amber-400"/>}
                  </div>
                  <div className="text-sm text-gray-400 flex items-center gap-1">
                    {cliente.dias_sem_visita > 45 ? 
                      <span className="text-red-400 font-bold text-xs flex items-center gap-1"><Clock size={10}/> Ausente há {cliente.dias_sem_visita} dias</span> 
                      : 
                      <span><Phone size={12} className="inline mr-1"/>{cliente.telefone || 'Sem telefone'}</span>
                    }
                  </div>
                </div>
              </div>
              <ChevronRight className="text-gray-600 group-hover:text-purple-400 transition-colors" size={20} />
            </div>
          ))
        )}
      </div>

      {/* RANKING DE CLIENTES */}
      {clientes.length > 0 && filtroAtivo === 'todos' && (
        <div className="px-4 mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 pb-10">
          <div className="bg-gradient-to-b from-blue-900/20 to-transparent border border-blue-500/30 rounded-3xl p-5">
            <div className="flex items-center gap-2 mb-4 border-b border-blue-500/20 pb-3">
              <Trophy className="text-blue-400" size={20}/>
              <h3 className="font-bold text-blue-100">Top do Mês</h3>
            </div>
            {topMes.map((c, i) => <RankingRow key={i} index={i} cliente={c} valor={c.gasto_mes} colorClass="blue" />)}
          </div>

          <div className="bg-gradient-to-b from-amber-900/20 to-transparent border border-amber-500/30 rounded-3xl p-5">
            <div className="flex items-center gap-2 mb-4 border-b border-amber-500/20 pb-3">
              <Crown className="text-amber-400" size={20}/>
              <h3 className="font-bold text-amber-100">Top do Ano</h3>
            </div>
            {topAno.map((c, i) => <RankingRow key={i} index={i} cliente={c} valor={c.gasto_total} colorClass="amber" />)}
          </div>
        </div>
      )}

      {/* MODAL DETALHES E HISTÓRICO */}
      {clienteSelecionado && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in" onClick={() => setClienteSelecionado(null)}>
          <div className="bg-[#18181b] border border-white/10 p-6 rounded-3xl w-full max-w-md shadow-2xl relative overflow-hidden" onClick={e => e.stopPropagation()}>
            
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                  {clienteSelecionado.nome.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white leading-tight">{clienteSelecionado.nome}</h2>
                  
                  {/* LINK WHATSAPP */}
                  <div 
                    onClick={() => abrirWhatsapp(clienteSelecionado.telefone)}
                    className="flex items-center gap-2 text-green-400 mt-2 cursor-pointer hover:text-green-300 transition-colors bg-green-500/10 px-3 py-1.5 rounded-full border border-green-500/20"
                  >
                    <MessageCircle size={16} fill="currentColor" className="text-green-500"/>
                    <span className="text-sm font-bold">Chamar no Zap</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setClienteSelecionado(null)} className="p-2 bg-white/10 rounded-full text-white hover:bg-white/20"><X size={20}/></button>
            </div>
            
            {!visualizarHistorico ? (
              <div className="animate-in slide-in-from-right-4 duration-300">
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-white/5 p-3 rounded-xl text-center border border-white/5">
                    <div className="text-xs text-gray-400 uppercase font-bold mb-1">Gasto Total</div>
                    <div className="text-xl font-bold text-emerald-400">R$ {clienteSelecionado.gasto_total}</div>
                  </div>
                  <div className="bg-white/5 p-3 rounded-xl text-center border border-white/5">
                    <div className="text-xs text-gray-400 uppercase font-bold mb-1">Ausente há</div>
                    <div className={`text-xl font-bold ${clienteSelecionado.dias_sem_visita > 45 ? 'text-red-400' : 'text-white'}`}>
                      {clienteSelecionado.dias_sem_visita} dias
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => fetchHistoricoCliente(clienteSelecionado.id)}
                  className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-purple-900/20 flex items-center justify-center gap-2"
                >
                  <Clock size={18}/> Ver Histórico Completo
                </button>
              </div>
            ) : (
              <div className="animate-in slide-in-from-right-4 duration-300">
                <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-2">
                  <h3 className="text-white font-bold">Histórico</h3>
                  <button onClick={() => setVisualizarHistorico(false)} className="text-xs text-purple-400 font-bold uppercase hover:underline">Voltar</button>
                </div>

                <div className="max-h-[300px] overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-white/10">
                  {loadingHistorico ? (
                    <div className="flex justify-center py-4"><Loader2 className="animate-spin text-purple-500"/></div>
                  ) : historico.length === 0 ? (
                    <p className="text-center text-gray-500 py-4 text-sm">Nenhum agendamento encontrado.</p>
                  ) : (
                    historico.map((item, idx) => (
                      <div key={idx} className="bg-white/5 p-3 rounded-xl border border-white/5 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${item.status === 'confirmado' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
                            <Scissors size={14}/>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">{item.servico}</p>
                            <p className="text-xs text-gray-400 flex items-center gap-1">
                              <Calendar size={10}/> {new Date(item.data).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>
                        <span className="text-sm font-bold text-white">R$ {item.valor}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};