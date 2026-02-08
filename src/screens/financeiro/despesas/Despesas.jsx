// src/screens/financeiro/despesas/Despesas.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { supabase } from '../../../services/supabase'; 
import { useDespesas } from './DespesasHooks'; 
import { DespesasFilters } from './DespesasFilters';
import { DespesasTable } from './DespesasTable';
import { DespesasSummary } from './DespesasSummary';

export const Despesas = ({ onAbrirModal }) => {
  const { despesas, loading: despesasLoading, refresh } = useDespesas();
  
  const [filtro, setFiltro] = useState('todas');
  const [categoriaFiltro, setCategoriaFiltro] = useState('todas');
  const [busca, setBusca] = useState('');

  // --- DEBUG: Verifica se a função chegou ---
  useEffect(() => {
    if (!onAbrirModal) {
      console.error('ALERTA: O componente Despesas não recebeu a prop onAbrirModal!');
    } else {
      console.log('SUCESSO: onAbrirModal recebido corretamente em Despesas.');
    }
  }, [onAbrirModal]);

  // --- Função Segura para Abrir Modal ---
  const handleAbrirModalSeguro = (tipo, dados = null) => {
    if (typeof onAbrirModal === 'function') {
      onAbrirModal(tipo, dados);
    } else {
      alert('ERRO DE SISTEMA: O FinanceiroScreen não enviou a função de abrir modal.');
      console.error('Tentativa de abrir modal falhou: onAbrirModal é', onAbrirModal);
    }
  };

  const categorias = ['Aluguel', 'Energia', 'Água', 'Produtos', 'Salários', 'Marketing', 'Manutenção', 'Outros'];

  const despesasFiltradas = useMemo(() => {
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
      refresh(); 
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
      refresh(); 
    } catch (error) {
      console.error('Erro ao excluir despesa:', error);
      alert('Erro ao excluir');
    }
  };

  return (
    <div className="space-y-6">
      <DespesasSummary despesas={despesasFiltradas} />

      <DespesasFilters
        filtro={filtro}
        setFiltro={setFiltro}
        categoriaFiltro={categoriaFiltro}
        setCategoriaFiltro={setCategoriaFiltro}
        busca={busca}
        setBusca={setBusca}
        categorias={categorias}
        // USANDO A FUNÇÃO SEGURA AQUI:
        onNovaDespesa={() => handleAbrirModalSeguro('nova-despesa')}
      />

      <DespesasTable
        despesas={despesasFiltradas}
        loading={despesasLoading}
        onMarcarComoPaga={handleMarcarComoPaga}
        // USANDO A FUNÇÃO SEGURA AQUI:
        onEditar={(despesa) => handleAbrirModalSeguro('editar-despesa', despesa)}
        onExcluir={handleExcluirDespesa}
      />
    </div>
  );
};