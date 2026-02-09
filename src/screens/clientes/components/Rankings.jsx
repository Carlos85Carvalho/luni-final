import React from 'react';
import { Trophy, Crown } from 'lucide-react';

export const Rankings = ({ clientes }) => {
  
  // Função segura de formatação
  const formatMoney = (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  // Ordena Top do Mês (maior gasto_mes primeiro)
  const topMes = [...clientes]
    .sort((a, b) => (b.gasto_mes || 0) - (a.gasto_mes || 0))
    .slice(0, 3);

  // Ordena Top do Ano (maior gasto_total primeiro)
  const topAno = [...clientes]
    .sort((a, b) => (b.gasto_total || 0) - (a.gasto_total || 0))
    .slice(0, 3);

  const RankingRow = ({ cliente, index, colorClass, valor }) => (
    <div className="flex items-center justify-between p-3 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors rounded-lg">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-lg ${
          index === 0 
            ? `bg-${colorClass}-500 text-white shadow-${colorClass}-500/20` 
            : 'bg-white/10 text-gray-400'
        }`}>
          {index + 1}º
        </div>
        <div>
          <p className="font-bold text-white text-sm">{cliente.nome}</p>
          <p className="text-[10px] text-gray-400">
             {cliente.total_atendimentos} visitas totais
          </p>
        </div>
      </div>
      <div className={`font-bold text-sm ${index === 0 ? `text-${colorClass}-400` : 'text-gray-300'}`}>
        {formatMoney(valor)}
      </div>
    </div>
  );

  return (
    <div className="px-4 mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 pb-10">
      
      {/* CARD AZUL - TOP DO MÊS */}
      <div className="bg-gradient-to-b from-blue-900/20 to-transparent border border-blue-500/30 rounded-3xl p-5">
        <div className="flex items-center gap-2 mb-4 border-b border-blue-500/20 pb-3">
          <div className="p-1.5 bg-blue-500/20 rounded-lg">
            <Trophy className="text-blue-400" size={18}/>
          </div>
          <h3 className="font-bold text-blue-100">Top do Mês</h3>
        </div>
        
        {topMes.length > 0 && topMes[0].gasto_mes > 0 ? (
            topMes.map((c, i) => <RankingRow key={c.id || i} index={i} cliente={c} valor={c.gasto_mes} colorClass="blue" />)
        ) : (
            <div className="text-center py-6 text-gray-500 text-sm">
                Ainda sem vendas este mês.
            </div>
        )}
      </div>

      {/* CARD AMBAR - TOP DO ANO */}
      <div className="bg-gradient-to-b from-amber-900/20 to-transparent border border-amber-500/30 rounded-3xl p-5">
        <div className="flex items-center gap-2 mb-4 border-b border-amber-500/20 pb-3">
          <div className="p-1.5 bg-amber-500/20 rounded-lg">
            <Crown className="text-amber-400" size={18}/>
          </div>
          <h3 className="font-bold text-amber-100">Top do Ano</h3>
        </div>
        
        {topAno.length > 0 && topAno[0].gasto_total > 0 ? (
            topAno.map((c, i) => <RankingRow key={c.id || i} index={i} cliente={c} valor={c.gasto_total} colorClass="amber" />)
        ) : (
            <div className="text-center py-6 text-gray-500 text-sm">
                Nenhuma venda registrada no ano.
            </div>
        )}
      </div>
    </div>
  );
};