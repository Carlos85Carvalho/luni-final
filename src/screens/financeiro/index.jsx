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
  Menu,
  X,
  Wallet // ÍCONE NOVO IMPORTADO AQUI
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
import { ComissoesScreen } from './comissoes/ComissoesScreen'; // TELA NOVA IMPORTADA AQUI

// --- Importação dos Modais ---
import { DespesaModal } from './despesas/DespesaModal';
import { FornecedorModal } from './fornecedores/FornecedorModal';
import { ProdutoModal } from './estoque/ProdutoModal';
import { EstoqueModal } from './estoque/EstoqueModal';
import { MetaModal } from './metas/MetaModal';
import { RelatorioModal } from './relatorios/RelatorioModal';

export const FinanceiroModule = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('visao-geral');
  const [menuAberto, setMenuAberto] = useState(false);

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

  const selecionarAba = (tabId) => {
    setActiveTab(tabId);
    setMenuAberto(false);
  };

  // --- ARRAY DE ABAS ATUALIZADO ---
  const tabs = [
    { id: 'visao-geral', label: 'Visão Geral', icon: LayoutDashboard },
    { id: 'performance', label: 'Performance', icon: TrendingUp },
    { id: 'pdv', label: 'PDV', icon: ShoppingCart },
    { id: 'servicos', label: 'Catálogo / Serviços', icon: Scissors },
    { id: 'despesas', label: 'Despesas', icon: Receipt },
    { id: 'comissoes', label: 'Comissões', icon: Wallet }, // ABA NOVA INSERIDA AQUI
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
      case 'comissoes': return <ComissoesScreen />; // ROTA NOVA ADICIONADA AQUI
      case 'estoque': return <Estoque onAbrirModal={handleAbrirModal} />;
      case 'fornecedores': return <Fornecedores onAbrirModal={handleAbrirModal} />;
      case 'metas': return <Metas onAbrirModal={handleAbrirModal} />;
      case 'relatorios': return <Relatorios onAbrirModal={handleAbrirModal} />;
      default: return <VisaoGeral onAbrirModal={handleAbrirModal} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-4 md:p-8 relative overflow-x-hidden">
      
      {/* HEADER PRINCIPAL */}
      <header className="mb-6 flex items-center gap-4 relative z-40">
        <button 
          onClick={onClose}
          className="p-2 hover:bg-gray-800 rounded-xl transition-colors text-gray-400 hover:text-white"
        >
          <ChevronLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight">
            Financeiro Luni
          </h1>
          <p className="text-gray-400 text-sm hidden md:block">Gestão profissional para salões de alta performance.</p>
        </div>
      </header>

      {/* ========================================================= */}
      {/* 📱 MODO MOBILE: INDICADOR DE ABA ATIVA + HAMBÚRGUER */}
      {/* ========================================================= */}
      <div className="md:hidden flex items-center gap-3 mb-6 relative z-40">
        <button 
          onClick={() => setMenuAberto(!menuAberto)}
          className="flex-1 px-4 py-3 rounded-xl bg-purple-600/90 hover:bg-purple-600 text-white border border-purple-500/50 flex items-center gap-3 shadow-lg shadow-purple-900/20 transition-all active:scale-95"
        >
          {(() => {
            const abaAtiva = tabs.find(t => t.id === activeTab);
            const Icon = abaAtiva?.icon || LayoutDashboard;
            return (
              <>
                <Icon size={20} />
                <span className="text-[15px] font-semibold flex-1 text-left">{abaAtiva?.label}</span>
                {menuAberto ? <X size={20} className="text-white/70" /> : <Menu size={20} className="text-white/70" />}
              </>
            );
          })()}
        </button>
      </div>

      {/* ========================================================= */}
      {/* 📱 MODO MOBILE: MENU DROPDOWN "FLUTUANTE" */}
      {/* ========================================================= */}
      {menuAberto && (
        <div 
          className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity"
          onClick={() => setMenuAberto(false)}
        />
      )}

      <div className={`
        md:hidden absolute top-[140px] left-4 right-4 z-50 bg-[#18181b] border border-white/10 rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 transform origin-top
        ${menuAberto ? 'scale-y-100 opacity-100' : 'scale-y-0 opacity-0 pointer-events-none'}
      `}>
        <div className="p-2 space-y-1 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => selecionarAba(tab.id)}
                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-medium transition-all ${
                  isActive 
                  ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' 
                  : 'text-gray-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className={`p-1.5 rounded-lg ${isActive ? 'bg-purple-500/20' : 'bg-gray-800'}`}>
                  <Icon size={18} className={isActive ? 'text-purple-400' : 'text-gray-400'} />
                </div>
                {tab.label}
                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-purple-500" />}
              </button>
            );
          })}
        </div>
      </div>


      {/* ========================================================= */}
      {/* 💻 MODO DESKTOP: NAVEGAÇÃO HORIZONTAL */}
      {/* ========================================================= */}
      <nav className="hidden md:flex space-x-2 overflow-x-auto pb-4 mb-6 border-b border-gray-800 custom-scrollbar relative z-30">
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

      {/* ÁREA DE CONTEÚDO */}
      <main className="min-h-[500px] pb-24 relative z-10">
        {renderContent()}
      </main>


      {/* MODAIS (MANTIDOS INTACTOS) */}
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