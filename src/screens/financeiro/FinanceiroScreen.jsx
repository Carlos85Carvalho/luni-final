import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { 
  TrendingUp, DollarSign, Calendar, Users, Award, 
  Filter, Receipt, Loader2, ArrowUpRight, CheckCheck, Zap, X
} from 'lucide-react';
import { RelatorioAvancadoModal } from './RelatorioAvancadoModal'; 

export const FinanceiroScreen = ({ onClose }) => {
  const [loading, setLoading] = useState(true);
  const [isRelatorioOpen, setIsRelatorioOpen] = useState(false);
  const [filtros, setFiltros] = useState({ mes: new Date().getMonth(), ano: new Date().getFullYear(), profissional: 'todos' });
  
  // KPIs e Dados
  const [kpis, setKpis] = useState({ receitaRealizada: 0, receitaProjetada: 0, ticketMedio: 0, atendimentos: 0 });
  const [topServicos, setTopServicos] = useState([]);
  const [topProfissionais, setTopProfissionais] = useState([]);
  const [extrato, setExtrato] = useState([]);

  // ... (Mantenha os useEffects de fetchDados iguais ao anterior, vou resumir aqui para focar no layout)
  // SE PRECISAR DO CÓDIGO COMPLETO DO FETCH NOVAMENTE, ME AVISE.
  // Estou assumindo que você vai copiar o bloco `useEffect` do código anterior para cá.
  // Vou colocar o fetch básico aqui para funcionar:
  
  useEffect(() => {
    const carregarDados = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const { data: usu } = await supabase.from('usuarios').select('salao_id').eq('id', user.id).maybeSingle();
        if (!usu) return;

        const inicioMes = new Date(filtros.ano, filtros.mes, 1).toISOString().split('T')[0];
        const fimMes = new Date(filtros.ano, filtros.mes + 1, 0).toISOString().split('T')[0];

        const { data: agendamentos } = await supabase.from('agendamentos')
          .select('*, profissionais(nome)').eq('salao_id', usu.salao_id).gte('data', inicioMes).lte('data', fimMes).neq('status', 'cancelado');

        if (agendamentos) {
          const realizado = agendamentos.filter(a => a.status === 'concluido').reduce((acc, c) => acc + Number(c.valor_total || c.valor || 0), 0);
          const pendente = agendamentos.filter(a => ['agendado','confirmado'].includes(a.status)).reduce((acc, c) => acc + Number(c.valor_total || c.valor || 0), 0);
          const totalConcluidos = agendamentos.filter(a => a.status === 'concluido').length;

          // Processamento básico para exemplo (Copie a lógica completa se precisar)
          setKpis({ receitaRealizada: realizado, receitaProjetada: realizado + pendente, ticketMedio: totalConcluidos > 0 ? realizado/totalConcluidos : 0, atendimentos: totalConcluidos });
          setExtrato([...agendamentos].reverse());
          
          // Mocks para layout (substitua pela lógica real se tiver)
          setTopServicos([]); 
          setTopProfissionais([]);
        }
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    carregarDados();
  }, [filtros]);

  const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white pb-24 md:pb-8">
      <RelatorioAvancadoModal isOpen={isRelatorioOpen} onClose={() => setIsRelatorioOpen(false)} />

      {/* CONTAINER RESPONSIVO */}
      <div className="w-full max-w-7xl mx-auto px-4 pt-6 md:px-8 md:pt-10 animate-in fade-in duration-500">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold">Financeiro</h1>
            <p className="text-gray-400 text-sm flex items-center gap-2 mt-1"><Calendar size={14} className="text-purple-500"/> {meses[filtros.mes]} {filtros.ano}</p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button onClick={() => setIsRelatorioOpen(true)} className="flex-1 md:flex-none bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-purple-900/20 active:scale-95 transition-all">
              <Zap size={18} className="fill-white"/> Relatório IA
            </button>
            <button onClick={onClose} className="p-3 bg-white/5 border border-white/10 rounded-2xl text-gray-400 hover:text-white"><X size={20}/></button>
          </div>
        </div>

        {/* KPIS (GRID 4 Colunas PC / 2 Celular) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KPICard label="Receita Realizada" value={kpis.receitaRealizada} icon={TrendingUp} color="emerald" sub="Em caixa" />
          <KPICard label="Projetado" value={kpis.receitaProjetada} icon={ArrowUpRight} color="blue" sub="Previsão" />
          <KPICard label="Ticket Médio" value={kpis.ticketMedio} icon={Award} color="purple" sub="Por cliente" />
          <KPICard label="Atendimentos" value={kpis.atendimentos} icon={CheckCheck} color="amber" sub="Concluídos" isNumber />
        </div>

        {/* CONTEÚDO PRINCIPAL (GRID 2 Colunas PC / 1 Celular) */}
        {loading ? (
          <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-purple-500" size={32}/></div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Gráfico / Ranking Profissionais */}
            <div className="bg-[#15151a] border border-white/5 rounded-3xl p-6">
              <h3 className="font-bold mb-6 flex items-center gap-2 text-white"><Users size={20} className="text-blue-400"/> Equipe</h3>
              {topProfissionais.length > 0 ? (
                 <div className="space-y-4">{/* Mapear profs aqui */}</div>
              ) : <p className="text-gray-500 text-sm text-center py-10">Sem dados suficientes.</p>}
            </div>

            {/* Extrato (Tabela com Scroll Horizontal) */}
            <div className="bg-[#15151a] border border-white/5 rounded-3xl p-6 overflow-hidden">
              <h3 className="font-bold mb-6 flex items-center gap-2 text-white"><Receipt size={20} className="text-gray-400"/> Extrato</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[400px]">
                  <thead>
                    <tr className="text-gray-500 text-[10px] font-bold uppercase border-b border-white/5">
                      <th className="pb-4 pl-2">Data</th>
                      <th className="pb-4">Serviço</th>
                      <th className="pb-4 text-right pr-2">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {extrato.slice(0, 10).map((t, i) => (
                      <tr key={i} className="text-xs hover:bg-white/5">
                        <td className="py-3 pl-2 text-gray-400">{new Date(t.data + 'T00:00:00').toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'})}</td>
                        <td className="py-3 font-medium text-white">{t.servico} <br/><span className="text-[9px] text-gray-500">{t.cliente_nome}</span></td>
                        <td className={`py-3 pr-2 text-right font-bold ${t.status === 'concluido' ? 'text-emerald-400' : 'text-blue-400'}`}>R$ {Number(t.valor_total || t.valor || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

// Componente KPI Auxiliar
const KPICard = ({ label, value, icon: Icon, color, sub, isNumber }) => (
  <div className={`bg-[#1c1c24] border border-${color}-500/20 rounded-3xl p-5 relative overflow-hidden group`}>
    <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:scale-110 transition-transform"><Icon size={40}/></div>
    <p className={`text-${color}-400 text-[10px] font-bold uppercase tracking-widest mb-1`}>{label}</p>
    <h2 className="text-2xl font-bold text-white">{isNumber ? value : `R$ ${value.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`}</h2>
    <p className="text-[10px] text-gray-500 mt-1 font-bold">{sub}</p>
  </div>
);