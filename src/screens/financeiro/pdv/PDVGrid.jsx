import React from 'react';
import { Search, Package, Calendar, Clock, User, Scissors, Plus, Edit2, ChevronRight, Tag } from 'lucide-react';

export const PDVGrid = ({ 
  abaAtiva, 
  setAbaAtiva, 
  busca, 
  setBusca, 
  categorias, 
  categoriaAtiva, 
  setCategoriaAtiva, 
  produtos, 
  agendamentos, 
  onAdicionarItem,
  onEditarPreco 
}) => {

  // --- RENDERIZAR CARD DE AGENDAMENTO ---
  const renderAgendamentoCard = (agendamento) => (
    <div 
      key={agendamento.id} 
      onClick={() => onAdicionarItem(agendamento, 'agendamento')}
      className="group bg-white/5 hover:bg-white/10 border border-white/5 hover:border-purple-500/50 
                 rounded-2xl p-4 cursor-pointer transition-all duration-300 relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="bg-purple-600 rounded-full p-1.5 shadow-lg shadow-purple-900/50">
          <Plus size={16} className="text-white" />
        </div>
      </div>

      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
          <User size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-white truncate">{agendamento.cliente_nome}</h3>
          <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
            <span className="flex items-center gap-1"><Clock size={12}/> {agendamento.hora?.slice(0, 5)}</span>
            {agendamento.cliente_telefone && <span>• {agendamento.cliente_telefone}</span>}
          </div>
        </div>
      </div>

      <div className="bg-gray-900/50 rounded-xl p-3 border border-white/5">
        <div className="flex items-center gap-2 text-purple-300 text-sm font-medium mb-1">
          <Scissors size={14} />
          <span className="truncate">{agendamento.servico_nome}</span>
        </div>
        <div className="text-right font-bold text-white">
          R$ {agendamento.preco?.toFixed(2)}
        </div>
      </div>
    </div>
  );

  // --- RENDERIZAR CARD DE PRODUTO (NOVO DESIGN) ---
  const renderProdutoCard = (produto) => (
    <div 
      key={produto.id} 
      className="bg-gray-800 rounded-2xl border border-gray-700 hover:border-purple-500/50 
                 transition-all duration-300 overflow-hidden flex flex-col group h-full shadow-lg"
    >
      {/* Topo do Card: Ícone e Badge de Estoque */}
      <div className="relative h-24 bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
        <Package size={32} className="text-gray-500 group-hover:text-purple-400 transition-colors" />
        
        {/* Badge de Estoque Flutuante */}
        <div className={`absolute top-2 right-2 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border
          ${produto.estoque > 5 
            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
            : 'bg-red-500/20 text-red-400 border-red-500/30'
          }`}>
          Estoque: {produto.estoque || 0}
        </div>
      </div>

      {/* Corpo do Card */}
      <div className="p-4 flex flex-col flex-1">
        
        {/* Categoria */}
        {produto.categoria && (
          <div className="flex items-center gap-1 text-[10px] text-gray-400 uppercase tracking-wider mb-1">
            <Tag size={10} />
            {produto.categoria}
          </div>
        )}

        {/* Nome do Produto (até 2 linhas) */}
        <h3 className="font-semibold text-gray-100 text-sm leading-tight mb-3 line-clamp-2 h-10" title={produto.nome}>
          {produto.nome}
        </h3>

        {/* Preço e Ações (Ficam no rodapé do card) */}
        <div className="mt-auto flex items-end justify-between gap-2">
          
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-500">Preço Un.</span>
            <span className="text-lg font-bold text-white">
              R$ {produto.preco_venda?.toFixed(2)}
            </span>
          </div>

          <div className="flex gap-1">
            {/* Botão Editar Preço */}
            <button 
              onClick={(e) => { e.stopPropagation(); onEditarPreco(produto); }}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-700 text-gray-400 
                         hover:bg-purple-600 hover:text-white transition-colors border border-gray-600 hover:border-purple-500"
              title="Editar Preço"
            >
              <Edit2 size={14} />
            </button>

            {/* Botão Adicionar ao Carrinho */}
            <button 
              onClick={() => onAdicionarItem(produto, 'produto')}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-purple-600 text-white 
                         hover:bg-purple-500 shadow-lg shadow-purple-900/50 hover:scale-105 transition-all active:scale-95"
              title="Adicionar à Venda"
            >
              <Plus size={16} strokeWidth={3} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full space-y-4">
      
      {/* --- BARRA DE BUSCA E ABAS --- */}
      <div className="flex flex-col sm:flex-row gap-4 bg-gray-800/50 p-2 rounded-2xl border border-gray-700/50">
        
        {/* Toggle Abas */}
        <div className="flex bg-gray-900/50 p-1 rounded-xl shrink-0">
          <button
            onClick={() => setAbaAtiva('agendamentos')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              abaAtiva === 'agendamentos' 
                ? 'bg-gray-700 text-white shadow-md' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Calendar size={16} />
            <span className="hidden sm:inline">Agendamentos</span>
            <span className="bg-purple-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">
              {agendamentos.length}
            </span>
          </button>
          <button
            onClick={() => setAbaAtiva('produtos')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              abaAtiva === 'produtos' 
                ? 'bg-gray-700 text-white shadow-md' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Package size={16} />
            <span className="hidden sm:inline">Produtos</span>
            <span className="bg-emerald-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">
              {produtos.length}
            </span>
          </button>
        </div>

        {/* Campo de Busca */}
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-400 transition-colors" size={20} />
          <input 
            type="text" 
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder={abaAtiva === 'agendamentos' ? "Buscar cliente..." : "Buscar produto..."}
            className="w-full bg-gray-900 border border-gray-700 text-white pl-10 pr-4 py-2.5 rounded-xl 
                       focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all placeholder:text-gray-600"
          />
        </div>
      </div>

      {/* --- FILTRO DE CATEGORIAS (SÓ PRODUTOS) --- */}
      {abaAtiva === 'produtos' && categorias.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
          <button
            onClick={() => setCategoriaAtiva('todas')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors border ${
              categoriaAtiva === 'todas'
                ? 'bg-purple-600 border-purple-500 text-white'
                : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'
            }`}
          >
            TODAS
          </button>
          {categorias.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoriaAtiva(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors border uppercase ${
                categoriaAtiva === cat
                  ? 'bg-purple-600 border-purple-500 text-white'
                  : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* --- CONTEÚDO DA GRID --- */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {abaAtiva === 'agendamentos' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {agendamentos.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-500">
                <Calendar size={48} className="mb-4 opacity-20" />
                <p>Nenhum agendamento para hoje.</p>
              </div>
            ) : (
              agendamentos.map(renderAgendamentoCard)
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {produtos.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-500">
                <Package size={48} className="mb-4 opacity-20" />
                <p>Nenhum produto encontrado.</p>
              </div>
            ) : (
              produtos.map(renderProdutoCard)
            )}
          </div>
        )}
      </div>
    </div>
  );
};