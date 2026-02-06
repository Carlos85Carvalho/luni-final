import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { supabase } from '../../services/supabase';
import { 
  TrendingUp, TrendingDown, DollarSign, Receipt, 
  Loader2, ArrowUpRight, ArrowDownRight, Target, 
  Clock, Download, Share2, RefreshCw, 
  AlertTriangle, Calendar, ChevronLeft, FileText,
  Eye, CheckCircle, AlertCircle, Zap,
  ChevronRight, ChevronDown, Plus, MoreVertical,
  CalendarDays, WalletCards, Edit2, Trash2, X,
  Filter, Search,
  BarChart3, PieChart as PieChartIcon, Activity,
  Check, Save, Home, Package, Users, XCircle, Info, Truck,
  Tag, ShoppingCart, BarChart, PieChart, CreditCard,
  Package as PackageIcon
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Bar, PieChart as RechartsPie, Pie, Cell,
  ComposedChart, Line
} from 'recharts';

// Importar modais
import { DespesaModal } from './DespesaModal';
import { ProdutoModal } from './ProdutoModal';
import { EstoqueModal } from './EstoqueModal';
import { FornecedorModal } from './FornecedorModal';
import { MetaModal } from './MetaModal';
import { RelatorioModal } from './RelatorioModal';
import { PDVScreen } from './PDVScreen';

// ==================== COMPONENTES REUTILIZÁVEIS ====================

