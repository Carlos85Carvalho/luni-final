import { createClient } from '@supabase/supabase-js';
import { useState, useEffect } from 'react';

// 1. Pega as chaves do arquivo .env (que fica na raiz do projeto)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 2. Trava de Segurança: Avisa se as chaves não existirem
if (!supabaseUrl || !supabaseKey) {
  console.error('🚨 ERRO CRÍTICO: As chaves do Supabase não foram encontradas! Verifique seu arquivo .env');
}

// 3. Cria e exporta o cliente do Supabase (Isso é o que o Login usa)
export const supabase = createClient(supabaseUrl, supabaseKey);

// 4. Hook personalizado para buscar dados de Views (Isso é o que você adicionou)
export const useSupabaseView = (viewName) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Se não tiver nome da view, não faz nada
    if (!viewName) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const { data: result, error: err } = await supabase
          .from(viewName)
          .select('*');
        
        if (err) throw err;
        setData(result);
      } catch (err) {
        console.error(`Erro ao buscar dados da view ${viewName}:`, err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [viewName]);

  return { data, loading, error };
};