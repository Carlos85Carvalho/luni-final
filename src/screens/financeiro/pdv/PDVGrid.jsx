// src/screens/financeiro/pdv/PDVGrid.jsx
import React from 'react';
import { Search, Filter, X, Tag, AlertCircle, Package, Edit, Scissors } from 'lucide-react';

export const PDVGrid = ({
  // Adicionamos = [] para garantir que nunca seja undefined
  produtos = [], 
  servicos = [],
  abaAtiva,
  busca,
  setBusca,
  categoria,
  setCategoria,
  categorias = [], // Também protegemos categorias
  onAdicionar,
  onEditarPreco
}) => {
  
  // Lógica de segurança: se a lista for null/undefined, usa array vazio
  const listaAlvo = abaAtiva === 'produtos' ? produtos : servicos;
  const itensExibidos = listaAlvo || [];

  return (
    <div className="flex flex-col h-full bg-gray-50 border-r border-gray-200">
      {/* Barra de Busca */}
      <div className="p-4 bg-white border-b border-gray-200 shadow-sm z-10">
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={`Buscar ${abaAtiva}...`}
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="w-full pl-10 pr-10 py-3 bg-gray-100 border-transparent focus:bg-white border focus:border-purple-500 rounded-xl transition-all outline-none"
            />
            {busca && (
              <button onClick={() => setBusca('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          {abaAtiva === 'produtos' && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <select 
                value={categoria} 
                onChange={e => setCategoria(e.target.value)}
                className="bg-gray-100 border-none rounded-lg px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-purple-500 cursor-pointer"
              >
                <option value="todas">Todas as categorias</option>
                {categorias.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Grid de Itens */}
      <div className="flex-1 overflow-y-auto p-4">
        {itensExibidos.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            {abaAtiva === 'produtos' ? <Package size={48} /> : <Scissors size={48} />}
            <p className="mt-2 text-sm">Nenhum item encontrado</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {itensExibidos.map(item => (
              <div 
                key={item.id}
                onClick={() => onAdicionar(item, abaAtiva === 'produtos' ? 'produto' : 'servico')}
                className={`
                  group bg-white p-3 rounded-xl border border-gray-200 shadow-sm 
                  hover:shadow-md hover:border-purple-500 cursor-pointer transition-all active:scale-95
                  flex flex-col justify-between h-full relative overflow-hidden
                  ${item.quantidade_atual <= 0 && abaAtiva === 'produtos' ? 'opacity-50 grayscale pointer-events-none' : ''}
                `}
              >
                {/* Indicador de Estoque (Produtos) */}
                {abaAtiva === 'produtos' && (
                  <div className="absolute top-2 right-2">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      item.quantidade_atual > 5 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {item.quantidade_atual} un
                    </span>
                  </div>
                )}

                {/* Conteúdo */}
                <div className="mb-2 mt-1">
                  <h3 className="font-semibold text-gray-800 text-sm leading-tight line-clamp-2 min-h-[2.5rem]">
                    {item.nome}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 truncate">
                    {item.categoria || (item.duracao ? `${item.duracao} min` : '')}
                  </p>
                </div>

                {/* Preço e Ação */}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                  <span className="font-bold text-purple-700">
                    R$ {Number(item.preco_venda || item.preco_base || 0).toFixed(2)}
                  </span>
                  
                  {/* Botão Editar Preço (Só Serviços) */}
                  {abaAtiva === 'servicos' && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); onEditarPreco(item); }}
                      className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-full transition-colors"
                    >
                      <Edit size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};