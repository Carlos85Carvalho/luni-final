import React, { useState, useEffect } from 'react';
import { 
  X, MessageCircle, Clock, Scissors, Calendar, Loader2, 
  AlertCircle, Pencil, Trash2, Save, AlertTriangle, CalendarDays 
} from 'lucide-react';
import { supabase } from '../../../services/supabase';

export const ClientDetailsModal = ({ cliente, onClose }) => {
  // --- CORREÇÃO 1: Estado local para gerenciar os dados na tela ---
  // Isso evita alterar a prop 'cliente' diretamente
  const [localCliente, setLocalCliente] = useState(cliente);

  // Estados de Dados
  const [historico, setHistorico] = useState([]);
  const [loadingHistorico, setLoadingHistorico] = useState(false);
  const [visualizarHistorico, setVisualizarHistorico] = useState(false);
  
  // Estado para garantir o valor total correto
  const [gastoTotalReal, setGastoTotalReal] = useState(cliente.gasto_total || 0);
  const [loadingTotal, setLoadingTotal] = useState(true);

  // Estados de Edição
  const [isEditing, setIsEditing] = useState(false);
  // Inicializamos com os dados do cliente
  const [editedName, setEditedName] = useState(cliente.nome);
  const [editedPhone, setEditedPhone] = useState(cliente.telefone);
  const [saving, setSaving] = useState(false);

  // Estados de Exclusão
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Atualiza o estado local se a prop mudar (caso abra outro cliente sem desmontar)
  useEffect(() => {
    setLocalCliente(cliente);
    setEditedName(cliente.nome);
    setEditedPhone(cliente.telefone);
  }, [cliente]);

  // --- EFEITO: Buscar Total Real ao abrir ---
  useEffect(() => {
    const fetchTotalGasto = async () => {
      const { data, error } = await supabase
        .from('agendamentos')
        .select('valor_total, valor')
        .eq('cliente_id', cliente.id);

      if (!error && data) {
        const total = data.reduce((acc, item) => {
          const valor = Number(item.valor_total) || Number(item.valor) || 0;
          return acc + valor;
        }, 0);
        setGastoTotalReal(total);
      }
      setLoadingTotal(false);
    };

    if (cliente.id) {
        fetchTotalGasto();
    }
  }, [cliente.id]);

  // --- FORMATAÇÃO ---
  const formatMoney = (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Data desc.';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  // --- BUSCA HISTÓRICO ---
  const fetchHistoricoCliente = async () => {
    setLoadingHistorico(true);
    setVisualizarHistorico(true);
    
    const { data, error } = await supabase
      .from('agendamentos')
      .select('*, valor_total') 
      .eq('cliente_id', cliente.id)
      .order('data', { ascending: false });

    if (error) console.error("Erro histórico:", error);

    setHistorico(data || []);
    setLoadingHistorico(false);
  };

  // --- AÇÕES DO USUÁRIO ---
  const abrirWhatsapp = (telefone) => {
    if (!telefone) return;
    const numeroLimpo = telefone.replace(/\D/g, '');
    const numeroFinal = numeroLimpo.length <= 11 ? `55${numeroLimpo}` : numeroLimpo;
    window.open(`https://wa.me/${numeroFinal}`, '_blank');
  };

  const getValorItem = (item) => {
    return Number(item.valor_total) || Number(item.valor) || 0;
  };

  // --- CRUD (ATUALIZAR E DELETAR) ---
  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('clientes')
      .update({ nome: editedName, telefone: editedPhone })
      .eq('id', cliente.id);

    if (error) {
      alert('Erro ao atualizar cliente');
    } else {
      // --- CORREÇÃO 2: Atualiza o estado local em vez da prop ---
      setLocalCliente(prev => ({
        ...prev,
        nome: editedName,
        telefone: editedPhone
      }));
      setIsEditing(false);
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    const { error } = await supabase
      .from('clientes')
      .delete()
      .eq('id', cliente.id);

    if (error) {
      alert('Não foi possível excluir. Verifique se existem agendamentos vinculados.');
      setDeleting(false);
      setShowDeleteConfirm(false);
    } else {
      onClose(); 
      window.location.reload(); 
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-end sm:items-center justify-center sm:p-4 animate-in fade-in" onClick={onClose}>
      <div className="bg-[#18181b] border border-white/10 w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        
        {/* --- TELA DE CONFIRMAÇÃO DE EXCLUSÃO --- */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 z-50 bg-[#18181b]/95 flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
            <div className="bg-red-500/10 p-4 rounded-full mb-4">
              <AlertTriangle className="text-red-500" size={40} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Excluir Cliente?</h3>
            <p className="text-gray-400 text-sm mb-6">
              Esta ação é irreversível (LGPD). Todos os dados deste contato serão removidos.
            </p>
            <div className="flex gap-3 w-full">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-3 rounded-xl bg-white/10 text-white font-bold hover:bg-white/20 transition-colors">Cancelar</button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-colors flex items-center justify-center gap-2">
                {deleting ? <Loader2 className="animate-spin" size={18}/> : 'Sim, Excluir'}
              </button>
            </div>
          </div>
        )}

        {/* --- HEADER --- */}
        <div className="p-6 pb-4 flex justify-between items-start">
          <div className="flex items-center gap-4 w-full">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg border-2 border-[#18181b] shrink-0">
              {/* Usa localCliente em vez de cliente para refletir a edição imediatamente */}
              {localCliente.nome ? localCliente.nome.charAt(0).toUpperCase() : '?'}
            </div>
            
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <div className="space-y-2">
                  <input className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-white font-bold focus:border-purple-500 outline-none" value={editedName} onChange={(e) => setEditedName(e.target.value)} placeholder="Nome" />
                  <input className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-sm text-gray-300 focus:border-purple-500 outline-none" value={editedPhone} onChange={(e) => setEditedPhone(e.target.value)} placeholder="Telefone" />
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-bold text-white leading-tight truncate">{localCliente.nome}</h2>
                  <div onClick={() => abrirWhatsapp(localCliente.telefone)} className="flex items-center gap-2 text-green-400 mt-2 cursor-pointer hover:text-green-300 transition-colors bg-green-500/10 px-3 py-1.5 rounded-full border border-green-500/20 w-fit">
                    <MessageCircle size={16} fill="currentColor" className="text-green-500"/>
                    <span className="text-sm font-bold">WhatsApp</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 ml-2">
            {isEditing ? (
              <button onClick={handleSave} disabled={saving} className="p-2 bg-green-500/20 text-green-400 rounded-full hover:bg-green-500/30 transition-colors">
                {saving ? <Loader2 className="animate-spin" size={20}/> : <Save size={20}/>}
              </button>
            ) : (
              <button onClick={() => setIsEditing(true)} className="p-2 bg-white/5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"><Pencil size={18}/></button>
            )}
            {!isEditing && (
              <button onClick={() => setShowDeleteConfirm(true)} className="p-2 bg-white/5 rounded-full text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 size={18}/></button>
            )}
            <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"><X size={20}/></button>
          </div>
        </div>
        
        <div className="p-6 pt-2 overflow-y-auto">
        {!visualizarHistorico ? (
          <div className="animate-in slide-in-from-right-4 duration-300 space-y-6">
            <div className="grid grid-cols-2 gap-3">
              
              {/* CARD GASTO TOTAL */}
              <div className="bg-white/5 p-4 rounded-2xl text-center border border-white/5">
                <div className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-1">Gasto Total</div>
                <div className="text-xl font-bold text-emerald-400 flex justify-center items-center gap-2">
                  {loadingTotal ? <Loader2 className="animate-spin" size={16}/> : formatMoney(gastoTotalReal)}
                </div>
              </div>

              {/* CARD DATA DE CADASTRO */}
              <div className="bg-white/5 p-4 rounded-2xl text-center border border-white/5">
                <div className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-1">Cliente Desde</div>
                <div className="text-sm font-bold text-blue-400 flex items-center justify-center gap-1 h-7">
                   <CalendarDays size={14} className="mb-0.5"/> 
                   {formatDate(localCliente.created_at)}
                </div>
              </div>
            </div>

            <button onClick={fetchHistoricoCliente} className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-purple-900/20 flex items-center justify-center gap-2 active:scale-[0.98]">
              <Clock size={18}/> Ver Histórico Completo
            </button>
          </div>
        ) : (
          <div className="animate-in slide-in-from-right-4 duration-300 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-4">
              <h3 className="text-white font-bold text-lg">Histórico</h3>
              <button onClick={() => setVisualizarHistorico(false)} className="text-xs text-purple-400 font-bold uppercase hover:underline">Voltar</button>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto min-h-[200px]">
              {loadingHistorico ? (
                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-purple-500" size={30}/></div>
              ) : historico.length === 0 ? (
                <div className="text-center py-10 space-y-2"><p className="text-gray-500 text-sm">Nenhum agendamento encontrado.</p></div>
              ) : (
                historico.map((item, idx) => (
                  // CORREÇÃO 3: Usar ID como chave se possível, ou fallback para idx
                  <div key={item.id || idx} className="bg-white/5 p-3 rounded-xl border border-white/5 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${item.status === 'cancelado' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
                        <Scissors size={14}/>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{item.servico}</p>
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                          <Calendar size={10}/> {new Date(item.data).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-white block">{formatMoney(getValorItem(item))}</span>
                      {getValorItem(item) === 0 && (
                        <span className="text-[10px] text-yellow-500 flex items-center justify-end gap-1"><AlertCircle size={8}/> Sem valor</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};