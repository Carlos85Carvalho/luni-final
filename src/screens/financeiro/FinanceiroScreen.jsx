import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { supabase } from '../../services/supabase';
import { 
  TrendingUp, TrendingDown, DollarSign, Users, Receipt, 
  Loader2, ArrowUpRight, ArrowDownRight, Target, BarChart3, 
  Clock, Filter, Download, Share2, RefreshCw, Lightbulb, 
  AlertTriangle, Calendar, ChevronLeft, FileText, PieChart as PieChartIcon,
  Eye, EyeOff, CheckCircle, AlertCircle, Zap, Sparkles, Crown,
  ChevronRight, ChevronDown, Plus, MoreVertical, Home, Wallet,
  TrendingUp as TrendingUpIcon, Filter as FilterIcon, Settings,
  CreditCard, LineChart as LineChartIcon, Activity, Target as TargetIcon,
  ArrowRight, CircleDollarSign, Percent, Clock as ClockIcon,
  CalendarDays, TrendingDown as TrendingDownIcon, WalletCards,
  Briefcase, Store, Package, Scissors, Shirt, Palette, Gem,
  ShoppingBag, CreditCard as CreditCardIcon, Banknote, Coins,
  PiggyBank, Landmark, Calculator, ChartNoAxesColumn
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Bar, PieChart as RechartsPie, Pie, Cell,
  Legend, LineChart, Line, ComposedChart, RadarChart,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ScatterChart, Scatter, Treemap, Sankey, FunnelChart, Funnel
} from 'recharts';

import { DespesasScreen } from './despesas'; 
import { MetasScreen } from './metas';

// --- COMPONENTES DE UI REUTILIZÁVEIS ---

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
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100', trend: 'bg-purple-100 text-purple-700' },
    green: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-100', trend: 'bg-green-100 text-green-700' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100', trend: 'bg-blue-100 text-blue-700' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-100', trend: 'bg-orange-100 text-orange-700' },
    red: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-100', trend: 'bg-red-100 text-red-700' },
    pink: { bg: 'bg-pink-50', text: 'text-pink-600', border: 'border-pink-100', trend: 'bg-pink-100 text-pink-700' }
  };

  const style = colorClasses[cor] || colorClasses.purple;
  
  const formattedValue = useMemo(() => {
    if (loading) return '---';
    if (format === 'currency') {
      return `R$ ${Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else if (format === 'percent') {
      return `${Number(valor).toFixed(1)}%`;
    } else if (format === 'number') {
      return Number(valor).toLocaleString('pt-BR');
    }
    return valor;
  }, [valor, format, loading]);

  return (
    <div 
      onClick={onClick}
      className={`relative bg-white p-6 rounded-2xl border-2 ${style.border} hover:shadow-xl transition-all duration-300 hover:scale-[1.02] group cursor-pointer ${onClick ? 'hover:border-purple-300' : ''}`}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-semibold text-gray-500">{titulo}</span>
        <div className={`p-2.5 rounded-xl ${style.bg} shadow-sm group-hover:scale-110 transition-transform`}>
          <Icon className={`w-5 h-5 ${style.text}`} />
        </div>
      </div>
      
      {loading ? (
        <div className="space-y-2">
          <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 bg-gray-100 rounded animate-pulse"></div>
        </div>
      ) : (
        <>
          <div className="text-2xl font-bold text-gray-900 mb-2">{formattedValue}</div>
          
          <div className="flex items-center justify-between">
            {subTitulo && (
              <span className="text-sm text-gray-500">{subTitulo}</span>
            )}
            
            {trend && (
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${style.trend}`}>
                {trend === 'up' ? (
                  <>
                    <ArrowUpRight className="w-4 h-4" />
                    <span>+{trendValue}%</span>
                  </>
                ) : (
                  <>
                    <ArrowDownRight className="w-4 h-4" />
                    <span>-{trendValue}%</span>
                  </>
                )}
              </div>
            )}
          </div>
        </>
      )}
      
      {onClick && (
        <div className="absolute -right-2 -bottom-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="p-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full shadow-lg">
            <ArrowRight className="w-4 h-4 text-white" />
          </div>
        </div>
      )}
    </div>
  );
};

