import { useState, useEffect } from 'react';
import { supabase } from '../../../services/supabase';
import { useAuth } from '../../../contexts/AuthContext'; // 🛡️ Importe de segurança

export const useEstoque = () => {
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const { salaoId } = useAuth(); // Pega o ID do salão logado

  useEffect(() => {
    // SÓ busca se o salaoId já estiver carregado
    if (salaoId) {
      fetchProdutos();
    }
  }, [salaoId]);

  const fetchProdutos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .eq('salao_id', salaoId) // 🔥 FILTRO OBRIGATÓRIO: Garante isolamento da lista
        .order('nome');

      if (error) throw error;
      setProdutos(data || []);
    } catch (err) {
      console.error("Erro ao buscar estoque:", err);
    } finally {
      setLoading(false);
    }
  };

  return { produtos, loading, refresh: fetchProdutos };
};