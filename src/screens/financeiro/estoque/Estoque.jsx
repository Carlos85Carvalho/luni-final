import React, { useState, useMemo, useEffect } from 'react';
import { supabase } from '../../../services/supabase';
import { useAuth } from '../../../contexts/AuthContext'; // 🛡️ Importe de segurança
import { useEstoque } from './EstoqueHooks';
import { EstoqueKPIs } from './EstoqueKPIs';
import { EstoqueFilters } from './EstoqueFilters';
import { EstoqueTable } from './EstoqueTable';
import { Loader2 } from 'lucide-react';

export const Estoque = ({ onAbrirModal }) => {
  const { salaoId } = useAuth(); // Identifica o salão logado
  const { produtos, loading: produtosLoading } = useEstoque();
  
  const [kpis, setKpis] = useState({
    valorTotal: 0,
    lucroEstimado: 0, 
    totalItens: 0, 
    qtdCriticos: 0, 
    giroMedio: 0,  
    margemMedia: 0
  });

  // ========== BUSCA DADOS DA VIEW E CALCULA TOTAIS FILTRADOS ==========
  useEffect(() => {
    const fetchKPIs = async () => {
      if (!salaoId) return; // Segurança: não busca sem o ID

      try {
        const { data, error } = await supabase
          .from('vw_dashboard_estoque')
          .select('*')
          .eq('salao_id', salaoId) // 🔥 FILTRO MESTRE: Impede vazamento nos cards do topo
          .maybeSingle(); 

        if (error) {
          console.error('Erro ao buscar KPIs:', error);
          return;
        }

        if (data) {
          setKpis({
            valorTotal: Number(data.valor_total || data.valorTotal || 0),
            lucroEstimado: Number(data.lucro_estimado || 0), 
            totalItens: produtos ? produtos.length : 0, 
            qtdCriticos: Number(data.qtd_criticos || data.qtdCriticos || data.estoque_critico || 0),
            giroMedio: Number(data.giro_medio || data.giroMedio || data.giro_estoque || 0),
            margemMedia: Number(data.margem_media || data.margemMedia || 0).toFixed(2) 
          });
        }
      } catch (err) {
        console.error('Erro geral KPIs:', err);
      }
    };

    fetchKPIs();
  }, [produtos, salaoId]); 

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

  // Trava visual enquanto identifica o salão
  if (!salaoId && produtosLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

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