const AlertaCard = ({ alerta, onClose }) => {
  const Icon = alerta.icon;
  return (
    <div className={`relative p-4 rounded-xl border ${alerta.bgCor} animate-pulse`}>
      <button 
        onClick={onClose}
        className="absolute top-2 right-2 p-1 hover:bg-white/20 rounded-full transition-colors"
      >
        <AlertCircle className="w-4 h-4" />
      </button>
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 mt-0.5 ${alerta.cor}`} />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-gray-900">{alerta.titulo}</h4>
            {alerta.valor && (
              <span className="px-2.5 py-1 bg-white/80 rounded-full text-sm font-bold">
                {alerta.valor}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 mt-1">{alerta.descricao}</p>
          {alerta.acao && (
            <button className="mt-3 text-sm font-medium text-purple-600 hover:text-purple-700 flex items-center gap-1">
              {alerta.acao}
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const InsightCard = ({ insight }) => {
  const Icon = insight.icon;
  return (
    <div className={`p-4 rounded-xl border ${insight.bgCor} hover:shadow-md transition-shadow`}>
      <div className="flex items-start gap-3">
        <div className="p-2.5 rounded-lg bg-white/80">
          <Icon className={`w-5 h-5 ${insight.cor}`} />
        </div>
        <div>
          <h4 className="font-semibold text-gray-900">{insight.titulo}</h4>
          <p className="text-sm text-gray-600 mt-1">{insight.descricao}</p>
          {insight.dica && (
            <div className="mt-2 p-2 bg-white/50 rounded-lg">
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Lightbulb className="w-3 h-3" />
                {insight.dica}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const FiltroPeriodo = ({ periodo, setPeriodo, dataInicio, setDataInicio, dataFim, setDataFim, onAplicar }) => {
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  const periodos = [
    { id: 'hoje', label: 'Hoje' },
    { id: 'semana', label: 'Esta Semana' },
    { id: 'mes', label: 'Este Mês' },
    { id: 'trimestre', label: 'Este Trimestre' },
    { id: 'ano', label: 'Este Ano' },
    { id: 'personalizado', label: 'Personalizado' }
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setMostrarFiltros(!mostrarFiltros)}
        className="px-4 py-2.5 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 flex items-center gap-2 group"
      >
        <CalendarDays className="w-5 h-5 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">
          {periodos.find(p => p.id === periodo)?.label || 'Período'}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${mostrarFiltros ? 'rotate-180' : ''}`} />
      </button>

      {mostrarFiltros && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 overflow-hidden">
          <div className="p-4">
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Período Rápido</h4>
              <div className="grid grid-cols-2 gap-2">
                {periodos.slice(0, -1).map(p => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setPeriodo(p.id);
                      setMostrarFiltros(false);
                      onAplicar();
                    }}
                    className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                      periodo === p.id 
                        ? 'bg-purple-600 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {periodo === 'personalizado' && (
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Datas Personalizadas</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">De</label>
                    <input
                      type="date"
                      value={dataInicio}
                      onChange={(e) => setDataInicio(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Até</label>
                    <input
                      type="date"
                      value={dataFim}
                      onChange={(e) => setDataFim(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
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
              className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
            >
              Aplicar Filtros
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// --- COMPONENTES DE TABS ---

const OverviewTab = ({ 
  resumoFinanceiro, 
  evolucaoReceitas, 
  distribuicaoDespesas,
  alertas,
  insights,
  contasAVencer,
  topClientes,
  loading 
}) => {
  const [mostrarDetalhes, setMostrarDetalhes] = useState(true);

  return (
    <div className="space-y-6">
      {/* Alertas em Destaque */}
      {alertas.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-500" />
              Alertas do Sistema
            </h3>
            <button className="text-sm text-gray-500 hover:text-gray-700">
              Marcar todos como lidos
            </button>
          </div>
          {alertas.map((alerta, idx) => (
            <AlertaCard key={idx} alerta={alerta} />
          ))}
        </div>
      )}

      {/* KPIs Principais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <KPICard
          titulo="Receita Bruta"
          valor={resumoFinanceiro.receitaBruta}
          icone={DollarSign}
          cor="green"
          trend="up"
          trendValue={12.5}
          loading={loading}
          subTitulo="Faturamento total"
          format="currency"
        />
        
        <KPICard
          titulo="Lucro Líquido"
          valor={resumoFinanceiro.lucroLiquido}
          icone={TrendingUp}
          cor={resumoFinanceiro.lucroLiquido >= 0 ? "blue" : "red"}
          trend={resumoFinanceiro.lucroLiquido >= 0 ? "up" : "down"}
          trendValue={8.7}
          loading={loading}
          subTitulo={`Margem: ${resumoFinanceiro.margemLucro.toFixed(1)}%`}
          format="currency"
        />
        
        <KPICard
          titulo="Despesas Totais"
          valor={resumoFinanceiro.despesasPagas + resumoFinanceiro.despesasPendentes}
          icone={Receipt}
          cor="orange"
          trend="down"
          trendValue={3.2}
          loading={loading}
          subTitulo={`${resumoFinanceiro.despesasPendentes > 0 ? resumoFinanceiro.despesasPendentes.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) + ' pendentes' : 'Todas pagas'}`}
          format="currency"
        />
        
        <KPICard
          titulo="Contas a Vencer"
          valor={contasAVencer.length}
          icone={Clock}
          cor={contasAVencer.length > 0 ? "red" : "green"}
          loading={loading}
          subTitulo="Próximos 7 dias"
          format="number"
        />
      </div>

      {/* Gráficos e Análises */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de Evolução */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">📈 Evolução Financeira</h3>
              <p className="text-sm text-gray-500">Receita vs Despesas nos últimos meses</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <Eye className="w-5 h-5 text-gray-500" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <Download className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={evolucaoReceitas}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis 
                  dataKey="mes" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  tickFormatter={(value) => `R$ ${(value/1000).toFixed(0)}k`}
                />
                <Tooltip 
                  formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Valor']}
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    padding: '12px'
                  }}
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
                  dot={{ r: 4, strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribuição de Despesas */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">📊 Distribuição de Despesas</h3>
              <p className="text-sm text-gray-500">Por categoria (último mês)</p>
            </div>
            <button 
              onClick={() => setMostrarDetalhes(!mostrarDetalhes)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              {mostrarDetalhes ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPie>
                <Pie
                  data={distribuicaoDespesas}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {distribuicaoDespesas.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={['#8b5cf6', '#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#f472b6'][index % 6]} 
                    />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Valor']}
                />
                {mostrarDetalhes && <Legend />}
              </RechartsPie>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Insights e Top Clientes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Insights Inteligentes */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <Lightbulb className="w-5 h-5 text-purple-500" />
            <h3 className="text-lg font-bold text-gray-900">💡 Insights Inteligentes</h3>
          </div>
          <div className="space-y-4">
            {insights.map((insight, idx) => (
              <InsightCard key={idx} insight={insight} />
            ))}
          </div>
        </div>

        {/* Top Clientes */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">🏆 Top Clientes</h3>
            <span className="text-sm text-gray-500">Maior faturamento</span>
          </div>
          <div className="space-y-4">
            {topClientes.slice(0, 5).map((cliente, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                      {cliente.cliente_nome?.substring(0, 2).toUpperCase() || 'CL'}
                    </div>
                    {index < 3 && (
                      <div className="absolute -top-1 -right-1">
                        <Crown className={`w-5 h-5 ${
                          index === 0 ? 'text-yellow-500' : 
                          index === 1 ? 'text-gray-400' : 
                          'text-orange-500'
                        }`} />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{cliente.cliente_nome || 'Cliente'}</p>
                    <p className="text-sm text-gray-500">{cliente.total_visitas || 0} atendimentos</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">
                    R$ {(cliente.total_gasto || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-sm text-gray-500">Total gasto</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const ClientesTab = ({ topClientes, loading }) => {
  const [filtroCliente, setFiltroCliente] = useState('todos');

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-12 h-12 text-purple-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Métricas de Clientes */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          titulo="Clientes Totais"
          valor={topClientes.length}
          icone={Users}
          cor="purple"
          trend="up"
          trendValue={5.2}
          format="number"
        />
        <KPICard
          titulo="Ticket Médio"
          valor={topClientes.reduce((acc, c) => acc + (c.total_gasto || 0), 0) / (topClientes.length || 1)}
          icone={DollarSign}
          cor="green"
          trend="up"
          trendValue={3.8}
          format="currency"
        />
        <KPICard
          titulo="Frequência"
          valor="2.3x"
          icone={TrendingUpIcon}
          cor="blue"
          subTitulo="por mês"
        />
        <KPICard
          titulo="Retenção"
          valor="78%"
          icone={Target}
          cor="orange"
          trend="up"
          trendValue={2.1}
          format="percent"
        />
      </div>

      {/* Lista de Clientes */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">📋 Base de Clientes</h3>
              <p className="text-sm text-gray-500">{topClientes.length} clientes encontrados</p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={filtroCliente}
                onChange={(e) => setFiltroCliente(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="todos">Todos os Clientes</option>
                <option value="vip">Clientes VIP</option>
                <option value="recorrente">Recorrentes</option>
                <option value="novo">Novos</option>
              </select>
              <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Novo Cliente
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-4 px-6 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Cliente</th>
                <th className="py-4 px-6 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Contato</th>
                <th className="py-4 px-6 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Atendimentos</th>
                <th className="py-4 px-6 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Gasto</th>
                <th className="py-4 px-6 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Última Visita</th>
                <th className="py-4 px-6 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {topClientes.map((cliente, index) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                        {cliente.cliente_nome?.substring(0, 2).toUpperCase() || 'CL'}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{cliente.cliente_nome || 'Cliente'}</div>
                        <div className="text-sm text-gray-500">ID: {cliente.cliente_id?.substring(0, 8) || 'N/A'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-sm text-gray-900">cliente@email.com</div>
                    <div className="text-sm text-gray-500">(11) 99999-9999</div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                        {cliente.total_visitas || 0} vezes
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-lg font-bold text-gray-900">
                      R$ {(cliente.total_gasto || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-sm text-gray-900">15/02/2024</div>
                    <div className="text-xs text-gray-500">há 2 dias</div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Ver histórico">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg" title="Editar">
                        <FileText className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg" title="Enviar mensagem">
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const RelatoriosTab = () => {
  const [tipoRelatorio, setTipoRelatorio] = useState('financeiro');
  const [formato, setFormato] = useState('pdf');

  const relatorios = [
    {
      id: 'financeiro',
      titulo: 'Relatório Financeiro Completo',
      descricao: 'Receitas, despesas, lucro e análise detalhada',
      icon: DollarSign,
      color: 'text-green-600 bg-green-50'
    },
    {
      id: 'clientes',
      titulo: 'Análise de Clientes',
      descricao: 'Perfil, comportamento e faturamento por cliente',
      icon: Users,
      color: 'text-blue-600 bg-blue-50'
    },
    {
      id: 'desempenho',
      titulo: 'Desempenho Mensal',
      descricao: 'KPIs, metas e indicadores de performance',
      icon: TrendingUp,
      color: 'text-purple-600 bg-purple-50'
    },
    {
      id: 'tendencias',
      titulo: 'Análise de Tendências',
      descricao: 'Projeções e insights para o próximo período',
      icon: LineChartIcon,
      color: 'text-orange-600 bg-orange-50'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Seletor de Relatório */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {relatorios.map((relatorio) => {
          const Icon = relatorio.icon;
          return (
            <button
              key={relatorio.id}
              onClick={() => setTipoRelatorio(relatorio.id)}
              className={`p-6 rounded-2xl border-2 text-left transition-all ${
                tipoRelatorio === relatorio.id
                  ? 'border-purple-600 bg-purple-50 shadow-lg'
                  : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-3 rounded-xl ${relatorio.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-gray-900">{relatorio.titulo}</h3>
              </div>
              <p className="text-sm text-gray-600">{relatorio.descricao}</p>
            </button>
          );
        })}
      </div>

      {/* Configurações do Relatório */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-6">⚙️ Configurar Relatório</h3>
        
        <div className="space-y-6">
          {/* Período */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">Período do Relatório</label>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {['Este mês', 'Últimos 3 meses', 'Este ano', 'Personalizado'].map((periodo) => (
                <button
                  key={periodo}
                  className="px-4 py-3 border border-gray-300 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-colors text-sm font-medium"
                >
                  {periodo}
                </button>
              ))}
            </div>
          </div>

          {/* Formato e Seções */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">Formato de Exportação</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'pdf', label: 'PDF', icon: FileText },
                  { id: 'excel', label: 'Excel', icon: BarChart3 },
                  { id: 'csv', label: 'CSV', icon: Calculator }
                ].map((fmt) => {
                  const Icon = fmt.icon;
                  return (
                    <button
                      key={fmt.id}
                      onClick={() => setFormato(fmt.id)}
                      className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 ${
                        formato === fmt.id
                          ? 'border-purple-600 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Icon className="w-5 h-5 text-gray-600" />
                      <span className="text-sm font-medium">{fmt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">Seções do Relatório</label>
              <div className="space-y-3">
                {[
                  'Resumo Executivo',
                  'Análise de Receitas',
                  'Detalhamento de Despesas',
                  'Perfil de Clientes',
                  'Atingimento de Metas',
                  'Insights Automáticos'
                ].map((secao) => (
                  <label key={secao} className="flex items-center gap-3">
                    <input type="checkbox" defaultChecked className="rounded text-purple-600 focus:ring-purple-500" />
                    <span className="text-sm text-gray-700">{secao}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className="flex gap-4 pt-6 border-t border-gray-200">
            <button className="px-8 py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:from-purple-700 hover:to-pink-700 flex items-center gap-3 shadow-lg hover:shadow-xl transition-all">
              <Download className="w-5 h-5" />
              Gerar Relatório
            </button>
            <button className="px-8 py-3.5 border-2 border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center gap-3">
              <Share2 className="w-5 h-5" />
              Compartilhar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---

export const FinanceiroScreen = ({ onClose }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [periodo, setPeriodo] = useState('mes');
  const [dataInicio, setDataInicio] = useState(() => {
    const date = new Date();
    date.setDate(1);
    return date.toISOString().split('T')[0];
  });
  const [dataFim, setDataFim] = useState(() => new Date().toISOString().split('T')[0]);
  const [showFilters, setShowFilters] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  
  const [resumoFinanceiro, setResumoFinanceiro] = useState({
    receitaBruta: 0,
    despesasPagas: 0,
    despesasPendentes: 0,
    lucroLiquido: 0,
    margemLucro: 0
  });
  
  const [despesas, setDespesas] = useState([]);
  const [contasAVencer, setContasAVencer] = useState([]);
  const [evolucaoReceitas, setEvolucaoReceitas] = useState([]);
  const [distribuicaoDespesas, setDistribuicaoDespesas] = useState([]);
  const [topClientes, setTopClientes] = useState([]);
  const [insights, setInsights] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [metas, setMetas] = useState({
    faturamento: 15000,
    lucro: 5000,
    clientesNovos: 20
  });

  const gerarInsights = useCallback((dados) => {
    const novosInsights = [];
    const novosAlertas = [];

    // Insights baseados em performance
    if (dados.margemLucro > 30) {
      novosInsights.push({
        titulo: '🎉 Performance Excelente!',
        descricao: `Sua margem de lucro de ${dados.margemLucro.toFixed(1)}% está acima da média do setor.`,
        icon: TrendingUp,
        cor: 'text-green-600',
        bgCor: 'bg-green-50 border-green-100',
        dica: 'Considere reinvestir parte do lucro para acelerar o crescimento.'
      });
    } else if (dados.margemLucro < 15) {
      novosInsights.push({
        titulo: '⚠️ Atenção à Margem',
        descricao: `Margem de lucro em ${dados.margemLucro.toFixed(1)}%. Há espaço para melhorias.`,
        icon: AlertTriangle,
        cor: 'text-yellow-600',
        bgCor: 'bg-yellow-50 border-yellow-100',
        dica: 'Analise suas despesas variáveis para identificar oportunidades de redução.'
      });
    }

    // Insights de crescimento
    if (dados.receitaBruta > 20000) {
      novosInsights.push({
        titulo: '🚀 Crescimento Acelerado',
        descricao: 'Faturamento acima de R$ 20.000 este mês! Continue assim.',
        icon: Zap,
        cor: 'text-purple-600',
        bgCor: 'bg-purple-50 border-purple-100',
        dica: 'Invista em marketing digital para manter o ritmo de crescimento.'
      });
    }

    // Alertas de vencimento
    if (dados.contasVencendo > 0) {
      novosAlertas.push({
        titulo: '⏰ Contas Próximas do Vencimento',
        descricao: `${dados.contasVencendo} conta(s) vence(m) nos próximos 7 dias.`,
        valor: dados.contasVencendo,
        icon: Clock,
        cor: 'text-orange-600',
        bgCor: 'bg-orange-50 border-orange-100',
        acao: 'Ver detalhes'
      });
    }

    // Alerta de fluxo de caixa
    if (dados.despesasPendentes > dados.receitaBruta * 0.3) {
      novosAlertas.push({
        titulo: '💰 Fluxo de Caixa Atenção',
        descricao: 'Despesas pendentes representam mais de 30% da receita.',
        icon: AlertCircle,
        cor: 'text-red-600',
        bgCor: 'bg-red-50 border-red-100',
        acao: 'Revisar finanças'
      });
    }

    setInsights(novosInsights);
    setAlertas(novosAlertas);
  }, []);

  const carregarDados = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    else setRefreshing(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: usu } = await supabase
        .from('usuarios')
        .select('salao_id')
        .eq('id', user.id)
        .maybeSingle();
       
      if (!usu?.salao_id) return;

      const salaoId = usu.salao_id;

      // Carregar dados em paralelo
      const [resAgendamentos, resDespesas, resTopClientes, resMetas] = await Promise.all([
        supabase
          .from('agendamentos')
          .select('valor_total, data, status')
          .eq('salao_id', salaoId)
          .gte('data', dataInicio)
          .lte('data', dataFim)
          .eq('status', 'concluido'),
        
        supabase
          .from('despesas')
          .select('*')
          .eq('salao_id', salaoId)
          .gte('data_vencimento', dataInicio)
          .lte('data_vencimento', dataFim),
        
        supabase
          .from('vw_top_clientes_mes')
          .select('*')
          .limit(10),
        
        supabase
          .from('metas')
          .select('*')
          .order('mes', { ascending: false })
          .limit(1)
      ]);

      // Calcular resumo financeiro
      const receitaBruta = resAgendamentos.data?.reduce((sum, item) => 
        sum + Number(item.valor_total || 0), 0) || 0;

      const despesasPagas = resDespesas.data?.filter(d => d.pago)
        .reduce((sum, item) => sum + Number(item.valor || 0), 0) || 0;
       
      const despesasPendentes = resDespesas.data?.filter(d => !d.pago)
        .reduce((sum, item) => sum + Number(item.valor || 0), 0) || 0;

      const lucroLiquido = receitaBruta - despesasPagas;
      const margemLucro = receitaBruta > 0 ? (lucroLiquido / receitaBruta) * 100 : 0;

      setResumoFinanceiro({ 
        receitaBruta, 
        despesasPagas, 
        despesasPendentes, 
        lucroLiquido, 
        margemLucro 
      });

      // Processar despesas
      let countVencendo = 0;
      if (resDespesas.data) {
        setDespesas(resDespesas.data);
        
        // Distribuição por categoria
        const distribuicao = resDespesas.data.reduce((acc, despesa) => {
          const categoria = despesa.categoria || 'Outros';
          if (!acc[categoria]) {
            acc[categoria] = { valor: 0, count: 0 };
          }
          acc[categoria].valor += Number(despesa.valor || 0);
          acc[categoria].count += 1;
          return acc;
        }, {});

        const distribuicaoArray = Object.entries(distribuicao)
          .map(([name, data]) => ({ 
            name, 
            value: data.valor,
            count: data.count 
          }))
          .sort((a, b) => b.value - a.value);

        setDistribuicaoDespesas(distribuicaoArray);

        // Contas a vencer (próximos 7 dias)
        const hoje = new Date();
        const seteDias = new Date();
        seteDias.setDate(hoje.getDate() + 7);
        
        const contasVencendo = resDespesas.data.filter(d => {
          if (d.pago) return false;
          const vencimento = new Date(d.data_vencimento);
          return vencimento >= hoje && vencimento <= seteDias;
        });
        
        setContasAVencer(contasVencendo);
        countVencendo = contasVencendo.length;
      }

      // Dados de evolução (simulados para demonstração)
      const dadosEvolucao = [
        { mes: 'Jan', receita: receitaBruta * 0.8, despesas: 8500, lucro: receitaBruta * 0.8 - 8500 },
        { mes: 'Fev', receita: receitaBruta * 0.9, despesas: 9200, lucro: receitaBruta * 0.9 - 9200 },
        { mes: 'Mar', receita: receitaBruta, despesas: 9800, lucro: receitaBruta - 9800 },
        { mes: 'Abr', receita: receitaBruta * 1.1, despesas: 10500, lucro: receitaBruta * 1.1 - 10500 },
        { mes: 'Mai', receita: receitaBruta * 1.2, despesas: 11200, lucro: receitaBruta * 1.2 - 11200 }
      ];
      setEvolucaoReceitas(dadosEvolucao);

      // Top clientes
      if (resTopClientes.data) {
        setTopClientes(resTopClientes.data);
      }

      // Metas
      if (resMetas.data?.length) {
        setMetas(prev => ({ 
          ...prev, 
          faturamento: Number(resMetas.data[0].valor) 
        }));
      }

      // Gerar insights automáticos
      gerarInsights({
        receitaBruta, 
        despesasPagas, 
        despesasPendentes, 
        lucroLiquido, 
        margemLucro,
        contasVencendo: countVencendo
      });

      setLastUpdate(new Date());

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dataInicio, dataFim, gerarInsights]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: Home, color: 'text-purple-600' },
    { id: 'despesas', label: 'Despesas', icon: Receipt, color: 'text-orange-600' },
    { id: 'metas', label: 'Metas', icon: Target, color: 'text-green-600' },
    { id: 'clientes', label: 'Clientes', icon: Users, color: 'text-blue-600' },
    { id: 'analise', label: 'Análise', icon: BarChart3, color: 'text-pink-600' },
    { id: 'relatorios', label: 'Relatórios', icon: FileText, color: 'text-indigo-600' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <OverviewTab
            resumoFinanceiro={resumoFinanceiro}
            evolucaoReceitas={evolucaoReceitas}
            distribuicaoDespesas={distribuicaoDespesas}
            alertas={alertas}
            insights={insights}
            contasAVencer={contasAVencer}
            topClientes={topClientes}
            loading={loading}
          />
        );
      case 'despesas':
        return <DespesasScreen onClose={() => setActiveTab('overview')} />;
      case 'metas':
        return <MetasScreen onClose={() => setActiveTab('overview')} />;
      case 'clientes':
        return <ClientesTab topClientes={topClientes} loading={loading} />;
      case 'analise':
        return <div className="p-8 text-center">Análise Avançada em desenvolvimento</div>;
      case 'relatorios':
        return <RelatoriosTab />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-lg border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-4">
              <button
                onClick={onClose}
                className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors group"
                title="Voltar"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600 group-hover:text-gray-900" />
              </button>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Dashboard Financeiro</h1>
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(dataInicio).toLocaleDateString('pt-BR')} - {new Date(dataFim).toLocaleDateString('pt-BR')}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Atualizado {lastUpdate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => carregarDados(false)}
                disabled={refreshing}
                className="p-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                title="Atualizar dados"
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
              
              <button className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2">
                <Download className="w-5 h-5" />
                Exportar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="sticky top-20 z-40 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 overflow-x-auto no-scrollbar py-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 border border-purple-200 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? tab.color : 'text-gray-400'}`} />
                  {tab.label}
                  {tab.id === 'despesas' && contasAVencer.length > 0 && (
                    <span className="ml-2 px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full">
                      {contasAVencer.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading && activeTab === 'overview' ? (
          <div className="flex flex-col items-center justify-center h-96">
            <div className="relative">
              <Loader2 className="w-16 h-16 text-purple-600 animate-spin" />
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full opacity-20 blur-xl"></div>
            </div>
            <p className="mt-6 text-gray-600 font-medium">Carregando dados financeiros...</p>
            <p className="text-sm text-gray-500 mt-2">Isso pode levar alguns segundos</p>
          </div>
        ) : (
          renderTabContent()
        )}
      </div>

      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export const RelatorioAvancadoModal = () => null;