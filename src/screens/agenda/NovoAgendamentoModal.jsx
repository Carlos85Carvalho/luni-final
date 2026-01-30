import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { 
  X, Calendar, Clock, User, Scissors, DollarSign, Lock, Save, Loader2, CheckCircle
} from 'lucide-react';

export const NovoAgendamentoModal = ({ isOpen, onClose, onSuccess, profissionalId, tipo = 'agendamento' }) => {
  const [loading, setLoading] = useState(false);
  const [profissionais, setProfissionais] = useState([]);
  const [salaoId, setSalaoId] = useState(null); // Estado para armazenar o ID do salão
  const [showSuccess, setShowSuccess] = useState(false);
  
  const [selectedProfissional, setSelectedProfissional] = useState(profissionalId || '');
  const [clienteNome, setClienteNome] = useState('');
  const [clienteTelefone, setClienteTelefone] = useState('');
  const [data, setData] = useState('');
  const [horario, setHorario] = useState('');
  const [servico, setServico] = useState('');
  const [valor, setValor] = useState('');
  const [bloqueioMotivo, setBloqueioMotivo] = useState('');

  const isBloqueio = tipo === 'bloqueio';

  useEffect(() => {
    if (isOpen) {
      const carregarDadosIniciais = async () => {
        // 1. Pega o usuário logado e o ID do salão
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: usu } = await supabase
            .from('usuarios')
            .select('salao_id')
            .eq('id', user.id)
            .maybeSingle();
          if (usu) setSalaoId(usu.salao_id);
        }

        // 2. Se for Admin, carrega a lista de profissionais
        if (!profissionalId) {
          const { data } = await supabase.from('profissionais').select('*');
          setProfissionais(data || []);
        } else {
          setSelectedProfissional(profissionalId);
        }
      };

      carregarDadosIniciais();
      
      const hoje = new Date().toLocaleDateString('en-CA');
      setData(hoje);
      setHorario('09:00');
    }
  }, [isOpen, profissionalId]);

  const handleSubmit = async () => {
    if (!selectedProfissional || !data) return alert("Preencha profissional e data");
    if (!salaoId) return alert("Erro ao identificar o salão. Tente deslogar e logar novamente.");

    setLoading(true);
    try {
        const dados = {
            salao_id: salaoId, // ADICIONADO: Agora o agendamento pertence ao salão
            profissional_id: selectedProfissional,
            cliente_nome: isBloqueio ? `BLOQUEIO: ${bloqueioMotivo}` : clienteNome,
            telefone: clienteTelefone?.replace(/\D/g, ''),
            data,
            horario,
            servico: isBloqueio ? 'Bloqueio' : servico,
            valor: parseFloat(valor || 0),
            valor_total: parseFloat(valor || 0),
            status: isBloqueio ? 'bloqueado' : 'agendado'
        };

        const { error } = await supabase.from('agendamentos').insert([dados]);
        if (error) throw error;
        
        setShowSuccess(true);
        setTimeout(() => { 
          setShowSuccess(false); 
          onSuccess(); 
          onClose(); 
          // Limpa campos
          setClienteNome('');
          setClienteTelefone('');
          setServico('');
          setValor('');
          setBloqueioMotivo('');
        }, 1000);
    } catch (e) { 
      alert("Erro ao salvar: " + e.message); 
    } finally { 
      setLoading(false); 
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#18181b] w-full max-w-md rounded-3xl border border-white/10 p-6 shadow-2xl relative">
        {showSuccess && (
          <div className="absolute inset-0 bg-[#18181b] z-50 flex flex-col items-center justify-center rounded-3xl animate-in fade-in">
            <CheckCircle size={60} className="text-green-500 mb-2" />
            <p className="text-white font-bold">Salvo com sucesso!</p>
          </div>
        )}

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            {isBloqueio ? <Lock className="text-orange-500" size={20}/> : <Calendar className="text-[#5B2EFF]" size={20}/>}
            {isBloqueio ? 'Bloquear Horário' : 'Novo Agendamento'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-2 hover:bg-white/5 rounded-lg"><X size={20}/></button>
        </div>

        <div className="space-y-4">
          {!profissionalId && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Profissional</label>
              <select value={selectedProfissional} onChange={e => setSelectedProfissional(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl p-3.5 text-white outline-none focus:border-[#5B2EFF]">
                <option value="">Selecionar Profissional</option>
                {profissionais.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </div>
          )}

          {!isBloqueio ? (
            <>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Cliente</label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500"/>
                  <input placeholder="Nome da cliente" className="w-full bg-black/20 border border-white/10 rounded-xl p-3.5 pl-11 text-white outline-none focus:border-[#5B2EFF]" value={clienteNome} onChange={e => setClienteNome(e.target.value)}/>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="WhatsApp" className="w-full bg-black/20 border border-white/10 rounded-xl p-3.5 text-white outline-none" value={clienteTelefone} onChange={e => setClienteTelefone(e.target.value)}/>
                <input type="number" placeholder="Valor R$" className="w-full bg-black/20 border border-white/10 rounded-xl p-3.5 text-white outline-none" value={valor} onChange={e => setValor(e.target.value)}/>
              </div>
              <input placeholder="Serviço (ex: Corte, Mechas)" className="w-full bg-black/20 border border-white/10 rounded-xl p-3.5 text-white outline-none focus:border-[#5B2EFF]" value={servico} onChange={e => setServico(e.target.value)}/>
            </>
          ) : (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-orange-500 uppercase ml-1">Motivo</label>
              <input placeholder="Ex: Almoço, Curso..." className="w-full bg-black/20 border border-orange-500/30 rounded-xl p-3.5 text-white outline-none" value={bloqueioMotivo} onChange={e => setBloqueioMotivo(e.target.value)}/>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Data</label>
              <input type="date" className="w-full bg-black/20 border border-white/10 rounded-xl p-3.5 text-white [color-scheme:dark]" value={data} onChange={e => setData(e.target.value)}/>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Horário</label>
              <input type="time" className="w-full bg-black/20 border border-white/10 rounded-xl p-3.5 text-white [color-scheme:dark]" value={horario} onChange={e => setHorario(e.target.value)}/>
            </div>
          </div>

          <button onClick={handleSubmit} disabled={loading} className={`w-full py-4 rounded-2xl font-bold text-white shadow-lg transition-all active:scale-95 flex justify-center items-center gap-2 ${isBloqueio ? 'bg-orange-600 shadow-orange-900/20' : 'bg-[#5B2EFF] shadow-purple-900/20'}`}>
            {loading ? <Loader2 className="animate-spin" size={20}/> : <><Save size={20}/> Confirmar</>}
          </button>
        </div>
      </div>
    </div>
  );
};