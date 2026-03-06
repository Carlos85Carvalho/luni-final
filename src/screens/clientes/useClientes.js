import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext'; // Puxa o seu sistema de login

export const useClientes = () => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const { salaoId } = useAuth(); // Pega o ID dinâmico do salão logado

  useEffect(() => {
    // Só executa a busca quando o sistema confirmar qual salão está logado
    if (salaoId) {
      fetchClientes();
    }
  }, [salaoId]);

  const fetchClientes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('salao_id', salaoId) // 🔥 ESTA É A TRAVA DE SEGURANÇA
        .order('nome');

      if (error) throw error;
      setClientes(data || []);
    } catch (err) {
      console.error("Erro ao buscar clientes:", err);
    } finally {
      setLoading(false);
    }
  };

  return { clientes, loading, refresh: fetchClientes };
};