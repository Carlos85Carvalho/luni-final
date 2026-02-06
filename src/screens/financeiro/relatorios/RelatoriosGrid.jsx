// src/screens/financeiro/relatorios/RelatoriosGrid.jsx
import { Loader2, Eye, Download, FileText } from 'lucide-react';

export const RelatoriosGrid = ({ 
  tiposRelatorio, 
  periodoSelecionado, 
  onGerarRelatorio, 
  onVisualizarPreview,
  loading 
}) => {
  const getCorClasses = (cor) => {
    const classes = {
      green: 'from-green-500 to-emerald-500',
      blue: 'from-blue-500 to-cyan-500',
      orange: 'from-orange-500 to-amber-500',
      purple: 'from-purple-500 to-violet-500',
      red: 'from-red-500 to-pink-500',
      pink: 'from-pink-500 to-rose-500'
    };
    return classes[cor] || 'from-purple-500 to-pink-500';
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {tiposRelatorio.map((relatorio) => {
        // Usa o componente passado diretamente ou FileText como fallback
        const Icon = relatorio.icone || FileText;

        return (
          <div
            key={relatorio.id}
            className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-5 hover:bg-gray-800/70 transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-xl bg-gradient-to-br ${getCorClasses(relatorio.cor)}`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-medium px-2 py-1 bg-gray-700/50 rounded text-gray-300">
                {/* Formata o label do período se necessário, ou exibe direto */}
                {periodoSelecionado.charAt(0).toUpperCase() + periodoSelecionado.slice(1)}
              </span>
            </div>

            <h3 className="text-lg font-bold text-white mb-2">{relatorio.titulo}</h3>
            <p className="text-sm text-gray-400 mb-4">{relatorio.descricao}</p>

            <div className="flex gap-2">
              <button
                onClick={() => onVisualizarPreview(relatorio.id)}
                className="flex-1 px-3 py-2 bg-gray-700/50 hover:bg-gray-700 text-gray-300 rounded-lg flex items-center justify-center gap-2 text-sm transition-colors"
              >
                <Eye className="w-4 h-4" />
                Visualizar
              </button>
              <button
                onClick={() => onGerarRelatorio(relatorio.id)}
                disabled={loading}
                className="flex-1 px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg flex items-center justify-center gap-2 text-sm transition-all disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Gerar
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};