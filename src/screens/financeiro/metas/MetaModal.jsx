import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Loader2, Target, DollarSign, TrendingUp, Receipt, Users, UserPlus, Calendar, ShoppingCart } from 'lucide-react';
import { supabase } from '../../../services/supabase';

export const MetaModal = ({ aberto, onFechar, onSucesso, meta }) => {
  const [salvando, setSalvando] = useState(false);
  const [salaoId, setSalaoId] = useState(null);

  // LISTA ATUALIZADA: Separamos Clientes em "Atendidos" e "Novos"
  const tiposMeta = [
    { value: 'faturamento', label: 'Faturamento', icon: DollarSign, cor: 'green' },
    { value: 'lucro', label: 'Lucro', icon: TrendingUp, cor: 'blue' },
    { value: 'despesas', label: 'Despesas', icon: Receipt, cor: 'orange' },
    { value: 'clientes_atendidos', label: 'Clientes Atendidos', icon: Users, cor: 'purple' },
    { value: 'novos_clientes', label: 'Novos Clientes', icon: UserPlus, cor: 'pink' },
    { value: 'vendas', label: 'Vendas', icon: ShoppingCart, cor: 'red' }
  ];

  const [formData, setFormData] = useState({
    tipo: 'faturamento',
    valor_meta: '',
    periodo: 'Mensal',
    cor: 'green',
    inverso: false,
    descricao: ''
  });

  // Inicializar com dados da meta se for edição
  useEffect(() => {
    if (meta) {
      // CORREÇÃO: 'vendas' adicionado à lista de formatação de dinheiro
      let valorFormatado = meta.valor_meta?.toString() || '';
      if (['faturamento', 'lucro', 'despesas', 'vendas'].includes(meta.tipo)) {
         valorFormatado = parseFloat(meta.valor_meta || 0).toFixed(2).replace('.', ',').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
      }

      setFormData({
        tipo: meta.tipo || 'faturamento',
        valor_meta: valorFormatado,
        periodo: meta.periodo || 'Mensal',
        cor: meta.cor || 'purple',
        inverso: meta.inverso || false,
        descricao: meta.descricao || ''
      });
    } else {
      setFormData({
        tipo: 'faturamento',
        valor_meta: '',
        periodo: 'Mensal',
        cor: 'green',
        inverso: false,
        descricao: ''
      });
    }
  }, [meta, aberto]);

  useEffect(() => {
    const fetchSalao = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: usuario } = await supabase
        .from('usuarios')
        .select('salao_id')
        .eq('id', user.id)
        .single();

      if (usuario?.salao_id) {
        setSalaoId(usuario.salao_id);
      }
    };

    if (aberto) fetchSalao();
  }, [aberto]);

  const periodos = ['Diário', 'Semanal', 'Mensal', 'Trimestral', 'Semestral', 'Anual'];
  
  const cores = [
    { value: 'green', label: 'Verde', class: 'bg-green-500' },
    { value: 'blue', label: 'Azul', class: 'bg-blue-500' },
    { value: 'orange', label: 'Laranja', class: 'bg-orange-500' },
    { value: 'purple', label: 'Roxo', class: 'bg-purple-500' },
    { value: 'pink', label: 'Rosa', class: 'bg-pink-500' },
    { value: 'red', label: 'Vermelho', class: 'bg-red-500' }
  ];

  // CORREÇÃO AQUI: 'vendas' agora é considerado um valor Monetário!
  const isMonetario = ['faturamento', 'lucro', 'despesas', 'vendas'].includes(formData.tipo);

  // MÁSCARA INTELIGENTE
  const handleMudancaValor = (e) => {
    let v = e.target.value.replace(/\D/g, ''); // Tira tudo que não é número

    if (v === '') {
      setFormData({ ...formData, valor_meta: '' });
      return;
    }

    if (isMonetario) {
      // Máscara de Dinheiro (1.500,00)
      v = (parseInt(v, 10) / 100).toFixed(2);
      v = v.replace('.', ',');
      v = v.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
    } else {
      // Máscara de Quantidade (só deixa digitar números puros, ex: 50)
      v = parseInt(v, 10).toString(); 
    }

    setFormData({ ...formData, valor_meta: v });
  };

  const handleMudarTipo = (tipo, cor) => {
    setFormData({ ...formData, tipo, cor, valor_meta: '' });
  };

  const parseMoedaOuInteiro = (valor) => {
    if (!valor) return 0;
    if (isMonetario) {
      const numeroLimpo = valor.toString().replace(/\./g, '').replace(',', '.');
      return parseFloat(numeroLimpo) || 0;
    } else {
      return parseInt(valor, 10) || 0;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!salaoId || !formData.valor_meta) {
      return alert("Preencha o valor da meta.");
    }

    setSalvando(true);
    try {
      const valorMetaFinal = parseMoedaOuInteiro(formData.valor_meta);
      
      const labelTipo = tiposMeta.find(t => t.value === formData.tipo)?.label || 'Meta';
      const tituloAutomatico = `Meta de ${labelTipo}`;

      const metaData = {
        salao_id: salaoId,
        tipo: formData.tipo,
        titulo: tituloAutomatico,
        valor_meta: valorMetaFinal,
        periodo: formData.periodo,
        cor: formData.cor,
        inverso: formData.inverso,
        descricao: formData.descricao || null,
        data_atualizacao: new Date().toISOString()
      };

      if (meta) {
        const { error } = await supabase
          .from('metas')
          .update(metaData)
          .eq('id', meta.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('metas')
          .insert([{
            ...metaData,
            valor_atual: 0,
            data_criacao: new Date().toISOString()
          }]);
        if (error) throw error;
      }

      onSucesso();
      onFechar();
    } catch (error) {
      console.error('Erro ao salvar meta:', error);
      alert('Erro ao salvar meta.');
    } finally {
      setSalvando(false);
    }
  };

  if (!aberto) return null;

  const IconComponent = tiposMeta.find(t => t.value === formData.tipo)?.icon || Target;

  return createPortal(
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
      <div className="bg-gray-900 border border-gray-700 w-full max-w-md rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden relative">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className={`p-2 ${formData.inverso ? 'bg-red-500/20' : 'bg-purple-500/20'} rounded-lg`}>
              <IconComponent className={`w-5 h-5 ${formData.inverso ? 'text-red-400' : 'text-purple-400'}`} />
            </div>
            <h2 className="text-xl font-bold text-white">
              {meta ? 'Editar Meta' : 'Nova Meta'}
            </h2>
          </div>
          <button
            onClick={onFechar}
            className="p-2 hover:bg-gray-800/50 rounded-lg transition-colors"
            disabled={salvando}
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              O que você quer alcançar?
            </label>
            <div className="grid grid-cols-3 gap-2">
              {tiposMeta.map((tipo) => {
                const Icon = tipo.icon;
                const isSelected = formData.tipo === tipo.value;
                return (
                  <button
                    key={tipo.value}
                    type="button"
                    onClick={() => handleMudarTipo(tipo.value, tipo.cor)}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                      isSelected 
                        ? `border-${tipo.cor}-500 bg-${tipo.cor}-500/10` 
                        : 'border-gray-700 bg-gray-800/30 hover:bg-gray-800/50'
                    }`}
                    disabled={salvando}
                  >
                    <Icon className={`w-4 h-4 ${isSelected ? `text-${tipo.cor}-400` : 'text-gray-400'}`} />
                    <span className={`text-xs ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                      {tipo.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              {/* RÓTULO DINÂMICO */}
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                {isMonetario ? 'Valor Meta (R$)*' : 'Quantidade Alvo*'}
              </label>
              <div className="relative">
                {/* ÍCONE DINÂMICO */}
                {isMonetario ? (
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                ) : (
                  <Target className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                )}
                
                {/* CAMPO DINÂMICO E COM MÁSCARA */}
                <input
                  type="text"
                  value={formData.valor_meta}
                  onChange={handleMudancaValor}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white outline-none text-sm"
                  placeholder={isMonetario ? "0,00" : "Ex: 50"}
                  disabled={salvando}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                Período
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <select
                  value={formData.periodo}
                  onChange={e => setFormData({...formData, periodo: e.target.value})}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white outline-none text-sm"
                  disabled={salvando}
                >
                  {periodos.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              Cor do Cartão
            </label>
            <div className="flex gap-2">
              {cores.map(cor => (
                <button
                  key={cor.value}
                  type="button"
                  onClick={() => setFormData({...formData, cor: cor.value })}
                  className={`flex-1 p-3 rounded-xl border flex items-center justify-center gap-2 ${
                    formData.cor === cor.value 
                      ? 'border-white ring-2 ring-white/20' 
                      : 'border-gray-700 hover:border-gray-500'
                  }`}
                  disabled={salvando}
                >
                  <div className={`w-4 h-4 rounded-full ${cor.class}`}></div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-800/30 rounded-xl">
            <input
              type="checkbox"
              id="inverso"
              checked={formData.inverso}
              onChange={e => setFormData({...formData, inverso: e.target.checked})}
              className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-red-500 focus:ring-red-500"
              disabled={salvando}
            />
            <div>
              <label htmlFor="inverso" className="text-sm text-gray-300 block">
                Meta de Limite (Inversa)
              </label>
              <span className="text-xs text-gray-500">Ex: Não ultrapassar valor X de despesas</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              Descrição (Opcional)
            </label>
            <textarea
              value={formData.descricao}
              onChange={e => setFormData({...formData, descricao: e.target.value})}
              className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white outline-none text-sm min-h-[80px] resize-none"
              placeholder="Detalhes sobre esta meta..."
              disabled={salvando}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-800 bg-gray-900/95 flex gap-3">
          <button
            onClick={onFechar}
            className="flex-1 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800 rounded-xl"
            disabled={salvando}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={salvando}
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg hover:from-purple-600 hover:to-pink-600 transition-all"
          >
            {salvando ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {meta ? 'Salvar Alterações' : 'Criar Meta'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};