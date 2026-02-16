import React, { useState, useEffect } from 'react';
import { supabase } from '../../../services/supabase';
import { 
  Scissors, Plus, Clock, DollarSign, Trash2, Sparkles, Zap, Loader2, 
  Hourglass, FolderPlus, Tag, Palette, Droplet, Search, Menu, X
} from 'lucide-react';

// --- CATEGORIAS DO SALÃO BEAUTY HAIR ---
const CATEGORIAS_INICIAIS = [
  { id: 'cabelo', label: 'Cabelos & Corte', icon: Scissors },
  { id: 'quimica', label: 'Química & Cor', icon: Palette },
  { id: 'tratamentos', label: 'Tratamentos', icon: Droplet },
  { id: 'unhas', label: 'Manicure & Pedicure', icon: Sparkles },
  { id: 'cilios', label: 'Cílios & Sobrancelhas', icon: Zap },
  { id: 'depilacao', label: 'Depilação', icon: Scissors },
  { id: 'makeup', label: 'Maquiagem', icon: Sparkles },
  { id: 'estetica', label: 'Estética/Spa', icon: Sparkles },
];

// --- LISTA MESTRA (BEAUTY HAIR) ---
const SERVICOS_PADRAO = [
  { nome: "Corte Feminino", preco: 60, duracao: "40", categoria: "cabelo" },
  { nome: "Corte Masculino", preco: 40, duracao: "30", categoria: "cabelo" },
  { nome: "Corte Infantil", preco: 40, duracao: "30", categoria: "cabelo" },
  { nome: "Franja", preco: 20, duracao: "15", categoria: "cabelo" },
  { nome: "Bordado", preco: 70, duracao: "60", categoria: "cabelo" },
  { nome: "Escova Tradicional", preco: 40, duracao: "45", categoria: "cabelo" },
  { nome: "Escova Modelada", preco: 50, duracao: "60", categoria: "cabelo" },
  { nome: "Penteado Elaborado", preco: 140, duracao: "90", categoria: "cabelo" },
  { nome: "Mechas", preco: 220, duracao: "3:30", pausa: 45, categoria: "quimica" },
  { nome: "Morena Iluminada", preco: 350, duracao: "4:30", pausa: 60, categoria: "quimica" },
  { nome: "Progressiva", preco: 180, duracao: "3:00", pausa: 40, categoria: "quimica" },
  { nome: "Botox Capilar", preco: 160, duracao: "2:30", pausa: 30, categoria: "quimica" },
  { nome: "Tintura Global", preco: 90, duracao: "1:30", pausa: 30, categoria: "quimica" },
  { nome: "Hidratação", preco: 40, duracao: "45", categoria: "tratamentos" },
  { nome: "Cronograma Capilar", preco: 120, duracao: "1:00", categoria: "tratamentos" },
  { nome: "Manicure Simples", preco: 25, duracao: "30", categoria: "unhas" },
  { nome: "Pedicure Simples", preco: 35, duracao: "40", categoria: "unhas" },
  { nome: "Alongamento em Gel", preco: 120, duracao: "2:00", categoria: "unhas" },
  { nome: "Fibra de Vidro", preco: 150, duracao: "2:30", categoria: "unhas" },
  { nome: "Design com Henna", preco: 40, duracao: "30", categoria: "cilios" },
  { nome: "Brow Lamination", preco: 90, duracao: "1:00", categoria: "cilios" },
  { nome: "Volume Russo", preco: 150, duracao: "2:00", categoria: "cilios" },
  { nome: "Buço", preco: 15, duracao: "10", categoria: "depilacao" },
  { nome: "Axila", preco: 20, duracao: "15", categoria: "depilacao" },
  { nome: "Virilha Completa", preco: 45, duracao: "45", categoria: "depilacao" },
  { nome: "Maquiagem Social", preco: 100, duracao: "1:00", categoria: "makeup" },
  { nome: "Maquiagem Noiva", preco: 250, duracao: "2:00", categoria: "makeup" },
  { nome: "Limpeza de Pele", preco: 120, duracao: "1:30", categoria: "estetica" },
  { nome: "Massagem Relaxante", preco: 90, duracao: "1:00", categoria: "estetica" }
];

