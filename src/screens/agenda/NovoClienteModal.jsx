// src/screens/agenda/NovoClienteModal.jsx
import React, { useState } from 'react';
import { X, Save, Loader2, UserPlus, Phone, User, CalendarDays } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext'; 

export const NovoClienteModal = ({ isOpen, onClose }) => {
  const { salaoId: authSalaoId, profissionalData } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [aniversario, setAniversario] = useState(''); 

  if (!isOpen) return null;

  const salvar = async () => {
    if (!nome) return alert('Por favor, preencha o nome do cliente.');
    setLoading(true);
    try {
      let finalSalaoId = authSalaoId || profissionalData?.salao_id;

      if (!finalSalaoId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: usu } = await supabase.from('usuarios').select('salao_id').eq('id', user.id).maybeSingle();
          if (usu?.salao_id) { finalSalaoId = usu.salao_id; }
        }
      }

      if (!finalSalaoId) {
        setLoading(false);
        return alert("Erro: Não foi possível identificar o salão vinculado à sua conta.");
      }

      const dadosCliente = {
        nome, 
        telefone,
        salao_id: finalSalaoId,
        empresa_id: finalSalaoId 
      };

      if (aniversario) {
        dadosCliente.data_nascimento = aniversario; 
      }

      const { error } = await supabase.from('clientes').insert([dadosCliente]);
      
      if (error) throw error;
      
      onClose();
      setNome('');
      setTelefone('');
      setAniversario(''); 

    } catch (error) {
      alert('Erro ao salvar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/80 p-0 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#18181b] w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl relative border border-white/10 animate-in slide-in-from-bottom-4">
        
        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-all">
          <X size={20}/>
        </button>

        <div className="flex flex-col items-center mb-6 mt-2">
          <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center text-purple-400 mb-3 border border-purple-500/20">
            <UserPlus size={28}/>
          </div>
          <h2 className="text-xl font-bold text-white">Novo Cliente</h2>
          <p className="text-sm text-gray-400">Cadastre um novo contato na base</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Nome Completo *</label>
            <div className="relative">
              <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"/>
              <input 
                className="w-full pl-11 p-3.5 bg-black/20 border border-white/10 rounded-xl outline-none focus:border-purple-500 transition-all text-white placeholder:text-gray-600" 
                placeholder="Ex: Ana Silva"
                value={nome} onChange={e => setNome(e.target.value)}
              />
            </div>
          </div>
          
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Telefone / WhatsApp</label>
            <div className="relative">
              <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"/>
              <input 
                className="w-full pl-11 p-3.5 bg-black/20 border border-white/10 rounded-xl outline-none focus:border-purple-500 transition-all text-white placeholder:text-gray-600" 
                placeholder="(11) 99999-9999"
                value={telefone} onChange={e => setTelefone(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Data de Aniversário</label>
            <div className="relative">
              <CalendarDays size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"/>
              <input 
                type="date"
                className="w-full pl-11 p-3.5 bg-black/20 border border-white/10 rounded-xl outline-none focus:border-purple-500 transition-all text-white [color-scheme:dark]" 
                value={aniversario} onChange={e => setAniversario(e.target.value)}
              />
            </div>
          </div>

          <button 
            onClick={salvar} 
            disabled={loading} 
            className="w-full py-4 mt-6 bg-gradient-to-r from-purple-600 to-indigo-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-lg disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={20}/> : <><Save size={20}/> Confirmar Cadastro</>}
          </button>
        </div>
      </div>
    </div>
  );
};