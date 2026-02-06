// src/screens/financeiro/despesas/DespesasTable.jsx
import { Loader2, Receipt, Check, Edit2, Trash2, CheckCircle, Clock } from 'lucide-react';

// Adicionei "despesas = []" para evitar tela branca se a lista vier vazia ou undefined
export const DespesasTable = ({
  despesas = [], 
  loading,
  onMarcarComoPaga,
  onEditar,
  onExcluir
}) => {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    );
  }

  // Adicionei verificação de segurança (?.length)
  if (!despesas || despesas.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <Receipt className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <p className="text-gray-400">Nenhuma despesa encontrada</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead className="bg-gray-700/50 border-b border-gray-600">
            <tr>
              <th className="py-4 px-6 text-left text-xs font-semibold text-gray-400 uppercase">Descrição</th>
              <th className="py-4 px-6 text-left text-xs font-semibold text-gray-400 uppercase">Categoria</th>
              <th className="py-4 px-6 text-left text-xs font-semibold text-gray-400 uppercase">Valor</th>
              <th className="py-4 px-6 text-left text-xs font-semibold text-gray-400 uppercase">Vencimento</th>
              <th className="py-4 px-6 text-left text-xs font-semibold text-gray-400 uppercase">Status</th>
              <th className="py-4 px-6 text-left text-xs font-semibold text-gray-400 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/50">
            {despesas.map((despesa) => (
              <tr key={despesa.id} className="hover:bg-gray-700/30 transition-colors">
                <td className="py-4 px-6">
                  <p className="font-medium text-white">{despesa.descricao}</p>
                </td>
                <td className="py-4 px-6">
                  <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs font-medium whitespace-nowrap">
                    {despesa.categoria}
                  </span>
                </td>
                <td className="py-4 px-6">
                  <p className="font-bold text-white whitespace-nowrap">
                    R$ {(despesa.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </td>
                <td className="py-4 px-6">
                  <p className="text-sm text-gray-300 whitespace-nowrap">
                    {/* Verifica se a data existe antes de formatar */}
                    {despesa.data_vencimento 
                      ? new Date(despesa.data_vencimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) 
                      : '-'}
                  </p>
                </td>
                <td className="py-4 px-6">
                  {despesa.pago ? (
                    <span className="flex items-center gap-2 text-green-400 text-sm">
                      <CheckCircle className="w-4 h-4" />
                      Paga
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 text-orange-400 text-sm">
                      <Clock className="w-4 h-4" />
                      Pendente
                    </span>
                  )}
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center gap-2">
                    {!despesa.pago && (
                      <button 
                        onClick={() => onMarcarComoPaga(despesa)}
                        className="p-2 text-green-400 hover:bg-green-500/10 rounded-lg transition-colors"
                        title="Marcar como paga"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                    <button 
                      onClick={() => onEditar(despesa)}
                      className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => onExcluir(despesa.id)}
                      className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
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