import React from 'react';

export const PDVCart = ({
  carrinho,
  cliente,
  desconto,
  setDesconto,
  tipoDesconto,
  setTipoDesconto,
  subtotal,
  total,
  valorDesconto,
  onRemoverItem,
  onAjustarQtd,
  onLimparCarrinho,
  onSelecionarCliente
}) => {
  
  return (
    <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-purple-500/20 shadow-2xl overflow-hidden">
      
      {/* HEADER DO CARRINHO */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            🛒 Carrinho
          </h2>
          {carrinho.length > 0 && (
            <button
              onClick={onLimparCarrinho}
              className="text-white/80 hover:text-white transition-colors text-sm font-medium"
            >
              🗑️ Limpar
            </button>
          )}
        </div>
      </div>

      {/* SELEÇÃO DE CLIENTE */}
      <div className="p-4 border-b border-gray-700/50">
        <button
          onClick={onSelecionarCliente}
          className="w-full bg-gray-700/50 hover:bg-gray-700 
                   border border-gray-600 hover:border-purple-500/50
                   rounded-xl px-4 py-3 text-left
                   transition-all duration-300 group"
        >
          {cliente ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-600/20 border border-purple-500/30 
                              flex items-center justify-center text-lg">
                  👤
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Cliente</p>
                  <p className="text-white font-semibold">{cliente.nome}</p>
                  {cliente.telefone && (
                    <p className="text-xs text-gray-400">{cliente.telefone}</p>
                  )}
                </div>
              </div>
              <span className="text-purple-400 group-hover:text-purple-300 transition-colors">
                ✏️
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-gray-400 group-hover:text-white transition-colors">
              <div className="w-10 h-10 rounded-full border-2 border-dashed border-gray-600 
                            flex items-center justify-center text-lg">
                👤
              </div>
              <span className="font-medium">+ Selecionar Cliente (Opcional)</span>
            </div>
          )}
        </button>
      </div>

      {/* LISTA DE ITENS DO CARRINHO */}
      <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-purple-600 scrollbar-track-gray-800">
        {carrinho.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="text-6xl mb-4 opacity-30">🛒</div>
            <p className="text-gray-400 text-lg mb-2">Carrinho vazio</p>
            <p className="text-gray-500 text-sm">
              Adicione produtos ou agendamentos para começar
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-700/50">
            {carrinho.map((item, index) => (
              <ItemCarrinho
                key={`${item.id}-${item.tipo}-${index}`}
                item={item}
                onRemover={() => onRemoverItem(item.id, item.tipo)}
                onAjustarQtd={(delta) => onAjustarQtd(item.id, item.tipo, delta)}
              />
            ))}
          </div>
        )}
      </div>

      {/* DESCONTO */}
      {carrinho.length > 0 && (
        <div className="p-4 border-t border-gray-700/50 bg-gray-800/80">
          <div className="mb-3">
            <label className="text-xs text-gray-400 uppercase tracking-wide mb-2 block">
              💰 Desconto
            </label>
            <div className="flex gap-2">
              {/* TOGGLE TIPO DE DESCONTO */}
              <div className="flex bg-gray-700/50 rounded-lg p-1">
                <button
                  onClick={() => setTipoDesconto('valor')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-300
                    ${tipoDesconto === 'valor' 
                      ? 'bg-purple-600 text-white shadow-lg' 
                      : 'text-gray-400 hover:text-white'
                    }`}
                >
                  R$
                </button>
                <button
                  onClick={() => setTipoDesconto('percentual')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-300
                    ${tipoDesconto === 'percentual' 
                      ? 'bg-purple-600 text-white shadow-lg' 
                      : 'text-gray-400 hover:text-white'
                    }`}
                >
                  %
                </button>
              </div>

              {/* INPUT DE DESCONTO */}
              <div className="flex-1 relative">
                <input
                  type="number"
                  value={desconto}
                  onChange={(e) => setDesconto(Math.max(0, Number(e.target.value)))}
                  min="0"
                  max={tipoDesconto === 'percentual' ? 100 : subtotal}
                  className="w-full bg-gray-900/50 border border-gray-700 
                           rounded-lg px-4 py-2 text-white
                           focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
                           transition-all duration-300"
                  placeholder="0"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                  {tipoDesconto === 'percentual' ? '%' : 'R$'}
                </span>
              </div>
            </div>
          </div>

          {/* RESUMO DE VALORES */}
          <div className="space-y-2 text-sm">
            {/* SUBTOTAL */}
            <div className="flex justify-between text-gray-400">
              <span>Subtotal</span>
              <span className="font-medium">R$ {subtotal.toFixed(2)}</span>
            </div>

            {/* DESCONTO APLICADO */}
            {valorDesconto > 0 && (
              <div className="flex justify-between text-green-400">
                <span>Desconto</span>
                <span className="font-medium">- R$ {valorDesconto.toFixed(2)}</span>
              </div>
            )}

            {/* TOTAL */}
            <div className="flex justify-between text-lg font-bold text-white pt-2 border-t border-gray-700/50">
              <span>Total</span>
              <span className="text-2xl bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                R$ {total.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ========== COMPONENTE: ITEM DO CARRINHO ==========
const ItemCarrinho = ({ item, onRemover, onAjustarQtd }) => {
  const subtotalItem = item.preco_venda * item.qtd;

  return (
    <div className="p-4 hover:bg-gray-700/30 transition-colors duration-200 group">
      {/* HEADER DO ITEM */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 pr-2">
          <h4 className="text-white font-medium mb-1 line-clamp-2">
            {item.nome}
          </h4>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-0.5 rounded-full
              ${item.tipo === 'produto' 
                ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30' 
                : 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
              }`}>
              {item.tipo === 'produto' ? '📦 Produto' : '📅 Agendamento'}
            </span>
            {item.estoque && item.tipo === 'produto' && (
              <span className="text-xs text-gray-500">
                Est: {item.estoque}
              </span>
            )}
          </div>
        </div>
        
        {/* BOTÃO REMOVER */}
        <button
          onClick={onRemover}
          className="text-gray-500 hover:text-red-400 transition-colors 
                   opacity-0 group-hover:opacity-100"
          title="Remover item"
        >
          🗑️
        </button>
      </div>

      {/* CONTROLES E PREÇO */}
      <div className="flex items-center justify-between">
        {/* CONTROLE DE QUANTIDADE */}
        <div className="flex items-center gap-2 bg-gray-700/50 rounded-lg p-1">
          <button
            onClick={() => onAjustarQtd(-1)}
            disabled={item.qtd <= 1}
            className="w-8 h-8 flex items-center justify-center
                     text-white bg-gray-600 hover:bg-gray-500 
                     disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed
                     rounded-md transition-all duration-200 active:scale-95"
          >
            −
          </button>
          
          <span className="w-12 text-center text-white font-semibold">
            {item.qtd}
          </span>
          
          <button
            onClick={() => onAjustarQtd(1)}
            disabled={item.tipo === 'produto' && item.estoque && item.qtd >= item.estoque}
            className="w-8 h-8 flex items-center justify-center
                     text-white bg-purple-600 hover:bg-purple-700 
                     disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed
                     rounded-md transition-all duration-200 active:scale-95"
          >
            +
          </button>
        </div>

        {/* PREÇOS */}
        <div className="text-right">
          <p className="text-xs text-gray-400">
            R$ {item.preco_venda.toFixed(2)} {item.qtd > 1 ? `x ${item.qtd}` : ''}
          </p>
          <p className="text-lg font-bold text-white">
            R$ {subtotalItem.toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
};