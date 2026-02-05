import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Loader2, Package, DollarSign, Truck, Calendar, FileText, Hash, AlertTriangle } from 'lucide-react';
import { supabase } from '../../services/supabase';

export const EstoqueModal = ({ aberto, onFechar, onSucesso, produto }) => {
  const [salvando, setSalvando] = useState(false);
  const [salaoId, setSalaoId] = useState(null);
  const [produtos, setProdutos] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [loadingProdutos, setLoadingProdutos] = useState(true);
  const [loadingFornecedores, setLoadingFornecedores] = useState(true);

  const [formData, setFormData] = useState({
    produto_id: '',
    quantidade: '1',
    custo_unitario: '',
    fornecedor_id: '',
    data_entrada: new Date().toISOString().split('T')[0],
    observacoes: ''
  });

  useEffect(() => {
    const fetchSalao = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('usuarios').select('salao_id').eq('id', user.id).single();
        if (data) setSalaoId(data.salao_id);
      }
    };
    fetchSalao();
  }, []);

  useEffect(() => {
    if (produto) {
      setFormData(prev => ({
        ...prev,
        produto_id: produto.id,
        custo_unitario: produto.custo_unitario?.toString() || ''
      }));
    }
  }, [produto]);

  useEffect(() => {
    const fetchDados = async () => {
      if (!salaoId) return;
      setLoadingProdutos(true);
      setLoadingFornecedores(true);
      try {
        const [prodRes, fornRes] = await Promise.all([
          supabase.from('produtos').select('id, nome, custo_unitario, quantidade_atual').eq('salao_id', salaoId).eq('ativo', true).order('nome'),
          supabase.from('fornecedores').select('id, nome').eq('salao_id', salaoId).eq('ativo', true).order('nome')
        ]);
        if (prodRes.data) setProdutos(prodRes.data);
        if (fornRes.data) setFornecedores(fornRes.data);
      } catch (error) {
        console.error('Erro:', error);
      } finally {
        setLoadingProdutos(false);
        setLoadingFornecedores(false);
      }
    };
    if (salaoId) fetchDados();
  }, [salaoId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!salaoId) return alert("Erro: Salão não identificado.");
    if (!formData.produto_id || !formData.quantidade || !formData.custo_unitario) return alert("Preencha os campos obrigatórios.");

    setSalvando(true);
    try {
      const movimentacaoData = {
        salao_id: salaoId,
        produto_id: formData.produto_id,
        tipo: 'entrada',
        quantidade: parseInt(formData.quantidade),
        custo_unitario: parseFloat(formData.custo_unitario),
        fornecedor_id: formData.fornecedor_id || null,
        data_movimentacao: formData.data_entrada,
        observacoes: formData.observacoes || null
      };

      const { data: mov, error: movError } = await supabase.from('movimentacoes_estoque').insert([movimentacaoData]).select().single();
      if (movError) throw movError;

      const produtoNome = produtos.find(p => p.id === formData.produto_id)?.nome || 'Produto';
      const despesaData = {
        salao_id: salaoId,
        descricao: `Compra: ${produtoNome}`,
        categoria: 'Produtos',
        valor: parseFloat(formData.custo_unitario) * parseInt(formData.quantidade),
        data_vencimento: new Date().toISOString().split('T')[0],
        pago: true,
        data_pagamento: new Date().toISOString(),
        fornecedor_id: formData.fornecedor_id || null,
        movimentacao_estoque_id: mov.id,
        observacoes: formData.observacoes || null
      };

      await supabase.from('despesas').insert([despesaData]);
      onSucesso();
      onFechar();
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao registrar entrada.');
    } finally {
      setSalvando(false);
    }
  };

  if (!aberto) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-gray-900 border border-gray-700 w-full max-w-md rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden relative">
        <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between bg-gray-900/95 shrink-0">
          <h3 className="text-lg font-bold text-white">Entrada de Estoque</h3>
          <button onClick={onFechar} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
          {/* Campos do formulário aqui (simplificado para garantir export) */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-400">Produto*</label>
            <select value={formData.produto_id} onChange={(e) => setFormData({...formData, produto_id: e.target.value})} className="w-full p-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white outline-none">
              <option value="">Selecione...</option>
              {produtos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
             <input type="number" placeholder="Qtd" value={formData.quantidade} onChange={e => setFormData({...formData, quantidade: e.target.value})} className="w-full p-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white outline-none" />
             <input type="number" placeholder="Custo" value={formData.custo_unitario} onChange={e => setFormData({...formData, custo_unitario: e.target.value})} className="w-full p-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white outline-none" />
          </div>
        </div>
        <div className="p-4 border-t border-gray-800 bg-gray-900/95 flex gap-3 shrink-0">
          <button onClick={onFechar} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-300 hover:bg-gray-800 rounded-xl">Cancelar</button>
          <button onClick={handleSubmit} className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex justify-center items-center gap-2">
            {salvando ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>} Registrar
          </button>
        </div>
      </div>
    </div>, document.body
  );
};