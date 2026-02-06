// src/screens/financeiro/metas/MetasGrid.jsx
import { Loader2, Target } from 'lucide-react'; // Adicionado Target que faltava
import { MetaCard } from './MetaCard';

export const MetasGrid = ({ metas = [], loading, metaCalculations, onAbrirModal }) => {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    );
  }

  if (!metas || metas.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <div className="p-4 bg-purple-500/10 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <Target className="w-8 h-8 text-purple-400" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">Nenhuma meta definida</h3>
        <p className="text-gray-400 mb-4">Crie sua primeira meta para acompanhar seu progresso</p>
        <button
          onClick={() => onAbrirModal('nova-meta')}
          className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600"
        >
          Criar Primeira Meta
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {metas.map((meta) => (
        <MetaCard
          key={meta.id}
          meta={meta}
          metaCalculations={metaCalculations}
          onClick={() => onAbrirModal('editar-meta', meta)}
        />
      ))}
    </div>
  );
};