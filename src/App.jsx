import React, { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from './services/supabase'; 
import { 
  Home, Users, Calendar, Plus, UserPlus, CalendarPlus, Wallet, Loader2, LogOut,
  Briefcase, User, Lock, Mail, Store, Phone
} from 'lucide-react';

// --- IMPORTAÇÃO DO NOVO SPLASH ---
import { SplashScreen } from './components/ui/SplashScreen';
// --- IMPORTAÇÃO DO MODAL DE INSTALAÇÃO (PWA) ---
import { InstallAppModal } from './components/ui/InstallAppModal';

// --- IMPORTAÇÕES DE TELAS ---
import { FinanceiroScreen } from './screens/financeiro/FinanceiroScreen.jsx';
import { AgendaScreen } from './screens/agenda/AgendaScreen.jsx';
import { ClientesScreen } from './screens/clientes/ClientesScreen.jsx';
import { DashboardAdmin } from './screens/main/DashboardAdmin.jsx';
import { ProfessionalDashboard } from './screens/professional/ProfessionalDashboard.jsx';

// --- IMPORTAÇÕES DE MODAIS ---
import { NovoAgendamentoModal } from './screens/agenda/NovoAgendamentoModal.jsx';
import { NovoClienteModal } from './screens/agenda/NovoClienteModal.jsx';
import { NovoProfissionalModal } from './screens/agenda/NovoProfissionalModal.jsx';

// --- AUTH CONTEXT ---
const AuthContext = createContext({});
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [profissionalData, setProfissionalData] = useState(null); 
  const [salaoId, setSalaoId] = useState(null);
  const [salaoNome, setSalaoNome] = useState(''); 
  const [loading, setLoading] = useState(true);

  const checkUserRole = async (currentUser) => {
    if (!currentUser) {
      setRole(null);
      setProfissionalData(null);
      setSalaoNome('');
      setLoading(false);
      return;
    }

    try {
      const { data: usuarioLink } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (usuarioLink) {
        setRole(usuarioLink.role);
        setSalaoId(usuarioLink.salao_id);

        if (usuarioLink.salao_id) {
            const { data: salao } = await supabase
                .from('saloes')
                .select('nome')
                .eq('id', usuarioLink.salao_id)
                .maybeSingle();
            if (salao) setSalaoNome(salao.nome);
        }

        if (usuarioLink.role === 'profissional' && usuarioLink.profissional_id) {
          const { data: pro } = await supabase
            .from('profissionais')
            .select('*')
            .eq('id', usuarioLink.profissional_id)
            .single();
          setProfissionalData(pro);
        }
      } else {
        const { data: pro } = await supabase.from('profissionais').select('*').eq('email', currentUser.email).maybeSingle();
        if (pro) {
          setRole('profissional');
          setProfissionalData(pro);
        } else {
          setRole('admin'); 
        }
      }
    } catch (error) {
      console.error("Erro role:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setUser(session?.user ?? null); checkUserRole(session?.user); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => { setUser(session?.user ?? null); checkUserRole(session?.user); });
    return () => subscription.unsubscribe();
  }, []);

  const login = async (email, password) => await supabase.auth.signInWithPassword({ email, password });
  const logout = async () => { setRole(null); setProfissionalData(null); await supabase.auth.signOut(); };

  return <AuthContext.Provider value={{ user, role, profissionalData, salaoId, salaoNome, login, logout, loading }}>{children}</AuthContext.Provider>;
};
const useAuth = () => useContext(AuthContext);

// --- COMPONENTES VISUAIS ---
const MenuIcon = ({ id, icon, label, activeId, onClick }) => {
  const IconComponent = icon; 
  const active = activeId === id;
  return (
    <button onClick={() => onClick(id)} className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-purple-400 scale-110' : 'text-gray-500 hover:text-gray-300'}`}>
      <IconComponent size={24} strokeWidth={active ? 2.5 : 2} />
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
};

// --- TELA DE LOGIN / CADASTRO ---
const LoginScreen = () => { 
  const { login } = useAuth(); 
  const [isLogin, setIsLogin] = useState(true); 
  const [load, setLoad] = useState(false);
  const [email, setEmail] = useState(''); 
  const [pass, setPass] = useState(''); 
  const [confirmPass, setConfirmPass] = useState('');
  const [nomeResponsavel, setNomeResponsavel] = useState('');
  const [nomeSalao, setNomeSalao] = useState('');
  const [telefone, setTelefone] = useState('');

  const handleAuth = async () => {
    if (!email || !pass) return alert("Preencha email e senha.");
    if (!isLogin) {
        if (pass !== confirmPass) return alert("As senhas não conferem!");
        if (pass.length < 6) return alert("A senha deve ter no mínimo 6 caracteres.");
    }
    setLoad(true);
    try {
      if (isLogin) { 
        const { error } = await login(email, pass); 
        if(error) throw error;
      } 
      else { 
        const { data: isPro } = await supabase.from('profissionais').select('*').eq('email', email).maybeSingle();
        if (!isPro) {
            if (!nomeResponsavel || !nomeSalao || !telefone) throw new Error("Preencha todos os dados.");
        }

        const { data: authData, error: authError } = await supabase.auth.signUp({ 
          email, 
          password: pass,
          options: { data: { full_name: isPro ? isPro.nome : nomeResponsavel } }
        }); 
        if (authError) throw authError;
        const userId = authData.user?.id;

        if (isPro) {
            const { error: linkError } = await supabase.from('usuarios').insert([{ id: userId, salao_id: isPro.salao_id, role: 'profissional', profissional_id: isPro.id }]);
            if (linkError) throw new Error("Erro ao vincular: " + linkError.message);
        } else {
            const { data: salaoData, error: dbError } = await supabase.from('saloes').insert([{
                nome: nomeSalao, email, telefone_contato: telefone, nome_responsavel: nomeResponsavel, etapa_cadastro: 'concluido', whatsapp_status: 'aguardando_qr', onboarding_status: 'pendente'
            }]).select().single();
            if (dbError) throw new Error("Erro ao criar salão: " + dbError.message);
            const { error: linkError } = await supabase.from('usuarios').insert([{ id: userId, salao_id: salaoData.id, role: 'admin' }]);
            if (linkError) throw new Error("Erro vínculo: " + linkError.message);
        }
      }
    } catch (error) {
      alert(error.message || "Ocorreu um erro.");
    } finally {
      setLoad(false);
    }
  };
  
  return (
    <div className="h-screen flex flex-col justify-center p-6 text-white font-sans overflow-y-auto" style={{ backgroundColor: '#050505' }}>
      <div className="mb-6 text-center relative z-10 animate-in fade-in slide-in-from-top-4 duration-1000 mt-10">
        <img src="/logo-luni.png" alt="LUNI" className="h-32 mx-auto mb-4 object-contain" />
        <h2 className="text-2xl font-bold mb-1">{isLogin ? 'Bem-vindo!' : 'Criar Conta'}</h2>
        <p className="text-purple-200/50 font-light text-sm">{isLogin ? 'Faça login para continuar' : 'Preencha seus dados'}</p>
      </div>
      <div className="bg-white/5 border border-white/10 p-6 rounded-3xl shadow-xl backdrop-blur-md relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200 mb-10">
        {!isLogin && (
            <>  
                <div className="bg-purple-500/10 border border-purple-500/20 p-3 rounded-xl mb-4 text-xs text-purple-200 text-center">Funcionário? Use o e-mail cadastrado pelo gestor.</div>
                <div className="mb-4 relative">
                    <User className="absolute left-4 top-3.5 text-gray-500" size={20} />
                    <input className="w-full pl-12 p-3 bg-black/20 rounded-xl border border-white/10 outline-none text-white focus:border-purple-500 transition-colors" placeholder="Seu Nome" value={nomeResponsavel} onChange={e=>setNomeResponsavel(e.target.value)} />
                </div>
                <div className="mb-4 relative">
                    <Store className="absolute left-4 top-3.5 text-gray-500" size={20} />
                    <input className="w-full pl-12 p-3 bg-black/20 rounded-xl border border-white/10 outline-none text-white focus:border-purple-500 transition-colors" placeholder="Nome do Salão (Se for dono)" value={nomeSalao} onChange={e=>setNomeSalao(e.target.value)} />
                </div>
                <div className="mb-4 relative">
                    <Phone className="absolute left-4 top-3.5 text-gray-500" size={20} />
                    <input className="w-full pl-12 p-3 bg-black/20 rounded-xl border border-white/10 outline-none text-white focus:border-purple-500 transition-colors" placeholder="Telefone (Se for dono)" value={telefone} onChange={e=>setTelefone(e.target.value)} />
                </div>
            </>
        )}
        <div className="mb-4 relative">
          <Mail className="absolute left-4 top-3.5 text-gray-500" size={20} />
          <input className="w-full pl-12 p-3 bg-black/20 rounded-xl border border-white/10 outline-none text-white focus:border-purple-500 transition-colors" placeholder="E-mail" value={email} onChange={e=>setEmail(e.target.value)} />
        </div>
        <div className="mb-4 relative">
          <Lock className="absolute left-4 top-3.5 text-gray-500" size={20} />
          <input type="password" placeholder="Senha" className="w-full pl-12 p-3 bg-black/20 rounded-xl border border-white/10 outline-none text-white focus:border-purple-500 transition-colors" value={pass} onChange={e=>setPass(e.target.value)} />
        </div>
        {!isLogin && (
            <div className="mb-6 relative">
                <Lock className="absolute left-4 top-3.5 text-gray-500" size={20} />
                <input type="password" placeholder="Confirmar Senha" className={`w-full pl-12 p-3 bg-black/20 rounded-xl border outline-none text-white focus:border-purple-500 transition-colors ${pass && confirmPass && pass !== confirmPass ? 'border-red-500' : 'border-white/10'}`} value={confirmPass} onChange={e=>setConfirmPass(e.target.value)} />
            </div>
        )}
        <button onClick={handleAuth} className="w-full py-3.5 rounded-xl font-bold text-white shadow-lg bg-[#5B2EFF] active:scale-95 transition-all flex justify-center">{load ? <Loader2 className="animate-spin"/> : (isLogin ? 'Entrar' : 'Cadastrar')}</button>
        <p className="text-center mt-6 text-sm text-gray-400">
          <button onClick={() => { setIsLogin(!isLogin); }} className="font-medium text-white hover:text-purple-300 transition-all">
            {isLogin ? 'Primeiro acesso? ' : 'Já tem conta? '}
            <span className="font-bold text-purple-400 underline decoration-purple-400/30 hover:decoration-purple-400">{isLogin ? 'Criar Senha' : 'Fazer Login'}</span>
          </button>
        </p>
      </div>
    </div>
  );
};

// --- ADMIN APP OTIMIZADO (SEM useEffect / SEM LOOP) ---
const AdminApp = () => {
  const { logout, salaoNome, salaoId } = useAuth();
  const [screen, setScreen] = useState('dashboard');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  
  // Este estado controla se o Financeiro pediu para esconder o menu
  const [financeiroHideMenus, setFinanceiroHideMenus] = useState(false);

  // Lógica inteligente: Esconde se tiver modal aberto OU se o financeiro pediu
  // Isso substitui o useEffect antigo e evita o erro
  const deveEsconderMenus = activeModal !== null || financeiroHideMenus;

  const larguraContainer = 'max-w-7xl'; 

  return (
    // 'flex flex-col' garante que o conteudo ocupe 100% da altura
    <div className="min-h-screen font-sans bg-[#0a0a0f] text-white selection:bg-purple-500 selection:text-white flex flex-col">
      {isMenuOpen && <div className="fixed inset-0 bg-black/80 z-20 backdrop-blur-sm transition-opacity duration-300" onClick={() => setIsMenuOpen(false)} />}
      
      {/* HEADER: Usa a variável calculada deveEsconderMenus */}
      {!deveEsconderMenus && (
        <div className="bg-[#0a0a0f]/80 backdrop-blur-md px-6 py-4 sticky top-0 z-10 flex justify-between items-center border-b border-white/5 transition-all duration-300">
          <div className="flex items-center gap-3">
              <img src="/logo-luni.png" alt="LUNI" className="h-8 object-contain" />
              <div className="hidden md:block w-px h-6 bg-white/10"></div>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">{salaoNome || 'Gestão'}</p>
          </div>
          <button onClick={logout} className="text-gray-500 hover:text-red-400 transition-colors"><LogOut size={20} /></button>
        </div>
      )}

      {/* ÁREA DE CONTEÚDO */}
      <div className={`mx-auto w-full relative z-0 flex-1 ${!deveEsconderMenus ? 'pb-28 p-4 md:p-8' : 'p-0'} ${larguraContainer}`}>
        
        {screen === 'dashboard' && <DashboardAdmin onNavigate={setScreen} />}
        
        {/* Passamos onToggleModal para o FinanceiroScreen */}
        {screen === 'financeiro' && (
          <FinanceiroScreen 
            onClose={() => {
                setScreen('dashboard');
                setFinanceiroHideMenus(false); 
            }}
            // O Financeiro controla diretamente o estado
            onToggleModal={(isOpen) => setFinanceiroHideMenus(isOpen)} 
          />
        )} 
        
        {screen === 'agenda' && <AgendaScreen onClose={() => setScreen('dashboard')} />} 
        {screen === 'clientes' && <ClientesScreen onClose={() => setScreen('dashboard')} />} 
      </div>

      {/* MODAIS GERAIS */}
      <NovoAgendamentoModal isOpen={activeModal === 'agendamento'} onClose={() => setActiveModal(null)} onSuccess={() => { setActiveModal(null); setScreen('agenda'); }} />
      <NovoClienteModal isOpen={activeModal === 'cliente'} onClose={() => setActiveModal(null)} />
      <NovoProfissionalModal isOpen={activeModal === 'profissional'} onClose={() => setActiveModal(null)} salaoId={salaoId} />

      {/* MENU INFERIOR: Usa a variável calculada deveEsconderMenus */}
      {!deveEsconderMenus && (
        <div className="fixed bottom-0 left-0 w-full bg-[#0a0a0f]/90 backdrop-blur-lg border-t border-white/5 py-4 px-6 shadow-2xl z-30 transition-all duration-300">
          <div className={`flex justify-between items-end mx-auto relative ${larguraContainer}`}>
            <MenuIcon id="dashboard" icon={Home} label="Início" activeId={screen} onClick={setScreen} />
            <MenuIcon id="agenda" icon={Calendar} label="Agenda" activeId={screen} onClick={setScreen} />
            
            <div className="relative -top-8 flex flex-col items-center">
              {isMenuOpen && (
                <div className="absolute bottom-24 flex flex-col gap-3 mb-2 items-center w-52 animate-in slide-in-from-bottom-4">
                  <button onClick={() => { setActiveModal('profissional'); setIsMenuOpen(false); }} className="flex items-center gap-3 bg-[#18181b] border border-white/10 text-white px-5 py-3 rounded-2xl shadow-xl hover:bg-white/5 active:scale-95 transition-all w-full">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center"><Briefcase size={18}/></div>
                    <span className="text-sm font-bold">Profissional</span>
                  </button>
                  <button onClick={() => { setActiveModal('cliente'); setIsMenuOpen(false); }} className="flex items-center gap-3 bg-[#18181b] border border-white/10 text-white px-5 py-3 rounded-2xl shadow-xl hover:bg-white/5 active:scale-95 transition-all w-full">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center"><UserPlus size={18}/></div>
                    <span className="text-sm font-bold">Cliente</span>
                  </button>
                  <button onClick={() => { setActiveModal('agendamento'); setIsMenuOpen(false); }} className="flex items-center gap-3 bg-[#18181b] border border-white/10 text-white px-5 py-3 rounded-2xl shadow-xl hover:bg-white/5 active:scale-95 transition-all w-full">
                    <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center"><CalendarPlus size={18}/></div>
                    <span className="text-sm font-bold">Agendamento</span>
                  </button>
                </div>
              )}
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className={`w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg shadow-purple-500/30 hover:scale-105 transition-all duration-300 z-40 ${isMenuOpen ? 'bg-zinc-800 rotate-45' : 'bg-gradient-to-r from-purple-600 to-pink-600'}`}><Plus size={32} /></button>
            </div>
            <MenuIcon id="financeiro" icon={Wallet} label="Finanças" activeId={screen} onClick={setScreen} />
            <MenuIcon id="clientes" icon={Users} label="Clientes" activeId={screen} onClick={setScreen} />
          </div>
        </div>
      )}
    </div>
  );
};

// --- APP CONTENT ---
const AppContent = () => {
  const { user, role, profissionalData, logout, loading: authLoading } = useAuth();
  
  const [splashFinished, setSplashFinished] = useState(false);

  if (!splashFinished) {
    return <SplashScreen onFinish={() => setSplashFinished(true)} />;
  }

  if (authLoading) return null; 

  if (!user) return <LoginScreen />;

  return (
    <>
      {role === 'profissional' 
        ? <ProfessionalDashboard profissional={profissionalData} onLogout={logout} /> 
        : <AdminApp />
      }
      <InstallAppModal />
    </>
  );
};

export default function LUNI() { return <AuthProvider><AppContent /></AuthProvider>; }