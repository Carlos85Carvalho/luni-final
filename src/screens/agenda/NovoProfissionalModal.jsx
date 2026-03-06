import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { User, Plus, Trash2, Shield, Star, Crown, X, Mail, Phone, Briefcase, Pencil, Loader2, Tag, Percent, DollarSign, Settings, ChevronLeft, Scissors } from 'lucide-react';

export const NovoProfissionalModal = ({ isOpen, onClose, salaoId }) => {
  const [profissionais, setProfissionais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [limite, setLimite] = useState(1);
  const [plano, setPlano] = useState('starter');
  
  const [view, setView] = useState('list'); 
  const [editingId, setEditingId] = useState(null);

  // Estados do Formulário
  const [novoNome, setNovoNome] = useState('');
  const [novoCargo, setNovoCargo] = useState('');
  const [novoEmail, setNovoEmail] = useState('');
  const [novoTelefone, setNovoTelefone] = useState('');
  
  const [qualificacoes, setQualificacoes] = useState([]);
  const [inputQualificacao, setInputQualificacao] = useState('');

  const [isAssistente, setIsAssistente] = useState(false);
  const [profissionalPrincipalId, setProfissionalPrincipalId] = useState('');

  // Estados de Comissão (Padrão)
  const [comissaoPadrao, setComissaoPadrao] = useState('');
  const [comissaoFixa, setComissaoFixa] = useState('');
  
  // --- NOVO: ESTADO DAS EXCEÇÕES DE COMISSÃO ---
  const [excecoesComissao, setExcecoesComissao] = useState([]);
  
  // Controle do Sub-Modal de Comissões
  const [showComissaoModal, setShowComissaoModal] = useState(false);

  useEffect(() => {
    if (isOpen && salaoId) {
        fetchDados();
        resetForm();
        setView('list'); 
    }
  }, [isOpen, salaoId]);

  const fetchDados = async () => {
    setLoading(true);
    try {
      const { data: dadosSalao } = await supabase
        .from('saloes')
        .select('limite_profissionais, plano')
        .eq('id', salaoId)
        .single();

      if (dadosSalao) {
        setLimite(dadosSalao.limite_profissionais || 1);
        setPlano(dadosSalao.plano || 'starter');
      }

      const { data: pros } = await supabase
        .from('profissionais')
        .select('*')
        .eq('salao_id', salaoId)
        .eq('ativo', true)
        .order('created_at', { ascending: true });

      setProfissionais(pros || []);
    } catch (error) {
      console.error('Erro ao buscar equipe:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setNovoNome('');
    setNovoCargo('');
    setNovoEmail('');
    setNovoTelefone('');
    setQualificacoes([]);
    setInputQualificacao('');
    setIsAssistente(false);
    setProfissionalPrincipalId('');
    setComissaoPadrao(''); 
    setComissaoFixa('');
    setExcecoesComissao([]); // Limpa as exceções
    setShowComissaoModal(false);
    setEditingId(null);
  };

  const handleAddClick = () => {
    if (profissionais.length >= limite) {
      setView('upgrade');
    } else {
      resetForm();
      setView('form');
    }
  };

  const adicionarTag = (e) => {
    e.preventDefault();
    if (!inputQualificacao.trim()) return;
    if (!qualificacoes.includes(inputQualificacao.trim())) {
        setQualificacoes([...qualificacoes, inputQualificacao.trim()]);
    }
    setInputQualificacao('');
  };

  const removerTag = (tagParaRemover) => {
    setQualificacoes(qualificacoes.filter(tag => tag !== tagParaRemover));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        adicionarTag(e);
    }
  };

  const handleEditClick = (pro) => {
    setEditingId(pro.id);
    setNovoNome(pro.nome);
    setNovoCargo(pro.especialidade);
    setNovoEmail(pro.email || '');
    setNovoTelefone(pro.telefone || '');
    setQualificacoes(Array.isArray(pro.skills) ? pro.skills : []); 
    setIsAssistente(pro.is_assistente || false);
    setProfissionalPrincipalId(pro.profissional_principal_id || '');
    
    setComissaoPadrao(pro.taxa_comissao_padrao || '');
    setComissaoFixa(pro.valor_comissao_fixa || '');
    
    // Carrega as exceções salvas no banco
    setExcecoesComissao(pro.excecoes_comissao || []);
    
    setView('form');
  };

  // --- FUNÇÕES PARA GERENCIAR AS EXCEÇÕES ---
  const addExcecao = () => {
    setExcecoesComissao([...excecoesComissao, { servico: '', tipo: 'porcentagem', valor: '' }]);
  };

  const updateExcecao = (index, campo, valor) => {
    const novasExcecoes = [...excecoesComissao];
    novasExcecoes[index][campo] = valor;
    setExcecoesComissao(novasExcecoes);
  };

  const removeExcecao = (index) => {
    setExcecoesComissao(excecoesComissao.filter((_, i) => i !== index));
  };
  // -------------------------------------------

  const salvarProfissional = async () => {
    if (!novoNome) return alert("O nome é obrigatório!");
    if (isAssistente && !profissionalPrincipalId) return alert("Selecione a qual profissional esta assistente pertence!");
    
    setSaving(true);

    const payload = {
        nome: novoNome,
        especialidade: novoCargo || 'Geral',
        email: novoEmail,
        telefone: novoTelefone,
        salao_id: salaoId,
        ativo: true,
        skills: qualificacoes,
        is_assistente: isAssistente,
        profissional_principal_id: isAssistente && profissionalPrincipalId ? Number(profissionalPrincipalId) : null,
        taxa_comissao_padrao: comissaoPadrao ? parseFloat(comissaoPadrao) : 0,
        valor_comissao_fixa: comissaoFixa ? parseFloat(comissaoFixa) : 0,
        excecoes_comissao: excecoesComissao // Salva a lista de exceções
    };

    try {
        let error;
        if (editingId) {
            const { error: err } = await supabase.from('profissionais').update(payload).eq('id', editingId);
            error = err;
        } else {
            const { error: err } = await supabase.from('profissionais').insert(payload);
            error = err;
        }

        if (error) throw error;

        resetForm();
        await fetchDados();
        setView('list');

    } catch (error) {
        alert('Erro ao salvar: ' + error.message);
    } finally {
        setSaving(false);
    }
  };

  const deletarProfissional = async (id, nome) => {
    if (confirm(`Tem certeza que deseja remover ${nome} da equipe?`)) {
      try {
          const { error } = await supabase.from('profissionais').delete().eq('id', id);
          if (error) throw error;
          fetchDados();
      } catch (err) {
          alert("Erro ao excluir: " + err.message);
      }
    }
  };

  const getPlanIcon = () => {
    if (plano === 'elite') return <Crown className="text-yellow-400" size={16} />;
    if (plano === 'business') return <Star className="text-purple-400" size={16} />;
    return <Shield className="text-gray-400" size={16} />;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-[9999] backdrop-blur-sm">
      <div className="bg-[#12121a] rounded-3xl border border-white/10 w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl relative">
        
        {/* HEADER */}
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#18181b]">
            <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    Gestão de Equipe
                    {getPlanIcon()}
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                    Plano {plano.toUpperCase()} • {profissionais.length}/{limite} vagas usadas
                </p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X size={24} className="text-gray-400" />
            </button>
        </div>

        {/* CONTEÚDO PRINCIPAL */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#0a0a0f]">
            
            {/* TELA 1: LISTA (GRID DE CARDS) */}
            {view === 'list' && (
                <>
                    <div className="mb-8 bg-[#18181b] p-4 rounded-2xl border border-white/5">
                        <div className="flex justify-between text-xs mb-2 font-bold uppercase tracking-wide">
                            <span className="text-gray-400">Capacidade da Equipe</span>
                            <span className={profissionais.length >= limite ? "text-red-400" : "text-emerald-400"}>
                                {Math.round((profissionais.length / limite) * 100)}% Ocupado
                            </span>
                        </div>
                        <div className="h-2 w-full bg-black/50 rounded-full overflow-hidden">
                            <div 
                                className={`h-full transition-all duration-1000 ${profissionais.length >= limite ? 'bg-red-500' : 'bg-gradient-to-r from-blue-500 to-purple-500'}`}
                                style={{ width: `${(profissionais.length / limite) * 100}%` }}
                            ></div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <button 
                            onClick={handleAddClick}
                            className="flex flex-col items-center justify-center min-h-[180px] rounded-2xl border-2 border-dashed border-white/10 hover:border-purple-500 hover:bg-purple-500/5 transition-all group gap-3 animate-in fade-in"
                        >
                            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-purple-500 group-hover:text-white transition-colors">
                                <Plus size={24} />
                            </div>
                            <span className="text-sm font-bold text-gray-400 group-hover:text-purple-400">Adicionar Membro</span>
                        </button>

                        {profissionais.map(pro => (
                            <div key={pro.id} className="relative p-5 bg-[#1a1a24] border border-white/5 rounded-2xl group hover:border-white/20 transition-all flex flex-col gap-4 animate-in slide-in-from-bottom-2 shadow-lg">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-800 to-black flex items-center justify-center border border-white/10 shrink-0 text-gray-400 font-bold text-lg">
                                        {pro.nome.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0 pt-1">
                                        <h3 className="font-bold text-white truncate text-lg flex items-center gap-2">
                                            {pro.nome}
                                            {pro.is_assistente && (
                                                <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-gray-300 font-normal">Assistente</span>
                                            )}
                                        </h3>
                                        <p className="text-xs text-gray-400 uppercase tracking-wide font-bold">{pro.especialidade}</p>
                                    </div>
                                </div>

                                {/* EXIBIÇÃO DE COMISSÃO NO CARD DA LISTA */}
                                <div className="flex flex-wrap gap-2">
                                    {pro.taxa_comissao_padrao > 0 && (
                                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/10 flex items-center gap-1">
                                            <Percent size={10} /> {pro.taxa_comissao_padrao}% Com. Base
                                        </span>
                                    )}
                                    {pro.valor_comissao_fixa > 0 && (
                                        <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-1 rounded-md border border-blue-500/10 flex items-center gap-1">
                                            <DollarSign size={10} /> R$ {pro.valor_comissao_fixa} Fixo
                                        </span>
                                    )}
                                    {/* Etiqueta de exceções */}
                                    {pro.excecoes_comissao && pro.excecoes_comissao.length > 0 && (
                                        <span className="text-[10px] font-bold text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded-md border border-yellow-500/10 flex items-center gap-1">
                                            <Scissors size={10} /> {pro.excecoes_comissao.length} Exceções
                                        </span>
                                    )}
                                </div>

                                {pro.skills && pro.skills.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5">
                                        {pro.skills.map((skill, idx) => (
                                            <span key={idx} className="text-[10px] font-medium text-purple-300 bg-purple-500/10 px-2 py-1 rounded-md border border-purple-500/10">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                <div className="mt-auto border-t border-white/5 pt-3 flex flex-col gap-1">
                                    {pro.email && <p className="text-xs text-gray-500 truncate flex items-center gap-2"><Mail size={12} /> {pro.email}</p>}
                                    {pro.telefone && <p className="text-xs text-gray-500 truncate flex items-center gap-2"><Phone size={12} /> {pro.telefone}</p>}
                                </div>

                                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-[#18181b]/90 backdrop-blur-sm p-1 rounded-lg border border-white/5 shadow-xl">
                                    <button onClick={() => handleEditClick(pro)} className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"><Pencil size={16} /></button>
                                    <button onClick={() => deletarProfissional(pro.id, pro.nome)} className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 size={16} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* TELA 2: FORMULÁRIO (LISTA LIMPA) */}
            {view === 'form' && (
                <div className="max-w-md mx-auto animate-in slide-in-from-right-4 pb-10">
                    <h3 className="text-2xl font-bold text-white mb-1">{editingId ? 'Editar Profissional' : 'Novo Profissional'}</h3>
                    <p className="text-gray-400 text-sm mb-8">Preencha os dados e qualificações.</p>
                    
                    <div className="space-y-5">
                        {/* DADOS BÁSICOS */}
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1 block">Nome Completo</label>
                            <div className="relative">
                                <User className="absolute left-3 top-3.5 text-gray-500" size={18} />
                                <input className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:border-purple-500 outline-none transition-all" 
                                    placeholder="Ex: Ana Silva" value={novoNome} onChange={e => setNovoNome(e.target.value)} />
                            </div>
                        </div>
                        
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1 block">Cargo Principal</label>
                            <div className="relative">
                                <Briefcase className="absolute left-3 top-3.5 text-gray-500" size={18} />
                                <input className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:border-purple-500 outline-none transition-all" 
                                    placeholder="Ex: Cabeleireiro(a)" value={novoCargo} onChange={e => setNovoCargo(e.target.value)} />
                            </div>
                        </div>

                        {/* --- O NOVO BOTÃO ELEGANTE DE COMISSÕES --- */}
                        <div className="mt-4 p-4 bg-purple-900/10 border border-purple-500/20 rounded-xl flex items-center justify-between shadow-inner">
                            <div>
                                <h4 className="text-sm font-bold text-white block">Regras de Comissão</h4>
                                <span className="text-[10px] text-gray-500">
                                    {(comissaoPadrao || comissaoFixa || excecoesComissao.length > 0) ? '✅ Regras configuradas' : '⚠️ Nenhuma regra definida'}
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowComissaoModal(true)}
                                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg font-bold text-xs transition-all shadow-lg shadow-purple-900/20"
                            >
                                <Settings size={14} /> Configurar
                            </button>
                        </div>

                        {/* --- BLOCO DE ASSISTENTE --- */}
                        <div className="mt-4 p-4 bg-black/20 rounded-xl border border-white/10 flex items-center justify-between">
                          <div>
                            <label className="text-sm font-bold text-white block">É uma assistente?</label>
                            <span className="text-[10px] text-gray-500">Vincular a outro profissional</span>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={isAssistente}
                              onChange={() => setIsAssistente(!isAssistente)}
                            />
                            <div className="w-11 h-6 bg-black border border-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600 peer-checked:border-purple-600"></div>
                          </label>
                        </div>

                        {isAssistente && (
                          <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                            <label className="text-xs text-purple-400 uppercase font-bold ml-1 block mb-1">Profissional Responsável</label>
                            <select 
                              className="w-full bg-black/40 border border-purple-500/30 rounded-xl p-3 text-white focus:border-purple-500 outline-none transition-colors appearance-none"
                              value={profissionalPrincipalId}
                              onChange={e => setProfissionalPrincipalId(e.target.value)}
                            >
                              <option value="" disabled className="text-gray-500">Selecione a qual profissional ela responde...</option>
                              {profissionais
                                .filter(p => !p.is_assistente && p.id !== editingId)
                                .map(p => (
                                  <option key={p.id} value={p.id}>{p.nome}</option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* --- QUALIFICAÇÕES (TAGS) --- */}
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1 block">Especialidades (Tags)</label>
                            <div className="bg-black/20 border border-white/10 rounded-xl p-3">
                                <div className="flex gap-2 mb-3">
                                    <div className="relative flex-1">
                                        <Tag className="absolute left-3 top-3 text-gray-500" size={16} />
                                        <input 
                                            className="w-full bg-white/5 border border-white/5 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:border-purple-500 outline-none"
                                            placeholder="Ex: Mechas, Corte Masculino..."
                                            value={inputQualificacao}
                                            onChange={e => setInputQualificacao(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                        />
                                    </div>
                                    <button 
                                        onClick={adicionarTag}
                                        className="bg-white/10 hover:bg-purple-600 hover:text-white text-gray-400 p-2 rounded-lg transition-colors"
                                    >
                                        <Plus size={20} />
                                    </button>
                                </div>
                                
                                <div className="flex flex-wrap gap-2">
                                    {qualificacoes.length === 0 && <span className="text-xs text-gray-600 italic px-1">Nenhuma especialidade adicionada.</span>}
                                    {qualificacoes.map((tag, index) => (
                                        <span key={index} className="flex items-center gap-1.5 bg-purple-500/20 text-purple-300 text-xs font-medium px-3 py-1.5 rounded-lg border border-purple-500/20 animate-in zoom-in">
                                            {tag}
                                            <button onClick={() => removerTag(tag)} className="hover:text-white"><X size={12} /></button>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* CONTATOS */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1 block">E-mail</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3.5 text-gray-500" size={18} />
                                    <input className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:border-purple-500 outline-none transition-all text-sm" 
                                        placeholder="email@..." value={novoEmail} onChange={e => setNovoEmail(e.target.value)} />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1 block">Telefone</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-3.5 text-gray-500" size={18} />
                                    <input className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:border-purple-500 outline-none transition-all text-sm" 
                                        placeholder="(00) 0..." value={novoTelefone} onChange={e => setNovoTelefone(e.target.value)} />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-6">
                            <button onClick={() => { resetForm(); setView('list'); }} className="flex-1 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold transition-all">Cancelar</button>
                            <button 
                                onClick={salvarProfissional} 
                                disabled={saving}
                                className="flex-1 py-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold shadow-lg shadow-purple-900/20 transition-all flex justify-center items-center gap-2"
                            >
                                {saving ? <Loader2 className="animate-spin" /> : (editingId ? 'Salvar Alterações' : 'Cadastrar Membro')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* ====================================================================== */}
        {/* SUB-MODAL DE COMISSÕES (COM AS EXCEÇÕES FUNCIONANDO) */}
        {/* ====================================================================== */}
        {showComissaoModal && (
            <div className="absolute inset-0 bg-[#0a0a0f]/95 z-50 rounded-3xl backdrop-blur-md animate-in slide-in-from-bottom-8 flex flex-col">
                {/* Header do Sub-Modal */}
                <div className="p-6 border-b border-white/5 flex items-center gap-4 bg-[#18181b] rounded-t-3xl">
                    <button onClick={() => setShowComissaoModal(false)} className="p-2 hover:bg-white/5 rounded-full text-gray-400 transition-colors">
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">Regras de Comissionamento</h2>
                        <p className="text-xs text-gray-400">Configure como {novoNome || 'este profissional'} recebe.</p>
                    </div>
                </div>

                <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                    <div className="max-w-md mx-auto space-y-8 pb-10">
                        
                        {/* 1. REGRA PADRÃO */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
                                <DollarSign size={16} /> Regra Padrão (Base)
                            </h3>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                Se um serviço não tiver uma comissão específica, o sistema usará estes valores para calcular o pagamento.
                            </p>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase mb-2 block">Comissão Geral (%)</label>
                                    <div className="relative">
                                        <Percent className="absolute left-3 top-3.5 text-gray-500" size={16} />
                                        <input 
                                            type="number"
                                            className="w-full bg-black/40 border border-white/10 rounded-lg pl-9 pr-4 py-2.5 text-white focus:border-purple-500 outline-none transition-all font-bold" 
                                            placeholder="Ex: 50" 
                                            value={comissaoPadrao} 
                                            onChange={e => setComissaoPadrao(e.target.value)} 
                                        />
                                    </div>
                                </div>
                                <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase mb-2 block">Fixo por Serviço (R$)</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-3.5 text-gray-500" size={16} />
                                        <input 
                                            type="number"
                                            className="w-full bg-black/40 border border-white/10 rounded-lg pl-9 pr-4 py-2.5 text-white focus:border-purple-500 outline-none transition-all font-bold" 
                                            placeholder="Ex: 15.00" 
                                            value={comissaoFixa} 
                                            onChange={e => setComissaoFixa(e.target.value)} 
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <hr className="border-white/5" />

                        {/* 2. EXCEÇÕES POR SERVIÇO (AGORA FUNCIONANDO!) */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-sm font-bold text-gray-100 uppercase tracking-wider flex items-center gap-2">
                                    <Scissors size={16} className="text-yellow-500" /> Exceções por Serviço
                                </h3>
                            </div>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                Configure comissões diferentes para serviços específicos (Ex: Progressiva paga apenas 30%).
                            </p>
                            
                            <div className="space-y-3">
                                {excecoesComissao.map((exc, index) => (
                                    <div key={index} className="flex items-center gap-2 bg-[#1a1a24] p-3 rounded-xl border border-white/10 animate-in fade-in">
                                        
                                        {/* NOME DO SERVIÇO */}
                                        <div className="flex-1">
                                            <input 
                                                type="text" 
                                                placeholder="Qual serviço? (Ex: Mechas)" 
                                                className="w-full bg-black/30 border border-white/5 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 outline-none"
                                                value={exc.servico}
                                                onChange={e => updateExcecao(index, 'servico', e.target.value)}
                                            />
                                        </div>

                                        {/* TIPO (% OU R$) */}
                                        <select 
                                            className="bg-black/30 border border-white/5 rounded-lg px-2 py-2 text-sm text-gray-300 focus:border-purple-500 outline-none appearance-none"
                                            value={exc.tipo}
                                            onChange={e => updateExcecao(index, 'tipo', e.target.value)}
                                        >
                                            <option value="porcentagem">%</option>
                                            <option value="fixo">R$</option>
                                        </select>

                                        {/* VALOR DA EXCEÇÃO */}
                                        <div className="w-20">
                                            <input 
                                                type="number" 
                                                placeholder="Valor" 
                                                className="w-full bg-black/30 border border-white/5 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 outline-none font-bold"
                                                value={exc.valor}
                                                onChange={e => updateExcecao(index, 'valor', e.target.value)}
                                            />
                                        </div>

                                        {/* BOTÃO DE APAGAR */}
                                        <button 
                                            onClick={() => removeExcecao(index)}
                                            className="text-gray-500 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}

                                {/* BOTÃO DE ADICIONAR NOVA REGRA */}
                                <button 
                                    onClick={addExcecao}
                                    className="w-full py-3 rounded-xl border border-dashed border-white/10 hover:border-purple-500 hover:bg-purple-500/5 text-purple-400 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all mt-2"
                                >
                                    <Plus size={16} /> Adicionar regra específica
                                </button>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Footer do Sub-Modal */}
                <div className="p-6 border-t border-white/5 bg-[#18181b] rounded-b-3xl">
                    <button 
                        onClick={() => setShowComissaoModal(false)}
                        className="w-full py-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold shadow-lg shadow-purple-900/20 transition-all text-sm uppercase tracking-wider"
                    >
                        Concluir e Voltar
                    </button>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};