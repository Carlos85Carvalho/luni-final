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
  TrendingUp,
  Scissors,
  Menu, // ✅ NOVO
  X      // ✅ NOVO
} from 'lucide-react';

// --- Importação das Telas ---
import { VisaoGeral } from './visao-geral/VisaoGeral';
import { Performance } from './performance/Performance'; 
import { Despesas } from './despesas/Despesas';
import { Estoque } from './estoque/Estoque';
import { Fornecedores } from './fornecedores/Fornecedores';
import { Metas } from './metas/Metas'; 
import { Relatorios } from './relatorios/Relatorios'; 
import { PDV } from './pdv/PDV'; 
import { GestaoServicos } from './servicos/GestaoServicos';

// --- Importação dos Modais ---
import { DespesaModal } from './despesas/DespesaModal';
import { FornecedorModal } from './fornecedores/FornecedorModal';
import { ProdutoModal } from './estoque/ProdutoModal';
import { EstoqueModal } from './estoque/EstoqueModal';
import { MetaModal } from './metas/MetaModal';
import { RelatorioModal } from './relatorios/RelatorioModal';

export const FinanceiroModule = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('visao-geral');
  const [menuAberto, setMenuAberto] = useState(false); // ✅ NOVO

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

  // ✅ FUNÇÃO PARA SELECIONAR ABA E FECHAR MENU
  const selecionarAba = (tabId) => {
    setActiveTab(tabId);
    setMenuAberto(false);
  };

  const tabs = [
    { id: 'visao-geral', label: 'Visão Geral', icon: LayoutDashboard },
    { id: 'performance', label: 'Performance', icon: TrendingUp },
    { id: 'pdv', label: 'PDV', icon: ShoppingCart },
    { id: 'servicos', label: 'Catálogo / Serviços', icon: Scissors },
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
      case 'servicos': return <GestaoServicos />;
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

      {/* ✅ INDICADOR DE ABA ATIVA + HAMBÚRGUER (MOBILE) */}
      <div className="flex md:hidden items-center gap-3 mb-6">
        <div className="flex-1 px-4 py-2.5 rounded-xl bg-purple-600 text-white border border-purple-500 flex items-center gap-2 shadow-lg shadow-purple-900/20">
          {(() => {
            const abaAtiva = tabs.find(t => t.id === activeTab);
            const Icon = abaAtiva?.icon || LayoutDashboard;
            return (
              <>
                <Icon size={18} />
                <span className="text-sm font-medium truncate">{abaAtiva?.label}</span>
              </>
            );
          })()}
        </div>
        
        <button 
          onClick={() => setMenuAberto(!menuAberto)}
          className="p-3 rounded-xl bg-gray-800 border border-gray-700 hover:border-purple-500/40 transition-all"
        >
          {menuAberto ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* ✅ MENU DROPDOWN (MOBILE) */}
      {menuAberto && (
        <div className="md:hidden mb-6 bg-[#18181b] border border-white/10 rounded-2xl overflow-hidden animate-in slide-in-from-top-4 shadow-2xl">
          <div className="p-2 space-y-1">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => selecionarAba(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive 
                    ? 'bg-purple-600 text-white shadow-lg' 
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ✅ NAVEGAÇÃO HORIZONTAL (DESKTOP) */}
      <nav className="hidden md:flex space-x-2 overflow-x-auto pb-4 mb-6 border-b border-gray-800 custom-scrollbar">
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