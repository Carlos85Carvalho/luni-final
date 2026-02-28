import React, { useState } from 'react';
import { X, Save, Loader2, UserPlus, Phone, User, CalendarDays } from 'lucide-react';
import { supabase } from '../../services/supabase';
// ✅ IMPORTAÇÃO CORRIGIDA: Apontando para a nova pasta contexts
import { useAuth } from '../../contexts/AuthContext'; 

export const NovoClienteModal = ({ isOpen, onClose }) => {
  // PEGANDO AS CREDENCIAIS DE QUEM ESTÁ LOGADO
  const { salaoId: authSalaoId, profissionalData } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [aniversario, setAniversario] = useState(''); // 🚀 NOVO ESTADO AQUI

  if (!isOpen) return null;

  const salvar = async () => {
    if (!nome) return alert('Por favor, preencha o nome do cliente.');

    setLoading(true);

    try {
      // 1. Descobre de qual salão é esse cliente (Dono ou Profissional)
      let finalSalaoId = authSalaoId || profissionalData?.salao_id;

      // Fallback de segurança caso a internet oscile e o contexto demore
      if (!finalSalaoId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: usu } = await supabase.from('usuarios').select('salao_id').eq('id', user.id).maybeSingle();
          if (usu?.salao_id) {
            finalSalaoId = usu.salao_id;
          }
        }
      }

      // Se mesmo assim não achar, bloqueia para não criar cliente "fantasma"
      if (!finalSalaoId) {
        setLoading(false);
        return alert("Erro: Não foi possível identificar o salão vinculado à sua conta.");
      }

      // 2. Monta o pacote de dados a ser salvo
      // 🚀 AQUI ESTÁ A CORREÇÃO: Enviando o empresa_id junto!
      const dadosCliente = {
        nome, 
        telefone,
        salao_id: finalSalaoId,
        empresa_id: finalSalaoId 
      };

      // Só envia o aniversário se o usuário tiver preenchido
      if (aniversario) {
        dadosCliente.data_nascimento = aniversario; 
      }

      // 3. Salva no banco
      const { error } = await supabase.from('clientes').insert([dadosCliente]);
      
      if (error) throw error;
      
      // Sucesso! Limpa e fecha
      onClose();
      setNome('');
      setTelefone('');
      setAniversario(''); // Limpa o estado do aniversário

    } catch (error) {
      alert('Erro ao salvar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
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

          {/* 🚀 NOVO CAMPO: DATA DE ANIVERSÁRIO */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase ml-1 block mb-1">Data de Aniversário (Opcional)</label>
            <div className="relative">
              <CalendarDays size={18} className="absolute left-3 top-3.5 text-gray-400 pointer-events-none"/>
              <input 
                type="date"
                className="w-full pl-10 p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-purple-500 focus:bg-white transition-all text-gray-900 placeholder:text-gray-400" 
                value={aniversario} onChange={e => setAniversario(e.target.value)}
              />
            </div>
          </div>

          <button 
            onClick={salvar} 
            disabled={loading} 
            className="w-full py-3.5 bg-[#5B2EFF] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#4a25d9] active:scale-95 transition-all mt-4 shadow-lg shadow-purple-200 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={20}/> : <><Save size={20}/> Salvar Cliente</>}
          </button>
        </div>
      </div>
    </div>
  );
};