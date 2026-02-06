// src/screens/financeiro/despesas/Despesas.jsx
import React, { useState, useMemo } from 'react';
import { supabase } from '../../../services/supabase'; // ⚠️ Verifique se o caminho do seu arquivo supabase está correto aqui
import { useDespesas } from './DespesasHooks'; // Corrigido o nome do arquivo
import { DespesasFilters } from './DespesasFilters';
import { DespesasTable } from './DespesasTable';
import { DespesasSummary } from './DespesasSummary';
// Receipt, CheckCircle, Clock e Plus não estavam sendo usados no render visual, removi para limpar.
// Se precisar deles dentro dos componentes filhos, importe dentro DELES.

export const Despesas = ({ onAbrirModal }) => {
  // Removi 'dados', 'loading' e 'onRefresh' das props pois o Hook já cuida disso
  const { despesas, loading: despesasLoading, refresh } = useDespesas();
  
  const [filtro, setFiltro] = useState('todas');
  const [categoriaFiltro, setCategoriaFiltro] = useState('todas');
  const [busca, setBusca] = useState('');

  const categorias = ['Aluguel', 'Energia', 'Água', 'Produtos', 'Salários', 'Marketing', 'Manutenção', 'Outros'];

  const despesasFiltradas = useMemo(() => {
    // Adicionei verificação de segurança (|| []) para evitar erro se despesas vier undefined
    return (despesas || []).filter(d => {
      const matchFiltro = filtro === 'todas' || 
        (filtro === 'pagas' && d.pago) || 
        (filtro === 'pendentes' && !d.pago);
      
      const matchCategoria = categoriaFiltro === 'todas' || d.categoria === categoriaFiltro;
      
      const matchBusca = busca === '' || 
        d.descricao?.toLowerCase().includes(busca.toLowerCase()) ||
        d.categoria?.toLowerCase().includes(busca.toLowerCase());

      return matchFiltro && matchCategoria && matchBusca;
    });
  }, [despesas, filtro, categoriaFiltro, busca]);

  const handleMarcarComoPaga = async (despesa) => {
    try {
      const { error } = await supabase
        .from('despesas')
        .update({ 
          pago: true, 
          data_pagamento: new Date().toISOString()
        })
        .eq('id', despesa.id);

      if (error) throw error;
      refresh(); // Atualiza a lista após editar
    } catch (error) {
      console.error('Erro ao marcar como paga:', error);
      alert('Erro ao atualizar despesa');
    }
  };

  const handleExcluirDespesa = async (id) => {
    if (!window.confirm('Deseja realmente excluir esta despesa?')) return;

    try {
      const { error } = await supabase.from('despesas').delete().eq('id', id);
      
      if (error) throw error;
      refresh(); // Atualiza a lista após excluir
    } catch (error) {
      console.error('Erro ao excluir despesa:', error);
      alert('Erro ao excluir');
    }
  };

  return (
    <div className="space-y-6">
      {/* Resumo */}
      <DespesasSummary despesas={despesasFiltradas} />

      {/* Filtros e Ações */}
      <DespesasFilters
        filtro={filtro}
        setFiltro={setFiltro}
        categoriaFiltro={categoriaFiltro}
        setCategoriaFiltro={setCategoriaFiltro}
        busca={busca}
        setBusca={setBusca}
        categorias={categorias}
        onNovaDespesa={() => onAbrirModal('nova-despesa')}
      />

      {/* Lista de Despesas */}
      <DespesasTable
        despesas={despesasFiltradas}
        loading={despesasLoading}
        onMarcarComoPaga={handleMarcarComoPaga}
        onEditar={(despesa) => onAbrirModal('editar-despesa', despesa)}
        onExcluir={handleExcluirDespesa}
      />
    </div>
  );
};