// src/screens/financeiro/fornecedores/ComprasFornecedorModal.jsx
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ShoppingCart, Calendar, Package, Loader2 } from 'lucide-react';
import { supabase } from '../../../services/supabase';

export const ComprasFornecedorModal = ({ aberto, onFechar, fornecedor }) => {
  const [loading, setLoading] = useState(true);
  const [compras, setCompras] = useState([]);
  // salaoId não precisa ser state se for usado apenas dentro do useEffect, 
  // mas mantive a lógica para garantir segurança
  
  useEffect(() => {
    const fetchCompras = async () => {
      if (!aberto || !fornecedor) return;

      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: usuario } = await supabase
          .from('usuarios')
          .select('salao_id')
          .eq('id', user.id)
          .single();

        if (!usuario?.salao_id) return;

        const { data: comprasData } = await supabase
          .from('despesas')
          .select('*') // Simplifiquei para garantir que todos os campos venham corretamente
          .eq('fornecedor_id', fornecedor.id)
          .eq('salao_id', usuario.salao_id)
          .order('data_vencimento', { ascending: false });

        setCompras(comprasData || []);
      } catch (error) {
        console.error('Erro ao carregar compras:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompras();
  }, [aberto, fornecedor]);

  if (!aberto || !fornecedor) return null;

  const totalGasto = compras.reduce((acc, compra) => acc + (compra.valor || 0), 0);

  return createPortal(
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
      <div className="bg-gray-900 border border-gray-700 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden relative">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <ShoppingCart className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Compras do Fornecedor</h2>
              <p className="text-sm text-gray-400">{fornecedor.nome}</p>
            </div>
          </div>
          <button
            onClick={onFechar}
            className="p-2 hover:bg-gray-800/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Resumo */}
        <div className="p-6 border-b border-gray-800">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gray-800/50 p-4 rounded-xl">
              <p className="text-sm text-gray-400">Total de Compras</p>
              <p className="text-2xl font-bold text-white">{compras.length}</p>
            </div>
            <div className="bg-gray-800/50 p-4 rounded-xl">
              <p className="text-sm text-gray-400">Total Gasto</p>
              <p className="text-2xl font-bold text-green-400">
                R$ {totalGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-gray-800/50 p-4 rounded-xl">
              <p className="text-sm text-gray-400">Status</p>
              <div className="flex items-center gap-2 mt-1">
                <div className={`w-3 h-3 rounded-full ${fornecedor.ativo ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-white">{fornecedor.ativo ? 'Ativo' : 'Inativo'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Compras */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
            </div>
          ) : compras.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Nenhuma compra registrada</p>
            </div>
          ) : (
            <div className="space-y-4">
              {compras.map((compra) => (
                <div key={compra.id} className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <Package className="w-4 h-4 text-gray-400" />
                        <h4 className="font-medium text-white">{compra.descricao}</h4>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1 text-gray-400">
                          <Calendar className="w-3 h-3" />
                          {compra.data_vencimento 
                            ? new Date(compra.data_vencimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) 
                            : '-'}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          compra.pago 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-orange-500/20 text-orange-400'
                        }`}>
                          {compra.pago ? 'Pago' : 'Pendente'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-white">
                        R$ {(compra.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      {compra.categoria && (
                        <span className="text-xs text-gray-400 bg-gray-700/50 px-2 py-1 rounded inline-block mt-1">
                          {compra.categoria}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-800 bg-gray-900/95">
          <button
            onClick={onFechar}
            className="w-full px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};