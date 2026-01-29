import React, { useState } from 'react';
import { X, Save, Loader2, UserPlus, Phone, User } from 'lucide-react';
import { supabase } from '../../services/supabase';

export const NovoClienteModal = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');

  if (!isOpen) return null;

  const salvar = async () => {
    setLoading(true);
    const { error } = await supabase.from('clientes').insert([{ nome, telefone }]);
    setLoading(false);
    
    if (error) {
      alert('Erro ao salvar: ' + error.message);
    } else {
      onClose();
      setNome('');
      setTelefone('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl relative">
        
        {/* BOTÃO X */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 hover:text-red-500 transition-all"
        >
          <X size={20}/>
        </button>

        <div className="flex flex-col items-center mb-6 mt-2">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 mb-3">
            <UserPlus size={24}/>
          </div>
          <h2 className="text-xl font-bold text-gray-800">Novo Cliente</h2>
          <p className="text-sm text-gray-500">Cadastre um novo contato</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase ml-1 block mb-1">Nome Completo</label>
            <div className="relative">
              <User size={18} className="absolute left-3 top-3.5 text-gray-400 pointer-events-none"/>
              <input 
                className="w-full pl-10 p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-purple-500 focus:bg-white transition-all text-gray-900 placeholder:text-gray-400" 
                placeholder="Ex: Ana Silva"
                value={nome} onChange={e => setNome(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase ml-1 block mb-1">Telefone / WhatsApp</label>
            <div className="relative">
              <Phone size={18} className="absolute left-3 top-3.5 text-gray-400 pointer-events-none"/>
              <input 
                className="w-full pl-10 p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-purple-500 focus:bg-white transition-all text-gray-900 placeholder:text-gray-400" 
                placeholder="(11) 99999-9999"
                value={telefone} onChange={e => setTelefone(e.target.value)}
              />
            </div>
          </div>

          <button 
            onClick={salvar} 
            disabled={loading} 
            className="w-full py-3.5 bg-[#5B2EFF] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#4a25d9] active:scale-95 transition-all mt-4 shadow-lg shadow-purple-200"
          >
            {loading ? <Loader2 className="animate-spin"/> : 'Salvar Cliente'}
          </button>
        </div>
      </div>
    </div>
  );
};