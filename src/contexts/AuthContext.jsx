import React, { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '../services/supabase';
// 1. IMPORTANDO A FUNÇÃO DO FIREBASE (Ajuste o caminho '../firebase' se necessário)
import { requestNotificationPermission } from '../services/firebase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
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
      setSalaoId(null);
      setSalaoNome('');
      setLoading(false);
      return;
    }

    try {
      let userRole = null;
      let currentSalaoId = null;
      let proData = null;

      // 1. Tenta achar na tabela usuários oficial
      const { data: usuarioLink } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (usuarioLink) {
        userRole = usuarioLink.role;
        currentSalaoId = usuarioLink.salao_id;

        // Se o sistema acha que é profissional, tenta buscar os dados
        if (userRole === 'profissional' && usuarioLink.profissional_id) {
          const { data: pro, error: proError } = await supabase
            .from('profissionais')
            .select('*')
            .eq('id', usuarioLink.profissional_id)
            .maybeSingle();

          // Se não deu erro, salva os dados
          if (!proError && pro) {
            proData = pro;
          }
        }
      }

      // 2. O PLANO B: AUTO-CURA
      if (!proData && (!usuarioLink || userRole === 'profissional')) {
        const { data: proFallback } = await supabase
          .from('profissionais')
          .select('*')
          .eq('email', currentUser.email)
          .maybeSingle();

        if (proFallback) {
          proData = proFallback;
          userRole = 'profissional';
          currentSalaoId = proFallback.salao_id;

          // CONSERTA O BANCO
          await supabase.from('usuarios').upsert({
            id: currentUser.id,
            salao_id: proFallback.salao_id,
            role: 'profissional',
            profissional_id: proFallback.id
          });
        } else if (!usuarioLink) {
          userRole = 'admin'; // Fallback final
        }
      }

      // 3. Busca o nome do salão para exibir no Header
      if (currentSalaoId) {
        const { data: salao } = await supabase
            .from('saloes')
            .select('nome')
            .eq('id', currentSalaoId)
            .maybeSingle();
        if (salao) setSalaoNome(salao.nome);
      }

      // 4. Libera a tela
      setRole(userRole);
      setSalaoId(currentSalaoId);
      setProfissionalData(proData);

    } catch (error) {
      console.error("Erro na verificação de cargo:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setUser(session?.user ?? null); checkUserRole(session?.user); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => { setUser(session?.user ?? null); checkUserRole(session?.user); });
    return () => subscription.unsubscribe();
  }, []);

  // 2. FUNÇÃO DE LOGIN ATUALIZADA PARA CHAMAR AS NOTIFICAÇÕES
  const login = async (email, password) => {
    const result = await supabase.auth.signInWithPassword({ email, password });
    
    // Se o login deu certo e retornou um usuário...
    if (result.data?.user) {
      // Pede permissão e salva o Token no Supabase!
      // Usamos .catch() para que se o usuário cancelar, não trave o login dele.
      requestNotificationPermission(result.data.user.id).catch(console.error);
    }
    
    return result; // Retorna para a tela de login continuar o processo
  };

  const logout = async () => { setRole(null); setProfissionalData(null); setSalaoId(null); await supabase.auth.signOut(); };

  return (
    <AuthContext.Provider value={{ user, role, profissionalData, salaoId, salaoNome, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);