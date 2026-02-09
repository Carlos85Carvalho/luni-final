// src/screens/main/DashboardScreen.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { Activity, AlertTriangle } from 'lucide-react';

// Importa os dois dashboards
import { DashboardAdmin } from './DashboardAdmin';
import { ProfessionalDashboard } from './professional/ProfessionalDashboard';

export const DashboardScreen = ({ onNavigate }) => {
  const [loading, setLoading] = useState(true);
  const [userType, setUserType] = useState(null); // 'admin' ou 'profissional'
  const [userData, setUserData] = useState(null); // Dados completos do usuário para passar via prop
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        setLoading(true);
        
        // 1. Pega o usuário logado no Auth do Supabase
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) throw new Error("Usuário não autenticado");

        // 2. Busca os dados detalhados na tabela 'usuarios'
        // Isso é crucial porque seu ProfessionalDashboard espera o objeto 'profissional' com ID e Nome
        const { data: perfil, error: dbError } = await supabase
          .from('usuarios') 
          .select('*') // Pega tudo: id, nome, tipo_usuario, salao_id, etc.
          .eq('id', user.id)
          .single();

        if (dbError) throw dbError;

        // 3. Define o estado
        setUserData(perfil);
        setUserType(perfil?.tipo_usuario || 'profissional'); // Fallback seguro

      } catch (err) {
        console.error("Erro ao carregar perfil:", err);
        setError("Não foi possível carregar seu perfil. Verifique sua conexão.");
      } finally {
        setLoading(false);
      }
    };

    checkUserRole();
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      // Se você estiver usando React Router, o redirecionamento geralmente acontece
      // automaticamente se você tiver um listener no App.js, ou você pode forçar aqui:
      window.location.href = '/'; 
    } catch (error) {
      console.error("Erro ao sair:", error);
    }
  };

  // --- 1. TELA DE CARREGAMENTO ---
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <Activity className="mx-auto mb-4 animate-pulse text-[#5B2EFF]" size={48} />
          <p className="text-gray-400 font-medium">Carregando Luni...</p>
        </div>
      </div>
    );
  }

  // --- 2. TELA DE ERRO ---
  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center text-white px-4">
        <div className="text-center p-6 bg-red-500/10 rounded-2xl border border-red-500/20 max-w-sm w-full">
          <AlertTriangle className="mx-auto mb-3 text-red-500" size={32} />
          <h3 className="font-bold text-lg mb-2">Ops, algo deu errado</h3>
          <p className="text-sm text-gray-400 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-xl text-sm font-bold transition-all"
          >
            Tentar novamente
          </button>
          <button 
             onClick={handleLogout}
             className="block w-full mt-3 text-xs text-gray-500 hover:text-white underline"
          >
            Sair da conta
          </button>
        </div>
      </div>
    );
  }

  // --- 3. RENDERIZAÇÃO CONDICIONAL ---
  
  // Opção A: É Admin/Dono
  if (userType === 'admin' || userType === 'dono') {
    return <DashboardAdmin onNavigate={onNavigate} />;
  }

  // Opção B: É Profissional
  // Aqui passamos exatamente as props que seu componente ProfessionalDashboard pede
  return (
    <ProfessionalDashboard 
      profissional={userData} 
      onLogout={handleLogout} 
    />
  );
};