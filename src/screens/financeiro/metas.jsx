import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { 
  Target, TrendingUp, BarChart3,
  DollarSign, Users, Award, CheckCircle,
  Plus, Edit, Trash2, Loader2, X,
  RefreshCw, ArrowLeft, AlertTriangle
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, LineChart, Line, ComposedChart
} from 'recharts';

export const MetasScreen = ({ onClose }) => {
  const [loading, setLoading] = useState(true);
  const [metas, setMetas] = useState([]);
  const [showNovaMeta, setShowNovaMeta] = useState(false);
  const [showEditarMeta, setShowEditarMeta] = useState(false);
  const [tipoMeta, setTipoMeta] = useState('todos'); // Alterado padrão para 'todos'
  const [anoSelecionado, setAnoSelecionado] = useState(new Date().getFullYear());
  const [estatisticas, setEstatisticas] = useState({
    totalMetas: 0,
    atingidas: 0,
    emAndamento: 0,
    naoAtingidas: 0,
    taxaAtingimento: 0
  });

  // Formulário nova meta
  const [novaMeta, setNovaMeta] = useState({
    tipo: 'faturamento',
    valor: '',
    mes: new Date().getMonth() + 1,
    ano: new Date().getFullYear(),
    descricao: '',
    categoria: 'geral'
  });

  // Formulário editar meta
  const [metaEditando, setMetaEditando] = useState(null);

  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  useEffect(() => {
    carregarMetas();
  }, [anoSelecionado]);

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

      // Carregar metas existentes
      const { data: metasData, error } = await supabase
        .from('metas')
        .select('*')
        .eq('salao_id', usu.salao_id)
        .gte('mes', `${anoSelecionado}-01-01`)
        .lte('mes', `${anoSelecionado}-12-31`)
        .order('mes', { ascending: true });

      if (error) throw error;

      if (metasData) {
        // Carregar dados reais para comparar
        const metasComProgresso = await Promise.all(
          metasData.map(async (meta) => {
            const dataMeta = new Date(meta.mes);
            const mes = dataMeta.getMonth() + 1;
            const ano = dataMeta.getFullYear();
            
            let valorReal = 0;
            
            // Buscar dados reais baseados no tipo de meta
            if (meta.tipo === 'faturamento') {
              const { data: faturamento } = await supabase
                .from('vw_faturamento_mensal')
                .select('total_faturado')
                .eq('salao_id', usu.salao_id)
                .eq('ano', ano)
                .eq('mes', mes)
                .maybeSingle();
              
              valorReal = faturamento?.total_faturado || 0;
            } else if (meta.tipo === 'clientes') {
              // Contar agendamentos únicos (clientes distintos no mês)
              const { count } = await supabase
                .from('agendamentos')
                .select('cliente_id', { count: 'exact', head: true })
                .eq('salao_id', usu.salao_id)
                .eq('status', 'concluido')
                .gte('data', `${ano}-${mes.toString().padStart(2, '0')}-01`)
                .lte('data', `${ano}-${mes.toString().padStart(2, '0')}-31`);
              
              valorReal = count || 0;
            } else if (meta.tipo === 'ticket_medio') {
              const { data: ticket } = await supabase
                .from('vw_faturamento_mensal')
                .select('ticket_medio')
                .eq('salao_id', usu.salao_id)
                .eq('ano', ano)
                .eq('mes', mes)
                .maybeSingle();
              
              valorReal = ticket?.ticket_medio || 0;
            }

            const progresso = meta.valor > 0 ? (valorReal / meta.valor) * 100 : 0;
            
            return {
              ...meta,
              valorReal,
              progresso: Math.min(progresso, 100),
              status: progresso >= 100 ? 'atingida' : 
                      progresso >= 70 ? 'em_andamento' : 'nao_atingida'
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

  const calcularEstatisticas = (metasLista) => {
    const estatisticasCalc = {
      totalMetas: metasLista.length,
      atingidas: 0,
      emAndamento: 0,
      naoAtingidas: 0,
      taxaAtingimento: 0
    };

    metasLista.forEach(meta => {
      if (meta.status === 'atingida') estatisticasCalc.atingidas++;
      else if (meta.status === 'em_andamento') estatisticasCalc.emAndamento++;
      else estatisticasCalc.naoAtingidas++;
    });

    estatisticasCalc.taxaAtingimento = estatisticasCalc.totalMetas > 0 
      ? (estatisticasCalc.atingidas / estatisticasCalc.totalMetas) * 100 
      : 0;

    setEstatisticas(estatisticasCalc);
  };

  const handleNovaMeta = async (e) => {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: usu } = await supabase.from('usuarios').select('salao_id').eq('id', user.id).maybeSingle();

      if (!usu?.salao_id) return;

      // Criar data ajustada para UTC para evitar problemas de fuso horário
      const dataMes = new Date(Date.UTC(novaMeta.ano, novaMeta.mes - 1, 1, 12, 0, 0));

      const { error } = await supabase.from('metas').insert([{
        salao_id: usu.salao_id,
        tipo: novaMeta.tipo,
        valor: parseFloat(novaMeta.valor),
        mes: dataMes.toISOString(),
        descricao: novaMeta.descricao || `${novaMeta.tipo.charAt(0).toUpperCase() + novaMeta.tipo.slice(1)} ${meses[novaMeta.mes - 1]}`,
        categoria: novaMeta.categoria,
        created_at: new Date().toISOString()
      }]);

      if (error) throw error;

      setNovaMeta({
        tipo: 'faturamento',
        valor: '',
        mes: new Date().getMonth() + 1,
        ano: new Date().getFullYear(),
        descricao: '',
        categoria: 'geral'
      });
      
      setShowNovaMeta(false);
      carregarMetas();
      alert('Meta cadastrada com sucesso!');
    } catch (error) {
      console.error('Erro ao cadastrar meta:', error);
      alert('Erro ao cadastrar meta.');
    }
  };

  const handleEditarMeta = async (e) => {
    e.preventDefault();
    if (!metaEditando) return;

    try {
      const dataMes = new Date(Date.UTC(metaEditando.ano, metaEditando.mes - 1, 1, 12, 0, 0));

      const { error } = await supabase
        .from('metas')
        .update({
          tipo: metaEditando.tipo,
          valor: parseFloat(metaEditando.valor),
          mes: dataMes.toISOString(),
          descricao: metaEditando.descricao,
          categoria: metaEditando.categoria,
          updated_at: new Date().toISOString()
        })
        .eq('id', metaEditando.id);

      if (error) throw error;

      setShowEditarMeta(false);
      setMetaEditando(null);
      carregarMetas();
      alert('Meta atualizada!');
    } catch (error) {
      console.error('Erro ao atualizar meta:', error);
      alert('Erro ao atualizar meta.');
    }
  };

  const iniciarEdicaoMeta = (meta) => {
    const dataMeta = new Date(meta.mes);
    setMetaEditando({
      id: meta.id,
      tipo: meta.tipo,
      valor: meta.valor.toString(),
      mes: dataMeta.getUTCMonth() + 1, // Usar UTC para garantir o mês correto
      ano: dataMeta.getUTCFullYear(),
      descricao: meta.descricao,
      categoria: meta.categoria || 'geral'
    });
    setShowEditarMeta(true);
  };

  const handleExcluirMeta = async (id) => {
    if (!confirm('Tem certeza que deseja excluir esta meta?')) return;
    try {
      const { error } = await supabase.from('metas').delete().eq('id', id);
      if (error) throw error;
      carregarMetas();
    } catch (error) {
      console.error('Erro ao excluir:', error);
    }
  };

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
      case 'faturamento': return 'text-green-600 bg-green-50';
      case 'clientes': return 'text-blue-600 bg-blue-50';
      case 'ticket_medio': return 'text-purple-600 bg-purple-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'atingida': return 'bg-green-100 text-green-800';
      case 'em_andamento': return 'bg-yellow-100 text-yellow-800';
      case 'nao_atingida': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Preparar dados para gráfico
  const dadosGrafico = metas
    .filter(meta => tipoMeta === 'todos' || meta.tipo === tipoMeta)
    .map(meta => {
        const data = new Date(meta.mes);
        return {
        mes: meses[data.getUTCMonth()].substring(0, 3),
        meta: meta.valor,
        real: meta.valorReal,
        progresso: meta.progresso
        };
    });

  return (
    <div className="fixed inset-0 bg-gray-50 z-50 overflow-y-auto">
      {/* Header com Botão Voltar */}
      <div className="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            
            {/* Esquerda: Botão Voltar + Título */}
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <button
                onClick={onClose}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Voltar</span>
              </button>
              <div className="h-6 w-px bg-gray-300 hidden sm:block"></div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Target className="w-6 h-6 text-purple-600" />
                  Gestão de Metas
                </h1>
              </div>
            </div>

            {/* Direita: Ações e Filtro de Ano */}
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <div className="relative">
                    <select
                        className="appearance-none pl-4 pr-10 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        value={anoSelecionado}
                        onChange={(e) => setAnoSelecionado(parseInt(e.target.value))}
                    >
                        {[2024, 2025, 2026, 2027, 2028].map(ano => (
                            <option key={ano} value={ano}>{ano}</option>
                        ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                </div>

                <button
                    onClick={carregarMetas}
                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Atualizar"
                >
                    <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
              
                <button
                    onClick={() => setShowNovaMeta(true)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 shadow-sm transition-all hover:shadow-md"
                >
                    <Plus className="w-4 h-4" />
                    <span className="text-sm font-medium">Nova Meta</span>
                </button>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total de Metas</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{estatisticas.totalMetas}</p>
                </div>
                <div className="p-2 bg-gray-100 rounded-lg">
                    <Target className="w-5 h-5 text-gray-500" />
                </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Atingidas</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">{estatisticas.atingidas}</p>
                </div>
                <div className="p-2 bg-green-50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Em Andamento</p>
                    <p className="text-2xl font-bold text-yellow-600 mt-1">{estatisticas.emAndamento}</p>
                </div>
                <div className="p-2 bg-yellow-50 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-yellow-600" />
                </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Taxa de Sucesso</p>
                    <p className="text-2xl font-bold text-purple-600 mt-1">{estatisticas.taxaAtingimento.toFixed(1)}%</p>
                </div>
                <div className="p-2 bg-purple-50 rounded-lg">
                    <BarChart3 className="w-5 h-5 text-purple-600" />
                </div>
            </div>
          </div>
        </div>

        {/* Gráfico de Progresso */}
        {dadosGrafico.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">📈 Progresso Anual</h3>
                <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                    <span className="text-gray-600">Meta</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded"></div>
                    <span className="text-gray-600">Realizado</span>
                </div>
                </div>
            </div>
            
            <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={dadosGrafico}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis dataKey="mes" axisLine={false} tickLine={false} dy={10} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    formatter={(value, name) => [
                        name === 'meta' || name === 'real' 
                        ? `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                        : `${value.toFixed(1)}%`,
                        name === 'meta' ? 'Meta' : name === 'real' ? 'Realizado' : 'Progresso'
                    ]}
                    />
                    <Bar dataKey="meta" fill="#22c55e" radius={[4, 4, 0, 0]} name="Meta" barSize={30} fillOpacity={0.2} />
                    <Bar dataKey="real" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Realizado" barSize={30} />
                    <Line 
                    type="monotone" 
                    dataKey="progresso" 
                    stroke="#8b5cf6" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 2, stroke: '#fff' }} 
                    name="Progresso"
                    yAxisId={1}
                    hide
                    />
                </ComposedChart>
                </ResponsiveContainer>
            </div>
            </div>
        )}

        {/* Lista de Metas */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
            <h3 className="font-semibold text-gray-900">Metas Definidas</h3>
            <div className="flex bg-gray-100 p-1 rounded-lg">
                {['todos', 'faturamento', 'clientes', 'ticket_medio'].map((tipo) => (
                    <button
                        key={tipo}
                        onClick={() => setTipoMeta(tipo)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                            tipoMeta === tipo 
                            ? 'bg-white text-gray-900 shadow-sm' 
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        {tipo === 'todos' ? 'Todas' : tipo === 'ticket_medio' ? 'Ticket Médio' : tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                    </button>
                ))}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
            </div>
          ) : metas.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">Nenhuma meta encontrada</h3>
              <p className="text-gray-500 mb-6 max-w-sm mx-auto">Defina metas para este ano e acompanhe o crescimento do seu negócio.</p>
              <button
                onClick={() => setShowNovaMeta(true)}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Criar Primeira Meta
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {metas
                .filter(meta => tipoMeta === 'todos' || meta.tipo === tipoMeta)
                .map((meta) => {
                  const Icon = getMetaIcon(meta.tipo);
                  const data = new Date(meta.mes);
                  const colorClass = getMetaColor(meta.tipo);
                  
                  return (
                    <div key={meta.id} className="p-4 hover:bg-gray-50 transition-colors group">
                      <div className="flex items-start justify-between gap-4">
                        {/* Ícone e Info Principal */}
                        <div className="flex items-start gap-4 flex-1">
                          <div className={`p-2.5 rounded-lg ${colorClass}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-gray-900 truncate">{meta.descricao}</h4>
                                <span className={`px-2 py-0.5 text-[10px] uppercase font-bold tracking-wide rounded-full ${getStatusColor(meta.status)}`}>
                                    {meta.status.replace('_', ' ')}
                                </span>
                            </div>
                            
                            <p className="text-xs text-gray-500 mb-3 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {meses[data.getUTCMonth()]} {data.getUTCFullYear()}
                            </p>
                            
                            {/* Barra de progresso */}
                            <div>
                              <div className="flex justify-between text-xs text-gray-600 mb-1.5">
                                <span className="font-medium">
                                    {meta.progresso.toFixed(1)}% concluído
                                </span>
                                <span className="text-gray-500">
                                  {meta.tipo === 'faturamento' || meta.tipo === 'ticket_medio' 
                                    ? `R$ ${meta.valorReal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} / R$ ${meta.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                                    : `${meta.valorReal} / ${meta.valor} clientes`}
                                </span>
                              </div>
                              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    meta.progresso >= 100 ? 'bg-green-500' :
                                    meta.progresso >= 70 ? 'bg-yellow-500' :
                                    'bg-purple-500'
                                  }`}
                                  style={{ width: `${meta.progresso}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Ações */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity self-center">
                          <button
                            onClick={() => iniciarEdicaoMeta(meta)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleExcluirMeta(meta.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* Modal Nova Meta */}
      {showNovaMeta && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Nova Meta</h2>
              <button 
                onClick={() => setShowNovaMeta(false)} 
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleNovaMeta} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Meta</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'faturamento', label: 'Faturamento', icon: DollarSign },
                    { id: 'clientes', label: 'Clientes', icon: Users },
                    { id: 'ticket_medio', label: 'Ticket Médio', icon: Award }
                  ].map((tipo) => {
                    const Icon = tipo.icon;
                    const active = novaMeta.tipo === tipo.id;
                    return (
                      <button
                        key={tipo.id}
                        type="button"
                        onClick={() => setNovaMeta(prev => ({ ...prev, tipo: tipo.id }))}
                        className={`p-3 border rounded-xl flex flex-col items-center gap-2 transition-all ${
                          active 
                            ? 'border-purple-500 bg-purple-50 text-purple-700 ring-1 ring-purple-500' 
                            : 'border-gray-200 hover:border-purple-200 hover:bg-gray-50 text-gray-600'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-xs font-medium">{tipo.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Mês</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                    value={novaMeta.mes}
                    onChange={(e) => setNovaMeta(prev => ({ ...prev, mes: parseInt(e.target.value) }))}
                  >
                    {meses.map((mes, index) => (
                      <option key={index} value={index + 1}>{mes}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Ano</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                    value={novaMeta.ano}
                    onChange={(e) => setNovaMeta(prev => ({ ...prev, ano: parseInt(e.target.value) }))}
                  >
                    {[2024, 2025, 2026, 2027, 2028].map(ano => (
                      <option key={ano} value={ano}>{ano}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Meta (Valor/Qtd)</label>
                <div className="relative">
                  {novaMeta.tipo !== 'clientes' && (
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">R$</span>
                  )}
                  <input
                    type="number"
                    step={novaMeta.tipo === 'clientes' ? '1' : '0.01'}
                    required
                    min="0"
                    className={`w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent py-2 pr-4 ${novaMeta.tipo !== 'clientes' ? 'pl-10' : 'pl-4'}`}
                    value={novaMeta.valor}
                    onChange={(e) => setNovaMeta(prev => ({ ...prev, valor: e.target.value }))}
                    placeholder="0,00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Descrição (Opcional)</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  value={novaMeta.descricao}
                  onChange={(e) => setNovaMeta(prev => ({ ...prev, descricao: e.target.value }))}
                  placeholder="Ex: Meta principal de Janeiro"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                    type="button" 
                    onClick={() => setShowNovaMeta(false)} 
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button 
                    type="submit" 
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-colors shadow-sm"
                >
                  Salvar Meta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Meta (Corrigido e Completo) */}
      {showEditarMeta && metaEditando && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Editar Meta</h2>
              <button 
                onClick={() => {
                  setShowEditarMeta(false);
                  setMetaEditando(null);
                }} 
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleEditarMeta} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Meta</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'faturamento', label: 'Faturamento', icon: DollarSign },
                    { id: 'clientes', label: 'Clientes', icon: Users },
                    { id: 'ticket_medio', label: 'Ticket Médio', icon: Award }
                  ].map((tipo) => {
                    const Icon = tipo.icon;
                    const active = metaEditando.tipo === tipo.id;
                    return (
                      <button
                        key={tipo.id}
                        type="button"
                        onClick={() => setMetaEditando(prev => ({ ...prev, tipo: tipo.id }))}
                        className={`p-3 border rounded-xl flex flex-col items-center gap-2 transition-all ${
                          active 
                            ? 'border-purple-500 bg-purple-50 text-purple-700 ring-1 ring-purple-500' 
                            : 'border-gray-200 hover:border-purple-200 hover:bg-gray-50 text-gray-600'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-xs font-medium">{tipo.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Mês</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                    value={metaEditando.mes}
                    onChange={(e) => setMetaEditando(prev => ({ ...prev, mes: parseInt(e.target.value) }))}
                  >
                    {meses.map((mes, index) => (
                      <option key={index} value={index + 1}>{mes}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Ano</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                    value={metaEditando.ano}
                    onChange={(e) => setMetaEditando(prev => ({ ...prev, ano: parseInt(e.target.value) }))}
                  >
                    {[2024, 2025, 2026, 2027, 2028].map(ano => (
                      <option key={ano} value={ano}>{ano}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Meta (Valor/Qtd)</label>
                <div className="relative">
                  {metaEditando.tipo !== 'clientes' && (
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">R$</span>
                  )}
                  <input
                    type="number"
                    step={metaEditando.tipo === 'clientes' ? '1' : '0.01'}
                    required
                    min="0"
                    className={`w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent py-2 pr-4 ${metaEditando.tipo !== 'clientes' ? 'pl-10' : 'pl-4'}`}
                    value={metaEditando.valor}
                    onChange={(e) => setMetaEditando(prev => ({ ...prev, valor: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Descrição</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  value={metaEditando.descricao}
                  onChange={(e) => setMetaEditando(prev => ({ ...prev, descricao: e.target.value }))}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                    type="button" 
                    onClick={() => {
                        setShowEditarMeta(false);
                        setMetaEditando(null);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button 
                    type="submit" 
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-colors shadow-sm"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};