// src/screens/financeiro/estoque/EstoqueTable.jsx
import { Loader2, Package, Edit2, Package as PackageIcon } from 'lucide-react';

export const EstoqueTable = ({
  produtos = [], // Valor padrão para evitar erro
  loading,
  onEditarProduto,
  onEntradaEstoque
}) => {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    );
  }

  // Verificação de segurança (?.length)
  if (!produtos || produtos.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <p className="text-gray-400">Nenhum produto encontrado</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead className="bg-gray-700/50 border-b border-gray-600">
            <tr>
              <th className="py-4 px-6 text-left text-xs font-semibold text-gray-400 uppercase">Produto</th>
              <th className="py-4 px-6 text-left text-xs font-semibold text-gray-400 uppercase">Categoria</th>
              <th className="py-4 px-6 text-left text-xs font-semibold text-gray-400 uppercase">Estoque</th>
              <th className="py-4 px-6 text-left text-xs font-semibold text-gray-400 uppercase">Giro</th>
              <th className="py-4 px-6 text-left text-xs font-semibold text-gray-400 uppercase">Lucro Total</th>
              <th className="py-4 px-6 text-left text-xs font-semibold text-gray-400 uppercase">Status</th>
              <th className="py-4 px-6 text-left text-xs font-semibold text-gray-400 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/50">
            {produtos.map((produto) => {
              // Adicionei valores padrão (|| 0) para evitar NaN se algum campo for nulo
              const margem = (((produto.preco_venda || 0) - (produto.custo_unitario || 0)) / (produto.custo_unitario || 1) * 100).toFixed(1);
              const status = 
                produto.quantidade_atual <= produto.estoque_minimo ? 'critico' :
                produto.rotatividade > 2 ? 'alto-giro' :
                produto.rotatividade < 0.5 ? 'baixo-giro' : 'normal';

              return (
                <tr key={produto.id} className="hover:bg-gray-700/30 transition-colors">
                  <td className="py-4 px-6">
                    <div>
                      <p className="font-medium text-white">{produto.nome}</p>
                      <p className="text-xs text-gray-400">Mín: {produto.estoque_minimo} uni</p>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs font-medium">
                      {produto.categoria || 'Sem categoria'}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${
                            produto.quantidade_atual <= produto.estoque_minimo ? 'bg-red-500' :
                            produto.quantidade_atual <= produto.estoque_minimo * 2 ? 'bg-orange-500' : 'bg-green-500'
                          }`}
                          style={{ 
                            width: `${Math.min(100, (produto.quantidade_atual / ((produto.estoque_minimo || 1) * 3)) * 100)}%` 
                          }}
                        ></div>
                      </div>
                      <span className="font-bold text-white">{produto.quantidade_atual}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${
                        produto.rotatividade > 2 ? 'text-green-400' :
                        produto.rotatividade < 0.5 ? 'text-red-400' : 'text-yellow-400'
                      }`}>
                        {(produto.rotatividade || 0).toFixed(2)}
                      </span>
                      <span className="text-xs text-gray-400">vezes/mês</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div>
                      <p className="font-medium text-white">
                        R$ {(produto.lucro_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <p className={`text-xs ${
                        parseFloat(margem) >= 50 ? 'text-green-400' :
                        parseFloat(margem) >= 30 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        Margem: {margem}%
                      </p>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      status === 'critico' ? 'bg-red-500/20 text-red-400' :
                      status === 'alto-giro' ? 'bg-green-500/20 text-green-400' :
                      status === 'baixo-giro' ? 'bg-orange-500/20 text-orange-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {status === 'critico' ? 'Crítico' :
                       status === 'alto-giro' ? 'Alto Giro' :
                       status === 'baixo-giro' ? 'Baixo Giro' : 'Normal'}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => onEditarProduto(produto)}
                        className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => onEntradaEstoque(produto)}
                        className="p-2 text-green-400 hover:bg-green-500/10 rounded-lg transition-colors"
                        title="Entrada de Estoque"
                      >
                        <PackageIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};