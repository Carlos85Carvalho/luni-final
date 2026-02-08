import React from 'react';
import { Search, Package, Scissors, CalendarClock, ChevronRight, AlertCircle } from 'lucide-react';

export const PDVGrid = ({ 
  produtos, 
  agendamentos, 
  categorias, 
  abaAtiva, 
  setAbaAtiva, 
  busca, 
  setBusca, 
  categoriaAtiva, 
  setCategoriaAtiva, 
  onAdicionar, 
  onEditarPreco 
}) => {

  // Filtra o conteúdo com base na aba, busca e categoria
  const itensFiltrados = React.useMemo(() => {
    const textoBusca = busca.toLowerCase();

    if (abaAtiva === 'agendamentos') {
      // Retorna apenas os 5 agendamentos passados (já filtrados no pai)
      // Se houver busca, filtra também pelo nome do cliente ou serviço
      if (textoBusca) {
          return agendamentos.filter(ag => 
              ag.cliente_nome?.toLowerCase().includes(textoBusca) ||
              ag.servico_nome?.toLowerCase().includes(textoBusca)
          );
      }
      return agendamentos; 
    }

    if (abaAtiva === 'produtos') {
      return produtos.filter(p => {
        const matchNome = p.nome.toLowerCase().includes(textoBusca);
        // Se categoria for "todas", ignora filtro de categoria, senão filtra
        const matchCat = categoriaAtiva === 'todas' || p.categoria === categoriaAtiva;
        return matchNome && matchCat;
      });
    }

    return [];
  }, [produtos, agendamentos, abaAtiva, busca, categoriaAtiva]);

  // Função para renderizar Card de Agendamento
  const renderCardAgendamento = (ag) => (
    <div 
      key={ag.id} 
      onClick={() => onAdicionar(ag, 'agendamento')}
      className="bg-[#27272a] p-4 rounded-xl border-l-4 border-blue-500 hover:bg-[#3f3f46] cursor-pointer transition-all flex justify-between items-center group relative overflow-hidden"
    >
      <div>
        <div className="text-xs font-bold text-blue-400 mb-1 flex items-center gap-1">
          <CalendarClock size={12}/> {ag.horario?.slice(0,5)} • {new Date(ag.data).toLocaleDateString('pt-BR')}
        </div>
        <h3 className="font-bold text-white text-lg">{ag.cliente_nome}</h3>
        <p className="text-sm text-gray-400">{ag.servico_nome}</p>
      </div>
      <div className="flex flex-col items-end">
         <span className="font-bold text-white text-lg">R$ {ag.preco?.toFixed(2)}</span>
         <span className="text-xs text-gray-500 group-hover:text-blue-400 flex items-center mt-1">
           Adicionar <ChevronRight size={14}/>
         </span>
      </div>
    </div>
  );

  // Função para renderizar Card de Produto
  const renderCardProduto = (item) => (
    <div 
      key={item.id} 
      className="bg-[#27272a] rounded-2xl p-4 flex flex-col justify-between hover:ring-2 hover:ring-purple-500/50 transition-all group relative border border-white/5"
    >
      {/* Botão Editar Preço (aparece no hover) */}
      <button 
        onClick={(e) => { e.stopPropagation(); onEditarPreco(item); }}
        className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-purple-600 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
        title="Editar Preço"
      >
        <span className="text-[10px] font-bold">Editar</span>
      </button>

      <div onClick={() => onAdicionar(item, 'produto')} className="cursor-pointer">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400 shrink-0">
             <Package size={20}/>
          </div>
          <div>
            <h3 className="font-bold text-white leading-tight line-clamp-2">{item.nome}</h3>
            <p className="text-xs text-gray-500 mt-1">{item.estoque} em estoque</p>
          </div>
        </div>
        
        <div className="mt-auto pt-3 border-t border-white/5 flex justify-between items-center">
          {/* Usa 'preco' (banco) ou 'preco_venda' (fallback) */}
          <span className="text-lg font-bold text-emerald-400">R$ {(item.preco || item.preco_venda || 0).toFixed(2)}</span>
          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors text-gray-400">
            +
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-[#18181b]">
      {/* HEADER DE FILTROS E BUSCA */}
      <div className="p-4 space-y-4 border-b border-gray-800 bg-[#18181b]">
        
        {/* Barra de Busca + Tabs Principais */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20}/>
            <input 
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder={abaAtiva === 'produtos' ? "Buscar produto..." : "Filtrar agendamento..."}
              className="w-full pl-10 pr-4 py-3 bg-[#0a0a0f] border border-gray-800 rounded-xl text-white focus:border-purple-500 outline-none transition-all"
            />
          </div>
          
          <div className="flex bg-[#0a0a0f] p-1 rounded-xl border border-gray-800">
             <button 
               onClick={() => setAbaAtiva('agendamentos')}
               className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${abaAtiva === 'agendamentos' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
             >
               <CalendarClock size={16}/> Agendamentos
             </button>
             <button 
               onClick={() => setAbaAtiva('produtos')}
               className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${abaAtiva === 'produtos' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
             >
               <Package size={16}/> Produtos
             </button>
          </div>
        </div>

        {/* Filtros de Categoria (Só mostra se estiver em Produtos) */}
        {abaAtiva === 'produtos' && (
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button 
              onClick={() => setCategoriaAtiva('todas')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-all ${categoriaAtiva === 'todas' ? 'bg-white text-black border-white' : 'bg-transparent text-gray-400 border-gray-700 hover:border-gray-500'}`}
            >
              Todos
            </button>
            {categorias.map(cat => (
              <button 
                key={cat} 
                onClick={() => setCategoriaAtiva(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-all ${categoriaAtiva === cat ? 'bg-purple-600 text-white border-purple-600' : 'bg-transparent text-gray-400 border-gray-700 hover:border-gray-500'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ÁREA DE CONTEÚDO (GRID) */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        
        {abaAtiva === 'agendamentos' && (
           <div className="space-y-4">
              <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Próximos 5 Agendamentos</h3>
              {itensFiltrados.length === 0 ? (
                 <div className="text-center py-20 text-gray-500">
                   <CalendarClock size={48} className="mx-auto mb-3 opacity-20"/>
                   <p>Nenhum agendamento próximo encontrado.</p>
                 </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                   {itensFiltrados.map(renderCardAgendamento)}
                </div>
              )}
           </div>
        )}

        {abaAtiva === 'produtos' && (
           <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {itensFiltrados.length === 0 ? (
                <div className="col-span-full text-center py-20 text-gray-500">
                  <Package size={48} className="mx-auto mb-3 opacity-20"/>
                  <p>Nenhum produto encontrado.</p>
                </div>
              ) : (
                itensFiltrados.map(renderCardProduto)
              )}
           </div>
        )}

      </div>
    </div>
  );
};