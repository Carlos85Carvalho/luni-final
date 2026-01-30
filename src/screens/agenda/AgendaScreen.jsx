import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase'; // Confirme se o caminho está certo
import { Calendar as CalendarIcon, User, Clock, Plus, X, Search, ChevronLeft, ChevronRight } from 'lucide-react';

export const AgendaScreen = ({ onClose }) => {
  const [loading, setLoading] = useState(true);
  const [dataSelecionada, setDataSelecionada] = useState(new Date());
  const [agendamentos, setAgendamentos] = useState([]);

  // Gera dias para o calendário horizontal
  const diasSemana = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + (i - 2));
    return d;
  });

  useEffect(() => {
    const fetchAgenda = async () => {
      setLoading(true);
      try {
        const dataISO = dataSelecionada.toISOString().split('T')[0];
        
        // --- AQUI ESTÁ A MUDANÇA MÁGICA ---
        // Buscando da VIEW em vez da tabela crua
        const { data, error } = await supabase
          .from('view_agenda_financeiro') 
          .select('*')
          .eq('data', dataISO)
          .order('horario', { ascending: true });

        if (error) throw error;
        setAgendamentos(data || []);
      } catch (error) {
        console.error('Erro ao buscar agenda:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAgenda();
  }, [dataSelecionada]);

  const formatHora = (h) => h ? h.slice(0, 5) : '--:--';

  // Função para formatar moeda
  const formatMoeda = (valor) => {
    return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      
      {/* HEADER DA AGENDA */}
      <div className="flex justify-between items-center mb-6 px-4 pt-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Agenda</h1>
          <p className="text-gray-400 text-sm">Gerencie seus horários</p>
        </div>
        <button onClick={onClose} className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"><X size={24} /></button>
      </div>

      {/* CALENDÁRIO HORIZONTAL */}
      <div className="flex gap-3 mb-8 overflow-x-auto pb-4 scrollbar-hide px-4">
        {diasSemana.map((dia, idx) => {
          const isSelected = dia.toDateString() === dataSelecionada.toDateString();
          const isToday = dia.toDateString() === new Date().toDateString();
          return (
            <button key={idx} onClick={() => setDataSelecionada(dia)} className={`flex flex-col items-center justify-center min-w-[70px] h-20 rounded-2xl border transition-all ${isSelected ? 'bg-blue-600 border-blue-500 shadow-lg shadow-blue-900/50 scale-105' : 'bg-white/5 border-white/10 text-gray-400'}`}>
              <span className="text-xs font-bold uppercase mb-1">{dia.toLocaleDateString('pt-BR', { weekday: 'short' }).slice(0, 3)}</span>
              <span className={`text-xl font-bold ${isSelected ? 'text-white' : 'text-gray-300'}`}>{dia.getDate()}</span>
              {isToday && <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1"></span>}
            </button>
          );
        })}
      </div>

      {/* LISTA DE AGENDAMENTOS */}
      <div className="space-y-4 px-4">
        {loading ? <div className="text-center py-20 text-gray-500">Carregando...</div> : agendamentos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500 bg-white/5 rounded-3xl border border-white/5 border-dashed mx-2">
            <CalendarIcon size={48} className="mb-4 opacity-20" />
            <p>Agenda livre para este dia</p>
          </div>
        ) : (
          agendamentos.map((item, index) => (
            <div key={index} className="flex gap-4 group">
              {/* Coluna da Hora */}
              <div className="flex flex-col items-center mt-1 w-12">
                <div className="text-sm font-bold text-gray-400">{formatHora(item.horario)}</div>
                <div className="w-0.5 h-full bg-white/10 my-2 group-last:hidden"></div>
              </div>

              {/* Card do Agendamento */}
              <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4 relative overflow-hidden hover:bg-white/10 transition-colors">
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${item.status === 'confirmado' ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                
                <div className="flex justify-between items-start">
                  <div>
                    {/* Nome do Cliente (Vindo da View) */}
                    <h3 className="font-bold text-lg text-white">{item.nome_cliente || 'Cliente'}</h3>
                    
                    {/* Serviço */}
                    <p className="text-sm text-gray-400">{item.servico}</p>
                    
                    {/* NOVO: Nome do Profissional */}
                    <div className="flex items-center gap-1 mt-1 text-xs text-blue-300">
                        <User size={12} />
                        <span>{item.nome_profissional || 'Profissional'}</span>
                    </div>
                  </div>

                  {/* Preço (Vindo da View formatado) */}
                  <span className="block font-bold text-blue-400">
                    {formatMoeda(item.valor_final)}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};