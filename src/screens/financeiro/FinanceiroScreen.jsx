import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { 
  TrendingUp, DollarSign, Calendar, BarChart3, Users, Award, 
  Filter, Download, Wallet, Receipt, Loader2, Target, 
  Edit3, X, Save
} from 'lucide-react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export const FinanceiroScreen = ({ onClose }) => {
  const [loading, setLoading] = useState(true);
  
  // --- ESTADOS DE FILTRO ---
  const [modalFiltroOpen, setModalFiltroOpen] = useState(false);
  const [listaProfissionais, setListaProfissionais] = useState([]); // Lista para o dropdown
  const [filtros, setFiltros] = useState({
    mes: new Date().getMonth(),
    ano: new Date().getFullYear(),
    profissional: 'todos' // Mudou de servico para profissional
  });

  // --- ESTADOS DE DADOS ---
  const [kpis, setKpis] = useState({ 
    saldo: 0, receita: 0, ticket: 0, meta: 15000, progressoMeta: 0,
    comparativoReceita: 0 
  });
  const [graficoDados, setGraficoDados] = useState([]);
  const [topServicos, setTopServicos] = useState([]);
  const [topProfissionais, setTopProfissionais] = useState([]);
  const [extrato, setExtrato] = useState([]);

  const [modalMetaOpen, setModalMetaOpen] = useState(false);
  const [novaMeta, setNovaMeta] = useState('');

  // --- 1. CARREGAR LISTA DE PROFISSIONAIS (Para o Filtro) ---
  useEffect(() => {
    const fetchProfs = async () => {
      const { data } = await supabase.from('profissionais').select('id, nome').order('nome');
      setListaProfissionais(data || []);
    };
    fetchProfs();
  }, []);

  // --- 2. CARREGAMENTO DOS DADOS FINANCEIROS ---
  useEffect(() => {
    const carregarDados = async () => {
      setLoading(true);
      
      const inicioMes = new Date(filtros.ano, filtros.mes, 1).toISOString();
      const fimMes = new Date(filtros.ano, filtros.mes + 1, 0).toISOString(); 
      const inicioMesAnterior = new Date(filtros.ano, filtros.mes - 1, 1).toISOString();
      const fimMesAnterior = new Date(filtros.ano, filtros.mes, 0).toISOString();

      // Query Principal
      let query = supabase
        .from('agendamentos')
        .select('*, profissionais(nome)') // Traz o nome do profissional
        .gte('data', inicioMes)
        .lte('data', fimMes)
        .neq('status', 'cancelado')
        .order('data', { ascending: true });

      // Aplica filtro de profissional se selecionado
      if (filtros.profissional !== 'todos') {
        query = query.eq('profissional_id', filtros.profissional);
      }

      const { data: dadosAtual } = await query;

      // Query Mês Anterior (Para comparativo)
      let queryAnterior = supabase
        .from('agendamentos')
        .select('valor')
        .gte('data', inicioMesAnterior)
        .lte('data', fimMesAnterior)
        .neq('status', 'cancelado');
        
      if (filtros.profissional !== 'todos') {
        queryAnterior = queryAnterior.eq('profissional_id', filtros.profissional);
      }
      const { data: dadosAnterior } = await queryAnterior;

      if (dadosAtual) {
        const totalAtual = dadosAtual.reduce((acc, curr) => acc + (curr.valor || 0), 0);
        const totalAnterior = dadosAnterior?.reduce((acc, curr) => acc + (curr.valor || 0), 0) || 0;
        const count = dadosAtual.length;
        
        let crescimento = 0;
        if (totalAnterior > 0) crescimento = ((totalAtual - totalAnterior) / totalAnterior) * 100;
        else if (totalAtual > 0) crescimento = 100;

        // Montar Gráfico
        const diasMap = {};
        const diasNoMes = new Date(filtros.ano, filtros.mes + 1, 0).getDate();
        for (let i = 1; i <= diasNoMes; i++) diasMap[i] = 0;
        
        dadosAtual.forEach(item => {
          const diaPart = item.data ? parseInt(item.data.split('-')[2]) : null;
          if (diaPart && diasMap[diaPart] !== undefined) diasMap[diaPart] += item.valor;
        });
        const dadosGraficoFormatados = Object.keys(diasMap).map(d => ({ dia: d, valor: diasMap[d] }));

        // Top Serviços
        const servicosMap = {};
        dadosAtual.forEach(a => {
          if(a.servico) {
              if (!servicosMap[a.servico]) servicosMap[a.servico] = { qtd: 0, total: 0 };
              servicosMap[a.servico].qtd += 1;
              servicosMap[a.servico].total += a.valor;
          }
        });
        const rankingServicos = Object.entries(servicosMap)
          .map(([k, v]) => ({ nome: k, ...v }))
          .sort((a, b) => b.total - a.total)
          .slice(0, 4);

        // Top Profissionais (Ranking interno do filtro, ou geral)
        const profMap = {};
        dadosAtual.forEach(a => {
          const nomeProf = a.profissionais?.nome || 'Equipe'; 
          if (!profMap[nomeProf]) profMap[nomeProf] = { qtd: 0, total: 0 };
          profMap[nomeProf].qtd += 1;
          profMap[nomeProf].total += a.valor;
        });
        const rankingProf = Object.entries(profMap)
          .map(([k, v]) => ({ nome: k, ...v }))
          .sort((a, b) => b.total - a.total)
          .slice(0, 3);

        setKpis(prev => ({
          ...prev,
          saldo: totalAtual,
          receita: totalAtual,
          ticket: count > 0 ? totalAtual / count : 0,
          progressoMeta: Math.min((totalAtual / prev.meta) * 100, 100),
          comparativoReceita: crescimento.toFixed(1)
        }));
        setGraficoDados(dadosGraficoFormatados);
        setTopServicos(rankingServicos);
        setTopProfissionais(rankingProf);
        setExtrato(dadosAtual.reverse());
      }
      setLoading(false);
    };
    carregarDados();
  }, [filtros]);

  const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  
  const salvarMeta = () => {
    const valor = parseFloat(novaMeta);
    if (!valor) return;
    setKpis(prev => ({ ...prev, meta: valor, progressoMeta: Math.min((prev.receita / valor) * 100, 100) }));
    setModalMetaOpen(false);
  };

  const exportarCSV = () => {
    if (extrato.length === 0) {
      alert("Sem dados para exportar.");
      return;
    }
    const headers = ["Data", "Horario", "Servico", "Cliente", "Profissional", "Valor (R$)"];
    const rows = extrato.map(row => {
      const dataFormatada = new Date(row.data).toLocaleDateString('pt-BR');
      const horario = row.horario ? row.horario.slice(0,5) : '--:--';
      const cliente = row.cliente_nome || 'Consumidor';
      const profissional = row.profissionais?.nome || 'Equipe';
      const valor = row.valor ? row.valor.toString().replace('.', ',') : '0,00';
      return `${dataFormatada};${horario};${row.servico};${cliente};${profissional};${valor}`;
    });
    const csvContent = "\uFEFF" + [headers.join(';'), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `financeiro_${meses[filtros.mes]}_${filtros.ano}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper para mostrar o nome do profissional selecionado no Header
  const getNomeFiltroAtual = () => {
    if (filtros.profissional === 'todos') return null;
    const prof = listaProfissionais.find(p => p.id == filtros.profissional);
    return prof ? prof.nome : 'Profissional';
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6 font-sans pb-24 animate-in fade-in">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 px-2">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Financeiro</h1>
          <p className="text-gray-400 text-sm flex items-center gap-2">
            <Calendar size={14}/> {meses[filtros.mes]} de {filtros.ano} 
            {/* Tag do Filtro Ativo */}
            {filtros.profissional !== 'todos' && (
              <span className="bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded text-xs uppercase font-bold flex items-center gap-1">
                <Users size={10}/> {getNomeFiltroAtual()}
              </span>
            )}
          </p>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          {/* Botão Fechar Mobile */}
          <button onClick={onClose} className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-gray-400 hover:text-white md:hidden"><X size={20}/></button>

          <button onClick={() => setModalFiltroOpen(true)} className="flex-1 md:flex-none py-3 px-5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-2 font-bold text-sm">
            <Filter size={18} /> Filtrar
          </button>
          <button onClick={exportarCSV} className="flex-1 md:flex-none py-3 px-5 bg-[#5B2EFF] text-white rounded-xl hover:bg-[#4a25d9] transition-all flex items-center justify-center gap-2 font-bold text-sm shadow-lg shadow-purple-900/20">
            <Download size={18} /> Exportar
          </button>
          
          {/* Botão Fechar Desktop */}
          <button onClick={onClose} className="hidden md:flex p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-gray-400 hover:text-white"><X size={20}/></button>
        </div>
      </div>

      {/* KPIS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl -mr-5 -mt-5"></div>
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-emerald-500/20 rounded-xl text-emerald-400"><DollarSign size={24}/></div>
            <span className={`text-xs font-bold px-2 py-1 rounded-lg ${parseFloat(kpis.comparativoReceita) >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
              {parseFloat(kpis.comparativoReceita) > 0 ? '+' : ''}{kpis.comparativoReceita}%
            </span>
          </div>
          <p className="text-gray-400 text-xs font-bold uppercase mb-1">Receita Total</p>
          <h2 className="text-3xl font-bold text-white">R$ {kpis.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl -mr-5 -mt-5"></div>
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400"><Receipt size={24}/></div>
          </div>
          <p className="text-gray-400 text-xs font-bold uppercase mb-1">Ticket Médio</p>
          <h2 className="text-3xl font-bold text-white">R$ {kpis.ticket.toFixed(0)}</h2>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 relative overflow-hidden group md:col-span-2">
          <button onClick={() => { setNovaMeta(kpis.meta); setModalMetaOpen(true); }} className="absolute top-4 right-4 p-2 bg-white/5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100 z-10" title="Editar Meta"><Edit3 size={16}/></button>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-fuchsia-500/20 rounded-xl text-fuchsia-400"><Target size={24}/></div>
            <div>
              <p className="text-gray-400 text-xs font-bold uppercase">Meta do Mês</p>
              <p className="text-white font-bold">R$ {kpis.meta.toLocaleString()}</p>
            </div>
          </div>
          <div className="relative pt-2">
            <div className="flex justify-between text-xs mb-2 text-gray-400 font-bold">
              <span>Progresso</span>
              <span>{kpis.progressoMeta.toFixed(0)}%</span>
            </div>
            <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-fuchsia-600 to-purple-600 rounded-full transition-all duration-1000" style={{ width: `${kpis.progressoMeta}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {loading ? <div className="flex items-center justify-center h-64 text-purple-400"><Loader2 className="animate-spin" size={32}/></div> : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2"><BarChart3 className="text-purple-400" size={20}/> Evolução Diária</h3>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={graficoDados}>
                    <defs>
                      <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#5B2EFF" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#5B2EFF" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                    <XAxis dataKey="dia" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                    <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px', color: '#fff' }} formatter={(value) => [`R$ ${value}`, 'Faturamento']} />
                    <Area type="monotone" dataKey="valor" stroke="#5B2EFF" strokeWidth={3} fillOpacity={1} fill="url(#colorValor)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6"><Award className="text-amber-400" size={20}/> Top Serviços</h3>
              <div className="space-y-5">
                {topServicos.map((s, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-bold text-white">{s.nome}</span>
                      <span className="text-emerald-400 font-bold">R$ {s.total}</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full" style={{ width: `${(s.total / (topServicos[0]?.total || 1)) * 100}%` }}></div>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1 text-right">{s.qtd} realizados</p>
                  </div>
                ))}
                {topServicos.length === 0 && <p className="text-gray-500 text-sm text-center">Sem dados no período.</p>}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6"><Users className="text-blue-400" size={20}/> Performance Equipe</h3>
              <div className="space-y-4">
                {topProfissionais.map((p, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center font-bold text-white">{p.nome.charAt(0)}</div>
                      <div><p className="font-bold text-white text-sm">{p.nome}</p><p className="text-xs text-gray-400">{p.qtd} atendimentos</p></div>
                    </div>
                    <span className="font-bold text-blue-400">R$ {p.total}</span>
                  </div>
                ))}
                {topProfissionais.length === 0 && <p className="text-gray-500 text-sm text-center">Sem dados de equipe.</p>}
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6"><Wallet className="text-gray-400" size={20}/> Últimas Transações</h3>
              <div className="space-y-3">
                {extrato.slice(0, 10).map((t, i) => (
                  <div key={i} className="flex justify-between items-center border-b border-white/5 pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-500/10 rounded-full text-emerald-500"><TrendingUp size={16}/></div>
                      <div><p className="text-sm font-bold text-white">{t.servico}</p><p className="text-[10px] text-gray-400">{new Date(t.data).toLocaleDateString('pt-BR')} • {t.cliente_nome}</p></div>
                    </div>
                    <span className="font-bold text-white text-sm">+ R$ {t.valor}</span>
                  </div>
                ))}
                {extrato.length === 0 && <p className="text-gray-500 text-sm text-center">Nenhuma transação.</p>}
              </div>
            </div>
          </div>
        </>
      )}

      {/* MODAL FILTRO */}
      {modalFiltroOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in" onClick={() => setModalFiltroOpen(false)}>
          <div className="bg-[#18181b] border border-white/10 p-6 rounded-3xl w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2"><Filter className="text-purple-400"/> Filtrar Dados</h2>
              <button onClick={() => setModalFiltroOpen(false)}><X className="text-gray-400 hover:text-white"/></button>
            </div>
            <div className="space-y-4">
              <div><label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Mês</label><div className="grid grid-cols-3 gap-2">{meses.map((m, i) => (<button key={i} onClick={() => setFiltros(prev => ({ ...prev, mes: i }))} className={`text-xs py-2 rounded-lg font-bold transition-all ${filtros.mes === i ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>{m.slice(0,3)}</button>))}</div></div>
              <div><label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Ano</label><div className="flex gap-2">{[2025, 2026].map(ano => (<button key={ano} onClick={() => setFiltros(prev => ({ ...prev, ano }))} className={`flex-1 py-2 rounded-lg font-bold transition-all ${filtros.ano === ano ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>{ano}</button>))}</div></div>
              
              {/* FILTRO PROFISSIONAL */}
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Profissional</label>
                <select className="w-full p-3 bg-black/40 border border-white/10 rounded-xl text-white outline-none focus:border-purple-500" value={filtros.profissional} onChange={(e) => setFiltros(prev => ({ ...prev, profissional: e.target.value }))}>
                  <option value="todos">Todos os profissionais</option>
                  {listaProfissionais.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </select>
              </div>

              <button onClick={() => setModalFiltroOpen(false)} className="w-full bg-white text-black font-bold py-3.5 rounded-xl mt-4 hover:bg-gray-200 transition-all">Aplicar Filtros</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL META */}
      {modalMetaOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in" onClick={() => setModalMetaOpen(false)}>
          <div className="bg-[#18181b] border border-white/10 p-6 rounded-3xl w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold text-white flex items-center gap-2"><Target className="text-fuchsia-400"/> Definir Meta</h2><button onClick={() => setModalMetaOpen(false)}><X className="text-gray-400 hover:text-white"/></button></div>
            <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Valor da Meta (R$)</label><input type="number" className="w-full p-4 bg-black/40 border border-white/10 rounded-xl text-white text-2xl font-bold outline-none focus:border-fuchsia-500 mb-6" value={novaMeta} onChange={e => setNovaMeta(e.target.value)} autoFocus /><button onClick={salvarMeta} className="w-full bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all"><Save size={20}/> Salvar</button>
          </div>
        </div>
      )}
    </div>
  );
};