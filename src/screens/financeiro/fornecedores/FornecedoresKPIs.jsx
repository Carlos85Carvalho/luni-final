// src/screens/financeiro/fornecedores/FornecedoresKPIs.jsx
import React from 'react';
// CORREÇÃO: Importamos FinancialCard, mas chamamos de KPICard para manter o código abaixo funcionando
import { FinancialCard as KPICard } from '../components/FinancialCard'; 
import { DollarSign, Truck, AlertTriangle, Receipt } from 'lucide-react';

export const FornecedoresKPIs = ({ kpis = {}, loading, onAbrirModal }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <KPICard
        titulo="Maior Volume"
        valor={kpis.fornecedorTop?.total_gasto || 0}
        icone={DollarSign}
        cor="green"
        loading={loading}
        subTitulo={kpis.fornecedorTop?.nome || 'Nenhum'}
        format="currency"
        onClick={() => onAbrirModal('ranking-compras')}
      />
       
      <KPICard
        titulo="Fornecedor Top"
        valor={kpis.fornecedorTop?.nome || 'Nenhum'}
        icone={Truck}
        cor="blue"
        loading={loading}
        subTitulo={`${kpis.fornecedorTop?.total_compras || 0} compras`}
        format="text"
        onClick={() => onAbrirModal('frequencia-compras')}
      />
       
      <KPICard
        titulo="Índice Dependência"
        valor={kpis.indiceDependencia || 0}
        icone={AlertTriangle}
        cor="orange"
        loading={loading}
        subTitulo="Concentração"
        format="percent"
        onClick={() => onAbrirModal('dependencia-fornecedores')}
      />
       
      <KPICard
        titulo="Total Gasto"
        valor={kpis.totalGasto || 0}
        icone={Receipt}
        cor="purple"
        loading={loading}
        subTitulo="Período atual"
        format="currency"
        onClick={() => onAbrirModal('compras-analise')}
      />
    </div>
  );
};