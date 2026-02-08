import React from 'react';

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
  
  return (
    <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-purple-500/20 shadow-2xl overflow-hidden">
      
      {/* HEADER COM ABAS */}
      <div className="border-b border-gray-700/50 bg-gray-800/80">
        <div className="flex items-center gap-2 p-4">
          <button
            onClick={() => setAbaAtiva('agendamentos')}
            className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all duration-300
              ${abaAtiva === 'agendamentos' 
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-900/50 scale-105' 
                : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
          >
            <span className="flex items-center justify-center gap-2">
              📅 Agendamentos
              <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                {agendamentos.length}
              </span>
            </span>
          </button>
          
          <button
            onClick={() => setAbaAtiva('produtos')}
            className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all duration-300
              ${abaAtiva === 'produtos' 
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-900/50 scale-105' 
                : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
          >
            <span className="flex items-center justify-center gap-2">
              🏪 Produtos
              <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                {produtos.length}
              </span>
            </span>
          </button>
        </div>

        {/* BARRA DE BUSCA */}
        <div className="p-4 pt-0">
          <div className="relative">
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder={abaAtiva === 'agendamentos' 
                ? '🔍 Buscar agendamento...' 
                : '🔍 Buscar produto...'
              }
              className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-5 py-3 pl-12
                       text-white placeholder-gray-500
                       focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
                       transition-all duration-300"
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-xl">
              🔍
            </div>
            {busca && (
              <button
                onClick={() => setBusca('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 
                         text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* FILTRO DE CATEGORIAS (apenas para produtos) */}
        {abaAtiva === 'produtos' && categorias.length > 0 && (
          <div className="px-4 pb-4">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-purple-600 scrollbar-track-gray-800">
              <button
                onClick={() => setCategoriaAtiva('todas')}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all duration-300
                  ${categoriaAtiva === 'todas'
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                  }`}
              >
                Todas
              </button>
              {categorias.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoriaAtiva(cat)}
                  className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all duration-300
                    ${categoriaAtiva === cat
                      ? 'bg-purple-600 text-white shadow-lg'
                      : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CONTEÚDO - GRID DE ITENS */}
      <div className="p-4 max-h-[calc(100vh-400px)] overflow-y-auto scrollbar-thin scrollbar-thumb-purple-600 scrollbar-track-gray-800">
        {abaAtiva === 'agendamentos' ? (
          // GRID DE AGENDAMENTOS
          agendamentos.length === 0 ? (
            <EmptyState 
              icon="📅" 
              message={busca ? 'Nenhum agendamento encontrado' : 'Nenhum agendamento próximo'} 
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {agendamentos.map((agend) => (
                <AgendamentoCard
                  key={agend.id}
                  agendamento={agend}
                  onAdicionar={() => onAdicionarItem(agend, 'agendamento')}
                />
              ))}
            </div>
          )
        ) : (
          // GRID DE PRODUTOS
          produtos.length === 0 ? (
            <EmptyState 
              icon="🏪" 
              message={busca ? 'Nenhum produto encontrado' : 'Nenhum produto disponível'} 
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {produtos.map((produto) => (
                <ProdutoCard
                  key={produto.id}
                  produto={produto}
                  onAdicionar={() => onAdicionarItem(produto, 'produto')}
                  onEditarPreco={() => onEditarPreco(produto)}
                />
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
};

// ========== COMPONENTE: CARD DE AGENDAMENTO ==========
const AgendamentoCard = ({ agendamento, onAdicionar }) => {
  const dataFormatada = new Date(agendamento.data).toLocaleDateString('pt-BR');
  const horaFormatada = agendamento.hora || '--:--';

  return (
    <div className="bg-gradient-to-br from-gray-700/50 to-gray-800/50 
                    rounded-xl p-4 border border-gray-600/50 
                    hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-900/30
                    transition-all duration-300 group cursor-pointer"
         onClick={onAdicionar}>
      
      {/* HEADER */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-purple-600/20 border border-purple-500/30 
                        flex items-center justify-center text-lg">
            👤
          </div>
          <div>
            <p className="font-semibold text-white group-hover:text-purple-300 transition-colors">
              {agendamento.cliente_nome}
            </p>
            <p className="text-xs text-gray-400">
              {dataFormatada} às {horaFormatada}
            </p>
          </div>
        </div>
        
        <div className="text-right">
          <p className="text-lg font-bold text-green-400">
            R$ {agendamento.preco.toFixed(2)}
          </p>
        </div>
      </div>

      {/* SERVIÇO */}
      <div className="bg-gray-900/50 rounded-lg px-3 py-2 mb-3">
        <p className="text-sm text-gray-300">
          ✂️ {agendamento.servico_nome}
        </p>
      </div>

      {/* STATUS */}
      <div className="flex items-center justify-between">
        <span className={`px-3 py-1 rounded-full text-xs font-medium
          ${agendamento.status === 'confirmado' 
            ? 'bg-green-600/20 text-green-300 border border-green-500/30' 
            : 'bg-yellow-600/20 text-yellow-300 border border-yellow-500/30'
          }`}>
          {agendamento.status || 'Pendente'}
        </span>
        
        <button 
          onClick={onAdicionar}
          className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 
                   text-white rounded-lg font-medium text-sm
                   transition-all duration-300 active:scale-95">
          + Adicionar
        </button>
      </div>
    </div>
  );
};

// ========== COMPONENTE: CARD DE PRODUTO ==========
const ProdutoCard = ({ produto, onAdicionar, onEditarPreco }) => {
  const precoFinal = produto.preco || produto.preco_venda || 0;
  const estoqueColor = produto.estoque > 10 ? 'text-green-400' : 
                       produto.estoque > 5 ? 'text-yellow-400' : 'text-red-400';

  return (
    <div className="bg-gradient-to-br from-gray-700/50 to-gray-800/50 
                    rounded-xl overflow-hidden border border-gray-600/50 
                    hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-900/30
                    transition-all duration-300 group">
      
      {/* IMAGEM/ÍCONE DO PRODUTO */}
      <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 h-32 
                    flex items-center justify-center text-5xl">
        {produto.imagem ? (
          <img src={produto.imagem} alt={produto.nome} className="w-full h-full object-cover" />
        ) : (
          '📦'
        )}
      </div>

      {/* CONTEÚDO */}
      <div className="p-4">
        {/* NOME E CATEGORIA */}
        <div className="mb-3">
          <h3 className="font-semibold text-white group-hover:text-purple-300 
                       transition-colors mb-1 line-clamp-1">
            {produto.nome}
          </h3>
          {produto.categoria && (
            <span className="text-xs text-gray-400 bg-gray-700/50 px-2 py-0.5 rounded-full">
              {produto.categoria}
            </span>
          )}
        </div>

        {/* PREÇO E ESTOQUE */}
        <div className="flex items-end justify-between mb-3">
          <div>
            <p className="text-xs text-gray-400 mb-1">Preço</p>
            <p className="text-2xl font-bold text-green-400">
              R$ {precoFinal.toFixed(2)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400 mb-1">Estoque</p>
            <p className={`text-lg font-bold ${estoqueColor}`}>
              {produto.estoque}
            </p>
          </div>
        </div>

        {/* BOTÕES */}
        <div className="flex gap-2">
          <button
            onClick={onAdicionar}
            className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 
                     text-white rounded-lg font-medium
                     transition-all duration-300 active:scale-95">
            + Adicionar
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEditarPreco();
            }}
            className="px-3 py-2.5 bg-gray-700 hover:bg-gray-600 
                     text-white rounded-lg
                     transition-all duration-300 active:scale-95">
            💲
          </button>
        </div>
      </div>
    </div>
  );
};

// ========== COMPONENTE: ESTADO VAZIO ==========
const EmptyState = ({ icon, message }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="text-6xl mb-4 opacity-50">{icon}</div>
    <p className="text-gray-400 text-lg">{message}</p>
  </div>
);