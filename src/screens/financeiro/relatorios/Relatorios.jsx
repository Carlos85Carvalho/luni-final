// src/screens/financeiro/relatorios/Relatorios.jsx
import { useState } from 'react';
import { useRelatorios } from './relatoriosHooks';
import { RelatoriosHeader } from './RelatoriosHeader';
import { RelatoriosGrid } from './RelatoriosGrid';
import { RelatoriosHistorico } from './RelatoriosHistorico';
import { RelatorioModal } from './RelatorioModal';
import { DollarSign, Package, Truck, Target, ShoppingCart, Users, Activity, Scissors, Menu, X, ChevronDown } from 'lucide-react';

export const Relatorios = () => {
  const [periodoSelecionado, setPeriodoSelecionado] = useState('mes');
  const [modalAberto, setModalAberto] = useState(false);
  const [dadosModal, setDadosModal] = useState(null);
  const [menuRelatoriosAberto, setMenuRelatoriosAberto] = useState(false);

  const { relatoriosGerados, loading, gerarRelatorio, exportarDadosPDF } = useRelatorios();

  const tiposRelatorio = [
    { id: 'financeiro', titulo: 'Relatório Financeiro', descricao: 'Receitas, despesas e lucro.', icone: DollarSign, cor: 'green' },
    { id: 'metas', titulo: 'Relatório de Metas', descricao: 'Progresso do objetivo mensal.', icone: Target, cor: 'purple' },
    { id: 'performance', titulo: 'Performance da Equipe', descricao: 'Desempenho e ticket médio.', icone: Activity, cor: 'blue' },
    { id: 'servicos', titulo: 'Análise de Serviços', descricao: 'Ranking dos mais realizados.', icone: Scissors, cor: 'pink' },
    { id: 'vendas_produtos', titulo: 'Vendas de Produtos', descricao: 'Ranking de produtos no PDV.', icone: Package, cor: 'indigo' },
    { id: 'clientes', titulo: 'Relatório de Clientes', descricao: 'Frequência e valor gasto.', icone: Users, cor: 'rose' },
    { id: 'fornecedores', titulo: 'Relatório de Fornecedores', descricao: 'Despesas vinculadas.', icone: Truck, cor: 'orange' },
    { id: 'vendas', titulo: 'Relatório Geral (Mix)', descricao: 'Visão unificada do salão.', icone: ShoppingCart, cor: 'red' }
  ];

  const periodos = [
    { id: 'hoje', label: 'Hoje' },
    { id: 'semana', label: 'Esta Semana' },
    { id: 'mes', label: 'Este Mês' },
    { id: 'ano', label: 'Este Ano' }
  ];

  const handleAcaoRelatorio = async (tipo) => {
    try {
      const dadosRelatorio = await gerarRelatorio(tipo, periodoSelecionado);
      if (!dadosRelatorio) return;
      setDadosModal(dadosRelatorio);
      setModalAberto(true);
    } catch (error) {
      console.error('Erro crítico:', error);
      alert('Erro ao processar relatório.');
    }
  };

  const handleVisualizarHistorico = (itemHistorico) => {
    setDadosModal(itemHistorico.dados);
    setModalAberto(true);
  };

  const getCorClasses = (cor) => {
    const cores = {
      green: 'bg-green-500/20 text-green-400',
      purple: 'bg-purple-500/20 text-purple-400',
      blue: 'bg-blue-500/20 text-blue-400',
      pink: 'bg-pink-500/20 text-pink-400',
      indigo: 'bg-indigo-500/20 text-indigo-400',
      rose: 'bg-rose-500/20 text-rose-400',
      orange: 'bg-orange-500/20 text-orange-400',
      red: 'bg-red-500/20 text-red-400',
    };
    return cores[cor] || 'bg-gray-500/20 text-gray-400';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative pb-10">
      
      <RelatoriosHeader 
        periodoSelecionado={periodoSelecionado}
        setPeriodoSelecionado={setPeriodoSelecionado}
        periodos={periodos}
        onExportarTodos={() => exportarDadosPDF(periodoSelecionado)}
        loading={loading} 
      />

      <div className="md:hidden relative z-30">
        <button 
          onClick={() => setMenuRelatoriosAberto(!menuRelatoriosAberto)}
          className="w-full flex items-center justify-between p-4 rounded-2xl bg-gray-800/80 border border-gray-700 hover:bg-gray-700 transition-all shadow-lg"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-xl">
              <Menu className="text-purple-400" size={22} />
            </div>
            <div className="text-left">
              <span className="block font-bold text-white text-base">Gerar Relatório</span>
              <span className="block text-xs text-gray-400 font-medium">Toque para escolher</span>
            </div>
          </div>
          {menuRelatoriosAberto ? <X size={24} className="text-gray-400" /> : <ChevronDown size={24} className="text-gray-400" />}
        </button>

        {menuRelatoriosAberto && <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={() => setMenuRelatoriosAberto(false)} />}

        {menuRelatoriosAberto && (
          <div className="absolute left-0 right-0 top-[80px] z-50 bg-[#18181b] border border-gray-700/60 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-top-2">
            <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-2 space-y-1">
              {tiposRelatorio.map(relatorio => {
                const Icone = relatorio.icone;
                return (
                  <button
                    key={relatorio.id}
                    onClick={() => {
                      handleAcaoRelatorio(relatorio.id);
                      setMenuRelatoriosAberto(false);
                    }}
                    disabled={loading}
                    className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-gray-800/80 transition-all text-left group active:scale-95"
                  >
                    <div className={`p-2.5 rounded-xl transition-colors ${getCorClasses(relatorio.cor)}`}>
                      <Icone size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white group-hover:text-purple-400 transition-colors">
                        {relatorio.titulo}
                      </h3>
                      <p className="text-xs text-gray-400 mt-0.5">{relatorio.descricao}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="hidden md:block">
        <RelatoriosGrid tiposRelatorio={tiposRelatorio} periodoSelecionado={periodoSelecionado} onGerarRelatorio={handleAcaoRelatorio} onVisualizarPreview={handleAcaoRelatorio} loading={loading} />
      </div>

      {relatoriosGerados.length > 0 && (
        <RelatoriosHistorico relatoriosGerados={relatoriosGerados} loading={loading} onVisualizar={handleVisualizarHistorico} onExportar={(item) => console.log('Exportar', item)} />
      )}

      <RelatorioModal aberto={modalAberto} onFechar={() => setModalAberto(false)} dados={dadosModal} />
      
    </div>
  );
};