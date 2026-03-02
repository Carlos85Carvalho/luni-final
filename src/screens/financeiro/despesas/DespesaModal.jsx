// src/screens/financeiro/despesas/DespesaModal.jsx
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Loader2, Calendar, DollarSign, Repeat } from 'lucide-react'; 
import { supabase } from '../../../services/supabase';

export const DespesaModal = ({ aberto, onFechar, onSucesso, despesa }) => {
  const [salvando, setSalvando] = useState(false);
  const [salaoId, setSalaoId] = useState(null);
  const [fornecedores, setFornecedores] = useState([]);

  const [formData, setFormData] = useState({
    descricao: '',
    categoria: '',
    valor: '',
    data_vencimento: new Date().toISOString().split('T')[0],
    pago: false,
    recorrente: false, 
    fornecedor_id: '',
    observacoes: ''
  });

  useEffect(() => {
    if (despesa) {
      setFormData({
        descricao: despesa.descricao || '',
        categoria: despesa.categoria || '',
        valor: despesa.valor?.toString().replace('.', ',') || '',
        data_vencimento: despesa.data_vencimento?.split('T')[0] || new Date().toISOString().split('T')[0],
        pago: despesa.status === 'pago', 
        recorrente: despesa.recorrente || false,
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
        recorrente: false,
        fornecedor_id: '',
        observacoes: ''
      });
    }
  }, [despesa, aberto]);

  useEffect(() => {
    const fetchDados = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: usuario } = await supabase.from('usuarios').select('salao_id').eq('id', user.id).single();
      if (usuario?.salao_id) {
        setSalaoId(usuario.salao_id);
        const { data } = await supabase.from('fornecedores').select('id, nome').eq('salao_id', usuario.salao_id).eq('ativo', true);
        setFornecedores(data || []);
      }
    };
    if (aberto) fetchDados();
  }, [aberto]);

  const parseMoeda = (valor) => {
    if (!valor) return 0;
    const numeroLimpo = valor.toString().replace(/[^0-9.,]/g, '').replace(',', '.');
    return parseFloat(numeroLimpo) || 0;
  };

  // 🚀 NOVA FUNÇÃO BLINDADA
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!salaoId || !formData.descricao || !formData.valor || !formData.data_vencimento) {
      return alert("Preencha os campos obrigatórios.");
    }

    setSalvando(true);
    try {
      const valorLimpo = parseMoeda(formData.valor);

      if (despesa) {
        // --- MODO EDIÇÃO ---
        const despesaAtualizada = {
          descricao: formData.descricao,
          categoria: formData.categoria || 'Outros',
          valor: valorLimpo,
          data_vencimento: formData.data_vencimento,
          pago: formData.pago, // Compatibilidade com banco antigo
          status: formData.pago ? 'pago' : 'pendente', // Compatibilidade com banco novo
          recorrente: formData.recorrente,
          fornecedor_id: formData.fornecedor_id || null,
          observacoes: formData.observacoes || null
        };
        const { error } = await supabase.from('despesas').update(despesaAtualizada).eq('id', despesa.id);
        if (error) throw error;

      } else {
        // --- MODO NOVA DESPESA (CRIAÇÃO EM LOTE) ---
        const contasParaInserir = [];
        
        // Pega ano, mês e dia com segurança
        const [anoStr, mesStr, diaStr] = formData.data_vencimento.split('-');
        const anoBase = parseInt(anoStr, 10);
        const mesBase = parseInt(mesStr, 10) - 1; // Mês no JS vai de 0 a 11
        const diaBase = parseInt(diaStr, 10);

        // Se marcou recorrente, gera o mês atual + 11 meses para frente (1 ano inteiro)
        const mesesParaCriar = formData.recorrente ? 12 : 1;

        for (let i = 0; i < mesesParaCriar; i++) {
          // Matemática segura para virar o ano (Ex: Dezembro -> Janeiro)
          let mesAtual = mesBase + i;
          let anoAtual = anoBase + Math.floor(mesAtual / 12);
          mesAtual = mesAtual % 12;

          // Trava de segurança para meses com 28, 30 ou 31 dias
          const ultimoDiaDoMes = new Date(anoAtual, mesAtual + 1, 0).getDate();
          const diaSeguro = diaBase > ultimoDiaDoMes ? ultimoDiaDoMes : diaBase;

          // Monta a data no padrão perfeito do banco: YYYY-MM-DD
          const dataFormatada = `${anoAtual}-${String(mesAtual + 1).padStart(2, '0')}-${String(diaSeguro).padStart(2, '0')}`;
          
          // Verifica se é a primeira fatura (a de hoje) para aplicar o status de "Já Paga"
          const isPrimeiraParcela = i === 0;
          const isPago = isPrimeiraParcela ? formData.pago : false;

          contasParaInserir.push({
            salao_id: salaoId,
            descricao: formData.descricao,
            categoria: formData.categoria || 'Outros',
            valor: valorLimpo,
            data_vencimento: dataFormatada,
            pago: isPago, // Compatibilidade
            status: isPago ? 'pago' : 'pendente', // Compatibilidade
            recorrente: formData.recorrente,
            fornecedor_id: formData.fornecedor_id || null,
            observacoes: formData.observacoes || null,
            data_criacao: new Date().toISOString()
          });
        }

        // Insere as 12 parcelas no banco em 1 segundo
        const { error } = await supabase.from('despesas').insert(contasParaInserir);
        if (error) throw error;
      }

      onSucesso();
      onFechar();
    } catch (error) {
      console.error('Erro ao salvar despesa:', error);
      alert('Houve um erro de comunicação com o banco de dados. Olhe o F12 (Console) para detalhes.');
    } finally {
      setSalvando(false);
    }
  };

  if (!aberto) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-gray-900 border border-gray-700 w-full max-w-md rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden relative">
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <DollarSign className="w-5 h-5 text-purple-400" />
            </div>
            <h2 className="text-xl font-bold text-white">{despesa ? 'Editar Despesa' : 'Nova Despesa'}</h2>
          </div>
          <button onClick={onFechar} className="p-2 hover:bg-gray-800 rounded-lg"><X className="w-5 h-5 text-gray-400" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-400 uppercase">Descrição*</label>
            <input type="text" value={formData.descricao} onChange={e => setFormData({...formData, descricao: e.target.value})} className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white outline-none text-sm" placeholder="Ex: Aluguel" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400 uppercase">Categoria</label>
              <select value={formData.categoria} onChange={e => setFormData({...formData, categoria: e.target.value})} className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white outline-none text-sm">
                <option value="Outros">Outros</option>
                <option value="Aluguel">Aluguel</option>
                <option value="Energia">Energia</option>
                <option value="Produtos">Produtos</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400 uppercase">Valor (R$)*</label>
              <input type="text" value={formData.valor} onChange={e => setFormData({...formData, valor: e.target.value})} className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white outline-none text-sm" placeholder="0,00" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-400 uppercase">Data de Vencimento*</label>
            <input type="date" value={formData.data_vencimento} onChange={e => setFormData({...formData, data_vencimento: e.target.value})} className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white outline-none text-sm [color-scheme:dark]" />
          </div>

          {/* 🚀 ÁREA DE CONFIGURAÇÕES DE PAGAMENTO E RECORRÊNCIA */}
          <div className="grid grid-cols-1 gap-2 pt-2">
            <div className="flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl cursor-pointer hover:bg-emerald-500/20 transition-colors" onClick={() => setFormData({...formData, pago: !formData.pago})}>
              <input type="checkbox" checked={formData.pago} readOnly className="w-5 h-5 rounded border-gray-600 text-emerald-500" />
              <label className="text-sm text-emerald-400 font-medium cursor-pointer">Despesa já paga</label>
            </div>

            <div className="flex items-center gap-3 p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl cursor-pointer hover:bg-purple-500/20 transition-colors" onClick={() => setFormData({...formData, recorrente: !formData.recorrente})}>
              <Repeat className={`w-5 h-5 ${formData.recorrente ? 'text-purple-400' : 'text-gray-600'}`} />
              <input type="checkbox" checked={formData.recorrente} readOnly className="w-5 h-5 rounded border-gray-600 text-purple-500" />
              <div className="flex flex-col">
                <label className="text-sm text-purple-400 font-medium cursor-pointer">Conta Recorrente</label>
                <span className="text-[10px] text-gray-500">Repetir automaticamente todos os meses</span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-400 uppercase">Observações</label>
            <textarea value={formData.observacoes} onChange={e => setFormData({...formData, observacoes: e.target.value})} className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white outline-none text-sm min-h-[60px] resize-none" />
          </div>
        </div>

        <div className="p-6 border-t border-gray-800 flex gap-3">
          <button onClick={onFechar} className="flex-1 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800 rounded-xl">Cancelar</button>
          <button onClick={handleSubmit} disabled={salvando} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] transition-all">
            {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {despesa ? 'Atualizar' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};