import React from 'react';
import { ChevronRight, Phone, Clock, Sparkles, MessageCircle } from 'lucide-react';

// 🚀 AQUI: O componente agora recebe as duas propriedades novas que passamos na tela anterior
export const ClientList = ({ loading, clientes, onSelect, filtroAtivo, onDispararCampanha }) => {
  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        <p className="text-gray-500 text-sm">Carregando seus clientes...</p>
    </div>
  );
  
  if (clientes.length === 0) return (
    <div className="text-center py-10 text-gray-500 bg-white/5 rounded-2xl mx-4 border border-white/5 border-dashed">
      Nenhum cliente encontrado.
    </div>
  );

  return (
    <div className="px-4 space-y-3 min-h-[200px] pb-32">
      {clientes.map((cliente) => (
        <div 
          key={cliente.id} 
          onClick={() => onSelect(cliente)}
          className="bg-[#18181b] border border-white/5 rounded-2xl p-4 flex items-center justify-between hover:bg-white/5 transition-all cursor-pointer group shadow-sm active:scale-[0.98]"
        >
          <div className="flex items-center gap-4 min-w-0">
            {/* Avatar / Inicial */}
            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg relative shadow-inner shrink-0
                ${cliente.status === 'vip' ? 'bg-gradient-to-br from-amber-500 to-yellow-600 text-white' : 'bg-white/10 text-gray-300'}
            `}>
              {cliente.nome ? cliente.nome.charAt(0).toUpperCase() : '?'}
              
              {/* Notificação de Pendência */}
              {cliente.dias_sem_visita > 45 && (
                 <span className="absolute -top-1 -right-1 flex h-3 w-3">
                   <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                   <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                 </span>
              )}
            </div>

            {/* Informações */}
            <div className="min-w-0">
              <h3 className="font-bold text-gray-100 text-base truncate pr-2">{cliente.nome}</h3>
              
              <div className="text-sm text-gray-400 flex items-center gap-2 mt-0.5">
                {/* Lógica de Exibição de Status */}
                {cliente.dias_sem_visita === -1 ? (
                    <span className="text-blue-400 font-medium text-xs flex items-center gap-1 bg-blue-500/10 px-2 py-0.5 rounded-full whitespace-nowrap">
                        <Sparkles size={10}/> Novo Cliente
                    </span>
                ) : cliente.dias_sem_visita > 45 ? (
                    <span className="text-red-400 font-medium text-xs flex items-center gap-1 bg-red-500/10 px-2 py-0.5 rounded-full whitespace-nowrap">
                        <Clock size={10}/> Ausente há {cliente.dias_sem_visita} dias
                    </span>
                ) : (
                    <span className="flex items-center gap-1 truncate">
                        <Phone size={12} className="text-gray-500 shrink-0"/>
                        {cliente.telefone || 'Sem telefone'}
                    </span>
                )}
              </div>
            </div>
          </div>

          {/* 🚀 Lógica Condicional: Se o filtro for "perdidos", mostra o botão do WhatsApp. Senão, mostra a setinha > */}
          {filtroAtivo === 'perdidos' && cliente.telefone ? (
            <button 
              onClick={(e) => {
                e.stopPropagation(); // Evita que o clique no botão abra a ficha do cliente
                if(onDispararCampanha) onDispararCampanha(cliente);
              }}
              className="px-3 py-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-400 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0"
            >
              <MessageCircle size={14}/> Reconquistar
            </button>
          ) : (
            <ChevronRight className="text-gray-700 group-hover:text-purple-400 transition-colors shrink-0" size={20} />
          )}

        </div>
      ))}
    </div>
  );
};