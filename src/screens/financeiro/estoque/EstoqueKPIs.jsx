// src/screens/financeiro/estoque/EstoqueKPIs.jsx
import React from 'react';
import { FinancialCard as KPICard } from '../components/FinancialCard'; 
import { DollarSign, AlertTriangle, TrendingUp, BarChart, Wallet } from 'lucide-react';

export const EstoqueKPIs = ({ kpis = {}, loading, onAbrirModal }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      <KPICard
        titulo="Valor em Custo"
        // Aceita valorTotal ou valor_total do Supabase
        valor={kpis.valorTotal || kpis.valor_total || 0}
        icone={DollarSign}
        cor="gray" 
        loading={loading}
        subTitulo={`${kpis.totalItens || kpis.total_itens || 0} itens`}
        format="currency"
        onClick={() => onAbrirModal('analise-estoque')}
      />

      <KPICard
        titulo="Lucro Estimado"
        // A Mágica do Lucro conectado ao banco
        valor={kpis.lucroEstimado || kpis.lucro_estimado || 0}
        icone={Wallet}
        cor="green" 
        loading={loading}
        subTitulo="Potencial de vendas"
        format="currency"
        onClick={() => onAbrirModal('lucro-estoque')}
      />

      <KPICard
        titulo="Estoque Crítico"
        valor={kpis.qtdCriticos || kpis.qtd_criticos || 0}
        icone={AlertTriangle}
        cor="red"
        loading={loading}
        subTitulo="Abaixo do mínimo"
        format="text"
        onClick={() => onAbrirModal('produtos-criticos')}
      />

      <KPICard
        titulo="Giro de Estoque"
        valor={kpis.giroMedio || kpis.giro_medio || 0}
        icone={TrendingUp}
        cor="blue"
        loading={loading}
        subTitulo="Média mensal"
        format="percent"
        onClick={() => onAbrirModal('giro-estoque')}
      />

      <KPICard
        titulo="Margem Média"
        valor={kpis.margemMedia || kpis.margem_media || 0}
        icone={BarChart}
        cor="purple"
        loading={loading}
        subTitulo="Markup médio"
        format="percent"
        onClick={() => onAbrirModal('margem-produtos')}
      />
    </div>
  );
};