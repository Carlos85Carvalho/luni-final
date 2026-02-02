import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../services/supabase';
import {
  X, BrainCircuit, BarChart3, Loader2, TrendingUp, TrendingDown,
  AlertTriangle, CheckCircle2, Zap, Target, ArrowUpRight,
  ArrowDownRight, Users, Award, DollarSign, Clock, ChevronRight,
  Lightbulb, PieChart, Activity, Sparkles, TargetIcon,
  TrendingUp as TrendingUpIcon, AlertCircle, Star, ChevronLeft,
  Crown, Calendar, Command, Scissors, Package, AlertOctagon
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, BarChart, Bar, PieChart as RechartsPie, Pie, Cell,
  Legend
} from 'recharts';

// ─── Tokens do sistema Luni ───────────────────────────────────────
const PURPLE = '#5B2EFF';
const FUCHSIA = '#d946ef';
const EMERALD = '#10b981';
const AMBER = '#f59e0b';
const RED = '#ef4444';
const BLUE = '#3b82f6';
const INDIGO = '#6366f1';

const PIE_COLORS = [PURPLE, FUCHSIA, EMERALD, AMBER, BLUE, '#ec4899', '#8b5cf6', '#06b6d4'];

// ─── Formatadores ────────────────────────────────────────────────
const fmt = (n) => Number(n || 0).toLocaleString('pt-BR');
const fmtR = (n) => `R$ ${fmt(n)}`;
const fmtPct = (n) => `${Number(n || 0).toFixed(1)}%`;
const fmtShort = (n) => {
  if (n >= 1000000) return `R$ ${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `R$ ${(n / 1000).toFixed(1)}k`;
  return fmtR(n);
};

// ═══════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════
export const RelatorioAvancadoModal = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [mobileView, setMobileView] = useState(false);
  const [tabletView, setTabletView] = useState(false);

  // ─── Estado dos dados ──────────────────────────────────────────
  const [kpis, setKpis] = useState({});
  const [historico, setHistorico] = useState([]);
  const [porServico, setPorServico] = useState([]);
  const [porProf, setPorProf] = useState([]);
  const [meta, setMeta] = useState(15000);

  // ─── Detectar tamanho da tela RESPONSIVO ───────────────────────
  useEffect(() => {
    const checkViewport = () => {
      const width = window.innerWidth;
      setMobileView(width < 768);  // md: <768px
      setTabletView(width >= 768 && width < 1024); // lg: 768-1024px
    };
    
    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  // ─── Busca de dados ────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;

    const carregar = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const { data: usu } = await supabase
          .from('usuarios').select('salao_id').eq('id', user.id).maybeSingle();
        if (!usu?.salao_id) { setLoading(false); return; }

        const salaoId = usu.salao_id;
        const hoje = new Date();
        const ano = hoje.getFullYear();
        const mes = hoje.getMonth() + 1;

        const [
          resKpis, resHistorico, resServicoMes,
          resProfMes, resMeta
        ] = await Promise.all([
          supabase.from('vw_kpis_financeiros_salao').select('*').eq('salao_id', salaoId).maybeSingle(),
          supabase.from('vw_historico_financeiro').select('*').order('data_mes', { ascending: true }),
          supabase.from('vw_faturamento_por_servico').select('*').eq('salao_id', salaoId).eq('ano', ano).eq('mes', mes),
          supabase.from('vw_faturamento_por_profissional').select('*').eq('salao_id', salaoId).eq('ano', ano).eq('mes', mes),
          supabase.from('metas').select('*').order('mes', { ascending: false }).limit(1)
        ]);

        // Processar dados
        if (resKpis.data) setKpis(resKpis.data);
        if (resHistorico.data) {
          const hist = resHistorico.data.slice(-6).map(h => ({
            mes: new Date(h.data_mes).toLocaleString('pt-BR', { month: 'short' }),
            valor: Number(h.faturamento || 0),
            atendimentos: Number(h.total_atendimentos || 0)
          }));
          setHistorico(hist);
        }
        if (resServicoMes.data) setPorServico(resServicoMes.data.map(s => ({
          name: s.servico,
          value: Number(s.total_faturado || 0),
          atendimentos: Number(s.total_atendimentos || 0),
          margem: Number(s.margem || 40)
        })).sort((a, b) => b.value - a.value));
        if (resProfMes.data) setPorProf(resProfMes.data.map(p => ({
          nome: p.profissional_nome || 'Sem nome',
          valor: Number(p.total_faturado || 0),
          atendimentos: Number(p.total_atendimentos || 0),
          ticket: Number(p.ticket_medio || 0),
          satisfacao: Number(p.media_satisfacao || 0)
        })).sort((a, b) => b.valor - a.valor));
        if (resMeta.data?.length) setMeta(Number(resMeta.data[0].valor));

      } catch (e) {
        console.error('Erro Relatório:', e);
      } finally {
        setLoading(false);
      }
    };

    carregar();
  }, [isOpen]);

  // ─── Componentes de UI Responsivos (DENTRO DO COMPONENTE PRINCIPAL) ──
  const SectionTitle = ({ icon: Icon, children, color = PURPLE }) => (
    <div className="flex items-center gap-2 md:gap-3 mb-4">
      <div className="p-1.5 md:p-2 rounded-lg md:rounded-xl" style={{ background: `${color}15` }}>
        <Icon size={mobileView ? 16 : 20} color={color} />
      </div>
      <h3 className="text-xs md:text-sm font-bold text-gray-900 uppercase tracking-wider">{children}</h3>
    </div>
  );

  const KpiCard = ({ label, value, sub, icon: Icon, accent = PURPLE, trend, loading: cardLoading }) => {
    const trendConfig = {
      up: { icon: TrendingUp, color: EMERALD },
      down: { icon: TrendingDown, color: RED },
      stable: { icon: TrendingUp, color: AMBER }
    };

    const TrendIcon = trend ? trendConfig[trend]?.icon : null;

    return (
      <div className="bg-white rounded-lg md:rounded-xl border border-gray-100 p-3 md:p-4 shadow-sm hover:shadow transition-all duration-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] md:text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
            {label}
          </span>
          <div className="p-1.5 md:p-2 rounded-lg" style={{ background: `${accent}10` }}>
            <Icon size={mobileView ? 16 : 18} color={accent} />
          </div>
        </div>
        {cardLoading ? (
          <div className="h-7 md:h-8 bg-gray-100 rounded animate-pulse" />
        ) : (
          <>
            <p className={`${mobileView ? 'text-xl' : 'text-2xl'} font-bold text-gray-900 mb-1`}>
              {value}
            </p>
            {sub && (
              <div className="flex items-center gap-1 md:gap-1.5 mt-1">
                {trend && TrendIcon && (
                  <div className={`flex items-center gap-1 ${mobileView ? 'px-2 py-1 text-xs' : 'px-2 py-1 text-sm'} rounded-full`} 
                    style={{ 
                      background: `${trendConfig[trend].color}10`,
                      color: trendConfig[trend].color
                    }}>
                    <TrendIcon size={mobileView ? 12 : 14} />
                    <span className="font-semibold">{sub}</span>
                  </div>
                )}
                {!trend && <span className="text-xs text-gray-500 font-medium">{sub}</span>}
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  // ─── COMPONENTE: ORDEM DO MÊS ─────────────────────────
  const OrdemDoMes = () => {
    // Lógica para gerar ORDEM direta e impositiva
    const gerarOrdem = () => {
      const faturamentoAtual = Number(kpis.faturamento_mes_atual || 0);
      const projecao = faturamentoAtual * (1 + (Number(kpis.crescimento_percentual || 0) / 100));
      const ticketMedio = Number(kpis.ticket_medio || 0);
      const taxaNoshow = Number(kpis.taxa_noshow || 0) || 8;
      const ocupacao = kpis.taxa_ocupacao || 70;
      const horariosOciosos = Math.round(100 - ocupacao);
      
      const servicoTop = porServico[0]?.name || 'serviço premium';
      const servicoTopValor = porServico[0]?.value || 0;
      const totalServicos = porServico.reduce((sum, s) => sum + s.value, 0);
      const concentracaoTop = totalServicos > 0 ? (servicoTopValor / totalServicos) * 100 : 0;

      let ordemPrincipal = '';
      let motivoUrgente = '';
      let consequencia = '';
      let resultadoFinanceiro = '';

      // CASO 1: Meta EM RISCO
      if (projecao < meta * 0.85) {
        const deficit = meta - projecao;
        ordemPrincipal = `Concentre TODOS os horários no ${servicoTop} e crie pacotes premium`;
        motivoUrgente = `Você vai fechar o mês com deficit de ${fmtR(deficit)}`;
        consequencia = `Sem ação, o caixa ficará comprometido`;
        resultadoFinanceiro = `Recupera ${fmtR(deficit * 0.7)} do deficit`;
      }
      // CASO 2: No-shows CRÍTICOS
      else if (taxaNoshow > 15) {
        const perdaMensal = totalServicos * (taxaNoshow / 100);
        ordemPrincipal = `Implemente confirmação obrigatória para ${servicoTop}`;
        motivoUrgente = `Cada falta custa ${fmtR(ticketMedio)}`;
        consequencia = `Agenda imprevisível e equipe desmotivada`;
        resultadoFinanceiro = `Economiza ${fmtR(perdaMensal * 0.6)}`;
      }
      // CASO 3: OCIOSIDADE ALTA
      else if (horariosOciosos > 30) {
        const potencialPerdido = (servicoTopValor / (ocupacao/100)) * (horariosOciosos/100);
        ordemPrincipal = `Preencha ${horariosOciosos}% de horários com ${servicoTop}`;
        motivoUrgente = `Cada hora ociosa custa ${fmtR(ticketMedio)}`;
        consequencia = `Horários vazios são dinheiro perdido`;
        resultadoFinanceiro = `+${fmtR(potencialPerdido * 0.4)}`;
      }
      // CASO PADRÃO
      else {
        ordemPrincipal = `Aumente o preço do ${servicoTop} para horários premium`;
        motivoUrgente = `Cobrando abaixo do mercado`;
        consequencia = `Preço baixo desvaloriza seu trabalho`;
        resultadoFinanceiro = `+${fmtR(servicoTopValor * 0.15)}/mês`;
      }

      return { ordemPrincipal, motivoUrgente, consequencia, resultadoFinanceiro };
    };

    const { ordemPrincipal, motivoUrgente, consequencia, resultadoFinanceiro } = gerarOrdem();

    return (
      <div className="mb-4 md:mb-6">
        <div className={`
          bg-gradient-to-br from-red-700 via-red-600 to-rose-700 
          ${mobileView ? 'rounded-lg' : 'rounded-xl'} 
          ${mobileView ? 'p-4' : 'p-5 md:p-6'} 
          text-white shadow-lg border border-red-400 relative overflow-hidden
        `}>
          
          {/* Elemento de urgência */}
          {!mobileView && (
            <div className="absolute top-3 right-3">
              <div className="animate-pulse">
                <AlertOctagon size={20} className="text-red-300" />
              </div>
            </div>
          )}

          <div className="flex items-start gap-3 md:gap-4 mb-3 md:mb-4 relative z-10">
            <div className={`${mobileView ? 'p-2' : 'p-2.5'} bg-white/20 rounded-lg backdrop-blur-sm flex-shrink-0`}>
              <Target size={mobileView ? 18 : 20} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <div className="px-2 md:px-3 py-0.5 bg-white/30 rounded-full">
                  <h3 className={`${mobileView ? 'text-sm' : 'text-base'} font-bold tracking-tight`}>🔴 ORDEM DO MÊS</h3>
                </div>
                <span className="text-[10px] md:text-[11px] font-bold bg-red-600 px-2 py-0.5 rounded-full uppercase">
                  EXECUTE AGORA
                </span>
              </div>
              <p className="text-xs text-red-100">
                Não é sugestão. É o que precisa ser feito.
              </p>
            </div>
          </div>
          
          {/* Ordem Principal */}
          <div className="bg-white/10 rounded-lg p-3 md:p-4 mb-3 md:mb-4 backdrop-blur-sm border border-white/20 relative">
            <div className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-1 h-3/4 bg-red-500 rounded-full" />
            <p className={`${mobileView ? 'text-base' : 'text-lg'} font-bold leading-tight pl-3`}>
              {ordemPrincipal}
            </p>
          </div>
          
          {/* Grid de Urgência - Responsivo */}
          <div className={`grid ${mobileView ? 'grid-cols-1 gap-2' : 'grid-cols-1 md:grid-cols-2 gap-3'} mb-3 md:mb-4`}>
            <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm border border-red-400/20">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle size={14} className="text-red-300" />
                <p className="text-[11px] font-bold text-red-200 uppercase">POR QUE É URGENTE</p>
              </div>
              <p className="text-xs font-medium">{motivoUrgente}</p>
            </div>
            
            <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm border border-red-400/20">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={14} className="text-red-300" />
                <p className="text-[11px] font-bold text-red-200 uppercase">CONSEQUÊNCIA</p>
              </div>
              <p className="text-xs font-medium">{consequencia}</p>
            </div>
          </div>

          {/* Resultado Financeiro */}
          <div className="bg-gradient-to-r from-amber-500/20 to-amber-600/20 rounded-lg p-3 md:p-4 border border-amber-500/30">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-amber-200 uppercase">RESULTADO FINANCEIRO</p>
                <p className={`${mobileView ? 'text-base' : 'text-lg'} font-bold text-white`}>
                  {resultadoFinanceiro}
                </p>
              </div>
              <div className="text-right md:text-left">
                <p className="text-[10px] font-bold text-amber-300 uppercase">PRAZO</p>
                <p className="text-sm font-bold text-white">7 DIAS</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ─── Cálculos derivados ────────────────────────────────────────
  const totalDespesas = useMemo(() => Number(kpis.total_despesas || 0), [kpis]);
  const lucroLiquido = useMemo(() => 
    Number(kpis.faturamento_mes_atual || 0) - totalDespesas, [kpis, totalDespesas]);

  // ─── Renderizar KPIs principais RESPONSIVO ─────────────────────
  const renderKPIs = () => {
    const fat = Number(kpis.faturamento_mes_atual || 0);
    const crescimento = Number(kpis.crescimento_percentual || 0);
    const ocupacao = kpis.taxa_ocupacao || 0;
    const taxaNoshow = kpis.taxa_noshow || 0;

    return (
      <div className="mb-4 md:mb-6">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">
          📊 SITUAÇÃO ATUAL
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
          <KpiCard
            label="Faturamento"
            value={fmtShort(fat)}
            sub={crescimento >= 0 ? `+${fmtPct(crescimento)}` : `${fmtPct(crescimento)}`}
            icon={DollarSign}
            accent={fat >= meta ? EMERALD : RED}
            trend={crescimento >= 0 ? 'up' : 'down'}
            loading={loading}
          />
          <KpiCard
            label="Meta"
            value={fmtPct((fat / meta) * 100)}
            sub={fat >= meta ? 'Meta batida!' : `Falta ${fmtShort(meta - fat)}`}
            icon={Target}
            accent={fat >= meta ? EMERALD : RED}
            trend={fat >= meta ? 'up' : 'down'}
            loading={loading}
          />
          <KpiCard
            label="No-shows"
            value={`${taxaNoshow}%`}
            sub={`Perda: ${fmtShort(fat * (taxaNoshow/100))}`}
            icon={AlertTriangle}
            accent={taxaNoshow < 10 ? EMERALD : taxaNoshow < 15 ? AMBER : RED}
            trend={taxaNoshow < 10 ? 'up' : 'down'}
            loading={loading}
          />
          <KpiCard
            label="Ocupação"
            value={fmtPct(ocupacao)}
            sub={`${fmtPct(100 - ocupacao)} ocioso`}
            icon={Calendar}
            accent={ocupacao > 80 ? EMERALD : ocupacao > 60 ? AMBER : RED}
            trend={ocupacao > 70 ? 'up' : 'down'}
            loading={loading}
          />
        </div>
      </div>
    );
  };

  // ─── Renderizar Detalhes RESPONSIVO ────────────────────────────
  const renderDetalhes = () => (
    <div className="space-y-4 md:space-y-6">
      {/* Gráficos principais - Responsivo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
        {/* Evolução mensal */}
        <div className="bg-white rounded-lg md:rounded-xl border border-gray-100 shadow-sm p-4">
          <SectionTitle icon={TrendingUp} color={PURPLE}>
            Evolução do Faturamento
          </SectionTitle>
          <div className="h-48 md:h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historico}>
                <defs>
                  <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={PURPLE} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={PURPLE} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="mes" 
                  tick={{ fontSize: mobileView ? 10 : 12 }} 
                />
                <YAxis 
                  tickFormatter={(v) => `R$${v/1000}k`} 
                  tick={{ fontSize: mobileView ? 10 : 12 }} 
                />
                <Tooltip formatter={(value) => [fmtR(value), 'Faturamento']} />
                <Area type="monotone" dataKey="valor" stroke={PURPLE} strokeWidth={2} fill="url(#colorValor)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Serviço Top - Responsivo */}
        <div className="bg-white rounded-lg md:rounded-xl border border-gray-100 shadow-sm p-4">
          <SectionTitle icon={Crown} color={AMBER}>
            Serviço Campeão
          </SectionTitle>
          {porServico.length > 0 ? (
            <div className="space-y-3 md:space-y-4">
              <div className="text-center p-3 md:p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg border border-amber-100">
                <div className={`${mobileView ? 'w-10 h-10' : 'w-12 h-12'} inline-flex items-center justify-center rounded-full bg-amber-100 mb-2 md:mb-3`}>
                  <Scissors size={mobileView ? 16 : 20} className="text-amber-600" />
                </div>
                <h4 className={`${mobileView ? 'text-base' : 'text-lg'} font-bold text-gray-900 mb-1 truncate px-2`}>
                  {porServico[0].name}
                </h4>
                <p className={`${mobileView ? 'text-xl' : 'text-2xl'} font-bold text-amber-600 mb-2`}>
                  {fmtShort(porServico[0].value)}
                </p>
                <div className="grid grid-cols-2 gap-2 md:gap-3">
                  <div className="text-center">
                    <p className="text-xs font-semibold text-gray-500">Atendimentos</p>
                    <p className="text-sm md:text-base font-bold text-gray-900">{porServico[0].atendimentos}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-semibold text-gray-500">Margem</p>
                    <p className="text-sm md:text-base font-bold text-emerald-600">{fmtPct(porServico[0].margem)}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-1.5 md:space-y-2">
                <p className="text-sm font-semibold text-gray-700">Outros serviços:</p>
                {porServico.slice(1, mobileView ? 3 : 4).map((servico, index) => (
                  <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                    <span className="text-xs md:text-sm font-medium text-gray-700 truncate pr-2">
                      {servico.name}
                    </span>
                    <span className="text-xs md:text-sm font-bold text-gray-900">
                      {fmtShort(servico.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 md:h-40">
              <p className="text-gray-400 text-sm">Sem dados de serviços</p>
            </div>
          )}
        </div>
      </div>

      {/* Performance da equipe - Responsivo */}
      <div className="bg-white rounded-lg md:rounded-xl border border-gray-100 shadow-sm p-4">
        <SectionTitle icon={Users} color={BLUE}>
          Equipe para Executar
        </SectionTitle>
        <div className="overflow-x-auto -mx-4 md:mx-0">
          <div className="min-w-full">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 pl-4 md:pl-0 text-xs font-semibold text-gray-500 uppercase">Profissional</th>
                  <th className="text-right py-2 pr-4 md:pr-0 text-xs font-semibold text-gray-500 uppercase">Faturamento</th>
                  {!mobileView && (
                    <>
                      <th className="text-right py-2 text-xs font-semibold text-gray-500 uppercase">Ticket</th>
                      <th className="text-right py-2 text-xs font-semibold text-gray-500 uppercase">Capacidade</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {porProf.slice(0, mobileView ? 3 : 5).map((prof, index) => (
                  <tr key={index} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2 pl-4 md:pl-0">
                      <div className="flex items-center gap-2 md:gap-3">
                        <div className={`${mobileView ? 'w-6 h-6' : 'w-8 h-8'} rounded-md flex items-center justify-center ${index === 0 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                          {index === 0 ? (
                            <Target size={mobileView ? 10 : 12} />
                          ) : (
                            <span className="text-xs font-bold">#{index + 1}</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs md:text-sm font-semibold text-gray-900 truncate">
                            {prof.nome}
                          </p>
                          {index === 0 && mobileView && (
                            <span className="text-[8px] font-bold text-red-600 bg-red-50 px-1 py-0.5 rounded">
                              RESP
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="text-right py-2 pr-4 md:pr-0">
                      <p className="text-xs md:text-sm font-bold text-gray-900">{fmtShort(prof.valor)}</p>
                    </td>
                    {!mobileView && (
                      <>
                        <td className="text-right py-2">
                          <p className="text-xs md:text-sm font-medium text-gray-700">{fmtShort(prof.ticket)}</p>
                        </td>
                        <td className="text-right py-2">
                          <div className="inline-flex items-center gap-1 md:gap-2">
                            <div className="w-16 md:w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-emerald-500 rounded-full" 
                                style={{ width: `${Math.min(prof.atendimentos * 2, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs font-semibold text-gray-600">{prof.atendimentos}</span>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {mobileView && porProf.length > 3 && (
          <p className="text-xs text-gray-500 text-center mt-2">
            + {porProf.length - 3} profissionais
          </p>
        )}
      </div>
    </div>
  );

  // ─── Menu Mobile ────────────────────────────────────────────────
  const MobileMenu = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-2 md:p-3 z-50 lg:hidden shadow-lg">
      <div className="flex justify-around">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex flex-col items-center p-2 rounded-lg active:bg-gray-100"
        >
          <AlertOctagon size={20} color={RED} />
          <span className="text-[10px] font-semibold mt-1" style={{ color: RED }}>
            Ordem
          </span>
        </button>
        <button
          onClick={() => {
            const detalhesSection = document.querySelector('.detalhes-section');
            detalhesSection?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="flex flex-col items-center p-2 rounded-lg active:bg-gray-100"
        >
          <BarChart3 size={20} color="#6b7280" />
          <span className="text-[10px] font-semibold mt-1 text-gray-500">
            Dados
          </span>
        </button>
      </div>
    </div>
  );

  // ─── RENDER PRINCIPAL RESPONSIVO ───────────────────────────────
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-2 md:p-4 overflow-hidden">
      <div className={`
        bg-white 
        ${mobileView ? 'rounded-lg' : 'rounded-xl md:rounded-2xl'} 
        w-full h-full 
        ${mobileView ? '' : 'md:max-w-3xl lg:max-w-5xl'} 
        ${mobileView ? '' : 'md:h-[90vh] lg:h-[95vh]'} 
        flex flex-col relative shadow-xl
      `}>
        
        {/* Header Responsivo */}
        <div className={`
          bg-white px-3 md:px-4 lg:px-6 py-3 md:py-4 
          border-b border-gray-200 
          flex justify-between items-center 
          shrink-0
          ${mobileView ? '' : 'rounded-t-xl md:rounded-t-2xl'}
        `}>
          <div className="flex items-center gap-2 md:gap-3">
            <div className={`
              ${mobileView ? 'p-1.5' : 'p-2'} 
              rounded-md md:rounded-lg 
              shadow
            `} style={{ background: RED }}>
              <Target size={mobileView ? 18 : 20} color="#fff" />
            </div>
            <div className="min-w-0">
              <h2 className={`
                ${mobileView ? 'text-base' : 'text-lg md:text-xl'} 
                font-bold text-gray-900
              `}>
                <span style={{ color: RED }}>COMANDO</span> OPERACIONAL
              </h2>
              <p className={`
                ${mobileView ? 'text-[10px]' : 'text-xs'} 
                font-semibold text-gray-500 uppercase tracking-wider 
                flex items-center gap-1
              `}>
                <AlertOctagon size={10} /> Ordem de Ação Mensal
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 md:p-2 bg-gray-100 rounded-md md:rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-500 transition-colors"
          >
            <X size={mobileView ? 18 : 20} />
          </button>
        </div>

        {/* Corpo Principal */}
        <div className={`
          flex-1 overflow-y-auto 
          px-3 md:px-4 lg:px-6 
          ${mobileView ? 'pb-14' : 'pb-4'} 
          bg-gray-50
        `}>
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <div className="relative">
                <Loader2 className="animate-spin" size={40} color={RED} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Target size={20} color={RED} />
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-700 mb-1">Analisando urgências...</p>
                <p className="text-xs text-gray-500">Preparando sua ordem de ação</p>
              </div>
            </div>
          ) : (
            <>
              {/* 🔴 ORDEM DO MÊS */}
              <OrdemDoMes />

              {/* KPIs de Situação */}
              {renderKPIs()}

              {/* Separador */}
              <div className="flex items-center gap-2 md:gap-3 my-4 md:my-6">
                <div className="h-px flex-1 bg-gray-300"></div>
                <span className="text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">
                  DADOS PARA EXECUTAR
                </span>
                <div className="h-px flex-1 bg-gray-300"></div>
              </div>

              {/* 📊 DETALHES PARA EXECUTAR */}
              <div className="detalhes-section">
                {renderDetalhes()}
              </div>

              {/* Banner Final de Urgência - Responsivo */}
              <div className={`
                mt-4 md:mt-6 
                p-3 md:p-4 
                bg-gradient-to-r from-red-50 to-orange-50 
                rounded-lg md:rounded-xl 
                border border-red-200
              `}>
                <div className="flex items-center gap-2 md:gap-3">
                  <div className={`${mobileView ? 'p-1.5' : 'p-2'} bg-red-100 rounded-md flex-shrink-0`}>
                    <Zap size={mobileView ? 16 : 18} className="text-red-600" />
                  </div>
                  <div className="min-w-0">
                    <h4 className={`
                      ${mobileView ? 'text-sm' : 'text-base'} 
                      font-bold text-gray-900 mb-0.5
                    `}>
                      ⏳ TEMPO ESTOURANDO
                    </h4>
                    <p className="text-xs text-gray-600">
                      Cada dia de inércia custa dinheiro. Execute agora ou ajuste amanhã.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Menu Mobile (apenas mobile e tablet) */}
        {(mobileView || tabletView) && <MobileMenu />}
      </div>
    </div>
  );
};