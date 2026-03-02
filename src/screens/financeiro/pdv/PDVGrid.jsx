import React from 'react';
import { Search, Package, Plus, Tag } from 'lucide-react';

export const PDVGrid = ({ 
  busca, 
  setBusca, 
  categorias, 
  categoriaAtiva, 
  setCategoriaAtiva, 
  produtos, 
  onAdicionarItem
}) => {

  // --- CARD DE PRODUTO ---
  const renderProdutoCard = (produto) => {
    // 🚀 A MÁGICA ESTÁ AQUI: Forçando o PDV a ler as mesmas colunas novas da tela de Estoque!
    const estoqueReal = produto.quantidade_atual !== undefined ? Number(produto.quantidade_atual) : 0;
    const precoReal = produto.preco_venda !== undefined ? Number(produto.preco_venda) : 0;

    return (
      <div 
        key={produto.id} 
        className="bg-[#1c1c22] border border-white/5 hover:border-white/10 
                   rounded-2xl overflow-hidden flex flex-col group transition-all duration-200"
      >
        {/* Imagem / Icone do Produto */}
        <div className="h-24 bg-black/30 flex items-center justify-center relative">
          <Package size={32} className="text-gray-600 group-hover:text-gray-500 transition-colors" />
          <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-bold border
            ${estoqueReal > 5 
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
              : 'bg-red-500/10 text-red-400 border-red-500/20'
            }`}>
            {estoqueReal} un
          </div>
        </div>

        <div className="p-3 flex flex-col flex-1">
          {/* Categoria */}
          {produto.categoria && (
            <div className="flex items-center gap-1 text-[10px] text-gray-500 uppercase tracking-wider mb-1">
              <Tag size={10} />{produto.categoria}
            </div>
          )}
          
          {/* Nome do Produto */}
          <h3 className="font-medium text-gray-200 text-sm leading-snug mb-3 line-clamp-2 flex-1">
            {produto.nome}
          </h3>

          {/* Rodapé: Preço e Botão Adicionar */}
          <div className="flex items-end justify-between gap-2 mt-auto">
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-600 font-medium mb-0.5">Preço Un.</span>
              <span className="text-base font-bold text-white">R$ {precoReal.toFixed(2)}</span>
            </div>
            
            <button 
              // 🚀 AQUI: Passamos os valores corrigidos para o carrinho
              onClick={() => onAdicionarItem({ ...produto, quantidade_atual: estoqueReal, preco_venda: precoReal }, 'produto')}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-purple-600 text-white 
                         hover:bg-purple-500 transition-all active:scale-95 shadow-lg shadow-purple-900/20"
            >
              <Plus size={18} strokeWidth={3} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full space-y-3">
      
      {/* BARRA DE BUSCA */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
          <input 
            type="text" 
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar produto..."
            className="w-full bg-[#1c1c22] border border-white/5 text-white pl-10 pr-4 py-2.5 rounded-xl 
                       focus:ring-1 focus:ring-purple-500/50 focus:border-purple-500/50 outline-none 
                       transition-all placeholder:text-gray-600 text-sm"
          />
        </div>
      </div>

      {/* FILTRO DE CATEGORIAS */}
      {categorias && categorias.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => setCategoriaAtiva('todas')}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all border ${
              categoriaAtiva === 'todas'
                ? 'bg-purple-600 border-purple-500 text-white'
                : 'bg-[#1c1c22] border-white/5 text-gray-500 hover:text-gray-300'
            }`}
          >
            TODAS
          </button>
          {categorias.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoriaAtiva(cat)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all border uppercase ${
                categoriaAtiva === cat
                  ? 'bg-purple-600 border-purple-500 text-white'
                  : 'bg-[#1c1c22] border-white/5 text-gray-500 hover:text-gray-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* GRID DE PRODUTOS */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {!produtos || produtos.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-600">
              <Package size={40} className="mb-3 opacity-30" />
              <p className="text-sm">Nenhum produto encontrado.</p>
            </div>
          ) : produtos.map(renderProdutoCard)}
        </div>
      </div>
    </div>
  );
};