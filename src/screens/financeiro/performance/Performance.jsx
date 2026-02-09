import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../../services/supabase';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, CartesianGrid 
} from 'recharts';
import { 
  Trophy, Users, Scissors, TrendingUp, Loader2, Filter, User 
} from 'lucide-react';

// ==================== CONSTANTES ====================
const COLORS = ['#5B2EFF', '#00C49F', '#FFBB28', '#FF8042', '#FF4560', '#8884d8'];

const PERIODO_OPTIONS = ['hoje', 'semana', 'mes', 'ano'];

const EMPTY_STATE_MESSAGES = {
  profissionais: 'Sem vendas neste período',
  servicos: 'Nenhum serviço registrado',
  tabela: 'Nenhum dado encontrado para o período selecionado.'
};

// ==================== UTILITÁRIOS ====================
const getHojeLocal = () => {
  return new Date().toLocaleDateString('en-CA');
};

const formatDataBr = (dateStr) => {
  if (!dateStr) return '';
  const [ano, mes, dia] = dateStr.split('-');
  return `${dia}/${mes}/${ano}`;
};

const calcularDataInicio = (tipo) => {
  const d = new Date();
  const hojeStr = d.toLocaleDateString('en-CA');

  switch (tipo) {
    case 'hoje':
      return hojeStr;
    case 'semana':
      d.setDate(d.getDate() - 7);
      return d.toLocaleDateString('en-CA');
    case 'mes':
      return new Date(d.getFullYear(), d.getMonth(), 1).toLocaleDateString('en-CA');
    case 'ano':
      return new Date(d.getFullYear(), 0, 1).toLocaleDateString('en-CA');
    default:
      return hojeStr;
  }
};

// ==================== SUBCOMPONENTES ====================

// Loading Spinner
const LoadingSpinner = () => (
  <div className="flex h-96 items-center justify-center">
    <Loader2 className="animate-spin text-purple-500" size={40} />
  </div>
);

// Empty State
const EmptyState = ({ icon: Icon, message }) => (
  <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-50">
    <Icon size={40} className="mb-2" />
    <p>{message}</p>
  </div>
);

