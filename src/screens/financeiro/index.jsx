import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Receipt, 
  Package, 
  Users, 
  Target, 
  FileText, 
  ChevronLeft,
  ShoppingCart,
  TrendingUp 
} from 'lucide-react';

// --- Importação das Telas ---
import { VisaoGeral } from './visao-geral/VisaoGeral';
import { Performance } from './performance/Performance'; 
import { Despesas } from './despesas/Despesas';
import { Estoque } from './estoque/Estoque';
import { Fornecedores } from './fornecedores/Fornecedores';
import { Metas } from './metas/Metas'; 
// CORREÇÃO: Caminho alterado para 'relatorios' (minúsculo)
import { Relatorios } from './relatorios/Relatorios'; 
import { PDV } from './pdv/PDV'; 

// --- Importação dos Modais ---
import { DespesaModal } from './despesas/DespesaModal';
import { FornecedorModal } from './fornecedores/FornecedorModal';
import { ProdutoModal } from './estoque/ProdutoModal';
import { EstoqueModal } from './estoque/EstoqueModal';
import { MetaModal } from './metas/MetaModal';
// CORREÇÃO: Caminho alterado para 'relatorios' (minúsculo)
import { RelatorioModal } from './relatorios/RelatorioModal';

export const FinanceiroModule = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('visao-geral');

  // --- LÓGICA DOS MODAIS ---
  const [modal, setModal] = useState({
    view: null, 
    dados: null,
    isOpen: false
  });

  const handleAbrirModal = (view, dados = null) => {
    setModal({ view, dados, isOpen: true });
  };

  const handleFecharModal = () => {
    setModal(prev => ({ ...prev, isOpen: false }));
    setTimeout(() => setModal({ view: null, dados: null, isOpen: false }), 200);
  };

  const handleSucesso = () => {
    console.log('Operação salva com sucesso!');
    handleFecharModal(); 
  };

  const tabs = [
    { id: 'visao-geral', label: 'Visão Geral', icon: LayoutDashboard },
    { id: 'performance', label: 'Performance', icon: TrendingUp },
    { id: 'pdv', label: 'PDV', icon: ShoppingCart }, 
    { id: 'despesas', label: 'Despesas', icon: Receipt },
    { id: 'estoque', label: 'Estoque', icon: Package },
    { id: 'fornecedores', label: 'Fornecedores', icon: Users },
    { id: 'metas', label: 'Metas', icon: Target },
    { id: 'relatorios', label: 'Relatórios', icon: FileText },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'visao-geral': return <VisaoGeral onAbrirModal={handleAbrirModal} />;
      case 'performance': return <Performance />; 
      case 'pdv': return <PDV />; 
      case 'despesas': return <Despesas onAbrirModal={handleAbrirModal} />;
      case 'estoque': return <Estoque onAbrirModal={handleAbrirModal} />;
      case 'fornecedores': return <Fornecedores onAbrirModal={handleAbrirModal} />;
      case 'metas': return <Metas onAbrirModal={handleAbrirModal} />;
      case 'relatorios': return <Relatorios onAbrirModal={handleAbrirModal} />;
      default: return <VisaoGeral onAbrirModal={handleAbrirModal} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-4 md:p-8 relative">
      <header className="mb-8 flex items-center gap-4">
        <button 
          onClick={onClose}
          className="p-2 hover:bg-gray-800 rounded-xl transition-colors text-gray-400 hover:text-white"
        >
          <ChevronLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Financeiro Luni
          </h1>
          <p className="text-gray-400 text-sm">Gestão profissional para salões de alta performance.</p>
        </div>
      </header>

      <nav className="flex space-x-2 overflow-x-auto pb-4 mb-6 border-b border-gray-800 custom-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap
                ${isActive 
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </nav>

      <main className="min-h-[500px] pb-24">
        {renderContent()}
      </main>

      {modal.isOpen && (
        <>
          <DespesaModal
            aberto={modal.view === 'nova-despesa' || modal.view === 'editar-despesa'}
            onFechar={handleFecharModal}
            onSucesso={handleSucesso}
            despesa={modal.view === 'editar-despesa' ? modal.dados : null}
          />

          <FornecedorModal
            aberto={modal.view === 'novo-fornecedor' || modal.view === 'editar-fornecedor'}
            onFechar={handleFecharModal}
            onSucesso={handleSucesso}
            fornecedor={modal.view === 'editar-fornecedor' ? modal.dados : null}
          />

          <ProdutoModal
            aberto={modal.view === 'novo-produto' || modal.view === 'editar-produto'}
            onFechar={handleFecharModal}
            onSucesso={handleSucesso}
            produto={modal.view === 'editar-produto' ? modal.dados : null}
          />

          <EstoqueModal 
            aberto={modal.view === 'movimentar-estoque' || modal.view === 'entrada-estoque' || modal.view === 'saida-estoque'}
            onFechar={handleFecharModal}
            onSucesso={handleSucesso}
          />

          <MetaModal
            aberto={modal.view === 'nova-meta' || modal.view === 'editar-meta'}
            onFechar={handleFecharModal}
            onSucesso={handleSucesso}
            meta={modal.view === 'editar-meta' ? modal.dados : null}
          />

          <RelatorioModal
            aberto={
              modal.view === 'novo-relatorio' || 
              modal.view === 'visualizar-relatorio' || 
              modal.view === 'preview-relatorio'
            }
            onFechar={handleFecharModal}
            tipo={modal.dados?.tipo || 'financeiro'}
            periodo={modal.dados?.periodo || 'mes'}
            dados={modal.dados?.resumo ? modal.dados : null} 
          />
        </>
      )}
    </div>
  );
};