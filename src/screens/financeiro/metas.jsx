import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../services/supabase';
import { 
  Target, TrendingUp, TrendingDown, BarChart3,
  DollarSign, Users, Award, CheckCircle,
  Plus, Edit, Trash2, Loader2, X, ChevronDown,
  Filter, Download, RefreshCw, AlertCircle, Sparkles,
  Save, XCircle, Calendar, Clock, ArrowUpRight,
  ArrowDownRight, Eye, EyeOff, TrendingUp as TrendingUpIcon,
  MoreVertical, Star, Trophy, Zap, Flag, AlertTriangle
} from 'lucide-react';
import {
  Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ComposedChart, Line, Cell,
  PieChart, Pie, Legend, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';

export const MetasScreen = ({ onClose }) => {
  // --- ESTADOS ---
  const [loading, setLoading] = useState(true);
  const [metas, setMetas] = useState([]);
  const [visualizacao, setVisualizacao] = useState('lista'); 
  const [tipoMeta, setTipoMeta] = useState('todos');
  const [anoSelecionado, setAnoSelecionado] = useState(new Date().getFullYear());
  const [anoAtivo, setAnoAtivo] = useState(new Date().getFullYear());
  const [estatisticas, setEstatisticas] = useState({
    totalMetas: 0, atingidas: 0, emAndamento: 0, naoAtingidas: 0, 
    taxaAtingimento: 0, valorTotalMetas: 0, valorTotalRealizado: 0
  });
  
  const [formMeta, setFormMeta] = useState({
    id: null,
    tipo: 'faturamento',
    valor: '',
    mes: new Date().getMonth() + 1,
    ano: new Date().getFullYear(),
    descricao: '',
    categoria: 'geral',
    prioridade: 'media',
    recorrente: false
  });
  
  const [filtroAtivo, setFiltroAtivo] = useState({
    status: 'todos',
    categoria: 'todas',
    prioridade: 'todas'
  });
  
  const [graficoAtivo, setGraficoAtivo] = useState('barra');
  const [mostrarResumo, setMostrarResumo] = useState(true);
  const [editandoMetaId, setEditandoMetaId] = useState(null);

  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  // --- EFEITOS ---
  useEffect(() => {
    carregarMetas();
  }, [anoSelecionado, filtroAtivo]);

  // --- LÓGICA DE DADOS ---
  const carregarMetas = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: usu } = await supabase
        .from('usuarios')
        .select('salao_id')
        .eq('id', user.id)
        .maybeSingle();

      if (!usu?.salao_id) return;

      let query = supabase
        .from('metas')
        .select('*')
        .eq('salao_id', usu.salao_id)
        .gte('mes', `${anoSelecionado}-01-01`)
        .lte('mes', `${anoSelecionado}-12-31`)
        .order('mes', { ascending: true });

      // Aplicar filtros
      if (filtroAtivo.status !== 'todos') {
        query = query.eq('status', filtroAtivo.status);
      }
      if (filtroAtivo.categoria !== 'todas') {
        query = query.eq('categoria', filtroAtivo.categoria);
      }
      if (filtroAtivo.prioridade !== 'todas') {
        query = query.eq('prioridade', filtroAtivo.prioridade);
      }

      const { data: metasData, error } = await query;
      if (error) throw error;

      if (metasData) {
        const metasComProgresso = await Promise.all(
          metasData.map(async (meta) => {
            const dataMeta = new Date(meta.mes);
            const mes = dataMeta.getUTCMonth() + 1;
            const ano = dataMeta.getUTCFullYear();
            
            let valorReal = 0;
            
            try {
              if (meta.tipo === 'faturamento') {
                const { data } = await supabase
                  .from('vw_faturamento_mensal')
                  .select('total_faturado')
                  .eq('salao_id', usu.salao_id)
                  .eq('ano', ano)
                  .eq('mes', mes)
                  .maybeSingle();
                valorReal = data?.total_faturado || 0;
              } else if (meta.tipo === 'clientes') {
                const { count } = await supabase
                  .from('agendamentos')
                  .select('cliente_id', { count: 'exact', head: true })
                  .eq('salao_id', usu.salao_id)
                  .eq('status', 'concluido')
                  .gte('data', `${ano}-${mes.toString().padStart(2, '0')}-01`)
                  .lte('data', `${ano}-${mes.toString().padStart(2, '0')}-31`);
                valorReal = count || 0;
              } else if (meta.tipo === 'ticket_medio') {
                const { data } = await supabase
                  .from('vw_faturamento_mensal')
                  .select('ticket_medio')
                  .eq('salao_id', usu.salao_id)
                  .eq('ano', ano)
                  .eq('mes', mes)
                  .maybeSingle();
                valorReal = data?.ticket_medio || 0;
              }
            } catch (err) {
              console.warn('Erro ao cargar valor real:', err);
            }

            const progresso = meta.valor > 0 ? (valorReal / meta.valor) * 100 : 0;
            
            return {
              ...meta,
              valorReal,
              progresso: Math.min(progresso, 100),
              status: progresso >= 100 ? 'atingida' : 
                     progresso >= 70 ? 'em_andamento' : 
                     'nao_atingida'
            };
          })
        );

        setMetas(metasComProgresso);
        calcularEstatisticas(metasComProgresso);
      }
    } catch (error) {
      console.error('Erro ao carregar metas:', error);
    } finally {
      setLoading(false);
    }
  };

  const calcularEstatisticas = (lista) => {
    const stats = {
      totalMetas: lista.length,
      atingidas: 0,
      emAndamento: 0,
      naoAtingidas: 0,
      taxaAtingimento: 0,
      valorTotalMetas: 0,
      valorTotalRealizado: 0
    };
    
    lista.forEach(m => {
      if (m.status === 'atingida') stats.atingidas++;
      else if (m.status === 'em_andamento') stats.emAndamento++;
      else stats.naoAtingidas++;
      
      stats.valorTotalMetas += parseFloat(m.valor || 0);
      stats.valorTotalRealizado += parseFloat(m.valorReal || 0);
    });
    
    stats.taxaAtingimento = stats.totalMetas > 0 
      ? (stats.atingidas / stats.totalMetas) * 100 
      : 0;
    
    setEstatisticas(stats);
  };

  // --- LÓGICA DO FORMULÁRIO ---
  const abrirNovaMeta = () => {
    setFormMeta({
      id: null,
      tipo: 'faturamento',
      valor: '',
      mes: new Date().getMonth() + 1,
      ano: anoSelecionado,
      descricao: '',
      categoria: 'geral',
      prioridade: 'media',
      recorrente: false
    });
    setVisualizacao('formulario');
  };

  const abrirEdicao = (meta) => {
    const dataMeta = new Date(meta.mes);
    setFormMeta({
      id: meta.id,
      tipo: meta.tipo,
      valor: meta.valor,
      mes: dataMeta.getUTCMonth() + 1,
      ano: dataMeta.getUTCFullYear(),
      descricao: meta.descricao,
      categoria: meta.categoria || 'geral',
      prioridade: meta.prioridade || 'media',
      recorrente: meta.recorrente || false
    });
    setEditandoMetaId(meta.id);
    setVisualizacao('formulario');
  };

  const salvarMeta = async (e) => {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: usu } = await supabase
        .from('usuarios')
        .select('salao_id')
        .eq('id', user.id)
        .maybeSingle();
      
      if (!usu?.salao_id) return;

      const dataMes = new Date(Date.UTC(formMeta.ano, formMeta.mes - 1, 1, 12, 0, 0));
      
      const dadosParaSalvar = {
        salao_id: usu.salao_id,
        tipo: formMeta.tipo,
        valor: parseFloat(formMeta.valor || 0),
        mes: dataMes.toISOString(),
        descricao: formMeta.descricao || `${formMeta.tipo.charAt(0).toUpperCase() + formMeta.tipo.slice(1)} ${meses[formMeta.mes - 1]}`,
        categoria: formMeta.categoria,
        prioridade: formMeta.prioridade,
        recorrente: formMeta.recorrente
      };

      let error;
      if (formMeta.id) {
        const res = await supabase
          .from('metas')
          .update({ 
            ...dadosParaSalvar, 
            updated_at: new Date().toISOString() 
          })
          .eq('id', formMeta.id);
        error = res.error;
      } else {
        const res = await supabase
          .from('metas')
          .insert([{ 
            ...dadosParaSalvar, 
            created_at: new Date().toISOString() 
          }]);
        error = res.error;
      }

      if (error) throw error;

      // Feedback visual
      if (formMeta.id) {
        alert('🎉 Meta atualizada com sucesso!');
      } else {
        alert('✨ Nova meta criada com sucesso!');
      }
      
      setVisualizacao('lista');
      setEditandoMetaId(null);
      carregarMetas();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('❌ Erro ao salvar meta. Tente novamente.');
    }
  };

  const handleExcluir = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta meta?')) {
      try {
        await supabase.from('metas').delete().eq('id', id);
        alert('✅ Meta excluída com sucesso!');
        carregarMetas();
      } catch (error) {
        console.error('Erro ao excluir:', error);
        alert('❌ Erro ao excluir meta.');
      }
    }
  };

  // --- DADOS PARA GRÁFICOS ---
  const dadosGraficoBarra = useMemo(() => {
    return metas
      .filter(meta => tipoMeta === 'todos' || meta.tipo === tipoMeta)
      .map(meta => {
        const data = new Date(meta.mes);
        return {
          mes: meses[data.getUTCMonth()].substring(0, 3),
          meta: meta.valor,
          real: meta.valorReal,
          progresso: meta.progresso,
          status: meta.status
        };
      });
  }, [metas, tipoMeta]);

  const dadosGraficoPizza = useMemo(() => {
    const statusCount = {
      atingida: 0,
      em_andamento: 0,
      nao_atingida: 0
    };
    
    metas.forEach(meta => {
      statusCount[meta.status]++;
    });
    
    return [
      { name: 'Atingidas', value: statusCount.atingida, color: '#10B981' },
      { name: 'Em Andamento', value: statusCount.em_andamento, color: '#F59E0B' },
      { name: 'Não Atingidas', value: statusCount.nao_atingida, color: '#EF4444' }
    ].filter(item => item.value > 0);
  }, [metas]);

  const dadosGraficoRadar = useMemo(() => {
    const performanceByMonth = meses.map((mes, index) => {
      const metasDoMes = metas.filter(m => new Date(m.mes).getUTCMonth() === index);
      const mediaProgresso = metasDoMes.length > 0
        ? metasDoMes.reduce((sum, m) => sum + m.progresso, 0) / metasDoMes.length
        : 0;
      
      return {
        subject: mes.substring(0, 3),
        performance: Math.min(mediaProgresso, 100)
      };
    });
    
    return performanceByMonth;
  }, [metas]);

  // --- COMPONENTES DE UI ---
  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color = 'purple',
    trend = null,
    trendValue = 0,
    loading = false 
  }) => {
    const colorClasses = {
      purple: 'bg-purple-50 text-purple-600 border-purple-100',
      green: 'bg-green-50 text-green-600 border-green-100',
      blue: 'bg-blue-50 text-blue-600 border-blue-100',
      orange: 'bg-orange-50 text-orange-600 border-orange-100',
      red: 'bg-red-50 text-red-600 border-red-100'
    };
    
    return (
      <div className={`p-6 rounded-2xl border-2 ${colorClasses[color]} transition-all hover:scale-[1.02] hover:shadow-lg`}>
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-semibold text-gray-500">{title}</span>
          <div className="p-2.5 rounded-xl bg-white shadow-sm">
            <Icon className="w-5 h-5" />
          </div>
        </div>
        
        {loading ? (
          <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        ) : (
          <>
            <div className="text-2xl font-bold text-gray-900 mb-2">{value}</div>
            {trend && (
              <div className={`flex items-center gap-1 text-sm font-medium ${
                trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                {trend === 'up' ? 
                  <ArrowUpRight className="w-4 h-4" /> : 
                  <ArrowDownRight className="w-4 h-4" />
                }
                <span>{trendValue}%</span>
                <span className="text-gray-400 ml-2">vs mês anterior</span>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  const MetaCard = ({ meta }) => {
    const Icon = getMetaIcon(meta.tipo);
    const data = new Date(meta.mes);
    const statusColor = getStatusColor(meta.status);
    const prioridadeColor = getPrioridadeColor(meta.prioridade);
    
    return (
      <div className="group bg-white p-6 rounded-2xl border-2 border-gray-100 hover:border-purple-200 transition-all hover:shadow-xl">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-xl ${getMetaColor(meta.tipo).split(' ')[1]} shadow-sm`}>
              <Icon className={`w-6 h-6 ${getMetaColor(meta.tipo).split(' ')[0]}`} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-gray-900">{meta.descricao}</h3>
                {meta.recorrente && (
                  <span className="px-2 py-1 text-xs font-medium bg-blue-50 text-blue-600 rounded-full flex items-center gap-1">
                    <RefreshCw className="w-3 h-3" />
                    Recorrente
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {meses[data.getUTCMonth()]} {data.getUTCFullYear()}
                </span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${prioridadeColor}`}>
                  {meta.prioridade === 'alta' ? '🔥 Alta' : 
                   meta.prioridade === 'media' ? '⚡ Média' : '🌱 Baixa'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1.5 text-sm font-bold rounded-full ${statusColor}`}>
              {meta.status === 'atingida' ? '🎯 Atingida' : 
               meta.status === 'em_andamento' ? '📈 Em Andamento' : '⏳ Não Atingida'}
            </span>
            
            <div className="relative">
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                <MoreVertical className="w-5 h-5" />
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-xl z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => abrirEdicao(meta)}
                  className="w-full px-4 py-3 text-left text-gray-700 hover:bg-purple-50 flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Editar Meta
                </button>
                <button
                  onClick={() => handleExcluir(meta.id)}
                  className="w-full px-4 py-3 text-left text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Barra de Progresso */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-600">Progresso</span>
            <span className="text-lg font-bold text-gray-900">{meta.progresso.toFixed(1)}%</span>
          </div>
          <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`absolute h-full rounded-full transition-all duration-1000 ${
                meta.progresso >= 100 ? 'bg-gradient-to-r from-green-500 to-emerald-400' :
                meta.progresso >= 70 ? 'bg-gradient-to-r from-yellow-500 to-amber-400' :
                'bg-gradient-to-r from-purple-500 to-pink-500'
              }`}
              style={{ width: `${meta.progresso}%` }}
            />
          </div>
        </div>
        
        {/* Valores */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-xl">
            <div className="text-xs text-gray-500 mb-1">Meta</div>
            <div className="text-lg font-bold text-gray-900">
              {meta.tipo === 'clientes' 
                ? `${meta.valor} clientes`
                : `R$ ${parseFloat(meta.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
              }
            </div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-xl">
            <div className="text-xs text-gray-500 mb-1">Realizado</div>
            <div className={`text-lg font-bold ${
              meta.valorReal >= meta.valor ? 'text-green-600' : 'text-gray-900'
            }`}>
              {meta.tipo === 'clientes'
                ? `${meta.valorReal} clientes`
                : `R$ ${parseFloat(meta.valorReal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
              }
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderHeader = () => (
    <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {visualizacao === 'lista' ? 'Gestão de Metas' : 
                   formMeta.id ? 'Editar Meta' : 'Nova Meta'}
                </h1>
                <p className="text-sm text-gray-500">
                  {visualizacao === 'lista' ? 'Defina e acompanhe seus objetivos' : 'Configure sua meta'}
                </p>
              </div>
            </div>
          </div>
          
          {visualizacao === 'lista' && (
            <div className="flex items-center gap-3">
              <div className="relative">
                <select
                  value={anoSelecionado}
                  onChange={(e) => setAnoSelecionado(parseInt(e.target.value))}
                  className="pl-4 pr-10 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {[2022, 2023, 2024, 2025, 2026, 2027].map(ano => (
                    <option key={ano} value={ano}>{ano}</option>
                  ))}
                </select>
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
              
              <button
                onClick={() => setMostrarResumo(!mostrarResumo)}
                className="p-2 hover:bg-gray-100 rounded-lg"
                title={mostrarResumo ? 'Ocultar resumo' : 'Mostrar resumo'}
              >
                {mostrarResumo ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
              
              <button
                onClick={abrirNovaMeta}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 flex items-center gap-2 font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                <Plus className="w-5 h-5" />
                Nova Meta
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderLista = () => {
    const metasFiltradas = metas.filter(meta => 
      (tipoMeta === 'todos' || meta.tipo === tipoMeta) &&
      (filtroAtivo.status === 'todos' || meta.status === filtroAtivo.status) &&
      (filtroAtivo.categoria === 'todas' || meta.categoria === filtroAtivo.categoria) &&
      (filtroAtivo.prioridade === 'todas' || meta.prioridade === filtroAtivo.prioridade)
    );

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtros */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Suas Metas</h2>
              <p className="text-gray-500">Acompanhe o progresso dos seus objetivos</p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setGraficoAtivo('barra')}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                  graficoAtivo === 'barra' 
                    ? 'bg-purple-100 text-purple-700' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                Barras
              </button>
              <button
                onClick={() => setGraficoAtivo('pizza')}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                  graficoAtivo === 'pizza' 
                    ? 'bg-purple-100 text-purple-700' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Target className="w-4 h-4" />
                Pizza
              </button>
              <button
                onClick={() => setGraficoAtivo('radar')}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                  graficoAtivo === 'radar' 
                    ? 'bg-purple-100 text-purple-700' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Zap className="w-4 h-4" />
                Radar
              </button>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
                <select
                  value={tipoMeta}
                  onChange={(e) => setTipoMeta(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="todos">Todos os Tipos</option>
                  <option value="faturamento">Faturamento</option>
                  <option value="clientes">Clientes</option>
                  <option value="ticket_medio">Ticket Médio</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={filtroAtivo.status}
                  onChange={(e) => setFiltroAtivo(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="todos">Todos os Status</option>
                  <option value="atingida">Atingidas</option>
                  <option value="em_andamento">Em Andamento</option>
                  <option value="nao_atingida">Não Atingidas</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Prioridade</label>
                <select
                  value={filtroAtivo.prioridade}
                  onChange={(e) => setFiltroAtivo(prev => ({ ...prev, prioridade: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="todas">Todas as Prioridades</option>
                  <option value="alta">Alta</option>
                  <option value="media">Média</option>
                  <option value="baixa">Baixa</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Estatísticas */}
        {mostrarResumo && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total de Metas"
              value={estatisticas.totalMetas}
              icon={Target}
              color="purple"
            />
            <StatCard
              title="Atingidas"
              value={estatisticas.atingidas}
              icon={CheckCircle}
              color="green"
              trend="up"
              trendValue={15}
            />
            <StatCard
              title="Em Andamento"
              value={estatisticas.emAndamento}
              icon={TrendingUp}
              color="blue"
            />
            <StatCard
              title="Taxa de Sucesso"
              value={`${estatisticas.taxaAtingimento.toFixed(1)}%`}
              icon={Trophy}
              color="orange"
            />
          </div>
        )}

        {/* Gráficos */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Visualização de Performance</h3>
            
            {graficoAtivo === 'barra' && (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={dadosGraficoBarra}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="mes" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar 
                      dataKey="meta" 
                      name="Meta" 
                      fill="#DDD6FE" 
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar 
                      dataKey="real" 
                      name="Realizado" 
                      fill="#8B5CF6" 
                      radius={[4, 4, 0, 0]}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="progresso" 
                      name="Progresso %" 
                      stroke="#10B981" 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}
            
            {graficoAtivo === 'pizza' && dadosGraficoPizza.length > 0 && (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dadosGraficoPizza}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {dadosGraficoPizza.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
            
            {graficoAtivo === 'radar' && (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={dadosGraficoRadar}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar
                      name="Performance"
                      dataKey="performance"
                      stroke="#8B5CF6"
                      fill="#8B5CF6"
                      fillOpacity={0.3}
                    />
                    <Legend />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Lista de Metas */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Metas ({metasFiltradas.length})</h3>
              <p className="text-sm text-gray-500">
                Mostrando {metasFiltradas.length} de {metas.length} metas
              </p>
            </div>
            
            {loading && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                Carregando...
              </div>
            )}
          </div>
          
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-12 h-12 text-purple-600 animate-spin" />
            </div>
          ) : metasFiltradas.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-300">
              <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                <Flag className="w-12 h-12 text-purple-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Nenhuma meta encontrada</h3>
              <p className="text-gray-500 mb-6">Crie sua primeira meta ou ajuste os filtros</p>
              <button
                onClick={abrirNovaMeta}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                <Plus className="w-5 h-5 inline mr-2" />
                Criar Primeira Meta
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {metasFiltradas.map(meta => (
                <MetaCard key={meta.id} meta={meta} />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderFormulario = () => {
    const tiposMeta = [
      { id: 'faturamento', label: 'Faturamento', icon: DollarSign, desc: 'Valor total a ser faturado' },
      { id: 'clientes', label: 'Clientes', icon: Users, desc: 'Quantidade de clientes atendidos' },
      { id: 'ticket_medio', label: 'Ticket Médio', icon: Award, desc: 'Valor médio por atendimento' }
    ];

    const prioridades = [
      { id: 'alta', label: 'Alta', icon: Flag, color: 'bg-red-50 text-red-600', desc: 'Meta crítica para o negócio' },
      { id: 'media', label: 'Média', icon: Target, color: 'bg-yellow-50 text-yellow-600', desc: 'Meta importante' },
      { id: 'baixa', label: 'Baixa', icon: TrendingUp, color: 'bg-green-50 text-green-600', desc: 'Meta secundária' }
    ];

    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-xl">
          {/* Cabeçalho do Formulário */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  <Target className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {formMeta.id ? 'Editar Meta' : 'Criar Nova Meta'}
                  </h2>
                  <p className="text-white/80">Preencha os detalhes para definir seu objetivo</p>
                </div>
              </div>
              
              <button
                onClick={() => {
                  setVisualizacao('lista');
                  setEditandoMetaId(null);
                }}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>

          {/* Formulário */}
          <form onSubmit={salvarMeta} className="p-8 space-y-8">
            {/* Passo 1: Tipo de Meta */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <span className="font-bold text-purple-600">1</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Tipo de Meta</h3>
                  <p className="text-gray-500">Selecione o tipo de objetivo que deseja alcançar</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {tiposMeta.map(tipo => {
                  const Icon = tipo.icon;
                  const isActive = formMeta.tipo === tipo.id;
                  
                  return (
                    <button
                      key={tipo.id}
                      type="button"
                      onClick={() => setFormMeta(prev => ({ ...prev, tipo: tipo.id }))}
                      className={`p-6 border-2 rounded-2xl text-left transition-all ${
                        isActive
                          ? 'border-purple-600 bg-purple-50 shadow-lg shadow-purple-100'
                          : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-4 mb-4">
                        <div className={`p-3 rounded-xl ${
                          isActive ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-500'
                        }`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <span className={`font-bold ${
                          isActive ? 'text-purple-700' : 'text-gray-700'
                        }`}>
                          {tipo.label}
                        </span>
                      </div>
                      <p className={`text-sm ${
                        isActive ? 'text-purple-600' : 'text-gray-500'
                      }`}>
                        {tipo.desc}
                      </p>
                      {isActive && (
                        <div className="mt-4 flex justify-end">
                          <CheckCircle className="w-6 h-6 text-purple-600" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Passo 2: Período */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <span className="font-bold text-purple-600">2</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Período</h3>
                  <p className="text-gray-500">Defina quando esta meta deve ser alcançada</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Mês</label>
                  <div className="relative">
                    <select
                      value={formMeta.mes}
                      onChange={(e) => setFormMeta(prev => ({ ...prev, mes: parseInt(e.target.value) }))}
                      className="w-full pl-4 pr-10 py-3.5 border-2 border-gray-200 rounded-xl bg-white focus:border-purple-500 focus:ring-0 outline-none font-medium appearance-none"
                    >
                      {meses.map((mes, index) => (
                        <option key={index} value={index + 1}>{mes}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Ano</label>
                  <div className="relative">
                    <select
                      value={formMeta.ano}
                      onChange={(e) => setFormMeta(prev => ({ ...prev, ano: parseInt(e.target.value) }))}
                      className="w-full pl-4 pr-10 py-3.5 border-2 border-gray-200 rounded-xl bg-white focus:border-purple-500 focus:ring-0 outline-none font-medium appearance-none"
                    >
                      {[2023, 2024, 2025, 2026, 2027, 2028].map(ano => (
                        <option key={ano} value={ano}>{ano}</option>
                      ))}
                    </select>
                    <Calendar className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Passo 3: Valor e Prioridade */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <span className="font-bold text-purple-600">3</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Valor e Prioridade</h3>
                  <p className="text-gray-500">Defina o valor alvo e a importância desta meta</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Valor da Meta *
                  </label>
                  <div className="relative">
                    {formMeta.tipo !== 'clientes' && (
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                        <span className="text-lg font-bold text-gray-700">R$</span>
                      </div>
                    )}
                    <input
                      type="number"
                      step={formMeta.tipo === 'clientes' ? '1' : '0.01'}
                      required
                      min="0"
                      className={`w-full border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-0 py-4 pr-4 outline-none font-bold text-xl ${
                        formMeta.tipo !== 'clientes' ? 'pl-12' : 'pl-6'
                      }`}
                      value={formMeta.valor}
                      onChange={(e) => setFormMeta(prev => ({ ...prev, valor: e.target.value }))}
                      placeholder={formMeta.tipo === 'clientes' ? 'Quantidade de clientes' : '0,00'}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Prioridade</label>
                  <div className="grid grid-cols-3 gap-2">
                    {prioridades.map(prioridade => {
                      const Icon = prioridade.icon;
                      const isActive = formMeta.prioridade === prioridade.id;
                      
                      return (
                        <button
                          key={prioridade.id}
                          type="button"
                          onClick={() => setFormMeta(prev => ({ ...prev, prioridade: prioridade.id }))}
                          className={`p-4 border-2 rounded-xl text-center transition-all ${
                            isActive
                              ? `${prioridade.color} border-current shadow-lg`
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <Icon className={`w-5 h-5 mx-auto mb-2 ${
                            isActive ? 'text-current' : 'text-gray-400'
                          }`} />
                          <span className={`text-sm font-medium ${
                            isActive ? 'text-current' : 'text-gray-600'
                          }`}>
                            {prioridade.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Passo 4: Detalhes Adicionais */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <span className="font-bold text-purple-600">4</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Detalhes Adicionais</h3>
                  <p className="text-gray-500">Adicione informações extras sobre esta meta</p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Descrição (Opcional)
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-0 outline-none"
                    value={formMeta.descricao}
                    onChange={(e) => setFormMeta(prev => ({ ...prev, descricao: e.target.value }))}
                    placeholder="Ex: Meta principal de faturamento para Janeiro"
                  />
                </div>
                
                <div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={formMeta.recorrente}
                        onChange={(e) => setFormMeta(prev => ({ ...prev, recorrente: e.target.checked }))}
                        className="sr-only"
                      />
                      <div className={`w-12 h-6 rounded-full transition-colors ${
                        formMeta.recorrente ? 'bg-purple-600' : 'bg-gray-300'
                      }`}>
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          formMeta.recorrente ? 'left-7' : 'left-1'
                        }`} />
                      </div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">Meta Recorrente</span>
                      <p className="text-sm text-gray-500">
                        Esta meta se repete automaticamente todo mês
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Ações */}
            <div className="flex gap-4 pt-8 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  setVisualizacao('lista');
                  setEditandoMetaId(null);
                }}
                className="px-8 py-4 border-2 border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all"
              >
                Cancelar
              </button>
              
              <button
                type="submit"
                className="flex-1 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
              >
                <Save className="w-6 h-6" />
                {formMeta.id ? 'Atualizar Meta' : 'Criar Meta'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // --- HELPER FUNCTIONS ---
  const getMetaIcon = (tipo) => {
    switch (tipo) {
      case 'faturamento': return DollarSign;
      case 'clientes': return Users;
      case 'ticket_medio': return Award;
      default: return Target;
    }
  };

  const getMetaColor = (tipo) => {
    switch (tipo) {
      case 'faturamento': return 'text-green-600 bg-green-100';
      case 'clientes': return 'text-blue-600 bg-blue-100';
      case 'ticket_medio': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'atingida': return 'bg-green-100 text-green-800 ring-2 ring-green-200';
      case 'em_andamento': return 'bg-yellow-100 text-yellow-800 ring-2 ring-yellow-200';
      case 'nao_atingida': return 'bg-red-100 text-red-800 ring-2 ring-red-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPrioridadeColor = (prioridade) => {
    switch (prioridade) {
      case 'alta': return 'bg-red-50 text-red-700 ring-1 ring-red-200';
      case 'media': return 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200';
      case 'baixa': return 'bg-green-50 text-green-700 ring-1 ring-green-200';
      default: return 'bg-gray-50 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {renderHeader()}
      
      {visualizacao === 'lista' ? renderLista() : renderFormulario()}
      
      {loading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-purple-600 animate-spin" />
            <p className="text-gray-700 font-medium">Carregando metas...</p>
          </div>
        </div>
      )}
    </div>
  );
};