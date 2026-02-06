// src/screens/financeiro/despesas/DespesasFilters.jsx
import { Search, Plus } from 'lucide-react';

export const DespesasFilters = ({
  filtro,
  setFiltro,
  categoriaFiltro,
  setCategoriaFiltro,
  busca,
  setBusca,
  categorias,
  onNovaDespesa
}) => {
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-4 sm:p-6">
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
          {['todas', 'pagas', 'pendentes'].map(f => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all text-center ${
                filtro === f 
                  ? 'bg-purple-500 text-white' 
                  : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar despesa..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none text-sm"
            />
          </div>

          <select
            value={categoriaFiltro}
            onChange={(e) => setCategoriaFiltro(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none text-sm"
          >
            <option value="todas">Todas Categorias</option>
            {categorias.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <button
            onClick={onNovaDespesa}
            className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 flex items-center justify-center gap-2 font-medium transition-all"
          >
            <Plus className="w-4 h-4" />
            <span className="whitespace-nowrap">Nova Despesa</span>
          </button>
        </div>
      </div>
    </div>
  );
};