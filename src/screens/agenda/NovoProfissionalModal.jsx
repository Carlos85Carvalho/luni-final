import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { User, Plus, Trash2, Shield, Star, Crown, X, Mail, Phone, Briefcase, Pencil, Loader2, Tag } from 'lucide-react';

export const NovoProfissionalModal = ({ isOpen, onClose, salaoId }) => {
  const [profissionais, setProfissionais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [limite, setLimite] = useState(1);
  const [plano, setPlano] = useState('starter');
  
  // Controle de Telas
  const [view, setView] = useState('list'); 
  const [editingId, setEditingId] = useState(null);

  // Formulário
  const [novoNome, setNovoNome] = useState('');
  const [novoCargo, setNovoCargo] = useState('');
  const [novoEmail, setNovoEmail] = useState('');
  const [novoTelefone, setNovoTelefone] = useState('');
  
  // --- NOVO: ESTADOS PARA QUALIFICAÇÕES ---
  const [qualificacoes, setQualificacoes] = useState([]); // Lista de tags
  const [inputQualificacao, setInputQualificacao] = useState(''); // O que está sendo digitado

  // Busca dados sempre que o modal abre
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
    setQualificacoes([]); // Limpa as tags
    setInputQualificacao('');
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

  // --- LÓGICA DAS TAGS ---
  const adicionarTag = (e) => {
    e.preventDefault(); // Evita recarregar se estiver num form
    if (!inputQualificacao.trim()) return;
    
    // Adiciona apenas se não existir ainda
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
  // -----------------------

  const handleEditClick = (pro) => {
    setEditingId(pro.id);
    setNovoNome(pro.nome);
    setNovoCargo(pro.especialidade);
    setNovoEmail(pro.email || '');
    setNovoTelefone(pro.telefone || '');
    // Se o banco retornar null, garante array vazio
    setQualificacoes(Array.isArray(pro.skills) ? pro.skills : []); 
    setView('form');
  };

  const salvarProfissional = async () => {
    if (!novoNome) return alert("O nome é obrigatório!");
    
    setSaving(true);

    const payload = {
        nome: novoNome,
        especialidade: novoCargo || 'Geral',
        email: novoEmail,
        telefone: novoTelefone,
        salao_id: salaoId,
        ativo: true,
        skills: qualificacoes // Salva o array de tags no banco (Coluna 'skills' JSONB)
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
      <div className="bg-[#12121a] rounded-3xl border border-white/10 w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        
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

        {/* CONTEÚDO */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#0a0a0f]">
            
            {/* TELA 1: LISTA (GRID DE CARDS) */}
            {view === 'list' && (
                <>
                    {/* Barra de Progresso */}
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
                        {/* Botão ADD */}
                        <button 
                            onClick={handleAddClick}
                            className="flex flex-col items-center justify-center min-h-[180px] rounded-2xl border-2 border-dashed border-white/10 hover:border-purple-500 hover:bg-purple-500/5 transition-all group gap-3 animate-in fade-in"
                        >
                            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-purple-500 group-hover:text-white transition-colors">
                                <Plus size={24} />
                            </div>
                            <span className="text-sm font-bold text-gray-400 group-hover:text-purple-400">Adicionar Membro</span>
                        </button>

                        {/* Cards dos Profissionais */}
                        {profissionais.map(pro => (
                            <div key={pro.id} className="relative p-5 bg-[#18181b] border border-white/5 rounded-2xl group hover:border-white/20 transition-all flex flex-col gap-4 animate-in slide-in-from-bottom-2">
                                
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-800 to-black flex items-center justify-center border border-white/10 shrink-0 text-gray-400 font-bold text-lg">
                                        {pro.nome.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0 pt-1">
                                        <h3 className="font-bold text-white truncate text-lg">{pro.nome}</h3>
                                        <p className="text-xs text-gray-400 uppercase tracking-wide font-bold">{pro.especialidade}</p>
                                    </div>
                                </div>

                                {/* LISTA DE TAGS NO CARD */}
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

                                {/* Botões Hover */}
                                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-[#18181b]/90 backdrop-blur-sm p-1 rounded-lg border border-white/5 shadow-xl">
                                    <button onClick={() => handleEditClick(pro)} className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"><Pencil size={16} /></button>
                                    <button onClick={() => deletarProfissional(pro.id, pro.nome)} className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 size={16} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* TELA 2: FORMULÁRIO */}
            {view === 'form' && (
                <div className="max-w-md mx-auto animate-in slide-in-from-right-4">
                    <h3 className="text-2xl font-bold text-white mb-1">{editingId ? 'Editar Profissional' : 'Novo Profissional'}</h3>
                    <p className="text-gray-400 text-sm mb-8">Preencha os dados e qualificações.</p>
                    
                    <div className="space-y-5">
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

                        {/* --- CAMPO DE QUALIFICAÇÕES (TAGS) --- */}
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
                                
                                {/* Lista de Tags Adicionadas */}
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
                        {/* ------------------------------------- */}

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
                                {saving ? <Loader2 className="animate-spin" /> : (editingId ? 'Salvar Alterações' : 'Cadastrar')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* TELA 3: UPGRADE */}
            {view === 'upgrade' && (
                <div className="flex flex-col items-center justify-center h-full text-center animate-in zoom-in-95">
                    <div className="w-24 h-24 bg-gradient-to-tr from-yellow-600 to-yellow-400 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-yellow-900/30">
                        <Crown size={48} className="text-white" />
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-2">Limite Atingido</h3>
                    <p className="text-gray-400 max-w-md mb-8">
                        Seu plano atual permite apenas <strong>{limite} profissionais</strong>. Faça um upgrade para adicionar mais membros.
                    </p>
                    <button className="px-8 py-4 bg-white text-black font-bold rounded-xl hover:scale-105 transition-transform">
                        Ver Planos
                    </button>
                    <button onClick={() => setView('list')} className="mt-6 text-gray-500 hover:text-white text-sm">
                        Voltar
                    </button>
                </div>
            )}

        </div>
      </div>
    </div>
  );
};