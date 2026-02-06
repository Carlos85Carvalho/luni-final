// src/screens/financeiro/metas/MetasHeader.jsx
import { Plus, Target, RefreshCw } from 'lucide-react';

export const MetasHeader = ({ onNovaMeta, onRefresh, loading }) => {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <Target className="w-6 h-6 text-purple-400" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">Metas Financeiras</h2>
        </div>
        <p className="text-sm sm:text-base text-gray-400">
          Acompanhe o progresso das suas metas e objetivos
        </p>
      </div>
      
      <div className="flex items-center gap-3">
        <button
          onClick={onRefresh}
          disabled={loading}
          className="p-2.5 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-xl transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
        
        <button
          onClick={onNovaMeta}
          className="px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 flex items-center justify-center gap-2 font-medium transition-all"
        >
          <Plus className="w-4 h-4" />
          Nova Meta
        </button>
      </div>
    </div>
  );
};