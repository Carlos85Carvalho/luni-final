// src/screens/financeiro/relatorios/RelatoriosHooks.js
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../../../services/supabase';
// CORREÇÃO: use 'relatorios.service' (minúsculo)
import { relatoriosService } from './relatorios.service'; 

export const useRelatorios = () => {
  const [relatoriosGerados, setRelatoriosGerados] = useState([]);
  const [loading, setLoading] = useState(false);

  // Carrega o histórico de relatórios salvos no banco
  const carregarRelatoriosGerados = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: usuario } = await supabase
        .from('usuarios')
        .select('salao_id')
        .eq('id', user.id)
        .single();

      if (!usuario?.salao_id) return;

      const { data } = await supabase
        .from('relatorios')
        .select('*')
        .eq('salao_id', usuario.salao_id)
        .order('data_criacao', { ascending: false })
        .limit(10);

      setRelatoriosGerados(data || []);
    } catch (error) {
      console.error('Erro ao carregar histórico de relatórios:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarRelatoriosGerados();
  }, [carregarRelatoriosGerados]);

  // Função Principal: Gera o relatório usando o Service e salva no histórico
  const gerarRelatorio = useCallback(async (tipo, periodo, filtros = {}) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: usuario } = await supabase
        .from('usuarios')
        .select('salao_id')
        .eq('id', user.id)
        .single();

      if (!usuario?.salao_id) return null;

      // 1. Gera os dados completos usando o service
      const dadosRelatorio = await relatoriosService.gerarRelatorioCompleto(
        usuario.salao_id,
        tipo,
        periodo,
        filtros
      );

      // 2. Salva no histórico do banco de dados
      if (dadosRelatorio) {
        const { error } = await supabase.from('relatorios').insert([{
          salao_id: usuario.salao_id,
          tipo,
          periodo,
          dados: dadosRelatorio, // Salva o JSON gerado
          data_criacao: new Date().toISOString()
        }]);

        if (error) {
          console.error('Erro ao salvar histórico:', error);
        } else {
          // Atualiza a lista na tela sem precisar recarregar
          carregarRelatoriosGerados();
        }
      }

      return dadosRelatorio;

    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      alert('Erro ao gerar o relatório. Tente novamente.');
      return null;
    } finally {
      setLoading(false);
    }
  }, [carregarRelatoriosGerados]);

  // Função para exportar (PDF ou Excel) usando o Service
  const exportarRelatorio = async (dados, formato = 'pdf') => {
    if (!dados) return;
    
    try {
      // Cria um nome de arquivo amigável: Relatorio_Financeiro_mes_2023-10-25
      const nomeArquivo = `Relatorio_${dados.tipo}_${dados.periodo}`;
      const titulo = dados.titulo || `Relatório ${dados.tipo}`;

      if (formato === 'pdf') {
        await relatoriosService.exportarParaPDF(dados, titulo);
      } else {
        await relatoriosService.exportarParaExcel(dados, nomeArquivo);
      }
    } catch (error) {
      console.error('Erro ao exportar:', error);
      alert('Erro ao exportar o arquivo.');
    }
  };

  return {
    relatoriosGerados,
    loading,
    gerarRelatorio,
    exportarRelatorio,
    refresh: carregarRelatoriosGerados
  };
};