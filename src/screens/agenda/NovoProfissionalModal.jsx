import React, { useState } from 'react';
import { X, User, Mail, Phone, Briefcase, Loader2 } from 'lucide-react'; // Removida a dependência do App
import { supabase } from '../../services/supabase';

// Agora recebemos 'salaoId' como PROPRIEDADE (prop), vindo do pai
export const NovoProfissionalModal = ({ isOpen, onClose, onSuccess, salaoId }) => {
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    especialidade: 'Cabeleireiro(a)',
  });

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!formData.nome || !formData.email) return alert('Nome e Email são obrigatórios');
    if (!salaoId) return alert('Erro: ID do salão não identificado. Tente recarregar a página.');

    setLoading(true);

    try {
      const { error } = await supabase.from('profissionais').insert([
        {
          nome: formData.nome,
          email: formData.email,
          telefone: formData.telefone,
          especialidade: formData.especialidade,
          salao_id: salaoId, // Usa o ID recebido via prop
          ativo: true
        }
      ]);

      if (error) {
        if (error.code === '23505') throw new Error('E-mail ou telefone já cadastrado.');
        throw error;
      }

      alert('Profissional cadastrado com sucesso!');
      if (onSuccess) onSuccess();
      onClose();
      setFormData({ nome: '', email: '', telefone: '', especialidade: 'Cabeleireiro(a)' });

    } catch (error) {
      alert('Erro ao salvar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#18181b] border border-white/10 rounded-2xl w-full max-w-md p-6 relative shadow-2xl animate-in fade-in zoom-in duration-300">
        
        <button onClick={onClose} className="absolute right-4 top-4 text-gray-400 hover:text-white transition-colors">
          <X size={20} />
        </button>

        <h2 className="text-xl font-bold text-white mb-1">Novo Profissional</h2>
        <p className="text-gray-400 text-sm mb-6">Adicione alguém à sua equipe</p>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Nome Completo</label>
            <div className="relative">
              <User className="absolute left-3 top-3 text-gray-500" size={18} />
              <input 
                value={formData.nome}
                onChange={e => setFormData({...formData, nome: e.target.value})}
                className="w-full bg-black/20 border border-white/10 rounded-xl py-2.5 pl-10 text-white focus:border-purple-500 outline-none transition-all"
                placeholder="Ex: Aline Silva"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">E-mail de Acesso</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-gray-500" size={18} />
              <input 
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                className="w-full bg-black/20 border border-white/10 rounded-xl py-2.5 pl-10 text-white focus:border-purple-500 outline-none transition-all"
                placeholder="email@profissional.com"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Telefone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 text-gray-500" size={18} />
              <input 
                value={formData.telefone}
                onChange={e => setFormData({...formData, telefone: e.target.value})}
                className="w-full bg-black/20 border border-white/10 rounded-xl py-2.5 pl-10 text-white focus:border-purple-500 outline-none transition-all"
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Especialidade</label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-3 text-gray-500" size={18} />
              <select 
                value={formData.especialidade}
                onChange={e => setFormData({...formData, especialidade: e.target.value})}
                className="w-full bg-black/20 border border-white/10 rounded-xl py-2.5 pl-10 text-white focus:border-purple-500 outline-none appearance-none cursor-pointer"
              >
                <option>Cabeleireiro(a)</option>
                <option>Manicure</option>
                <option>Esteticista</option>
                <option>Barbeiro</option>
                <option>Recepcionista</option>
              </select>
            </div>
          </div>

        </div>

        <button 
          onClick={handleSubmit}
          disabled={loading}
          className="w-full mt-8 bg-[#5B2EFF] hover:bg-[#4a25cc] text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-purple-900/20 active:scale-95 flex justify-center items-center gap-2"
        >
          {loading ? <Loader2 className="animate-spin" /> : 'Salvar Profissional'}
        </button>

      </div>
    </div>
  );
};