import React from 'react';
import { ShoppingCart, Trash2, Plus, Minus, User, X } from 'lucide-react';

export const PDVCart = ({
  carrinho, cliente, desconto, setDesconto,
  tipoDesconto, setTipoDesconto, subtotal, total, valorDesconto,
  onRemoverItem, onAjustarQtd, onLimparCarrinho, onSelecionarCliente
}) => {
  return (
    <div className="bg-[#2a2a35] rounded-2xl border border-white/10 overflow-hidden flex flex-col">
      
      {/* HEADER */}
      <div className="px-5 py-4 border-b border-white/[0.08] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-purple-500/15 border border-purple-400/25 rounded-lg flex items-center justify-center">
            <ShoppingCart size={16} className="text-purple-300" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Carrinho</h2>
            <p className="text-[10px] text-gray-400">
              {carrinho.reduce((a, i) => a + i.qtd, 0)} {carrinho.reduce((a, i) => a + i.qtd, 0) === 1 ? 'item' : 'itens'}
            </p>
          </div>
        </div>
        {carrinho.length > 0 && (
          <button onClick={onLimparCarrinho}
            className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
            title="Limpar carrinho">
            <Trash2 size={15} />
          </button>
        )}
      </div>

      {/* CLIENTE */}
      <div className="p-3 border-b border-white/[0.08]">
        <button onClick={onSelecionarCliente}
          className="w-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/8 hover:border-white/15
                   rounded-xl px-3 py-2.5 text-left transition-all group">
          {cliente ? (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-500/15 border border-purple-400/20 flex items-center justify-center text-purple-300">
                <User size={15} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Cliente</p>
                <p className="text-sm text-white font-semibold truncate">{cliente.nome}</p>
              </div>
              <X size={14} className="text-gray-500 group-hover:text-gray-300 transition-colors" />
            </div>
          ) : (
            <div className="flex items-center gap-2.5 text-gray-500 group-hover:text-gray-300 transition-colors">
              <div className="w-8 h-8 rounded-lg border border-dashed border-gray-600 flex items-center justify-center">
                <User size={15} />
              </div>
              <span className="text-xs font-medium">+ Selecionar Cliente</span>
            </div>
          )}
        </button>
      </div>

      {/* ITENS */}
      <div className="flex-1 overflow-y-auto max-h-[320px]">
        {carrinho.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <ShoppingCart size={32} className="text-gray-600 mb-3" />
            <p className="text-gray-400 text-sm">Carrinho vazio</p>
            <p className="text-gray-500 text-xs mt-1">Adicione itens para começar</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.05]">
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

      {/* DESCONTO + TOTAIS */}
      {carrinho.length > 0 && (
        <div className="p-4 border-t border-white/[0.08] space-y-4 bg-black/15">
          
          {/* Desconto */}
          <div>
            <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 block">Desconto</label>
            <div className="flex gap-2">
              <div className="flex bg-black/25 rounded-lg p-0.5 border border-white/8">
                <button onClick={() => setTipoDesconto('valor')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                    tipoDesconto === 'valor' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                  R$
                </button>
                <button onClick={() => setTipoDesconto('percentual')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                    tipoDesconto === 'percentual' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                  %
                </button>
              </div>
              <input type="number" value={desconto}
                onChange={(e) => setDesconto(Math.max(0, Number(e.target.value)))}
                min="0" max={tipoDesconto === 'percentual' ? 100 : subtotal}
                className="flex-1 bg-black/25 border border-white/8 rounded-lg px-3 py-1.5 text-white text-sm
                         focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all"
                placeholder="0" />
            </div>
          </div>

          {/* Resumo */}
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-400">
              <span>Subtotal</span>
              <span>R$ {subtotal.toFixed(2)}</span>
            </div>
            {valorDesconto > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>Desconto</span>
                <span>− R$ {valorDesconto.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-2 border-t border-white/[0.08]">
              <span className="text-white font-bold">Total</span>
              <span className="text-xl font-black text-emerald-400">R$ {total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ItemCarrinho = ({ item, onRemover, onAjustarQtd }) => {
  const subtotalItem = item.preco_venda * item.qtd;
  return (
    <div className="px-4 py-3 group hover:bg-white/[0.03] transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 pr-2">
          <p className="text-white text-xs font-medium line-clamp-2 leading-snug">{item.nome}</p>
          <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded-md mt-1 font-medium ${
            item.tipo === 'produto' ? 'bg-blue-400/10 text-blue-300' : 'bg-purple-400/10 text-purple-300'}`}>
            {item.tipo === 'produto' ? 'Produto' : 'Serviço'}
          </span>
        </div>
        <button onClick={onRemover} className="text-gray-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 p-0.5">
          <X size={14} />
        </button>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 bg-black/20 rounded-lg p-0.5 border border-white/8">
          <button onClick={() => onAjustarQtd(-1)} disabled={item.qtd <= 1}
            className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-white 
                     disabled:text-gray-700 disabled:cursor-not-allowed rounded-md hover:bg-white/10 transition-all">
            <Minus size={12} />
          </button>
          <span className="w-7 text-center text-white text-xs font-bold">{item.qtd}</span>
          <button onClick={() => onAjustarQtd(1)}
            disabled={item.tipo === 'produto' && item.estoque && item.qtd >= item.estoque}
            className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-white 
                     disabled:text-gray-700 disabled:cursor-not-allowed rounded-md hover:bg-white/10 transition-all">
            <Plus size={12} />
          </button>
        </div>
        <div className="text-right">
          {item.qtd > 1 && <p className="text-[10px] text-gray-500">R$ {item.preco_venda.toFixed(2)} cada</p>}
          <p className="text-sm font-bold text-white">R$ {subtotalItem.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
};