import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../services/supabase';
import { 
  TrendingUp, DollarSign, Calendar, Users, Award, 
  Receipt, Loader2, ArrowUpRight, CheckCheck, Zap, X,
  TrendingDown, AlertTriangle, CheckCircle2, Target, 
  PieChart, BarChart3, Clock, ChevronDown, Filter,
  Download, Share2, RefreshCw, Maximize2, Minimize2,
  ArrowRight, Lightbulb, Sparkles, Crown, Home, Wallet,
  Info, AlertOctagon, ArrowUpRight as ArrowUpRightIcon,
  ArrowDownRight, Star, Scissors, Package, Activity,
  ChevronRight, Percent, CircleDollarSign, Plus,
  FileText, ChevronLeft, ChevronRight as ChevronRightIcon,
  CheckCircle, XCircle, Clock as ClockIcon, Calendar as CalendarIcon,
  Search, Edit, Trash2, Tag, Eye, EyeOff, BarChart2,
  TrendingUp as TrendingUpIcon, Filter as FilterIcon,
  PieChart as PieChartIcon, LineChart as LineChartIcon
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, BarChart, Bar, PieChart as RechartsPie, Pie, Cell,
  Legend, LineChart, Line, ComposedChart, RadarChart,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';

// IMPORTANTE: Importando a nova tela de despesas
import { DespesasScreen } from './despesas'; 

// ═══════════════════════════════════════════════════════════════════
// COMPONENTES AUXILIARES (Metas e Análise)
// ═══════════════════════════════════════════════════════════════════

// Componente de Metas (simplificado)
const MetasTab = ({ metas, resumoFinanceiro }) => {
  const [metasData, setMetasData] = useState([
    { mes: 'Jan', meta: 15000, real: 14200, progresso: 94.7 },
    { mes: 'Fev', meta: 16000, real: 15800, progresso: 98.8 },
    { mes: 'Mar', meta: 17000, real: 12500, progresso: 73.5 },
    { mes: 'Abr', meta: 18000, real: 0, progresso: 0 },
    { mes: 'Mai', meta: 19000, real: 0, progresso: 0 },
  ]);

  return (
    <div className="space-y-6">
      {/* Estatísticas de Metas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-50 rounded-xl">
              <Target className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Meta do Mês</p>
              <p className="text-2xl font-bold text-gray-900">
                R$ {metas.faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Progresso</span>
              <span>{((resumoFinanceiro.receitaBruta / metas.faturamento) * 100).toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="h-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-500"
                style={{ width: `${Math.min((resumoFinanceiro.receitaBruta / metas.faturamento) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 rounded-xl">
              <TrendingUpIcon className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Meta de Lucro</p>
              <p className="text-2xl font-bold text-gray-900">
                R$ {metas.lucro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Progresso</span>
              <span>{((resumoFinanceiro.lucroLiquido / metas.lucro) * 100).toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"
                style={{ width: `${Math.min((resumoFinanceiro.lucroLiquido / metas.lucro) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-50 rounded-xl">
              <Users className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Meta de Clientes</p>
              <p className="text-2xl font-bold text-gray-900">
                {metas.clientesNovos}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Progresso</span>
              <span>45%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
                style={{ width: '45%' }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico de Metas */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">📈 Evolução das Metas</h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-sm text-gray-600">Meta</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span className="text-sm text-gray-600">Realizado</span>
            </div>
          </div>
        </div>
        
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={metasData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="mes" />
              <YAxis tickFormatter={(value) => `R$ ${(value/1000).toFixed(0)}k`} />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'meta' || name === 'real' 
                    ? `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                    : `${value.toFixed(1)}%`,
                  name === 'meta' ? 'Meta' : name === 'real' ? 'Realizado' : 'Progresso'
                ]}
              />
              <Bar dataKey="meta" fill="#10b981" radius={[4, 4, 0, 0]} name="Meta" />
              <Bar dataKey="real" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Realizado" />
              <Line 
                type="monotone" 
                dataKey="progresso" 
                stroke="#8b5cf6" 
                strokeWidth={2} 
                dot={{ r: 4 }} 
                name="Progresso"
                yAxisId={1}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detalhamento das Metas */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">🎯 Metas Detalhadas</h3>
          <button className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nova Meta
          </button>
        </div>
        
        <div className="space-y-4">
          {metasData.map((meta, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${meta.progresso >= 90 ? 'bg-green-100' : meta.progresso >= 70 ? 'bg-yellow-100' : 'bg-red-100'}`}>
                  <Target className={`w-6 h-6 ${meta.progresso >= 90 ? 'text-green-600' : meta.progresso >= 70 ? 'text-yellow-600' : 'text-red-600'}`} />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Meta de Faturamento - {meta.mes}</p>
                  <p className="text-sm text-gray-500">
                    R$ {meta.real.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} de R$ {meta.meta.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-lg font-bold ${meta.progresso >= 90 ? 'text-green-600' : meta.progresso >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {meta.progresso.toFixed(1)}%
                </div>
                <div className="w-32 bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className={`h-2 rounded-full ${meta.progresso >= 90 ? 'bg-green-500' : meta.progresso >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${meta.progresso}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Componente de Análise (nova tab)
const AnaliseTab = ({ resumoFinanceiro, despesas, evolucaoReceitas }) => {
  const [tipoAnalise, setTipoAnalise] = useState('lucratividade');
   
  // Dados para análise de lucratividade
  const dadosLucratividade = [
    { mes: 'Jan', receita: 15000, despesas: 8000, lucro: 7000 },
    { mes: 'Fev', receita: 16000, despesas: 8500, lucro: 7500 },
    { mes: 'Mar', receita: 17000, despesas: 9000, lucro: 8000 },
    { mes: 'Abr', receita: 18000, despesas: 9500, lucro: 8500 },
    { mes: 'Mai', receita: 19000, despesas: 10000, lucro: 9000 },
  ];

  // Dados para análise de despesas
  const dadosDespesas = despesas.slice(0, 5).map(d => ({
    categoria: d.categoria || 'Outros',
    valor: Number(d.valor || 0)
  }));

  // Dados para radar de performance
  const dadosRadar = [
    { categoria: 'Lucratividade', valor: resumoFinanceiro.margemLucro, max: 100 },
    { categoria: 'Crescimento', valor: 15, max: 100 },
    { categoria: 'Eficiência', valor: 78, max: 100 },
    { categoria: 'Satisfação', valor: 92, max: 100 },
    { categoria: 'Retenção', valor: 85, max: 100 },
    { categoria: 'Produtividade', valor: 67, max: 100 },
  ];

  return (
    <div className="space-y-6">
      {/* Seletor de Tipo de Análise */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">📊 Análise Avançada</h3>
            <p className="text-sm text-gray-500">Análise detalhada do desempenho financeiro</p>
          </div>
           
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setTipoAnalise('lucratividade')}
              className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 ${
                tipoAnalise === 'lucratividade'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <TrendingUpIcon className="w-4 h-4" />
              Lucratividade
            </button>
            <button
              onClick={() => setTipoAnalise('despesas')}
              className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 ${
                tipoAnalise === 'despesas'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Receipt className="w-4 h-4" />
              Análise de Despesas
            </button>
            <button
              onClick={() => setTipoAnalise('performance')}
              className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 ${
                tipoAnalise === 'performance'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Performance
            </button>
          </div>
        </div>

        {/* Análise de Lucratividade */}
        {tipoAnalise === 'lucratividade' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-6 rounded-xl">
                <h4 className="font-semibold text-gray-900 mb-4">📈 Evolução da Lucratividade</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dadosLucratividade}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="mes" />
                      <YAxis tickFormatter={(value) => `R$ ${(value/1000).toFixed(0)}k`} />
                      <Tooltip formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Valor']} />
                      <Legend />
                      <Area type="monotone" dataKey="receita" stroke="#10b981" fill="#10b981" fillOpacity={0.1} name="Receita" />
                      <Area type="monotone" dataKey="despesas" stroke="#ef4444" fill="#ef4444" fillOpacity={0.1} name="Despesas" />
                      <Area type="monotone" dataKey="lucro" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} name="Lucro" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl">
                  <h4 className="font-semibold text-gray-900 mb-2">🎯 Margem de Lucro Atual</h4>
                  <div className="text-4xl font-bold text-green-600 mb-2">
                    {resumoFinanceiro.margemLucro.toFixed(1)}%
                  </div>
                  <p className="text-sm text-gray-600">
                    Para cada R$ 100,00 de receita, sobram R$ {resumoFinanceiro.margemLucro.toFixed(2)} de lucro
                  </p>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-xl">
                  <h4 className="font-semibold text-gray-900 mb-2">📊 Indicadores Chave</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Ponto de Equilíbrio</span>
                      <span className="font-semibold">R$ 8.500,00</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Margem de Segurança</span>
                      <span className="font-semibold text-green-600">42%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">ROI Mensal</span>
                      <span className="font-semibold text-blue-600">18%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h4 className="font-semibold text-gray-900 mb-4">💡 Recomendações de Melhoria</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h5 className="font-medium text-gray-900">Reduzir Despesas Variáveis</h5>
                      <p className="text-sm text-gray-600 mt-1">Considere renegociar fornecedores para reduzir custos em 5-10%</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-3">
                    <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h5 className="font-medium text-gray-900">Aumentar Ticket Médio</h5>
                      <p className="text-sm text-gray-600 mt-1">Ofereça pacotes ou serviços premium para aumentar valor por cliente</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Análise de Despesas */}
        {tipoAnalise === 'despesas' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-6 rounded-xl">
                <h4 className="font-semibold text-gray-900 mb-4">📊 Distribuição de Despesas</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie
                        data={dadosDespesas}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="valor"
                      >
                        {dadosDespesas.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={[
                            '#8b5cf6', '#10b981', '#f59e0b', '#3b82f6', '#ef4444'
                          ][index % 5]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Valor']} />
                      <Legend />
                    </RechartsPie>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-white border border-gray-200 p-6 rounded-xl">
                  <h4 className="font-semibold text-gray-900 mb-4">📈 Tendência de Despesas</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Crescimento Mensal</span>
                        <span className="font-semibold text-red-600">+8.5%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="h-2 rounded-full bg-red-500" style={{ width: '65%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Despesas Fixas vs Variáveis</span>
                        <span className="font-semibold">60% / 40%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="h-2 rounded-full bg-blue-500" style={{ width: '60%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 p-6 rounded-xl">
                  <h4 className="font-semibold text-gray-900 mb-4">🎯 Economias Potenciais</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Reduzir despesas administrativas em 15%
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Negociar contratos de serviços essenciais
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Otimizar consumo de energia e água
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Análise de Performance */}
        {tipoAnalise === 'performance' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-6 rounded-xl">
                <h4 className="font-semibold text-gray-900 mb-4">🎯 Radar de Performance</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={dadosRadar}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="categoria" />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} />
                      <Radar
                        name="Performance"
                        dataKey="valor"
                        stroke="#8b5cf6"
                        fill="#8b5cf6"
                        fillOpacity={0.3}
                      />
                      <Legend />
                      <Tooltip formatter={(value) => [`${value}%`, 'Score']} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl">
                  <h4 className="font-semibold text-gray-900 mb-2">⭐ Score Geral</h4>
                  <div className="text-4xl font-bold text-purple-600 mb-2">
                    78/100
                  </div>
                  <p className="text-sm text-gray-600">
                    Desempenho acima da média do setor (65/100)
                  </p>
                </div>

                <div className="bg-white border border-gray-200 p-6 rounded-xl">
                  <h4 className="font-semibold text-gray-900 mb-4">📈 Áreas de Melhoria</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Produtividade</span>
                        <span className="font-semibold text-yellow-600">67%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="h-2 rounded-full bg-yellow-500" style={{ width: '67%' }}></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Considere otimizar processos internos</p>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Eficiência Operacional</span>
                        <span className="font-semibold text-yellow-600">78%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="h-2 rounded-full bg-yellow-500" style={{ width: '78%' }}></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Automatize tarefas repetitivas</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h4 className="font-semibold text-gray-900 mb-4">📋 Plano de Ação Recomendado</h4>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Prioridade</th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Ação</th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Impacto Esperado</th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Prazo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Alta</span>
                      </td>
                      <td className="py-3 px-4 text-sm">Automatizar agendamentos</td>
                      <td className="py-3 px-4 text-sm">+15% produtividade</td>
                      <td className="py-3 px-4 text-sm">30 dias</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Média</span>
                      </td>
                      <td className="py-3 px-4 text-sm">Implementar CRM completo</td>
                      <td className="py-3 px-4 text-sm">+20% retenção</td>
                      <td className="py-3 px-4 text-sm">60 dias</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Baixa</span>
                      </td>
                      <td className="py-3 px-4 text-sm">Treinamento da equipe</td>
                      <td className="py-3 px-4 text-sm">+10% satisfação</td>
                      <td className="py-3 px-4 text-sm">90 dias</td>
                    </tr>
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

// ═══════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL DO DASHBOARD FINANCEIRO
// ═══════════════════════════════════════════════════════════════════
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
  const [dataFim, setDataFim] = useState(() => {
    const date = new Date();
    return date.toISOString().split('T')[0];
  });
  const [showFilters, setShowFilters] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  
  // Dados principais
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

  // Carregar todos os dados
  const carregarDados = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    else setRefreshing(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: usu } = await supabase
        .from('usuarios').select('salao_id').eq('id', user.id).maybeSingle();
       
      if (!usu?.salao_id) return;

      const salaoId = usu.salao_id;

      // 1. Calcular resumo financeiro
      const [resAgendamentos, resDespesas, resKpis, resTopClientes, resMetas] = await Promise.all([
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
          .from('vw_kpis_financeiros_salao')
          .select('*')
          .eq('salao_id', salaoId)
          .maybeSingle(),
        
        supabase
          .from('vw_top_clientes_mes')
          .select('*')
          .limit(5),
        
        supabase
          .from('metas')
          .select('*')
          .order('mes', { ascending: false })
          .limit(1)
      ]);

      // Calcular receita bruta
      const receitaBruta = resAgendamentos.data?.reduce((sum, item) => 
        sum + Number(item.valor_total || 0), 0) || 0;

      // Calcular despesas
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

      // 2. Processar despesas
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

        const distribuicaoArray = Object.entries(distribuicao).map(([name, data]) => ({
          name,
          value: data.valor,
          count: data.count
        })).sort((a, b) => b.value - a.value);

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
      }

      // 3. Evolução das receitas (últimos 6 meses)
      const seisMesesAtras = new Date();
      seisMesesAtras.setMonth(seisMesesAtras.getMonth() - 5);
      seisMesesAtras.setDate(1);

      const { data: historico } = await supabase
        .from('vw_historico_financeiro')
        .select('*')
        .gte('data_mes', seisMesesAtras.toISOString())
        .order('data_mes', { ascending: true });

      if (historico) {
        setEvolucaoReceitas(historico.map(h => ({
          mes: new Date(h.data_mes).toLocaleDateString('pt-BR', { month: 'short' }),
          receita: Number(h.faturamento || 0),
          atendimentos: Number(h.total_atendimentos || 0)
        })));
      }

      // 4. Top clientes
      if (resTopClientes.data) {
        setTopClientes(resTopClientes.data);
      }

      // 5. Metas
      if (resMetas.data?.length) {
        setMetas(prev => ({
          ...prev,
          faturamento: Number(resMetas.data[0].valor)
        }));
      }

      // 6. Gerar insights automáticos
      gerarInsights({
        receitaBruta,
        despesasPagas,
        despesasPendentes,
        lucroLiquido,
        margemLucro,
        contasVencendo: contasAVencer.length,
        kpis: resKpis.data
      });

      setLastUpdate(new Date());

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dataInicio, dataFim]);

  const gerarInsights = useCallback((dados) => {
    const novosInsights = [];
    const novosAlertas = [];

    // Insights baseados em margem de lucro
    if (dados.margemLucro < 10) {
      novosInsights.push({
        tipo: 'alerta',
        titulo: 'Margem de Lucro Baixa',
        descricao: `Sua margem de lucro está em ${dados.margemLucro.toFixed(1)}%. Considere revisar custos.`,
        icon: AlertTriangle,
        cor: 'text-yellow-500',
        bgCor: 'bg-yellow-50'
      });
    } else if (dados.margemLucro > 30) {
      novosInsights.push({
        tipo: 'sucesso',
        titulo: 'Margem de Lucro Excelente',
        descricao: `Parabéns! Margem de ${dados.margemLucro.toFixed(1)}% está acima da média.`,
        icon: TrendingUp,
        cor: 'text-green-500',
        bgCor: 'bg-green-50'
      });
    }

    // Alertas para contas a vencer
    if (dados.contasVencendo > 0) {
      novosAlertas.push({
        tipo: 'vencimento',
        titulo: 'Contas Próximas do Vencimento',
        descricao: `${dados.contasVencendo} conta(s) vence(m) em breve.`,
        valor: dados.contasVencendo,
        icon: ClockIcon,
        cor: 'text-orange-500',
        bgCor: 'bg-orange-50'
      });
    }

    // Insight sobre crescimento
    if (dados.kpis?.crescimento_percentual > 15) {
      novosInsights.push({
        tipo: 'crescimento',
        titulo: 'Crescimento Acelerado',
        descricao: `Faturamento cresceu ${dados.kpis.crescimento_percentual}% em relação ao mês anterior.`,
        icon: TrendingUp,
        cor: 'text-purple-500',
        bgCor: 'bg-purple-50'
      });
    }

    setInsights(novosInsights);
    setAlertas(novosAlertas);
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  // ═══════════════════════════════════════════════════════════════
  // COMPONENTES DE UI
  // ═══════════════════════════════════════════════════════════════

  const KPICard = ({ titulo, valor, variacao, icone: Icone, cor, subTitulo, loading: cardLoading }) => (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-300">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-sm text-gray-500 font-medium">{titulo}</p>
          {cardLoading ? (
            <div className="h-8 w-24 bg-gray-100 rounded animate-pulse mt-2"></div>
          ) : (
            <p className="text-3xl font-bold text-gray-900 mt-1">{valor}</p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${cor.bg}`}>
          <Icone className={`w-6 h-6 ${cor.text}`} />
        </div>
      </div>
      {!cardLoading && subTitulo && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
          <span className="text-sm text-gray-500">{subTitulo}</span>
          {variacao && (
            <div className={`flex items-center text-sm font-medium ${variacao >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {variacao >= 0 ? <ArrowUpRightIcon className="w-4 h-4 mr-1" /> : <ArrowDownRight className="w-4 h-4 mr-1" />}
              {Math.abs(variacao)}%
            </div>
          )}
        </div>
      )}
    </div>
  );

  const InsightCard = ({ insight }) => {
    const Icon = insight.icon;
    return (
      <div className={`rounded-xl p-4 ${insight.bgCor} border ${insight.cor.replace('text-', 'border-')} border-opacity-20`}>
        <div className="flex items-start gap-3">
          <Icon className={`w-5 h-5 mt-0.5 ${insight.cor}`} />
          <div>
            <h4 className="font-semibold text-gray-900">{insight.titulo}</h4>
            <p className="text-sm text-gray-600 mt-1">{insight.descricao}</p>
          </div>
        </div>
      </div>
    );
  };

  const AlertaCard = ({ alerta }) => {
    const Icon = alerta.icon;
    return (
      <div className={`rounded-xl p-4 ${alerta.bgCor} border border-opacity-20`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon className={`w-5 h-5 ${alerta.cor}`} />
            <div>
              <h4 className="font-semibold text-gray-900">{alerta.titulo}</h4>
              <p className="text-sm text-gray-600">{alerta.descricao}</p>
            </div>
          </div>
          {alerta.valor && (
            <span className="bg-white px-3 py-1 rounded-full text-sm font-semibold border">
              {alerta.valor}
            </span>
          )}
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════
  // TABS DO DASHBOARD
  // ═══════════════════════════════════════════════════════════════

  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Alertas em destaque */}
      {alertas.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900">⚠️ Alertas do Sistema</h3>
          {alertas.map((alerta, idx) => (
            <AlertaCard key={idx} alerta={alerta} />
          ))}
        </div>
      )}

      {/* KPIs principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          titulo="Receita Bruta"
          valor={`R$ ${resumoFinanceiro.receitaBruta.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icone={DollarSign}
          cor={{ text: 'text-green-500', bg: 'bg-green-50' }}
          subTitulo="Período selecionado"
          loading={loading}
        />
        <KPICard
          titulo="Lucro Líquido"
          valor={`R$ ${resumoFinanceiro.lucroLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icone={TrendingUp}
          cor={{ text: resumoFinanceiro.lucroLiquido >= 0 ? 'text-green-500' : 'text-red-500', bg: resumoFinanceiro.lucroLiquido >= 0 ? 'bg-green-50' : 'bg-red-50' }}
          subTitulo={`Margem: ${resumoFinanceiro.margemLucro.toFixed(1)}%`}
          loading={loading}
        />
        <KPICard
          titulo="Despesas"
          valor={`R$ ${(resumoFinanceiro.despesasPagas + resumoFinanceiro.despesasPendentes).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icone={Receipt}
          cor={{ text: 'text-orange-500', bg: 'bg-orange-50' }}
          subTitulo={`${resumoFinanceiro.despesasPendentes > 0 ? `${resumoFinanceiro.despesasPendentes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} pendentes` : 'Todas pagas'}`}
          loading={loading}
        />
        <KPICard
          titulo="Meta do Mês"
          valor={`R$ ${metas.faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icone={Target}
          cor={{ text: 'text-purple-500', bg: 'bg-purple-50' }}
          subTitulo={`${((resumoFinanceiro.receitaBruta / metas.faturamento) * 100).toFixed(1)}% alcançado`}
          loading={loading}
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Evolução da Receita */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">📈 Evolução da Receita</h3>
            <span className="text-sm text-gray-500">Últimos 6 meses</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={evolucaoReceitas}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="mes" />
                <YAxis tickFormatter={(value) => `R$ ${(value/1000).toFixed(0)}k`} />
                <Tooltip formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Receita']} />
                <Area type="monotone" dataKey="receita" stroke="#10b981" fill="#10b981" fillOpacity={0.1} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribuição de Despesas */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">📊 Distribuição de Despesas</h3>
            <span className="text-sm text-gray-500">Por categoria</span>
          </div>
          <div className="h-64">
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
                >
                  {distribuicaoDespesas.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={[
                      '#8b5cf6', '#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6'
                    ][index % 6]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Valor']} />
                <Legend />
              </RechartsPie>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <Lightbulb className="w-5 h-5 text-purple-500" />
            <h3 className="text-lg font-semibold text-gray-900">💡 Insights Inteligentes</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.map((insight, idx) => (
              <InsightCard key={idx} insight={insight} />
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const ClientesTab = () => (
    <div className="space-y-6">
      {/* Top clientes */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">🏆 Top Clientes</h3>
          <span className="text-sm text-gray-500">Maior faturamento</span>
        </div>
        <div className="space-y-4">
          {topClientes.map((cliente, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                  {cliente.cliente_nome?.substring(0, 2).toUpperCase() || 'CL'}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{cliente.cliente_nome || 'Cliente'}</p>
                  <p className="text-sm text-gray-500">{cliente.total_visitas || 0} atendimentos</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900">
                  R$ {(cliente.total_gasto || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-gray-500">Valor total</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Gráfico de fidelidade */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">📊 Perfil dos Clientes</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { tipo: 'Novos', quantidade: 12 },
                { tipo: 'Recorrentes', quantidade: 8 },
                { tipo: 'VIP', quantidade: 5 },
                { tipo: 'Inativos', quantidade: 3 }
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="tipo" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="quantidade" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">🎯 Retenção de Clientes</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Taxa de retorno</span>
              <span className="font-bold text-green-600">78%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: '78%' }}></div>
            </div>
             
            <div className="flex items-center justify-between mt-6">
              <span className="text-gray-600">Frequência média</span>
              <span className="font-bold text-purple-600">2.3x/mês</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-purple-500 h-2 rounded-full" style={{ width: '65%' }}></div>
            </div>
             
            <div className="flex items-center justify-between mt-6">
              <span className="text-gray-600">Satisfação</span>
              <span className="font-bold text-blue-600">4.7/5</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: '94%' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const RelatoriosTab = () => (
    <div className="space-y-6">
      {/* Opções de relatório */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button className="bg-white rounded-2xl border border-gray-200 p-6 text-left hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-50 rounded-xl">
              <FileText className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Relatório Financeiro</h3>
              <p className="text-sm text-gray-500">Receitas, despesas e lucro</p>
            </div>
          </div>
          <p className="text-sm text-gray-600">Gera PDF/Excel com análise completa do período</p>
        </button>

        <button className="bg-white rounded-2xl border border-gray-200 p-6 text-left hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-green-50 rounded-xl">
              <Users className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Relatório de Clientes</h3>
              <p className="text-sm text-gray-500">Perfil e comportamento</p>
            </div>
          </div>
          <p className="text-sm text-gray-600">Análise de clientes, frequência e faturamento</p>
        </button>

        <button className="bg-white rounded-2xl border border-gray-200 p-6 text-left hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-purple-50 rounded-xl">
              <BarChart3 className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Relatório Executivo</h3>
              <p className="text-sm text-gray-500">Visão geral para decisões</p>
            </div>
          </div>
          <p className="text-sm text-gray-600">KPIs principais e tendências para gestão</p>
        </button>
      </div>

      {/* Configurações de exportação */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">⚙️ Configurar Relatório</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Período</label>
            <select 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
            >
              <option value="mes">Este mês</option>
              <option value="semana">Esta semana</option>
              <option value="personalizado">Personalizado</option>
              <option value="trimestre">Último trimestre</option>
              <option value="ano">Este ano</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Formato</label>
            <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
              <option value="pdf">PDF (Visualização)</option>
              <option value="excel">Excel (Dados brutos)</option>
              <option value="ambos">PDF + Excel</option>
            </select>
          </div>
        </div>

        {periodo === 'personalizado' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Data Início</label>
              <input
                type="date"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Data Fim</label>
              <input
                type="date"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
              />
            </div>
          </div>
        )}

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Seções do Relatório</label>
          <div className="space-y-2">
            {[
              { id: 'resumo', label: 'Resumo Executivo', checked: true },
              { id: 'receitas', label: 'Análise de Receitas', checked: true },
              { id: 'despesas', label: 'Detalhamento de Despesas', checked: true },
              { id: 'clientes', label: 'Perfil de Clientes', checked: true },
              { id: 'metas', label: 'Atingimento de Metas', checked: true },
              { id: 'insights', label: 'Insights Automáticos', checked: true }
            ].map((section) => (
              <label key={section.id} className="flex items-center gap-3">
                <input type="checkbox" defaultChecked={section.checked} className="rounded text-purple-600 focus:ring-purple-500" />
                <span className="text-sm text-gray-700">{section.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-3 mt-8">
          <button className="flex-1 px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2">
            <Download className="w-5 h-5" />
            Gerar Relatório
          </button>
          <button className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Compartilhar
          </button>
        </div>
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════
  // RENDER PRINCIPAL
  // ═══════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard Financeiro</h1>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-500">
                    {new Date(dataInicio).toLocaleDateString('pt-BR')} - {new Date(dataFim).toLocaleDateString('pt-BR')}
                  </span>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-sm text-gray-500 flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Atualizado {lastUpdate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => carregarDados(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={refreshing}
              >
                <RefreshCw className={`w-5 h-5 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              
              <div className="relative">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                >
                  <Filter className="w-5 h-5" />
                  <span className="text-sm font-medium">Filtros</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                </button>
                
                {showFilters && (
                  <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-50 p-4">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Período</label>
                        <select 
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          value={periodo}
                          onChange={(e) => setPeriodo(e.target.value)}
                        >
                          <option value="mes">Este mês</option>
                          <option value="semana">Esta semana</option>
                          <option value="15dias">Últimos 15 dias</option>
                          <option value="trimestre">Último trimestre</option>
                          <option value="ano">Este ano</option>
                          <option value="personalizado">Personalizado</option>
                        </select>
                      </div>
                      
                      {periodo === 'personalizado' && (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">De</label>
                            <input
                              type="date"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                              value={dataInicio}
                              onChange={(e) => setDataInicio(e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Até</label>
                            <input
                              type="date"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                              value={dataFim}
                              onChange={(e) => setDataFim(e.target.value)}
                            />
                          </div>
                        </div>
                      )}
                      
                      <button
                        onClick={() => {
                          carregarDados();
                          setShowFilters(false);
                        }}
                        className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
                      >
                        Aplicar Filtros
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2">
                <Download className="w-5 h-5" />
                <span className="text-sm font-medium">Exportar</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200 mt-4">
          <nav className="flex space-x-8 overflow-x-auto no-scrollbar">
            {[
              { id: 'overview', label: 'Visão Geral', icon: Home },
              { id: 'despesas', label: 'Despesas', icon: Receipt },
              { id: 'metas', label: 'Metas', icon: Target },
              { id: 'clientes', label: 'Clientes', icon: Users },
              { id: 'relatorios', label: 'Relatórios', icon: FileText },
              { id: 'analise', label: 'Análise Avançada', icon: BarChart3 }
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 whitespace-nowrap ${
                    active
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                  {tab.id === 'despesas' && contasAVencer.length > 0 && (
                    <span className="ml-2 px-2 py-1 text-xs font-bold bg-red-500 text-white rounded-full">
                      {contasAVencer.length}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-96">
            <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
            <p className="mt-4 text-gray-600">Carregando dados financeiros...</p>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && <OverviewTab />}
            {activeTab === 'despesas' && (
              <DespesasScreen onClose={() => setActiveTab('overview')} />
            )}
            {activeTab === 'metas' && (
              <MetasTab 
                metas={metas} 
                resumoFinanceiro={resumoFinanceiro} 
              />
            )}
            {activeTab === 'clientes' && <ClientesTab />}
            {activeTab === 'relatorios' && <RelatoriosTab />}
            {activeTab === 'analise' && (
              <AnaliseTab 
                resumoFinanceiro={resumoFinanceiro}
                despesas={despesas}
                evolucaoReceitas={evolucaoReceitas}
              />
            )}
          </>
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

export const RelatorioAvancadoModal = ({ isOpen, onClose }) => {
  return null;
};