export const GestaoServicos = () => {
  const [loading, setLoading] = useState(true);
  const [servicos, setServicos] = useState([]);
  const [categorias, setCategorias] = useState(CATEGORIAS_INICIAIS);
  const [categoriaAtiva, setCategoriaAtiva] = useState('cabelo');
  const [showForm, setShowForm] = useState(false);
  const [novoServico, setNovoServico] = useState({ nome: '', preco: '', duracao: '', pausa: '0' });
  const [novaCategoriaNome, setNovaCategoriaNome] = useState('');
  const [showInputCategoria, setShowInputCategoria] = useState(false);
  const [menuAberto, setMenuAberto] = useState(false);
  
  // Controle do botão de pausa no formulário
  const [habilitarPausa, setHabilitarPausa] = useState(false);

  useEffect(() => { fetchServicos(); }, []);

  const fetchServicos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('servicos').select('*').order('nome');
      if (error) throw error;
      setServicos(data || []);

      const categoriasExistentes = new Set(categorias.map(c => c.id));
      const novasCats = [];
      (data || []).forEach(s => {
        const cat = s.categoria.toLowerCase();
        if (!categoriasExistentes.has(cat)) {
            novasCats.push({ id: cat, label: s.categoria.toUpperCase(), icon: Tag });
            categoriasExistentes.add(cat);
        }
      });
      if (novasCats.length > 0) setCategorias(prev => [...prev, ...novasCats]);
    } catch (error) { console.error('Erro:', error); } 
    finally { setLoading(false); }
  };

  const salvarAlteracao = async (id, campo, valor) => {
    const novos = servicos.map(s => s.id === id ? { ...s, [campo]: valor } : s);
    setServicos(novos);
    await supabase.from('servicos').update({ [campo]: valor }).eq('id', id);
  };

  const adicionarServico = async () => {
    if (!novoServico.nome || !novoServico.preco) return alert("Preencha nome e preço!");
    try {
        const { data: { user } } = await supabase.auth.getUser();
        let salaoId = null;
        if(user) {
            const { data } = await supabase.from('usuarios').select('salao_id').eq('id', user.id).maybeSingle();
            salaoId = data?.salao_id;
        }

        const { error } = await supabase.from('servicos').insert([{
            ...novoServico,
            pausa: habilitarPausa ? novoServico.pausa : 0,
            categoria: categoriaAtiva,
            salao_id: salaoId
        }]);
        if (error) throw error;
        
        fetchServicos();
        setShowForm(false);
        setHabilitarPausa(false);
        setNovoServico({ nome: '', preco: '', duracao: '', pausa: '0' });
    } catch (error) { alert(error.message); }
  };

  const deletarServico = async (id) => {
    if (confirm("Excluir serviço?")) {
        await supabase.from('servicos').delete().eq('id', id);
        setServicos(servicos.filter(s => s.id !== id));
    }
  };

  const criarNovaCategoria = () => {
    if (!novaCategoriaNome.trim()) return setShowInputCategoria(false);
    const id = novaCategoriaNome.toLowerCase().replace(/ /g, '_');
    setCategorias([...categorias, { id, label: novaCategoriaNome, icon: FolderPlus }]);
    setCategoriaAtiva(id);
    setNovaCategoriaNome('');
    setShowInputCategoria(false);
    setMenuAberto(false);
  };

  const selecionarCategoria = (catId) => {
    setCategoriaAtiva(catId);
    setMenuAberto(false);
  };

  const servicosFiltrados = servicos.filter(s => s.categoria === categoriaAtiva);

  return (
    <div className="text-white min-h-[calc(100vh-100px)] p-2 md:p-6 rounded-3xl animate-in fade-in duration-500">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 gap-6 border-b border-white/5 pb-6">
        <div>
            <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                Catálogo de Serviços
            </h2>
            <p className="text-gray-400 text-sm">
                Gerencie preços, duração e tempos de pausa de cada procedimento.
            </p>
        </div>
        
        <button 
          onClick={() => setShowForm(true)} 
          className="w-full md:w-auto px-5 py-2.5 rounded-xl text-sm font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/20 transition-all flex items-center justify-center gap-2 active:scale-95"
        >
          <Plus size={18} /> Novo Serviço
        </button>
      </div>

      {/* --- BOTÃO HAMBÚRGUER (MOBILE) + CATEGORIA ATIVA --- */}
      <div className="flex items-center gap-3 mb-6 md:hidden">
        <button 
          onClick={() => setMenuAberto(!menuAberto)}
          className="p-3 rounded-xl bg-[#18181b] border border-white/10 hover:border-purple-500/40 transition-all"
        >
          {menuAberto ? <X size={20} /> : <Menu size={20} />}
        </button>
        
        <div className="flex-1 px-4 py-2.5 rounded-xl bg-white text-black border border-white flex items-center gap-2 shadow-md">
          {(() => {
            const Icon = categorias.find(c => c.id === categoriaAtiva)?.icon || Tag;
            return <Icon size={16} className="text-purple-600" />;
          })()}
          <span className="text-sm font-medium">
            {categorias.find(c => c.id === categoriaAtiva)?.label}
          </span>
        </div>
      </div>

      {/* --- MENU HAMBÚRGUER (MOBILE) --- */}
      {menuAberto && (
        <div className="md:hidden mb-6 bg-[#18181b] border border-white/10 rounded-2xl overflow-hidden animate-in slide-in-from-top-4">
          <div className="p-2 space-y-1">
            {categorias.map(cat => {
              const Icon = cat.icon || Tag;
              const isActive = categoriaAtiva === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => selecionarCategoria(cat.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive 
                    ? 'bg-purple-600 text-white' 
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon size={16} />
                  {cat.label}
                </button>
              );
            })}
            
            {showInputCategoria ? (
              <div className="flex items-center bg-black/30 rounded-xl border border-purple-500 overflow-hidden">
                <input 
                  autoFocus 
                  className="bg-transparent text-white px-4 py-3 flex-1 outline-none text-sm" 
                  placeholder="Nova categoria..."
                  value={novaCategoriaNome} 
                  onChange={e => setNovaCategoriaNome(e.target.value)} 
                  onKeyDown={e => e.key === 'Enter' && criarNovaCategoria()} 
                />
                <button onClick={criarNovaCategoria} className="px-3 hover:text-purple-400">
                  <Plus size={16}/>
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setShowInputCategoria(true)} 
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-500 hover:text-purple-400 hover:bg-white/5 transition-all"
              >
                <Plus size={16} />
                Nova Categoria
              </button>
            )}
          </div>
        </div>
      )}

      {/* --- ABAS DE CATEGORIA (DESKTOP) --- */}
      <div className="hidden md:flex gap-2 overflow-x-auto pb-2 mb-8 scrollbar-hide">
        {categorias.map(cat => {
            const Icon = cat.icon || Tag;
            const isActive = categoriaAtiva === cat.id;
            return (
                <button
                    key={cat.id}
                    onClick={() => setCategoriaAtiva(cat.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap border ${
                        isActive 
                        ? 'bg-white text-black border-white shadow-md transform scale-105' 
                        : 'bg-[#18181b] text-gray-400 border-white/5 hover:border-white/20 hover:text-gray-200'
                    }`}
                >
                    <Icon size={16} className={isActive ? "text-purple-600" : ""} />
                    {cat.label}
                </button>
            )
        })}
        {showInputCategoria ? (
            <div className="flex items-center bg-[#18181b] rounded-xl border border-purple-500 overflow-hidden h-[42px]">
                <input autoFocus className="bg-transparent text-white px-3 w-28 outline-none text-xs" placeholder="Nova aba..."
                    value={novaCategoriaNome} onChange={e => setNovaCategoriaNome(e.target.value)} onKeyDown={e => e.key === 'Enter' && criarNovaCategoria()} />
                <button onClick={criarNovaCategoria} className="px-2 hover:text-purple-400"><Plus size={14}/></button>
            </div>
        ) : (
            <button onClick={() => setShowInputCategoria(true)} className="px-3 rounded-xl bg-white/5 border border-white/5 text-gray-500 hover:text-purple-400">
                <Plus size={18} />
            </button>
        )}
      </div>

      {/* --- FORMULÁRIO DE NOVO SERVIÇO --- */}
      {showForm && (
        <div className="bg-[#18181b] border border-white/10 p-6 rounded-2xl mb-8 animate-in slide-in-from-top-4 shadow-2xl relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-600"></div>
            <h3 className="text-lg font-bold mb-6 text-white flex items-center gap-2">
                <Plus size={18} className="text-purple-400" /> Adicionar em {categorias.find(c=>c.id===categoriaAtiva)?.label}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-5 items-end">
                <div className="md:col-span-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase mb-1.5 block">Nome do Serviço</label>
                    <input className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500 transition-colors" 
                        placeholder="Ex: Corte Bordado" value={novoServico.nome} onChange={e => setNovoServico({...novoServico, nome: e.target.value})} />
                </div>
                <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase mb-1.5 block">Preço (R$)</label>
                    <input type="number" className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white outline-none" 
                        placeholder="0.00" value={novoServico.preco} onChange={e => setNovoServico({...novoServico, preco: e.target.value})} />
                </div>
                <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase mb-1.5 block">Duração</label>
                    <input className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500" 
                        placeholder="Ex: 1:30" value={novoServico.duracao} onChange={e => setNovoServico({...novoServico, duracao: e.target.value})} />
                </div>
                <div className="flex flex-col gap-2">
                    <button 
                      onClick={() => setHabilitarPausa(!habilitarPausa)}
                      className={`flex items-center justify-center gap-2 h-[46px] rounded-xl border text-[10px] font-bold uppercase transition-all ${habilitarPausa ? 'bg-amber-500/20 border-amber-500 text-amber-500' : 'bg-white/5 border-white/10 text-gray-500'}`}
                    >
                      <Hourglass size={14}/> {habilitarPausa ? 'Com Pausa' : 'Tem Pausa?'}
                    </button>
                    {habilitarPausa && (
                      <input type="number" className="w-full bg-black/30 border border-amber-500/50 rounded-xl px-4 py-2 text-white text-xs outline-none animate-in fade-in" 
                        placeholder="Minutos de pausa" value={novoServico.pausa} onChange={e => setNovoServico({...novoServico, pausa: e.target.value})} />
                    )}
                </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/5">
                <button onClick={() => setShowForm(false)} className="px-6 py-2.5 rounded-xl text-gray-400 hover:text-white font-bold hover:bg-white/5 transition-all">Cancelar</button>
                <button onClick={adicionarServico} className="bg-purple-600 hover:bg-purple-500 text-white px-8 py-2.5 rounded-xl font-bold shadow-lg active:scale-95 transition-all">Salvar Serviço</button>
            </div>
        </div>
      )}

      {/* --- LISTA DE SERVIÇOS (GRID RESPONSIVO) --- */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 opacity-50">
            <Loader2 className="animate-spin text-purple-500 mb-2" size={40}/>
            <p className="text-sm">Carregando catálogo...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {servicosFiltrados.length === 0 && (
                <div className="col-span-full py-20 text-center bg-[#121216]/50 rounded-3xl border border-dashed border-white/10 flex flex-col items-center justify-center group">
                    <Tag size={40} className="text-gray-600 mb-4"/>
                    <h3 className="text-lg font-bold text-white mb-1">Esta categoria está vazia</h3>
                    <button onClick={() => setShowForm(true)} className="text-purple-400 hover:text-purple-300 font-bold hover:underline">+ Adicionar primeiro serviço</button>
                </div>
            )}

            {servicosFiltrados.map(servico => (
                <div key={servico.id} className="bg-[#18181b] border border-white/5 p-4 md:p-5 rounded-2xl hover:border-purple-500/40 transition-all duration-300 group relative">
                    <div className="flex justify-between items-start mb-3">
                        <input className="bg-transparent text-lg font-bold text-white w-full outline-none focus:text-purple-400 transition-colors truncate pr-2 border-b border-transparent focus:border-purple-500/50"
                            value={servico.nome} onChange={(e) => salvarAlteracao(servico.id, 'nome', e.target.value)} />
                        <button onClick={() => deletarServico(servico.id)} className="text-gray-600 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16} /></button>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                        <div className="flex-1 bg-black/40 rounded-lg p-2 flex items-center gap-2 border border-white/5 focus-within:border-emerald-500/50 h-10">
                            <span className="text-emerald-500 font-bold text-xs">R$</span>
                            <input type="number" className="bg-transparent w-full text-sm text-white font-bold outline-none"
                                value={servico.preco} onChange={(e) => salvarAlteracao(servico.id, 'preco', e.target.value)} />
                        </div>
                        <div className="w-24 bg-black/40 rounded-lg p-2 flex items-center gap-1 border border-white/5 focus-within:border-blue-500/50 h-10">
                            <Clock size={14} className="text-blue-500" />
                            <input className="bg-transparent w-full text-xs text-gray-300 font-medium outline-none text-center"
                                value={servico.duracao} onChange={(e) => salvarAlteracao(servico.id, 'duracao', e.target.value)} />
                        </div>
                    </div>

                    {(servico.pausa > 0 || servico.categoria === 'quimica') && (
                        <div className="mt-3 pt-2 border-t border-white/5 flex items-center gap-2 animate-in fade-in">
                            <Hourglass size={12} className="text-amber-500" />
                            <span className="text-[10px] text-gray-500 font-bold uppercase">Pausa:</span>
                            <input type="number" className="bg-transparent w-10 text-xs text-amber-400 font-bold outline-none border-b border-white/10 focus:border-amber-500 text-center"
                                value={servico.pausa || 0} onChange={(e) => salvarAlteracao(servico.id, 'pausa', e.target.value)} />
                            <span className="text-[10px] text-gray-600">min</span>
                        </div>
                    )}
                </div>
            ))}
        </div>
      )}
    </div>
  );
};