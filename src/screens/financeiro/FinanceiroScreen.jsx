import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../../services/supabase';
import { 
  TrendingUp, TrendingDown, DollarSign, Receipt, 
  Loader2, ArrowUpRight, ArrowDownRight, Target, 
  Clock, Download, Share2, RefreshCw, 
  AlertTriangle, Calendar, ChevronLeft, FileText,
  Eye, CheckCircle, AlertCircle, Zap,
  ChevronRight, ChevronDown, Plus, MoreVertical,
  CalendarDays, WalletCards, Edit2, Trash2, X,
  TrendingUp as TrendingUpIcon, Filter, Search,
  BarChart3, PieChart as PieChartIcon, Activity,
  Check, Save, Home
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Bar, PieChart as RechartsPie, Pie, Cell,
  ComposedChart, Line
} from 'recharts';

// ==================== COMPONENTES REUTILIZÁVEIS ====================

const KPICard = ({ 
  titulo, 
  valor, 
  icone: Icon, 
  cor = 'purple',
  trend = null,
  trendValue = 0,
  loading = false,
  subTitulo,
  format = 'currency',
  onClick
}) => {
  const colorClasses = {
    purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
    green: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20' },
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
    orange: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
    red: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
  };

  const style = colorClasses[cor] || colorClasses.purple;
    
  const formattedValue = useMemo(() => {
    if (loading) return '---';
    if (format === 'currency') {
      return `R$ ${Number(valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else if (format === 'percent') {
      return `${Number(valor || 0).toFixed(1)}%`;
    } else if (format === 'number') {
      return Number(valor || 0).toLocaleString('pt-BR');
    }
    return valor || '0';
  }, [valor, format, loading]);

  return (
    <div 
      onClick={onClick}
      className={`relative bg-gray-800/50 backdrop-blur-sm p-5 sm:p-6 rounded-2xl border ${style.border} hover:bg-gray-800/70 transition-all duration-300 hover:scale-[1.02] ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-semibold text-gray-400 truncate pr-2">{titulo}</span>
        <div className={`p-2.5 rounded-xl ${style.bg} shrink-0`}>
          <Icon className={`w-5 h-5 ${style.text}`} />
        </div>
      </div>
        
      {loading ? (
        <div className="space-y-2">
          <div className="h-8 bg-gray-700/50 rounded animate-pulse"></div>
          <div className="h-4 bg-gray-700/30 rounded animate-pulse w-2/3"></div>
        </div>
      ) : (
        <>
          <div className="text-xl sm:text-2xl font-bold text-white mb-2 truncate">{formattedValue}</div>
            
          <div className="flex flex-wrap items-center justify-between gap-2">
            {subTitulo && (
              <span className="text-xs sm:text-sm text-gray-400 truncate max-w-[60%]">{subTitulo}</span>
            )}
             
            {trend && trendValue > 0 && (
              <div className={`flex items-center gap-1.5 px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${
                trend === 'up' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
              }`}>
                {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                <span>{trend === 'up' ? '+' : '-'}{trendValue}%</span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

const FiltroPeriodo = ({ periodo, setPeriodo, dataInicio, setDataInicio, dataFim, setDataFim, onAplicar }) => {
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  const periodos = [
    { id: 'hoje', label: 'Hoje' },
    { id: 'semana', label: 'Esta Semana' },
    { id: 'mes', label: 'Este Mês' },
    { id: 'ano', label: 'Este Ano' },
    { id: 'personalizado', label: 'Personalizado' }
  ];

  const handlePeriodoClick = (periodoId) => {
    setPeriodo(periodoId);
    setMostrarFiltros(false);
    onAplicar();
  };

  return (
    <div className="relative w-full sm:w-auto">
      <button
        onClick={() => setMostrarFiltros(!mostrarFiltros)}
        className="w-full sm:w-auto px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl hover:bg-gray-800/70 flex items-center justify-between sm:justify-start gap-2 transition-all"
      >
        <div className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-gray-400" />
          <span className="text-sm font-medium text-white">
            {periodos.find(p => p.id === periodo)?.label || 'Período'}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${mostrarFiltros ? 'rotate-180' : ''}`} />
      </button>

      {mostrarFiltros && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20 sm:bg-transparent" onClick={() => setMostrarFiltros(false)}></div>
          <div className="absolute right-0 left-0 sm:left-auto mt-2 w-full sm:w-80 bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl z-50 overflow-hidden">
            <div className="p-4">
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-white mb-3">Período Rápido</h4>
                <div className="grid grid-cols-2 gap-2">
                  {periodos.slice(0, -1).map(p => (
                    <button
                      key={p.id}
                      onClick={() => handlePeriodoClick(p.id)}
                      className={`px-3 py-2 text-sm rounded-lg transition-all ${
                        periodo === p.id 
                          ? 'bg-purple-500 text-white' 
                          : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {periodo === 'personalizado' && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-white mb-3">Datas Personalizadas</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">De</label>
                      <input
                        type="date"
                        value={dataInicio}
                        onChange={(e) => setDataInicio(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-sm text-white focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Até</label>
                      <input
                        type="date"
                        value={dataFim}
                        onChange={(e) => setDataFim(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-sm text-white focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={() => {
                  onAplicar();
                  setMostrarFiltros(false);
                }}
                className="w-full py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all"
              >
                Aplicar Filtros
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ==================== 1. VISÃO GERAL ====================

const VisaoGeralTab = ({ 
  resumoFinanceiro, 
  evolucaoReceitas, 
  distribuicaoDespesas,
  loading 
}) => {
  return (
    <div className="space-y-6">
      {/* KPIs Principais - Responsivo: 1 col mobile, 2 tablet, 4 desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          titulo="Receita Bruta"
          valor={resumoFinanceiro.receita_bruta || 0}
          icone={DollarSign}
          cor="green"
          trend="up"
          trendValue={12.5}
          loading={loading}
          subTitulo="Faturamento total"
          format="currency"
        />
         
        <KPICard
          titulo="Despesas"
          valor={(resumoFinanceiro.despesas_pagas || 0) + (resumoFinanceiro.despesas_pendentes || 0)}
          icone={Receipt}
          cor="orange"
          trend="down"
          trendValue={3.2}
          loading={loading}
          subTitulo={`${resumoFinanceiro.despesas_pendentes > 0 ? 'R$ ' + (resumoFinanceiro.despesas_pendentes || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) + ' pendentes' : 'Todas pagas'}`}
          format="currency"
        />
         
        <KPICard
          titulo="Lucro Líquido"
          valor={resumoFinanceiro.lucro_liquido || 0}
          icone={TrendingUp}
          cor={(resumoFinanceiro.lucro_liquido || 0) >= 0 ? "blue" : "red"}
          trend={(resumoFinanceiro.lucro_liquido || 0) >= 0 ? "up" : "down"}
          trendValue={8.7}
          loading={loading}
          format="currency"
        />
         
        <KPICard
          titulo="Margem de Lucro"
          valor={resumoFinanceiro.margem_lucro || 0}
          icone={Activity}
          cor={(resumoFinanceiro.margem_lucro || 0) >= 20 ? "green" : (resumoFinanceiro.margem_lucro || 0) >= 10 ? "blue" : "red"}
          loading={loading}
          subTitulo="Rentabilidade"
          format="percent"
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de Evolução */}
        <div className="lg:col-span-2 bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-400" />
                Evolução Financeira
              </h3>
              <p className="text-sm text-gray-400 mt-1">Receita vs Despesas (últimos meses)</p>
            </div>
            <button className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors self-end sm:self-auto">
              <Download className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          <div className="h-64 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={evolucaoReceitas} margin={{ left: -20, right: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="mes" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 10 }}
                  tickFormatter={(value) => `R$${(value/1000).toFixed(0)}k`}
                />
                <Tooltip 
                  formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, '']}
                  contentStyle={{ 
                    backgroundColor: '#1f2937',
                    borderRadius: '12px', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
                    padding: '12px'
                  }}
                  labelStyle={{ color: '#fff' }}
                />
                <Bar 
                  dataKey="receita" 
                  name="Receita" 
                  fill="#10b981" 
                  radius={[4, 4, 0, 0]}
                  barSize={24}
                />
                <Area 
                  type="monotone" 
                  dataKey="despesas" 
                  name="Despesas" 
                  stroke="#ef4444" 
                  fill="#ef4444" 
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="lucro" 
                  name="Lucro" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2, fill: '#3b82f6' }}
                  activeDot={{ r: 6 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribuição de Despesas */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <PieChartIcon className="w-5 h-5 text-purple-400" />
                Distribuição
              </h3>
              <p className="text-sm text-gray-400 mt-1">Despesas por categoria</p>
            </div>
          </div>
          <div className="h-64 sm:h-80">
            {distribuicaoDespesas.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPie>
                  <Pie
                    data={distribuicaoDespesas}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="total"
                    labelLine={false}
                  >
                    {distribuicaoDespesas.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={['#8b5cf6', '#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#f472b6'][index % 6]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, '']}
                    contentStyle={{ 
                      backgroundColor: '#1f2937',
                      borderRadius: '12px', 
                      border: '1px solid rgba(255,255,255,0.1)',
                      padding: '12px'
                    }}
                    labelStyle={{ color: '#fff' }}
                  />
                </RechartsPie>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-gray-500 text-sm">Nenhuma despesa registrada</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== 2. DESPESAS ====================

const DespesasTab = ({ onRefresh }) => {
  const [despesas, setDespesas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('todas');
  const [categoriaFiltro, setCategoriaFiltro] = useState('todas');
  const [busca, setBusca] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [despesaEditando, setDespesaEditando] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [salaoId, setSalaoId] = useState(null); // <--- NOVO ESTADO

  const categorias = ['Aluguel', 'Energia', 'Água', 'Produtos', 'Salários', 'Marketing', 'Manutenção', 'Outros'];

  const [formData, setFormData] = useState({
    descricao: '',
    categoria: '',
    valor: '',
    data_vencimento: new Date().toISOString().split('T')[0],
    pago: false,
    data_pagamento: null
  });

  // Buscar salao_id ao carregar o componente
  useEffect(() => {
    const fetchSalao = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('usuarios').select('salao_id').eq('id', user.id).single();
        if (data) setSalaoId(data.salao_id);
      }
    };
    fetchSalao();
  }, []);

  const carregarDespesas = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('despesas')
        .select('*')
        .order('data_vencimento', { ascending: false });

      if (error) throw error;
      setDespesas(data || []);
    } catch (error) {
      console.error('Erro ao carregar despesas:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarDespesas();
  }, [carregarDespesas]);

  // INJEÇÃO DE ESTILO "NUCLEAR" PARA OCULTAR RODAPÉ
  useEffect(() => {
    if (modalAberto) {
      const style = document.createElement('style');
      style.id = 'hide-footer-style';
      style.innerHTML = `
        #rodape-principal, .fixed.bottom-0, nav.fixed.bottom-0, footer { 
          display: none !important; 
          opacity: 0 !important;
          pointer-events: none !important;
          z-index: -1 !important;
        }
        body { overflow: hidden !important; }
      `;
      document.head.appendChild(style);
      return () => {
        const existingStyle = document.getElementById('hide-footer-style');
        if (existingStyle) document.head.removeChild(existingStyle);
        document.body.style.overflow = '';
      };
    }
  }, [modalAberto]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!salaoId) {
      alert("Erro: Salão não identificado. Tente recarregar a página.");
      return;
    }

    setSalvando(true);

    try {
      const despesaData = {
        salao_id: salaoId, // <--- AQUI ESTAVA FALTANDO!
        ...formData,
        valor: parseFloat(formData.valor),
        data_pagamento: formData.pago ? (formData.data_pagamento || new Date().toISOString()) : null
      };

      if (despesaEditando) {
        const { error } = await supabase
          .from('despesas')
          .update(despesaData)
          .eq('id', despesaEditando.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('despesas')
          .insert([despesaData]);
        
        if (error) throw error;
      }

      setModalAberto(false);
      setDespesaEditando(null);
      resetForm();
      carregarDespesas();
      onRefresh();
    } catch (error) {
      console.error('Erro ao salvar despesa:', error);
      alert('Erro ao salvar despesa: ' + (error.message || 'Tente novamente.'));
    } finally {
      setSalvando(false);
    }
  };

  const marcarComoPaga = async (despesa) => {
    try {
      const { error } = await supabase
        .from('despesas')
        .update({ 
          pago: true, 
          data_pagamento: new Date().toISOString()
        })
        .eq('id', despesa.id);

      if (error) throw error;
      carregarDespesas();
      onRefresh();
    } catch (error) {
      console.error('Erro ao marcar como paga:', error);
    }
  };

  const excluirDespesa = async (id) => {
    if (!confirm('Deseja realmente excluir esta despesa?')) return;

    try {
      const { error } = await supabase
        .from('despesas')
        .delete()
        .eq('id', id);

      if (error) throw error;
      carregarDespesas();
      onRefresh();
    } catch (error) {
      console.error('Erro ao excluir despesa:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      descricao: '',
      categoria: '',
      valor: '',
      data_vencimento: new Date().toISOString().split('T')[0],
      pago: false,
      data_pagamento: null
    });
  };

  const editarDespesa = (despesa) => {
    setDespesaEditando(despesa);
    setFormData({
      descricao: despesa.descricao,
      categoria: despesa.categoria,
      valor: despesa.valor.toString(),
      data_vencimento: despesa.data_vencimento,
      pago: despesa.pago,
      data_pagamento: despesa.data_pagamento
    });
    setModalAberto(true);
  };

  const despesasFiltradas = useMemo(() => {
    return despesas.filter(d => {
      const matchFiltro = filtro === 'todas' || 
        (filtro === 'pagas' && d.pago) || 
        (filtro === 'pendentes' && !d.pago);
      
      const matchCategoria = categoriaFiltro === 'todas' || d.categoria === categoriaFiltro;
      
      const matchBusca = busca === '' || 
        d.descricao?.toLowerCase().includes(busca.toLowerCase()) ||
        d.categoria?.toLowerCase().includes(busca.toLowerCase());

      return matchFiltro && matchCategoria && matchBusca;
    });
  }, [despesas, filtro, categoriaFiltro, busca]);

  const totalDespesas = despesasFiltradas.reduce((acc, d) => acc + (d.valor || 0), 0);
  const totalPagas = despesasFiltradas.filter(d => d.pago).reduce((acc, d) => acc + (d.valor || 0), 0);
  const totalPendentes = despesasFiltradas.filter(d => !d.pago).reduce((acc, d) => acc + (d.valor || 0), 0);

  return (
    <div className="space-y-6">
      {/* Resumo - Stack vertical no mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gray-800/50 backdrop-blur-sm p-4 rounded-xl border border-gray-700">
          <div className="flex items-center justify-between">
            <div className="truncate pr-2">
              <p className="text-sm text-gray-400">Total</p>
              <p className="text-xl sm:text-2xl font-bold text-white mt-1 truncate">
                R$ {totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <Receipt className="w-8 h-8 text-purple-400 shrink-0" />
          </div>
        </div>
        <div className="bg-gray-800/50 backdrop-blur-sm p-4 rounded-xl border border-gray-700">
          <div className="flex items-center justify-between">
            <div className="truncate pr-2">
              <p className="text-sm text-gray-400">Pagas</p>
              <p className="text-xl sm:text-2xl font-bold text-green-400 mt-1 truncate">
                R$ {totalPagas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400 shrink-0" />
          </div>
        </div>
        <div className="bg-gray-800/50 backdrop-blur-sm p-4 rounded-xl border border-gray-700">
          <div className="flex items-center justify-between">
            <div className="truncate pr-2">
              <p className="text-sm text-gray-400">Pendentes</p>
              <p className="text-xl sm:text-2xl font-bold text-orange-400 mt-1 truncate">
                R$ {totalPendentes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <Clock className="w-8 h-8 text-orange-400 shrink-0" />
          </div>
        </div>
      </div>

      {/* Filtros e Ações - Responsivo */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-wrap gap-2 w-full lg:w-auto">
            {['todas', 'pagas', 'pendentes'].map(f => (
              <button
                key={f}
                onClick={() => setFiltro(f)}
                className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all text-center ${
                  filtro === f 
                    ? 'bg-purple-500 text-white' 
                    : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar despesa..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none text-sm"
              />
            </div>

            <select
              value={categoriaFiltro}
              onChange={(e) => setCategoriaFiltro(e.target.value)}
              className="w-full sm:w-auto px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none text-sm"
            >
              <option value="todas">Todas Categorias</option>
              {categorias.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <button
              onClick={() => {
                setDespesaEditando(null);
                resetForm();
                setModalAberto(true);
              }}
              className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 flex items-center justify-center gap-2 font-medium transition-all"
            >
              <Plus className="w-4 h-4" />
              <span className="whitespace-nowrap">Nova Despesa</span>
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Despesas */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
          </div>
        ) : despesasFiltradas.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Receipt className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Nenhuma despesa encontrada</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-gray-700/50 border-b border-gray-600">
                <tr>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-400 uppercase">Descrição</th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-400 uppercase">Categoria</th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-400 uppercase">Valor</th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-400 uppercase">Vencimento</th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-400 uppercase">Status</th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-400 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {despesasFiltradas.map((despesa) => (
                  <tr key={despesa.id} className="hover:bg-gray-700/30 transition-colors">
                    <td className="py-4 px-6">
                      <p className="font-medium text-white">{despesa.descricao}</p>
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs font-medium whitespace-nowrap">
                        {despesa.categoria}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <p className="font-bold text-white whitespace-nowrap">
                        R$ {(despesa.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-sm text-gray-300 whitespace-nowrap">
                        {new Date(despesa.data_vencimento).toLocaleDateString('pt-BR')}
                      </p>
                    </td>
                    <td className="py-4 px-6">
                      {despesa.pago ? (
                        <span className="flex items-center gap-2 text-green-400 text-sm">
                          <CheckCircle className="w-4 h-4" />
                          Paga
                        </span>
                      ) : (
                        <span className="flex items-center gap-2 text-orange-400 text-sm">
                          <Clock className="w-4 h-4" />
                          Pendente
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        {!despesa.pago && (
                          <button 
                            onClick={() => marcarComoPaga(despesa)}
                            className="p-2 text-green-400 hover:bg-green-500/10 rounded-lg transition-colors"
                            title="Marcar como paga"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        <button 
                          onClick={() => editarDespesa(despesa)}
                          className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => excluirDespesa(despesa.id)}
                          className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Criar/Editar Despesa - AGORA COM PORTAL */}
      {modalAberto && createPortal(
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div 
            className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-md max-h-[90dvh] flex flex-col shadow-2xl"
          >
            {/* Header Fixo */}
            <div className="p-6 border-b border-gray-700 flex items-center justify-between shrink-0">
              <h3 className="text-xl font-bold text-white">
                {despesaEditando ? 'Editar Despesa' : 'Nova Despesa'}
              </h3>
              <button
                onClick={() => {
                  setModalAberto(false);
                  setDespesaEditando(null);
                  resetForm();
                }}
                className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Conteúdo com Scroll - ALTURA CONTROLADA COM min-h-0 */}
            <div className="flex-1 overflow-y-auto min-h-0">
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Descrição</label>
                  <input
                    type="text"
                    required
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                    placeholder="Ex: Conta de luz"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Categoria</label>
                  <select
                    required
                    value={formData.categoria}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                  >
                    <option value="">Selecione...</option>
                    {categorias.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Valor (R$)</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    value={formData.valor}
                    onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                    placeholder="0,00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Data de Vencimento</label>
                  <input
                    type="date"
                    required
                    value={formData.data_vencimento}
                    onChange={(e) => setFormData({ ...formData, data_vencimento: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-3 p-4 bg-gray-700/30 rounded-lg">
                  <input
                    type="checkbox"
                    id="pago"
                    checked={formData.pago}
                    onChange={(e) => setFormData({ ...formData, pago: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-600 text-purple-500 focus:ring-purple-500 focus:ring-offset-gray-800"
                  />
                  <label htmlFor="pago" className="text-sm font-medium text-gray-300 cursor-pointer">
                    Marcar como paga
                  </label>
                </div>
              </div>
            </div>

            {/* Footer Fixo - SEMPRE VISÍVEL */}
            <div className="p-6 border-t border-gray-700 shrink-0 bg-gray-800 rounded-b-2xl">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setModalAberto(false);
                    setDespesaEditando(null);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-3 border-2 border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700/50 font-medium transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={salvando}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                >
                  {salvando ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      SALVAR
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

// ==================== 3. METAS ====================

const MetasTab = ({ resumoFinanceiro }) => {
  const [metas, setMetas] = useState([
    {
      id: 1,
      tipo: 'faturamento',
      titulo: 'Meta de Faturamento',
      valorMeta: 50000,
      valorAtual: resumoFinanceiro.receita_bruta || 0,
      periodo: 'Mensal',
      icon: DollarSign,
      color: 'green'
    },
    {
      id: 2,
      tipo: 'lucro',
      titulo: 'Meta de Lucro',
      valorMeta: 15000,
      valorAtual: resumoFinanceiro.lucro_liquido || 0,
      periodo: 'Mensal',
      icon: TrendingUp,
      color: 'blue'
    },
    {
      id: 3,
      tipo: 'despesas',
      titulo: 'Limite de Despesas',
      valorMeta: 35000,
      valorAtual: (resumoFinanceiro.despesas_pagas || 0) + (resumoFinanceiro.despesas_pendentes || 0),
      periodo: 'Mensal',
      icon: Receipt,
      color: 'orange',
      inverso: true
    }
  ]);

  const [modalAberto, setModalAberto] = useState(false);
  const [metaEditando, setMetaEditando] = useState(null);
  const [formMeta, setFormMeta] = useState({
    titulo: '',
    valorMeta: '',
    periodo: 'Mensal',
    tipo: 'faturamento'
  });

  // INJEÇÃO DE ESTILO "NUCLEAR" PARA OCULTAR RODAPÉ
  useEffect(() => {
    if (modalAberto) {
      const style = document.createElement('style');
      style.id = 'hide-footer-style-metas';
      style.innerHTML = `
        #rodape-principal, .fixed.bottom-0, nav.fixed.bottom-0, footer { 
          display: none !important; 
          opacity: 0 !important;
          pointer-events: none !important;
          z-index: -1 !important;
        }
        body { overflow: hidden !important; }
      `;
      document.head.appendChild(style);
      return () => {
        const existingStyle = document.getElementById('hide-footer-style-metas');
        if (existingStyle) document.head.removeChild(existingStyle);
        document.body.style.overflow = '';
      };
    }
  }, [modalAberto]);

  const abrirModalNovaMeta = () => {
    setMetaEditando(null);
    setFormMeta({
      titulo: '',
      valorMeta: '',
      periodo: 'Mensal',
      tipo: 'faturamento'
    });
    setModalAberto(true);
  };

  const abrirModalEditarMeta = (meta) => {
    setMetaEditando(meta);
    setFormMeta({
      titulo: meta.titulo,
      valorMeta: meta.valorMeta.toString(),
      periodo: meta.periodo,
      tipo: meta.tipo
    });
    setModalAberto(true);
  };

  const salvarMeta = () => {
    console.log('Salvando meta:', formMeta);
      
    if (!formMeta.titulo || !formMeta.valorMeta) {
      alert('Preencha todos os campos');
      return;
    }

    if (metaEditando) {
      // Editar meta existente
      setMetas(metas.map(m => 
        m.id === metaEditando.id 
          ? { ...m, ...formMeta, valorMeta: parseFloat(formMeta.valorMeta) }
          : m
      ));
      alert('Meta atualizada com sucesso!');
    } else {
      // Criar nova meta
      const novaMeta = {
        id: Date.now(),
        ...formMeta,
        valorMeta: parseFloat(formMeta.valorMeta),
        valorAtual: 0,
        icon: formMeta.tipo === 'faturamento' ? DollarSign : formMeta.tipo === 'lucro' ? TrendingUp : Receipt,
        color: formMeta.tipo === 'faturamento' ? 'green' : formMeta.tipo === 'lucro' ? 'blue' : 'orange',
        inverso: formMeta.tipo === 'despesas'
      };
      setMetas([...metas, novaMeta]);
      alert('Meta criada com sucesso!');
    }

    setModalAberto(false);
    setFormMeta({ titulo: '', valorMeta: '', periodo: 'Mensal', tipo: 'faturamento' });
  };

  const calcularProgresso = (meta) => {
    if (meta.inverso) {
      return meta.valorAtual <= meta.valorMeta 
        ? 100 
        : Math.max(0, 100 - ((meta.valorAtual - meta.valorMeta) / meta.valorMeta * 100));
    }
    return Math.min(100, (meta.valorAtual / meta.valorMeta) * 100);
  };

  const getStatusMeta = (progresso, inverso) => {
    if (inverso) {
      if (progresso >= 90) return { label: 'Dentro do Limite', color: 'text-green-400', bg: 'bg-green-500/20' };
      if (progresso >= 70) return { label: 'Atenção', color: 'text-yellow-400', bg: 'bg-yellow-500/20' };
      return { label: 'Acima do Limite', color: 'text-red-400', bg: 'bg-red-500/20' };
    }
    if (progresso >= 100) return { label: 'Atingida', color: 'text-green-400', bg: 'bg-green-500/20' };
    if (progresso >= 70) return { label: 'Em Progresso', color: 'text-blue-400', bg: 'bg-blue-500/20' };
    return { label: 'Em Risco', color: 'text-red-400', bg: 'bg-red-500/20' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">Metas Financeiras</h2>
          <p className="text-sm sm:text-base text-gray-400 mt-1">Acompanhe o progresso das suas metas</p>
        </div>
        <button
          onClick={abrirModalNovaMeta}
          className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 flex items-center justify-center gap-2 font-medium transition-all"
        >
          <Plus className="w-4 h-4" />
          Nova Meta
        </button>
      </div>

      {/* Cards de Metas - Responsivo: 1 col mobile, 2 tablet, 3 desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metas.map((meta) => {
          const Icon = meta.icon;
          const progresso = calcularProgresso(meta);
          const status = getStatusMeta(progresso, meta.inverso);

          return (
            <div key={meta.id} className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl bg-${meta.color}-500/10`}>
                  <Icon className={`w-6 h-6 text-${meta.color}-400`} />
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                  {status.label}
                </span>
              </div>

              <h3 className="text-lg font-bold text-white mb-2">{meta.titulo}</h3>
              <p className="text-sm text-gray-400 mb-4">{meta.periodo}</p>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Atual</span>
                  <span className="font-bold text-white">
                    R$ {meta.valorAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Meta</span>
                  <span className="font-bold text-white">
                    R$ {meta.valorMeta.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Barra de Progresso */}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400">Progresso</span>
                    <span className="text-xs font-bold text-white">{progresso.toFixed(1)}%</span>
                  </div>
                  <div className="h-3 bg-gray-700/50 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r transition-all duration-500 ${
                        meta.color === 'green' ? 'from-green-500 to-green-600' :
                        meta.color === 'blue' ? 'from-blue-500 to-blue-600' :
                        'from-orange-500 to-orange-600'
                      }`}
                      style={{ width: `${Math.min(100, progresso)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Faltante/Excedente */}
                <div className="pt-2 border-t border-gray-700">
                  <p className="text-xs text-gray-400">
                    {meta.inverso ? (
                      meta.valorAtual <= meta.valorMeta ? (
                        <>
                          <span className="text-green-400 font-medium">
                            R$ {(meta.valorMeta - meta.valorAtual).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                          {' '}disponível no orçamento
                        </>
                      ) : (
                        <>
                          <span className="text-red-400 font-medium">
                            R$ {(meta.valorAtual - meta.valorMeta).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                          {' '}acima do limite
                        </>
                      )
                    ) : (
                      progresso >= 100 ? (
                        <>
                          Meta atingida! 
                          <span className="text-green-400 font-medium">
                            {' '}+R$ {(meta.valorAtual - meta.valorMeta).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </>
                      ) : (
                        <>
                          Faltam{' '}
                          <span className="text-orange-400 font-medium">
                            R$ {(meta.valorMeta - meta.valorAtual).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </>
                      )
                    )}
                  </p>
                </div>
              </div>

              <button
                onClick={() => abrirModalEditarMeta(meta)}
                className="w-full mt-4 py-2 text-sm text-purple-400 hover:text-purple-300 font-medium transition-colors"
              >
                Editar Meta
              </button>
            </div>
          );
        })}
      </div>

      {/* Modal de Criar/Editar Meta - AGORA COM PORTAL */}
      {modalAberto && createPortal(
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-md max-h-[85dvh] flex flex-col shadow-2xl">
            {/* Header Fixo */}
            <div className="p-6 border-b border-gray-700 flex items-center justify-between shrink-0">
              <h3 className="text-xl font-bold text-white">
                {metaEditando ? 'Editar Meta' : 'Nova Meta'}
              </h3>
              <button
                onClick={() => setModalAberto(false)}
                className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Conteúdo com Scroll */}
            <div className="flex-1 overflow-y-auto min-h-0">
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Tipo de Meta</label>
                  <select
                    value={formMeta.tipo}
                    onChange={(e) => setFormMeta({ ...formMeta, tipo: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                  >
                    <option value="faturamento">Faturamento</option>
                    <option value="lucro">Lucro</option>
                    <option value="despesas">Limite de Despesas</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Título da Meta</label>
                  <input
                    type="text"
                    value={formMeta.titulo}
                    onChange={(e) => setFormMeta({ ...formMeta, titulo: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                    placeholder="Ex: Meta de Faturamento Mensal"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Valor da Meta (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formMeta.valorMeta}
                    onChange={(e) => setFormMeta({ ...formMeta, valorMeta: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                    placeholder="0,00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Período</label>
                  <select
                    value={formMeta.periodo}
                    onChange={(e) => setFormMeta({ ...formMeta, periodo: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                  >
                    <option value="Diário">Diário</option>
                    <option value="Semanal">Semanal</option>
                    <option value="Mensal">Mensal</option>
                    <option value="Trimestral">Trimestral</option>
                    <option value="Anual">Anual</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Footer Fixo */}
            <div className="p-6 border-t border-gray-700 shrink-0 bg-gray-800 rounded-b-2xl">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setModalAberto(false)}
                  className="flex-1 px-4 py-3 border-2 border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700/50 font-medium transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={salvarMeta}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 font-bold transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                >
                  <Save className="w-5 h-5" />
                  SALVAR
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Insights */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-purple-400" />
          Insights sobre Metas
        </h3>
        <div className="space-y-3">
          {metas.map((meta) => {
            const progresso = calcularProgresso(meta);
            if (meta.inverso) {
              if (progresso < 70) {
                return (
                  <div key={meta.id} className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <p className="text-sm text-red-300">
                      <AlertTriangle className="w-4 h-4 inline mr-2" />
                      <strong>{meta.titulo}:</strong> Você está {(((meta.valorAtual / meta.valorMeta) - 1) * 100).toFixed(1)}% 
                      acima do limite estabelecido. Considere revisar suas despesas.
                    </p>
                  </div>
                );
              }
            } else {
              if (progresso >= 100) {
                return (
                  <div key={meta.id} className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                    <p className="text-sm text-green-300">
                      <CheckCircle className="w-4 h-4 inline mr-2" />
                      <strong>{meta.titulo}:</strong> Parabéns! Você atingiu {progresso.toFixed(1)}% da meta. 
                      Continue com o ótimo trabalho!
                    </p>
                  </div>
                );
              } else if (progresso < 50) {
                return (
                  <div key={meta.id} className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                    <p className="text-sm text-orange-300">
                      <AlertCircle className="w-4 h-4 inline mr-2" />
                      <strong>{meta.titulo}:</strong> Você está em {progresso.toFixed(1)}% da meta. 
                      Faltam R$ {(meta.valorMeta - meta.valorAtual).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} para atingir o objetivo.
                    </p>
                  </div>
                );
              }
            }
            return null;
          }).filter(Boolean)}
        </div>
      </div>
    </div>
  );
};

// ==================== 4. RELATÓRIOS ====================

const RelatoriosTab = ({ resumoFinanceiro, evolucaoReceitas, distribuicaoDespesas }) => {
  const [tipoRelatorio, setTipoRelatorio] = useState('financeiro');
  const [formato, setFormato] = useState('pdf');
  const [periodo, setPeriodo] = useState('mes');
  const [gerando, setGerando] = useState(false);

  const gerarRelatorio = () => {
    setGerando(true);
      
    // Simular geração de relatório
    setTimeout(() => {
      const relatorioSelecionado = relatorios.find(r => r.id === tipoRelatorio);
       
      if (formato === 'csv') {
        gerarCSV();
      } else if (formato === 'excel') {
        gerarExcel();
      } else {
        gerarPDF();
      }
       
      setGerando(false);
    }, 1500);
  };

  const gerarCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Relatório Financeiro\n\n";
    csvContent += "Indicador,Valor\n";
    csvContent += `Receita Bruta,R$ ${(resumoFinanceiro.receita_bruta || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
    csvContent += `Despesas Totais,R$ ${((resumoFinanceiro.despesas_pagas || 0) + (resumoFinanceiro.despesas_pendentes || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
    csvContent += `Lucro Líquido,R$ ${(resumoFinanceiro.lucro_liquido || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
    csvContent += `Margem de Lucro,${(resumoFinanceiro.margem_lucro || 0).toFixed(1)}%\n\n`;
      
    csvContent += "Evolução Mensal\n";
    csvContent += "Mês,Receita,Despesas,Lucro\n";
    evolucaoReceitas.forEach(item => {
      csvContent += `${item.mes},${item.receita},${item.despesas},${item.lucro}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `relatorio_financeiro_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
      
    alert('Relatório CSV gerado com sucesso!');
  };

  const gerarExcel = () => {
    // Para Excel real, você precisaria de uma biblioteca como xlsx
    alert('Para gerar Excel real, instale: npm install xlsx\n\nPor enquanto, gerando CSV...');
    gerarCSV();
  };

  const gerarPDF = () => {
    // Para PDF real, você precisaria de uma biblioteca como jsPDF
    const content = `
RELATÓRIO FINANCEIRO
Data: ${new Date().toLocaleDateString('pt-BR')}
Período: ${periodo}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RESUMO FINANCEIRO

Receita Bruta:        R$ ${(resumoFinanceiro.receita_bruta || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
Despesas Totais:      R$ ${((resumoFinanceiro.despesas_pagas || 0) + (resumoFinanceiro.despesas_pendentes || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
Lucro Líquido:        R$ ${(resumoFinanceiro.lucro_liquido || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
Margem de Lucro:      ${(resumoFinanceiro.margem_lucro || 0).toFixed(1)}%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EVOLUÇÃO MENSAL

${evolucaoReceitas.map(item => 
  `${item.mes}: Receita R$ ${item.receita.toFixed(2)} | Despesas R$ ${item.despesas.toFixed(2)} | Lucro R$ ${item.lucro.toFixed(2)}`
).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DESPESAS POR CATEGORIA

${distribuicaoDespesas.map(item => 
  `${item.categoria}: R$ ${item.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Para PDF real com gráficos, instale: npm install jspdf jspdf-autotable
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio_financeiro_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
      
    alert('Relatório gerado com sucesso!\n\nNota: Para PDF real com formatação profissional, instale as bibliotecas:\n- npm install jspdf\n- npm install jspdf-autotable');
  };

  const relatorios = [
    {
      id: 'financeiro',
      titulo: 'Relatório Financeiro',
      descricao: 'Receitas, despesas e lucro detalhado',
      icon: DollarSign,
      color: 'text-green-400 bg-green-500/10'
    },
    {
      id: 'despesas',
      titulo: 'Análise de Despesas',
      descricao: 'Despesas por categoria e período',
      icon: Receipt,
      color: 'text-orange-400 bg-orange-500/10'
    },
    {
      id: 'desempenho',
      titulo: 'Desempenho',
      descricao: 'KPIs e indicadores de performance',
      icon: TrendingUp,
      color: 'text-purple-400 bg-purple-500/10'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Seletor de Relatório - Grid responsivo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {relatorios.map((relatorio) => {
          const Icon = relatorio.icon;
          return (
            <button
              key={relatorio.id}
              onClick={() => setTipoRelatorio(relatorio.id)}
              className={`p-6 rounded-2xl border text-left transition-all ${
                tipoRelatorio === relatorio.id
                  ? 'border-purple-500 bg-purple-500/10'
                  : 'border-gray-700 bg-gray-800/50 hover:bg-gray-800/70'
              }`}
            >
              <div className={`p-3 rounded-xl ${relatorio.color} w-fit mb-4`}>
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white mb-2">{relatorio.titulo}</h3>
              <p className="text-sm text-gray-400">{relatorio.descricao}</p>
            </button>
          );
        })}
      </div>

      {/* Configurações */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-4 sm:p-6">
        <h3 className="text-lg font-bold text-white mb-6">Configurar Relatório</h3>
         
        <div className="space-y-6">
          {/* Período */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">Período</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {['Este mês', 'Últimos 3 meses', 'Este ano', 'Personalizado'].map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriodo(p.toLowerCase().replace(/ /g, '_'))}
                  className={`px-3 py-3 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                    periodo === p.toLowerCase().replace(/ /g, '_')
                      ? 'bg-purple-500 text-white'
                      : 'border border-gray-700 text-gray-300 hover:bg-gray-700/50'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Formato */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">Formato de Exportação</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'pdf', label: 'PDF', icon: FileText },
                { id: 'excel', label: 'Excel', icon: BarChart3 },
                { id: 'csv', label: 'CSV', icon: Download }
              ].map((fmt) => {
                const Icon = fmt.icon;
                return (
                  <button
                    key={fmt.id}
                    onClick={() => setFormato(fmt.id)}
                    className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                      formato === fmt.id
                        ? 'border-purple-500 bg-purple-500/10'
                        : 'border-gray-700 hover:bg-gray-700/50'
                    }`}
                  >
                    <Icon className="w-5 h-5 text-gray-400" />
                    <span className="text-sm font-medium text-white">{fmt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preview dos Dados */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">Preview do Relatório</label>
            <div className="bg-gray-700/30 border border-gray-700 rounded-xl p-4 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Receita Total</p>
                  <p className="text-xl font-bold text-green-400">
                    R$ {(resumoFinanceiro.receita_bruta || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Despesas Total</p>
                  <p className="text-xl font-bold text-orange-400">
                    R$ {((resumoFinanceiro.despesas_pagas || 0) + (resumoFinanceiro.despesas_pendentes || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Lucro Líquido</p>
                  <p className={`text-xl font-bold ${(resumoFinanceiro.lucro_liquido || 0) >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                    R$ {(resumoFinanceiro.lucro_liquido || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Margem</p>
                  <p className="text-xl font-bold text-purple-400">
                    {(resumoFinanceiro.margem_lucro || 0).toFixed(1)}%
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-500 text-center pt-4 border-t border-gray-700">
                {distribuicaoDespesas.length} categorias de despesas • {evolucaoReceitas.length} meses de histórico
              </p>
            </div>
          </div>

          {/* Ações */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-700">
            <button
              onClick={gerarRelatorio}
              disabled={gerando}
              className="flex-1 px-6 py-3.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl hover:from-purple-600 hover:to-pink-600 flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {gerando ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Gerar Relatório
                </>
              )}
            </button>
            <button className="px-6 py-3.5 border border-gray-700 text-white font-medium rounded-xl hover:bg-gray-700/50 transition-all flex items-center justify-center gap-3">
              <Share2 className="w-5 h-5" />
              Compartilhar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== COMPONENTE PRINCIPAL ====================

export const FinanceiroScreen = ({ onClose }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('visao-geral');
  const [periodo, setPeriodo] = useState('mes');
  const [dataInicio, setDataInicio] = useState(() => {
    const date = new Date();
    date.setDate(1);
    return date.toISOString().split('T')[0];
  });
  const [dataFim, setDataFim] = useState(() => new Date().toISOString().split('T')[0]);
    
  const [resumoFinanceiro, setResumoFinanceiro] = useState({
    receita_bruta: 0,
    despesas_pagas: 0,
    despesas_pendentes: 0,
    lucro_liquido: 0,
    margem_lucro: 0
  });
    
  const [evolucaoReceitas, setEvolucaoReceitas] = useState([]);
  const [distribuicaoDespesas, setDistribuicaoDespesas] = useState([]);

  const carregarDados = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    else setRefreshing(true);

    try {
      const [resumoRes, mensalRes, despesasCatRes] = await Promise.all([
        supabase.from('vw_resumo_financeiro').select('*').single(),
        supabase.from('vw_financeiro_mensal').select('*').order('mes', { ascending: true }),
        supabase.from('vw_despesas_por_categoria').select('*')
      ]);

      if (resumoRes.data) {
        setResumoFinanceiro({
          receita_bruta: resumoRes.data.receita_bruta || 0,
          despesas_pagas: resumoRes.data.despesas_pagas || 0,
          despesas_pendentes: resumoRes.data.despesas_pendentes || 0,
          lucro_liquido: resumoRes.data.lucro_liquido || 0,
          margem_lucro: resumoRes.data.margem_lucro || 0
        });
      }

      if (mensalRes.data) {
        setEvolucaoReceitas(mensalRes.data.map(item => ({
          mes: new Date(item.mes).toLocaleDateString('pt-BR', { month: 'short' }),
          receita: item.receita || 0,
          despesas: item.despesas || 0,
          lucro: item.lucro || 0
        })));
      }

      if (despesasCatRes.data) {
        setDistribuicaoDespesas(despesasCatRes.data.map(item => ({
          categoria: item.categoria || 'Sem categoria',
          total: item.total || 0
        })));
      }

    } catch (error) {
      console.error('Erro ao carregar dados financeiros:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const tabs = [
    { id: 'visao-geral', label: 'Visão Geral', icon: Home },
    { id: 'despesas', label: 'Despesas', icon: Receipt },
    { id: 'metas', label: 'Metas', icon: Target },
    { id: 'relatorios', label: 'Relatórios', icon: FileText }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'visao-geral':
        return (
          <VisaoGeralTab 
            resumoFinanceiro={resumoFinanceiro}
            evolucaoReceitas={evolucaoReceitas}
            distribuicaoDespesas={distribuicaoDespesas}
            loading={loading}
          />
        );
      case 'despesas':
        return <DespesasTab onRefresh={() => carregarDados(false)} />;
      case 'metas':
        return <MetasTab resumoFinanceiro={resumoFinanceiro} />;
      case 'relatorios':
        return (
          <RelatoriosTab 
            resumoFinanceiro={resumoFinanceiro}
            evolucaoReceitas={evolucaoReceitas}
            distribuicaoDespesas={distribuicaoDespesas}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-x-hidden">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-gray-900/90 backdrop-blur-xl border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between py-4 md:h-20 gap-4">
            <div className="flex items-center gap-4 w-full md:w-auto">
              <button
                onClick={onClose}
                className="p-2.5 hover:bg-gray-800/50 rounded-xl transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-400" />
              </button>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-white">Finanças</h1>
                  <p className="text-xs sm:text-sm text-gray-400 hidden sm:block">
                    {new Date(dataInicio).toLocaleDateString('pt-BR')} - {new Date(dataFim).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              <button
                onClick={() => carregarDados(false)}
                disabled={refreshing}
                className="p-2.5 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-xl transition-colors"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
               
              <FiltroPeriodo 
                periodo={periodo} 
                setPeriodo={setPeriodo}
                dataInicio={dataInicio}
                setDataInicio={setDataInicio}
                dataFim={dataFim}
                setDataFim={setDataFim}
                onAplicar={() => carregarDados()}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-[84px] md:top-20 z-40 bg-gray-900/80 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 overflow-x-auto py-2 no-scrollbar">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-purple-500 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 mb-10">
        {loading && activeTab === 'visao-geral' ? (
          <div className="flex flex-col items-center justify-center h-96">
            <Loader2 className="w-16 h-16 text-purple-500 animate-spin mb-4" />
            <p className="text-gray-400 font-medium">Carregando dados financeiros...</p>
          </div>
        ) : (
          renderTabContent()
        )}
      </div>
    </div>
  );
};