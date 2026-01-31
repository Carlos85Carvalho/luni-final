import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { 
  TrendingUp, DollarSign, Calendar, BarChart3, Users, Award, 
  Filter, Download, Wallet, Receipt, Loader2, Target, 
  Edit3, X, Save, ArrowUpRight, CheckCheck, Percent, Zap
} from 'lucide-react';

// === CORREÇÃO AQUI: Importando da MESMA PASTA (./) ===
import { RelatorioAvancadoModal } from './RelatorioAvancadoModal'; 

export const FinanceiroScreen = ({ onClose }) => {
  const [loading, setLoading] = useState(true);
  const [isRelatorioOpen, setIsRelatorioOpen] = useState(false);
  const [listaProfissionais, setListaProfissionais] = useState([]);
  const [filtros, setFiltros] = useState({
    mes: new Date().getMonth(),
    ano: new Date().getFullYear(),
    profissional: 'todos'
  });

  const [kpis, setKpis] = useState({ 
    receitaRealizada: 0, 
    receitaProjetada: 0, 
    ticketMedio: 0, 
    atendimentos: 0,
    meta: 15000
  });

  const [topServicos, setTopServicos] = useState([]);
  const [topProfissionais, setTopProfissionais] = useState([]);
  const [extrato, setExtrato] = useState([]);

  useEffect(() => {
    const fetchProfs = async () => {
      const { data } = await supabase.from('profissionais').select('id, nome').order('nome');
      setListaProfissionais(data || []);
    };
    fetchProfs();
  }, []);

  useEffect(() => {
    const carregarDados = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const { data: usu } = await supabase.from('usuarios').select('salao_id').eq('id', user.id).maybeSingle();
        
        if (!usu) return;

        const inicioMes = new Date(filtros.ano, filtros.mes, 1).toISOString().split('T')[0];
        const fimMes = new Date(filtros.ano, filtros.mes + 1, 0).toISOString().split('T')[0];

        let query = supabase
          .from('agendamentos')
          .select('*, profissionais(nome)')
          .eq('salao_id', usu.salao_id)
          .gte('data', inicioMes)
          .lte('data', fimMes)
          .neq('status', 'cancelado');

        if (filtros.profissional !== 'todos') {
          query = query.eq('profissional_id', filtros.profissional);
        }

        const { data: agendamentos, error } = await query;
        if (error) throw error;

        if (agendamentos) {
          const realizado = agendamentos
            .filter(a => a.status === 'concluido')
            .reduce((acc, curr) => acc + Number(curr.valor_total || curr.valor || 0), 0);

          const pendente = agendamentos
            .filter(a => a.status === 'agendado' || a.status === 'confirmado')
            .reduce((acc, curr) => acc + Number(curr.valor_total || curr.valor || 0), 0);

          const totalConcluidos = agendamentos.filter(a => a.status === 'concluido').length;

          // Ranking Serviços
          const servicosMap = {};
          agendamentos.forEach(a => {
            if (a.servico) {
              servicosMap[a.servico] = (servicosMap[a.servico] || 0) + Number(a.valor_total || a.valor || 0);
            }
          });
          const rankingServicos = Object.entries(servicosMap)
            .map(([nome, total]) => ({ nome, total }))
            .sort((a, b) => b.total - a.total).slice(0, 5);

          // Ranking Profissionais
          const profMap = {};
          agendamentos.filter(a => a.status === 'concluido').forEach(a => {
            const nome = a.profissionais?.nome || 'Equipe';
            if (!profMap[nome]) profMap[nome] = { total: 0, qtd: 0 };
            profMap[nome].total += Number(a.valor_total || a.valor || 0);
            profMap[nome].qtd += 1;
          });

          setKpis(prev => ({
            ...prev,
            receitaRealizada: realizado,
            receitaProjetada: realizado + pendente,
            atendimentos: totalConcluidos,
            ticketMedio: totalConcluidos > 0 ? realizado / totalConcluidos : 0
          }));

          setTopServicos(rankingServicos);
          setTopProfissionais(Object.entries(profMap).map(([nome, v]) => ({ nome, ...v })).sort((a,b) => b.total - a.total));
          setExtrato([...agendamentos].reverse());
        }
      } catch (e) {
        console.error("Erro Financeiro:", e);
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, [filtros]);

  const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6 pb-32 font-sans">
      
      {/* Modal Importado Corretamente */}
      <RelatorioAvancadoModal 
        isOpen={isRelatorioOpen} 
        onClose={() => setIsRelatorioOpen(false)} 
      />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Financeiro</h1>
          <p className="text-gray-400 text-sm flex items-center gap-2 mt-1">
            <Calendar size={14} className="text-purple-500"/> {meses[filtros.mes]} {filtros.ano}
          </p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button 
            onClick={() => setIsRelatorioOpen(true)}
            className="flex-1 md:flex-none bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-purple-900/20 active:scale-95 transition-all"
          >
            <Zap size={18} className="fill-white"/> Relatório IA
          </button>
          <button onClick={onClose} className="p-3 bg-white/5 border border-white/10 rounded-2xl text-gray-400 hover:text-white">
            <X size={20}/>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#1c1c24] border border-white/10 p-6 rounded-3xl relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:scale-110 transition-transform"><TrendingUp size={60}/></div>
          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">Receita Realizada</p>
          <h2 className="text-2xl font-bold text-emerald-400">R$ {kpis.receitaRealizada.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</h2>
          <p className="text-[10px] text-gray-500 mt-2 font-bold flex items-center gap-1"><CheckCheck size={12}/> Dinheiro em Caixa</p>
        </div>

        <div className="bg-[#1c1c24] border border-white/10 p-6 rounded-3xl relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:scale-110 transition-transform"><ArrowUpRight size={60}/></div>
          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">Receita Projetada</p>
          <h2 className="text-2xl font-bold text-blue-400">R$ {kpis.receitaProjetada.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</h2>
          <p className="text-[10px] text-gray-500 mt-2 font-bold flex items-center gap-1">Previsão de faturamento mensal</p>
        </div>

        <div className="bg-[#1c1c24] border border-white/10 p-6 rounded-3xl">
          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">Ticket Médio</p>
          <h2 className="text-2xl font-bold text-white">R$ {kpis.ticketMedio.toFixed(2)}</h2>
          <p className="text-[10px] text-purple-400 mt-2 font-bold uppercase">Média por atendimento</p>
        </div>

        <div className="bg-[#1c1c24] border border-white/10 p-6 rounded-3xl">
          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">Atendimentos</p>
          <h2 className="text-2xl font-bold text-white">{kpis.atendimentos}</h2>
          <p className="text-[10px] text-gray-500 mt-2 font-bold uppercase">Ciclos Concluídos</p>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-purple-500" size={32}/></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#15151a] border border-white/5 rounded-[32px] p-6">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2"><Users size={20} className="text-blue-400"/> Desempenho da Equipe</h3>
            <div className="space-y-4">
              {topProfissionais.map((p, i) => (
                <div key={i} className="bg-white/5 p-4 rounded-2xl flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center font-bold text-blue-400 border border-blue-500/30">{p.nome.charAt(0)}</div>
                    <div><p className="font-bold text-sm">{p.nome}</p><p className="text-[10px] text-gray-500 font-bold uppercase">{p.qtd} atendimentos</p></div>
                  </div>
                  <p className="font-bold text-emerald-400 text-sm">R$ {p.total.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#15151a] border border-white/5 rounded-[32px] p-6">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2"><Award size={20} className="text-amber-400"/> Serviços mais Lucrativos</h3>
            <div className="space-y-4">
              {topServicos.map((s, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span className="text-gray-300">{s.nome}</span>
                    <span className="text-emerald-400">R$ {s.total.toFixed(2)}</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-purple-600 to-blue-500" style={{width: `${(s.total / (topServicos[0]?.total || 1)) * 100}%`}}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 bg-[#15151a] border border-white/5 rounded-[32px] p-6">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2"><Receipt size={20} className="text-gray-400"/> Movimentação Detalhada</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-gray-500 text-[10px] font-bold uppercase border-b border-white/5">
                    <th className="pb-4">Data</th>
                    <th className="pb-4">Cliente / Serviço</th>
                    <th className="pb-4">Profissional</th>
                    <th className="pb-4 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {extrato.slice(0, 15).map((t, i) => (
                    <tr key={i} className="text-xs hover:bg-white/5 transition-colors">
                      <td className="py-4 text-gray-500">{new Date(t.data + 'T00:00:00').toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'})}</td>
                      <td className="py-4 font-medium">{t.cliente_nome} <br/> <span className="text-[10px] text-gray-500">{t.servico}</span></td>
                      <td className="py-4 text-gray-500">{t.profissionais?.nome}</td>
                      <td className={`py-4 text-right font-bold ${t.status === 'concluido' ? 'text-emerald-400' : 'text-blue-400'}`}>R$ {Number(t.valor_total || t.valor || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};