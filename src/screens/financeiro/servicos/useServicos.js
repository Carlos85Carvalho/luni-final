import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext'; // 🛡️ Barreira de segurança

export const useServicos = () => {
  const [servicos, setServicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const { salaoId } = useAuth(); // Pega o ID do salão logado

  const fetchServicos = useCallback(async () => {
    if (!salaoId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('servicos')
        .select('*')
        .eq('salao_id', salaoId) // 🔥 FILTRO MESTRE: Isolamento por salão
        .order('nome');

      if (error) throw error;
      setServicos(data || []);
    } catch (err) {
      console.error("Erro ao buscar serviços:", err);
    } finally {
      setLoading(false);
    }
  }, [salaoId]);

  useEffect(() => {
    fetchServicos();
  }, [fetchServicos]);

  const adicionarServico = async (novoServico, habilitarPausa) => {
    if (!salaoId) throw new Error("Salão não identificado");
    
    const { data, error } = await supabase.from('servicos').insert([{
      nome: novoServico.nome,
      preco: novoServico.preco,
      duracao: novoServico.duracao,
      pausa: habilitarPausa ? novoServico.pausa : 0,
      categoria: novoServico.categoria,
      salao_id: salaoId // 🔥 Garante que salva no salão correto
    }]).select();

    if (error) throw error;
    await fetchServicos();
    return data;
  };

  const salvarAlteracao = async (id, campo, valor) => {
    const { error } = await supabase
      .from('servicos')
      .update({ [campo]: valor })
      .eq('id', id)
      .eq('salao_id', salaoId); // 🛡️ Segurança extra no update

    if (error) throw error;
    // Atualiza o estado local para performance instantânea
    setServicos(prev => prev.map(s => s.id === id ? { ...s, [campo]: valor } : s));
  };

  const deletarServico = async (id) => {
    const { error } = await supabase
      .from('servicos')
      .delete()
      .eq('id', id)
      .eq('salao_id', salaoId); // 🛡️ Segurança extra no delete

    if (error) throw error;
    setServicos(prev => prev.filter(s => s.id !== id));
  };

  return { servicos, loading, fetchServicos, adicionarServico, salvarAlteracao, deletarServico };
};