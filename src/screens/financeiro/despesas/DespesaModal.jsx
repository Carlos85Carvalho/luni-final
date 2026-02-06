// src/screens/financeiro/despesas/DespesaModal.jsx
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Loader2, Calendar, DollarSign } from 'lucide-react';
import { supabase } from '../../../services/supabase';

export const DespesaModal = ({ aberto, onFechar, onSucesso, despesa }) => {
  const [salvando, setSalvando] = useState(false);
  const [salaoId, setSalaoId] = useState(null);
  // Removi 'categorias' pois elas são fixas no select abaixo
  const [fornecedores, setFornecedores] = useState([]);

  const [formData, setFormData] = useState({
    descricao: '',
    categoria: '',
    valor: '',
    data_vencimento: new Date().toISOString().split('T')[0],
    pago: false,
    fornecedor_id: '',
    observacoes: ''
  });

  // Inicializar com dados da despesa se for edição
  useEffect(() => {
    if (despesa) {
      setFormData({
        descricao: despesa.descricao || '',
        categoria: despesa.categoria || '',
        valor: despesa.valor?.toString().replace('.', ',') || '',
        data_vencimento: despesa.data_vencimento?.split('T')[0] || new Date().toISOString().split('T')[0],
        pago: despesa.pago || false,
        fornecedor_id: despesa.fornecedor_id || '',
        observacoes: despesa.observacoes || ''
      });
    } else {
      // Limpar form se for nova despesa
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
  }, [despesa, aberto]); // Adicionei 'aberto' para resetar quando abrir

  useEffect(() => {
    const fetchDados = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: usuario } = await supabase
        .from('usuarios')
        .select('salao_id')
        .eq('id', user.id)
        .single();

      if (usuario?.salao_id) {
        setSalaoId(usuario.salao_id);
        
        // Buscar fornecedores
        const { data: fornecedoresData } = await supabase
          .from('fornecedores')
          .select('id, nome')
          .eq('salao_id', usuario.salao_id)
          .eq('ativo', true);

        setFornecedores(fornecedoresData || []);
      }
    };

    if (aberto) fetchDados();
  }, [aberto]);

  const parseMoeda = (valor) => {
    if (!valor) return 0;
    const numeroLimpo = valor.toString().replace(/[^0-9.,]/g, '').replace(',', '.');
    return parseFloat(numeroLimpo) || 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!salaoId || !formData.descricao || !formData.valor || !formData.data_vencimento) {
      return alert("Preencha os campos obrigatórios.");
    }

    setSalvando(true);
    try {
      const despesaData = {
        salao_id: salaoId,
        descricao: formData.descricao,
        categoria: formData.categoria || 'Outros',
        valor: parseMoeda(formData.valor),
        data_vencimento: formData.data_vencimento,
        pago: formData.pago,
        fornecedor_id: formData.fornecedor_id || null,
        observacoes: formData.observacoes || null,
        // Só adiciona data_criacao se for novo, para não sobrescrever
        ...(despesa ? {} : { data_criacao: new Date().toISOString() })
      };

      if (despesa) {
        // Atualizar despesa existente
        const { error } = await supabase
          .from('despesas')
          .update(despesaData)
          .eq('id', despesa.id);
        if (error) throw error;
      } else {
        // Criar nova despesa
        const { error } = await supabase
          .from('despesas')
          .insert([despesaData]);
        if (error) throw error;
      }

      onSucesso();
      onFechar();
    } catch (error) {
      console.error('Erro ao salvar despesa:', error);
      alert('Erro ao salvar despesa.');
    } finally {
      setSalvando(false);
    }
  };

  if (!aberto) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
      <div className="bg-gray-900 border border-gray-700 w-full max-w-md rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden relative">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <DollarSign className="w-5 h-5 text-purple-400" />
            </div>
            <h2 className="text-xl font-bold text-white">
              {despesa ? 'Editar Despesa' : 'Nova Despesa'}
            </h2>
          </div>
          <button
            onClick={onFechar}
            className="p-2 hover:bg-gray-800/50 rounded-lg transition-colors"
            disabled={salvando}
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              Descrição*
            </label>
            <input
              type="text"
              value={formData.descricao}
              onChange={e => setFormData({...formData, descricao: e.target.value})}
              className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white outline-none text-sm"
              placeholder="Ex: Conta de luz"
              disabled={salvando}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                Categoria
              </label>
              <select
                value={formData.categoria}
                onChange={e => setFormData({...formData, categoria: e.target.value})}
                className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white outline-none text-sm"
                disabled={salvando}
              >
                <option value="">Selecionar...</option>
                <option value="Aluguel">Aluguel</option>
                <option value="Energia">Energia</option>
                <option value="Água">Água</option>
                <option value="Produtos">Produtos</option>
                <option value="Salários">Salários</option>
                <option value="Marketing">Marketing</option>
                <option value="Manutenção">Manutenção</option>
                <option value="Outros">Outros</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                Valor (R$)*
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={formData.valor}
                  onChange={e => setFormData({...formData, valor: e.target.value})}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white outline-none text-sm"
                  placeholder="0,00"
                  disabled={salvando}
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              Data de Vencimento*
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="date"
                value={formData.data_vencimento}
                onChange={e => setFormData({...formData, data_vencimento: e.target.value})}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white outline-none text-sm [color-scheme:dark]"
                disabled={salvando}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              Fornecedor
            </label>
            <select
              value={formData.fornecedor_id}
              onChange={e => setFormData({...formData, fornecedor_id: e.target.value})}
              className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white outline-none text-sm"
              disabled={salvando}
            >
              <option value="">Sem fornecedor</option>
              {fornecedores.map(f => (
                <option key={f.id} value={f.id}>{f.nome}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-800/30 rounded-xl">
            <input
              type="checkbox"
              id="pago"
              checked={formData.pago}
              onChange={e => setFormData({...formData, pago: e.target.checked})}
              className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-purple-500 focus:ring-purple-500"
              disabled={salvando}
            />
            <label htmlFor="pago" className="text-sm text-gray-300">
              Despesa já paga
            </label>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              Observações
            </label>
            <textarea
              value={formData.observacoes}
              onChange={e => setFormData({...formData, observacoes: e.target.value})}
              className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white outline-none text-sm min-h-[80px] resize-none"
              placeholder="Notas adicionais..."
              disabled={salvando}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-800 bg-gray-900/95 flex gap-3">
          <button
            onClick={onFechar}
            className="flex-1 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800 rounded-xl"
            disabled={salvando}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={salvando}
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg hover:from-purple-600 hover:to-pink-600 transition-all"
          >
            {salvando ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {despesa ? 'Atualizar' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};