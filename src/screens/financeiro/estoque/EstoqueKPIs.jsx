// src/screens/financeiro/estoque/EstoqueKPIs.jsx
import React from 'react';
// CORREÇÃO: Importamos FinancialCard e damos o apelido de KPICard
import { FinancialCard as KPICard } from '../components/FinancialCard'; 
import { DollarSign, AlertTriangle, TrendingUp, BarChart } from 'lucide-react';

export const EstoqueKPIs = ({ kpis = {}, loading, onAbrirModal }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <KPICard
        titulo="Valor em Estoque"
        valor={kpis.valorTotal || 0}
        icone={DollarSign}
        cor="green"
        loading={loading}
        subTitulo={`${kpis.totalItens || 0} itens`}
        format="currency"
        onClick={() => onAbrirModal('analise-estoque')}
      />

      <KPICard
        titulo="Estoque Crítico"
        valor={kpis.qtdCriticos || 0}
        icone={AlertTriangle}
        cor="red"
        loading={loading}
        subTitulo="Abaixo do mínimo"
        format="text"
        onClick={() => onAbrirModal('produtos-criticos')}
      />

      <KPICard
        titulo="Giro de Estoque"
        valor={kpis.giroMedio || 0}
        icone={TrendingUp}
        cor="blue"
        loading={loading}
        subTitulo="Média mensal"
        format="percent"
        onClick={() => onAbrirModal('giro-estoque')}
      />

      <KPICard
        titulo="Margem Média"
        valor={kpis.margemMedia || 0}
        icone={BarChart}
        cor="purple"
        loading={loading}
        subTitulo="Lucro estimado"
        format="percent"
        onClick={() => onAbrirModal('margem-produtos')}
      />
    </div>
  );
};