import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { 
  Plus, Search, Filter, Download, Edit, 
  Trash2, CheckCircle, XCircle, Clock, AlertCircle,
  DollarSign, Tag, FileText, ChevronDown,
  Loader2, X, ArrowLeft, Calendar
} from 'lucide-react';

export const DespesasScreen = ({ onClose }) => {
  const [loading, setLoading] = useState(true);
  const [despesas, setDespesas] = useState([]);
  const [filtros, setFiltros] = useState({
    status: 'todas',
    categoria: 'todas',
    mes: new Date().getMonth() + 1,
    ano: new Date().getFullYear()
  });
  const [showFiltros, setShowFiltros] = useState(false);
  const [showNovaDespesa, setShowNovaDespesa] = useState(false);
  const [categorias, setCategorias] = useState([]);
  const [estatisticas, setEstatisticas] = useState({
    total: 0,
    pagas: 0,
    pendentes: 0,
    vencidas: 0,
    aVencer: 0
  });

  // Formulário nova despesa
  const [novaDespesa, setNovaDespesa] = useState({
    descricao: '',
    categoria: '',
    valor: '',
    data_vencimento: '',
    pago: false,
    observacoes: ''
  });

  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  useEffect(() => {
    carregarDespesas();
    carregarCategorias();
  }, [filtros]);

  const carregarDespesas = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: usu } = await supabase
        .from('usuarios')
        .select('salao_id')
        .eq('id', user.id)
        .maybeSingle();

      if (!usu?.salao_id) return;

      let query = supabase
        .from('despesas')
        .select('*')
        .eq('salao_id', usu.salao_id)
        .order('data_vencimento', { ascending: true });

      // Aplicar filtros
      if (filtros.status !== 'todas') {
        query = query.eq('pago', filtros.status === 'pagas');
      }

      if (filtros.categoria !== 'todas') {
        query = query.eq('categoria', filtros.categoria);
      }

      // Filtrar por mês/ano
      const inicioMes = new Date(filtros.ano, filtros.mes - 1, 1);
      const fimMes = new Date(filtros.ano, filtros.mes, 0);
      
      query = query
        .gte('data_vencimento', inicioMes.toISOString().split('T')[0])
        .lte('data_vencimento', fimMes.toISOString().split('T')[0]);

      const { data, error } = await query;
      
      if (error) throw error;

      if (data) {
        setDespesas(data);
        calcularEstatisticas(data);
      }
    } catch (error) {
      console.error('Erro ao carregar despesas:', error);
    } finally {
      setLoading(false);
    }
  };

  const carregarCategorias = async () => {
    try {
      const { data, error } = await supabase
        .from('despesas')
        .select('categoria')
        .not('categoria', 'is', null);

      if (error) throw error;

      if (data) {
        const categoriasUnicas = [...new Set(data.map(d => d.categoria))].filter(Boolean);
        setCategorias(categoriasUnicas);
      }
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  const calcularEstatisticas = (despesasLista) => {
    const hoje = new Date();
    const seteDias = new Date();
    seteDias.setDate(hoje.getDate() + 7);

    const estatisticasCalc = {
      total: 0,
      pagas: 0,
      pendentes: 0,
      vencidas: 0,
      aVencer: 0
    };

    despesasLista.forEach(despesa => {
      const valor = Number(despesa.valor || 0);
      estatisticasCalc.total += valor;

      if (despesa.pago) {
        estatisticasCalc.pagas += valor;
      } else {
        estatisticasCalc.pendentes += valor;

        const vencimento = new Date(despesa.data_vencimento);
        if (vencimento < hoje) {
          estatisticasCalc.vencidas += valor;
        } else if (vencimento <= seteDias) {
          estatisticasCalc.aVencer += valor;
        }
      }
    });

    setEstatisticas(estatisticasCalc);
  };

  const handleNovaDespesa = async (e) => {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: usu } = await supabase.from('usuarios').select('salao_id').eq('id', user.id).maybeSingle();

      if (!usu?.salao_id) return;

      const { error } = await supabase.from('despesas').insert([{
        ...novaDespesa,
        salao_id: usu.salao_id,
        valor: parseFloat(novaDespesa.valor),
        created_at: new Date().toISOString()
      }]);

      if (error) throw error;

      setNovaDespesa({ descricao: '', categoria: '', valor: '', data_vencimento: '', pago: false, observacoes: '' });
      setShowNovaDespesa(false);
      carregarDespesas();
      alert('Despesa cadastrada com sucesso!');
    } catch (error) {
      console.error('Erro ao cadastrar despesa:', error);
      alert('Erro ao cadastrar despesa.');
    }
  };

  const handlePagarDespesa = async (id, valorPago) => {
    try {
      const { error } = await supabase.from('despesas').update({ pago: valorPago }).eq('id', id);
      if (error) throw error;
      carregarDespesas();
    } catch (error) {
      console.error('Erro ao atualizar:', error);
    }
  };

  const handleExcluirDespesa = async (id) => {
    if (!confirm('Tem certeza que deseja excluir?')) return;
    try {
      const { error } = await supabase.from('despesas').delete().eq('id', id);
      if (error) throw error;
      carregarDespesas();
    } catch (error) {
      console.error('Erro ao excluir:', error);
    }
  };

  const getStatusVencimento = (dataVencimento, pago) => {
    if (pago) return { texto: 'Pago', cor: 'bg-green-100 text-green-800', icone: CheckCircle };
    const hoje = new Date();
    const vencimento = new Date(dataVencimento);
    const diffDias = Math.ceil((vencimento - hoje) / (1000 * 60 * 60 * 24));

    if (diffDias < 0) return { texto: 'Vencida', cor: 'bg-red-100 text-red-800', icone: AlertCircle };
    if (diffDias === 0) return { texto: 'Vence hoje', cor: 'bg-orange-100 text-orange-800', icone: Clock };
    if (diffDias <= 7) return { texto: `Vence em ${diffDias} dias`, cor: 'bg-yellow-100 text-yellow-800', icone: Clock };
    return { texto: 'No prazo', cor: 'bg-blue-100 text-blue-800', icone: CheckCircle };
  };

  return (
    <div className="fixed inset-0 bg-gray-50 z-50 overflow-y-auto">
      {/* 1. Header Organizado com Botão Voltar */}
      <div className="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            
            {/* Esquerda: Botão Voltar + Título */}
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <button
                onClick={onClose}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Voltar</span>
              </button>
              <div className="h-6 w-px bg-gray-300 hidden sm:block"></div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                  Gestão de Despesas
                </h1>
              </div>
            </div>

            {/* Centro: Seletor de Período (Destaque) */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <div className="flex items-center px-3 gap-2 text-gray-500 border-r border-gray-200">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm font-medium">Período</span>
                </div>
                <select
                  className="bg-transparent border-none text-sm font-medium text-gray-900 focus:ring-0 cursor-pointer py-1.5 pl-3 pr-8"
                  value={`${filtros.mes}-${filtros.ano}`}
                  onChange={(e) => {
                    const [mes, ano] = e.target.value.split('-');
                    setFiltros(prev => ({ ...prev, mes: parseInt(mes), ano: parseInt(ano) }));
                  }}
                >
                  {Array.from({ length: 12 }, (_, i) => {
                    const date = new Date();
                    date.setMonth(date.getMonth() - i);
                    return (
                      <option key={i} value={`${date.getMonth() + 1}-${date.getFullYear()}`}>
                        {meses[date.getMonth()]} {date.getFullYear()}
                      </option>
                    );
                  })}
                </select>
            </div>

            {/* Direita: Ações Principais */}
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button onClick={() => alert('Em breve')} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg" title="Exportar">
                <Download className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowNovaDespesa(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 shadow-sm transition-all hover:shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm font-medium">Nova Despesa</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* 2. Cards de Estatísticas (Grid Melhorado) */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard label="Total" value={estatisticas.total} icon={DollarSign} color="gray" />
          <StatCard label="Pagas" value={estatisticas.pagas} icon={CheckCircle} color="green" />
          <StatCard label="Pendentes" value={estatisticas.pendentes} icon={Clock} color="orange" />
          <StatCard label="Vencidas" value={estatisticas.vencidas} icon={AlertCircle} color="red" />
          <div className="col-span-2 md:col-span-1">
             <StatCard label="A Vencer (7d)" value={estatisticas.aVencer} icon={Clock} color="yellow" />
          </div>
        </div>

        {/* 3. Barra de Busca e Filtros */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por descrição..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-shadow"
              />
            </div>
            
            <button
              onClick={() => setShowFiltros(!showFiltros)}
              className={`px-4 py-2 border rounded-lg flex items-center gap-2 transition-colors ${showFiltros ? 'bg-purple-50 border-purple-200 text-purple-700' : 'border-gray-300 hover:bg-gray-50'}`}
            >
              <Filter className="w-4 h-4" />
              <span>Filtros</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showFiltros ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {showFiltros && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100 animate-in fade-in slide-in-from-top-2">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Status</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-purple-500 focus:border-purple-500"
                  value={filtros.status}
                  onChange={(e) => setFiltros(prev => ({ ...prev, status: e.target.value }))}
                >
                  <option value="todas">Todos</option>
                  <option value="pagas">Pagas</option>
                  <option value="pendentes">Pendentes</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Categoria</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-purple-500 focus:border-purple-500"
                  value={filtros.categoria}
                  onChange={(e) => setFiltros(prev => ({ ...prev, categoria: e.target.value }))}
                >
                  <option value="todas">Todas</option>
                  {categorias.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div className="flex items-end">
                <button
                    onClick={() => setFiltros(prev => ({ ...prev, status: 'todas', categoria: 'todas' }))}
                    className="w-full px-4 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                    Limpar Filtros
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 4. Lista de Despesas */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-purple-600 animate-spin mb-2" />
              <p className="text-gray-500 text-sm">Carregando despesas...</p>
            </div>
          ) : despesas.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">Nenhuma despesa encontrada</h3>
              <p className="text-gray-500 mb-6 max-w-sm mx-auto">Neste período não há registros. Que tal adicionar uma nova despesa?</p>
              <button
                onClick={() => setShowNovaDespesa(true)}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Cadastrar Despesa
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-6 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Descrição</th>
                    <th className="py-3 px-6 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Categoria</th>
                    <th className="py-3 px-6 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Valor</th>
                    <th className="py-3 px-6 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Vencimento</th>
                    <th className="py-3 px-6 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="py-3 px-6 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {despesas.map((despesa) => {
                    const status = getStatusVencimento(despesa.data_vencimento, despesa.pago);
                    const StatusIcon = status.icone;
                    return (
                      <tr key={despesa.id} className="hover:bg-gray-50 transition-colors group">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-white transition-colors border border-transparent group-hover:border-gray-200">
                              <Tag className="w-4 h-4 text-gray-500" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{despesa.descricao}</div>
                              {despesa.observacoes && <div className="text-xs text-gray-500 truncate max-w-[200px]">{despesa.observacoes}</div>}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                            {despesa.categoria || 'Geral'}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-sm font-semibold text-gray-900">
                            R$ {Number(despesa.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                           <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                {new Date(despesa.data_vencimento).toLocaleDateString('pt-BR')}
                           </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium gap-1 ${status.cor}`}>
                            <StatusIcon className="w-3 h-3" />
                            {status.texto}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handlePagarDespesa(despesa.id, !despesa.pago)}
                              className={`p-1.5 rounded-md transition-colors ${despesa.pago ? 'text-yellow-600 hover:bg-yellow-50' : 'text-green-600 hover:bg-green-50'}`}
                              title={despesa.pago ? 'Marcar pendente' : 'Marcar pago'}
                            >
                              {despesa.pago ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                            </button>
                            <button 
                                onClick={() => handleExcluirDespesa(despesa.id)}
                                className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal Nova Despesa (Mantido igual, apenas ajuste visual leve se necessário) */}
      {showNovaDespesa && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Nova Despesa</h2>
              <button onClick={() => setShowNovaDespesa(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleNovaDespesa} className="p-6 space-y-4">
              {/* ... Campos do formulário (mantidos os mesmos do seu código original) ... */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Descrição *</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-shadow"
                  value={novaDespesa.descricao}
                  onChange={(e) => setNovaDespesa(prev => ({ ...prev, descricao: e.target.value }))}
                  placeholder="Ex: Aluguel, Luz, Fornecedor..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Categoria</label>
                    <select
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        value={novaDespesa.categoria}
                        onChange={(e) => setNovaDespesa(prev => ({ ...prev, categoria: e.target.value }))}
                    >
                        <option value="">Selecione...</option>
                        {categorias.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        <option value="Operacional">Operacional</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Pessoal">Pessoal</option>
                    </select>
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Valor *</label>
                    <input
                        type="number" step="0.01" required min="0"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        value={novaDespesa.valor}
                        onChange={(e) => setNovaDespesa(prev => ({ ...prev, valor: e.target.value }))}
                        placeholder="0,00"
                    />
                 </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Vencimento *</label>
                    <input
                        type="date" required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        value={novaDespesa.data_vencimento}
                        onChange={(e) => setNovaDespesa(prev => ({ ...prev, data_vencimento: e.target.value }))}
                    />
                 </div>
                 <div className="flex items-end pb-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            className="rounded text-purple-600 focus:ring-purple-500 w-5 h-5 border-gray-300"
                            checked={novaDespesa.pago}
                            onChange={(e) => setNovaDespesa(prev => ({ ...prev, pago: e.target.checked }))}
                        />
                        <span className="text-sm text-gray-700 font-medium">Já foi pago?</span>
                    </label>
                 </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Observações</label>
                <textarea
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows="3"
                  value={novaDespesa.observacoes}
                  onChange={(e) => setNovaDespesa(prev => ({ ...prev, observacoes: e.target.value }))}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowNovaDespesa(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-colors shadow-sm">
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente auxiliar para os cards (Fica mais limpo)
const StatCard = ({ label, value, icon: Icon, color }) => {
  const colorClasses = {
    gray: 'text-gray-600 bg-gray-50',
    green: 'text-green-600 bg-green-50',
    orange: 'text-orange-600 bg-orange-50',
    red: 'text-red-600 bg-red-50',
    yellow: 'text-yellow-600 bg-yellow-50'
  };

  return (
    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between h-full">
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs font-semibold text-gray-500 uppercase">{label}</span>
        <div className={`p-1.5 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <span className={`text-xl font-bold ${colorClasses[color].split(' ')[0]}`}>
        R$ {value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
      </span>
    </div>
  );
};