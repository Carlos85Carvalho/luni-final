import React from 'react';
import { ShoppingCart, Trash2, User, Minus, Plus, Scissors, Package, X, Award } from 'lucide-react';

export const PDVCart = ({ 
  carrinho = [], 
  cliente, 
  onRemover, 
  onAjustarQtd, 
  onLimpar, 
  onSelecionarCliente, 
  subtotal = 0, 
  desconto = 0, 
  total = 0, // Agora vamos usar esta variável
  setDesconto, 
  setTipoDesconto, 
  tipoDesconto 
}) => {
  const itensCarrinho = carrinho || [];

  return (
    <div className="flex flex-col h-full bg-[#18181b] text-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-[#18181b]">
        <h2 className="text-lg font-bold flex items-center gap-2 text-white">
          <ShoppingCart className="text-purple-500" size={20} /> 
          Carrinho <span className="text-gray-500 text-sm">({itensCarrinho.length})</span>
        </h2>
        {itensCarrinho.length > 0 && (
          <button onClick={onLimpar} className="text-red-400 text-xs font-bold flex items-center gap-1 hover:text-red-300 transition-colors uppercase">
            <Trash2 size={12} /> Limpar
          </button>
        )}
      </div>

      {/* Cliente Section */}
      <div className="p-4 bg-[#0a0a0f] border-b border-gray-800">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
            <User size={12} /> Cliente
          </span>
          <button onClick={onSelecionarCliente} className="text-xs text-purple-400 font-bold hover:text-purple-300 hover:underline">
            {cliente ? 'TROCAR' : 'SELECIONAR'}
          </button>
        </div>
        
        {cliente ? (
          <div className="bg-[#18181b] p-3 rounded-lg border border-gray-800 flex justify-between items-center">
            <div>
              <p className="font-bold text-gray-200">{cliente.nome}</p>
              {cliente.pontos > 0 && (
                <span className="text-xs text-amber-500 flex items-center gap-1 font-medium mt-0.5">
                  <Award size={10}/> {cliente.pontos} pts
                </span>
              )}
            </div>
          </div>
        ) : (
          <div 
            onClick={onSelecionarCliente} 
            className="p-3 border border-dashed border-gray-700 rounded-lg text-center text-gray-500 text-sm cursor-pointer hover:bg-white/5 hover:border-purple-500/50 transition-all"
          >
            Selecionar Cliente (Opcional)
          </div>
        )}
      </div>

      {/* Lista de Itens */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-[#18181b]">
        {itensCarrinho.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-700 gap-3">
            <ShoppingCart size={40} className="opacity-20" />
            <p className="text-sm font-medium">Seu carrinho está vazio</p>
          </div>
        ) : (
          itensCarrinho.map((item, index) => (
            <div key={`${item.tipo}-${item.id}-${index}`} className="flex justify-between items-start bg-[#27272a] p-3 rounded-xl border border-gray-800 shadow-sm group hover:border-gray-700 transition-colors">
              <div className="flex-1 mr-2">
                <div className="flex items-center gap-2 mb-2">
                  {item.tipo === 'servico' ? 
                    <Scissors size={14} className="text-blue-400 flex-shrink-0"/> : 
                    <Package size={14} className="text-purple-400 flex-shrink-0"/>
                  }
                  <span className="text-sm font-medium text-gray-200 line-clamp-1">
                    {item.nome}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center bg-[#0a0a0f] rounded-lg border border-gray-800 h-8">
                    <button onClick={() => onAjustarQtd(item.id, item.tipo, -1)} className="px-2 h-full text-gray-400 hover:text-white hover:bg-white/10 rounded-l-lg transition-colors"><Minus size={12}/></button>
                    <span className="text-xs font-bold w-8 text-center text-white">{item.qtd}</span>
                    <button onClick={() => onAjustarQtd(item.id, item.tipo, 1)} className="px-2 h-full text-gray-400 hover:text-white hover:bg-white/10 rounded-r-lg transition-colors"><Plus size={12}/></button>
                  </div>
                  <span className="text-sm font-bold text-white">
                    R$ {(item.preco_venda * item.qtd).toFixed(2)}
                  </span>
                </div>
              </div>
              <button onClick={() => onRemover(item.id, item.tipo)} className="text-gray-600 hover:text-red-400 p-1 rounded-full transition-colors"><X size={16}/></button>
            </div>
          ))
        )}
      </div>

      {/* Footer Resumo */}
      <div className="p-4 bg-[#0a0a0f] border-t border-gray-800 space-y-3">
        {/* Input Desconto */}
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-gray-400">Desconto</span>
          <div className="flex items-center gap-2">
            <input 
              type="number" 
              value={desconto === 0 ? '' : desconto} 
              onChange={e => setDesconto(Number(e.target.value))} 
              className="w-20 pl-2 pr-1 py-1 rounded bg-[#18181b] border border-gray-700 text-white text-sm focus:border-purple-500 outline-none text-right placeholder-gray-600" 
              placeholder="0" 
            />
            <div className="flex bg-[#18181b] rounded border border-gray-700 p-0.5">
              <button onClick={() => setTipoDesconto('percentual')} className={`px-2 py-0.5 text-xs rounded transition-all ${tipoDesconto === 'percentual' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}>%</button>
              <button onClick={() => setTipoDesconto('valor')} className={`px-2 py-0.5 text-xs rounded transition-all ${tipoDesconto === 'valor' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}>R$</button>
            </div>
          </div>
        </div>

        <div className="space-y-1 pt-3 border-t border-gray-800">
          <div className="flex justify-between text-sm text-gray-400">
            <span>Subtotal</span> 
            <span>R$ {subtotal.toFixed(2)}</span>
          </div>
          {desconto > 0 && (
            <div className="flex justify-between text-sm text-red-400">
              <span>Desconto</span> 
              <span>- R$ {((tipoDesconto === 'percentual' ? subtotal * desconto / 100 : desconto) || 0).toFixed(2)}</span>
            </div>
          )}
          
          {/* ADICIONADO: Exibição do Total Final */}
          <div className="flex justify-between items-center pt-2 mt-2 border-t border-gray-700">
            <span className="text-base font-bold text-white">Total</span>
            <span className="text-xl font-bold text-emerald-400">R$ {total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};