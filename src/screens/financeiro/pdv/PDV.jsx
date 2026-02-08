// src/screens/financeiro/pdv/PDV.jsx
import React, { useState } from 'react';
import { PDVHeader } from './PDVHeader';
import { PDVGrid } from './PDVGrid';
import { PDVCart } from './PDVCart';
import { PDVModals } from './PDVModals';

export const PDV = () => {
  // Estados locais do PDV podem ficar aqui ou no Context/Service
  // Exemplo de layout: Header no topo, Grid na esquerda, Carrinho na direita

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] gap-4">
      {/* Cabeçalho do PDV */}
      <div className="flex-none">
        <PDVHeader />
      </div>

      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* Área de Produtos (Grid) - Ocupa maior parte */}
        <div className="flex-1 bg-gray-900/50 rounded-xl border border-gray-800 overflow-hidden">
          <PDVGrid />
        </div>

        {/* Área do Carrinho - Lateral direita fixa */}
        <div className="w-[400px] bg-gray-900/50 rounded-xl border border-gray-800 overflow-hidden">
          <PDVCart />
        </div>
      </div>

      {/* Modais específicos do PDV (Pagamento, etc) */}
      <PDVModals />
    </div>
  );
};