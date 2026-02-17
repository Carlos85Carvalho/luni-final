// src/screens/financeiro/relatorios/Relatorios.jsx
import { useState } from 'react';
import { useRelatorios } from './relatoriosHooks';
import { RelatoriosHeader } from './RelatoriosHeader';
import { RelatoriosGrid } from './RelatoriosGrid';
import { RelatoriosHistorico } from './RelatoriosHistorico';
import { RelatorioModal } from './RelatorioModal';
import { 
  DollarSign, 
  Package, 
  Truck, 
  Target, 
  ShoppingCart, 
  Users 
} from 'lucide-react';

export const Relatorios = () => {
  const [periodoSelecionado, setPeriodoSelecionado] = useState('mes');
  
  // Estado local para controlar o Modal
  const [modalAberto, setModalAberto] = useState(false);
  const [dadosModal, setDadosModal] = useState(null);

  const { relatoriosGerados, loading, gerarRelatorio } = useRelatorios();

  const tiposRelatorio = [
    {
      id: 'financeiro',
      titulo: 'Relatório Financeiro',
      descricao: 'Receitas, despesas e lucro detalhado',
      icone: DollarSign,
      cor: 'green'
    },
    // --- ALTERAÇÃO AQUI: MUDANÇA PARA VENDAS DE PRODUTOS ---
    {
      id: 'vendas_produtos', // ID novo para o hook identificar
      titulo: 'Vendas de Produtos',
      descricao: 'Ranking dos mais vendidos, faturamento e quantidade.',
      icone: Package,
      cor: 'purple'
    },
    // -------------------------------------------------------
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
      titulo: 'Relatório de Vendas (Geral)',
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

  // Função Principal: Gera e Abre o Modal
  const handleAcaoRelatorio = async (tipo) => {
    console.log('🟢 [RELATORIOS] Iniciando geração:', tipo);
    
    try {
      // 1. Busca os dados (o loading já é tratado pelo hook)
      const dadosRelatorio = await gerarRelatorio(tipo, periodoSelecionado);
      
      console.log('🟢 [RELATORIOS] Dados recebidos do hook:', dadosRelatorio);

      // 2. Validações de segurança
      if (!dadosRelatorio) {
        console.error('❌ [RELATORIOS] Hook retornou null/undefined');
        return;
      }

      // 3. Atualiza o estado local com os dados REAIS
      setDadosModal(dadosRelatorio);
      
      // 4. Abre o modal
      setModalAberto(true);

    } catch (error) {
      console.error('❌ [RELATORIOS] Erro crítico:', error);
      alert('Erro ao processar relatório.');
    }
  };

  // Função para abrir histórico (já tem os dados salvos)
  const handleVisualizarHistorico = (itemHistorico) => {
    console.log('🟢 [RELATORIOS] Abrindo histórico:', itemHistorico);
    setDadosModal(itemHistorico.dados);
    setModalAberto(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      
      {/* Header com Filtro de Período */}
      <RelatoriosHeader 
        periodoSelecionado={periodoSelecionado}
        setPeriodoSelecionado={setPeriodoSelecionado}
        periodos={periodos}
        onExportarTodos={() => console.log('Exportar todos')}
      />

      {/* Grid de Cards (Botões) */}
      <RelatoriosGrid
        tiposRelatorio={tiposRelatorio}
        periodoSelecionado={periodoSelecionado}
        onGerarRelatorio={handleAcaoRelatorio}
        onVisualizarPreview={handleAcaoRelatorio}
        loading={loading}
      />

      {/* Lista de Histórico */}
      {relatoriosGerados.length > 0 && (
        <RelatoriosHistorico
          relatoriosGerados={relatoriosGerados}
          loading={loading}
          onVisualizar={handleVisualizarHistorico}
          onExportar={(item) => console.log('Exportar', item)}
        />
      )}

      {/* MODAL RENDERIZADO AQUI - Passagem direta de props */}
      <RelatorioModal 
        aberto={modalAberto}
        onFechar={() => setModalAberto(false)}
        dados={dadosModal}
      />
      
    </div>
  );
};