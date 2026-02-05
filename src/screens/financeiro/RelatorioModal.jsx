import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Download, Share2, FileText, 
  TrendingUp, AlertTriangle, Package, 
  Users, BarChart, Zap, Calendar,
  DollarSign, Receipt, Loader2, Eye
} from 'lucide-react';

export const RelatorioModal = ({ aberto, onFechar, tipo, periodo, dados }) => {
  const [gerando, setGerando] = useState(false);
  const [formato, setFormato] = useState('excel');

  if (!aberto) return null;

  const gerarRelatorio = async () => {
    setGerando(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const csvContent = "data:text/csv;charset=utf-8,Titulo,Valor\nReceita,1000";
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `relatorio_${tipo}_${new Date().getTime()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      alert('Relatório gerado com sucesso!');
      onFechar();
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao gerar relatório.');
    } finally {
      setGerando(false);
    }
  };

  const getRelatorioInfo = () => {
    switch (tipo) {
      case 'financeiro': return { 
        titulo: 'Relatório Financeiro', 
        desc: 'Receitas, despesas e lucro detalhado', 
        icon: DollarSign, 
        color: 'text-green-500', 
        bg: 'bg-green-500/10' 
      };
      case 'despesas': return { 
        titulo: 'Análise de Despesas', 
        desc: 'Despesas por categoria e período', 
        icon: Receipt, 
        color: 'text-orange-500', 
        bg: 'bg-orange-500/10' 
      };
      case 'estoque': return { 
        titulo: 'Relatório de Estoque', 
        desc: 'Giro, lucro e estoque crítico', 
        icon: Package, 
        color: 'text-blue-500', 
        bg: 'bg-blue-500/10' 
      };
      case 'fornecedores': return { 
        titulo: 'Performance Fornecedores', 
        desc: 'Volume, frequência e dependência', 
        icon: Users, 
        color: 'text-purple-500', 
        bg: 'bg-purple-500/10' 
      };
      case 'margens': return { 
        titulo: 'Margens de Serviços', 
        desc: 'Rentabilidade por serviço', 
        icon: BarChart, 
        color: 'text-yellow-500', 
        bg: 'bg-yellow-500/10' 
      };
      default: return { 
        titulo: 'Relatório Geral', 
        desc: 'Visão geral do sistema', 
        icon: FileText, 
        color: 'text-gray-400', 
        bg: 'bg-gray-700/50' 
      };
    }
  };

  const info = getRelatorioInfo();
  const Icone = info.icon;

  return createPortal(
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
      
      <div className="bg-gray-900 border border-gray-700 w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden relative">
        
        {/* Cabeçalho */}
        <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between bg-gray-900/95 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${info.bg}`}>
              <Icone className={`w-5 h-5 ${info.color}`} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white leading-tight">
                {info.titulo}
              </h3>
              <p className="text-xs text-gray-400">Exportação de dados</p>
            </div>
          </div>
          <button 
            onClick={onFechar} 
            className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo com Scroll */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
          
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
            <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-400" />
              Resumo do Conteúdo
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-1 border-b border-gray-700/50">
                <span className="text-gray-400">Período Selecionado</span>
                <span className="text-white font-medium capitalize">{periodo?.replace('_', ' ') || 'Atual'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-700/50">
                <span className="text-gray-400">Total de Registros</span>
                <span className="text-white font-medium">--</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-400">Formato</span>
                <span className="text-white font-medium uppercase">{formato}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Formato do Arquivo</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setFormato('excel')}
                className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
                  formato === 'excel' 
                    ? 'border-green-500 bg-green-500/10' 
                    : 'border-gray-700 bg-gray-800/50 hover:bg-gray-800'
                }`}
              >
                <FileText className={`w-5 h-5 ${formato === 'excel' ? 'text-green-500' : 'text-gray-400'}`} />
                <span className={`text-sm font-medium ${formato === 'excel' ? 'text-white' : 'text-gray-300'}`}>Excel (CSV)</span>
              </button>
              <button
                onClick={() => setFormato('pdf')}
                className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
                  formato === 'pdf' 
                    ? 'border-red-500 bg-red-500/10' 
                    : 'border-gray-700 bg-gray-800/50 hover:bg-gray-800'
                }`}
              >
                <FileText className={`w-5 h-5 ${formato === 'pdf' ? 'text-red-500' : 'text-gray-400'}`} />
                <span className={`text-sm font-medium ${formato === 'pdf' ? 'text-white' : 'text-gray-300'}`}>PDF</span>
              </button>
            </div>
          </div>

        </div>

        {/* Rodapé */}
        <div className="p-4 border-t border-gray-800 bg-gray-900/95 flex gap-3 shrink-0">
          <button
            onClick={onFechar}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-300 hover:bg-gray-800 rounded-xl transition-colors border border-transparent hover:border-gray-700"
            disabled={gerando}
          >
            Cancelar
          </button>
          <button
            onClick={gerarRelatorio}
            disabled={gerando}
            className={`flex-1 px-4 py-2.5 bg-gradient-to-r ${info.bg.replace('/10', '')} text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 transition-all hover:scale-[1.02]`}
          >
            {gerando ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Baixar Agora
              </>
            )}
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};