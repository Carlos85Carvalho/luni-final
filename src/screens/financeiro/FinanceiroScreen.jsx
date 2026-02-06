// src/screens/financeiro/visao-geral/FinanceiroScreen.jsx
import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Wallet, 
  Package, 
  Truck, 
  Target, 
  FileText,
  Plus // Importante: Importar o ícone Plus
} from 'lucide-react';

// --- Importação das Telas ---
import { VisaoGeral } from './VisaoGeral';
import { Despesas } from '../despesas/Despesas';
import { Estoque } from '../estoque/Estoque';
import { Fornecedores } from '../fornecedores/Fornecedores';
import { Metas } from '../metas/Metas';
import { Relatorios } from '../relatorios/Relatorios';

// --- Importação dos Modais ---
import { DespesaModal } from '../despesas/DespesaModal';
import { FornecedorModal } from '../fornecedores/FornecedorModal';
import { MetaModal } from '../metas/MetaModal';
import { RelatorioModal } from '../relatorios/RelatorioModal';
// Nota: Se você tiver o EstoqueModal, descomente a importação abaixo
// import { EstoqueModal } from '../estoque/EstoqueModal';

export const FinanceiroScreen = () => {
  const [abaAtiva, setAbaAtiva] = useState('visao-geral');
  
  // Estado global para gerenciar qual modal está aberto
  const [modal, setModal] = useState({
    view: null, // ex: 'nova-despesa', 'novo-produto', etc.
    dados: null,
    isOpen: false
  });

  const handleAbrirModal = (view, dados = null) => {
    console.log('Abrindo modal:', view, dados);
    setModal({ view, dados, isOpen: true });
  };

  const handleFecharModal = () => {
    setModal({ ...modal, isOpen: false });
    setTimeout(() => setModal({ view: null, dados: null, isOpen: false }), 200);
  };

  const handleSucesso = () => {
    // Ação após salvar (ex: refresh), se necessário
    // handleFecharModal();
  };

  // Lógica do Botão Flutuante (+)
  const handleFabClick = () => {
    switch (abaAtiva) {
      case 'despesas':
        handleAbrirModal('nova-despesa');
        break;
      case 'estoque':
        handleAbrirModal('novo-produto'); // Requer EstoqueModal implementado
        break;
      case 'fornecedores':
        handleAbrirModal('novo-fornecedor');
        break;
      case 'metas':
        handleAbrirModal('nova-meta');
        break;
      default:
        console.log('Sem ação para esta aba');
        break;
    }
  };

  const menuItens = [
    { id: 'visao-geral', label: 'Visão Geral', icon: LayoutDashboard },
    { id: 'despesas', label: 'Despesas', icon: Wallet },
    { id: 'estoque', label: 'Estoque', icon: Package },
    { id: 'fornecedores', label: 'Fornecedores', icon: Truck },
    { id: 'metas', label: 'Metas', icon: Target },
    { id: 'relatorios', label: 'Relatórios', icon: FileText },
  ];

  return (
    <div className="flex flex-col h-full bg-[#0a0a0f] min-h-screen text-white relative">
      
      {/* Header e Navegação */}
      <div className="p-4 sm:p-6 lg:p-8 pb-0">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Financeiro Luni
          </h1>
          <p className="text-gray-400 mt-1">
            Gestão profissional para salões de alta performance.
          </p>
        </div>

        {/* Menu de Abas */}
        <div className="flex overflow-x-auto pb-4 gap-2 custom-scrollbar">
          {menuItens.map((item) => {
            const Icon = item.icon;
            const isActive = abaAtiva === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setAbaAtiva(item.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                  isActive 
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' 
                    : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800 hover:text-white border border-transparent hover:border-gray-700'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Área de Conteúdo */}
      <div className="flex-1 p-4 sm:p-6 lg:p-8 pt-2 overflow-y-auto">
        {abaAtiva === 'visao-geral' && (
          <VisaoGeral onAbrirModal={handleAbrirModal} />
        )}
        
        {abaAtiva === 'despesas' && (
          <Despesas onAbrirModal={handleAbrirModal} />
        )}

        {abaAtiva === 'estoque' && (
          <Estoque onAbrirModal={handleAbrirModal} />
        )}

        {abaAtiva === 'fornecedores' && (
          <Fornecedores onAbrirModal={handleAbrirModal} />
        )}

        {abaAtiva === 'metas' && (
          <Metas onAbrirModal={handleAbrirModal} />
        )}

        {abaAtiva === 'relatorios' && (
          <Relatorios onAbrirModal={handleAbrirModal} />
        )}
      </div>

      {/* --- BOTÃO FLUTUANTE (FAB) --- */}
      {/* Só aparece nas abas que têm ação de criar */}
      {['despesas', 'estoque', 'fornecedores', 'metas'].includes(abaAtiva) && (
        <button
          onClick={handleFabClick}
          className="fixed bottom-6 right-6 p-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full shadow-lg shadow-purple-500/30 hover:scale-110 transition-transform z-50 flex items-center justify-center"
          aria-label="Adicionar Novo"
        >
          <Plus size={24} />
        </button>
      )}

      {/* --- Gerenciador de Modais --- */}
      
      <DespesaModal
        aberto={modal.isOpen && (modal.view === 'nova-despesa' || modal.view === 'editar-despesa')}
        onFechar={handleFecharModal}
        onSucesso={handleSucesso}
        despesa={modal.view === 'editar-despesa' ? modal.dados : null}
      />

      <FornecedorModal
        aberto={modal.isOpen && (modal.view === 'novo-fornecedor' || modal.view === 'editar-fornecedor')}
        onFechar={handleFecharModal}
        onSucesso={handleSucesso}
        fornecedor={modal.view === 'editar-fornecedor' ? modal.dados : null}
      />

      <MetaModal
        aberto={modal.isOpen && (modal.view === 'nova-meta' || modal.view === 'editar-meta')}
        onFechar={handleFecharModal}
        onSucesso={handleSucesso}
        meta={modal.view === 'editar-meta' ? modal.dados : null}
      />

      <RelatorioModal
        aberto={modal.isOpen && (modal.view === 'visualizar-relatorio' || modal.view === 'preview-relatorio')}
        onFechar={handleFecharModal}
        tipo={modal.dados?.tipo || (modal.view === 'preview-relatorio' ? modal.dados?.tipo : null)}
        periodo={modal.dados?.periodo}
        dados={modal.view === 'visualizar-relatorio' ? modal.dados?.dados : null}
      />

      {/* Se você tiver o modal de estoque, descomente e ajuste aqui: */}
      {/* <EstoqueModal 
          aberto={modal.isOpen && modal.view === 'novo-produto'} 
          onFechar={handleFecharModal}
      /> 
      */}

    </div>
  );
};