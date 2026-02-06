import React, { useState } from 'react';
import { LayoutDashboard, Receipt, Package, Users, PieChart, Target, ChevronLeft } from 'lucide-react';
import { VisaoGeral } from './visao-geral/VisaoGeral';
import { Despesas } from './despesas/Despesas';
import { Estoque } from './estoque/Estoque';
import { Fornecedores } from './fornecedores/Fornecedores';

// 1. Recebemos a prop onClose aqui
export const FinanceiroModule = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('visao-geral');

  const tabs = [
    { id: 'visao-geral', label: 'Visão Geral', icon: LayoutDashboard },
    { id: 'despesas', label: 'Despesas', icon: Receipt },
    { id: 'estoque', label: 'Estoque', icon: Package },
    { id: 'fornecedores', label: 'Fornecedores', icon: Users },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'visao-geral': return <VisaoGeral />;
      case 'despesas': return <Despesas />;
      case 'estoque': return <Estoque />;
      case 'fornecedores': return <Fornecedores />;
      default: return <VisaoGeral />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
      {/* Header do Módulo */}
      <header className="mb-8 flex items-center gap-4">
        {/* 2. Botão de Voltar para o Dashboard */}
        <button 
          onClick={onClose}
          className="p-2 hover:bg-gray-800 rounded-xl transition-colors text-gray-400 hover:text-white"
          title="Voltar ao Painel"
        >
          <ChevronLeft size={24} />
        </button>

        <div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Financeiro Luni
          </h1>
          <p className="text-gray-400 text-sm">Gestão profissional para salões de alta performance.</p>
        </div>
      </header>

      {/* Menu de Navegação (Tabs) */}
      <nav className="flex space-x-2 overflow-x-auto pb-4 mb-6 border-b border-gray-800">
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

      {/* Área de Conteúdo */}
      <main className="min-h-[500px]">
        {renderContent()}
      </main>
    </div>
  );
};