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
    { id: 'ano', label: 'Este Ano' }
  ];

  // Função para visualizar ou gerar relatório
  const handleAcaoRelatorio = async (tipo) => {
    console.log('🟢 [RELATORIOS] Ação iniciada para tipo:', tipo);
    console.log('🟢 [RELATORIOS] Período selecionado:', periodoSelecionado);
    
    try {
      // Gera o relatório através do hook
      const dadosRelatorio = await gerarRelatorio(tipo, periodoSelecionado);
      
      console.log('🟢 [RELATORIOS] Dados retornados do hook:', dadosRelatorio);

      // Verificar se retornou dados válidos
      if (!dadosRelatorio) {
        console.error('❌ [RELATORIOS] Hook retornou null');
        alert('Erro ao gerar relatório. Verifique o console (F12) para mais detalhes.');
        return;
      }

      if (!dadosRelatorio.resumo) {
        console.warn('⚠️ [RELATORIOS] Relatório sem dados no resumo');
        alert(`Não há dados para o relatório de ${tipo} no período: ${periodoSelecionado}`);
        return;
      }

      // Verificar se resumo tem algum valor não-zero
      const temDados = Object.values(dadosRelatorio.resumo).some(v => {
        if (typeof v === 'number') return v !== 0;
        return true;
      });

      if (!temDados) {
        console.warn('⚠️ [RELATORIOS] Todos os valores do resumo são zero');
        alert(`Não há registros para o período selecionado (${periodoSelecionado}). Tente outro período ou verifique se há dados cadastrados.`);
        return;
      }

      console.log('✅ [RELATORIOS] Dados válidos, abrindo modal...');
      
      // Abrir modal com os dados
      onAbrirModal('visualizar-relatorio', { 
        tipo, 
        periodo: periodoSelecionado, 
        dados: dadosRelatorio 
      });

      console.log('✅ [RELATORIOS] Modal aberto com sucesso');

    } catch (error) {
      console.error('❌ [RELATORIOS] Erro ao processar relatório:', error);
      alert('Erro ao processar relatório. Verifique o console (F12) para mais detalhes.');
    }
  };

  const handleExportar = (tipo) => {
    console.log('📥 [RELATORIOS] Exportando relatório:', tipo);
    // TODO: Implementar exportação direta
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header com Filtro de Período */}
      <RelatoriosHeader 
        periodoSelecionado={periodoSelecionado}
        setPeriodoSelecionado={setPeriodoSelecionado}
        periodos={periodos}
        onExportarTodos={() => handleExportar('todos')}
      />

      {/* Grid de Cards */}
      <RelatoriosGrid
        tiposRelatorio={tiposRelatorio}
        periodoSelecionado={periodoSelecionado}
        onGerarRelatorio={handleAcaoRelatorio}
        onVisualizarPreview={handleAcaoRelatorio}
        loading={loading}
      />

      {/* Histórico Recente */}
      {relatoriosGerados.length > 0 && (
        <RelatoriosHistorico
          relatoriosGerados={relatoriosGerados}
          loading={loading}
          onVisualizar={(item) => {
            console.log('🟢 [RELATORIOS] Visualizando do histórico:', item);
            onAbrirModal('visualizar-relatorio', { dados: item.dados });
          }}
          onExportar={(item) => handleExportar(item.tipo)}
        />
      )}
    </div>
  );
};