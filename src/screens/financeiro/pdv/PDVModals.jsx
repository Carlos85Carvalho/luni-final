import React, { useState, useEffect } from 'react';
import { X, QrCode, Banknote, CreditCard, Clock3, RefreshCw, User, Search } from 'lucide-react';
import { supabase } from '../../../services/supabase';

// ============================================================================
// 1. COMPONENTES AUXILIARES
// ============================================================================

const BtnPagamento = ({ icon, label, color, onClick, disabled }) => {
  const IconComponent = icon;
  const colors = {
    green: 'border-green-200 hover:bg-green-50 text-green-700',
    amber: 'border-amber-200 hover:bg-amber-50 text-amber-700',
    blue: 'border-blue-200 hover:bg-blue-50 text-blue-700',
    orange: 'border-orange-200 hover:bg-orange-50 text-orange-700',
  };

  return (
    <button onClick={onClick} disabled={disabled} className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${colors[color]}`}>
      <IconComponent size={24} /> <span className="font-bold">{label}</span>
    </button>
  );
};

// ============================================================================
// 2. COMPONENTES DE MODAL
// ============================================================================

// --- MODAL DE SELEÇÃO DE CLIENTES ---
export const ClientesSelectionModal = ({ aberto, onClose, onSelecionar }) => {
  const [busca, setBusca] = useState('');
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (aberto) {
      const fetchClientes = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('clientes').select('*').order('nome');
        if (!error) {
            setClientes(data || []);
        }
        setLoading(false);
      };
      
      fetchClientes();
    }
  }, [aberto]);

  const clientesFiltrados = clientes.filter(c => 
    c.nome.toLowerCase().includes(busca.toLowerCase()) || 
    (c.telefone && c.telefone.includes(busca))
  );

  if (!aberto) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[80] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-lg h-[600px] flex flex-col shadow-2xl animate-in zoom-in-95">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
            <User className="text-purple-600" /> Selecionar Cliente
          </h3>
          <button onClick={onClose}><X size={20} className="text-gray-500 hover:text-gray-800"/></button>
        </div>

        <div className="p-4 bg-gray-50 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
            <input 
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Buscar por nome ou telefone..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 outline-none"
              autoFocus
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
             <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div></div>
          ) : clientesFiltrados.length === 0 ? (
            <p className="text-center text-gray-400 py-10">Nenhum cliente encontrado.</p>
          ) : (
            clientesFiltrados.map(cliente => (
              <div 
                key={cliente.id} 
                onClick={() => { onSelecionar(cliente); onClose(); }}
                className="flex justify-between items-center p-3 hover:bg-purple-50 rounded-xl cursor-pointer transition-colors border-b border-gray-100 last:border-0"
              >
                <div>
                  <div className="font-bold text-gray-800">{cliente.nome}</div>
                  <div className="text-sm text-gray-500">{cliente.telefone || 'Sem telefone'}</div>
                </div>
                <div className="p-2 bg-gray-100 rounded-full text-gray-400">
                   <User size={16} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// --- MODAL DE PAGAMENTO ---
export const PagamentoModal = ({ aberto, onClose, total, onFinalizar, processando }) => {
  if (!aberto) return null;
  
  const valorTotal = Number(total) || 0;

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-800">Pagamento</h3>
            <p className="text-gray-500 text-sm">Total a pagar: <span className="font-bold text-gray-900">R$ {valorTotal.toFixed(2)}</span></p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={20} /></button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <BtnPagamento icon={QrCode} label="PIX" color="green" onClick={() => onFinalizar('pix')} disabled={processando} />
          <BtnPagamento icon={Banknote} label="Dinheiro" color="amber" onClick={() => onFinalizar('dinheiro')} disabled={processando} />
          <BtnPagamento icon={CreditCard} label="Crédito" color="blue" onClick={() => onFinalizar('credito')} disabled={processando} />
          <BtnPagamento icon={CreditCard} label="Débito" color="orange" onClick={() => onFinalizar('debito')} disabled={processando} />
        </div>
        {processando && <p className="text-center mt-4 text-purple-600 animate-pulse font-medium">Processando venda...</p>}
      </div>
    </div>
  );
};

// --- MODAL DE VENDAS PENDENTES ---
export const VendasPendentesModal = ({ aberto, onClose, vendasPendentes = [], onRecuperar, onUsarCliente }) => {
  if (!aberto) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl animate-in zoom-in-95">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2"><Clock3 className="text-amber-600" /> Vendas Pendentes</h3>
          <button onClick={onClose}><X size={20} className="text-gray-500 hover:text-gray-800"/></button>
        </div>
        <div className="p-6 overflow-y-auto flex-1 bg-gray-50">
          {vendasPendentes.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <Clock3 size={48} className="mx-auto mb-3 opacity-20" />
              <p>Nenhuma venda pendente.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {vendasPendentes.map(venda => (
                <div key={venda.id} className="bg-white p-4 rounded-xl border border-amber-100 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="font-bold text-gray-800">Venda #{venda.numero_venda}</div>
                      <div className="text-xs text-gray-500">{new Date(venda.created_at).toLocaleString()}</div>
                      {venda.clientes && <div className="text-sm text-amber-700 mt-1 font-medium">{venda.clientes.nome}</div>}
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">R$ {(venda.total || 0).toFixed(2)}</div>
                      <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">Pendente</span>
                    </div>
                  </div>
                  <div className="flex gap-2 border-t pt-3">
                    <button onClick={() => onRecuperar(venda)} className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2">
                      <RefreshCw size={14} /> Recuperar Venda
                    </button>
                    {venda.clientes && (
                      <button onClick={() => onUsarCliente(venda.clientes)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium">
                        Usar Cliente
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- MODAL DE EDITAR PREÇO ---
export const EditarPrecoModal = ({ aberto, onClose, item, onSalvar }) => {
  // CORREÇÃO: Inicializa o estado diretamente. Como usamos "key" no pai, o componente recria quando o item muda.
  const [preco, setPreco] = useState(item?.preco_venda || item?.preco_base || 0);

  // Removido useEffect que causava o erro.

  if (!aberto || !item) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[80] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95">
        <h3 className="font-bold text-lg mb-1">Editar Preço</h3>
        <p className="text-gray-500 text-sm mb-4">{item.nome}</p>
        <input 
          type="number" 
          value={preco} 
          onChange={e => setPreco(e.target.value)} 
          className="w-full p-3 border rounded-xl mb-4 text-lg font-bold text-center focus:ring-2 focus:ring-purple-500 outline-none"
          autoFocus
        />
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium">Cancelar</button>
          <button onClick={() => { onSalvar(item.id, Number(preco)); onClose(); }} className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold">Salvar</button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 3. COMPONENTE AGREGADOR PRINCIPAL
// ============================================================================

export const PDVModals = ({
  modalState,
  onClose,
  onFinalizarPagamento,
  // CORREÇÃO: Removidos props não utilizados (onAdicionarServico, agendamentos, servicos)
  onRecuperarVenda,
  onUsarCliente,
  onSalvarPreco,
  setCliente, 
  totalPagamento,
  processandoPagamento,
  vendasPendentes,
}) => {
  
  const { view, dados, isOpen } = modalState || {};

  return (
    <>
      <PagamentoModal
        aberto={isOpen && view === 'pagamento'}
        onClose={onClose}
        total={totalPagamento}
        onFinalizar={onFinalizarPagamento}
        processando={processandoPagamento}
      />

      <ClientesSelectionModal 
        aberto={isOpen && view === 'selecionar-cliente'}
        onClose={onClose}
        onSelecionar={setCliente}
      />

      <VendasPendentesModal
        aberto={isOpen && view === 'vendas-pendentes'}
        onClose={onClose}
        vendasPendentes={vendasPendentes}
        onRecuperar={onRecuperarVenda}
        onUsarCliente={onUsarCliente}
      />

      <EditarPrecoModal
        key={dados?.id || 'editor'}
        aberto={isOpen && view === 'editar-preco'}
        onClose={onClose}
        item={dados}
        onSalvar={onSalvarPreco}
      />
    </>
  );
};