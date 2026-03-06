import React, { useState, useEffect } from 'react';
import { supabase } from '../../../services/supabase'; // Caminho corrigido!
import { Search, Calendar, CheckCircle2, Clock, ChevronRight, Wallet, TrendingUp, Loader2 } from 'lucide-react';

export const ComissoesScreen = () => {
  const [periodoApuracao, setPeriodoApuracao] = useState('mes');
  const [comissoes, setComissoes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComissoes();
  }, [periodoApuracao]);

  const fetchComissoes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('comissoes')
        .select(`
          id,
          valor_faturado,
          taxa_comissao,
          valor_comissao,
          status,
          profissionais ( nome, especialidade )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const dadosFormatados = data.map(item => ({
          id: item.id,
          nome: item.profissionais?.nome || 'Profissional Removido',
          especialidade: item.profissionais?.especialidade || 'Serviços Gerais',
          faturado: Number(item.valor_faturado),
          taxa: Number(item.taxa_comissao),
          valorComissao: Number(item.valor_comissao),
          status: item.status
        }));
        setComissoes(dadosFormatados);
      }
    } catch (error) {
      console.error('Erro ao buscar comissões:', error);
    } finally {
      setLoading(false);
    }
  };

  const marcarComoPago = async (id) => {
    try {
      const { error } = await supabase
        .from('comissoes')
        .update({ 
          status: 'pago', 
          data_pagamento: new Date().toISOString() 
        })
        .eq('id', id);

      if (error) throw error;
      
      setComissoes(comissoes.map(c => c.id === id ? { ...c, status: 'pago' } : c));
    } catch (error) {
      alert('Erro ao confirmar pagamento: ' + error.message);
    }
  };

  const totalFaturado = comissoes.reduce((acc, curr) => acc + curr.faturado, 0);
  const totalComissoes = comissoes.reduce((acc, curr) => acc + curr.valorComissao, 0);
  const totalPendente = comissoes.filter(c => c.status === 'pendente').reduce((acc, curr) => acc + curr.valorComissao, 0);

  return (
    <div className="p-6 animate-in fade-in duration-300 w-full max-w-7xl mx-auto">
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-100 flex items-center gap-3">
          <Wallet className="text-purple-500" size={32} />
          Fechamento de Comissões
        </h1>
        <p className="text-gray-500 mt-2 font-medium">Acompanhe e realize o pagamento da sua equipe de forma simples.</p>
      </div>

      <div className="bg-[#1c1c21] p-6 rounded-2xl border border-white/5 shadow-lg shadow-black/30 mb-8">
        <div className="flex items-center gap-2 mb-4 text-gray-400 font-bold uppercase tracking-wide text-xs">
          <Calendar size={16} className="text-purple-500" />
          Período de Apuração
        </div>
        
        <div className="flex gap-4">
          {['hoje', 'semana', 'mes'].map((periodo) => (
            <button
              key={periodo}
              onClick={() => setPeriodoApuracao(periodo)}
              className={`flex-1 py-3 rounded-xl font-bold uppercase tracking-wide text-sm transition-all border ${
                periodoApuracao === periodo 
                  ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-900/30' 
                  : 'bg-[#121217] border-white/5 text-gray-500 hover:text-gray-300 hover:bg-[#1a1a24]'
              }`}
            >
              {periodo === 'hoje' ? 'Hoje' : periodo === 'semana' ? 'Esta Semana' : 'Este Mês'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-[#1c1c21] p-6 rounded-2xl border border-white/5 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Total Produzido (Bruto)</p>
          <h3 className="text-3xl font-extrabold text-gray-100">
            R$ {totalFaturado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h3>
          <div className="flex items-center gap-2 mt-3 text-emerald-400 text-xs font-medium">
            <TrendingUp size={14} /> Valor gerado pela equipe
          </div>
        </div>

        <div className="bg-[#1c1c21] p-6 rounded-2xl border border-white/5 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Total de Comissões</p>
          <h3 className="text-3xl font-extrabold text-purple-400">
            R$ {totalComissoes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h3>
          <div className="flex items-center gap-2 mt-3 text-gray-500 text-xs font-medium">
            Parte destinada aos profissionais
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#1c1c21] to-[#121217] p-6 rounded-2xl border border-red-500/20 shadow-lg relative overflow-hidden">
          <p className="text-red-400/80 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
            <Clock size={14} /> Pendente de Pagamento
          </p>
          <h3 className="text-3xl font-extrabold text-red-400">
            R$ {totalPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h3>
          <div className="flex items-center gap-2 mt-3 text-gray-500 text-xs font-medium">
            Aguardando repasse
          </div>
        </div>
      </div>

      <div className="bg-[#1c1c21] rounded-2xl border border-white/5 shadow-xl overflow-hidden min-h-[300px]">
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#18181b]">
          <h3 className="text-lg font-bold text-gray-100">Detalhamento por Profissional</h3>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-600" size={16} />
            <input 
              type="text" 
              placeholder="Buscar profissional..." 
              className="bg-[#121217] border border-white/5 rounded-lg pl-9 pr-4 py-2 text-sm text-gray-300 focus:border-purple-600 outline-none w-64 transition-all focus:w-72"
            />
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
              <Loader2 size={40} className="animate-spin mb-4 text-purple-500" />
              <p>Buscando histórico financeiro...</p>
            </div>
          ) : comissoes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500 animate-in fade-in">
              <Wallet size={48} className="mb-4 text-gray-700" />
              <p className="text-lg font-bold text-gray-400">Nenhuma comissão pendente!</p>
              <p className="text-sm mt-1 mb-8">Os serviços concluídos pela equipe aparecerão aqui.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4 animate-in fade-in">
              {comissoes.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-5 bg-[#121217] border border-white/5 rounded-xl hover:border-white/10 transition-colors group shadow-sm">
                  
                  <div className="flex items-center gap-4 w-1/3">
                    <div className="w-12 h-12 rounded-full bg-[#1c1c21] flex items-center justify-center border border-white/5 text-gray-400 font-bold text-lg shadow-inner uppercase">
                      {item.nome.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-100 text-lg">{item.nome}</h4>
                      <span className="text-xs font-medium text-gray-500">{item.especialidade}</span>
                    </div>
                  </div>

                  <div className="flex gap-8 w-1/3 justify-center">
                    <div className="text-center">
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Produziu</p>
                      <p className="text-gray-300 font-medium text-sm">R$ {item.faturado.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Taxa</p>
                      <p className="text-gray-400 font-medium text-sm bg-white/5 px-2 py-0.5 rounded">{item.taxa}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-purple-400 font-bold uppercase tracking-wider mb-1">Receber</p>
                      <p className="text-purple-400 font-bold text-lg">R$ {item.valorComissao.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                    </div>
                  </div>

                  <div className="w-1/3 flex items-center justify-end gap-4">
                    {item.status === 'pago' ? (
                      <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 text-sm font-bold">
                        <CheckCircle2 size={16} /> Pago
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-1.5 text-red-400 bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20 text-sm font-bold">
                          <Clock size={16} /> Pendente
                        </div>
                        <button 
                          onClick={() => marcarComoPago(item.id)}
                          className="flex items-center gap-1 bg-white text-black hover:bg-gray-200 px-4 py-2 rounded-lg font-bold text-sm transition-transform hover:scale-105 shadow-lg shadow-white/10"
                        >
                          Pagar <ChevronRight size={16} />
                        </button>
                      </>
                    )}
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
};