// src/screens/financeiro/relatorios/RelatoriosHeader.jsx
import { FileText, Download, Calendar, Filter } from 'lucide-react';

export const RelatoriosHeader = ({ 
  periodoSelecionado, 
  setPeriodoSelecionado, 
  periodos,
  onExportarTodos 
}) => {
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-6">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <FileText className="w-6 h-6 text-purple-400" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">Relatórios</h2>
          </div>
          <p className="text-sm text-gray-400">
            Gere relatórios detalhados do seu salão em diferentes períodos
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-48">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <select
              value={periodoSelecionado}
              onChange={(e) => {
                console.log('📅 [HEADER] Período alterado:', e.target.value);
                setPeriodoSelecionado(e.target.value);
              }}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-sm appearance-none cursor-pointer"
            >
              {periodos.map(periodo => (
                <option key={periodo.id} value={periodo.id}>
                  {periodo.label}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={onExportarTodos}
            className="px-4 py-2.5 border border-gray-600 text-gray-300 hover:bg-gray-700/50 hover:text-white rounded-lg flex items-center justify-center gap-2 font-medium transition-all"
          >
            <Download className="w-4 h-4" />
            Exportar Todos
          </button>
        </div>
      </div>

      {periodoSelecionado === 'personalizado' && (
        <div className="mt-4 p-4 bg-gray-700/30 rounded-xl border border-gray-600 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-300 font-medium">Período Personalizado</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block font-medium">
                Data Inicial
              </label>
              <input
                type="date"
                className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block font-medium">
                Data Final
              </label>
              <input
                type="date"
                className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};