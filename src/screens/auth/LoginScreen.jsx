import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
// CORREÇÃO: Deixei apenas UMA importação do Card (com o .jsx)
import { Card } from '../../components/ui/Card.jsx';
import { theme } from '../../services/constants';

export const LoginScreen = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await login(email, password);
    if (error) alert(error.message);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: theme.colors.background }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="w-20 h-20 mx-auto rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-indigo-200"
               style={{ backgroundColor: theme.colors.primary }}>
            <span className="text-4xl font-bold text-white">L</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Bem-vindo</h1>
          <p className="text-gray-400 mt-2">Gerencie seu salão de forma simples</p>
        </div>

        <Card>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-gray-400 mb-2">Email</label>
              <input className="w-full p-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-[#5B2EFF]" 
                type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-gray-400 mb-2">Senha</label>
              <input className="w-full p-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-[#5B2EFF]" 
                type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <button disabled={loading} className="w-full py-4 rounded-xl font-bold text-white transition hover:opacity-90"
              style={{ backgroundColor: theme.colors.primary }}>
              {loading ? 'Entrando...' : 'Acessar Conta'}
            </button>
          </form>
          <p className="text-xs text-center text-gray-300 mt-6">Demo: admin@luni.app / demo123</p>
        </Card>
      </div>
    </div>
  );
};