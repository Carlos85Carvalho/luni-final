// src/screens/financeiro/relatorios/Relatorios.jsx
import { useState } from 'react';
import { useRelatorios } from './relatoriosHooks';
import { RelatoriosHeader } from './RelatoriosHeader';
import { RelatoriosGrid } from './RelatoriosGrid';
import { RelatoriosHistorico } from './RelatoriosHistorico';
import { 
  DollarSign, 
  Package, 
  Truck, 
  Target, 
  ShoppingCart, 
  Users 
} from 'lucide-react';

export const Relatorios = ({ onAbrirModal }) => {
  const [periodoSelecionado, setPeriodoSelecionado] = useState('mes');
  const { relatoriosGerados, loading, gerarRelatorio } = useRelatorios();

  const tiposRelatorio = [
    {
      id: 'financeiro',
      titulo: 'Relatório Financeiro',
      descricao: 'Receitas, despesas e lucro detalhado',
      icone: DollarSign,
      cor: 'green'
    },
    {
      id: 'estoque',
      titulo: 'Relatório de Estoque',
      descricao: 'Giro, lucro e estoque crítico',
      icone: Package,
      cor: 'blue'
    },
    {
      id: 'fornecedores',
      titulo: 'Relatório de Fornecedores',
      descricao: 'Compras, ranking e dependência',
      icone: Truck,
      cor: 'orange'
    },
    {
      id: 'metas',
      titulo: 'Relatório de Metas',
      descricao: 'Progresso e desempenho das metas',
      icone: Target,
      cor: 'purple'
    },
    {
      id: 'vendas',
      titulo: 'Relatório de Vendas',
      descricao: 'Ticket médio, serviços mais vendidos',
      icone: ShoppingCart,
      cor: 'red'
    },
    {
      id: 'clientes',
      titulo: 'Relatório de Clientes',
      descricao: 'Frequência, fidelidade e valor',
      icone: Users,
      cor: 'pink'
    }
  ];

  const periodos = [
    { id: 'hoje', label: 'Hoje' },
    { id: 'semana', label: 'Esta Semana' },
    { id: 'mes', label: 'Este Mês' },
    { id: 'trimestre', label: 'Este Trimestre' },
    { id: 'ano', label: 'Este Ano' },
    { id: 'personalizado', label: 'Personalizado' }
  ];

  const handleGerarRelatorio = async (tipo) => {
    const relatorio = await gerarRelatorio(tipo, periodoSelecionado);
    if (relatorio) {
      onAbrirModal('visualizar-relatorio', { tipo, periodo: periodoSelecionado, dados: relatorio });
    }
  };

  const handleExportar = (tipo) => {
    // Lógica de exportação
    console.log(`Exportando relatório ${tipo}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <RelatoriosHeader 
        periodoSelecionado={periodoSelecionado}
        setPeriodoSelecionado={setPeriodoSelecionado}
        periodos={periodos}
        onExportarTodos={() => handleExportar('todos')}
      />

      {/* Grid de Tipos de Relatório */}
      <RelatoriosGrid
        tiposRelatorio={tiposRelatorio}
        periodoSelecionado={periodoSelecionado}
        onGerarRelatorio={handleGerarRelatorio}
        onVisualizarPreview={(tipo) => onAbrirModal('preview-relatorio', { tipo, periodo: periodoSelecionado })}
        loading={loading}
      />

      {/* Histórico de Relatórios Gerados */}
      <RelatoriosHistorico
        relatoriosGerados={relatoriosGerados}
        loading={loading}
        onVisualizar={(relatorio) => onAbrirModal('visualizar-relatorio', relatorio)}
        onExportar={(relatorio) => handleExportar(relatorio.tipo)}
      />
    </div>
  );
};