// Filtro de Período
const FiltroPeriodo = ({ filtroPeriodo, onChangePeriodo }) => (
  <div className="flex bg-[#0a0a0f] p-1 rounded-xl border border-white/10 overflow-x-auto">
    {PERIODO_OPTIONS.map((periodo) => (
      <button 
        key={periodo}
        onClick={() => onChangePeriodo(periodo)} 
        className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all capitalize whitespace-nowrap ${
          filtroPeriodo === periodo 
            ? 'bg-[#5B2EFF] text-white shadow-lg' 
            : 'text-gray-400 hover:text-white'
        }`}
      >
        {periodo === 'mes' ? 'Mês' : periodo}
      </button>
    ))}
  </div>
);

// Seletor de Datas Personalizado
const SeletorDatas = ({ dataInicio, dataFim, onChangeInicio, onChangeFim }) => (
  <div className="flex items-center gap-2 bg-[#0a0a0f] p-1 rounded-xl border border-white/10">
    <input 
      type="date" 
      value={dataInicio}
      onChange={(e) => onChangeInicio(e.target.value)}
      className="bg-transparent text-white text-xs px-2 py-1 outline-none"
    />
    <span className="text-gray-500 text-xs">até</span>
    <input 
      type="date" 
      value={dataFim}
      onChange={(e) => onChangeFim(e.target.value)}
      className="bg-transparent text-white text-xs px-2 py-1 outline-none"
    />
  </div>
);

// Seletor de Profissional
const SeletorProfissional = ({ filtroProfissional, listaProfissionais, onChange }) => (
  <div className="flex items-center gap-2 bg-[#0a0a0f] px-4 py-2 rounded-xl border border-white/10 w-full md:w-auto hover:border-[#5B2EFF]/50 transition-colors">
    <User size={16} className="text-[#5B2EFF]"/>
    <select 
      value={filtroProfissional}
      onChange={(e) => onChange(e.target.value)}
      className="bg-transparent text-white text-sm outline-none w-full md:w-48 cursor-pointer"
    >
      <option value="todos" className="bg-[#1c1c24]">Todos os Profissionais</option>
      {listaProfissionais.map(p => (
        <option key={p.id} value={p.id} className="bg-[#1c1c24]">{p.nome}</option>
      ))}
    </select>
  </div>
);

// Gráfico de Faturamento
const GraficoFaturamento = ({ dados, filtroProfissional }) => (
  <div className="bg-[#15151a] p-6 rounded-3xl border border-white/5 shadow-lg flex flex-col">
    <div className="flex justify-between mb-6">
      <h3 className="font-bold text-white flex items-center gap-2">
        <Trophy size={18} className="text-yellow-500"/> Faturamento 
        <span className="text-xs font-normal text-gray-500 bg-white/5 px-2 py-0.5 rounded ml-2 border border-white/5">
          {filtroProfissional === 'todos' ? 'Ranking Geral' : 'Individual'}
        </span>
      </h3>
    </div>
    
    <div className="h-80 w-full flex-1">
      <ResponsiveContainer width="100%" height="100%">
        {dados.length > 0 ? (
          <BarChart layout="vertical" data={dados} margin={{ left: 0, right: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
            <XAxis type="number" hide />
            <YAxis 
              dataKey="nome" 
              type="category" 
              width={100} 
              tick={{ fill: '#fff', fontSize: 12, fontWeight: 500 }} 
              axisLine={false} 
              tickLine={false} 
            />
            <Tooltip 
              cursor={{ fill: 'rgba(255,255,255,0.05)' }} 
              contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '8px' }}
              formatter={(value) => [`R$ ${value.toFixed(2)}`, 'Faturamento']}
            />
            <Bar dataKey="valor" radius={[0, 4, 4, 0]} barSize={24}>
              {dados.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        ) : (
          <EmptyState icon={Filter} message={EMPTY_STATE_MESSAGES.profissionais} />
        )}
      </ResponsiveContainer>
    </div>
  </div>
);

// Gráfico de Serviços
const GraficoServicos = ({ dados }) => (
  <div className="bg-[#15151a] p-6 rounded-3xl border border-white/5 shadow-lg flex flex-col">
    <div className="flex justify-between mb-6">
      <h3 className="font-bold text-white flex items-center gap-2">
        <Scissors size={18} className="text-pink-500"/> Serviços Realizados
      </h3>
    </div>

    <div className="h-80 w-full flex-1">
      <ResponsiveContainer width="100%" height="100%">
        {dados.length > 0 ? (
          <PieChart>
            <Pie
              data={dados}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={5}
              dataKey="value"
              nameKey="name"
            >
              {dados.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '8px' }} />
            <Legend 
              layout="vertical" 
              verticalAlign="middle" 
              align="right"
              wrapperStyle={{ fontSize: '12px', color: '#ccc' }}
            />
          </PieChart>
        ) : (
          <EmptyState icon={Scissors} message={EMPTY_STATE_MESSAGES.servicos} />
        )}
      </ResponsiveContainer>
    </div>
  </div>
);

// Tabela de Detalhamento
const TabelaDetalhamento = ({ dados }) => {
  const totalGeral = useMemo(() => 
    dados.reduce((acc, p) => acc + p.valor, 0), 
    [dados]
  );

  return (
    <div className="bg-[#15151a] rounded-3xl border border-white/5 overflow-hidden shadow-lg">
      <div className="p-6 border-b border-white/5 bg-[#1c1c24]/50">
        <h3 className="font-bold text-white flex items-center gap-2">
          <Users size={18} className="text-blue-400"/> Detalhamento da Equipe
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-400">
          <thead className="bg-[#0a0a0f] text-white uppercase font-bold text-xs">
            <tr>
              <th className="p-4">Profissional</th>
              <th className="p-4 text-right">Faturamento Total</th>
              <th className="p-4 text-right">Participação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {dados.length > 0 ? dados.map((prof, i) => {
              const percentual = totalGeral > 0 ? (prof.valor / totalGeral) * 100 : 0;
              
              return (
                <tr key={i} className="hover:bg-white/5 transition-colors">
                  <td className="p-4 font-medium text-white flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#1c1c24] flex items-center justify-center font-bold text-xs text-[#5B2EFF] border border-white/10">
                      {prof.nome ? prof.nome.charAt(0) : '?'}
                    </div>
                    {prof.nome}
                  </td>
                  <td className="p-4 text-right text-emerald-400 font-bold">
                    R$ {prof.valor.toFixed(2)}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-xs">{percentual.toFixed(1)}%</span>
                      <div className="w-16 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full bg-[#5B2EFF]" style={{ width: `${percentual}%` }}></div>
                      </div>
                    </div>
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan="3" className="p-8 text-center text-gray-500">
                  {EMPTY_STATE_MESSAGES.tabela}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ==================== COMPONENTE PRINCIPAL ====================
export const Performance = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dados, setDados] = useState({ profissionais: [], servicos: [] });
  const [listaProfissionais, setListaProfissionais] = useState([]);
  
  const [dataInicio, setDataInicio] = useState(getHojeLocal());
  const [dataFim, setDataFim] = useState(getHojeLocal());
  const [filtroPeriodo, setFiltroPeriodo] = useState('hoje'); 
  const [filtroProfissional, setFiltroProfissional] = useState('todos');

  // Carregar lista de profissionais ao montar
  useEffect(() => {
    const fetchProfissionais = async () => {
      try {
        const { data, error } = await supabase
          .from('profissionais')
          .select('id, nome')
          .order('nome');
        
        if (error) throw error;
        if (data) setListaProfissionais(data);
      } catch (err) {
        console.error('Erro ao carregar profissionais:', err);
        setError('Erro ao carregar lista de profissionais');
      }
    };
    fetchProfissionais();
  }, []);

  // Aplicar filtro rápido de período
  const aplicarFiltroRapido = useCallback((tipo) => {
    const hojeStr = getHojeLocal();
    const inicioStr = calcularDataInicio(tipo);

    setFiltroPeriodo(tipo);
    setDataInicio(inicioStr);
    setDataFim(hojeStr);
  }, []);

  // Processar dados de agendamentos
  const processarDados = useCallback((agendamentos, mapProf) => {
    // Ranking Profissionais
    const porProf = {};
    agendamentos.forEach(ag => {
      const nome = mapProf[ag.profissional_id] || 'Não atribuído';
      const val = Number(ag.valor_total || ag.valor || 0);
      porProf[nome] = (porProf[nome] || 0) + val;
    });

    const rankingProf = Object.entries(porProf)
      .map(([nome, valor]) => ({ nome, valor }))
      .sort((a, b) => b.valor - a.valor);

    // Mix de Serviços
    const porServ = {};
    agendamentos.forEach(ag => {
      const serv = ag.servico || 'Outros';
      porServ[serv] = (porServ[serv] || 0) + 1;
    });

    const rankingServ = Object.entries(porServ)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    return { profissionais: rankingProf, servicos: rankingServ };
  }, []);

  // Buscar dados de performance
  const fetchPerformance = useCallback(async () => {
    if (listaProfissionais.length === 0 && filtroProfissional !== 'todos') {
      return; // Aguarda carregar profissionais antes de buscar dados filtrados
    }

    setLoading(true);
    setError(null);

    try {
      const inicioAjustado = `${dataInicio}T00:00:00`;
      const fimAjustado = `${dataFim}T23:59:59`;

      let query = supabase
        .from('agendamentos')
        .select('valor_total, valor, servico, profissional_id, status, data')
        .gte('data', inicioAjustado)
        .lte('data', fimAjustado)
        .neq('status', 'cancelado');

      if (filtroProfissional !== 'todos') {
        query = query.eq('profissional_id', filtroProfissional);
      }

      const { data: agendamentos, error } = await query;

      if (error) throw error;

      // Criar mapa de profissionais
      const mapProf = {};
      listaProfissionais.forEach(p => mapProf[p.id] = p.nome);

      // Processar dados
      const dadosProcessados = processarDados(agendamentos || [], mapProf);
      setDados(dadosProcessados);

    } catch (err) {
      console.error("Erro ao buscar performance:", err);
      setError('Erro ao carregar dados de performance');
    } finally {
      setLoading(false);
    }
  }, [dataInicio, dataFim, filtroProfissional, listaProfissionais, processarDados]);

  // Dispara busca quando filtros mudam
  useEffect(() => {
    fetchPerformance();
  }, [fetchPerformance]);

  // Handlers de mudança de filtros
  const handleChangeDataInicio = useCallback((valor) => {
    setFiltroPeriodo('custom');
    setDataInicio(valor);
  }, []);

  const handleChangeDataFim = useCallback((valor) => {
    setFiltroPeriodo('custom');
    setDataFim(valor);
  }, []);

  // Loading inicial
  if (loading && listaProfissionais.length === 0) {
    return <LoadingSpinner />;
  }

  // Estado de erro
  if (error) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-2">{error}</p>
          <button 
            onClick={fetchPerformance}
            className="px-4 py-2 bg-[#5B2EFF] text-white rounded-lg hover:bg-[#4a24cc] transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* HEADER DE CONTROLE */}
      <div className="bg-[#15151a] p-5 rounded-2xl border border-white/5 flex flex-col gap-4 shadow-xl">
        
        {/* Linha Superior: Título e Filtro de Profissional */}
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <TrendingUp className="text-[#5B2EFF]" size={24}/> Performance
            </h2>
            <p className="text-sm text-gray-400">
              Análise de {formatDataBr(dataInicio)} até {formatDataBr(dataFim)}
            </p>
          </div>

          <SeletorProfissional 
            filtroProfissional={filtroProfissional}
            listaProfissionais={listaProfissionais}
            onChange={setFiltroProfissional}
          />
        </div>

        <div className="h-[1px] bg-white/5 w-full"></div>

        {/* Linha Inferior: Controles de Data */}
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <FiltroPeriodo 
            filtroPeriodo={filtroPeriodo}
            onChangePeriodo={aplicarFiltroRapido}
          />

          <SeletorDatas 
            dataInicio={dataInicio}
            dataFim={dataFim}
            onChangeInicio={handleChangeDataInicio}
            onChangeFim={handleChangeDataFim}
          />
        </div>
      </div>

      {/* GRÁFICOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GraficoFaturamento 
          dados={dados.profissionais}
          filtroProfissional={filtroProfissional}
        />
        <GraficoServicos dados={dados.servicos} />
      </div>

      {/* TABELA DE DETALHES */}
      <TabelaDetalhamento dados={dados.profissionais} />

    </div>
  );
};