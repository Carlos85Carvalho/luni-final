import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

export const useClientes = () => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClientes = async () => {
      setLoading(true);
      
      try {
        // 1. Busca Clientes e Agendamentos
        const { data, error } = await supabase
          .from('clientes')
          .select(`
            *,
            agendamentos (
              data,
              valor_total,
              valor,
              status
            )
          `)
          .order('nome');

        if (error) throw error;

        // 2. Cria a "chave" do mês atual (Ex: "2026-02")
        const hoje = new Date();
        const ano = hoje.getFullYear();
        const mes = String(hoje.getMonth() + 1).padStart(2, '0'); // Garante que fevereiro seja "02" e não "2"
        const prefixoMesAtual = `${ano}-${mes}`; 

        // 3. Processa cada cliente
        const clientesProcessados = (data || []).map(c => {
          const listaAgendamentos = c.agendamentos || [];
          
          let totalGasto = 0;
          let totalGastoMes = 0;
          let ultimaData = null;

          listaAgendamentos.forEach(item => {
            // Pega o valor (prioriza valor_total)
            const valor = Number(item.valor_total) || Number(item.valor) || 0;
            
            // Soma no Total Geral (Top do Ano)
            totalGasto += valor;

            // Soma no Total do Mês (Top do Mês)
            // Lógica simples: Se a data começa com "2026-02", é deste mês.
            if (item.data && item.data.startsWith(prefixoMesAtual)) {
                totalGastoMes += valor;
            }
          });

          // Lógica de Datas
          let diasSemVisita = -1;
          if (listaAgendamentos.length > 0) {
            // Ordena datas (texto funciona bem para YYYY-MM-DD)
            const datasOrdenadas = listaAgendamentos
              .map(a => a.data)
              .sort().reverse(); // Decrescente
            
            if (datasOrdenadas[0]) {
                const dataRecente = new Date(datasOrdenadas[0] + 'T12:00:00'); // Meio-dia para evitar fuso
                ultimaData = dataRecente;
                const diffTime = Math.abs(hoje - dataRecente);
                diasSemVisita = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
            }
          }

          return {
            ...c,
            total_atendimentos: listaAgendamentos.length,
            gasto_total: totalGasto,
            gasto_mes: totalGastoMes,
            status: diasSemVisita === -1 ? 'novo' : (diasSemVisita > 45 ? 'perdido' : 'ativo'),
            dias_sem_visita: diasSemVisita,
            ultima_visita: ultimaData ? ultimaData.toISOString() : null
          };
        });

        setClientes(clientesProcessados);

      } catch (error) {
        console.error('Erro ao buscar clientes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClientes();
  }, []);

  return { clientes, loading };
};