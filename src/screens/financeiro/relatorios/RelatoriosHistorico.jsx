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
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
      financeiro: 'bg-green-500/20 text-green-400',
      estoque: 'bg-blue-500/20 text-blue-400',
      fornecedores: 'bg-orange-500/20 text-orange-400',
      metas: 'bg-purple-500/20 text-purple-400',
      vendas: 'bg-red-500/20 text-red-400',
      clientes: 'bg-pink-500/20 text-pink-400'
    };
    return cores[tipo] || 'bg-gray-500/20 text-gray-400';
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
      <div className="text-center py-8">
        <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <p className="text-gray-400">Nenhum relatório gerado ainda</p>
        <p className="text-sm text-gray-500 mt-1">Gere seu primeiro relatório acima</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 overflow-hidden">
      <div className="p-6 border-b border-gray-700">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Calendar className="w-5 h-5 text-purple-400" />
          Histórico de Relatórios
        </h3>
        <p className="text-sm text-gray-400 mt-1">Últimos relatórios gerados</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-700/50 border-b border-gray-600">
            <tr>
              <th className="py-4 px-6 text-left text-xs font-semibold text-gray-400 uppercase">Relatório</th>
              <th className="py-4 px-6 text-left text-xs font-semibold text-gray-400 uppercase">Período</th>
              <th className="py-4 px-6 text-left text-xs font-semibold text-gray-400 uppercase">Data Geração</th>
              <th className="py-4 px-6 text-left text-xs font-semibold text-gray-400 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/50">
            {relatoriosGerados.map((relatorio) => (
              <tr key={relatorio.id} className="hover:bg-gray-700/30 transition-colors">
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${getTipoCor(relatorio.tipo)}`}>
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{getTipoLabel(relatorio.tipo)}</p>
                      <p className="text-xs text-gray-400">ID: {relatorio.id.slice(0, 8)}</p>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <span className="px-3 py-1 bg-gray-700/50 text-gray-300 rounded-full text-xs font-medium capitalize">
                    {relatorio.periodo}
                  </span>
                </td>
                <td className="py-4 px-6">
                  <p className="text-sm text-gray-300">{formatarData(relatorio.data_criacao)}</p>
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onVisualizar(relatorio)}
                      className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                      title="Visualizar"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onExportar(relatorio)}
                      className="p-2 text-green-400 hover:bg-green-500/10 rounded-lg transition-colors"
                      title="Exportar"
                    >
                      <Download className="w-4 h-4" />
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