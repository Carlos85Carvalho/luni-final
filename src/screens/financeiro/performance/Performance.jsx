import React, { useState, useEffect } from 'react';
import { supabase } from '../../../services/supabase';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, CartesianGrid 
} from 'recharts';
import { 
  Trophy, Users, Scissors, TrendingUp, Loader2, Calendar, Filter 
} from 'lucide-react';

// ==================== CONFIGURAÇÕES VISUAIS ====================
const COLORS = ['#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#6366F1'];
const THEME = {
  bg: "bg-[#0f0f12]", 
  card: "bg-[#18181b]", 
  border: "border-white/5",
  inputBg: "bg-[#0f0f12]",
  text: "text-gray-100",
  primary: "text-purple-500"
};

const formatCurrency = (value) => 
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const getPrimeiroDiaMes = () => {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
};

const getHoje = () => new Date().toISOString().split('T')[0];

export const Performance = () => {
  const [loading, setLoading] = useState(true);
  const [dataInicio, setDataInicio] = useState(getPrimeiroDiaMes());
  const [dataFim, setDataFim] = useState(getHoje());
  const [periodoSelecionado, setPeriodoSelecionado] = useState('mes');
  const [profissionalId, setProfissionalId] = useState('todos');
  const [profissionais, setProfissionais] = useState([]);
  const [dadosRanking, setDadosRanking] = useState([]);
  const [dadosServicos, setDadosServicos] = useState([]);
  const [resumo, setResumo] = useState({ faturamento: 0, atendimentos: 0 });

  useEffect(() => {
    const fetchProfs = async () => {
      const { data } = await supabase.from('profissionais').select('id, nome');
      if (data) setProfissionais(data);
    };
    fetchProfs();
  }, []);

  const aplicarFiltroRapido = (tipo) => {
    const hoje = new Date();
    const d = new Date();
    let inicio = '';
    let fim = hoje.toISOString().split('T')[0];

    switch (tipo) {
      case 'hoje': inicio = fim; break;
      case 'semana': d.setDate(d.getDate() - 7); inicio = d.toISOString().split('T')[0]; break;
      case 'mes': inicio = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0]; break;
      case 'ano': inicio = new Date(d.getFullYear(), 0, 1).toISOString().split('T')[0]; break;
      default: return;
    }
    setDataInicio(inicio);
    setDataFim(fim);
    setPeriodoSelecionado(tipo);
  };

  useEffect(() => {
    const fetchDados = async () => {
      setLoading(true);
      try {
        const inicioQuery = `${dataInicio}T00:00:00`;
        const fimQuery = `${dataFim}T23:59:59`;
        let query = supabase
          .from('agendamentos')
          .select(`id, data, valor, valor_total, servico, profissional_id, status, profissionais (nome)`)
          .gte('data', inicioQuery)
          .lte('data', fimQuery)
          .neq('status', 'cancelado'); 

        if (profissionalId !== 'todos') query = query.eq('profissional_id', profissionalId);

        const { data: agendamentos, error } = await query;
        if (error) throw error;
        processarDados(agendamentos || []);
      } catch (error) {
        console.error("Erro ao carregar performance:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDados();
  }, [dataInicio, dataFim, profissionalId]);

  const processarDados = (dados) => {
    const getValor = (item) => Number(item.valor_total) || Number(item.valor) || 0;
    const totalFat = dados.reduce((acc, curr) => acc + getValor(curr), 0);
    setResumo({ faturamento: totalFat, atendimentos: dados.length });

    const mapRanking = {};
    dados.forEach(item => {
      const nome = item.profissionais?.nome || 'Outros'; 
      const valor = getValor(item);
      if (!mapRanking[nome]) mapRanking[nome] = 0;
      mapRanking[nome] += valor;
    });

    const rankingArray = Object.entries(mapRanking)
      .map(([nome, valor]) => ({ nome, valor }))
      .sort((a, b) => b.valor - a.valor);
    setDadosRanking(rankingArray);

    const mapServicos = {};
    dados.forEach(item => {
      const servico = item.servico || 'Outros';
      if (!mapServicos[servico]) mapServicos[servico] = 0;
      mapServicos[servico] += 1;
    });

    const servicosArray = Object.entries(mapServicos)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
    setDadosServicos(servicosArray);
  };

  return (
    <div className={`min-h-full ${THEME.bg} p-4 md:p-8 space-y-6 animate-in fade-in duration-500`}>
      {/* HEADER */}
      <div className={`${THEME.card} p-6 rounded-3xl border ${THEME.border} flex flex-col gap-6 shadow-xl`}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <TrendingUp className="text-purple-500" /> Performance
            </h2>
            <p className="text-gray-400 text-sm mt-1">Visão geral financeira e operacional</p>
          </div>
          <div className="relative w-full md:w-auto">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500" />
            <select
              value={profissionalId}
              onChange={(e) => setProfissionalId(e.target.value)}
              className={`pl-10 pr-4 py-2.5 ${THEME.inputBg} border border-white/10 rounded-xl text-white text-sm outline-none focus:border-purple-500 w-full md:min-w-[200px]`}
            >
              <option value="todos">Todos os Profissionais</option>
              {profissionais.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
          </div>
        </div>
        <div className="h-[1px] bg-white/5 w-full"></div>
        <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
          <div className={`bg-[#0f0f12] p-1 rounded-xl border border-white/10 flex w-full lg:w-auto overflow-x-auto`}>
            {['hoje', 'semana', 'mes', 'ano'].map((p) => (
              <button
                key={p}
                onClick={() => aplicarFiltroRapido(p)}
                className={`flex-1 lg:flex-none px-4 py-2 text-xs font-bold rounded-lg transition-all capitalize whitespace-nowrap ${
                  periodoSelecionado === p ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
                }`}
              >
                {p === 'mes' ? 'Mês' : p}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 bg-[#0f0f12] p-1.5 rounded-xl border border-white/10 w-full lg:w-auto">
            <div className="relative flex-1">
              <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
              <input type="date" value={dataInicio} onChange={(e) => { setDataInicio(e.target.value); setPeriodoSelecionado('custom'); }}
                className="bg-transparent text-white text-xs pl-8 pr-2 py-1.5 outline-none w-full" />
            </div>
            <span className="text-gray-600 text-xs">até</span>
            <div className="relative flex-1">
              <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
              <input type="date" value={dataFim} onChange={(e) => { setDataFim(e.target.value); setPeriodoSelecionado('custom'); }}
                className="bg-transparent text-white text-xs pl-8 pr-2 py-1.5 outline-none w-full" />
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className={`${THEME.card} p-6 rounded-3xl border ${THEME.border} shadow-lg flex flex-col h-[400px]`}>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-500" /> Ranking Financeiro
                  </h3>
                  <p className="text-xs text-gray-500">Total: <span className="text-emerald-400 font-bold">{formatCurrency(resumo.faturamento)}</span></p>
                </div>
              </div>
              <div className="flex-1 w-full min-h-0">
                {dadosRanking.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    {/* AQUI FORAM FEITOS OS AJUSTES DE MARGEM E LARGURA */}
                    <BarChart 
                      layout="vertical" 
                      data={dadosRanking} 
                      margin={{ left: 0, right: 10, top: 10, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
                      <XAxis type="number" hide />
                      <YAxis 
                        dataKey="nome" 
                        type="category" 
                        width={110} 
                        tick={{ fill: '#ffffff', fontSize: 11, fontWeight: 'bold' }} 
                        axisLine={false} 
                        tickLine={false} 
                      />
                      <Tooltip 
                        cursor={{ fill: 'transparent' }} // Remove o highlight feio ao clicar/passar o mouse
                        contentStyle={{ 
                          backgroundColor: '#18181b', 
                          border: '1px solid #333', 
                          borderRadius: '12px'
                        }}
                        labelStyle={{ color: '#ffffff', fontWeight: 'bold' }} 
                        itemStyle={{ color: '#ffffff' }} 
                        formatter={(value) => [formatCurrency(value), 'Faturamento']}
                      />
                      <Bar 
                        dataKey="valor" 
                        radius={[0, 4, 4, 0]} 
                        barSize={20} 
                        background={{ fill: '#27272a', radius: [0, 4, 4, 0] }}
                      >
                        {dadosRanking.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-500"><Filter className="w-10 h-10 mb-2 opacity-20" /><p>Sem dados</p></div>
                )}
              </div>
            </div>

            <div className={`${THEME.card} p-6 rounded-3xl border ${THEME.border} shadow-lg flex flex-col h-[400px]`}>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Scissors className="w-5 h-5 text-pink-500" /> Serviços Realizados
                  </h3>
                  <p className="text-xs text-gray-500">{resumo.atendimentos} atendimentos</p>
                </div>
              </div>
              <div className="flex-1 w-full min-h-0">
                {dadosServicos.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={dadosServicos} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                        {dadosServicos.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#18181b', border: '1px solid #333', borderRadius: '12px' }}
                        itemStyle={{ color: '#ffffff' }}
                      />
                      <Legend verticalAlign="bottom" align="center" layout="horizontal" wrapperStyle={{ fontSize: '10px', color: '#9ca3af', paddingTop: '20px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-500"><Scissors className="w-10 h-10 mb-2 opacity-20" /><p>Nenhum serviço</p></div>
                )}
              </div>
            </div>
          </div>

          {/* TABELA */}
          <div className={`${THEME.card} rounded-3xl border ${THEME.border} overflow-hidden shadow-lg`}>
            <div className="p-6 border-b border-white/5 bg-white/5">
              <h3 className="font-bold text-white flex items-center gap-2"><Users className="w-5 h-5 text-blue-400"/> Detalhamento da Equipe</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-400">
                <thead className="bg-[#0f0f12] text-xs uppercase font-bold text-gray-500">
                  <tr><th className="p-4">Profissional</th><th className="p-4 text-right">Faturamento</th><th className="p-4 text-right">Participação</th></tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {dadosRanking.map((prof, i) => {
                    const percentual = resumo.faturamento > 0 ? (prof.valor / resumo.faturamento) * 100 : 0;
                    return (
                      <tr key={i} className="hover:bg-white/5 transition-colors">
                        <td className="p-4 font-medium text-white flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-bold text-xs text-purple-400">{prof.nome.charAt(0)}</div>
                          {prof.nome}
                        </td>
                        <td className="p-4 text-right text-emerald-400 font-bold">{formatCurrency(prof.valor)}</td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-xs w-8">{percentual.toFixed(0)}%</span>
                            <div className="w-20 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                              <div className="h-full bg-purple-500 rounded-full" style={{ width: `${percentual}%` }}></div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};