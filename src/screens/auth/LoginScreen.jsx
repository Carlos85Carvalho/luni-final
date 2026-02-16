import React, { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from './services/supabase'; 
import { 
  Home, Users, Calendar, Plus, UserPlus, CalendarPlus, Wallet, Loader2, LogOut,
  Briefcase, User, Lock, Mail, Store, Phone,
  // Novos ícones do Login
  LayoutDashboard, LineChart, Settings, CheckCircle, ArrowRight
} from 'lucide-react';

// --- IMPORTAÇÃO DO NOVO SPLASH ---
import { SplashScreen } from './components/ui/SplashScreen';
// --- IMPORTAÇÃO DO MODAL DE INSTALAÇÃO (PWA) ---
import { InstallAppModal } from './components/ui/InstallAppModal';

// --- IMPORTAÇÕES DE TELAS ---
import { FinanceiroModule } from './screens/financeiro';
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

// ============================================================================
// 🎨 NOVA TELA DE LOGIN (ESTILO DASHBOARD / SIDEBAR)
// ============================================================================
const LoginScreen = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);

  // Estados extras para Cadastro
  const [confirmPass, setConfirmPass] = useState('');
  const [nomeResponsavel, setNomeResponsavel] = useState('');
  const [nomeSalao, setNomeSalao] = useState('');
  const [telefone, setTelefone] = useState('');

  // --- Função Google ---
  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin }
      });
      if (error) throw error;
    } catch (error) {
      alert('Erro: ' + error.message);
    }
  };

  // --- Função Auth Unificada ---
  const handleAuth = async () => {
    if (!email || !password) return alert("Preencha email e senha.");
    if (!isLogin) {
        if (password !== confirmPass) return alert("As senhas não conferem!");
        if (password.length < 6) return alert("A senha deve ter no mínimo 6 caracteres.");
    }
    setLoading(true);
    try {
      if (isLogin) { 
        const { error } = await login(email, password); 
        if(error) throw error;
      } 
      else { 
        const { data: isPro } = await supabase.from('profissionais').select('*').eq('email', email).maybeSingle();
        if (!isPro) {
            if (!nomeResponsavel || !nomeSalao || !telefone) throw new Error("Preencha todos os dados.");
        }

        const { data: authData, error: authError } = await supabase.auth.signUp({ 
          email, 
          password: password,
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
      setLoading(false);
    }
  };

  // Item de menu falso para a sidebar
  const FakeMenuItem = ({ icon: Icon, label, active }) => (
    <div className={`flex items-center gap-3 px-3 py-2 rounded-lg mb-1 ${active ? 'bg-purple-500/10 text-purple-400' : 'text-zinc-500 opacity-50'}`}>
      <Icon size={18} />
      <span className="text-sm font-medium">{label}</span>
      {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-purple-400"></div>}
    </div>
  );

  return (
    <div className="flex min-h-screen w-full bg-[#09090b]">
      
      {/* --- LADO ESQUERDO: SIDEBAR VISUAL (Hidden Mobile) --- */}
      <div className="hidden lg:flex w-64 flex-col bg-[#18181b] border-r border-white/5 p-4 relative overflow-hidden">
        
        {/* LOGO LUNI NA SIDEBAR */}
        <div className="flex items-center justify-start mb-8 px-2 mt-2">
            <img src="/logo-luni.png" alt="Luni" className="h-10 object-contain" />
        </div>

        <div className="space-y-6 pointer-events-none select-none opacity-80">
            <div>
                <p className="text-xs font-semibold text-zinc-600 uppercase tracking-wider mb-3 px-2">Visão Geral</p>
                <FakeMenuItem icon={LayoutDashboard} label="Dashboard" active />
                <FakeMenuItem icon={LineChart} label="Financeiro" />
                <FakeMenuItem icon={Users} label="Clientes" />
            </div>
            <div>
                <p className="text-xs font-semibold text-zinc-600 uppercase tracking-wider mb-3 px-2">Gestão</p>
                <FakeMenuItem icon={Settings} label="Configurações" />
            </div>
        </div>

        <div className="mt-auto bg-purple-900/10 border border-purple-500/20 p-4 rounded-xl relative overflow-hidden">
             <div className="absolute -right-2 -top-2 text-purple-500/10"><CheckCircle size={60} /></div>
             <h3 className="text-white font-semibold mb-1 text-sm relative z-10">Acesso Seguro</h3>
             <p className="text-xs text-purple-200/70 relative z-10">Faça login para gerenciar seu negócio completo.</p>
        </div>
      </div>

      {/* --- LADO DIREITO: FORMULÁRIO --- */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 relative overflow-y-auto">
        {/* Luz de fundo sutil */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent"></div>

        <div className="w-full max-w-[400px] animate-in slide-in-from-bottom-4 duration-700 my-auto">
            
            {/* LOGO MOBILE */}
            <div className="lg:hidden flex justify-center mb-8">
                <img src="/logo-luni.png" alt="Luni" className="h-24 object-contain" />
            </div>

            <div className="mb-8 text-center lg:text-left">
                <h1 className="text-2xl font-bold text-white mb-2">
                    {isLogin ? 'Bem-vindo de volta' : 'Crie sua conta'}
                </h1>
                <p className="text-zinc-400 text-sm">
                    {isLogin ? 'Acesse o painel de gestão Luni.' : 'Comece a transformar seu salão hoje.'}
                </p>
            </div>

            <div className="bg-[#18181b] border border-white/5 p-6 rounded-2xl shadow-xl">
                 <button 
                    onClick={handleGoogleLogin}
                    className="w-full h-11 bg-white hover:bg-zinc-100 text-black font-semibold rounded-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] mb-6 text-sm"
                  >
                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
                    <span>{isLogin ? 'Entrar com Google' : 'Cadastrar com Google'}</span>
                  </button>

                  <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-[#18181b] px-2 text-zinc-500 font-medium">ou</span></div>
                  </div>

                <div className="space-y-4">
                    
                    {/* Campos Extras de Cadastro (Só aparecem se !isLogin) */}
                    {!isLogin && (
                        <div className="space-y-4 animate-in slide-in-from-top-2">
                            <div className="bg-purple-500/10 border border-purple-500/20 p-3 rounded-lg text-xs text-purple-200 text-center">
                                Funcionário? Use o e-mail cadastrado pelo gestor.
                            </div>
                            
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-zinc-400 ml-1">Seu Nome</label>
                                <div className="relative group">
                                    <User className="absolute left-3 top-3 text-zinc-500" size={16} />
                                    <input className="w-full h-10 pl-9 bg-black/20 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all text-sm" 
                                        placeholder="Nome completo" value={nomeResponsavel} onChange={e=>setNomeResponsavel(e.target.value)} />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-zinc-400 ml-1">Nome do Salão</label>
                                <div className="relative group">
                                    <Store className="absolute left-3 top-3 text-zinc-500" size={16} />
                                    <input className="w-full h-10 pl-9 bg-black/20 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all text-sm" 
                                        placeholder="Nome do seu negócio" value={nomeSalao} onChange={e=>setNomeSalao(e.target.value)} />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-zinc-400 ml-1">Telefone</label>
                                <div className="relative group">
                                    <Phone className="absolute left-3 top-3 text-zinc-500" size={16} />
                                    <input className="w-full h-10 pl-9 bg-black/20 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all text-sm" 
                                        placeholder="(00) 00000-0000" value={telefone} onChange={e=>setTelefone(e.target.value)} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Campos Padrão (Email e Senha) */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-400 ml-1">E-mail</label>
                        <div className="relative group">
                            <Mail className="absolute left-3 top-3 text-zinc-500" size={16} />
                            <input 
                            type="email" 
                            className="w-full h-10 pl-9 bg-black/20 border border-white/10 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all text-sm"
                            placeholder="seu@email.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-400 ml-1">Senha</label>
                        <div className="relative group">
                            <Lock className="absolute left-3 top-3 text-zinc-500" size={16} />
                            <input 
                            type="password" 
                            className="w-full h-10 pl-9 bg-black/20 border border-white/10 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all text-sm"
                            placeholder="••••••••"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Confirmação de Senha (Só aparece no cadastro) */}
                    {!isLogin && (
                        <div className="space-y-1.5 animate-in slide-in-from-top-1">
                            <label className="text-xs font-medium text-zinc-400 ml-1">Confirmar Senha</label>
                            <div className="relative group">
                                <Lock className="absolute left-3 top-3 text-zinc-500" size={16} />
                                <input 
                                type="password" 
                                className={`w-full h-10 pl-9 bg-black/20 border rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all text-sm ${password && confirmPass && password !== confirmPass ? 'border-red-500/50' : 'border-white/10'}`}
                                placeholder="Repita a senha"
                                value={confirmPass}
                                onChange={e => setConfirmPass(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    <button 
                    onClick={handleAuth}
                    disabled={loading}
                    className="w-full h-11 mt-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2 active:scale-[0.98] text-sm shadow-lg shadow-purple-900/20"
                    >
                    {loading ? <Loader2 className="animate-spin" size={18} /> : (
                        <>
                        {isLogin ? 'Acessar Painel' : 'Criar Conta'}
                        <ArrowRight size={16} className="opacity-70" />
                        </>
                    )}
                    </button>
                </div>
            </div>

            <p className="mt-8 text-center text-sm text-zinc-500 pb-8">
                <button 
                onClick={() => setIsLogin(!isLogin)}
                className="text-zinc-400 hover:text-white font-medium transition-colors text-xs"
                >
                {isLogin ? 'Não tem conta? Criar agora' : 'Já tem conta? Fazer login'}
                </button>
            </p>
        </div>
      </div>
    </div>
  );
};
// ============================================================================


// --- ADMIN APP OTIMIZADO (SEM useEffect / SEM LOOP) ---
const AdminApp = () => {
  const { logout, salaoNome, salaoId } = useAuth();
  const [screen, setScreen] = useState('dashboard');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  
  // Este estado controla se o Financeiro pediu para esconder o menu
  const [financeiroHideMenus, setFinanceiroHideMenus] = useState(false);

  // Lógica inteligente: Esconde se tiver modal aberto OU se o financeiro pediu
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
        
        {screen === 'financeiro' && (
          <FinanceiroModule 
            onClose={() => {
                setScreen('dashboard');
                setFinanceiroHideMenus(false); 
            }}
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