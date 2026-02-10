// src/screens/financeiro/relatorios/RelatoriosHistorico.jsx
import { Loader2, FileText, Calendar, Download, Eye } from 'lucide-react';

export const RelatoriosHistorico = ({ 
  relatoriosGerados, 
  loading, 
  onVisualizar, 
  onExportar 
}) => {
  const formatarData = (dataString) => {
    if (!dataString) return '-';
    
    try {
      const data = new Date(dataString);
      return data.toLocaleDateString('pt-BR', {
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit', 
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return '-';
    }
  };

  const getTipoLabel = (tipo) => {
    const labels = {
      financeiro: 'Financeiro', 
      estoque: 'Estoque', 
      fornecedores: 'Fornecedores',
      metas: 'Metas', 
      vendas: 'Vendas', 
      clientes: 'Clientes'
    };
    return labels[tipo] || tipo;
  };

  const getTipoCor = (tipo) => {
    const cores = {
      financeiro: 'bg-green-500/20 text-green-400 border-green-500/30',
      estoque: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      fornecedores: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      metas: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      vendas: 'bg-red-500/20 text-red-400 border-red-500/30',
      clientes: 'bg-pink-500/20 text-pink-400 border-pink-500/30'
    };
    return cores[tipo] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    );
  }

  if (!relatoriosGerados || relatoriosGerados.length === 0) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-8 text-center">
        <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <p className="text-gray-400">Nenhum relatório gerado ainda</p>
        <p className="text-sm text-gray-500 mt-1">
          Clique em "Gerar" ou "Visualizar" em algum dos cards acima
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
      <div className="p-6 border-b border-gray-700">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Calendar className="w-5 h-5 text-purple-400" /> 
          Histórico de Relatórios
        </h3>
        <p className="text-sm text-gray-400 mt-1">
          {relatoriosGerados.length} relatório{relatoriosGerados.length !== 1 ? 's' : ''} gerado{relatoriosGerados.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-700/50 border-b border-gray-600">
            <tr>
              <th className="py-4 px-6 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Relatório
              </th>
              <th className="py-4 px-6 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Período
              </th>
              <th className="py-4 px-6 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Data Geração
              </th>
              <th className="py-4 px-6 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/50">
            {relatoriosGerados.map((relatorio) => (
              <tr 
                key={relatorio.id} 
                className="hover:bg-gray-700/30 transition-colors group"
              >
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg border ${getTipoCor(relatorio.tipo)}`}>
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium text-white group-hover:text-purple-400 transition-colors">
                        {getTipoLabel(relatorio.tipo)}
                      </p>
                      <p className="text-xs text-gray-400">
                        ID: {String(relatorio.id).slice(-8)}
                      </p>
                    </div>
                  </div>
                </td>
                
                <td className="py-4 px-6">
                  <span className="px-3 py-1 bg-gray-700/50 text-gray-300 rounded-full text-xs font-medium capitalize">
                    {relatorio.periodo}
                  </span>
                </td>
                
                <td className="py-4 px-6">
                  <p className="text-sm text-gray-300">
                    {formatarData(relatorio.data)}
                  </p>
                </td>
                
                <td className="py-4 px-6">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => {
                        console.log('👁️ [HISTORICO] Visualizar clicado:', relatorio);
                        onVisualizar(relatorio);
                      }}
                      className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors group/btn"
                      title="Visualizar relatório"
                    >
                      <Eye className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                    </button>
                    
                    <button
                      onClick={() => {
                        console.log('📥 [HISTORICO] Exportar clicado:', relatorio);
                        onExportar(relatorio);
                      }}
                      className="p-2 text-green-400 hover:bg-green-500/10 rounded-lg transition-colors group/btn"
                      title="Exportar relatório"
                    >
                      <Download className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};