const KPICard = ({ 
  titulo, 
  valor, 
  icone: Icon, // ✅ CORREÇÃO: Recebendo o ícone corretamente
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
    } else if (format === 'text') {
      return valor || 'Nenhum';
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
          {Icon && <Icon className={`w-5 h-5 ${style.text}`} />}
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

// ==================== 1. VISÃO GERAL ====================

const VisaoGeralTab = ({ 
  resumoFinanceiro, 
  evolucaoReceitas, 
  margemServicos,
  estoqueCritico,
  rankingFornecedores,
  loading,
  onCardClick,
  onAbrirModal
}) => {
  const totalDespesas = (resumoFinanceiro.despesas_pagas || 0) + (resumoFinanceiro.despesas_pendentes || 0);
  const ticketMedio = resumoFinanceiro.receita_bruta && resumoFinanceiro.total_vendas 
    ? resumoFinanceiro.receita_bruta / resumoFinanceiro.total_vendas 
    : 0;

  return (
    <div className="space-y-6">
      {/* KPIs Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          titulo="Receita Total"
          valor={resumoFinanceiro.receita_bruta || 0}
          icone={DollarSign}
          cor="green"
          loading={loading}
          subTitulo="Faturamento total"
          format="currency"
          onClick={() => onCardClick('receita')}
        />
         
        <KPICard
          titulo="Despesa Total"
          valor={totalDespesas}
          icone={Receipt}
          cor="orange"
          loading={loading}
          subTitulo="Custos operacionais"
          format="currency"
          onClick={() => onCardClick('despesa')}
        />
         
        <KPICard
          titulo="Lucro Líquido"
          valor={resumoFinanceiro.lucro_liquido || 0}
          icone={TrendingUp}
          cor={(resumoFinanceiro.lucro_liquido || 0) >= 0 ? "blue" : "red"}
          loading={loading}
          format="currency"
          onClick={() => onCardClick('lucro')}
        />
         
        <KPICard
          titulo="Ticket Médio"
          valor={ticketMedio}
          icone={Tag}
          cor="purple"
          loading={loading}
          format="currency"
          onClick={() => onCardClick('ticket')}
        />
      </div>

      {/* Cards Secundários */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          titulo="Total de Vendas"
          valor={resumoFinanceiro.total_vendas || 0}
          icone={ShoppingCart}
          cor="green"
          loading={loading}
          format="number"
          onClick={() => onCardClick('vendas')}
        />
         
        <KPICard
          titulo="Margem de Lucro"
          valor={resumoFinanceiro.margem_lucro || 0}
          icone={BarChart}
          cor="blue"
          loading={loading}
          format="percent"
          onClick={() => onAbrirModal('margem')}
        />
         
        <KPICard
          titulo="Estoque Crítico"
          valor={estoqueCritico?.length || 0}
          icone={AlertTriangle}
          cor="red"
          loading={loading}
          subTitulo="Produtos"
          format="number"
          onClick={() => onAbrirModal('estoque-critico')}
        />
         
        <KPICard
          titulo="Top Fornecedor"
          valor={rankingFornecedores?.[0]?.nome || 'Nenhum'}
          icone={Truck}
          cor="orange"
          loading={loading}
          subTitulo="Maior gasto"
          format="text"
          onClick={() => onAbrirModal('ranking-fornecedores')}
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Evolução Financeira */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-400" />
                Evolução Financeira
              </h3>
              <p className="text-sm text-gray-400 mt-1">Receita x Despesa x Lucro (mensal)</p>
            </div>
            <button 
              onClick={() => onAbrirModal('evolucao-detalhada')}
              className="px-4 py-2 text-sm text-purple-400 hover:text-purple-300 font-medium flex items-center gap-2"
            >
              Ver detalhes <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="h-64 sm:h-72">
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
                <Bar 
                  dataKey="despesa" 
                  name="Despesa" 
                  fill="#ef4444" 
                  radius={[4, 4, 0, 0]}
                  barSize={24}
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

        {/* Margem por Serviço */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <BarChart className="w-5 h-5 text-purple-400" />
                Margem por Serviço
              </h3>
              <p className="text-sm text-gray-400 mt-1">Rentabilidade dos serviços</p>
            </div>
            <button 
              onClick={() => onAbrirModal('margem-servicos')}
              className="px-4 py-2 text-sm text-purple-400 hover:text-purple-300 font-medium flex items-center gap-2"
            >
              Detalhes <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="h-64 sm:h-72">
            {margemServicos?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={margemServicos} margin={{ left: -20, right: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis 
                    dataKey="servico" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9ca3af', fontSize: 10 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9ca3af', fontSize: 10 }}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip 
                    formatter={(value) => [`${value}%`, 'Margem']}
                    contentStyle={{ 
                      backgroundColor: '#1f2937',
                      borderRadius: '12px', 
                      border: '1px solid rgba(255,255,255,0.1)',
                      padding: '12px'
                    }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Bar 
                    dataKey="margem" 
                    name="Margem" 
                    fill="#8b5cf6" 
                    radius={[4, 4, 0, 0]}
                    barSize={24}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-gray-500 text-sm">Nenhum dado de margem disponível</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== 2. DESPESAS TAB ====================

const DespesasTab = ({ onAbrirModal }) => {
  const [despesas, setDespesas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('todas');
  const [categoriaFiltro, setCategoriaFiltro] = useState('todas');
  const [busca, setBusca] = useState('');

  const categorias = ['Aluguel', 'Energia', 'Água', 'Produtos', 'Salários', 'Marketing', 'Manutenção', 'Outros'];

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

  const marcarComoPaga = async (despesa) => {
    try {
      await supabase
        .from('despesas')
        .update({ 
          pago: true, 
          data_pagamento: new Date().toISOString()
        })
        .eq('id', despesa.id);

      carregarDespesas();
    } catch (error) {
      console.error('Erro ao marcar como paga:', error);
    }
  };

  const excluirDespesa = async (id) => {
    if (!confirm('Deseja realmente excluir esta despesa?')) return;

    try {
      await supabase.from('despesas').delete().eq('id', id);
      carregarDespesas();
    } catch (error) {
      console.error('Erro ao excluir despesa:', error);
    }
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
      {/* Resumo */}
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

      {/* Filtros e Ações */}
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
              onClick={() => onAbrirModal('nova-despesa')}
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
                          onClick={() => onAbrirModal('editar-despesa', despesa)}
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
    </div>
  );
};

// ==================== 3. ESTOQUE TAB ====================

const EstoqueTab = ({ onAbrirModal }) => {
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [busca, setBusca] = useState('');

  const carregarProdutos = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('vw_lucro_produtos')
        .select('*')
        .order('lucro_total', { ascending: false });

      if (error) throw error;
      setProdutos(data || []);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarProdutos();
  }, [carregarProdutos]);

  const produtosFiltrados = useMemo(() => {
    return produtos.filter(produto => {
      const matchStatus = filtroStatus === 'todos' || 
        (filtroStatus === 'critico' && produto.quantidade_atual <= produto.estoque_minimo) ||
        (filtroStatus === 'alto-giro' && produto.rotatividade > 2) ||
        (filtroStatus === 'baixo-giro' && produto.rotatividade < 0.5);
      
      const matchBusca = busca === '' || 
        produto.nome?.toLowerCase().includes(busca.toLowerCase()) ||
        produto.categoria?.toLowerCase().includes(busca.toLowerCase());

      return matchStatus && matchBusca;
    });
  }, [produtos, filtroStatus, busca]);

  // Calcular KPIs do Estoque
  const calcularKPIs = () => {
    if (produtos.length === 0) return null;

    const capitalParado = produtos.reduce((acc, p) => acc + (p.quantidade_atual * p.custo_unitario), 0);
    const produtosCriticos = produtos.filter(p => p.quantidade_atual <= p.estoque_minimo).length;
    const maiorGiro = produtos.reduce((max, p) => p.rotatividade > (max?.rotatividade || 0) ? p : max, null);
    const maisLucrativo = produtos.reduce((max, p) => p.lucro_total > (max?.lucro_total || 0) ? p : max, null);

    return {
      capitalParado,
      produtosCriticos,
      maiorGiro,
      maisLucrativo
    };
  };

  const kpis = calcularKPIs();

  return (
    <div className="space-y-6">
      {/* KPIs do Estoque */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          titulo="Capital Parado"
          valor={kpis?.capitalParado || 0}
          icone={DollarSign}
          cor="orange"
          loading={loading}
          subTitulo="Em estoque"
          format="currency"
          onClick={() => onAbrirModal('capital-parado')}
        />
         
        <KPICard
          titulo="Produtos Críticos"
          valor={kpis?.produtosCriticos || 0}
          icone={AlertTriangle}
          cor="red"
          loading={loading}
          subTitulo="Abaixo do mínimo"
          format="number"
          onClick={() => onAbrirModal('estoque-critico')}
        />
         
        <KPICard
          titulo="Maior Giro"
          valor={kpis?.maiorGiro?.rotatividade?.toFixed(1) || 0}
          icone={TrendingUp}
          cor="green"
          loading={loading}
          subTitulo={kpis?.maiorGiro?.nome || 'Nenhum'}
          format="number"
          onClick={() => onAbrirModal('giro-produtos')}
        />
         
        <KPICard
          titulo="Mais Lucrativo"
          valor={kpis?.maisLucrativo?.lucro_total || 0}
          icone={BarChart}
          cor="blue"
          loading={loading}
          subTitulo={kpis?.maisLucrativo?.nome || 'Nenhum'}
          format="currency"
          onClick={() => onAbrirModal('lucro-produtos')}
        />
      </div>

      {/* Filtros */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-wrap gap-2 w-full lg:w-auto">
            {['todos', 'critico', 'alto-giro', 'baixo-giro'].map(f => (
              <button
                key={f}
                onClick={() => setFiltroStatus(f)}
                className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all text-center ${
                  filtroStatus === f 
                    ? 'bg-purple-500 text-white' 
                    : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {f.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar produto..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none text-sm"
              />
            </div>
            
            <button
              onClick={() => onAbrirModal('entrada-estoque')}
              className="w-full sm:w-auto px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700/50 flex items-center gap-2 font-medium transition-all"
            >
              <PackageIcon className="w-4 h-4" />
              Entrada de Estoque
            </button>
            
            <button
              onClick={() => onAbrirModal('novo-produto')}
              className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 flex items-center gap-2 font-medium transition-all"
            >
              <Plus className="w-4 h-4" />
              Novo Produto
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Produtos */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
          </div>
        ) : produtosFiltrados.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Nenhum produto encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-gray-700/50 border-b border-gray-600">
                <tr>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-400 uppercase">Produto</th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-400 uppercase">Categoria</th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-400 uppercase">Estoque</th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-400 uppercase">Giro</th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-400 uppercase">Lucro Total</th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-400 uppercase">Status</th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-400 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {produtosFiltrados.map((produto) => {
                  const margem = ((produto.preco_venda - produto.custo_unitario) / produto.custo_unitario * 100).toFixed(1);
                  const status = 
                    produto.quantidade_atual <= produto.estoque_minimo ? 'critico' :
                    produto.rotatividade > 2 ? 'alto-giro' :
                    produto.rotatividade < 0.5 ? 'baixo-giro' : 'normal';

                  return (
                    <tr key={produto.id} className="hover:bg-gray-700/30 transition-colors">
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-medium text-white">{produto.nome}</p>
                          <p className="text-xs text-gray-400">Mín: {produto.estoque_minimo} uni</p>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs font-medium">
                          {produto.categoria || 'Sem categoria'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${
                                produto.quantidade_atual <= produto.estoque_minimo ? 'bg-red-500' :
                                produto.quantidade_atual <= produto.estoque_minimo * 2 ? 'bg-orange-500' : 'bg-green-500'
                              }`}
                              style={{ 
                                width: `${Math.min(100, (produto.quantidade_atual / (produto.estoque_minimo * 3)) * 100)}%` 
                              }}
                            ></div>
                          </div>
                          <span className="font-bold text-white">{produto.quantidade_atual}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${
                            produto.rotatividade > 2 ? 'text-green-400' :
                            produto.rotatividade < 0.5 ? 'text-red-400' : 'text-yellow-400'
                          }`}>
                            {produto.rotatividade?.toFixed(2) || '0.00'}
                          </span>
                          <span className="text-xs text-gray-400">vezes/mês</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-medium text-white">
                            R$ {produto.lucro_total?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                          <p className={`text-xs ${
                            parseFloat(margem) >= 50 ? 'text-green-400' :
                            parseFloat(margem) >= 30 ? 'text-yellow-400' : 'text-red-400'
                          }`}>
                            Margem: {margem}%
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          status === 'critico' ? 'bg-red-500/20 text-red-400' :
                          status === 'alto-giro' ? 'bg-green-500/20 text-green-400' :
                          status === 'baixo-giro' ? 'bg-orange-500/20 text-orange-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {status === 'critico' ? 'Crítico' :
                           status === 'alto-giro' ? 'Alto Giro' :
                           status === 'baixo-giro' ? 'Baixo Giro' : 'Normal'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => onAbrirModal('editar-produto', produto)}
                            className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => onAbrirModal('entrada-estoque', produto)}
                            className="p-2 text-green-400 hover:bg-green-500/10 rounded-lg transition-colors"
                            title="Entrada de Estoque"
                          >
                            <PackageIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// ==================== 4. FORNECEDORES TAB ====================

const FornecedoresTab = ({ onAbrirModal }) => {
  const [fornecedores, setFornecedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroAtivo, setFiltroAtivo] = useState('todos');
  const [busca, setBusca] = useState('');
  const [kpis, setKpis] = useState({ ranking: [] });

  const carregarFornecedores = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('fornecedores')
        .select('*')
        .order('nome');

      if (error) throw error;
      setFornecedores(data || []);
    } catch (error) {
      console.error('Erro ao carregar fornecedores:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const carregarKPIs = useCallback(async () => {
    try {
      const { data: rankingData } = await supabase
        .from('vw_ranking_fornecedores')
        .select('*')
        .limit(5);

      return {
        ranking: rankingData || []
      };
    } catch (error) {
      console.error('Erro ao carregar KPIs:', error);
      return { ranking: [] };
    }
  }, []);

  useEffect(() => {
    carregarFornecedores();
    const loadKPIs = async () => {
      const data = await carregarKPIs();
      setKpis(data);
    };
    loadKPIs();
  }, [carregarFornecedores, carregarKPIs]);

  const fornecedoresFiltrados = useMemo(() => {
    return fornecedores.filter(f => {
      const matchAtivo = filtroAtivo === 'todos' || 
        (filtroAtivo === 'ativo' && f.ativo) || 
        (filtroAtivo === 'inativo' && !f.ativo);
      
      const matchBusca = busca === '' || 
        f.nome?.toLowerCase().includes(busca.toLowerCase()) ||
        f.email?.toLowerCase().includes(busca.toLowerCase()) ||
        f.cnpj_cpf?.includes(busca);

      return matchAtivo && matchBusca;
    });
  }, [fornecedores, filtroAtivo, busca]);

  return (
    <div className="space-y-6">
      {/* KPIs dos Fornecedores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          titulo="Maior Volume"
          valor={kpis.ranking?.[0]?.total_gasto || 0}
          icone={DollarSign}
          cor="green"
          loading={loading}
          subTitulo={kpis.ranking?.[0]?.nome || 'Nenhum'}
          format="currency"
          onClick={() => onAbrirModal('ranking-compras')}
        />
         
        <KPICard
          titulo="Fornecedor Top"
          valor={kpis.ranking?.[0]?.nome || 'Nenhum'}
          icone={Truck}
          cor="blue"
          loading={loading}
          subTitulo={`${kpis.ranking?.[0]?.total_compras || 0} compras`}
          format="text"
          onClick={() => onAbrirModal('frequencia-compras')}
        />
         
        <KPICard
          titulo="Índice Dependência"
          valor={kpis.ranking?.[0]?.percentual || 0}
          icone={AlertTriangle}
          cor="orange"
          loading={loading}
          subTitulo="Concentração"
          format="percent"
          onClick={() => onAbrirModal('dependencia-fornecedores')}
        />
         
        <KPICard
          titulo="Total Gasto"
          valor={kpis.ranking?.reduce((acc, f) => acc + (f.total_gasto || 0), 0) || 0}
          icone={Receipt}
          cor="purple"
          loading={loading}
          subTitulo="Período atual"
          format="currency"
          onClick={() => onAbrirModal('compras-analise')}
        />
      </div>

      {/* Filtros */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-wrap gap-2 w-full lg:w-auto">
            {['todos', 'ativo', 'inativo'].map(f => (
              <button
                key={f}
                onClick={() => setFiltroAtivo(f)}
                className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all text-center ${
                  filtroAtivo === f 
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
                placeholder="Buscar fornecedor..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none text-sm"
              />
            </div>
            
            <button
              onClick={() => onAbrirModal('novo-fornecedor')}
              className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 flex items-center gap-2 font-medium transition-all"
            >
              <Plus className="w-4 h-4" />
              Novo Fornecedor
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Fornecedores */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
          </div>
        ) : fornecedoresFiltrados.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Nenhum fornecedor encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-gray-700/50 border-b border-gray-600">
                <tr>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-400 uppercase">Fornecedor</th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-400 uppercase">Contato</th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-400 uppercase">Documento</th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-400 uppercase">Compras</th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-400 uppercase">Status</th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-400 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {fornecedoresFiltrados.map((fornecedor) => {
                  const fornecedorRanking = kpis.ranking.find(f => f.id === fornecedor.id);
                  
                  return (
                    <tr key={fornecedor.id} className="hover:bg-gray-700/30 transition-colors">
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-medium text-white">{fornecedor.nome}</p>
                          {fornecedor.observacoes && (
                            <p className="text-xs text-gray-400 truncate max-w-xs">{fornecedor.observacoes}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="space-y-1">
                          {fornecedor.telefone && (
                            <p className="text-sm text-gray-300">{fornecedor.telefone}</p>
                          )}
                          {fornecedor.email && (
                            <p className="text-sm text-blue-300 truncate max-w-xs">{fornecedor.email}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-sm text-gray-300 font-mono">
                          {fornecedor.cnpj_cpf || 'Não informado'}
                        </p>
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          {fornecedorRanking ? (
                            <>
                              <p className="text-sm text-white">
                                R$ {fornecedorRanking.total_gasto?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                              <p className="text-xs text-gray-400">
                                {fornecedorRanking.total_compras} compras • {fornecedorRanking.percentual?.toFixed(1)}%
                              </p>
                            </>
                          ) : (
                            <p className="text-sm text-gray-500">Sem compras</p>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {fornecedor.ativo ? (
                          <span className="flex items-center gap-2 text-green-400 text-sm">
                            <CheckCircle className="w-4 h-4" />
                            Ativo
                          </span>
                        ) : (
                          <span className="flex items-center gap-2 text-orange-400 text-sm">
                            <XCircle className="w-4 h-4" />
                            Inativo
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => onAbrirModal('editar-fornecedor', fornecedor)}
                            className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => onAbrirModal('compras-fornecedor', fornecedor)}
                            className="p-2 text-green-400 hover:bg-green-500/10 rounded-lg transition-colors"
                            title="Ver Compras"
                          >
                            <ShoppingCart className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// ==================== 5. METAS TAB ====================

const MetasTab = ({ resumoFinanceiro, onAbrirModal }) => {
  const [metas, setMetas] = useState([]);

  const carregarMetas = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('metas')
        .select('*')
        .order('data_criacao', { ascending: false });

      if (data && data.length > 0) {
        setMetas(data);
      } else {
        // Metas padrão
        setMetas([
          {
            id: 1,
            tipo: 'faturamento',
            titulo: 'Meta de Faturamento',
            valor_meta: 50000,
            valor_atual: resumoFinanceiro.receita_bruta || 0,
            periodo: 'Mensal',
            cor: 'green'
          },
          {
            id: 2,
            tipo: 'lucro',
            titulo: 'Meta de Lucro',
            valor_meta: 15000,
            valor_atual: resumoFinanceiro.lucro_liquido || 0,
            periodo: 'Mensal',
            cor: 'blue'
          },
          {
            id: 3,
            tipo: 'despesas',
            titulo: 'Limite de Despesas',
            valor_meta: 35000,
            valor_atual: (resumoFinanceiro.despesas_pagas || 0) + (resumoFinanceiro.despesas_pendentes || 0),
            periodo: 'Mensal',
            cor: 'orange',
            inverso: true
          }
        ]);
      }
    } catch (error) {
      console.error('Erro ao carregar metas:', error);
    }
  }, [resumoFinanceiro]);

  useEffect(() => {
    carregarMetas();
  }, [carregarMetas]);

  const calcularProgresso = (meta) => {
    if (meta.inverso) {
      return meta.valor_atual <= meta.valor_meta 
        ? 100 
        : Math.max(0, 100 - ((meta.valor_atual - meta.valor_meta) / meta.valor_meta * 100));
    }
    return Math.min(100, (meta.valor_atual / meta.valor_meta) * 100);
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

  const getIcon = (tipo) => {
    switch (tipo) {
      case 'faturamento': return DollarSign;
      case 'lucro': return TrendingUp;
      case 'despesas': return Receipt;
      default: return Target;
    }
  };

  const getColorClass = (cor) => {
    switch (cor) {
      case 'green': return 'from-green-500 to-green-600';
      case 'blue': return 'from-blue-500 to-blue-600';
      case 'orange': return 'from-orange-500 to-orange-600';
      default: return 'from-purple-500 to-purple-600';
    }
  };

  const getBgColorClass = (cor) => {
    switch (cor) {
      case 'green': return 'bg-green-500/10';
      case 'blue': return 'bg-blue-500/10';
      case 'orange': return 'bg-orange-500/10';
      default: return 'bg-purple-500/10';
    }
  };

  const getTextColorClass = (cor) => {
    switch (cor) {
      case 'green': return 'text-green-400';
      case 'blue': return 'text-blue-400';
      case 'orange': return 'text-orange-400';
      default: return 'text-purple-400';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">Metas Financeiras</h2>
          <p className="text-sm sm:text-base text-gray-400 mt-1">Acompanhe o progresso das suas metas</p>
        </div>
        <button
          onClick={() => onAbrirModal('nova-meta')}
          className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 flex items-center justify-center gap-2 font-medium transition-all"
        >
          <Plus className="w-4 h-4" />
          Nova Meta
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metas.map((meta) => {
          const Icon = getIcon(meta.tipo);
          const progresso = calcularProgresso(meta);
          const status = getStatusMeta(progresso, meta.inverso);

          return (
            <div 
              key={meta.id} 
              className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-6 hover:bg-gray-800/70 transition-all cursor-pointer"
              onClick={() => onAbrirModal('editar-meta', meta)}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${getBgColorClass(meta.cor)}`}>
                  <Icon className={`w-6 h-6 ${getTextColorClass(meta.cor)}`} />
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
                    R$ {meta.valor_atual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Meta</span>
                  <span className="font-bold text-white">
                    R$ {meta.valor_meta.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
                      className={`h-full bg-gradient-to-r transition-all duration-500 ${getColorClass(meta.cor)}`}
                      style={{ width: `${Math.min(100, progresso)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Faltante/Excedente */}
                <div className="pt-2 border-t border-gray-700">
                  <p className="text-xs text-gray-400">
                    {meta.inverso ? (
                      meta.valor_atual <= meta.valor_meta ? (
                        <>
                          <span className="text-green-400 font-medium">
                            R$ {(meta.valor_meta - meta.valor_atual).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                          {' '}disponível no orçamento
                        </>
                      ) : (
                        <>
                          <span className="text-red-400 font-medium">
                            R$ {(meta.valor_atual - meta.valor_meta).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                          {' '}acima do limite
                        </>
                      )
                    ) : (
                      progresso >= 100 ? (
                        <>
                          Meta atingida! 
                          <span className="text-green-400 font-medium">
                            {' '}+R$ {(meta.valor_atual - meta.valor_meta).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </>
                      ) : (
                        <>
                          Faltam{' '}
                          <span className="text-orange-400 font-medium">
                            R$ {(meta.valor_meta - meta.valor_atual).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </>
                      )
                    )}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ==================== HEALTH SCORE COMPONENT ====================

const HealthScore = ({ 
  resumoFinanceiro, 
  margemServicos, 
  estoqueCritico, 
  rankingFornecedores,
  evolucaoReceitas 
}) => {
  const [score, setScore] = useState(0);
  const [status, setStatus] = useState('');
  const [explicacao, setExplicacao] = useState('');

  useEffect(() => {
    const calcularHealthScore = () => {
      let totalScore = 0;
      let explicacoes = [];
      
      // 1. Saúde Financeira (40%)
      const margemLucro = resumoFinanceiro.margem_lucro || 0;
      const scoreFinanceiro = Math.min(100, (margemLucro / 30) * 100);
      totalScore += scoreFinanceiro * 0.4;
      
      if (margemLucro < 20) {
        explicacoes.push(`Margem de lucro baixa (${margemLucro.toFixed(1)}%).`);
      } else if (margemLucro > 35) {
        explicacoes.push(`Margem de lucro excelente (${margemLucro.toFixed(1)}%).`);
      }

      // 2. Margem de Serviços (20%)
      const mediaMargem = margemServicos?.reduce((acc, s) => acc + (s.margem || 0), 0) / (margemServicos?.length || 1) || 0;
      const scoreMargem = Math.min(100, (mediaMargem / 50) * 100);
      totalScore += scoreMargem * 0.2;
      
      if (mediaMargem < 30) {
        explicacoes.push(`Margem média dos serviços baixa (${mediaMargem.toFixed(1)}%).`);
      }

      // 3. Estoque (15%)
      const totalProdutosCriticos = estoqueCritico?.length || 0;
      const scoreEstoque = totalProdutosCriticos === 0 ? 100 : Math.max(0, 100 - (totalProdutosCriticos * 20));
      totalScore += scoreEstoque * 0.15;
      
      if (totalProdutosCriticos > 0) {
        explicacoes.push(`${totalProdutosCriticos} produto(s) em estoque crítico.`);
      }

      // 4. Dependência de Fornecedores (10%)
      const topFornecedorPercent = rankingFornecedores?.[0]?.percentual || 0;
      const scoreFornecedores = topFornecedorPercent > 50 ? Math.max(0, 100 - ((topFornecedorPercent - 50) * 2)) : 100;
      totalScore += scoreFornecedores * 0.1;
      
      if (topFornecedorPercent > 50) {
        explicacoes.push(`Alta dependência do fornecedor ${rankingFornecedores[0]?.nome} (${topFornecedorPercent.toFixed(1)}%).`);
      }

      // 5. Consistência de Vendas (15%)
      const receitas = evolucaoReceitas?.map(r => r.receita) || [];
      let scoreConsistencia = 100;
      if (receitas.length >= 3) {
        const variacao = Math.abs((receitas[receitas.length - 1] - receitas[0]) / receitas[0]) * 100;
        scoreConsistencia = Math.max(0, 100 - (variacao / 2));
        
        if (variacao > 30) {
          explicacoes.push(`Alta variação nas vendas (${variacao.toFixed(1)}%).`);
        }
      }
      totalScore += scoreConsistencia * 0.15;

      const finalScore = Math.round(totalScore);
      setScore(finalScore);

      if (finalScore >= 80) {
        setStatus('Excelente 🟢');
        if (explicacoes.length === 0) explicacoes.push('Seu salão está operando de forma excelente!');
      } else if (finalScore >= 60) {
        setStatus('Boa 🟡');
        if (explicacoes.length === 0) explicacoes.push('Seu salão está com saúde boa, mas há pontos de melhoria.');
      } else if (finalScore >= 40) {
        setStatus('Atenção 🟠');
      } else {
        setStatus('Crítica 🔴');
      }

      setExplicacao(explicacoes.join(' '));
    };

    calcularHealthScore();
  }, [resumoFinanceiro, margemServicos, estoqueCritico, rankingFornecedores, evolucaoReceitas]);

  const getScoreColor = () => {
    if (score >= 80) return 'from-green-500 to-emerald-500';
    if (score >= 60) return 'from-yellow-500 to-amber-500';
    if (score >= 40) return 'from-orange-500 to-red-500';
    return 'from-red-500 to-pink-500';
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-6">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-6">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-2">
            <Activity className="w-5 h-5 text-purple-400" />
            Saúde do Salão
          </h3>
          <p className="text-sm text-gray-400">
            Pontuação geral baseada em 5 pilares
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className={`px-6 py-3 rounded-xl bg-gradient-to-r ${getScoreColor()} text-white flex items-center gap-3`}>
            <span className="text-2xl font-bold">{score}</span>
            <div className="text-left">
              <p className="text-xs font-medium">{status}</p>
              <p className="text-xs opacity-80">de 100 pontos</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-400 mb-2">
          <span>0</span>
          <span>Pontuação</span>
          <span>100</span>
        </div>
        <div className="h-3 bg-gray-700/50 rounded-full overflow-hidden">
          <div 
            className={`h-full bg-gradient-to-r ${getScoreColor()} transition-all duration-1000`}
            style={{ width: `${score}%` }}
          ></div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Saúde Financeira</span>
          <span className="text-white font-medium">40%</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Margem de Serviços</span>
          <span className="text-white font-medium">20%</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Estoque</span>
          <span className="text-white font-medium">15%</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Dependência de Fornecedores</span>
          <span className="text-white font-medium">10%</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Consistência de Vendas</span>
          <span className="text-white font-medium">15%</span>
        </div>
      </div>

      {explicacao && (
        <div className="mt-6 p-4 bg-gray-700/30 rounded-xl border border-gray-600">
          <p className="text-sm text-gray-300">
            <strong>Análise da Luni:</strong> {explicacao}
          </p>
        </div>
      )}
    </div>
  );
};

// ==================== LUNI INSIGHTS COMPONENT ====================

const LuniInsights = ({ 
  resumoFinanceiro, 
  estoqueCritico, 
  rankingFornecedores,
  margemServicos 
}) => {
  const [insights, setInsights] = useState([]);

  useEffect(() => {
    const gerarInsights = () => {
      const novosInsights = [];

      // Estoque Crítico
      if (estoqueCritico?.length > 0) {
        novosInsights.push({
          tipo: 'alerta',
          titulo: 'Estoque Crítico',
          descricao: `${estoqueCritico.length} produto(s) estão abaixo do estoque mínimo.`,
          acao_sugerida: 'Faça um pedido urgente para evitar falta de produtos.'
        });
      }

      // Margem de Serviços
      const margemMedia = margemServicos?.reduce((acc, s) => acc + (s.margem || 0), 0) / (margemServicos?.length || 1) || 0;
      if (margemMedia < 30) {
        novosInsights.push({
          tipo: 'alerta',
          titulo: 'Margem de Serviços Baixa',
          descricao: `Sua margem média está em ${margemMedia.toFixed(1)}%.`,
          acao_sugerida: 'Reavalie preços ou negocie custos com fornecedores.'
        });
      }

      // Dependência de Fornecedores
      const topFornecedor = rankingFornecedores?.[0];
      if (topFornecedor?.percentual > 50) {
        novosInsights.push({
          tipo: 'informativo',
          titulo: 'Alta Dependência de Fornecedor',
          descricao: `${topFornecedor.nome} concentra ${topFornecedor.percentual.toFixed(1)}% dos gastos.`,
          acao_sugerida: 'Diversifique fornecedores para reduzir riscos.'
        });
      }

      // Saúde Financeira
      if (resumoFinanceiro.margem_lucro > 30) {
        novosInsights.push({
          tipo: 'oportunidade',
          titulo: 'Lucro Saudável',
          descricao: `Margem de lucro em ${resumoFinanceiro.margem_lucro.toFixed(1)}%.`,
          acao_sugerida: 'Considere investir em marketing ou expandir serviços.'
        });
      }

      // Consistência de Vendas
      if (resumoFinanceiro.total_vendas > 0) {
        const ticketMedio = resumoFinanceiro.receita_bruta / resumoFinanceiro.total_vendas;
        if (ticketMedio < 50) {
          novosInsights.push({
            tipo: 'oportunidade',
            titulo: 'Ticket Médio Baixo',
            descricao: `Ticket médio de R$ ${ticketMedio.toFixed(2)}.`,
            acao_sugerida: 'Upsell de serviços pode aumentar o valor médio.'
          });
        }
      }

      setInsights(novosInsights.slice(0, 3));
    };

    gerarInsights();
  }, [resumoFinanceiro, estoqueCritico, rankingFornecedores, margemServicos]);

  const getTipoColor = (tipo) => {
    switch (tipo) {
      case 'alerta': return 'border-red-500/30 bg-red-500/10';
      case 'oportunidade': return 'border-green-500/30 bg-green-500/10';
      case 'informativo': return 'border-blue-500/30 bg-blue-500/10';
      default: return 'border-gray-500/30 bg-gray-500/10';
    }
  };

  const getTipoIcon = (tipo) => {
    switch (tipo) {
      case 'alerta': return AlertTriangle;
      case 'oportunidade': return TrendingUp;
      case 'informativo': return Info;
      default: return Zap;
    }
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-400" />
            Insights da Luni
          </h3>
          <p className="text-sm text-gray-400 mt-1">Recomendações inteligentes para seu salão</p>
        </div>
      </div>

      {insights.length === 0 ? (
        <div className="text-center py-8">
          <Zap className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">Tudo sob controle! Continue monitorando.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {insights.map((insight, index) => {
            const Icon = getTipoIcon(insight.tipo);
            return (
              <div key={index} className={`p-4 rounded-xl border ${getTipoColor(insight.tipo)}`}>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-800/50 rounded-lg">
                    <Icon className="w-5 h-5 text-gray-300" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                        insight.tipo === 'alerta' ? 'bg-red-500/20 text-red-400' :
                        insight.tipo === 'oportunidade' ? 'bg-green-500/20 text-green-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {insight.tipo.charAt(0).toUpperCase() + insight.tipo.slice(1)}
                      </span>
                      <h4 className="font-bold text-white text-sm">{insight.titulo}</h4>
                    </div>
                    <p className="text-sm text-gray-300 mb-3">{insight.descricao}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">📌 Ação sugerida:</span>
                      <span className="text-xs font-medium text-gray-200">{insight.acao_sugerida}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ==================== COMPONENTE PRINCIPAL COMPLETO ====================

export const FinanceiroScreen = ({ onClose }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('visao-geral');
  
  const [modoPDV, setModoPDV] = useState(false);
  
  const [kpiFinanceiro, setKpiFinanceiro] = useState({});
  const [margemServicos, setMargemServicos] = useState([]);
  const [estoqueCritico, setEstoqueCritico] = useState([]);
  const [rankingFornecedores, setRankingFornecedores] = useState([]);
  const [evolucaoFinanceira, setEvolucaoFinanceira] = useState([]);
  const [distribuicaoDespesas, setDistribuicaoDespesas] = useState([]);

  const [modalAberto, setModalAberto] = useState(null);
  const [modalDados, setModalDados] = useState(null);

  const abrirModal = (tipo, dados = null) => {
    setModalAberto(tipo);
    setModalDados(dados);
  };

  const fecharModal = () => {
    setModalAberto(null);
    setModalDados(null);
  };

  const carregarDados = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    else setRefreshing(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      let salaoId = null;

      if (user) {
        const { data: usuario } = await supabase
          .from('usuarios')
          .select('salao_id')
          .eq('id', user.id)
          .single();
        
        if (usuario) salaoId = usuario.salao_id;
      }

      if (!salaoId) {
        console.error('Salão não encontrado');
        return;
      }

      const [
        kpiRes,
        margemRes,
        estoqueRes,
        fornecedoresRes,
        evolucaoRes,
        despesasRes
      ] = await Promise.all([
        supabase
          .from('vw_kpi_financeiro_salao')
          .select('*')
          .eq('salao_id', salaoId)
          .single(),
        
        supabase
          .from('vw_kpi_margem_servicos')
          .select('*')
          .eq('salao_id', salaoId)
          .limit(5),
        
        supabase
          .from('vw_estoque_critico')
          .select('*')
          .eq('salao_id', salaoId),
        
        supabase
          .from('vw_ranking_fornecedores')
          .select('*')
          .eq('salao_id', salaoId)
          .limit(5),
        
        supabase
          .from('eventos')
          .select('*')
          .eq('salao_id', salaoId)
          .order('data', { ascending: true })
          .limit(6),
        
        supabase
          .from('vw_despesas_por_categoria')
          .select('*')
          .eq('salao_id', salaoId)
      ]);

      if (kpiRes.data) setKpiFinanceiro(kpiRes.data);
      if (margemRes.data) setMargemServicos(margemRes.data);
      if (estoqueRes.data) setEstoqueCritico(estoqueRes.data);
      if (fornecedoresRes.data) setRankingFornecedores(fornecedoresRes.data);
      if (despesasRes.data) setDistribuicaoDespesas(despesasRes.data);
      
      if (evolucaoRes.data) {
        const meses = {};
        evolucaoRes.data.forEach(evento => {
          const mes = new Date(evento.data).toLocaleDateString('pt-BR', { month: 'short' });
          if (!meses[mes]) {
            meses[mes] = { receita: 0, despesa: 0, lucro: 0 };
          }
          if (evento.tipo === 'receita') {
            meses[mes].receita += evento.valor || 0;
          } else if (evento.tipo === 'despesa') {
            meses[mes].despesa += evento.valor || 0;
          }
          meses[mes].lucro = meses[mes].receita - meses[mes].despesa;
        });

        const evolucao = Object.entries(meses).map(([mes, dados]) => ({
          mes,
          receita: dados.receita,
          despesa: dados.despesa,
          lucro: dados.lucro
        }));

        setEvolucaoFinanceira(evolucao);
      }

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  if (modoPDV) {
    return <PDVScreen onVoltar={() => { setModoPDV(false); carregarDados(); }} />;
  }

  const tabs = [
    { id: 'visao-geral', label: 'Visão Geral', icon: Home },
    { id: 'despesas', label: 'Despesas', icon: Receipt },
    { id: 'estoque', label: 'Estoque', icon: Package },
    { id: 'fornecedores', label: 'Fornecedores', icon: Users },
    { id: 'metas', label: 'Metas', icon: Target },
    { id: 'relatorios', label: 'Relatórios', icon: FileText }
  ];

  const handleCardClick = (tipo) => {
    console.log(`Card ${tipo} clicado`);
    switch(tipo) {
      case 'receita':
        abrirModal('analise-receitas');
        break;
      case 'despesa':
        abrirModal('analise-despesas');
        break;
      case 'lucro':
        abrirModal('analise-lucro');
        break;
      case 'ticket':
        abrirModal('analise-ticket');
        break;
      default:
        break;
    }
  };

  const handleRefresh = () => {
    carregarDados(false);
  };

  const renderTabContent = () => {
    const commonProps = {
      onAbrirModal: abrirModal
    };

    switch (activeTab) {
      case 'visao-geral':
        return (
          <>
            <VisaoGeralTab 
              resumoFinanceiro={kpiFinanceiro}
              evolucaoReceitas={evolucaoFinanceira}
              margemServicos={margemServicos}
              estoqueCritico={estoqueCritico}
              rankingFornecedores={rankingFornecedores}
              loading={loading}
              onCardClick={handleCardClick}
              onAbrirModal={abrirModal}
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <HealthScore 
                resumoFinanceiro={kpiFinanceiro}
                margemServicos={margemServicos}
                estoqueCritico={estoqueCritico}
                rankingFornecedores={rankingFornecedores}
                evolucaoReceitas={evolucaoFinanceira}
              />
              <LuniInsights 
                resumoFinanceiro={kpiFinanceiro}
                estoqueCritico={estoqueCritico}
                rankingFornecedores={rankingFornecedores}
                margemServicos={margemServicos}
              />
            </div>
          </>
        );
      case 'despesas':
        return <DespesasTab {...commonProps} />;
      case 'estoque':
        return <EstoqueTab {...commonProps} />;
      case 'fornecedores':
        return <FornecedoresTab {...commonProps} />;
      case 'metas':
        return <MetasTab resumoFinanceiro={kpiFinanceiro} onAbrirModal={abrirModal} />;
      case 'relatorios':
        return (
          <div className="space-y-6">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-6">
              <h3 className="text-xl font-bold text-white mb-4">Relatórios</h3>
              <p className="text-gray-400 mb-6">Exporte relatórios detalhados do seu salão</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button 
                  onClick={() => abrirModal('preview-relatorio', { tipo: 'financeiro', periodo: 'mes_atual' })}
                  className="p-6 bg-gray-700/30 border border-gray-600 rounded-xl hover:bg-gray-700/50 transition-all text-left"
                >
                  <DollarSign className="w-8 h-8 text-green-400 mb-4" />
                  <h4 className="font-bold text-white mb-2">Relatório Financeiro</h4>
                  <p className="text-sm text-gray-400">Receitas, despesas e lucro detalhado</p>
                </button>
                <button 
                  onClick={() => abrirModal('preview-relatorio', { tipo: 'estoque', periodo: 'mes_atual' })}
                  className="p-6 bg-gray-700/30 border border-gray-600 rounded-xl hover:bg-gray-700/50 transition-all text-left"
                >
                  <Package className="w-8 h-8 text-blue-400 mb-4" />
                  <h4 className="font-bold text-white mb-2">Relatório de Estoque</h4>
                  <p className="text-sm text-gray-400">Giro, lucro e estoque crítico</p>
                </button>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-x-hidden">
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
                    Centro de Decisão do Salão
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2.5 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-xl transition-colors"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

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
            
            <button 
              onClick={() => setModoPDV(true)}
              className="ml-2 px-5 py-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-bold rounded-xl shadow-lg flex items-center gap-2 transition-transform hover:scale-105 whitespace-nowrap"
            >
              <ShoppingCart className="w-5 h-5" /> Abrir PDV
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 mb-10">
        {loading && activeTab === 'visao-geral' ? (
          <div className="flex flex-col items-center justify-center h-96">
            <Loader2 className="w-16 h-16 text-purple-500 animate-spin mb-4" />
            <p className="text-gray-400 font-medium">Carregando dados do salão...</p>
          </div>
        ) : (
          renderTabContent()
        )}
      </div>

      {/* Renderizar Modais */}
      {modalAberto === 'nova-despesa' && (
        <DespesaModal
          aberto={true}
          onFechar={fecharModal}
          onSucesso={handleRefresh}
        />
      )}

      {modalAberto === 'editar-despesa' && modalDados && (
        <DespesaModal
          aberto={true}
          onFechar={fecharModal}
          onSucesso={handleRefresh}
          despesa={modalDados}
        />
      )}

      {modalAberto === 'novo-produto' && (
        <ProdutoModal
          aberto={true}
          onFechar={fecharModal}
          onSucesso={handleRefresh}
        />
      )}

      {modalAberto === 'editar-produto' && modalDados && (
        <ProdutoModal
          aberto={true}
          onFechar={fecharModal}
          onSucesso={handleRefresh}
          produto={modalDados}
        />
      )}

      {modalAberto === 'entrada-estoque' && (
        <EstoqueModal
          aberto={true}
          onFechar={fecharModal}
          onSucesso={handleRefresh}
          produto={modalDados}
        />
      )}

      {modalAberto === 'novo-fornecedor' && (
        <FornecedorModal
          aberto={true}
          onFechar={fecharModal}
          onSucesso={handleRefresh}
        />
      )}

      {modalAberto === 'editar-fornecedor' && modalDados && (
        <FornecedorModal
          aberto={true}
          onFechar={fecharModal}
          onSucesso={handleRefresh}
          fornecedor={modalDados}
        />
      )}

      {modalAberto === 'nova-meta' && (
        <MetaModal
          aberto={true}
          onFechar={fecharModal}
          onSucesso={handleRefresh}
        />
      )}

      {modalAberto === 'editar-meta' && modalDados && (
        <MetaModal
          aberto={true}
          onFechar={fecharModal}
          onSucesso={handleRefresh}
          meta={modalDados}
        />
      )}

      {modalAberto === 'preview-relatorio' && (
        <RelatorioModal
          aberto={true}
          onFechar={fecharModal}
          tipo={modalDados?.tipo}
          periodo={modalDados?.periodo}
          dados={{
            resumo: kpiFinanceiro,
            evolucao: evolucaoFinanceira,
            despesas: distribuicaoDespesas,
            estoque: estoqueCritico,
            fornecedores: rankingFornecedores,
            margens: margemServicos
          }}
        />
      )}
    </div>
  );
};