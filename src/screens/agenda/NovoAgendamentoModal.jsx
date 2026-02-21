import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../../services/supabase';
import { 
  X, Calendar, Clock, User, Scissors, DollarSign, Lock, Save, Loader2, CheckCircle, ChevronDown
} from 'lucide-react';

export const NovoAgendamentoModal = ({ isOpen, onClose, onSuccess, profissionalId, tipo = 'agendamento' }) => {
  const [loading, setLoading] = useState(false);
  const [profissionais, setProfissionais] = useState([]);
  const [clientes, setClientes] = useState([]); 
  const [salaoId, setSalaoId] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedProfissional, setSelectedProfissional] = useState(profissionalId || '');
  const [selectedClienteId, setSelectedClienteId] = useState(''); 
  
  // Estados de Data/Horário Iniciais
  const [data, setData] = useState('');
  const [horario, setHorario] = useState('');
  
  // NOVOS Estados para o Fim do Bloqueio
  const [dataFim, setDataFim] = useState('');
  const [horarioFim, setHorarioFim] = useState('');

  const [servico, setServico] = useState('');
  const [valor, setValor] = useState('');
  const [bloqueioMotivo, setBloqueioMotivo] = useState('');

  const isBloqueio = tipo === 'bloqueio';

  const clienteSelecionado = clientes.find(c => c.id === selectedClienteId);

  useEffect(() => {
    if (isOpen) {
      const style = document.createElement('style');
      style.id = 'hide-footer-agendamento';
      style.innerHTML = `
        #rodape-principal, .fixed.bottom-0, nav.fixed.bottom-0, footer { 
          display: none !important; 
          opacity: 0 !important;
          pointer-events: none !important;
          z-index: -1 !important;
        }
        body { overflow: hidden !important; }
      `;
      document.head.appendChild(style);

      return () => {
        const existingStyle = document.getElementById('hide-footer-agendamento');
        if (existingStyle) document.head.removeChild(existingStyle);
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      const carregarDadosIniciais = async () => {
        
        if (!profissionalId) {
          const { data } = await supabase.from('profissionais').select('*');
          setProfissionais(data || []);
        } else {
          setSelectedProfissional(profissionalId);
        }

        const { data: clientesData, error } = await supabase
          .from('clientes')
          .select('*');

        if (!error && clientesData) {
          const clisOrdenados = clientesData.sort((a, b) => {
            const nomeA = a.nome || a.nome_cliente || a.nome_completo || '';
            const nomeB = b.nome || b.nome_cliente || b.nome_completo || '';
            return nomeA.localeCompare(nomeB);
          });
          setClientes(clisOrdenados);
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (user && !salaoId) {
          const { data: usu } = await supabase
            .from('usuarios')
            .select('salao_id')
            .eq('id', user.id)
            .maybeSingle();
          if (usu) setSalaoId(usu.salao_id);
        }
      };

      carregarDadosIniciais();
      
      const hojeLocal = new Date().toLocaleDateString('en-CA');
      setData(hojeLocal);
      setDataFim(hojeLocal); // Preenche o fim com o dia de hoje também
      setHorario('09:00');
      setHorarioFim('10:00'); // Pré-configura o bloqueio para durar 1 hora por padrão
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, profissionalId]);

  const handleValorChange = (e) => {
    let v = e.target.value.replace(/\D/g, ''); 
    if (v === '') {
      setValor('');
      return;
    }
    v = (parseInt(v, 10) / 100).toFixed(2); 
    v = v.replace('.', ','); 
    v = v.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.'); 
    setValor(v);
  };

  const handleSubmit = async () => {
    if (!selectedProfissional || !data || !horario) return alert("Preencha profissional, data e horário inicial.");
    if (!isBloqueio && !selectedClienteId) return alert("Selecione um cliente cadastrado na lista.");
    
    // TRAVA: Se for bloqueio, exige a data e hora final
    if (isBloqueio && (!dataFim || !horarioFim)) {
      return alert("Preencha a data e o horário de fim do bloqueio.");
    }

    setLoading(true);
    try {
        let finalSalaoId = salaoId;
        if (!finalSalaoId) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: usu } = await supabase.from('usuarios').select('salao_id').eq('id', user.id).maybeSingle();
            if (usu?.salao_id) {
              finalSalaoId = usu.salao_id;
              setSalaoId(usu.salao_id); 
            }
          }
        }

        if (!finalSalaoId) {
          setLoading(false);
          return alert("Erro: Seu usuário de teste não possui um salão vinculado no banco de dados.");
        }

        const nomeFinalCliente = clienteSelecionado ? (clienteSelecionado.nome || clienteSelecionado.nome_cliente || clienteSelecionado.nome_completo || 'Cliente Sem Nome') : '';
        const valorNumerico = valor ? parseFloat(valor.replace(/\./g, '').replace(',', '.')) : 0;

        const dados = {
            salao_id: finalSalaoId, 
            profissional_id: selectedProfissional,
            cliente_id: isBloqueio ? null : clienteSelecionado?.id, 
            cliente_nome: isBloqueio ? `BLOQUEIO: ${bloqueioMotivo}` : nomeFinalCliente,
            telefone: isBloqueio ? null : clienteSelecionado?.telefone?.replace(/\D/g, ''),
            data,
            horario,
            // Adiciona as colunas de fim apenas se for bloqueio
            data_fim: isBloqueio ? dataFim : null,
            horario_fim: isBloqueio ? horarioFim : null,
            servico: isBloqueio ? 'Bloqueio' : servico,
            valor: valorNumerico,
            valor_total: valorNumerico,
            status: isBloqueio ? 'bloqueado' : 'agendado'
        };

        const { error } = await supabase.from('agendamentos').insert([dados]);
        if (error) throw error;
        
        setShowSuccess(true);
        setTimeout(() => { 
          setShowSuccess(false); 
          onSuccess(); 
          onClose(); 
          setSelectedClienteId('');
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

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="bg-[#18181b] w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl border border-white/10 shadow-2xl relative flex flex-col animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-4 duration-300"
        style={{ maxHeight: '90dvh' }} 
      >
        
        {showSuccess && (
          <div className="absolute inset-0 bg-[#18181b] z-50 flex flex-col items-center justify-center rounded-3xl animate-in fade-in">
            <CheckCircle size={60} className="text-green-500 mb-2" />
            <p className="text-white font-bold">Salvo com sucesso!</p>
          </div>
        )}

        <div className="flex justify-between items-center p-6 pb-4 border-b border-white/5 flex-shrink-0">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            {isBloqueio ? <Lock className="text-orange-500" size={20}/> : <Calendar className="text-[#5B2EFF]" size={20}/>}
            {isBloqueio ? 'Bloquear Horário' : 'Novo Agendamento'}
          </h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-white p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <X size={20}/>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4 custom-scrollbar min-h-0">
          
          {!profissionalId && (
            <div className="space-y-1.5 relative">
              <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Profissional</label>
              <div className="relative">
                <select 
                  value={selectedProfissional} 
                  onChange={e => setSelectedProfissional(e.target.value)} 
                  className="w-full bg-black/20 border border-white/10 rounded-xl p-3.5 text-white outline-none focus:border-[#5B2EFF] transition-all appearance-none"
                >
                  <option value="" className="bg-[#18181b] text-white">Selecionar Profissional</option>
                  {profissionais.map(p => (
                    <option key={p.id} value={p.id} className="bg-[#18181b] text-white">{p.nome}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              </div>
            </div>
          )}

          {!isBloqueio ? (
            <>
              {/* COMPORTAMENTO NORMAL DE AGENDAMENTO */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Cliente Cadastrado</label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500"/>
                  <select 
                    value={selectedClienteId} 
                    onChange={e => setSelectedClienteId(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-xl p-3.5 pl-11 pr-10 text-white outline-none focus:border-[#5B2EFF] transition-all appearance-none" 
                  >
                    <option value="" className="bg-[#18181b] text-gray-400">Selecione o cliente...</option>
                    {clientes.map(c => {
                      const nomeCliente = c.nome || c.nome_cliente || c.nome_completo || ('Sem Nome (ID: ' + c.id.slice(0,4) + ')');
                      return (
                        <option key={c.id} value={c.id} className="bg-[#18181b] text-white">
                          {nomeCliente} {c.telefone ? `(${c.telefone})` : ''}
                        </option>
                      )
                    })}
                  </select>
                  <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Telefone</label>
                  <input 
                    disabled
                    placeholder="Automático" 
                    className="w-full bg-white/5 border border-white/5 rounded-xl p-3.5 text-gray-400 outline-none cursor-not-allowed transition-all" 
                    value={clienteSelecionado ? clienteSelecionado.telefone || 'Sem telefone' : ''} 
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Valor</label>
                  <div className="relative">
                    <DollarSign size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500"/>
                    <input 
                      type="text" 
                      placeholder="0,00" 
                      className="w-full bg-black/20 border border-white/10 rounded-xl p-3.5 pl-9 text-white outline-none focus:border-[#5B2EFF] transition-all" 
                      value={valor} 
                      onChange={handleValorChange} 
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Serviço</label>
                <div className="relative">
                  <Scissors size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500"/>
                  <input 
                    placeholder="Ex: Corte, Mechas, Hidratação..." 
                    className="w-full bg-black/20 border border-white/10 rounded-xl p-3.5 pl-11 text-white outline-none focus:border-[#5B2EFF] transition-all" 
                    value={servico} 
                    onChange={e => setServico(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pb-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Data</label>
                  <input 
                    type="date" 
                    className="w-full bg-black/20 border border-white/10 rounded-xl p-3.5 text-white [color-scheme:dark] outline-none focus:border-[#5B2EFF] transition-all" 
                    value={data} 
                    onChange={e => setData(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Horário</label>
                  <input 
                    type="time" 
                    className="w-full bg-black/20 border border-white/10 rounded-xl p-3.5 text-white [color-scheme:dark] outline-none focus:border-[#5B2EFF] transition-all" 
                    value={horario} 
                    onChange={e => setHorario(e.target.value)}
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              {/* NOVO COMPORTAMENTO DE BLOQUEIO */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-orange-400 uppercase ml-1">Motivo do Bloqueio</label>
                <input 
                  placeholder="Ex: Almoço, Curso, Compromisso..." 
                  className="w-full bg-black/20 border border-orange-500/30 rounded-xl p-3.5 text-white outline-none focus:border-orange-500 transition-all" 
                  value={bloqueioMotivo} 
                  onChange={e => setBloqueioMotivo(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Data Início</label>
                  <input 
                    type="date" 
                    className="w-full bg-black/20 border border-white/10 rounded-xl p-3.5 text-white [color-scheme:dark] outline-none focus:border-orange-500 transition-all" 
                    value={data} 
                    onChange={e => {
                      setData(e.target.value);
                      if (!dataFim) setDataFim(e.target.value); // Atualiza o fim automaticamente para facilitar
                    }}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Horário Início</label>
                  <input 
                    type="time" 
                    className="w-full bg-black/20 border border-white/10 rounded-xl p-3.5 text-white [color-scheme:dark] outline-none focus:border-orange-500 transition-all" 
                    value={horario} 
                    onChange={e => setHorario(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pb-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Data Fim</label>
                  <input 
                    type="date" 
                    className="w-full bg-black/20 border border-white/10 rounded-xl p-3.5 text-white [color-scheme:dark] outline-none focus:border-orange-500 transition-all" 
                    value={dataFim} 
                    onChange={e => setDataFim(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Horário Fim</label>
                  <input 
                    type="time" 
                    className="w-full bg-black/20 border border-white/10 rounded-xl p-3.5 text-white [color-scheme:dark] outline-none focus:border-orange-500 transition-all" 
                    value={horarioFim} 
                    onChange={e => setHorarioFim(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

        </div>

        <div className="p-6 pt-4 border-t border-white/5 flex-shrink-0 bg-[#18181b] rounded-b-3xl">
          <button 
            onClick={handleSubmit} 
            disabled={loading} 
            className={`w-full py-4 rounded-2xl font-bold text-white shadow-lg transition-all active:scale-95 flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
              isBloqueio 
                ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-orange-900/30' 
                : 'bg-gradient-to-r from-[#5B2EFF] to-[#7C3EFF] hover:from-[#4a24cc] hover:to-[#6a30dd] shadow-purple-900/30'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20}/>
                Salvando...
              </>
            ) : (
              <>
                <Save size={20}/>
                {isBloqueio ? 'Confirmar Bloqueio' : 'Agendar Cliente'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};