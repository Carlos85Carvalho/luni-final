import React, { useState, useEffect } from 'react';
import { X, Save, Loader2, Calendar, User, Briefcase } from 'lucide-react';
import { supabase } from '../../services/supabase';

export const NovoAgendamentoModal = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [profissionais, setProfissionais] = useState([]);
  const [clientes, setClientes] = useState([]);
  
  const [formData, setFormData] = useState({
    cliente_id: '',
    cliente_nome: '',
    profissional_id: '',
    servico: '',
    data: new Date().toISOString().split('T')[0],
    horario: '10:00',
    valor: ''
  });

  useEffect(() => {
    if (isOpen) {
      const carregarDados = async () => {
        // Busca Clientes
        const { data: dataClientes } = await supabase.from('clientes').select('id, nome').order('nome');
        if (dataClientes) setClientes(dataClientes);

        // Busca Profissionais
        const { data: dataPros } = await supabase.from('profissionais').select('id, nome').order('nome');
        if (dataPros) setProfissionais(dataPros);
      };
      carregarDados();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectCliente = (e) => {
    const idSelecionado = e.target.value;
    const clienteEncontrado = clientes.find(c => c.id == idSelecionado);
    setFormData({
      ...formData,
      cliente_id: idSelecionado,
      cliente_nome: clienteEncontrado ? clienteEncontrado.nome : ''
    });
  };

  const salvar = async () => {
    setLoading(true);
    const payload = {
      cliente_nome: formData.cliente_nome,
      cliente_id: formData.cliente_id || null,
      servico: formData.servico,
      data: formData.data,
      horario: formData.horario,
      valor: formData.valor,
      status: 'agendado',
      ...(formData.profissional_id && { profissional_id: formData.profissional_id })
    };

    const { error } = await supabase.from('agendamentos').insert([payload]);
    setLoading(false);

    if (error) {
      alert('Erro: ' + error.message);
    } else {
      if(onSuccess) onSuccess();
      onClose();
      // Limpa formulário
      setFormData({ ...formData, servico: '', valor: '' }); 
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

        {/* CABEÇALHO DO MODAL */}
        <div className="flex flex-col items-center mb-6 mt-2">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-3">
            <Calendar size={24}/>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Novo Agendamento</h2>
          <p className="text-sm text-gray-500">Preencha os dados abaixo</p>
        </div>

        <div className="space-y-4">
          
          {/* CLIENTE (Corrigido para texto preto) */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1 block">Cliente</label>
            <div className="relative">
              <User size={18} className="absolute left-3 top-3.5 text-gray-400 pointer-events-none"/>
              <select 
                className="w-full pl-10 p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-purple-500 transition-colors text-gray-900 appearance-none"
                value={formData.cliente_id}
                onChange={handleSelectCliente}
              >
                <option value="" className="text-gray-500">Selecione o cliente...</option>
                {clientes.map(c => <option key={c.id} value={c.id} className="text-gray-900">{c.nome}</option>)}
              </select>
            </div>
          </div>

          {/* PROFISSIONAL (Sempre visível agora) */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1 block">Profissional</label>
            <div className="relative">
              <Briefcase size={18} className="absolute left-3 top-3.5 text-gray-400 pointer-events-none"/>
              <select 
                className="w-full pl-10 p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-purple-500 transition-colors text-gray-900 appearance-none"
                value={formData.profissional_id}
                onChange={e => setFormData({...formData, profissional_id: e.target.value})}
              >
                <option value="" className="text-gray-500">Selecione o profissional...</option>
                {profissionais.length === 0 && <option disabled>Nenhum cadastrado</option>}
                {profissionais.map(p => <option key={p.id} value={p.id} className="text-gray-900">{p.nome}</option>)}
              </select>
            </div>
          </div>

          {/* DATA E HORA */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1 block">Data</label>
              <input type="date" 
                className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-purple-500 text-gray-900"
                value={formData.data} onChange={e => setFormData({...formData, data: e.target.value})}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1 block">Horário</label>
              <input type="time" 
                className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-purple-500 text-gray-900"
                value={formData.horario} onChange={e => setFormData({...formData, horario: e.target.value})}
              />
            </div>
          </div>

          {/* SERVIÇO E VALOR */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-1">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1 block">Serviço</label>
              <input type="text" 
                className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-purple-500 text-gray-900 placeholder:text-gray-400"
                placeholder="Ex: Corte" value={formData.servico} onChange={e => setFormData({...formData, servico: e.target.value})}
              />
            </div>
            <div className="col-span-1">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1 block">R$</label>
              <input type="number" 
                className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-purple-500 text-gray-900 placeholder:text-gray-400"
                placeholder="0,00" value={formData.valor} onChange={e => setFormData({...formData, valor: e.target.value})}
              />
            </div>
          </div>

          <button 
            onClick={salvar} 
            disabled={loading} 
            className="w-full py-3.5 bg-[#5B2EFF] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#4a25d9] active:scale-95 transition-all mt-4 shadow-lg shadow-purple-200"
          >
            {loading ? <Loader2 className="animate-spin"/> : 'Confirmar Agendamento'}
          </button>

        </div>
      </div>
    </div>
  );
};