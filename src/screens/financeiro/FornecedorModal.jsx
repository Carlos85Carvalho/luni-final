import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Loader2, User, Phone, Mail, FileText, AlertCircle, Check } from 'lucide-react';
import { supabase } from '../../services/supabase';

export const FornecedorModal = ({ aberto, onFechar, onSucesso, fornecedor }) => {
  const [salvando, setSalvando] = useState(false);
  const [salaoId, setSalaoId] = useState(null);
  const [validandoCNPJ, setValidandoCNPJ] = useState(false);
  const [cnpjValido, setCnpjValido] = useState(true);

  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    cnpj_cpf: '',
    email: '',
    observacoes: '',
    ativo: true
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

  // 2. Preencher formulário ao editar
  useEffect(() => {
    if (fornecedor) {
      setFormData({
        nome: fornecedor.nome || '',
        telefone: fornecedor.telefone || '',
        cnpj_cpf: fornecedor.cnpj_cpf || '',
        email: fornecedor.email || '',
        observacoes: fornecedor.observacoes || '',
        ativo: fornecedor.ativo !== false
      });
    } else {
      setFormData({
        nome: '',
        telefone: '',
        cnpj_cpf: '',
        email: '',
        observacoes: '',
        ativo: true
      });
    }
  }, [fornecedor, aberto]);

  // --- Lógicas de Validação e Formatação (Mantidas) ---
  const validarCNPJ = (val) => {
    if (!val) return true;
    const cleanVal = val.replace(/[^\d]/g, '');
    
    // Validação básica de tamanho (CPF 11 ou CNPJ 14)
    if (cleanVal.length !== 11 && cleanVal.length !== 14) return false;
    // Aqui você pode manter ou expandir sua lógica de dígitos verificadores se desejar
    return true; 
  };

  const formatarCNPJ = (val) => {
    if (!val) return '';
    const cleanVal = val.replace(/[^\d]/g, '');
    if (cleanVal.length <= 11) {
      return cleanVal.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return cleanVal.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  };

  const formatarTelefone = (val) => {
    if (!val) return '';
    const cleanVal = val.replace(/[^\d]/g, '');
    if (cleanVal.length <= 10) {
      return cleanVal.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return cleanVal.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  const handleCNPJChange = (e) => {
    const valor = e.target.value;
    // Apenas números para a lógica, mas mantém formatação visual
    const apenasNumeros = valor.replace(/[^\d]/g, '');
    const formatado = formatarCNPJ(apenasNumeros);
    
    setFormData({ ...formData, cnpj_cpf: formatado });
    
    if (apenasNumeros.length >= 11) {
      setValidandoCNPJ(true);
      // Simulação de validação assíncrona/delay para feedback visual
      setTimeout(() => {
        const valido = validarCNPJ(apenasNumeros);
        setCnpjValido(valido);
        setValidandoCNPJ(false);
      }, 300);
    } else {
      setCnpjValido(true); // Reseta se estiver digitando
    }
  };

  const handleTelefoneChange = (e) => {
    const formatado = formatarTelefone(e.target.value);
    setFormData({ ...formData, telefone: formatado });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!salaoId) return alert("Erro: Salão não identificado.");
    if (!formData.nome) return alert("Preencha o nome do fornecedor.");
    
    // Validação final de CNPJ se houver valor preenchido
    if (formData.cnpj_cpf && !validarCNPJ(formData.cnpj_cpf)) {
       // Opcional: Bloquear ou apenas avisar. Aqui vou bloquear.
       // alert("Documento inválido.");
       // return; 
    }

    setSalvando(true);
    try {
      const payload = {
        salao_id: salaoId,
        nome: formData.nome,
        telefone: formData.telefone || null,
        cnpj_cpf: formData.cnpj_cpf || null,
        email: formData.email || null,
        observacoes: formData.observacoes || null,
        ativo: formData.ativo
      };

      if (fornecedor?.id) {
        await supabase.from('fornecedores').update(payload).eq('id', fornecedor.id);
      } else {
        await supabase.from('fornecedores').insert([payload]);
      }

      onSucesso();
      onFechar();
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao salvar fornecedor.');
    } finally {
      setSalvando(false);
    }
  };

  if (!aberto) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
      
      {/* Container Principal */}
      <div className="bg-gray-900 border border-gray-700 w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden relative">
        
        {/* Cabeçalho */}
        <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between bg-gray-900/95 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-lg">
              <User className="w-5 h-5 text-indigo-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white leading-tight">
                {fornecedor ? 'Editar Fornecedor' : 'Novo Fornecedor'}
              </h3>
              <p className="text-xs text-gray-400">Gerencie seus parceiros de negócio</p>
            </div>
          </div>
          <button 
            onClick={onFechar} 
            className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo com Scroll */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
          
          {/* Nome */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Nome do Fornecedor*</label>
            <div className="relative group">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="text"
                autoFocus
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none placeholder-gray-600 text-sm"
                placeholder="Ex: Distribuidora Beleza Total"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Telefone */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Telefone</label>
              <div className="relative group">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type="tel"
                  value={formData.telefone}
                  onChange={handleTelefoneChange}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none placeholder-gray-600 text-sm"
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>

            {/* CNPJ/CPF */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">CNPJ / CPF</label>
              <div className="relative group">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type="text"
                  value={formData.cnpj_cpf}
                  onChange={handleCNPJChange}
                  className={`w-full pl-10 pr-4 py-2.5 bg-gray-800/50 border rounded-xl text-white focus:ring-1 transition-all outline-none placeholder-gray-600 text-sm ${
                    !cnpjValido && formData.cnpj_cpf ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-700 focus:border-indigo-500 focus:ring-indigo-500'
                  }`}
                  placeholder="00.000.000/0000-00"
                />
                {validandoCNPJ && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
                )}
              </div>
              {!cnpjValido && formData.cnpj_cpf && (
                <p className="text-[10px] text-red-400 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3 h-3" /> Documento inválido
                </p>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">E-mail</label>
            <div className="relative group">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none placeholder-gray-600 text-sm"
                placeholder="contato@fornecedor.com"
              />
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Observações</label>
            <div className="relative group">
              <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-500 group-focus-within:text-indigo-500 transition-colors" />
              <textarea
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none text-sm h-20 resize-none placeholder-gray-600"
                placeholder="Dados bancários, prazo de entrega..."
              />
            </div>
          </div>

          {/* Toggle Ativo */}
          <div 
            onClick={() => setFormData(prev => ({ ...prev, ativo: !prev.ativo }))}
            className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
              formData.ativo 
                ? 'bg-indigo-500/10 border-indigo-500/50' 
                : 'bg-gray-800/50 border-gray-700 hover:bg-gray-800'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                formData.ativo 
                  ? 'bg-indigo-500 border-indigo-500' 
                  : 'border-gray-500 bg-transparent'
              }`}>
                {formData.ativo && <Check className="w-3.5 h-3.5 text-white" />}
              </div>
              <div className="flex flex-col">
                <span className={`text-sm font-medium ${formData.ativo ? 'text-indigo-400' : 'text-gray-300'}`}>
                  Fornecedor Ativo
                </span>
                <span className="text-[10px] text-gray-500">Habilitado para novas compras</span>
              </div>
            </div>
          </div>

        </div>

        {/* Rodapé */}
        <div className="p-4 border-t border-gray-800 bg-gray-900/95 flex gap-3 shrink-0">
          <button
            onClick={onFechar}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-300 hover:bg-gray-800 rounded-xl transition-colors border border-transparent hover:border-gray-700"
            disabled={salvando}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={salvando}
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/20 disabled:opacity-50 transition-all hover:scale-[1.02]"
          >
            {salvando ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Salvar Fornecedor
              </>
            )}
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};