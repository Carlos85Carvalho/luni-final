import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Wallet, 
  Package, 
  Truck, 
  Target, 
  FileText,
  Plus,
  AlertTriangle 
} from 'lucide-react';

// --- Importação das Telas ---
import { VisaoGeral } from './VisaoGeral';
import { Despesas } from '../despesas/Despesas'; 
import { Estoque } from '../estoque/Estoque';
import { Fornecedores } from '../fornecedores/Fornecedores';

// --- Importação dos Modais ---
import { DespesaModal } from '../despesas/DespesaModal';
import { FornecedorModal } from '../fornecedores/FornecedorModal';
import { ProdutoModal } from '../estoque/ProdutoModal'; 
import { ModalEntradaEstoque } from '../estoque/ModalEntradaEstoque'; 

// Componente para telas em desenvolvimento
const TelaEmBreve = ({ titulo }) => (
  <div className="flex flex-col items-center justify-center h-full text-gray-400 border border-gray-800 rounded-2xl bg-gray-900/50 p-10 mt-4">
    <AlertTriangle size={48} className="mb-4 text-yellow-500" />
    <h3 className="text-xl font-bold text-white mb-2">{titulo}</h3>
    <p>Funcionalidade em desenvolvimento.</p>
  </div>
);

export const FinanceiroScreen = () => {
  const [abaAtiva, setAbaAtiva] = useState('visao-geral');
  
  // Estado global para gerenciar qual modal está aberto
  const [modal, setModal] = useState({
    view: null, // ex: 'nova-despesa', 'novo-produto', etc.
    dados: null,
    isOpen: false
  });

  const handleAbrirModal = (view, dados = null) => {
    console.log('--- ABRINDO MODAL ---', view, dados);
    setModal({ view, dados, isOpen: true });
  };

  const handleFecharModal = () => {
    setModal({ ...modal, isOpen: false });
    setTimeout(() => setModal({ view: null, dados: null, isOpen: false }), 200);
  };

  const handleSucesso = () => {
    console.log('Operação concluída com sucesso');
    // Aqui você pode adicionar lógica para recarregar dados se necessário
  };

  // Lógica do Botão Flutuante (+)
  const handleFabClick = () => {
    console.log('Botão + clicado na aba:', abaAtiva);
    switch (abaAtiva) {
      case 'despesas': handleAbrirModal('nova-despesa'); break;
      case 'estoque': handleAbrirModal('novo-produto'); break;
      case 'fornecedores': handleAbrirModal('novo-fornecedor'); break;
      default: console.log('Sem ação para esta aba'); break;
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
      <div className="flex-1 p-4 sm:p-6 lg:p-8 pt-2 overflow-y-auto pb-24">
        
        {/* AQUI ESTAVA O ERRO: Adicionamos onAbrirModal em todos */}
        {abaAtiva === 'visao-geral' && <VisaoGeral onAbrirModal={handleAbrirModal} />}
        
        {abaAtiva === 'despesas' && <Despesas onAbrirModal={handleAbrirModal} />}
        
        {abaAtiva === 'estoque' && <Estoque onAbrirModal={handleAbrirModal} />}
        
        {abaAtiva === 'fornecedores' && <Fornecedores onAbrirModal={handleAbrirModal} />}
        
        {/* Telas Desativadas Temporariamente */}
        {abaAtiva === 'metas' && <TelaEmBreve titulo="Gestão de Metas" />}
        {abaAtiva === 'relatorios' && <TelaEmBreve titulo="Relatórios Avançados" />}
      </div>

      {/* --- BOTÃO FLUTUANTE (FAB) --- */}
      {['despesas', 'estoque', 'fornecedores'].includes(abaAtiva) && (
        <button
          onClick={handleFabClick}
          className="fixed bottom-24 right-6 p-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full shadow-lg shadow-purple-500/30 hover:scale-110 transition-transform flex items-center justify-center cursor-pointer z-50"
          title="Adicionar Novo"
        >
          <Plus size={24} />
        </button>
      )}

      {/* --- MODAIS --- */}
      
      <DespesaModal
        aberto={modal.isOpen && (modal.view === 'nova-despesa' || modal.view === 'editar-despesa')}
        // Passamos 'isOpen' também por segurança, mas seu modal usa 'aberto'
        isOpen={modal.isOpen && (modal.view === 'nova-despesa' || modal.view === 'editar-despesa')}
        onFechar={handleFecharModal}
        onSucesso={handleSucesso}
        despesa={modal.view === 'editar-despesa' ? modal.dados : null}
      />

      <FornecedorModal
        aberto={modal.isOpen && (modal.view === 'novo-fornecedor' || modal.view === 'editar-fornecedor')}
        isOpen={modal.isOpen && (modal.view === 'novo-fornecedor' || modal.view === 'editar-fornecedor')}
        onFechar={handleFecharModal}
        onSucesso={handleSucesso}
        fornecedor={modal.view === 'editar-fornecedor' ? modal.dados : null}
      />

      <ProdutoModal
        aberto={modal.isOpen && (modal.view === 'novo-produto' || modal.view === 'editar-produto')}
        isOpen={modal.isOpen && (modal.view === 'novo-produto' || modal.view === 'editar-produto')}
        onFechar={handleFecharModal}
        onSucesso={handleSucesso}
        produto={modal.view === 'editar-produto' ? modal.dados : null}
      />

      <ModalEntradaEstoque 
        aberto={modal.isOpen && modal.view === 'movimentar-estoque'}
        isOpen={modal.isOpen && modal.view === 'movimentar-estoque'}
        onFechar={handleFecharModal}
        onSucesso={handleSucesso}
      />

    </div>
  );
};