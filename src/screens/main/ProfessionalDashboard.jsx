import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { Calendar, DollarSign, LogOut, Scissors } from 'lucide-react';

const Card = ({ children, className = '' }) => <div className={`rounded-2xl p-5 shadow-sm bg-white border border-gray-100 ${className}`}>{children}</div>;

export const ProfessionalDashboard = ({ profissional, onLogout }) => {
  const [agendamentos, setAgendamentos] = useState([]);
  // Pega a data de hoje no formato YYYY-MM-DD
  const [hoje] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const fetchAgenda = async () => {
      if (!profissional?.id) return;

      const { data } = await supabase
        .from('agendamentos')
        .select('*')
        .eq('data', hoje)
        .eq('profissional_id', profissional.id) // Filtra só o que é dele
        .order('horario');
      
      if (data) setAgendamentos(data);
    };
    fetchAgenda();
  }, [profissional, hoje]);

  // Calcula comissão simples (ex: 50%)
  const totalDia = agendamentos.reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0);
  const comissao = totalDia * 0.5; 

  return (
    <div className="min-h-screen bg-[#F8F9FC] p-4 pb-20">
      
      {/* Topbar */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Olá, {profissional?.nome}</h1>
          <p className="text-xs text-gray-400">Painel do Profissional</p>
        </div>
        <button onClick={onLogout} className="p-2 bg-white rounded-full text-red-500 shadow-sm border border-gray-100">
          <LogOut size={20} />
        </button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-[#5B2EFF] rounded-2xl p-4 text-white shadow-lg shadow-indigo-200">
          <div className="flex items-center gap-2 mb-1 opacity-80"><Calendar size={16}/><span className="text-xs">Hoje</span></div>
          <h2 className="text-2xl font-bold">{agendamentos.length}</h2>
          <p className="text-xs opacity-70">Clientes</p>
        </div>
        <div className="bg-white rounded-2xl p-4 text-gray-800 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-1 text-green-600"><DollarSign size={16}/><span className="text-xs uppercase">Comissão</span></div>
          <h2 className="text-2xl font-bold">R$ {comissao.toFixed(2)}</h2>
          <p className="text-xs text-gray-400">Estimado (50%)</p>
        </div>
      </div>

      {/* Lista de Agenda */}
      <h3 className="font-bold text-gray-700 mb-3">Sua Agenda Hoje</h3>
      <div className="space-y-3">
        {agendamentos.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-gray-200">
            <p className="text-gray-400 text-sm">Nenhum agendamento hoje.</p>
          </div>
        ) : (
          agendamentos.map(item => (
            <Card key={item.id} className="flex justify-between items-center border-l-4 border-l-[#5B2EFF]">
              <div className="flex gap-3 items-center">
                <div className="bg-gray-50 p-2 rounded-lg text-xs font-bold text-gray-600 flex flex-col items-center w-14 border border-gray-100">
                  <span>{item.horario.slice(0,5)}</span>
                </div>
                <div>
                  <p className="font-bold text-gray-800 text-sm">{item.cliente_nome}</p>
                  <div className="flex items-center gap-1 text-xs text-[#5B2EFF] mt-0.5 font-medium">
                    <Scissors size={12} /> {item.servico}
                  </div>
                </div>
              </div>
              <span className="text-xs font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-md">R$ {item.valor}</span>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};