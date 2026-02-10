// src/screens/financeiro/relatorios/RelatorioModal.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Download, Printer, Share2, FileText, Loader2, BarChart3 } from 'lucide-react'; 
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, 
  ResponsiveContainer, CartesianGrid 
} from 'recharts';

import { relatoriosService } from './TEMP_SERVICE';

export const RelatorioModal = ({ 
  aberto, 
  onFechar, 
  tipo = 'financeiro', 
  periodo = 'mes',
  dados 
}) => {
  const [loading, setLoading] = useState(false);
  const [relatorioData, setRelatorioData] = useState(null);
  const [visualizacao, setVisualizacao] = useState('grafico');

  const getTipoLabel = (t) => {
    const labels = {
      financeiro: 'Financeiro',
      estoque: 'de Estoque',
      fornecedores: 'de Fornecedores',
      metas: 'de Metas'
    };
    return labels[t] || t;
  };

  const gerarDadosExemplo = useCallback((t, p) => {
    const baseData = {
      titulo: `Relatório ${getTipoLabel(t)} - ${p}`,
      periodo: p,
      dataGeracao: new Date().toISOString(),
      resumo: {},
      detalhes: [],
      graficos: []
    };

    switch (t) {
      case 'financeiro':
        return {
          ...baseData,
          titulo: 'Relatório Financeiro',
          resumo: { receitaTotal: 75000, despesaTotal: 45000, lucroLiquido: 30000, margemLucro: 40 },
          detalhes: [
            { categoria: 'Cortes', valor: 25000 },
            { categoria: 'Coloração', valor: 18000 },
            { categoria: 'Produtos', valor: 20000 }
          ],
          graficos: [
            { mes: 'Jan', receita: 65000, despesa: 42000 },
            { mes: 'Fev', receita: 72000, despesa: 45000 }
          ]
        };
      case 'estoque':
        return {
          ...baseData,
          titulo: 'Relatório de Estoque',
          resumo: { totalItens: 1500, valorEstoque: 45000, itensCriticos: 12 },
          detalhes: [
            { produto: 'Shampoo X', estoque: 10, status: 'Crítico' },
            { produto: 'Condicionador Y', estoque: 50, status: 'Normal' }
          ]
        };
      default:
        return baseData;
    }
  }, []);

  // CORREÇÃO: carregarRelatorio agora usa useCallback para ser uma dependência estável
  const carregarRelatorio = useCallback(async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      const dadosExemplo = gerarDadosExemplo(tipo, periodo);
      setRelatorioData(dadosExemplo);
    } catch (error) {
      console.error('Erro ao carregar relatório:', error);
    } finally {
      setLoading(false);
    }
  }, [tipo, periodo, gerarDadosExemplo]);

  useEffect(() => {
    if (aberto) {
      if (dados) {
        setRelatorioData(dados);
      } else if (tipo) {
        carregarRelatorio();
      }
    }
  }, [aberto, tipo, periodo, dados, carregarRelatorio]);

  // --- AÇÕES DOS BOTÕES ---

  const handleExportarPDF = async () => {
    if (!relatorioData) return;
    try {
      setLoading(true);
      await relatoriosService.exportarParaPDF(relatorioData, relatorioData.titulo || 'Relatorio');
    } catch (error) {
      console.error("Erro ao exportar PDF:", error);
      alert("Erro ao gerar PDF. Verifique o console.");
    } finally {
      setLoading(false);
    }
  };

  const handleExportarExcel = async () => {
    if (!relatorioData) return;
    try {
      setLoading(true);
      await relatoriosService.exportarParaExcel(relatorioData, relatorioData.titulo || 'Relatorio');
    } catch (error) {
      console.error("Erro ao exportar Excel:", error);
      alert("Erro ao gerar Excel.");
    } finally {
      setLoading(false);
    }
  };

  const handleCompartilhar = async () => {
    if (!relatorioData) return;

    const linhasResumo = Object.entries(relatorioData.resumo || {}).map(([key, value]) => {
      const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      const valorFormatado = typeof value === 'number' 
        ? value.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) 
        : value;
      const prefixo = (key.toLowerCase().includes('valor') || key.toLowerCase().includes('receita') || key.toLowerCase().includes('despesa') || key.toLowerCase().includes('lucro')) ? 'R$ ' : '';
      return `• ${label}: ${prefixo}${valorFormatado}`;
    });

    const textoMensagem = `
📊 *${relatorioData.titulo}*
📅 Data: ${new Date().toLocaleDateString('pt-BR')}

*Resumo:*
${linhasResumo.join('\n')}

🚀 _Gerado pelo Sistema Luni_`.trim();

    if (navigator.share) {
      try {
        await navigator.share({
          title: relatorioData.titulo,
          text: textoMensagem,
        });
      } catch {
        // CORREÇÃO: Removido 'err' não utilizado para limpar o ESLint
        console.log('Compartilhamento cancelado ou não disponível.');
      }
    } else {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (!isMobile) {
        const confirmar = window.confirm("O menu de compartilhamento nativo não está disponível. Deseja abrir o WhatsApp Web com o resumo?");
        if (confirmar) {
            const urlZap = `https://web.whatsapp.com/send?text=${encodeURIComponent(textoMensagem)}`;
            window.open(urlZap, '_blank');
        } else {
            await navigator.clipboard.writeText(textoMensagem);
            alert('Resumo copiado para a área de transferência!');
        }
      } else {
         await navigator.clipboard.writeText(textoMensagem);
         alert('Resumo copiado!');
      }
    }
  };

  const handleImprimir = () => {
    window.print();
  };

  if (!aberto) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
      <div className="bg-gray-900 border border-gray-700 w-full max-w-6xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden relative">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800 bg-gray-900/95 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <FileText className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{relatorioData?.titulo || 'Relatório'}</h2>
              <p className="text-sm text-gray-400">
                Gerado em {relatorioData?.dataGeracao ? new Date(relatorioData.dataGeracao).toLocaleDateString('pt-BR') : '--'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex bg-gray-800/50 rounded-lg p-1">
              <button
                onClick={() => setVisualizacao('grafico')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${visualizacao === 'grafico' ? 'bg-purple-500 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                <BarChart3 className="w-4 h-4 inline-block mr-2" /> Gráfico
              </button>
              <button
                onClick={() => setVisualizacao('tabela')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${visualizacao === 'tabela' ? 'bg-purple-500 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                <FileText className="w-4 h-4 inline-block mr-2" /> Tabela
              </button>
            </div>
            <button onClick={onFechar} className="p-2 hover:bg-gray-800/50 rounded-lg transition-colors">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b border-gray-800 bg-gray-900/90">
          <div className="flex flex-wrap gap-2">
            <button onClick={handleExportarPDF} disabled={loading} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg flex items-center gap-2 text-sm transition-colors disabled:opacity-50">
              <Download className="w-4 h-4" /> PDF
            </button>
            <button onClick={handleExportarExcel} disabled={loading} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg flex items-center gap-2 text-sm transition-colors disabled:opacity-50">
              <Download className="w-4 h-4" /> Excel
            </button>
            <button onClick={handleImprimir} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg flex items-center gap-2 text-sm transition-colors">
              <Printer className="w-4 h-4" /> Imprimir
            </button>
            <button 
              onClick={handleCompartilhar} 
              className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-medium rounded-lg flex items-center gap-2 text-sm transition-colors shadow-lg shadow-green-900/20"
            >
              <Share2 className="w-4 h-4" /> Compartilhar
            </button>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-12 h-12 text-purple-400 animate-spin mb-4" />
              <p className="text-gray-400">Processando...</p>
            </div>
          ) : relatorioData ? (
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(relatorioData.resumo || {}).map(([key, value]) => (
                  <div key={key} className="bg-gray-800/30 p-4 rounded-xl border border-gray-700">
                    <p className="text-sm text-gray-400 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                    <p className="text-xl font-bold text-white mt-2">
                      {(typeof value === 'number' && (key.toLowerCase().includes('valor') || key.toLowerCase().includes('receita') || key.toLowerCase().includes('despesa') || key.toLowerCase().includes('lucro')))
                        ? `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                        : (typeof value === 'number' && (key.toLowerCase().includes('margem') || key.toLowerCase().includes('percentual')))
                          ? `${value.toFixed(1)}%`
                          : value}
                    </p>
                  </div>
                ))}
              </div>

              {visualizacao === 'grafico' && relatorioData.graficos && relatorioData.graficos.length > 0 && (
                <div className="bg-gray-800/30 rounded-xl border border-gray-700 p-6">
                  <h3 className="text-lg font-bold text-white mb-6">Evolução</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={relatorioData.graficos}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="mes" stroke="#9ca3af" />
                        <YAxis stroke="#9ca3af" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1f2937',
                            borderRadius: '12px',
                            border: '1px solid rgba(255,255,255,0.1)'
                          }}
                        />
                        <Bar dataKey="receita" fill="#10b981" name="Receita" />
                        <Bar dataKey="despesa" fill="#ef4444" name="Despesa" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {visualizacao === 'tabela' && relatorioData.detalhes && (
                <div className="bg-gray-800/30 rounded-xl border border-gray-700 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-700/50">
                        <tr>
                          {relatorioData.detalhes.length > 0 && Object.keys(relatorioData.detalhes[0]).map(key => (
                            <th key={key} className="py-3 px-6 text-left text-xs font-semibold text-gray-400 uppercase">
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {relatorioData.detalhes.map((item, index) => (
                          <tr key={index} className="border-t border-gray-700/50 hover:bg-gray-700/30">
                            {Object.values(item).map((value, i) => (
                              <td key={i} className="py-3 px-6 text-gray-300">
                                {typeof value === 'number' 
                                  ? value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
                                  : value}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-20">
              <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Nenhum dado disponível para este relatório</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-800 bg-gray-900/95">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-400">
              Relatório gerado pelo sistema Luni • Para uso interno
            </p>
            <button
              onClick={onFechar}
              className="px-6 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};