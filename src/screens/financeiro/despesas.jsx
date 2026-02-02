import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { 
  Plus, Search, Filter, Edit, 
  Trash2, CheckCircle, Clock, AlertCircle,
  DollarSign, Tag, FileText, ChevronDown,
  Loader2, ArrowLeft, Calendar, Save, X
} from 'lucide-react';

export const DespesasScreen = ({ onClose }) => {
  // --- ESTADOS ---
  const [loading, setLoading] = useState(true);
  const [despesas, setDespesas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  
  // 'lista' | 'formulario'
  const [visualizacao, setVisualizacao] = useState('lista'); 
  
  const [filtros, setFiltros] = useState({
    status: 'todas',
    categoria: 'todas',
    mes: new Date().getMonth() + 1,
    ano: new Date().getFullYear()
  });
  const [showFiltros, setShowFiltros] = useState(false);
  const [estatisticas, setEstatisticas] = useState({ total: 0, pagas: 0, pendentes: 0, vencidas: 0, aVencer: 0 });

  const [formDespesa, setFormDespesa] = useState({
    id: null,
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

  // --- EFEITOS ---
  useEffect(() => {
    carregarDespesas();
    carregarCategorias();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros]);

  // --- LÓGICA DE DADOS ---
  const carregarDespesas = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: usu } = await supabase.from('usuarios').select('salao_id').eq('id', user.id).maybeSingle();

      if (!usu?.salao_id) return;

      let query = supabase
        .from('despesas')
        .select('*')
        .eq('salao_id', usu.salao_id)
        .order('data_vencimento', { ascending: true });

      if (filtros.status !== 'todas') query = query.eq('pago', filtros.status === 'pagas');
      if (filtros.categoria !== 'todas') query = query.eq('categoria', filtros.categoria);

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
      console.error('Erro ao carregar:', error);
    } finally {
      setLoading(false);
    }
  };

  const carregarCategorias = async () => {
    try {
      const { data } = await supabase.from('despesas').select('categoria').not('categoria', 'is', null);
      if (data) setCategorias([...new Set(data.map(d => d.categoria))].filter(Boolean));
    } catch (error) { console.error(error); }
  };

  const calcularEstatisticas = (lista) => {
    const hoje = new Date();
    const seteDias = new Date();
    seteDias.setDate(hoje.getDate() + 7);

    const stats = { total: 0, pagas: 0, pendentes: 0, vencidas: 0, aVencer: 0 };

    lista.forEach(d => {
      const val = Number(d.valor || 0);
      stats.total += val;
      if (d.pago) {
        stats.pagas += val;
      } else {
        stats.pendentes += val;
        const venc = new Date(d.data_vencimento);
        if (venc < hoje) stats.vencidas += val;
        else if (venc <= seteDias) stats.aVencer += val;
      }
    });
    setEstatisticas(stats);
  };

  // --- LÓGICA DO FORMULÁRIO ---
  const abrirNovoCadastro = () => {
    setFormDespesa({
      id: null, descricao: '', categoria: '', valor: '',
      data_vencimento: '', pago: false, observacoes: ''
    });
    setVisualizacao('formulario');
  };

  const abrirEdicao = (despesa) => {
    setFormDespesa({
      id: despesa.id,
      descricao: despesa.descricao,
      categoria: despesa.categoria,
      valor: despesa.valor,
      data_vencimento: despesa.data_vencimento,
      pago: despesa.pago,
      observacoes: despesa.observacoes || ''
    });
    setVisualizacao('formulario');
  };

  const salvarDespesa = async (e) => {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: usu } = await supabase.from('usuarios').select('salao_id').eq('id', user.id).maybeSingle();
      if (!usu?.salao_id) return;

      const dadosParaSalvar = {
        salao_id: usu.salao_id,
        descricao: formDespesa.descricao,
        categoria: formDespesa.categoria,
        valor: parseFloat(formDespesa.valor || 0), // Proteção contra valor vazio
        data_vencimento: formDespesa.data_vencimento,
        pago: formDespesa.pago,
        observacoes: formDespesa.observacoes
      };

      let error;
      if (formDespesa.id) {
        const res = await supabase.from('despesas').update(dadosParaSalvar).eq('id', formDespesa.id);
        error = res.error;
      } else {
        const res = await supabase.from('despesas').insert([{ ...dadosParaSalvar, created_at: new Date().toISOString() }]);
        error = res.error;
      }

      if (error) throw error;

      alert(formDespesa.id ? 'Despesa atualizada!' : 'Despesa cadastrada!');
      setVisualizacao('lista');
      carregarDespesas();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar despesa.');
    }
  };

  const handlePagar = async (id, status) => {
    await supabase.from('despesas').update({ pago: status }).eq('id', id);
    carregarDespesas();
  };

  const handleExcluir = async (id) => {
    if (confirm('Excluir esta despesa?')) {
      await supabase.from('despesas').delete().eq('id', id);
      carregarDespesas();
    }
  };

  // --- RENDERIZAÇÃO ---

  // 1. Header (Ajustado para não usar fixed e respeitar o Wrapper)
  const renderHeader = () => (
    <div className="bg-white border-b rounded-t-xl mb-4">
      <div className="px-4 sm:px-6 py-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={visualizacao === 'lista' ? onClose : () => setVisualizacao('lista')}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-purple-600" />
              {visualizacao === 'lista' ? 'Gestão de Despesas' : formDespesa.id ? 'Editar Despesa' : 'Nova Despesa'}
            </h1>
          </div>

          {visualizacao === 'lista' && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="flex items-center bg-gray-100 rounded-lg px-3 py-1.5 flex-1 sm:flex-none">
                <Calendar className="w-4 h-4 text-gray-500 mr-2" />
                <select
                  className="bg-transparent border-none text-sm font-medium text-gray-900 focus:ring-0 cursor-pointer w-full"
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

              <button
                onClick={abrirNovoCadastro}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 shadow-sm whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm font-medium hidden sm:inline">Nova</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderLista = () => (
    <div className="space-y-6">
      {/* Cards Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard label="Total" value={estatisticas.total} icon={DollarSign} color="gray" />
        <StatCard label="Pagas" value={estatisticas.pagas} icon={CheckCircle} color="green" />
        <StatCard label="Pendentes" value={estatisticas.pendentes} icon={Clock} color="orange" />
        <StatCard label="Vencidas" value={estatisticas.vencidas} icon={AlertCircle} color="red" />
        <div className="col-span-2 md:col-span-1">
          <StatCard label="A Vencer" value={estatisticas.aVencer} icon={Clock} color="yellow" />
        </div>
      </div>

      {/* Busca e Filtros */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="Buscar..." className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full text-sm focus:ring-2 focus:ring-purple-500 outline-none" />
          </div>
          <button onClick={() => setShowFiltros(!showFiltros)} className={`p-2 border rounded-lg transition-colors ${showFiltros ? 'bg-purple-50 border-purple-200 text-purple-700' : 'border-gray-300 hover:bg-gray-50'}`}>
            <Filter className="w-5 h-5" />
          </button>
        </div>
        {showFiltros && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3 pt-3 border-t border-gray-100 animate-in fade-in slide-in-from-top-2">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Status</label>
              <select className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm bg-white" value={filtros.status} onChange={(e) => setFiltros(p => ({ ...p, status: e.target.value }))}>
                <option value="todas">Todos</option>
                <option value="pagas">Pagas</option>
                <option value="pendentes">Pendentes</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Categoria</label>
              <select className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm bg-white" value={filtros.categoria} onChange={(e) => setFiltros(p => ({ ...p, categoria: e.target.value }))}>
                <option value="todas">Todas</option>
                {categorias.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Tabela de Dados */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-purple-600 animate-spin" /></div>
        ) : despesas.length === 0 ? (
          <div className="text-center py-12 px-4">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-medium text-gray-900">Nenhuma despesa</h3>
            <button onClick={abrirNovoCadastro} className="mt-3 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm">Cadastrar</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Descrição</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Valor</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap hidden sm:table-cell">Vencimento</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap hidden sm:table-cell">Status</th>
                  <th className="py-3 px-4 text-right text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {despesas.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50 group">
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900 truncate max-w-[120px] sm:max-w-xs">{d.descricao}</div>
                      <div className="text-xs text-gray-500">{d.categoria}</div>
                      <div className="sm:hidden text-xs text-gray-400 mt-1 flex items-center gap-2">
                        <span>{new Date(d.data_vencimento).toLocaleDateString('pt-BR')}</span>
                        <span className={`w-2 h-2 rounded-full ${d.pago ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-900 whitespace-nowrap">
                      R$ {Number(d.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 hidden sm:table-cell whitespace-nowrap">
                      {new Date(d.data_vencimento).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-3 px-4 hidden sm:table-cell">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${d.pago ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {d.pago ? 'Pago' : 'Pendente'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => handlePagar(d.id, !d.pago)} className="p-1.5 text-green-600 hover:bg-green-50 rounded"><CheckCircle className="w-4 h-4" /></button>
                        <button onClick={() => abrirEdicao(d)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => handleExcluir(d.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  const renderFormulario = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
          {formDespesa.id ? 'Editando Registro' : 'Novo Lançamento'}
        </h2>
      </div>

      <form onSubmit={salvarDespesa} className="p-6 space-y-6">
        <div className="grid grid-cols-1 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Descrição *</label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                type="text" required 
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all" 
                value={formDespesa.descricao} 
                onChange={e => setFormDespesa({ ...formDespesa, descricao: e.target.value })} 
                placeholder="Ex: Conta de Luz, Fornecedor X" 
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Categoria</label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select 
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-purple-500 outline-none" 
                  value={formDespesa.categoria} 
                  onChange={e => setFormDespesa({ ...formDespesa, categoria: e.target.value })}
                >
                  <option value="">Selecione...</option>
                  {categorias.map(c => <option key={c} value={c}>{c}</option>)}
                  <option value="Operacional">Operacional</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Pessoal">Pessoal</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Valor (R$) *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">R$</span>
                <input 
                  type="number" step="0.01" required 
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none" 
                  value={formDespesa.valor} 
                  onChange={e => setFormDespesa({ ...formDespesa, valor: e.target.value })} 
                  placeholder="0,00" 
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Vencimento *</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                  type="date" required 
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none" 
                  value={formDespesa.data_vencimento} 
                  onChange={e => setFormDespesa({ ...formDespesa, data_vencimento: e.target.value })} 
                />
              </div>
            </div>
            
            <div className="flex items-center pt-6">
              <label className="flex items-center gap-3 cursor-pointer p-3 border border-gray-200 rounded-xl w-full hover:bg-gray-50 transition-colors">
                <div className={`w-5 h-5 rounded border flex items-center justify-center ${formDespesa.pago ? 'bg-purple-600 border-purple-600' : 'border-gray-300 bg-white'}`}>
                  {formDespesa.pago && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                </div>
                <input 
                  type="checkbox" className="hidden" 
                  checked={formDespesa.pago} 
                  onChange={e => setFormDespesa({ ...formDespesa, pago: e.target.checked })} 
                />
                <span className="text-sm font-medium text-gray-700">Marcar como pago</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Observações</label>
            <textarea 
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none" 
              rows="3" 
              value={formDespesa.observacoes} 
              onChange={e => setFormDespesa({ ...formDespesa, observacoes: e.target.value })}
              placeholder="Detalhes adicionais..."
            ></textarea>
          </div>
        </div>

        <div className="flex gap-4 pt-4 border-t border-gray-100">
          <button 
            type="button" 
            onClick={() => setVisualizacao('lista')} 
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            className="flex-1 px-6 py-3 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700 transition-colors flex justify-center items-center gap-2"
          >
            <Save className="w-5 h-5" />
            Salvar
          </button>
        </div>
      </form>
    </div>
  );

  return (
    <div className="w-full pb-8">
      {renderHeader()}
      {visualizacao === 'lista' ? renderLista() : renderFormulario()}
    </div>
  );
};

// --- COMPONENTE AUXILIAR (CORRIGIDO E SEGURO) ---
const StatCard = ({ label, value, icon: Icon, color }) => {
  const colorStyles = {
    gray: { bg: 'bg-gray-50', text: 'text-gray-600' },
    green: { bg: 'bg-green-50', text: 'text-green-600' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-600' },
    red: { bg: 'bg-red-50', text: 'text-red-600' },
    yellow: { bg: 'bg-yellow-50', text: 'text-yellow-600' }
  };

  const style = colorStyles[color] || colorStyles.gray;
  
  // Proteção contra crash: Garante que value seja um número antes de formatar
  const safeValue = typeof value === 'number' ? value : 0;

  return (
    <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between h-full">
      <div className="flex justify-between items-start mb-1">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</span>
        <div className={`p-1 rounded-md ${style.bg} ${style.text}`}>
          <Icon className="w-3.5 h-3.5" />
        </div>
      </div>
      <span className={`text-lg font-bold text-gray-900`}>
        R$ {safeValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
    </div>
  );
};