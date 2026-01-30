import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
// Import do Firebase
import { requestNotificationPermission } from '../../services/firebase';
// Import do Calendário Novo
import { CalendarView } from '../../components/ui/CalendarView';

import { 
  Calendar, Clock, User, LogOut, CheckCircle, 
  Wallet, Scissors, Star, AlertCircle, Bell, MessageCircle 
} from 'lucide-react';

export const ProfessionalDashboard = ({ profissional, onLogout }) => {
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('agenda'); 
  const [agendamentos, setAgendamentos] = useState([]);
  const [resumo, setResumo] = useState({ hoje: 0, mes: 0, atendimentos: 0 });

  useEffect(() => {
    fetchDados();
  }, [profissional.id]);

  const fetchDados = async () => {
    setLoading(true);
    const hoje = new Date();
    const hojeISO = hoje.toLocaleDateString('en-CA');
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString();

    // 1. Busca TUDO do mês (para preencher o Calendário)
    const { data: todosAgendamentos } = await supabase
      .from('agendamentos')
      .select('*')
      .eq('profissional_id', profissional.id)
      .gte('data', inicioMes)
      .neq('status', 'cancelado');

    // 2. Filtra localmente o que é de hoje para o card de resumo
    const agendaHoje = todosAgendamentos?.filter(a => a.data === hojeISO) || [];
    
    // Cálculos
    const totalMes = todosAgendamentos?.reduce((acc, curr) => acc + (curr.valor_total || curr.valor || 0), 0) || 0;
    const totalHoje = agendaHoje.reduce((acc, curr) => acc + (curr.valor_total || curr.valor || 0), 0);

    setAgendamentos(todosAgendamentos || []);
    setResumo({
      hoje: totalHoje,
      mes: totalMes,
      atendimentos: todosAgendamentos?.length || 0
    });
    setLoading(false);
  };

  const concluirAtendimento = async (id) => {
    const { error } = await supabase
      .from('agendamentos')
      .update({ status: 'concluido' })
      .eq('id', id);

    if (!error) {
      setAgendamentos(prev => prev.map(a => a.id === id ? { ...a, status: 'concluido' } : a));
    }
  };

  const abrirWhatsapp = (telefone) => {
    if (!telefone) return alert("Sem telefone cadastrado");
    const nums = telefone.replace(/\D/g, '');
    window.open(`https://wa.me/55${nums}`, '_blank');
  };

  // Lógica para pegar o próximo cliente (futuro)
  const agora = new Date();
  const proximoCliente = agendamentos
    .filter(a => a.status === 'agendado' || a.status === 'confirmado')
    .sort((a, b) => new Date(`${a.data}T${a.horario}`) - new Date(`${b.data}T${b.horario}`))
    .find(a => new Date(`${a.data}T${a.horario}`) >= agora); // Pega o primeiro que ainda não passou

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white pb-24 font-sans">
      
      {/* HEADER */}
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
                <Star size={12} className="text-yellow-500 fill-yellow-500"/> Online agora
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
             {/* --- AQUI ESTÁ O BOTÃO DO SINO QUE FALTAVA --- */}
             <button 
                onClick={() => requestNotificationPermission(profissional.id)}
                className="p-3 bg-white/5 rounded-2xl hover:bg-purple-500/20 hover:text-purple-400 transition-all border border-white/5"
                title="Ativar Notificações"
             >
                <Bell size={20}/>
             </button>

             <button onClick={onLogout} className="p-3 bg-white/5 rounded-2xl hover:bg-red-500/20 hover:text-red-400 transition-all border border-white/5">
                <LogOut size={20}/>
             </button>
          </div>
        </div>

        {/* CARDS DE RESUMO */}
        <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#1c1c24] p-4 rounded-2xl border border-white/5">
                <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Hoje</p>
                <p className="text-xl font-bold text-white">R$ {resumo.hoje}</p>
            </div>
            <div className="bg-[#1c1c24] p-4 rounded-2xl border border-white/5">
                <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Mês</p>
                <p className="text-xl font-bold text-white">R$ {resumo.mes}</p>
            </div>
            <div className="bg-[#1c1c24] p-4 rounded-2xl border border-white/5">
                <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Agendados</p>
                <p className="text-xl font-bold text-white">{resumo.atendimentos}</p>
            </div>
        </div>
      </div>

      {/* ABAS DE NAVEGAÇÃO */}
      <div className="px-6 -mt-6 relative z-20 mb-8">
        <div className="flex bg-[#1c1c24] p-1.5 rounded-2xl border border-white/10 shadow-xl">
          <button 
            onClick={() => setTab('agenda')}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${tab === 'agenda' ? 'bg-[#5B2EFF] text-white shadow-lg shadow-purple-900/30' : 'text-gray-400 hover:text-white'}`}
          >
            <Calendar size={16}/> Minha Agenda
          </button>
          <button 
            onClick={() => setTab('financeiro')}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${tab === 'financeiro' ? 'bg-[#5B2EFF] text-white shadow-lg shadow-purple-900/30' : 'text-gray-400 hover:text-white'}`}
          >
            <Wallet size={16}/> Financeiro
          </button>
        </div>
      </div>

      {tab === 'agenda' && (
        <div className="px-6 pb-10 space-y-6">
          
          {/* PRÓXIMO CLIENTE (Card de Destaque) */}
          {proximoCliente && (
            <div className="bg-gradient-to-br from-violet-900 via-[#2d1b69] to-black border border-violet-500/30 p-6 rounded-[32px] relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-sm font-bold text-white flex items-center gap-2 border border-white/5">
                      <Clock size={14} className="text-purple-300"/> {proximoCliente.horario}
                    </div>
                    {proximoCliente.telefone && (
                        <button onClick={() => abrirWhatsapp(proximoCliente.telefone)} className="p-2 bg-green-500/20 text-green-400 rounded-full hover:bg-green-500/30">
                            <MessageCircle size={20}/>
                        </button>
                    )}
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-1">{proximoCliente.cliente_nome}</h3>
                  <p className="text-purple-200 text-sm mb-4 flex items-center gap-2"><Scissors size={14}/> {proximoCliente.servico}</p>
                  
                  <button onClick={() => concluirAtendimento(proximoCliente.id)} className="w-full py-3 bg-white text-[#0a0a0f] font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-gray-100 active:scale-95 shadow-lg">
                    <CheckCircle size={18} className="text-green-600"/> Concluir
                  </button>
                </div>
            </div>
          )}

          {/* --- AQUI ESTÁ A NOVA AGENDA ESTILO GOOGLE --- */}
          <div className="animate-in slide-in-from-bottom-4 duration-700">
             <h2 className="text-xs font-bold text-gray-400 uppercase mb-4 ml-1">Visão Geral</h2>
             <CalendarView agendamentos={agendamentos} />
          </div>

        </div>
      )}
    </div>
  );
};