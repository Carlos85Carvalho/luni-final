// src/screens/financeiro/relatorios/relatoriosHooks.js
import { useState, useCallback } from 'react';
import { supabase } from '../../../services/supabase';
import { relatoriosService } from './relatorios.service';

export const useRelatorios = () => {
  const [loading, setLoading] = useState(false);
  const [relatoriosGerados, setRelatoriosGerados] = useState([]);

  const gerarRelatorio = useCallback(async (tipo, periodo) => {
    console.log('🔵 [HOOK] ========== INICIANDO GERAÇÃO ==========');
    console.log('🔵 [HOOK] Parâmetros:', { tipo, periodo });
    
    setLoading(true);
    
    try {
      // 1. Buscar usuário autenticado
      console.log('🔵 [HOOK] Buscando usuário autenticado...');
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('❌ [HOOK] Erro ao buscar usuário:', userError);
        throw new Error('Erro ao buscar usuário autenticado');
      }
      
      if (!user) {
        console.error('❌ [HOOK] Usuário não autenticado');
        throw new Error('Usuário não autenticado');
      }
      
      console.log('✅ [HOOK] Usuário autenticado:', user.id);

      // 2. Buscar dados do usuário para pegar o salao_id
      console.log('🔵 [HOOK] Buscando dados do usuário...');
      const { data: usuario, error: usuarioError } = await supabase
        .from('usuarios')
        .select('salao_id')
        .eq('id', user.id)
        .single();

      if (usuarioError) {
        console.error('❌ [HOOK] Erro ao buscar dados do usuário:', usuarioError);
        throw new Error('Erro ao buscar dados do usuário');
      }

      if (!usuario?.salao_id) {
        console.error('❌ [HOOK] Salão não encontrado para o usuário');
        throw new Error('Salão não encontrado');
      }

      console.log('✅ [HOOK] Salão encontrado:', usuario.salao_id);

      // 3. Gerar relatório usando o serviço
      console.log('🔵 [HOOK] Chamando serviço para gerar relatório...');
      const dadosRelatorio = await relatoriosService.gerarRelatorioCompleto(
        usuario.salao_id,
        tipo,
        periodo
      );

      console.log('✅ [HOOK] Relatório gerado pelo serviço:', dadosRelatorio);

      // 4. Verificar se o relatório tem dados
      if (!dadosRelatorio || !dadosRelatorio.resumo) {
        console.warn('⚠️ [HOOK] Relatório gerado mas sem dados no resumo');
        return dadosRelatorio;
      }

      // 5. Salvar no histórico local
      const novoHistorico = {
        id: Date.now(),
        tipo,
        titulo: dadosRelatorio.titulo,
        periodo,
        data: new Date().toISOString(),
        dados: dadosRelatorio
      };

      console.log('🔵 [HOOK] Adicionando ao histórico:', novoHistorico);
      setRelatoriosGerados(prev => [novoHistorico, ...prev]);

      console.log('🎉 [HOOK] ========== GERAÇÃO CONCLUÍDA ==========');
      return dadosRelatorio;

    } catch (error) {
      console.error('❌ [HOOK] Erro ao gerar relatório:', error);
      console.error('❌ [HOOK] Stack trace:', error.stack);
      
      alert(`Erro ao gerar relatório: ${error.message}`);
      return null;

    } finally {
      setLoading(false);
      console.log('🔵 [HOOK] Loading definido como false');
    }
  }, []);

  return {
    loading,
    relatoriosGerados,
    gerarRelatorio
  };
};