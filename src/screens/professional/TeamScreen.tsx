import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { User, Plus, Trash2, Shield, Star, Crown, X } from 'lucide-react';

// --- 1. DEFINIÇÃO DOS TIPOS ---
interface Profissional {
  id: number;
  nome: string;
  especialidade: string;
  email?: string;
  telefone?: string;
  salao_id: number;
  ativo: boolean;
}

interface TeamScreenProps {
  onClose: () => void;
}

export const TeamScreen: React.FC<TeamScreenProps> = ({ onClose }) => {
  // --- 2. ESTADOS E LÓGICA ---
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [loading, setLoading] = useState(true);
  const [limite, setLimite] = useState(1);
  const [plano, setPlano] = useState('starter');
  const [showModal, setShowModal] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  
  // Novo Profissional (AGORA COM TODOS OS CAMPOS)
  const [novoNome, setNovoNome] = useState('');
  const [novoCargo, setNovoCargo] = useState('');
  const [novoEmail, setNovoEmail] = useState('');       // Novo
  const [novoTelefone, setNovoTelefone] = useState(''); // Novo

  const SALAO_ID = 1;

  useEffect(() => {
    fetchDados();
  }, []);

  const fetchDados = async () => {
    setLoading(true);
    try {
      const { data: dadosSalao } = await supabase
        .from('saloes')
        .select('limite_profissionais, plano')
        .eq('id', SALAO_ID)
        .single();

      if (dadosSalao) {
        setLimite(dadosSalao.limite_profissionais);
        setPlano(dadosSalao.plano);
      }

      const { data: pros } = await supabase
        .from('profissionais')
        .select('*')
        .eq('salao_id', SALAO_ID);

      setProfissionais((pros as Profissional[]) || []);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClick = () => {
    if (profissionais.length >= limite) {
      setShowUpgrade(true); 
    } else {
      setShowModal(true);
    }
  };

  const salvarProfissional = async () => {
    if (!novoNome) return alert("O nome é obrigatório!");
    
    // Agora enviamos TODOS os dados para o banco
    const { error } = await supabase.from('profissionais').insert({
      nome: novoNome,
      especialidade: novoCargo || 'Geral',
      email: novoEmail,          // Campo essencial para o login futuro
      telefone: novoTelefone,    // Campo útil para contato
      salao_id: SALAO_ID,
      ativo: true
    });

    if (!error) {
      setShowModal(false);
      // Limpa o formulário
      setNovoNome('');
      setNovoCargo('');
      setNovoEmail('');
      setNovoTelefone('');
      fetchDados(); 
    } else {
      alert('Erro ao salvar: ' + error.message);
    }
  };

  const deletarProfissional = async (id: number) => {
    if (confirm('Tem certeza que deseja remover este profissional?')) {
      await supabase.from('profissionais').delete().eq('id', id);
      fetchDados();
    }
  };

  const getPlanIcon = () => {
    if (plano === 'elite') return <Crown className="text-yellow-400" />;
    if (plano === 'business') return <Star className="text-purple-400" />;
    return <Shield className="text-gray-400" />;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6 animate-in fade-in slide-in-from-bottom-4 pb-24">
      
      <div className="max-w-5xl mx-auto"> 
        
        {/* HEADER */}
        <div className="flex justify-between items-center mb-8 pt-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Gestão de Equipe
            </h1>
            <div className="flex items-center gap-2 text-sm text-gray-400 mt-2">
              {getPlanIcon()}
              <span className="uppercase font-bold tracking-wider text-xs bg-white/10 px-2 py-0.5 rounded">
                Plano {plano}
              </span>
              <span className="text-gray-500">•</span>
              <span>{profissionais.length} / {limite} Agendas</span>
            </div>
          </div>
          <button onClick={onClose} className="p-3 bg-white/5 rounded-full hover:bg-white/20 hover:rotate-90 transition-all">
            <X size={24} />
          </button>
        </div>

        {/* PROGRESSO */}
        <div className="mb-10 bg-white/5 p-6 rounded-2xl border border-white/5">
          <div className="flex justify-between text-sm mb-3 font-medium">
            <span className="text-gray-300">Ocupação do Plano</span>
            <span className={profissionais.length >= limite ? "text-red-400" : "text-emerald-400"}>
              {profissionais.length} de {limite} vagas usadas
            </span>
          </div>
          <div className="h-3 w-full bg-black/50 rounded-full overflow-hidden border border-white/5">
            <div 
              className={`h-full transition-all duration-1000 ease-out ${profissionais.length >= limite ? 'bg-red-500' : 'bg-gradient-to-r from-blue-500 to-indigo-500'}`}
              style={{ width: `${(profissionais.length / limite) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* LISTA DE PROFISSIONAIS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <button 
            onClick={handleAddClick}
            className="flex flex-col items-center justify-center min-h-[120px] rounded-2xl border-2 border-dashed border-white/10 hover:border-indigo-500 hover:bg-indigo-500/5 transition-all group gap-3"
          >
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-colors">
              <Plus size={24} />
            </div>
            <span className="text-sm font-bold text-gray-400 group-hover:text-indigo-400">Novo Profissional</span>
          </button>

          {profissionais.map(pro => (
            <div key={pro.id} className="relative flex items-center p-4 bg-[#12121a] border border-white/10 rounded-2xl group hover:border-white/20 transition-all">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gray-800 to-black flex items-center justify-center border border-white/5 shadow-inner">
                <User className="text-gray-400" size={24} />
              </div>
              <div className="ml-4 flex-1">
                <h3 className="font-bold text-lg leading-tight">{pro.nome}</h3>
                <span className="text-xs font-medium text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded mt-1 inline-block">
                  {pro.especialidade || 'ESPECIALISTA'}
                </span>
                {/* Mostra o email se existir */}
                {pro.email && <p className="text-[10px] text-gray-500 mt-1 truncate max-w-[150px]">{pro.email}</p>}
              </div>
              <button onClick={() => deletarProfissional(pro.id)} className="p-2 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>

      </div>

      {/* MODAL DE CADASTRO ATUALIZADO */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[10000] backdrop-blur-sm">
          <div className="bg-[#12121a] p-6 rounded-3xl border border-white/10 w-full max-w-sm shadow-2xl shadow-black/50">
            <h2 className="text-xl font-bold mb-1">Nova Agenda</h2>
            <p className="text-sm text-gray-400 mb-6">Dados do profissional</p>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 uppercase font-bold ml-1">Nome Completo</label>
                <input 
                  type="text" 
                  className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-indigo-500 outline-none transition-colors"
                  value={novoNome}
                  onChange={e => setNovoNome(e.target.value)}
                  placeholder="Ex: Amanda Torres"
                />
              </div>
              
              {/* CAMPO DE E-MAIL ADICIONADO */}
              <div>
                <label className="text-xs text-gray-500 uppercase font-bold ml-1">E-mail de Acesso</label>
                <input 
                  type="email" 
                  className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-indigo-500 outline-none transition-colors"
                  value={novoEmail}
                  onChange={e => setNovoEmail(e.target.value)}
                  placeholder="amanda@salao.com"
                />
              </div>

              {/* CAMPO DE TELEFONE ADICIONADO */}
              <div>
                <label className="text-xs text-gray-500 uppercase font-bold ml-1">Telefone</label>
                <input 
                  type="text" 
                  className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-indigo-500 outline-none transition-colors"
                  value={novoTelefone}
                  onChange={e => setNovoTelefone(e.target.value)}
                  placeholder="(21) 99999-9999"
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 uppercase font-bold ml-1">Especialidade</label>
                <input 
                  type="text" 
                  className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-indigo-500 outline-none transition-colors"
                  value={novoCargo}
                  onChange={e => setNovoCargo(e.target.value)}
                  placeholder="Ex: Cabeleireiro(a)"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button onClick={() => setShowModal(false)} className="flex-1 p-3 rounded-xl bg-white/5 hover:bg-white/10 text-sm font-bold">Cancelar</button>
              <button onClick={salvarProfissional} className="flex-1 p-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-900/20">Salvar Profissional</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE UPGRADE */}
      {showUpgrade && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-[10000] backdrop-blur-md">
          <div className="bg-gradient-to-b from-[#1a1a24] to-[#0f0f13] p-8 rounded-3xl border border-white/10 w-full max-w-sm text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-600 to-yellow-300"></div>
            <div className="w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-yellow-500/20">
              <Crown className="text-yellow-500 w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-white">Limite Atingido</h2>
            <p className="text-gray-400 mb-8 text-sm leading-relaxed">
              O plano <strong>{plano.toUpperCase()}</strong> permite até <strong>{limite} profissionais</strong>. 
              <br/>Libere mais agendas fazendo um upgrade.
            </p>
            <button className="w-full py-4 rounded-xl bg-gradient-to-r from-yellow-600 to-yellow-500 font-bold text-black mb-3 hover:scale-105 transition-transform shadow-lg shadow-yellow-900/20">
              Fazer Upgrade Agora
            </button>
            <button onClick={() => setShowUpgrade(false)} className="text-xs text-gray-500 hover:text-white uppercase tracking-wider font-bold">Voltar</button>
          </div>
        </div>
      )}

    </div>
  );
};