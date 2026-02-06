// src/screens/financeiro/metas/MetaCard.jsx
import { createElement } from 'react'; // Importamos createElement

export const MetaCard = ({ meta = {}, metaCalculations = {}, onClick }) => {
  const {
    calcularProgresso,
    getStatusMeta,
    getIcon,
    getColorClass,
    getBgColorClass,
    getTextColorClass
  } = metaCalculations;

  // Garante que os valores sejam números
  const valorAtual = Number(meta.valor_atual) || 0;
  const valorMeta = Number(meta.valor_meta) || 0;

  // Cálculos
  const progresso = calcularProgresso ? calcularProgresso(meta) : 0;
  const status = getStatusMeta ? getStatusMeta(progresso, meta.inverso) : { label: '-', bg: 'bg-gray-700', color: 'text-gray-400' };
  
  // Pegamos a referência do ícone (sem criar componente, apenas referência)
  const Icon = getIcon ? getIcon(meta.tipo) : null;

  // Classes de cor
  const iconColorClass = getTextColorClass ? getTextColorClass(meta.cor) : 'text-gray-400';
  const bgColorClass = getBgColorClass ? getBgColorClass(meta.cor) : 'bg-gray-700';
  const progressColorClass = getColorClass ? getColorClass(meta.cor) : 'bg-blue-500';

  const getDiferencaText = () => {
    if (meta.inverso) {
      if (valorAtual <= valorMeta) {
        return (
          <>
            <span className="text-green-400 font-medium">
              R$ {(valorMeta - valorAtual).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            {' '}disponível no orçamento
          </>
        );
      } else {
        return (
          <>
            <span className="text-red-400 font-medium">
              R$ {(valorAtual - valorMeta).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            {' '}acima do limite
          </>
        );
      }
    } else {
      if (progresso >= 100) {
        return (
          <>
            Meta atingida! 
            <span className="text-green-400 font-medium">
              {' '}+R$ {(valorAtual - valorMeta).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </>
        );
      } else {
        return (
          <>
            Faltam{' '}
            <span className="text-orange-400 font-medium">
              R$ {(valorMeta - valorAtual).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </>
        );
      }
    }
  };

  return (
    <div 
      onClick={onClick}
      className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-6 hover:bg-gray-800/70 transition-all cursor-pointer group"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${bgColorClass} group-hover:scale-110 transition-transform`}>
          {/* SOLUÇÃO: Usamos createElement para renderizar o ícone dinâmico. 
             Isso evita o erro de "creating components during render" do ESLint. */}
          {Icon && createElement(Icon, { className: `w-6 h-6 ${iconColorClass}` })}
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
          {status.label}
        </span>
      </div>

      <h3 className="text-lg font-bold text-white mb-2">{meta.titulo}</h3>
      <p className="text-sm text-gray-400 mb-4">{meta.periodo}</p>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Atual</span>
          <span className="font-bold text-white">
            R$ {valorAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Meta</span>
          <span className="font-bold text-white">
            R$ {valorMeta.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>

        {/* Barra de Progresso */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">Progresso</span>
            <span className="text-xs font-bold text-white">{progresso.toFixed(1)}%</span>
          </div>
          <div className="h-3 bg-gray-700/50 rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r transition-all duration-500 ${progressColorClass}`}
              style={{ width: `${Math.min(100, progresso)}%` }}
            ></div>
          </div>
        </div>

        {/* Faltante/Excedente */}
        <div className="pt-2 border-t border-gray-700">
          <p className="text-xs text-gray-400">
            {getDiferencaText()}
          </p>
        </div>
      </div>
    </div>
  );
};