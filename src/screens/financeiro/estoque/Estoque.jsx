// src/screens/financeiro/estoque/Estoque.jsx
import React, { useState, useMemo } from 'react';
import { useEstoque, useEstoqueKPIs } from './EstoqueHooks'; // Corrigido o caminho do arquivo
import { EstoqueKPIs } from './EstoqueKPIs';
import { EstoqueFilters } from './EstoqueFilters';
import { EstoqueTable } from './EstoqueTable';
// Removi os ícones do lucide-react pois não eram usados neste arquivo visualmente

export const Estoque = ({ onAbrirModal }) => {
  // Removi as props 'dados', 'loading' e 'onRefresh' pois o hook já cuida disso
  const { produtos, loading: produtosLoading } = useEstoque();
  const kpis = useEstoqueKPIs(produtos);
  
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [busca, setBusca] = useState('');

  const produtosFiltrados = useMemo(() => {
    // Adicionei (|| []) para evitar erro caso produtos ainda não tenha carregado
    return (produtos || []).filter(produto => {
      const matchStatus = filtroStatus === 'todos' || 
        (filtroStatus === 'critico' && produto.quantidade_atual <= produto.estoque_minimo) ||
        (filtroStatus === 'alto-giro' && produto.rotatividade > 2) ||
        (filtroStatus === 'baixo-giro' && produto.rotatividade < 0.5);
      
      const matchBusca = busca === '' || 
        produto.nome?.toLowerCase().includes(busca.toLowerCase()) ||
        produto.categoria?.toLowerCase().includes(busca.toLowerCase());

      return matchStatus && matchBusca;
    });
  }, [produtos, filtroStatus, busca]);

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