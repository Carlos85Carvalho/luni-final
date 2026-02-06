// src/screens/financeiro/fornecedores/FornecedoresTable.jsx
import { Loader2, Users, Edit2, ShoppingCart, CheckCircle, XCircle } from 'lucide-react';

export const FornecedoresTable = ({
  fornecedores = [],
  ranking = [],
  loading,
  onEditarFornecedor,
  onVerCompras
}) => {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    );
  }

  // Verificação de segurança (?.length)
  if (!fornecedores || fornecedores.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <p className="text-gray-400">Nenhum fornecedor encontrado</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead className="bg-gray-700/50 border-b border-gray-600">
            <tr>
              <th className="py-4 px-6 text-left text-xs font-semibold text-gray-400 uppercase">Fornecedor</th>
              <th className="py-4 px-6 text-left text-xs font-semibold text-gray-400 uppercase">Contato</th>
              <th className="py-4 px-6 text-left text-xs font-semibold text-gray-400 uppercase">Documento</th>
              <th className="py-4 px-6 text-left text-xs font-semibold text-gray-400 uppercase">Compras</th>
              <th className="py-4 px-6 text-left text-xs font-semibold text-gray-400 uppercase">Status</th>
              <th className="py-4 px-6 text-left text-xs font-semibold text-gray-400 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/50">
            {fornecedores.map((fornecedor) => {
              // Garante que ranking existe antes de buscar
              const fornecedorRanking = ranking?.find(f => f.id === fornecedor.id);
              
              return (
                <tr key={fornecedor.id} className="hover:bg-gray-700/30 transition-colors">
                  <td className="py-4 px-6">
                    <div>
                      <p className="font-medium text-white">{fornecedor.nome}</p>
                      {fornecedor.observacoes && (
                        <p className="text-xs text-gray-400 truncate max-w-xs">{fornecedor.observacoes}</p>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="space-y-1">
                      {fornecedor.telefone && (
                        <p className="text-sm text-gray-300">{fornecedor.telefone}</p>
                      )}
                      {fornecedor.email && (
                        <p className="text-sm text-blue-300 truncate max-w-xs">{fornecedor.email}</p>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <p className="text-sm text-gray-300 font-mono">
                      {fornecedor.cnpj_cpf || 'Não informado'}
                    </p>
                  </td>
                  <td className="py-4 px-6">
                    <div>
                      {fornecedorRanking ? (
                        <>
                          <p className="text-sm text-white">
                            R$ {fornecedorRanking.total_gasto?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                          <p className="text-xs text-gray-400">
                            {fornecedorRanking.total_compras} compras • {fornecedorRanking.percentual?.toFixed(1)}%
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-gray-500">Sem compras</p>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    {fornecedor.ativo ? (
                      <span className="flex items-center gap-2 text-green-400 text-sm">
                        <CheckCircle className="w-4 h-4" />
                        Ativo
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 text-orange-400 text-sm">
                        <XCircle className="w-4 h-4" />
                        Inativo
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => onEditarFornecedor(fornecedor)}
                        className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => onVerCompras(fornecedor)}
                        className="p-2 text-green-400 hover:bg-green-500/10 rounded-lg transition-colors"
                        title="Ver Compras"
                      >
                        <ShoppingCart className="w-4 h-4" />
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