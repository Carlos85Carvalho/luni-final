import React from 'react';
import { ShoppingCart, Trash2, User, ChevronDown, Minus, Plus, Scissors, Package, X, Award, Percent } from 'lucide-react';

export const PDVCart = ({ carrinho, cliente, onRemover, onAjustarQtd, onLimpar, onSelecionarCliente, subtotal, desconto, total, setDesconto, setTipoDesconto, tipoDesconto }) => {
  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-200 w-full lg:w-[400px]">
      {/* Header Carrinho */}
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-xl font-bold flex items-center gap-2"><ShoppingCart className="text-purple-600" /> Carrinho ({carrinho.length})</h2>
        {carrinho.length > 0 && <button onClick={onLimpar} className="text-red-500 text-sm flex items-center gap-1"><Trash2 size={14} /> Limpar</button>}
      </div>

      {/* Cliente */}
      <div className="p-4 bg-gray-50 border-b">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium flex items-center gap-2"><User size={14} /> Cliente</span>
          <button onClick={onSelecionarCliente} className="text-xs text-purple-600 font-bold hover:underline">
            {cliente ? 'ALTERAR' : 'SELECIONAR'}
          </button>
        </div>
        {cliente ? (
          <div className="bg-white p-2 rounded border">
            <p className="font-bold text-gray-800">{cliente.nome}</p>
            {cliente.pontos > 0 && <span className="text-xs text-amber-600 flex items-center gap-1"><Award size={10}/> {cliente.pontos} pts</span>}
          </div>
        ) : (
          <div onClick={onSelecionarCliente} className="p-2 border-2 border-dashed rounded text-center text-gray-400 text-sm cursor-pointer hover:bg-gray-100">Toque para selecionar cliente</div>
        )}
      </div>

      {/* Lista de Itens */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {carrinho.map(item => (
          <div key={`${item.tipo}-${item.id}`} className="flex justify-between items-start bg-gray-50 p-2 rounded-lg">
            <div className="flex-1">
              <div className="flex items-center gap-1 mb-1">
                {item.tipo === 'servico' ? <Scissors size={12} className="text-blue-500"/> : <Package size={12} className="text-purple-500"/>}
                <span className="text-sm font-medium line-clamp-1">{item.nome}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center border bg-white rounded">
                  <button onClick={() => onAjustarQtd(item.id, item.tipo, -1)} className="px-2 py-1 hover:bg-gray-100"><Minus size={12}/></button>
                  <span className="text-xs font-bold w-6 text-center">{item.qtd}</span>
                  <button onClick={() => onAjustarQtd(item.id, item.tipo, 1)} className="px-2 py-1 hover:bg-gray-100"><Plus size={12}/></button>
                </div>
                <span className="text-sm font-bold">R$ {(item.preco_venda * item.qtd).toFixed(2)}</span>
              </div>
            </div>
            <button onClick={() => onRemover(item.id, item.tipo)} className="text-gray-400 hover:text-red-500"><X size={16}/></button>
          </div>
        ))}
      </div>

      {/* Footer Totais */}
      <div className="p-4 bg-gray-50 border-t space-y-2">
        <div className="flex gap-2 mb-2">
          <input type="number" value={desconto} onChange={e => setDesconto(Number(e.target.value))} className="w-20 px-2 py-1 rounded border text-sm" placeholder="Desc." />
          <div className="flex bg-gray-200 rounded p-0.5">
            <button onClick={() => setTipoDesconto('percentual')} className={`px-2 text-xs rounded ${tipoDesconto === 'percentual' ? 'bg-white shadow' : ''}`}>%</button>
            <button onClick={() => setTipoDesconto('valor')} className={`px-2 text-xs rounded ${tipoDesconto === 'valor' ? 'bg-white shadow' : ''}`}>R$</button>
          </div>
        </div>
        <div className="flex justify-between text-sm"><span>Subtotal:</span> <span>R$ {subtotal.toFixed(2)}</span></div>
        <div className="flex justify-between text-sm text-red-500"><span>Desconto:</span> <span>- R$ {((tipoDesconto === 'percentual' ? subtotal * desconto / 100 : desconto) || 0).toFixed(2)}</span></div>
        <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t"><span>Total:</span> <span>R$ {total.toFixed(2)}</span></div>
      </div>
    </div>
  );
};