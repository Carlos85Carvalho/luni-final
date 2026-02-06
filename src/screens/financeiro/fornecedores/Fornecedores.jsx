// src/screens/financeiro/fornecedores/Fornecedores.jsx
import { useState, useMemo } from 'react';
import { useFornecedores, useFornecedoresKPIs } from './FornecedoresHooks'; // Corrigido o nome do arquivo
import { FornecedoresKPIs } from './FornecedoresKPIs';
import { FornecedoresFilters } from './FornecedoresFilters';
import { FornecedoresTable } from './FornecedoresTable';

export const Fornecedores = ({ onAbrirModal }) => {
  // Removi props antigas e variáveis não usadas
  const { fornecedores, loading: fornecedoresLoading } = useFornecedores();
  const kpis = useFornecedoresKPIs(fornecedores);
  
  const [filtroAtivo, setFiltroAtivo] = useState('todos');
  const [busca, setBusca] = useState('');

  const fornecedoresFiltrados = useMemo(() => {
    // Adicionei (|| []) para evitar erro se 'fornecedores' for undefined
    return (fornecedores || []).filter(f => {
      const matchAtivo = filtroAtivo === 'todos' || 
        (filtroAtivo === 'ativo' && f.ativo) || 
        (filtroAtivo === 'inativo' && !f.ativo);
      
      const matchBusca = busca === '' || 
        f.nome?.toLowerCase().includes(busca.toLowerCase()) ||
        f.email?.toLowerCase().includes(busca.toLowerCase()) ||
        f.cnpj_cpf?.includes(busca);

      return matchAtivo && matchBusca;
    });
  }, [fornecedores, filtroAtivo, busca]);

  const handleEditarFornecedor = (fornecedor) => {
    onAbrirModal('editar-fornecedor', fornecedor);
  };

  const handleVerCompras = (fornecedor) => {
    onAbrirModal('compras-fornecedor', fornecedor);
  };

  return (
    <div className="space-y-6">
      {/* KPIs dos Fornecedores */}
      <FornecedoresKPIs 
        kpis={kpis}
        loading={fornecedoresLoading || kpis.rankingLoading}
        onAbrirModal={onAbrirModal}
      />

      {/* Filtros */}
      <FornecedoresFilters
        filtroAtivo={filtroAtivo}
        setFiltroAtivo={setFiltroAtivo}
        busca={busca}
        setBusca={setBusca}
        onNovoFornecedor={() => onAbrirModal('novo-fornecedor')}
      />

      {/* Tabela de Fornecedores */}
      <FornecedoresTable
        fornecedores={fornecedoresFiltrados}
        ranking={kpis.ranking}
        loading={fornecedoresLoading}
        onEditarFornecedor={handleEditarFornecedor}
        onVerCompras={handleVerCompras}
      />
    </div>
  );
};