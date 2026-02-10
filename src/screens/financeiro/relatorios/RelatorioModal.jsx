// src/screens/financeiro/relatorios/RelatorioModal.jsx
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Download, Printer, Share2, FileText, 
  Loader2, BarChart3, Table as TableIcon 
} from 'lucide-react'; 
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, 
  ResponsiveContainer, CartesianGrid, Cell 
} from 'recharts';

import { relatoriosService } from './relatorios.service';

export const RelatorioModal = ({ 
  aberto, 
  onFechar, 
  dados 
}) => {
  const [loading, setLoading] = useState(false);
  const [visualizacao, setVisualizacao] = useState('grafico');
  const [relatorioData, setRelatorioData] = useState(null);

  // Sincronizar dados quando o modal abrir ou dados mudarem
  useEffect(() => {
    console.log('🟣 [MODAL] useEffect disparado');
    console.log('🟣 [MODAL] aberto:', aberto);
    console.log('🟣 [MODAL] dados recebidos:', dados);
    
    if (aberto && dados) {
      // Extrair dados se vierem aninhados
      const extraido = dados.dados ? dados.dados : dados;
      console.log('🟣 [MODAL] Dados extraídos:', extraido);
      setRelatorioData(extraido);
    } else if (!aberto) {
      console.log('🟣 [MODAL] Modal fechado, limpando dados');
      setRelatorioData(null);
    }
  }, [aberto, dados]);

  if (!aberto) return null;

  // ===== HANDLERS =====
  
  const handleExportarPDF = async () => {
    if (!relatorioData) {
      alert('Nenhum dado para exportar');
      return;
    }
    
    console.log('📄 [MODAL] Exportando PDF...');
    
    try {
      setLoading(true);
      await relatoriosService.exportarParaPDF(
        relatorioData, 
        relatorioData.titulo || 'Relatorio'
      );
      console.log('✅ [MODAL] PDF exportado');
    } catch (error) {
      console.error('❌ [MODAL] Erro ao exportar PDF:', error);
      alert('Erro ao gerar PDF');
    } finally {
      setLoading(false);
    }
  };

  const handleExportarExcel = async () => {
    if (!relatorioData) {
      alert('Nenhum dado para exportar');
      return;
    }
    
    console.log('📊 [MODAL] Exportando Excel...');
    
    try {
      setLoading(true);
      await relatoriosService.exportarParaExcel(
        relatorioData, 
        relatorioData.titulo || 'Relatorio'
      );
      console.log('✅ [MODAL] Excel exportado');
    } catch (error) {
      console.error('❌ [MODAL] Erro ao exportar Excel:', error);
      alert('Erro ao gerar Excel');
    } finally {
      setLoading(false);
    }
  };

  const handleCompartilhar = async () => {
    if (!relatorioData) return;
    
    const msg = `📊 *${relatorioData.titulo}*\n🚀 _Gerado pelo Sistema Luni_`;
    
    try {
      if (navigator.share) {
        await navigator.share({ 
          title: relatorioData.titulo, 
          text: msg 
        });
      } else {
        await navigator.clipboard.writeText(msg);
        alert('Resumo copiado para área de transferência!');
      }
    } catch {
      // Removido o parâmetro 'error' não utilizado para sanar o erro do ESLint
      console.log('Compartilhamento cancelado ou falhou');
    }
  };

  // ===== RENDERIZAÇÃO =====

  return createPortal(
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
      <div className="bg-gray-900 border border-gray-700 w-full max-w-6xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden relative">
        
        {/* ===== HEADER ===== */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800 bg-gray-900/95 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <FileText className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {relatorioData?.titulo || 'Carregando...'}
              </h2>
              <p className="text-sm text-gray-400">
                {relatorioData?.dataGeracao 
                  ? `Gerado em ${new Date(relatorioData.dataGeracao).toLocaleDateString('pt-BR')}` 
                  : '--'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Toggle Gráfico/Tabela */}
            <div className="flex bg-gray-800/50 rounded-lg p-1 border border-gray-700">
              <button
                onClick={() => setVisualizacao('grafico')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-2 ${
                  visualizacao === 'grafico' 
                    ? 'bg-purple-600 text-white shadow-lg' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <BarChart3 size={16} />
                Gráfico
              </button>
              <button
                onClick={() => setVisualizacao('tabela')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-2 ${
                  visualizacao === 'tabela' 
                    ? 'bg-purple-600 text-white shadow-lg' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <TableIcon size={16} />
                Tabela
              </button>
            </div>
            
            <button 
              onClick={onFechar} 
              className="p-2 hover:bg-gray-800/50 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* ===== TOOLBAR ===== */}
        <div className="p-4 border-b border-gray-800 bg-gray-900/90 flex flex-wrap gap-2">
          <button
            onClick={handleExportarPDF}
            disabled={loading}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 rounded-lg flex items-center gap-2 text-sm disabled:opacity-50"
          >
            <Download size={16} /> PDF
          </button>
          
          <button
            onClick={handleExportarExcel}
            disabled={loading}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 rounded-lg flex items-center gap-2 text-sm disabled:opacity-50"
          >
            <Download size={16} /> Excel
          </button>
          
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 rounded-lg flex items-center gap-2 text-sm"
          >
            <Printer size={16} /> Imprimir
          </button>
          
          <button
            onClick={handleCompartilhar}
            className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-medium rounded-lg flex items-center gap-2 text-sm shadow-lg shadow-green-900/20"
          >
            <Share2 size={16} /> Compartilhar
          </button>
        </div>

        {/* ===== CONTEÚDO ===== */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#0f0f12] custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-12 h-12 text-purple-400 animate-spin mb-4" />
              <p className="text-gray-400">Processando dados...</p>
            </div>
          ) : relatorioData?.resumo ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              
              {/* ===== CARDS DE RESUMO (KPIs) ===== */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(relatorioData.resumo).map(([key, value]) => {
                  const isMoeda = key.toLowerCase().match(/valor|receita|despesa|lucro|faturamento|total|ticket/);
                  const isPct = key.toLowerCase().match(/margem|percentual|participacao/);
                  
                  return (
                    <div 
                      key={key} 
                      className="bg-gray-800/40 p-5 rounded-xl border border-gray-700 shadow-lg hover:bg-gray-800/60 transition-colors"
                    >
                      <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </p>
                      <p className={`text-2xl font-bold ${
                        key.toLowerCase().includes('lucro') && value < 0 
                          ? 'text-red-400' 
                          : 'text-white'
                      }`}>
                        {typeof value === 'number' 
                          ? (isMoeda 
                              ? value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) 
                              : (isPct ? `${value.toFixed(2)}%` : value))
                          : value}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* ===== GRÁFICOS ===== */}
              {visualizacao === 'grafico' && relatorioData.graficos?.length > 0 && (
                <div className="bg-gray-800/20 rounded-xl border border-gray-700 p-6">
                  <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-purple-400" />
                    Análise Estratégica
                  </h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={relatorioData.graficos}>
                        <CartesianGrid 
                          strokeDasharray="3 3" 
                          stroke="rgba(255,255,255,0.05)" 
                          vertical={false} 
                        />
                        <XAxis 
                          dataKey={relatorioData.graficos[0].mes ? "mes" : "name"} 
                          stroke="#6b7280" 
                          fontSize={12} 
                          tickLine={false} 
                          axisLine={false} 
                        />
                        <YAxis 
                          stroke="#6b7280" 
                          fontSize={12} 
                          tickLine={false} 
                          axisLine={false} 
                          tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} 
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#111827', 
                            borderRadius: '12px', 
                            border: '1px solid #374151' 
                          }} 
                          formatter={(v) => [
                            v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 
                            'Total'
                          ]} 
                        />
                        {relatorioData.graficos[0].receita !== undefined ? (
                          <>
                            <Bar dataKey="receita" fill="#10b981" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="despesa" fill="#ef4444" radius={[4, 4, 0, 0]} />
                          </>
                        ) : (
                          <Bar dataKey="valor" radius={[4, 4, 0, 0]}>
                            {relatorioData.graficos.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill || '#8b5cf6'} />
                            ))}
                          </Bar>
                        )}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* ===== TABELA DE DETALHES ===== */}
              {visualizacao === 'tabela' && relatorioData.detalhes?.length > 0 && (
                <div className="bg-gray-800/20 rounded-xl border border-gray-700 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-300">
                      <thead className="bg-gray-700/50">
                        <tr className="text-gray-400 uppercase text-xs font-bold">
                          {Object.keys(relatorioData.detalhes[0]).map(k => (
                            <th key={k} className="py-4 px-6">{k}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700">
                        {relatorioData.detalhes.map((item, i) => (
                          <tr key={i} className="hover:bg-gray-700/30 transition-colors">
                            {Object.values(item).map((v, idx) => (
                              <td key={idx} className="py-4 px-6">
                                {typeof v === 'number' && v > 100 
                                  ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) 
                                  : v}
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
              <FileText className="w-12 h-12 text-gray-700 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Sem dados para exibir</h3>
              <p className="text-gray-500">
                Gere um novo relatório para carregar as informações do banco.
              </p>
            </div>
          )}
        </div>

        {/* ===== FOOTER ===== */}
        <div className="p-6 border-t border-gray-800 bg-gray-900/95 text-right">
          <button
            onClick={onFechar}
            className="px-8 py-2.5 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-xl border border-gray-700 transition-all"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};