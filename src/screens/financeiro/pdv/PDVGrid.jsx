import React from 'react';
import { Search, Package, Calendar, Clock, User, Scissors, Plus, Tag } from 'lucide-react';

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
  onAdicionarItem
  // onEditarPreco (Removido pois não será mais usado aqui)
}) => {

  // --- CARD DE AGENDAMENTO ---
  const renderAgendamentoCard = (agendamento) => (
    <div 
      key={agendamento.id} 
      onClick={() => onAdicionarItem(agendamento, 'agendamento')}
      className="group bg-[#1c1c22] hover:bg-[#22222a] border border-white/5 hover:border-purple-500/40 
                 rounded-2xl p-4 cursor-pointer transition-all duration-200 relative flex flex-col justify-between"
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
          <User size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white truncate text-sm">{agendamento.cliente_nome}</h3>
          <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
            <span className="flex items-center gap-1"><Clock size={11}/> {agendamento.hora?.slice(0, 5)}</span>
            {agendamento.cliente_telefone && <span className="truncate">· {agendamento.cliente_telefone}</span>}
          </div>
        </div>
        
        <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-4 right-4">
          <div className="w-7 h-7 bg-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-purple-600/20">
            <Plus size={14} className="text-white" />
          </div>
        </div>
      </div>

      <div className="bg-black/30 rounded-xl p-3 border border-white/5 flex items-center justify-between gap-3 mt-auto">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="text-purple-400 shrink-0 opacity-80">
            <Scissors size={14} />
          </div>
          <span className="text-gray-300 text-xs font-medium truncate leading-tight">
            {agendamento.servico_nome}
          </span>
        </div>

        <div className="flex flex-col items-end shrink-0 pl-2 border-l border-white/5">
          <span className="text-[9px] text-gray-600 uppercase font-bold tracking-wider leading-none mb-1">
            VALOR
          </span>
          <span className="font-bold text-emerald-400 text-sm leading-none">
            R$ {agendamento.preco?.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );

  // --- CARD DE PRODUTO (CORRIGIDO) ---
  const renderProdutoCard = (produto) => (
    <div 
      key={produto.id} 
      className="bg-[#1c1c22] border border-white/5 hover:border-white/10 
                 rounded-2xl overflow-hidden flex flex-col group transition-all duration-200"
    >
      {/* Imagem / Icone do Produto */}
      <div className="h-24 bg-black/30 flex items-center justify-center relative">
        <Package size={32} className="text-gray-600 group-hover:text-gray-500 transition-colors" />
        <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-bold border
          ${(produto.estoque || 0) > 5 
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
            : 'bg-red-500/10 text-red-400 border-red-500/20'
          }`}>
          {produto.estoque || 0} un
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
            <span className="text-base font-bold text-white">R$ {produto.preco_venda?.toFixed(2)}</span>
          </div>
          
          <button 
            onClick={() => onAdicionarItem(produto, 'produto')}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-purple-600 text-white 
                       hover:bg-purple-500 transition-all active:scale-95 shadow-lg shadow-purple-900/20"
          >
            <Plus size={18} strokeWidth={3} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full space-y-3">
      
      {/* BARRA DE ABAS + BUSCA */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex bg-[#1c1c22] p-1 rounded-xl border border-white/5 shrink-0">
          <button
            onClick={() => setAbaAtiva('agendamentos')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              abaAtiva === 'agendamentos' 
                ? 'bg-white/10 text-white' 
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <Calendar size={14} />
            Agendamentos
            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
              abaAtiva === 'agendamentos' ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-400'
            }`}>
              {agendamentos.length}
            </span>
          </button>
          <button
            onClick={() => setAbaAtiva('produtos')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              abaAtiva === 'produtos' 
                ? 'bg-white/10 text-white' 
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <Package size={14} />
            Produtos
            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
              abaAtiva === 'produtos' ? 'bg-emerald-600 text-white' : 'bg-white/5 text-gray-400'
            }`}>
              {produtos.length}
            </span>
          </button>
        </div>

        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
          <input 
            type="text" 
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder={abaAtiva === 'agendamentos' ? "Buscar cliente..." : "Buscar produto..."}
            className="w-full bg-[#1c1c22] border border-white/5 text-white pl-10 pr-4 py-2.5 rounded-xl 
                       focus:ring-1 focus:ring-purple-500/50 focus:border-purple-500/50 outline-none 
                       transition-all placeholder:text-gray-600 text-sm"
          />
        </div>
      </div>

      {/* FILTRO DE CATEGORIAS */}
      {abaAtiva === 'produtos' && categorias.length > 0 && (
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

      {/* GRID */}
      <div className="flex-1 overflow-y-auto">
        {abaAtiva === 'agendamentos' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {agendamentos.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-600">
                <Calendar size={40} className="mb-3 opacity-30" />
                <p className="text-sm">Nenhum agendamento para hoje.</p>
              </div>
            ) : agendamentos.map(renderAgendamentoCard)}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {produtos.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-600">
                <Package size={40} className="mb-3 opacity-30" />
                <p className="text-sm">Nenhum produto encontrado.</p>
              </div>
            ) : produtos.map(renderProdutoCard)}
          </div>
        )}
      </div>
    </div>
  );
};