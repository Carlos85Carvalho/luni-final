// src/screens/financeiro/metas/Metas.jsx
import { useMetas, useMetaCalculations } from './MetasHooks'; // Corrigido o nome do arquivo
import { MetasHeader } from './MetasHeader';
import { MetasGrid } from './MetasGrid';
import { MetasChart } from './MetasChart';

export const Metas = ({ onAbrirModal }) => {
  // Removi a dependência de 'dados' (o hook deve buscar sozinho)
  const { metas, loading: metasLoading, refresh } = useMetas();
  const metaCalculations = useMetaCalculations();

  return (
    <div className="space-y-6">
      {/* Header */}
      <MetasHeader 
        onNovaMeta={() => onAbrirModal('nova-meta')}
        onRefresh={refresh}
        loading={metasLoading}
      />

      {/* Grid de Metas */}
      <MetasGrid
        metas={metas}
        loading={metasLoading}
        metaCalculations={metaCalculations}
        onAbrirModal={onAbrirModal}
      />

      {/* Gráfico de Progresso Geral */}
      {(metas || []).length > 0 && (
        <MetasChart 
          metas={metas}
          metaCalculations={metaCalculations}
        />
      )}
    </div>
  );
};