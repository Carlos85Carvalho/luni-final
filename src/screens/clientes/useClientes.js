import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';

export const useClientes = () => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const { salaoId } = useAuth(); 

  const fetchClientes = useCallback(async () => {
    // 🔥 A CORREÇÃO ESTÁ AQUI: Se não tiver ID, pare de carregar imediatamente!
    if (!salaoId) {
      setLoading(false); 
      return;
    }
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('salao_id', salaoId)
        .order('nome');

      if (error) throw error;
      setClientes(data || []);
    } catch (err) {
      console.error("Erro ao buscar clientes:", err);
    } finally {
      setLoading(false);
    }
  }, [salaoId]);

  useEffect(() => {
    fetchClientes();
  }, [fetchClientes]);

  return { clientes, loading, refresh: fetchClientes };
};