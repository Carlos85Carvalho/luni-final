import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase'; 
import { 
  Calendar, Clock, User, DollarSign, LogOut, CheckCircle, 
  MapPin, ChevronRight, Wallet, Scissors, TrendingUp, Bell 
} from 'lucide-react';

export const ProfessionalDashboard = ({ profissional, onLogout }) => {
  const [setLoading] = useState(true);
  const [tab, setTab] = useState('agenda'); // 'agenda' ou 'financeiro'
  const [agendamentos, setAgendamentos] = useState([]);
  const [resumo, setResumo] = useState({ hoje: 0, mes: 0, atendimentos: 0 });

  // Busca dados do profissional logado
  useEffect(() => {
    const fetchDados = async () => {
        setLoading(true);
        const hojeISO = new Date().toISOString().split('T')[0];
        const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

        // 1. Busca Agendamentos de HOJE
        const { data: agendaHoje } = await supabase
        .from('agendamentos')
        .select('*')
        .eq('profissional_id', profissional.id) // FILTRA PELO ID DO PROFISSIONAL
        .eq('data', hojeISO)
        .neq('status', 'cancelado')
        .order('horario', { ascending: true });

        // 2. Busca Produção do Mês (Para o Card de Financeiro)
        const { data: producaoMes } = await supabase
        .from('agendamentos')
        .select('valor')
        .eq('profissional_id', profissional.id)
        .gte('data', inicioMes)
        .neq('status', 'cancelado');

        const totalMes = producaoMes?.reduce((acc, curr) => acc + (curr.valor || 0), 0) || 0;
        const totalHoje = agendaHoje?.reduce((acc, curr) => acc + (curr.valor || 0), 0) || 0;

        setAgendamentos(agendaHoje || []);
        setResumo({
        hoje: totalHoje,
        mes: totalMes,
        atendimentos: agendaHoje?.length || 0
        });
        setLoading(false);
    };
    fetchDados();
  }, [profissional.id]);

  const concluirAtendimento = async (id) => {
    const { error } = await supabase
      .from('agendamentos')
      .update({ status: 'concluido' })
      .eq('id', id);

    if (!error) {
      // Atualiza lista localmente para dar feedback rápido
      setAgendamentos(prev => prev.map(a => a.id === id ? { ...a, status: 'concluido' } : a));
    }
  };

  // Separa o próximo cliente (primeiro da lista que não está concluído)
  const proximoCliente = agendamentos.find(a => a.status === 'agendado');

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white pb-24 font-sans">
      
      {/* HEADER */}
      <div className="bg-[#18181b] p-6 rounded-b-3xl border-b border-white/5 shadow-2xl mb-6 relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#5B2EFF] to-cyan-500 flex items-center justify-center text-xl font-bold text-white shadow-lg border-2 border-[#0a0a0f]">
              {profissional.nome?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Olá, {profissional.nome?.split(' ')[0]}</h1>
              <p className="text-sm text-gray-400 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Online agora
              </p>
            </div>
          </div>
          <button onClick={onLogout} className="p-2 bg-white/5 rounded-full hover:bg-red-500/20 hover:text-red-400 transition-all">
            <LogOut size={20}/>
          </button>
        </div>

        {/* RESUMO RÁPIDO */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-white/5 p-3 rounded-2xl border border-white/5 flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400"><DollarSign size={18}/></div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-bold">Produção Hoje</p>
              <p className="text-lg font-bold text-white">R$ {resumo.hoje}</p>
            </div>
          </div>
          <div className="bg-white/5 p-3 rounded-2xl border border-white/5 flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-xl text-blue-400"><Scissors size={18}/></div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-bold">Agendados</p>
              <p className="text-lg font-bold text-white">{resumo.atendimentos}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ABAS DE NAVEGAÇÃO */}
      <div className="px-6 mb-6">
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
          <button 
            onClick={() => setTab('agenda')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${tab === 'agenda' ? 'bg-[#5B2EFF] text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
          >
            <Calendar size={16}/> Minha Agenda
          </button>
          <button 
            onClick={() => setTab('financeiro')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${tab === 'financeiro' ? 'bg-[#5B2EFF] text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
          >
            <Wallet size={16}/> Extrato
          </button>
        </div>
      </div>

      {/* CONTEÚDO: AGENDA */}
      {tab === 'agenda' && (
        <div className="px-6 space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          
          {/* PRÓXIMO CLIENTE (DESTAQUE) */}
          {proximoCliente ? (
            <div>
              <h2 className="text-sm font-bold text-gray-400 uppercase mb-3 ml-1">A seguir</h2>
              <div className="bg-gradient-to-r from-violet-900/50 to-fuchsia-900/50 border border-violet-500/30 p-5 rounded-3xl relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-white/10 px-3 py-1 rounded-lg text-sm font-bold text-white flex items-center gap-2 backdrop-blur-md">
                      <Clock size={14} className="text-purple-300"/> {proximoCliente.horario.slice(0,5)}
                    </div>
                    <span className="text-xs font-bold bg-amber-500/20 text-amber-300 px-2 py-1 rounded border border-amber-500/30">Aguardando</span>
                  </div>

                  <h3 className="text-2xl font-bold text-white mb-1">{proximoCliente.cliente_nome}</h3>
                  <p className="text-purple-200 text-sm mb-4 flex items-center gap-2"><Scissors size={14}/> {proximoCliente.servico}</p>

                  <button 
                    onClick={() => concluirAtendimento(proximoCliente.id)}
                    className="w-full py-3 bg-white text-purple-900 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-gray-100 transition-all active:scale-95"
                  >
                    <CheckCircle size={18}/> Concluir Atendimento
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 bg-white/5 rounded-3xl border border-white/5 border-dashed">
              <p className="text-gray-400">Você está livre por enquanto! 🎉</p>
            </div>
          )}

          {/* LISTA COMPLETA DO DIA */}
          <div>
            <h2 className="text-sm font-bold text-gray-400 uppercase mb-3 ml-1">Restante do Dia</h2>
            <div className="space-y-3">
              {agendamentos.filter(a => a.id !== proximoCliente?.id).map((item) => (
                <div key={item.id} className={`p-4 rounded-2xl border flex items-center justify-between ${item.status === 'concluido' ? 'bg-white/5 border-white/5 opacity-60' : 'bg-[#18181b] border-white/10'}`}>
                  <div className="flex items-center gap-4">
                    <div className="text-center min-w-[50px]">
                      <span className="block text-sm font-bold text-gray-400">{item.horario.slice(0,5)}</span>
                    </div>
                    <div className="w-px h-8 bg-white/10"></div>
                    <div>
                      <h4 className={`font-bold ${item.status === 'concluido' ? 'text-gray-400 line-through' : 'text-white'}`}>{item.cliente_nome}</h4>
                      <p className="text-xs text-gray-500">{item.servico}</p>
                    </div>
                  </div>
                  
                  {item.status === 'concluido' ? (
                    <div className="text-green-500"><CheckCircle size={20}/></div>
                  ) : (
                    <div className="text-sm font-bold text-gray-500">R$ {item.valor}</div>
                  )}
                </div>
              ))}
              {agendamentos.length === 0 && <p className="text-gray-500 text-sm text-center italic">Agenda vazia para hoje.</p>}
            </div>
          </div>
        </div>
      )}

      {/* CONTEÚDO: FINANCEIRO */}
      {tab === 'financeiro' && (
        <div className="px-6 space-y-6 animate-in slide-in-from-right-4 duration-500">
          <div className="bg-gradient-to-br from-emerald-900/40 to-teal-900/40 border border-emerald-500/30 p-6 rounded-3xl text-center relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-emerald-300 text-sm font-bold uppercase mb-1">Produção Mensal</p>
              <h2 className="text-4xl font-bold text-white mb-2">R$ {resumo.mes.toLocaleString()}</h2>
              <p className="text-xs text-gray-400">Total acumulado neste mês</p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-white font-bold">Histórico Recente</h3>
            {/* Aqui poderia entrar um .map() de todos os serviços do mês */}
            <p className="text-gray-500 text-sm text-center">Detalhes do extrato em breve...</p>
          </div>
        </div>
      )}

    </div>
  );
};