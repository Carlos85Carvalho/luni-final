import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Loader2, Calendar, DollarSign, Tag, FileText, User, Check } from 'lucide-react';
import { supabase } from '../../services/supabase';

export const DespesaModal = ({ aberto, onFechar, onSucesso, despesa }) => {
  const [salvando, setSalvando] = useState(false);
  const [salaoId, setSalaoId] = useState(null);
  const [fornecedores, setFornecedores] = useState([]);
  const [loadingFornecedores, setLoadingFornecedores] = useState(true);

  const categorias = [
    'Aluguel', 'Energia', 'Água', 'Internet', 'Produtos', 
    'Salários', 'Comissões', 'Marketing', 'Manutenção', 'Impostos', 'Outros'
  ];

  const [formData, setFormData] = useState({
    descricao: '',
    categoria: '',
    valor: '',
    data_vencimento: new Date().toISOString().split('T')[0],
    pago: false,
    fornecedor_id: '',
    observacoes: ''
  });

  // 1. Buscar ID do Salão
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

  // 2. Carregar Fornecedores
  useEffect(() => {
    const fetchFornecedores = async () => {
      if (!salaoId) return;
      setLoadingFornecedores(true);
      try {
        const { data } = await supabase
          .from('fornecedores')
          .select('id, nome')
          .eq('salao_id', salaoId)
          .eq('ativo', true)
          .order('nome');
        setFornecedores(data || []);
      } catch (error) {
        console.error('Erro ao carregar fornecedores:', error);
      } finally {
        setLoadingFornecedores(false);
      }
    };
    if (salaoId) fetchFornecedores();
  }, [salaoId]);

  // 3. Preencher formulário ao editar
  useEffect(() => {
    if (despesa) {
      setFormData({
        descricao: despesa.descricao || '',
        categoria: despesa.categoria || '',
        valor: despesa.valor ? despesa.valor.toString() : '',
        data_vencimento: despesa.data_vencimento ? despesa.data_vencimento.split('T')[0] : new Date().toISOString().split('T')[0],
        pago: despesa.pago || false,
        fornecedor_id: despesa.fornecedor_id || '',
        observacoes: despesa.observacoes || ''
      });
    } else {
      setFormData({
        descricao: '',
        categoria: '',
        valor: '',
        data_vencimento: new Date().toISOString().split('T')[0],
        pago: false,
        fornecedor_id: '',
        observacoes: ''
      });
    }
  }, [despesa, aberto]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!salaoId) return alert("Erro: Salão não identificado.");
    if (!formData.descricao || !formData.categoria || !formData.valor || !formData.data_vencimento) {
      return alert("Preencha todos os campos obrigatórios (*).");
    }

    setSalvando(true);
    try {
      const payload = {
        salao_id: salaoId,
        descricao: formData.descricao,
        categoria: formData.categoria,
        valor: parseFloat(formData.valor.replace(',', '.')),
        data_vencimento: formData.data_vencimento,
        pago: formData.pago,
        data_pagamento: formData.pago ? new Date().toISOString() : null,
        fornecedor_id: formData.fornecedor_id === '' ? null : formData.fornecedor_id,
        observacoes: formData.observacoes || null
      };

      if (despesa?.id) {
        await supabase.from('despesas').update(payload).eq('id', despesa.id);
      } else {
        await supabase.from('despesas').insert([payload]);
      }
      onSucesso();
      onFechar();
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao salvar despesa.');
    } finally {
      setSalvando(false);
    }
  };

  if (!aberto) return null;

  // Usa createPortal para jogar o modal para fora da hierarquia principal (acima do botão rosa)
  return createPortal(
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
      
      {/* Container do Modal - Altura reduzida para max-h-[80vh] para não cobrir tudo */}
      <div className="bg-gray-900 border border-gray-700 w-full max-w-md rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden relative">
        
        {/* Cabeçalho */}
        <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between bg-gray-900/95 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <DollarSign className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white leading-tight">
                {despesa ? 'Editar Despesa' : 'Nova Despesa'}
              </h3>
            </div>
          </div>
          <button 
            onClick={onFechar} 
            className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo com Scroll Personalizado */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
          
          {/* Descrição */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Descrição</label>
            <div className="relative group">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-red-500 transition-colors" />
              <input
                type="text"
                autoFocus
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all outline-none placeholder-gray-600 text-sm"
                placeholder="Ex: Conta de Luz"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Categoria */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Categoria</label>
              <div className="relative group">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-red-500 transition-colors" />
                <select
                  value={formData.categoria}
                  onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                  className="w-full pl-10 pr-2 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all outline-none appearance-none text-sm"
                >
                  <option value="">Selecione...</option>
                  {categorias.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
            </div>

            {/* Valor */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Valor</label>
              <div className="relative group">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">R$</span>
                <input
                  type="number"
                  step="0.01"
                  value={formData.valor}
                  onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all outline-none placeholder-gray-600 text-sm font-medium"
                  placeholder="0,00"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Vencimento */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Vencimento</label>
              <div className="relative group">
                <input
                  type="date"
                  value={formData.data_vencimento}
                  onChange={(e) => setFormData({ ...formData, data_vencimento: e.target.value })}
                  className="w-full px-3 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all outline-none text-sm [color-scheme:dark]"
                />
              </div>
            </div>

            {/* Fornecedor */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Fornecedor</label>
              <div className="relative group">
                <select
                  value={formData.fornecedor_id}
                  onChange={(e) => setFormData({ ...formData, fornecedor_id: e.target.value })}
                  className="w-full px-3 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all outline-none appearance-none text-sm disabled:opacity-50"
                  disabled={loadingFornecedores}
                >
                  <option value="">Sem fornecedor</option>
                  {fornecedores.map(f => (
                    <option key={f.id} value={f.id}>{f.nome}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Observações</label>
            <textarea
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all outline-none h-20 resize-none placeholder-gray-600 text-sm"
              placeholder="Detalhes opcionais..."
            />
          </div>

          {/* Toggle Pago */}
          <div 
            onClick={() => setFormData(prev => ({ ...prev, pago: !prev.pago }))}
            className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
              formData.pago 
                ? 'bg-green-500/10 border-green-500/50' 
                : 'bg-gray-800/50 border-gray-700 hover:bg-gray-800'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                formData.pago 
                  ? 'bg-green-500 border-green-500' 
                  : 'border-gray-500 bg-transparent'
              }`}>
                {formData.pago && <Check className="w-3.5 h-3.5 text-white" />}
              </div>
              <span className={`text-sm font-medium ${formData.pago ? 'text-green-400' : 'text-gray-300'}`}>
                Despesa Paga
              </span>
            </div>
          </div>

        </div>

        {/* Rodapé Fixo */}
        <div className="p-4 border-t border-gray-800 bg-gray-900/95 flex gap-3 shrink-0">
          <button
            type="button"
            onClick={onFechar}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-300 hover:bg-gray-800 rounded-xl transition-colors border border-transparent hover:border-gray-700"
            disabled={salvando}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={salvando}
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-red-900/20 disabled:opacity-50 transition-all hover:scale-[1.02]"
          >
            {salvando ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Salvar
              </>
            )}
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};