import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext'; // Importante!

export const usePerformance = (dataInicio, dataFim, profissionalId) => {
  const [loading, setLoading] = useState(true);
  const [dados, setDados] = useState([]);
  const { salaoId } = useAuth(); // Pega o ID do salão logado

  useEffect(() => {
    const fetchDados = async () => {
      if (!salaoId) return; // Segurança extra
      setLoading(true);
      
      try {
        const inicioQuery = `${dataInicio}T00:00:00`;
        const fimQuery = `${dataFim}T23:59:59`;

        let query = supabase
          .from('agendamentos')
          .select(`id, data, valor, valor_total, servico, profissional_id, status, profissionais (nome)`)
          .eq('salao_id', salaoId) // 🔥 AQUI ESTÁ A TRAVA DE SEGURANÇA
          .gte('data', inicioQuery)
          .lte('data', fimQuery)
          .neq('status', 'cancelado');

        if (profissionalId !== 'todos') {
          query = query.eq('profissional_id', profissionalId);
        }

        const { data, error } = await query;
        if (error) throw error;
        setDados(data || []);
      } catch (err) {
        console.error("Erro na performance:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDados();
  }, [dataInicio, dataFim, profissionalId, salaoId]);

  return { dados, loading };
};