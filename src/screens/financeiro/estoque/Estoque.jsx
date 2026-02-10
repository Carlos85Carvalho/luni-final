import React, { useState, useMemo, useEffect } from 'react';
import { supabase } from '../../../services/supabase';
import { useEstoque } from './EstoqueHooks';
import { EstoqueKPIs } from './EstoqueKPIs';
import { EstoqueFilters } from './EstoqueFilters';
import { EstoqueTable } from './EstoqueTable';

export const Estoque = ({ onAbrirModal }) => {
  // Dados brutos da lista (para a tabela)
  const { produtos, loading: produtosLoading } = useEstoque();
  
  // Estado para os KPIs (Cards do topo)
  const [kpis, setKpis] = useState({
    valorTotal: 0,
    totalItens: 0, // <--- ADICIONADO: Começa com 0
    estoqueCritico: 0,
    giroEstoque: 0,
    margemMedia: 0
  });

  // ========== BUSCA DADOS DA VIEW E CALCULA TOTAIS ==========
  useEffect(() => {
    const fetchKPIs = async () => {
      try {
        // Busca da view que criamos no SQL (para valores complexos)
        const { data, error } = await supabase
          .from('vw_dashboard_estoque')
          .select('*')
          .maybeSingle(); 

        if (error) {
          console.error('Erro ao buscar KPIs:', error);
          return;
        }

        if (data) {
          setKpis({
            valorTotal: Number(data.valor_total || 0),
            
            // --- CORREÇÃO AQUI ---
            // Usamos a lista 'produtos' que já carregou para contar quantos itens tem
            totalItens: produtos ? produtos.length : 0, 

            estoqueCritico: Number(data.estoque_critico || 0),
            giroEstoque: Number(data.vendas_mes || 0),
            margemMedia: Number(data.margem_media || 0).toFixed(2) 
          });
        }
      } catch (err) {
        console.error('Erro geral KPIs:', err);
      }
    };

    // Chama sempre que a lista de produtos mudar (adicionar/remover item)
    fetchKPIs();
  }, [produtos]); 

  // ========== FILTROS E BUSCA ==========
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [busca, setBusca] = useState('');

  const produtosFiltrados = useMemo(() => {
    return (produtos || []).filter(produto => {
      const isCritico = produto.quantidade_atual <= (produto.estoque_minimo || 5);
      const isBaixoGiro = produto.quantidade_atual > 20; 

      const matchStatus = filtroStatus === 'todos' || 
        (filtroStatus === 'critico' && isCritico) ||
        (filtroStatus === 'alto-giro' && !isBaixoGiro) || 
        (filtroStatus === 'baixo-giro' && isBaixoGiro);
      
      const matchBusca = busca === '' || 
        produto.nome?.toLowerCase().includes(busca.toLowerCase()) ||
        produto.categoria?.toLowerCase().includes(busca.toLowerCase());

      return matchStatus && matchBusca;
    });
  }, [produtos, filtroStatus, busca]);

  // ========== AÇÕES ==========
  const handleEditarProduto = (produto) => {
    onAbrirModal('editar-produto', produto);
  };

  const handleEntradaEstoque = (produto = null) => {
    onAbrirModal('entrada-estoque', produto);
  };

  return (
    <div className="space-y-6">
      {/* KPIs do Estoque */}
      <EstoqueKPIs 
        kpis={kpis}
        loading={produtosLoading}
        onAbrirModal={onAbrirModal}
      />

      {/* Filtros */}
      <EstoqueFilters
        filtroStatus={filtroStatus}
        setFiltroStatus={setFiltroStatus}
        busca={busca}
        setBusca={setBusca}
        onEntradaEstoque={handleEntradaEstoque}
        onNovoProduto={() => onAbrirModal('novo-produto')}
      />

      {/* Tabela de Produtos */}
      <EstoqueTable
        produtos={produtosFiltrados}
        loading={produtosLoading}
        onEditarProduto={handleEditarProduto}
        onEntradaEstoque={handleEntradaEstoque}
      />
    </div>
  );
};