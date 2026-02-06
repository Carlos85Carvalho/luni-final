// src/screens/financeiro/fornecedores/FornecedorModal.jsx
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Loader2, User, Mail, Phone, FileText, CheckCircle, Building } from 'lucide-react';
import { supabase } from '../../../services/supabase';

export const FornecedorModal = ({ aberto, onFechar, onSucesso, fornecedor }) => {
  const [salvando, setSalvando] = useState(false);
  const [salaoId, setSalaoId] = useState(null);

  const [formData, setFormData] = useState({
    nome: '',
    cnpj_cpf: '',
    email: '',
    telefone: '',
    endereco: '',
    observacoes: '',
    ativo: true
  });

  // Inicializar com dados do fornecedor se for edição
  useEffect(() => {
    if (fornecedor) {
      setFormData({
        nome: fornecedor.nome || '',
        cnpj_cpf: fornecedor.cnpj_cpf || '',
        email: fornecedor.email || '',
        telefone: fornecedor.telefone || '',
        endereco: fornecedor.endereco || '',
        observacoes: fornecedor.observacoes || '',
        ativo: fornecedor.ativo !== undefined ? fornecedor.ativo : true
      });
    } else {
      // Limpar formulário se for novo cadastro
      setFormData({
        nome: '',
        cnpj_cpf: '',
        email: '',
        telefone: '',
        endereco: '',
        observacoes: '',
        ativo: true
      });
    }
  }, [fornecedor, aberto]);

  useEffect(() => {
    const fetchSalao = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: usuario } = await supabase
        .from('usuarios')
        .select('salao_id')
        .eq('id', user.id)
        .single();

      if (usuario?.salao_id) {
        setSalaoId(usuario.salao_id);
      }
    };

    if (aberto) fetchSalao();
  }, [aberto]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!salaoId || !formData.nome) {
      return alert("Preencha pelo menos o nome do fornecedor.");
    }

    setSalvando(true);
    try {
      const fornecedorData = {
        salao_id: salaoId,
        nome: formData.nome,
        cnpj_cpf: formData.cnpj_cpf || null,
        email: formData.email || null,
        telefone: formData.telefone || null,
        endereco: formData.endereco || null,
        observacoes: formData.observacoes || null,
        ativo: formData.ativo,
        // Só adiciona data_cadastro se for novo registro
        ...(fornecedor ? {} : { data_cadastro: new Date().toISOString() })
      };

      if (fornecedor) {
        // Atualizar fornecedor existente
        const { error } = await supabase
          .from('fornecedores')
          .update(fornecedorData)
          .eq('id', fornecedor.id);
        
        if (error) throw error;
      } else {
        // Criar novo fornecedor
        const { error } = await supabase
          .from('fornecedores')
          .insert([fornecedorData]);

        if (error) throw error;
      }

      onSucesso();
      onFechar();
    } catch (error) {
      console.error('Erro ao salvar fornecedor:', error);
      alert('Erro ao salvar fornecedor.');
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
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <Building className="w-5 h-5 text-orange-400" />
            </div>
            <h2 className="text-xl font-bold text-white">
              {fornecedor ? 'Editar Fornecedor' : 'Novo Fornecedor'}
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
              Nome do Fornecedor*
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={formData.nome}
                onChange={e => setFormData({...formData, nome: e.target.value})}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white outline-none text-sm"
                placeholder="Ex: Distribuidora Beleza Total"
                disabled={salvando}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                CNPJ/CPF
              </label>
              <input
                type="text"
                value={formData.cnpj_cpf}
                onChange={e => setFormData({...formData, cnpj_cpf: e.target.value})}
                className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white outline-none text-sm font-mono"
                placeholder="00.000.000/0001-00"
                disabled={salvando}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                Telefone
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="tel"
                  value={formData.telefone}
                  onChange={e => setFormData({...formData, telefone: e.target.value})}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white outline-none text-sm"
                  placeholder="(11) 99999-9999"
                  disabled={salvando}
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white outline-none text-sm"
                placeholder="contato@fornecedor.com"
                disabled={salvando}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              Endereço
            </label>
            <input
              type="text"
              value={formData.endereco}
              onChange={e => setFormData({...formData, endereco: e.target.value})}
              className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white outline-none text-sm"
              placeholder="Rua, Número - Bairro, Cidade"
              disabled={salvando}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              Observações
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <textarea
                value={formData.observacoes}
                onChange={e => setFormData({...formData, observacoes: e.target.value})}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white outline-none text-sm min-h-[80px] resize-none"
                placeholder="Informações adicionais..."
                disabled={salvando}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-800/30 rounded-xl">
            <input
              type="checkbox"
              id="ativo"
              checked={formData.ativo}
              onChange={e => setFormData({...formData, ativo: e.target.checked})}
              className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-orange-500 focus:ring-orange-500"
              disabled={salvando}
            />
            <label htmlFor="ativo" className="text-sm text-gray-300 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Fornecedor ativo
            </label>
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
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg hover:from-orange-600 hover:to-red-600 transition-all"
          >
            {salvando ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {fornecedor ? 'Atualizar' : 'Cadastrar'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};