import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { 
  Calendar, Clock, User, LogOut, CheckCircle, 
  Wallet, Scissors, Star, AlertCircle 
} from 'lucide-react';

export const ProfessionalDashboard = ({ profissional, onLogout }) => {
  const [setLoading] = useState(true);
  const [tab, setTab] = useState('agenda'); 
  const [agendamentos, setAgendamentos] = useState([]);
  
  // --- MOCK DATA (DADOS FALSOS PARA TESTE VISUAL) ---
  const MOCK_DATA = [
    { id: 1, horario: '09:00', cliente_nome: 'Fernanda Lima', servico: 'Corte e Escova', valor: 120, status: 'concluido' },
    { id: 2, horario: '10:30', cliente_nome: 'Juliana Paes', servico: 'Hidratação Profunda', valor: 250, status: 'agendado' },
    { id: 3, horario: '14:00', cliente_nome: 'Mariana Rios', servico: 'Coloração', valor: 350, status: 'agendado' },
  ];

  const [resumo, setResumo] = useState({ hoje: 0, mes: 1250, meta: 2000, atendimentos: 0 });

  useEffect(() => {
    const fetchDados = async () => {
        setLoading(true);
        const hojeISO = new Date().toISOString().split('T')[0];

        // Tenta buscar do Supabase
        const { data: agendaHoje } = await supabase
        .from('agendamentos')
        .select('*')
        .eq('profissional_id', profissional.id)
        .eq('data', hojeISO)
        .neq('status', 'cancelado')
        .order('horario', { ascending: true });

        // SE A AGENDA DO BANCO ESTIVER VAZIA, USA OS DADOS FALSOS
        // Assim você consegue ver o layout bonito mesmo sem clientes reais
        const dadosFinais = agendaHoje && agendaHoje.length > 0 ? agendaHoje : MOCK_DATA;

        const totalHoje = dadosFinais.reduce((acc, curr) => acc + (curr.valor || 0), 0);
        
        setAgendamentos(dadosFinais);
        setResumo(prev => ({
            ...prev,
            hoje: totalHoje,
            atendimentos: dadosFinais.length
        }));
        setLoading(false);
    };
    fetchDados();
  }, [profissional.id]);

  const concluirAtendimento = async (id) => {
    setAgendamentos(prev => prev.map(a => a.id === id ? { ...a, status: 'concluido' } : a));
  };

  const proximoCliente = agendamentos.find(a => a.status === 'agendado');
  const percentualMeta = Math.min((resumo.mes / resumo.meta) * 100, 100);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white pb-24 font-sans">
      
      {/* HEADER COM STATUS E NOTA */}
      <div className="bg-gradient-to-b from-[#18181b] to-[#0a0a0f] p-6 pt-8 pb-10 rounded-b-[40px] border-b border-white/5 shadow-2xl relative z-10">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-4">
            <div className="relative">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#5B2EFF] to-cyan-500 flex items-center justify-center text-2xl font-bold text-white shadow-lg border-4 border-[#0a0a0f]">
                {profissional.nome?.charAt(0).toUpperCase()}
                </div>
                <div className="absolute bottom-0 right-0 w-5 h-5 bg-green-500 rounded-full border-4 border-[#0a0a0f]"></div>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Olá, {profissional.nome?.split(' ')[0]}</h1>
              <p className="text-sm text-gray-400 flex items-center gap-1">
                <Star size={12} className="text-yellow-500 fill-yellow-500"/> 4.9 (Especialista)
              </p>
            </div>
          </div>
          <button onClick={onLogout} className="p-3 bg-white/5 rounded-2xl hover:bg-red-500/20 hover:text-red-400 transition-all border border-white/5">
            <LogOut size={20}/>
          </button>
        </div>

        {/* CARD DE META (GAMIFICATION) */}
        <div className="bg-[#1c1c24] p-4 rounded-2xl border border-white/5 mb-2 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-blue-500/20 transition-all"></div>
            
            <div className="flex justify-between items-end mb-2 relative z-10">
                <div>
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Produção do Mês</p>
                    <p className="text-2xl font-bold text-white">R$ {resumo.mes}</p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-blue-400 font-bold mb-1">Meta: R$ {resumo.meta}</p>
                </div>
            </div>
            {/* Barra de Progresso */}
            <div className="h-2 w-full bg-black/50 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 shadow-[0_0_10px_rgba(59,130,246,0.5)]" 
                    style={{ width: `${percentualMeta}%` }}
                ></div>
            </div>
            <p className="text-[10px] text-gray-500 mt-2 text-right">Faltam R$ {resumo.meta - resumo.mes} para o bônus!</p>
        </div>
      </div>

      {/* ABAS DE NAVEGAÇÃO */}
      <div className="px-6 -mt-6 relative z-20 mb-8">
        <div className="flex bg-[#1c1c24] p-1.5 rounded-2xl border border-white/10 shadow-xl">
          <button 
            onClick={() => setTab('agenda')}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${tab === 'agenda' ? 'bg-[#5B2EFF] text-white shadow-lg shadow-purple-900/30' : 'text-gray-400 hover:text-white'}`}
          >
            <Calendar size={16}/> Agenda
          </button>
          <button 
            onClick={() => setTab('financeiro')}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${tab === 'financeiro' ? 'bg-[#5B2EFF] text-white shadow-lg shadow-purple-900/30' : 'text-gray-400 hover:text-white'}`}
          >
            <Wallet size={16}/> Ganhos
          </button>
        </div>
      </div>

      {tab === 'agenda' && (
        <div className="px-6 animate-in slide-in-from-bottom-4 duration-500 pb-10">
          
          {/* DESTAQUE: PRÓXIMO CLIENTE */}
          {proximoCliente ? (
            <div className="mb-8">
              <h2 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> A seguir
              </h2>
              <div className="bg-gradient-to-br from-violet-900 via-[#2d1b69] to-black border border-violet-500/30 p-6 rounded-[32px] relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <div className="bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-sm font-bold text-white flex items-center gap-2 border border-white/5">
                      <Clock size={14} className="text-purple-300"/> {proximoCliente.horario}
                    </div>
                    <div className="bg-indigo-500/20 text-indigo-300 p-2 rounded-full border border-indigo-500/30">
                        <User size={20} />
                    </div>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-3xl font-bold text-white mb-1 leading-tight">{proximoCliente.cliente_nome}</h3>
                    <p className="text-purple-200 text-lg flex items-center gap-2 opacity-80">
                        <Scissors size={16}/> {proximoCliente.servico}
                    </p>
                    <p className="text-sm text-gray-400 mt-2 flex items-center gap-1">
                        <AlertCircle size={12}/> Cliente fidelidade
                    </p>
                  </div>

                  <button 
                    onClick={() => concluirAtendimento(proximoCliente.id)}
                    className="w-full py-4 bg-white text-[#0a0a0f] font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-gray-100 transition-all active:scale-95 shadow-lg"
                  >
                    <CheckCircle size={20} className="text-green-600"/> Finalizar Atendimento
                  </button>
                </div>
              </div>
            </div>
          ) : (
             <div className="text-center py-12 bg-white/5 rounded-3xl border border-white/5 border-dashed mb-8">
               <p className="text-gray-400 font-medium">Agenda livre por enquanto!</p>
             </div>
          )}

          {/* TIMELINE DE CLIENTES */}
          <div>
            <h2 className="text-xs font-bold text-gray-400 uppercase mb-4 ml-1">Linha do tempo (Hoje)</h2>
            <div className="space-y-0 relative">
              <div className="absolute left-[27px] top-4 bottom-4 w-0.5 bg-white/10 z-0"></div>

              {agendamentos.map((item) => (
                <div key={item.id} className={`relative flex gap-4 group ${item.status === 'concluido' ? 'opacity-50 grayscale-[0.5]' : ''}`}>
                  
                  <div className="z-10 flex flex-col items-center min-w-[56px]">
                    <div className={`w-3 h-3 rounded-full border-2 mb-1 ${item.status === 'concluido' ? 'bg-green-500 border-green-900' : 'bg-[#0a0a0f] border-indigo-500'}`}></div>
                    <span className="text-xs font-bold text-gray-400 bg-[#0a0a0f] py-1">{item.horario}</span>
                  </div>

                  <div className="flex-1 pb-6">
                    <div className="bg-[#18181b] border border-white/5 p-4 rounded-2xl hover:border-white/20 transition-all shadow-lg">
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="font-bold text-base text-white">{item.cliente_nome}</h4>
                                <p className="text-sm text-indigo-400 font-medium">{item.servico}</p>
                            </div>
                            <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-lg">
                                R$ {item.valor}
                            </span>
                        </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};