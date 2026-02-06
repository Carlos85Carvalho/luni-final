import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Search, ShoppingCart, Trash2, CreditCard, Banknote, QrCode, 
  ArrowLeft, Plus, Minus, Package, X, User, Phone, Mail, Filter, 
  Tag, CheckCircle2, MessageSquare, Receipt, Printer, Download, 
  Smartphone, Percent, Clock, AlertCircle, ChevronDown, Hash,
  History, Award, DollarSign, Calendar, Package2, ShieldAlert,
  Wifi, WifiOff, Save, Clock3, FileText, Send, Eye, Edit,
  Smartphone as Mobile, Tablet, Monitor, CreditCard as Card,
  RefreshCw, AlertTriangle, BarChart3, Check, ExternalLink,
  Scissors, CalendarDays, Users, Star, Gift, Layers
} from 'lucide-react';
import { supabase } from '../../services/supabase';
import jsPDF from 'jspdf';
import * as QRCodeGenerator from 'qrcode';

export const PDVScreen = ({ onVoltar }) => {
  // Estados principais
  const [produtos, setProdutos] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [carrinho, setCarrinho] = useState([]);
  const [busca, setBusca] = useState('');
  const [salaoId, setSalaoId] = useState(null);
  const [processando, setProcessando] = useState(false);
  const [pagamentoModal, setPagamentoModal] = useState(false);
  const [clientes, setClientes] = useState([]);
  const [clienteSelecionado, setClienteSelecionado] = useState(null);
  const [dropdownClientesAberto, setDropdownClientesAberto] = useState(false);
  const [categorias, setCategorias] = useState([]);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState('todas');
  const [notificacao, setNotificacao] = useState({ tipo: '', mensagem: '', visivel: false });
  const [desconto, setDesconto] = useState(0);
  const [tipoDesconto, setTipoDesconto] = useState('percentual');
  
  // Estados para serviços/agendamentos
  const [agendamentos, setAgendamentos] = useState([]);
  const [servicosModal, setServicosModal] = useState(false);
  const [servicoEditando, setServicoEditando] = useState(null);
  const [servicoPrecoEdit, setServicoPrecoEdit] = useState('');
  
  // Novos estados para funcionalidades
  const [historicoModal, setHistoricoModal] = useState(false);
  const [historicoCliente, setHistoricoCliente] = useState(null);
  const [carregandoHistorico, setCarregandoHistorico] = useState(false);
  const [vendaPendenteModal, setVendaPendenteModal] = useState(false);
  const [vendasPendentes, setVendasPendentes] = useState([]);
  const [onlineStatus, setOnlineStatus] = useState(navigator.onLine);
  const [carrinhoSalvo, setCarrinhoSalvo] = useState(false);
  const [ultimoNumeroVenda, setUltimoNumeroVenda] = useState(0);
  const [configFidelidade, setConfigFidelidade] = useState({
    ativo: true,
    pontosPorReal: 1,
    valorMinimoParaPontos: 10,
    cashbackPercentual: 5
  });
  const [abaAtiva, setAbaAtiva] = useState('produtos');
  const [duploCliqueBloqueado, setDuploCliqueBloqueado] = useState(false);
  
  // Estado para controle de viewport
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isTablet, setIsTablet] = useState(window.innerWidth >= 768 && window.innerWidth < 1024);

  const buscaInputRef = useRef(null);
  const channelRef = useRef(null);

  // Monitorar tamanho da tela
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 🔄 Configuração do Realtime para Clientes
  useEffect(() => {
    const setupRealtime = () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }

      const channel = supabase.channel('clientes-realtime')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'clientes'
          },
          (payload) => {
            if (payload.new.salao_id === salaoId) {
              setClientes(prev => [...prev, payload.new]);
              mostrarNotificacao('success', `Novo cliente: ${payload.new.nome}`);
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'clientes'
          },
          (payload) => {
            setClientes(prev => 
              prev.map(cliente => 
                cliente.id === payload.new.id ? payload.new : cliente
              )
            );
          }
        )
        .subscribe();

      channelRef.current = channel;
    };

    if (salaoId) {
      setupRealtime();
    }

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [salaoId]);

  // 🌐 Monitorar status online/offline
  useEffect(() => {
    const handleOnline = () => setOnlineStatus(true);
    const handleOffline = () => {
      setOnlineStatus(false);
      mostrarNotificacao('warning', 'Modo offline ativado. Algumas funcionalidades estão limitadas.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 🛒 Salvar carrinho ao sair
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (carrinho.length > 0 && !carrinhoSalvo) {
        e.preventDefault();
        e.returnValue = 'Você tem itens no carrinho. Deseja realmente sair?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [carrinho, carrinhoSalvo]);

  // 📦 Carregar dados iniciais CORRETAMENTE
  useEffect(() => {
    const fetchDados = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: userData } = await supabase
            .from('usuarios')
            .select('salao_id')
            .eq('id', user.id)
            .single();
          
          if (userData) {
            setSalaoId(userData.salao_id);
            
            // Carregar configurações do salão
            const { data: config } = await supabase
              .from('config_salao')
              .select('*')
              .eq('salao_id', userData.salao_id)
              .single();
            
            if (config?.config_fidelidade) {
              setConfigFidelidade(config.config_fidelidade);
            }

            // Buscar último número de venda
            const { data: ultimaVenda } = await supabase
              .from('vendas')
              .select('numero_venda')
              .eq('salao_id', userData.salao_id)
              .order('numero_venda', { ascending: false })
              .limit(1)
              .single();
            
            setUltimoNumeroVenda(ultimaVenda?.numero_venda || 0);

            // Carregar produtos com estoque
            const { data: prods } = await supabase
              .from('produtos')
              .select('*')
              .eq('salao_id', userData.salao_id)
              .eq('ativo', true)
              .gt('quantidade_atual', 0)
              .order('nome');
            
            if (prods) {
              setProdutos(prods);
              const cats = ['todas', ...new Set(prods.map(p => p.categoria).filter(Boolean))];
              setCategorias(cats);
            }

            // Carregar serviços
            const { data: servs } = await supabase
              .from('servicos')
              .select('*')
              .eq('salao_id', userData.salao_id)
              .eq('ativo', true)
              .order('nome');
            
            if (servs) setServicos(servs);

            // Carregar CLIENTES CORRETAMENTE (da tabela clientes)
            const { data: clientesData } = await supabase
              .from('clientes')
              .select('*')
              .eq('salao_id', userData.salao_id)
              .eq('ativo', true)
              .order('nome');
            
            if (clientesData) {
              // Enriquecer dados dos clientes com informações de fidelidade
              const clientesEnriquecidos = clientesData.map(cliente => ({
                ...cliente,
                // Calcular dias sem visita
                dias_sem_visita: cliente.ultima_visita ? 
                  Math.floor((new Date() - new Date(cliente.ultima_visita)) / (1000 * 60 * 60 * 24)) : 999,
                // Status baseado em comportamento
                status: cliente.pontos > 100 ? 'vip' : 
                       cliente.total_gasto > 500 ? 'regular' : 'novo'
              }));
              setClientes(clientesEnriquecidos);
            }

            // Carregar agendamentos para hoje
            const hoje = new Date().toISOString().split('T')[0];
            const { data: agends } = await supabase
              .from('agendamentos')
              .select(`
                *,
                clientes (nome, telefone, whatsapp),
                servicos (nome, preco_base)
              `)
              .eq('salao_id', userData.salao_id)
              .gte('data', hoje)
              .lte('data', hoje)
              .eq('status', 'confirmado')
              .order('hora_inicio');
            
            if (agends) setAgendamentos(agends);

            // Carregar vendas pendentes
            const { data: pendentes } = await supabase
              .from('vendas')
              .select('*, clientes(nome)')
              .eq('salao_id', userData.salao_id)
              .eq('status', 'pendente')
              .order('created_at', { ascending: false });
            
            if (pendentes) setVendasPendentes(pendentes);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        mostrarNotificacao('error', 'Erro ao carregar dados iniciais');
      }
    };
    
    fetchDados();

    // Foco no campo de busca
    setTimeout(() => {
      if (buscaInputRef.current) buscaInputRef.current.focus();
    }, 100);
  }, []);

  // 🛒 Funções do Carrinho
  const adicionarAoCarrinho = (item, tipo = 'produto') => {
    if (duploCliqueBloqueado) return;
    
    setDuploCliqueBloqueado(true);
    
    const itemExistente = carrinho.find(cartItem => cartItem.id === item.id && cartItem.tipo === tipo);
    
    if (tipo === 'produto') {
      if (itemExistente) {
        if (itemExistente.qtd >= item.quantidade_atual) {
          mostrarNotificacao('warning', 'Estoque insuficiente!');
          setDuploCliqueBloqueado(false);
          return;
        }
        setCarrinho(carrinho.map(cartItem => 
          cartItem.id === item.id && cartItem.tipo === 'produto' 
            ? { ...cartItem, qtd: cartItem.qtd + 1 } 
            : cartItem
        ));
      } else {
        setCarrinho([...carrinho, { 
          ...item, 
          qtd: 1, 
          tipo: 'produto',
          preco_venda: item.preco_venda,
          nome: item.nome 
        }]);
      }
    } else if (tipo === 'servico') {
      if (itemExistente) {
        mostrarNotificacao('warning', 'Serviço já adicionado ao carrinho');
        setDuploCliqueBloqueado(false);
        return;
      }
      setCarrinho([...carrinho, {
        ...item,
        qtd: 1,
        tipo: 'servico',
        preco_venda: item.preco_base,
        nome: item.nome
      }]);
    }
    
    setCarrinhoSalvo(false);
    mostrarNotificacao('success', `${item.nome} adicionado ao carrinho`);
    
    setTimeout(() => setDuploCliqueBloqueado(false), 300);
  };

  const adicionarServicoAgendamento = (agendamento) => {
    const servicoExistente = carrinho.find(item => 
      item.tipo === 'servico' && item.id === agendamento.servico_id
    );

    if (!servicoExistente) {
      setCarrinho([...carrinho, {
        id: agendamento.servico_id,
        tipo: 'servico',
        qtd: 1,
        preco_venda: agendamento.servicos.preco_base,
        nome: agendamento.servicos.nome,
        agendamento_id: agendamento.id,
        cliente_id: agendamento.cliente_id,
        observacao: `Agendamento ${agendamento.data} ${agendamento.hora_inicio}`
      }]);
      mostrarNotificacao('success', `Serviço ${agendamento.servicos.nome} adicionado`);
    }
  };

  const removerDoCarrinho = (id, tipo) => {
    setCarrinho(carrinho.filter(item => !(item.id === id && item.tipo === tipo)));
    setCarrinhoSalvo(false);
    mostrarNotificacao('info', 'Item removido');
  };

  const ajustarQtd = (id, tipo, delta) => {
    setCarrinho(carrinho.map(item => {
      if (item.id === id && item.tipo === tipo) {
        if (tipo === 'produto') {
          const produtoOriginal = produtos.find(p => p.id === id);
          const novaQtd = item.qtd + delta;
          
          if (novaQtd > produtoOriginal.quantidade_atual) {
            mostrarNotificacao('warning', 'Estoque insuficiente');
            return item;
          }
          
          if (novaQtd <= 0) {
            removerDoCarrinho(id, tipo);
            return item;
          }
          
          return { ...item, qtd: novaQtd };
        } else if (tipo === 'servico') {
          if (delta < 0 && item.qtd === 1) {
            removerDoCarrinho(id, tipo);
            return item;
          }
          return { ...item, qtd: Math.max(1, item.qtd + delta) };
        }
      }
      return item;
    }));
    setCarrinhoSalvo(false);
  };

  const editarPrecoServico = (id, novoPreco) => {
    setCarrinho(carrinho.map(item => {
      if (item.id === id && item.tipo === 'servico') {
        return { ...item, preco_venda: parseFloat(novoPreco) };
      }
      return item;
    }));
    mostrarNotificacao('success', 'Preço atualizado');
  };

  // 💰 Cálculos
  const subtotal = useMemo(() => {
    return carrinho.reduce((acc, item) => acc + (item.preco_venda * item.qtd), 0);
  }, [carrinho]);

  const valorDesconto = useMemo(() => {
    if (tipoDesconto === 'percentual') {
      return (subtotal * desconto) / 100;
    }
    return Math.min(desconto, subtotal);
  }, [subtotal, desconto, tipoDesconto]);

  const total = useMemo(() => {
    return subtotal - valorDesconto;
  }, [subtotal, valorDesconto]);

  // 🎁 Cálculo de fidelidade
  const pontosGanhos = useMemo(() => {
    if (!clienteSelecionado || !configFidelidade.ativo || total < configFidelidade.valorMinimoParaPontos) {
      return 0;
    }
    return Math.floor(total * configFidelidade.pontosPorReal);
  }, [clienteSelecionado, total, configFidelidade]);

  const valorCashback = useMemo(() => {
    if (!clienteSelecionado || !configFidelidade.ativo) {
      return 0;
    }
    return (total * configFidelidade.cashbackPercentual) / 100;
  }, [clienteSelecionado, total, configFidelidade]);

  // 🔔 Notificações
  const mostrarNotificacao = (tipo, mensagem) => {
    setNotificacao({ tipo, mensagem, visivel: true });
    setTimeout(() => {
      setNotificacao(prev => ({ ...prev, visivel: false }));
    }, 3000);
  };

  // 📊 Carregar histórico do cliente CORRETAMENTE
  const carregarHistoricoCliente = async (clienteId) => {
    if (!clienteId) return;
    
    setCarregandoHistorico(true);
    try {
      const { data: historico, error } = await supabase
        .from('vendas')
        .select(`
          *,
          itens_venda (
            *,
            produtos (nome, categoria)
          ),
          clientes (nome, whatsapp)
        `)
        .eq('cliente_id', clienteId)
        .eq('salao_id', salaoId)
        .eq('status', 'concluida')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      
      setHistoricoCliente(historico);
      setHistoricoModal(true);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      mostrarNotificacao('error', 'Erro ao carregar histórico');
    } finally {
      setCarregandoHistorico(false);
    }
  };

  // 📄 Gerar PDF profissional (80mm) com QR Code PIX
  const gerarPDF = async (venda, dadosSalon = {}) => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [80, 297]
      });

      const margin = 4;
      let y = margin;

      // Configurações
      doc.setFontSize(8);
      doc.setTextColor(0);

      // Logo do salão (se existir)
      if (dadosSalon.logo_url) {
        try {
          const logoBase64 = dadosSalon.logo_url;
          doc.addImage(logoBase64, 'PNG', margin, y, 20, 20);
          y += 22;
        } catch (error) {
          console.warn('Erro ao carregar logo:', error);
        }
      }

      // Cabeçalho
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(dadosSalon.nome || 'Salão de Beleza', 40, y, { align: 'center' });
      y += 5;

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(dadosSalon.endereco || '', 40, y, { align: 'center' });
      y += 4;
      doc.text(`CNPJ: ${dadosSalon.cnpj || '00.000.000/0001-00'}`, 40, y, { align: 'center' });
      y += 4;
      doc.text(`Telefone: ${dadosSalon.telefone || '(11) 99999-9999'}`, 40, y, { align: 'center' });
      y += 8;

      // Linha divisória
      doc.setLineWidth(0.5);
      doc.line(margin, y, 80 - margin, y);
      y += 5;

      // Dados da venda
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('COMPROVANTE DE VENDA', 40, y, { align: 'center' });
      y += 5;

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`Venda #${venda.numero_venda}`, margin, y);
      y += 4;
      doc.text(`Data: ${new Date(venda.created_at).toLocaleString('pt-BR')}`, margin, y);
      y += 4;
      doc.text(`Atendente: ${venda.atendente_nome || 'Sistema'}`, margin, y);
      y += 6;

      // Dados do cliente
      if (clienteSelecionado) {
        doc.setFont('helvetica', 'bold');
        doc.text('CLIENTE:', margin, y);
        y += 4;
        doc.setFont('helvetica', 'normal');
        doc.text(`Nome: ${clienteSelecionado.nome}`, margin, y);
        y += 4;
        if (clienteSelecionado.whatsapp) {
          doc.text(`WhatsApp: ${clienteSelecionado.whatsapp}`, margin, y);
          y += 4;
        }
        y += 2;
      }

      // Linha divisória
      doc.line(margin, y, 80 - margin, y);
      y += 5;

      // Itens
      doc.setFont('helvetica', 'bold');
      doc.text('ITENS', margin, y);
      y += 5;

      doc.setFont('helvetica', 'normal');
      carrinho.forEach((item, index) => {
        const tipoIcon = item.tipo === 'servico' ? '✂️' : '📦';
        const nome = `${tipoIcon} ${item.nome}`.substring(0, 20);
        doc.text(`${item.qtd}x ${nome}`, margin, y);
        doc.text(`R$ ${(item.preco_venda * item.qtd).toFixed(2)}`, 65, y);
        y += 4;
        
        if (index < carrinho.length - 1) {
          doc.setLineWidth(0.1);
          doc.line(margin, y, 80 - margin, y);
          y += 2;
        }
      });

      y += 4;

      // Totais
      doc.setLineWidth(0.5);
      doc.line(margin, y, 80 - margin, y);
      y += 5;

      doc.text(`Subtotal:`, 50, y);
      doc.text(`R$ ${subtotal.toFixed(2)}`, 65, y);
      y += 4;

      if (valorDesconto > 0) {
        doc.text(`Desconto:`, 50, y);
        doc.text(`-R$ ${valorDesconto.toFixed(2)}`, 65, y);
        y += 4;
      }

      doc.setFont('helvetica', 'bold');
      doc.text(`TOTAL:`, 50, y);
      doc.text(`R$ ${total.toFixed(2)}`, 65, y);
      y += 6;

      doc.setFont('helvetica', 'normal');
      doc.text(`Forma de pagamento: ${venda.forma_pagamento.toUpperCase()}`, margin, y);
      y += 6;

      // QR Code PIX
      if (venda.forma_pagamento === 'pix') {
        try {
          const pixString = `00020126360014br.gov.bcb.pix0114carlosdecar@gmail.com0212Venda${venda.numero_venda}5204000053039865406${total.toFixed(2)}5802BR5925${dadosSalon.nome?.substring(0, 25) || "Salão"}6015${dadosSalon.cidade?.substring(0, 15) || "SP"}62070503***6304`;
          
          // Gerar QR Code
          const canvas = document.createElement('canvas');
          await QRCodeGenerator.toCanvas(canvas, pixString, {
            width: 120,
            margin: 1,
            color: { dark: '#000000', light: '#FFFFFF' }
          });
          
          const qrCodeDataUrl = canvas.toDataURL('image/png');
          
          if (qrCodeDataUrl) {
            doc.addImage(qrCodeDataUrl, 'PNG', 20, y, 40, 40);
            doc.setFontSize(7);
            doc.text('PIX', 65, y);
            doc.setFontSize(6);
            doc.text('Chave: carlosdecar@gmail.com', 65, y + 4);
            doc.text(`Valor: R$ ${total.toFixed(2)}`, 65, y + 8);
            doc.text(`Venda: #${venda.numero_venda}`, 65, y + 12);
            y += 45;
          }
          
          doc.setFontSize(7);
          doc.text('QR Code PIX - Use para pagamento', 40, y, { align: 'center' });
          y += 5;
        } catch (error) {
          console.warn('Erro ao gerar QR Code PIX:', error);
          doc.setFontSize(8);
          doc.text('PIX - carlosdecar@gmail.com', 40, y, { align: 'center' });
          doc.text(`Valor: R$ ${total.toFixed(2)}`, 40, y + 4, { align: 'center' });
          y += 10;
        }
      }

      y += 10;

      // Rodapé
      doc.setFontSize(7);
      doc.text('----------------------------------------', 40, y, { align: 'center' });
      y += 4;
      doc.text('Obrigado pela preferência!', 40, y, { align: 'center' });
      y += 4;
      doc.text('Volte sempre!', 40, y, { align: 'center' });
      y += 4;
      doc.text('----------------------------------------', 40, y, { align: 'center' });

      // Salvar PDF
      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      return { pdfBlob, pdfUrl, pdfBase64: doc.output('datauristring') };
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      throw error;
    }
  };

  // 📱 Enviar PDF por WhatsApp
  const enviarPDFWhatsApp = async (venda) => {
    try {
      setProcessando(true);
      
      // Buscar dados do salão
      const { data: salaoData } = await supabase
        .from('saloes')
        .select('*')
        .eq('id', salaoId)
        .single();
      
      // Gerar PDF
      const { pdfBlob } = await gerarPDF(venda, salaoData || {});
      
      // Criar URL temporária
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      // Preparar mensagem
      const mensagem = encodeURIComponent(
        `✅ Compra realizada com sucesso!\n\n` +
        `*Venda #${venda.numero_venda}*\n` +
        `Data: ${new Date(venda.created_at).toLocaleDateString('pt-BR')}\n` +
        `Total: R$ ${total.toFixed(2)}\n` +
        `Forma de pagamento: ${venda.forma_pagamento}\n\n` +
        `Agradecemos pela preferência! 🎉`
      );
      
      // Limpar telefone
      const telefone = clienteSelecionado.whatsapp.replace(/\D/g, '');
      const telefoneCompleto = telefone.startsWith('55') ? telefone : `55${telefone}`;
      
      // Abrir WhatsApp
      mostrarNotificacao('info', 'Abrindo WhatsApp...');
      
      setTimeout(() => {
        window.open(`https://wa.me/${telefoneCompleto}?text=${mensagem}`, '_blank');
      }, 1000);
      
      // Limpar URL temporária
      setTimeout(() => URL.revokeObjectURL(pdfUrl), 10000);
      
    } catch (error) {
      console.error('Erro ao enviar WhatsApp:', error);
      mostrarNotificacao('error', 'Erro ao preparar envio do WhatsApp');
    } finally {
      setProcessando(false);
    }
  };

  // 💰 Salvar venda pendente
  const salvarVendaPendente = async () => {
    try {
      setProcessando(true);
      
      // Gerar número de venda localmente se a função RPC não existir
      let proximoNumero = ultimoNumeroVenda + 1;
      
      try {
        const { data: numeroRPC } = await supabase
          .rpc('get_proximo_numero_venda', { p_salao_id: salaoId });
        if (numeroRPC) proximoNumero = numeroRPC;
      } catch (error) {
          console.log('Usando número local:', proximoNumero);
          console.error('Erro ao recuperar próximo número de venda:', error);
      }
      
      const vendaData = {
        salao_id: salaoId,
        cliente_id: clienteSelecionado?.id || null,
        subtotal: subtotal,
        desconto: valorDesconto,
        total: total,
        forma_pagamento: 'pendente',
        status: 'pendente',
        numero_venda: proximoNumero,
        itens_pendentes: carrinho.map(item => ({
          produto_id: item.tipo === 'produto' ? item.id : null,
          servico_id: item.tipo === 'servico' ? item.id : null,
          tipo: item.tipo,
          quantidade: item.qtd,
          preco_unitario: item.preco_venda,
          nome: item.nome
        }))
      };

      const { data: venda, error } = await supabase
        .from('vendas')
        .insert([vendaData])
        .select()
        .single();

      if (error) throw error;

      mostrarNotificacao('success', `Venda pendente salva: #${venda.numero_venda}`);
      
      setVendasPendentes(prev => [venda, ...prev]);
      setCarrinho([]);
      setVendaPendenteModal(false);
      setCarrinhoSalvo(true);
      
    } catch (error) {
      console.error('Erro ao salvar venda pendente:', error);
      mostrarNotificacao('error', error.message);
    } finally {
      setProcessando(false);
    }
  };

  // 🔄 Recuperar venda pendente
  const recuperarVendaPendente = async (vendaId) => {
    try {
      const { data: venda } = await supabase
        .from('vendas')
        .select('*')
        .eq('id', vendaId)
        .single();
      
      if (!venda) throw new Error('Venda não encontrada');
      
      // Carregar itens pendentes
      const itensRecuperados = [];
      
      for (const item of venda.itens_pendentes) {
        if (item.tipo === 'produto') {
          const { data: produto } = await supabase
            .from('produtos')
            .select('*')
            .eq('id', item.produto_id)
            .single();
          
          if (produto) {
            itensRecuperados.push({
              ...produto,
              qtd: item.quantidade,
              preco_venda: item.preco_unitario,
              tipo: 'produto'
            });
          }
        } else if (item.tipo === 'servico') {
          const { data: servico } = await supabase
            .from('servicos')
            .select('*')
            .eq('id', item.servico_id)
            .single();
          
          if (servico) {
            itensRecuperados.push({
              ...servico,
              qtd: item.quantidade,
              preco_venda: item.preco_unitario,
              tipo: 'servico',
              nome: item.nome || servico.nome
            });
          }
        }
      }
      
      setCarrinho(itensRecuperados);
      mostrarNotificacao('success', 'Venda pendente recuperada!');
      setVendaPendenteModal(false);
      
    } catch (error) {
      console.error('Erro ao recuperar venda:', error);
      mostrarNotificacao('error', error.message);
    }
  };

  // ✅ Finalizar Venda completa
  const finalizarVenda = async (formaPagamento) => {
    if (!salaoId || carrinho.length === 0) {
      mostrarNotificacao('error', 'Carrinho vazio');
      return;
    }

    setProcessando(true);

    try {
      // Gerar número sequencial de venda
      let proximoNumero = ultimoNumeroVenda + 1;
      
      try {
        const { data: numeroRPC } = await supabase
          .rpc('get_proximo_numero_venda', { p_salao_id: salaoId });
        if (numeroRPC) proximoNumero = numeroRPC;
      } catch (error) {
        console.log('Usando número local:', proximoNumero);
        console.log('Erro ao recuperar próximo número de venda:', error);
      }
      
      if (!proximoNumero) throw new Error('Erro ao gerar número da venda');

      // 1. Criar venda
      const vendaData = {
        salao_id: salaoId,
        cliente_id: clienteSelecionado?.id || null,
        subtotal: subtotal,
        desconto: valorDesconto,
        total: total,
        forma_pagamento: formaPagamento,
        status: 'concluida',
        numero_venda: proximoNumero,
        pontos_gerados: pontosGanhos,
        cashback_gerado: valorCashback
      };

      const { data: venda, error: vendaErro } = await supabase
        .from('vendas')
        .insert([vendaData])
        .select()
        .single();

      if (vendaErro) throw vendaErro;

      // 2. Salvar itens e atualizar estoque
      for (const item of carrinho) {
        if (item.tipo === 'produto') {
          // Item da venda - PRODUTO
          await supabase.from('itens_venda').insert([{
            venda_id: venda.id,
            produto_id: item.id,
            servico_id: null,
            tipo: 'produto',
            quantidade: item.qtd,
            preco_unitario: item.preco_venda,
            total: item.preco_venda * item.qtd,
            nome: item.nome
          }]);

          // Atualizar estoque
          const produtoOriginal = produtos.find(p => p.id === item.id);
          const novoEstoque = produtoOriginal.quantidade_atual - item.qtd;
          
          await supabase
            .from('produtos')
            .update({ quantidade_atual: novoEstoque })
            .eq('id', item.id);

          // Movimentação de estoque
          await supabase.from('movimentacoes_estoque').insert([{
            salao_id: salaoId,
            produto_id: item.id,
            tipo: 'saida',
            quantidade: item.qtd,
            custo_unitario: item.custo_unitario || 0,
            observacoes: `Venda #${venda.numero_venda}`
          }]);

        } else if (item.tipo === 'servico') {
          // Item da venda - SERVIÇO
          await supabase.from('itens_venda').insert([{
            venda_id: venda.id,
            produto_id: null,
            servico_id: item.id,
            tipo: 'servico',
            quantidade: item.qtd,
            preco_unitario: item.preco_venda,
            total: item.preco_venda * item.qtd,
            nome: item.nome
          }]);

          // Se vier de um agendamento, marcar como concluído
          if (item.agendamento_id) {
            await supabase
              .from('agendamentos')
              .update({ status: 'concluido' })
              .eq('id', item.agendamento_id);
          }
        }
      }

      // 3. Atualizar cliente (fidelidade)
      if (clienteSelecionado) {
        await supabase
          .from('clientes')
          .update({ 
            pontos: (clienteSelecionado.pontos || 0) + pontosGanhos,
            saldo_cashback: (clienteSelecionado.saldo_cashback || 0) + valorCashback,
            ultima_visita: new Date().toISOString(),
            total_gasto: (clienteSelecionado.total_gasto || 0) + total,
            total_compras: (clienteSelecionado.total_compras || 0) + 1,
            ultima_compra: new Date().toISOString()
          })
          .eq('id', clienteSelecionado.id);
      }

      // 4. Enviar recibo via WhatsApp se houver cliente
      if (clienteSelecionado?.whatsapp) {
        setTimeout(() => {
          enviarPDFWhatsApp(venda);
        }, 1500);
      }

      // 5. Atualizar interface
      mostrarNotificacao('success', `Venda #${venda.numero_venda} concluída!`);
      
      // Recarregar produtos
      const { data: prodsAtualizados } = await supabase
        .from('produtos')
        .select('*')
        .eq('salao_id', salaoId)
        .eq('ativo', true)
        .gt('quantidade_atual', 0)
        .order('nome');
      
      if (prodsAtualizados) setProdutos(prodsAtualizados);

      // Recarregar agendamentos
      const hoje = new Date().toISOString().split('T')[0];
      const { data: agendsAtualizados } = await supabase
        .from('agendamentos')
        .select(`
          *,
          clientes (nome, telefone, whatsapp),
          servicos (nome, preco_base)
        `)
        .eq('salao_id', salaoId)
        .gte('data', hoje)
        .lte('data', hoje)
        .eq('status', 'confirmado')
        .order('hora_inicio');
      
      if (agendsAtualizados) setAgendamentos(agendsAtualizados);

      // Limpar carrinho
      setTimeout(() => {
        setCarrinho([]);
        setClienteSelecionado(null);
        setDesconto(0);
        setPagamentoModal(false);
        setCarrinhoSalvo(true);
      }, 2000);

    } catch (error) {
      console.error('Erro na venda:', error);
      mostrarNotificacao('error', error.message);
    } finally {
      setProcessando(false);
    }
  };

  // 🔍 Filtros
  const produtosFiltrados = useMemo(() => {
    let filtrados = produtos.filter(p => 
      p.nome.toLowerCase().includes(busca.toLowerCase()) ||
      p.codigo_barras?.includes(busca)
    );

    if (categoriaSelecionada !== 'todas') {
      filtrados = filtrados.filter(p => p.categoria === categoriaSelecionada);
    }

    return filtrados;
  }, [produtos, busca, categoriaSelecionada]);

  const servicosFiltrados = useMemo(() => {
    return servicos.filter(s => 
      s.nome.toLowerCase().includes(busca.toLowerCase()) ||
      s.descricao?.toLowerCase().includes(busca.toLowerCase())
    );
  }, [servicos, busca]);

  const clientesFiltrados = useMemo(() => {
    return clientes.filter(cliente =>
      cliente.nome.toLowerCase().includes(busca.toLowerCase()) ||
      cliente.whatsapp?.includes(busca) ||
      cliente.telefone?.includes(busca) ||
      cliente.email?.toLowerCase().includes(busca.toLowerCase())
    );
  }, [clientes, busca]);

  const agendamentosHoje = useMemo(() => {
    return agendamentos.filter(a => a.status === 'confirmado');
  }, [agendamentos]);

  // 📱 Componente Notificação
  const Notificacao = () => {
    if (!notificacao.visivel) return null;
    
    const cores = {
      success: 'bg-gradient-to-r from-green-600 to-emerald-700',
      error: 'bg-gradient-to-r from-red-600 to-rose-700',
      warning: 'bg-gradient-to-r from-yellow-600 to-amber-700',
      info: 'bg-gradient-to-r from-blue-600 to-cyan-700'
    };

    return (
      <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-[100] rounded-xl p-4 flex items-center gap-3 animate-in slide-in-from-top-4 duration-300 shadow-xl ${cores[notificacao.tipo]}`}>
        <CheckCircle2 className="w-5 h-5 text-white" />
        <span className="text-white font-medium">{notificacao.mensagem}</span>
      </div>
    );
  };

  // 📊 Componente Histórico Modal
  const HistoricoModal = () => {
    if (!historicoModal || !historicoCliente) return null;

    const calcularTotalVenda = (venda) => {
      if (venda.itens_venda) {
        return venda.itens_venda.reduce((acc, item) => acc + item.total, 0);
      }
      return venda.total || 0;
    };

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
        <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <History className="w-5 h-5" />
                Histórico do Cliente
              </h3>
              <p className="text-gray-600 mt-1">
                {clienteSelecionado?.nome} • {historicoCliente.length} compras
              </p>
            </div>
            <button
              onClick={() => setHistoricoModal(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="overflow-y-auto p-6 max-h-[70vh]">
            {carregandoHistorico ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : historicoCliente.length === 0 ? (
              <div className="text-center py-8">
                <Package2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Nenhuma compra registrada</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Desktop - Tabela */}
                <div className="hidden lg:block">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-gray-500 text-sm border-b">
                        <th className="pb-3">Venda</th>
                        <th className="pb-3">Data</th>
                        <th className="pb-3">Itens</th>
                        <th className="pb-3">Pagamento</th>
                        <th className="pb-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historicoCliente.map((venda) => (
                        <tr key={venda.id} className="border-b hover:bg-gray-50">
                          <td className="py-4">
                            <div className="font-medium">#{venda.numero_venda}</div>
                          </td>
                          <td className="py-4">
                            {new Date(venda.created_at).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="py-4">
                            <div className="flex flex-wrap gap-1">
                              {venda.itens_venda?.slice(0, 3).map((item, idx) => (
                                <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                  {item.quantidade}x {item.nome?.substring(0, 15)}
                                </span>
                              ))}
                              {venda.itens_venda?.length > 3 && (
                                <span className="text-xs text-gray-500">
                                  +{venda.itens_venda.length - 3} itens
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-4">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              venda.forma_pagamento === 'pix' ? 'bg-green-100 text-green-800' :
                              venda.forma_pagamento === 'dinheiro' ? 'bg-amber-100 text-amber-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {venda.forma_pagamento}
                            </span>
                          </td>
                          <td className="py-4 text-right font-bold">
                            R$ {calcularTotalVenda(venda).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile - Cards */}
                <div className="lg:hidden space-y-3">
                  {historicoCliente.map((venda) => (
                    <div key={venda.id} className="bg-gray-50 p-4 rounded-xl border">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="font-bold">Venda #{venda.numero_venda}</div>
                          <div className="text-sm text-gray-600">
                            {new Date(venda.created_at).toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          venda.forma_pagamento === 'pix' ? 'bg-green-100 text-green-800' :
                          venda.forma_pagamento === 'dinheiro' ? 'bg-amber-100 text-amber-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {venda.forma_pagamento}
                        </span>
                      </div>
                      
                      <div className="mb-3">
                        <div className="text-sm text-gray-700 mb-1">Itens:</div>
                        <div className="flex flex-wrap gap-1">
                          {venda.itens_venda?.slice(0, 2).map((item, idx) => (
                            <span key={idx} className="text-xs bg-white border px-2 py-1 rounded">
                              {item.quantidade}x {item.nome?.substring(0, 12)}
                            </span>
                          ))}
                          {venda.itens_venda?.length > 2 && (
                            <span className="text-xs text-gray-500">
                              +{venda.itens_venda.length - 2} itens
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="text-sm">
                          {venda.itens_venda?.length || 0} itens
                        </div>
                        <div className="font-bold">
                          R$ {calcularTotalVenda(venda).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ✂️ Componente Serviços/Agendamentos Modal
  const ServicosModal = () => {
    if (!servicosModal) return null;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
        <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Scissors className="w-5 h-5" />
                  Serviços e Agendamentos
                </h3>
                <p className="text-gray-600 mt-1">
                  Selecione serviços para adicionar à venda
                </p>
              </div>
              <button
                onClick={() => setServicosModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-6 overflow-y-auto max-h-[70vh]">
            {/* Agendamentos para hoje */}
            <div className="mb-8">
              <h4 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                <CalendarDays className="w-4 h-4" />
                Agendamentos de Hoje ({agendamentosHoje.length})
              </h4>
              {agendamentosHoje.length === 0 ? (
                <div className="text-center py-4 bg-gray-50 rounded-xl">
                  <p className="text-gray-500">Nenhum agendamento para hoje</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {agendamentosHoje.map((agendamento) => (
                    <div key={agendamento.id} className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="font-bold text-blue-800">
                            {agendamento.servicos?.nome}
                          </div>
                          <div className="text-sm text-blue-600 mt-1">
                            Cliente: {agendamento.clientes?.nome}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            {agendamento.data} • {agendamento.hora_inicio}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-blue-800">
                            R$ {agendamento.servicos?.preco_base?.toFixed(2) || '0.00'}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          adicionarServicoAgendamento(agendamento);
                          if (agendamento.cliente_id && !clienteSelecionado) {
                            const cliente = clientes.find(c => c.id === agendamento.cliente_id);
                            if (cliente) setClienteSelecionado(cliente);
                          }
                        }}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
                      >
                        Adicionar ao Carrinho
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Lista de serviços */}
            <div>
              <h4 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                <Scissors className="w-4 h-4" />
                Catálogo de Serviços ({servicos.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {servicosFiltrados.map((servico) => (
                  <div key={servico.id} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="font-bold text-gray-800">
                          {servico.nome}
                        </div>
                        {servico.duracao && (
                          <div className="text-xs text-gray-600 mt-1">
                            ⏱️ {servico.duracao} min
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-800">
                          R$ {servico.preco_base?.toFixed(2) || '0.00'}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => adicionarAoCarrinho(servico, 'servico')}
                        className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium"
                      >
                        Adicionar
                      </button>
                      <button
                        onClick={() => {
                          setServicoEditando(servico);
                          setServicoPrecoEdit(servico.preco_base?.toString() || '');
                        }}
                        className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm"
                        title="Editar preço"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 💳 Componente Editar Preço do Serviço
  const EditarPrecoModal = () => {
    if (!servicoEditando) return null;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[80] p-4">
        <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-800">Editar Preço do Serviço</h3>
            <p className="text-gray-600 mt-1">{servicoEditando.nome}</p>
          </div>
          <div className="p-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Novo Preço (R$)
              </label>
              <input
                type="number"
                value={servicoPrecoEdit}
                onChange={(e) => setServicoPrecoEdit(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="0.00"
                step="0.01"
                min="0"
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  const novoPreco = parseFloat(servicoPrecoEdit);
                  if (!isNaN(novoPreco) && novoPreco >= 0) {
                    editarPrecoServico(servicoEditando.id, novoPreco);
                    setServicoEditando(null);
                    setServicoPrecoEdit('');
                  }
                }}
                className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg"
              >
                Aplicar
              </button>
              <button
                onClick={() => {
                  setServicoEditando(null);
                  setServicoPrecoEdit('');
                }}
                className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 💳 Componente Vendas Pendentes
  const VendasPendentesModal = () => {
    if (!vendaPendenteModal) return null;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
        <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Clock3 className="w-5 h-5" />
                Vendas Pendentes
              </h3>
              <button
                onClick={() => setVendaPendenteModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-6 overflow-y-auto max-h-[70vh]">
            {vendasPendentes.length === 0 ? (
              <div className="text-center py-8">
                <Clock3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Nenhuma venda pendente</p>
              </div>
            ) : (
              <div className="space-y-3">
                {vendasPendentes.map((venda) => (
                  <div key={venda.id} className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="font-bold">Venda #{venda.numero_venda}</div>
                        <div className="text-sm text-gray-600">
                          {new Date(venda.created_at).toLocaleDateString('pt-BR')}
                        </div>
                        {venda.clientes && (
                          <div className="text-sm text-gray-700 mt-1">
                            Cliente: {venda.clientes.nome}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-bold">R$ {venda.total.toFixed(2)}</div>
                        <div className="text-xs text-amber-700 bg-amber-100 px-2 py-1 rounded-full mt-1">
                          Pendente
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => recuperarVendaPendente(venda.id)}
                        className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg flex items-center justify-center gap-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Recuperar
                      </button>
                      <button
                        onClick={() => {
                          if (venda.clientes) {
                            setClienteSelecionado(venda.clientes);
                          }
                          setVendaPendenteModal(false);
                        }}
                        className="flex-1 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
                      >
                        Usar Cliente
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={salvarVendaPendente}
                disabled={carrinho.length === 0 || processando}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Salvar Venda Atual como Pendente
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 📱 Abas para Mobile/Tablet
  const AbasMobile = () => {
    const abas = [
      { id: 'produtos', label: 'Produtos', icon: Package, count: produtosFiltrados.length },
      { id: 'servicos', label: 'Serviços', icon: Scissors, count: servicos.length },
      { id: 'carrinho', label: 'Carrinho', icon: ShoppingCart, count: carrinho.length }
    ];

    return (
      <div className="lg:hidden flex border-b border-gray-200 bg-white">
        {abas.map((aba) => (
          <button
            key={aba.id}
            onClick={() => setAbaAtiva(aba.id)}
            className={`flex-1 py-4 text-center font-medium relative ${
              abaAtiva === aba.id
                ? 'border-b-2 border-purple-600 text-purple-600'
                : 'text-gray-600'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <aba.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{aba.label}</span>
              {aba.count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  aba.id === 'carrinho' 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {aba.count}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    );
  };

  // Função para imprimir recibo (texto simples)
  const imprimirRecibo = () => {
    const vendaTemp = {
      id: Date.now().toString(),
      forma_pagamento: 'A definir'
    };
    
    // Gerar texto do recibo
    const data = new Date();
    let texto = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   📋 COMPROVANTE DE COMPRA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🏪 Salão ID: ${salaoId}
📅 Data: ${data.toLocaleDateString('pt-BR')}
⏰ Hora: ${data.toLocaleTimeString('pt-BR')}
🔖 Venda: #${ultimoNumeroVenda + 1}

`;

    if (clienteSelecionado) {
      texto += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 CLIENTE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Nome: ${clienteSelecionado.nome}
WhatsApp: ${clienteSelecionado.whatsapp || 'Não informado'}

`;
    }

    texto += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🛍️ ITENS DA COMPRA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`;

    carrinho.forEach(item => {
      const tipo = item.tipo === 'servico' ? '✂️' : '📦';
      texto += `${tipo} ${item.nome}
   ${item.qtd}x R$ ${item.preco_venda.toFixed(2)} = R$ ${(item.preco_venda * item.qtd).toFixed(2)}

`;
    });

    texto += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 VALORES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Subtotal: R$ ${subtotal.toFixed(2)}
`;

    if (valorDesconto > 0) {
      texto += `Desconto: -R$ ${valorDesconto.toFixed(2)}
`;
    }

    texto += `
✅ TOTAL: R$ ${total.toFixed(2)}
💳 Pagamento: A definir

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    Obrigado pela preferência!
         Volte sempre! 🌟

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

    const janelaImpressao = window.open('', '_blank');
    janelaImpressao.document.write(`
      <html>
        <head>
          <title>Recibo de Venda</title>
          <style>
            body {
              font-family: 'Courier New', monospace;
              padding: 20px;
              white-space: pre-wrap;
              font-size: 12px;
            }
            @media print {
              body { margin: 0; }
            }
          </style>
        </head>
        <body>${texto}</body>
      </html>
    `);
    janelaImpressao.document.close();
    janelaImpressao.print();
  };

  // Renderização condicional baseada no viewport
  const gridColsProdutos = isMobile ? 'grid-cols-2' : isTablet ? 'grid-cols-3' : 'grid-cols-4 lg:grid-cols-5';
  const painelCarrinhoWidth = isMobile ? 'w-full' : isTablet ? 'w-1/2' : 'w-1/3';
  const painelProdutosWidth = isMobile ? 'w-full' : isTablet ? 'w-1/2' : 'w-2/3';

  return (
    <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col overflow-hidden">
      <Notificacao />
      <HistoricoModal />
      <ServicosModal />
      <EditarPrecoModal />
      <VendasPendentesModal />
      
      {/* HEADER */}
      <div className="bg-white border-b border-gray-200 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={onVoltar}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                onlineStatus ? 'bg-green-500 animate-pulse' : 'bg-red-500'
              }`}></div>
              <h1 className="text-xl font-bold text-gray-800">PDV - Ponto de Venda</h1>
              <span className="hidden sm:inline text-sm text-gray-500">
                {isMobile ? '📱' : isTablet ? '📟' : '💻'} 
                {isMobile ? ' Mobile' : isTablet ? ' Tablet' : ' Desktop'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Status online/offline */}
            <div className={`px-3 py-1.5 rounded-full text-sm flex items-center gap-2 ${
              onlineStatus 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {onlineStatus ? (
                <>
                  <Wifi className="w-3 h-3" />
                  <span>Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3" />
                  <span>Offline</span>
                </>
              )}
            </div>
            
            <div className="text-right hidden sm:block">
              <p className="text-sm text-gray-600">Salão ID: {salaoId}</p>
              <p className="text-xs text-gray-500">{new Date().toLocaleDateString('pt-BR')}</p>
            </div>
          </div>
        </div>

        {/* Botão Serviços/Agendamentos */}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => setServicosModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg flex items-center gap-2 text-sm"
          >
            <Scissors className="w-4 h-4" />
            Serviços & Agendamentos
            {agendamentosHoje.length > 0 && (
              <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                {agendamentosHoje.length} hoje
              </span>
            )}
          </button>
          
          {/* Aviso de carrinho não salvo */}
          {carrinho.length > 0 && !carrinhoSalvo && (
            <div className="flex-1 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <span className="text-amber-700 font-medium">
                  Você tem itens no carrinho não salvos
                </span>
              </div>
              <button
                onClick={salvarVendaPendente}
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm"
              >
                Salvar como Pendente
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ABAS MOBILE/TABLET */}
      <AbasMobile />

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* PAINEL PRODUTOS/SERVIÇOS */}
        <div className={`
          ${abaAtiva !== 'carrinho' ? 'flex' : 'hidden'} 
          lg:flex ${painelProdutosWidth} flex-col border-r border-gray-200
        `}>
          {/* SEARCH BAR */}
          <div className="p-4 bg-white border-b border-gray-200">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  ref={buscaInputRef}
                  type="text"
                  placeholder={`Buscar ${abaAtiva === 'servicos' ? 'serviços' : 'produtos'}...`}
                  value={busca}
                  onChange={e => setBusca(e.target.value)}
                  className="w-full pl-12 pr-10 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-800 placeholder-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none transition-all"
                />
                {busca && (
                  <button 
                    onClick={() => setBusca('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              {abaAtiva === 'produtos' && (
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-gray-400 hidden sm:block" />
                  <select 
                    value={categoriaSelecionada}
                    onChange={e => setCategoriaSelecionada(e.target.value)}
                    className="bg-gray-50 border border-gray-300 rounded-lg px-3 py-2.5 text-gray-700 focus:outline-none focus:border-purple-500 w-full sm:w-auto"
                  >
                    <option value="todas">Todas categorias</option>
                    {categorias.filter(c => c !== 'todas').map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* PRODUCTS/SERVICES GRID */}
          <div className="flex-1 overflow-y-auto bg-gray-50 p-2 sm:p-4">
            {abaAtiva === 'produtos' ? (
              produtosFiltrados.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-8">
                  <Package className="w-20 h-20 text-gray-300 mb-4" />
                  <p className="text-gray-500 text-lg text-center">Nenhum produto encontrado</p>
                  <p className="text-gray-400 text-sm mt-1 text-center">
                    Tente outra busca ou categoria
                  </p>
                </div>
              ) : (
                <div className={`grid ${gridColsProdutos} gap-2 sm:gap-4`}>
                  {produtosFiltrados.map(produto => (
                    <button
                      key={produto.id}
                      onClick={() => adicionarAoCarrinho(produto, 'produto')}
                      disabled={produto.quantidade_atual <= 0}
                      className="group bg-white rounded-xl border border-gray-200 p-3 sm:p-4 hover:border-purple-500 hover:shadow-lg transition-all duration-200 flex flex-col items-start text-left disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                    >
                      <div className="w-full">
                        <div className="flex justify-between items-start mb-2">
                          <Tag className="w-4 h-4 text-purple-500" />
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            produto.quantidade_atual > 10 ? 'bg-green-100 text-green-700' : 
                            produto.quantidade_atual > 5 ? 'bg-blue-100 text-blue-700' : 
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {produto.quantidade_atual} un
                          </span>
                        </div>
                        
                        <h3 className="font-semibold text-gray-800 text-sm mb-1 line-clamp-2 group-hover:text-purple-700 min-h-[40px]">
                          {produto.nome}
                        </h3>
                        
                        <p className="text-xs text-gray-500 mb-3 truncate">
                          {produto.categoria || 'Sem categoria'}
                        </p>
                        
                        <div className="flex justify-between items-center w-full">
                          <span className="text-lg font-bold text-gray-900">
                            R$ {Number(produto.preco_venda).toFixed(2)}
                          </span>
                          {produto.quantidade_atual <= 5 && produto.quantidade_atual > 0 && (
                            <span className="text-xs text-amber-600 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> 
                              <span className="hidden sm:inline">Baixo</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )
            ) : abaAtiva === 'servicos' ? (
              servicosFiltrados.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-8">
                  <Scissors className="w-20 h-20 text-gray-300 mb-4" />
                  <p className="text-gray-500 text-lg text-center">Nenhum serviço encontrado</p>
                  <p className="text-gray-400 text-sm mt-1 text-center">
                    Tente outra busca
                  </p>
                </div>
              ) : (
                <div className={`grid ${gridColsProdutos} gap-2 sm:gap-4`}>
                  {servicosFiltrados.map(servico => (
                    <button
                      key={servico.id}
                      onClick={() => adicionarAoCarrinho(servico, 'servico')}
                      className="group bg-white rounded-xl border border-gray-200 p-3 sm:p-4 hover:border-blue-500 hover:shadow-lg transition-all duration-200 flex flex-col items-start text-left active:scale-[0.98]"
                    >
                      <div className="w-full">
                        <div className="flex justify-between items-start mb-2">
                          <Scissors className="w-4 h-4 text-blue-500" />
                          {servico.duracao && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                              {servico.duracao} min
                            </span>
                          )}
                        </div>
                        
                        <h3 className="font-semibold text-gray-800 text-sm mb-1 line-clamp-2 group-hover:text-blue-700 min-h-[40px]">
                          {servico.nome}
                        </h3>
                        
                        <p className="text-xs text-gray-500 mb-3 line-clamp-2 h-10">
                          {servico.descricao || 'Sem descrição'}
                        </p>
                        
                        <div className="flex justify-between items-center w-full">
                          <span className="text-lg font-bold text-gray-900">
                            R$ {Number(servico.preco_base).toFixed(2)}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setServicoEditando(servico);
                              setServicoPrecoEdit(servico.preco_base?.toString() || '');
                            }}
                            className="text-xs text-gray-500 hover:text-blue-600"
                            title="Editar preço"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )
            ) : null}
          </div>
        </div>

        {/* PAINEL CARRINHO */}
        <div className={`
          ${abaAtiva === 'carrinho' ? 'flex' : 'hidden'} 
          lg:flex ${painelCarrinhoWidth} flex-col bg-white border-l border-gray-200
        `}>
          {/* CART HEADER */}
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-3">
                <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                Carrinho
                {carrinho.length > 0 && (
                  <span className="text-sm bg-purple-600 text-white px-2 py-1 rounded-full">
                    {carrinho.length}
                  </span>
                )}
              </h2>
              {carrinho.length > 0 && (
                <button 
                  onClick={() => {
                    if (window.confirm('Deseja limpar o carrinho?')) {
                      setCarrinho([]);
                      setCarrinhoSalvo(true);
                    }
                  }}
                  className="text-sm text-red-600 hover:text-red-700 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Limpar</span>
                </button>
              )}
            </div>

            {/* CLIENT SELECTION */}
            <div className="mb-4 relative">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Cliente
                </label>
                <div className="flex items-center gap-2">
                  {clienteSelecionado && (
                    <>
                      <button
                        onClick={() => carregarHistoricoCliente(clienteSelecionado.id)}
                        className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        <History className="w-4 h-4" />
                        <span className="hidden sm:inline">Histórico</span>
                      </button>
                      <button
                        onClick={() => setServicosModal(true)}
                        className="text-sm text-green-600 hover:text-green-700 flex items-center gap-1"
                      >
                        <Scissors className="w-4 h-4" />
                        <span className="hidden sm:inline">Agendamentos</span>
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setDropdownClientesAberto(!dropdownClientesAberto)}
                    className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
                  >
                    {clienteSelecionado ? 'Alterar' : 'Selecionar'}
                    <ChevronDown className={`w-4 h-4 transition-transform ${dropdownClientesAberto ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              </div>
              
              {clienteSelecionado ? (
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <p className="font-medium text-gray-800">{clienteSelecionado.nome}</p>
                        <div className="flex items-center gap-2">
                          {clienteSelecionado.status === 'vip' && (
                            <span className="text-xs bg-gradient-to-r from-amber-500 to-yellow-500 text-white px-2 py-1 rounded-full flex items-center gap-1">
                              <Star className="w-3 h-3" />
                              VIP
                            </span>
                          )}
                          {clienteSelecionado.pontos > 0 && (
                            <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full flex items-center gap-1">
                              <Award className="w-3 h-3" />
                              {clienteSelecionado.pontos} pts
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        {clienteSelecionado.whatsapp && (
                          <span className="text-sm text-gray-600 flex items-center gap-1">
                            <Smartphone className="w-3 h-3" />
                            <span className="truncate">{clienteSelecionado.whatsapp}</span>
                          </span>
                        )}
                        {clienteSelecionado.total_gasto > 0 && (
                          <span className="text-sm text-gray-600">
                            Gasto total: R$ {clienteSelecionado.total_gasto.toFixed(2)}
                          </span>
                        )}
                      </div>
                      
                      {clienteSelecionado.saldo_cashback > 0 && (
                        <div className="mt-2 p-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-green-700 font-medium flex items-center gap-1">
                              <DollarSign className="w-4 h-4" />
                              Cashback disponível
                            </span>
                            <span className="font-bold text-green-700">
                              R$ {clienteSelecionado.saldo_cashback.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => setClienteSelecionado(null)}
                      className="text-gray-400 hover:text-gray-600 ml-2"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => setDropdownClientesAberto(true)}
                  className="bg-gray-50 p-4 rounded-xl border-2 border-dashed border-gray-300 text-center cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <User className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Cliente não selecionado</p>
                  <p className="text-xs text-gray-500">Toque para selecionar</p>
                </div>
              )}

              {/* CLIENT DROPDOWN */}
              {dropdownClientesAberto && (
                <div className="absolute z-10 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-y-auto">
                  <div className="p-3 border-b border-gray-200">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Buscar cliente..."
                        value={busca}
                        onChange={e => setBusca(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:border-purple-500"
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="p-2 max-h-48 overflow-y-auto">
                    {clientesFiltrados.slice(0, 10).map(cliente => (
                      <button
                        key={cliente.id}
                        onClick={() => {
                          setClienteSelecionado(cliente);
                          setDropdownClientesAberto(false);
                          setBusca('');
                          mostrarNotificacao('success', `${cliente.nome} selecionado`);
                        }}
                        className="w-full p-3 text-left hover:bg-gray-50 rounded-lg flex items-center gap-3 active:bg-gray-100"
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          cliente.status === 'vip' 
                            ? 'bg-gradient-to-br from-amber-100 to-yellow-100' 
                            : 'bg-gradient-to-br from-purple-100 to-pink-100'
                        }`}>
                          {cliente.status === 'vip' ? (
                            <Star className="w-5 h-5 text-amber-600" />
                          ) : (
                            <User className="w-5 h-5 text-purple-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 truncate">{cliente.nome}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {cliente.whatsapp && (
                              <p className="text-sm text-gray-600 truncate flex items-center gap-1">
                                <Smartphone className="w-3 h-3 flex-shrink-0" />
                                {cliente.whatsapp}
                              </p>
                            )}
                            {cliente.pontos > 0 && (
                              <span className="text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full">
                                {cliente.pontos} pts
                              </span>
                            )}
                            {cliente.dias_sem_visita > 45 && (
                              <span className="text-xs bg-red-100 text-red-800 px-1.5 py-0.5 rounded-full">
                                {cliente.dias_sem_visita}d
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* BOTÕES DE AÇÃO RÁPIDA */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setVendaPendenteModal(true)}
                className="flex-1 py-2 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
              >
                <Clock3 className="w-4 h-4" />
                Pendentes
              </button>
              <button
                onClick={imprimirRecibo}
                disabled={carrinho.length === 0}
                className="flex-1 py-2 bg-blue-100 hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed text-blue-700 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Pré-visualizar
              </button>
              <button
                onClick={() => setServicosModal(true)}
                className="flex-1 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
              >
                <Scissors className="w-4 h-4" />
                Serviços
              </button>
            </div>
          </div>

          {/* CART ITEMS */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {carrinho.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8">
                <ShoppingCart className="w-16 h-16 mb-4 opacity-30" />
                <p className="text-gray-500 mb-1 text-center">Carrinho vazio</p>
                <p className="text-sm text-gray-400 text-center">
                  Adicione produtos ou serviços para iniciar uma venda
                </p>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => setAbaAtiva('produtos')}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg"
                  >
                    Produtos
                  </button>
                  <button
                    onClick={() => setAbaAtiva('servicos')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                  >
                    Serviços
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {carrinho.map(item => (
                  <div key={`${item.tipo}-${item.id}`} className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              {item.tipo === 'servico' ? (
                                <Scissors className="w-4 h-4 text-blue-500" />
                              ) : (
                                <Package className="w-4 h-4 text-purple-500" />
                              )}
                              <h4 className="font-medium text-gray-800">{item.nome}</h4>
                              {item.tipo === 'servico' && (
                                <button
                                  onClick={() => {
                                    setServicoEditando(item);
                                    setServicoPrecoEdit(item.preco_venda.toString());
                                  }}
                                  className="text-xs text-gray-500 hover:text-blue-600"
                                  title="Editar preço"
                                >
                                  <Edit className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              R$ {item.preco_venda.toFixed(2)}/{item.tipo === 'servico' ? 'serviço' : 'un'}
                            </p>
                            {item.observacao && (
                              <p className="text-xs text-gray-500 mt-1 italic">
                                {item.observacao}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => removerDoCarrinho(item.id, item.tipo)}
                            className="text-gray-400 hover:text-red-500 ml-2"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center bg-white border border-gray-300 rounded-lg">
                            <button
                              onClick={() => ajustarQtd(item.id, item.tipo, -1)}
                              className="p-2 sm:p-3 text-gray-600 hover:text-purple-600 hover:bg-gray-100 rounded-l-lg active:bg-gray-200"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-8 sm:w-12 text-center font-medium text-gray-800">
                              {item.qtd}
                            </span>
                            <button
                              onClick={() => ajustarQtd(item.id, item.tipo, 1)}
                              className="p-2 sm:p-3 text-gray-600 hover:text-purple-600 hover:bg-gray-100 rounded-r-lg active:bg-gray-200"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <p className="text-lg font-bold text-gray-900">
                            R$ {(item.preco_venda * item.qtd).toFixed(2)}
                          </p>
                        </div>
                        
                        {/* Estoque restante (apenas para produtos) */}
                        {item.tipo === 'produto' && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="text-xs text-gray-500">
                              Estoque restante: {item.quantidade_atual - item.qtd} unidades
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                              <div 
                                className={`h-1.5 rounded-full ${
                                  (item.quantidade_atual - item.qtd) / item.quantidade_atual > 0.3 
                                    ? 'bg-green-500' 
                                    : 'bg-red-500'
                                }`}
                                style={{ 
                                  width: `${((item.quantidade_atual - item.qtd) / item.quantidade_atual) * 100}%` 
                                }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CART SUMMARY */}
          <div className="border-t border-gray-200 p-4 sm:p-6 bg-gradient-to-b from-white to-gray-50">
            {/* Desconto */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Percent className="w-4 h-4" />
                  Desconto
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setTipoDesconto('percentual')}
                    className={`px-3 py-1 text-sm rounded-lg ${
                      tipoDesconto === 'percentual' 
                        ? 'bg-purple-100 text-purple-700' 
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    %
                  </button>
                  <button
                    onClick={() => setTipoDesconto('valor')}
                    className={`px-3 py-1 text-sm rounded-lg ${
                      tipoDesconto === 'valor' 
                        ? 'bg-purple-100 text-purple-700' 
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    R$
                  </button>
                </div>
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={desconto}
                  onChange={e => setDesconto(Math.max(0, Number(e.target.value)))}
                  className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:border-purple-500"
                  placeholder={tipoDesconto === 'percentual' ? '0-100%' : 'Valor em R$'}
                  min="0"
                  max={tipoDesconto === 'percentual' ? 100 : subtotal}
                  step={tipoDesconto === 'percentual' ? 1 : 0.01}
                />
                <button
                  onClick={() => setDesconto(0)}
                  className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                >
                  Limpar
                </button>
              </div>
            </div>

            {/* Fidelidade */}
            {clienteSelecionado && configFidelidade.ativo && total >= configFidelidade.valorMinimoParaPontos && (
              <div className="mb-4 p-3 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-amber-800 flex items-center gap-2">
                    <Award className="w-4 h-4" />
                    Programa Fidelidade
                  </span>
                  <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                    {configFidelidade.pontosPorReal} pts/R$
                  </span>
                </div>
                <div className="text-sm text-amber-700">
                  Esta compra vai gerar: <span className="font-bold">{pontosGanhos} pontos</span>
                </div>
                {valorCashback > 0 && (
                  <div className="text-sm text-green-700 mt-1">
                    Cashback: <span className="font-bold">R$ {valorCashback.toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Totais */}
            <div className="space-y-3 mb-4 sm:mb-6">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>R$ {subtotal.toFixed(2)}</span>
              </div>
              
              {valorDesconto > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Desconto</span>
                  <span>- R$ {valorDesconto.toFixed(2)}</span>
                </div>
              )}
              
              <div className="h-px bg-gray-200 my-2"></div>
              
              <div className="flex justify-between text-lg font-bold text-gray-900">
                <span>Total</span>
                <span className="text-xl sm:text-2xl">R$ {total.toFixed(2)}</span>
              </div>
            </div>

            {/* Botões de ação */}
            <div className="space-y-2">
              {/* Botões de pagamento rápido em mobile/tablet */}
              <div className="lg:hidden grid grid-cols-2 gap-2 mb-4">
                <button
                  onClick={() => finalizarVenda('pix')}
                  disabled={carrinho.length === 0 || processando}
                  className="p-3 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl hover:border-green-500 disabled:opacity-50"
                >
                  <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
                    <QrCode className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="font-medium text-gray-800 block text-sm">PIX</span>
                </button>

                <button
                  onClick={() => finalizarVenda('dinheiro')}
                  disabled={carrinho.length === 0 || processando}
                  className="p-3 bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-xl hover:border-amber-500 disabled:opacity-50"
                >
                  <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-gradient-to-br from-amber-100 to-yellow-100 flex items-center justify-center">
                    <Banknote className="w-4 h-4 text-amber-600" />
                  </div>
                  <span className="font-medium text-gray-800 block text-sm">Dinheiro</span>
                </button>
              </div>

              {/* Botão Finalizar */}
              <button
                onClick={() => {
                  if (window.innerWidth >= 1024) {
                    carrinho.length > 0 && setPagamentoModal(true);
                  } else {
                    carrinho.length > 0 && setPagamentoModal(true);
                  }
                }}
                disabled={carrinho.length === 0 || processando}
                className="w-full py-3 sm:py-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white font-bold rounded-xl flex justify-center items-center gap-3 shadow-lg shadow-purple-200 transition-all hover:shadow-xl active:scale-[0.98]"
              >
                {processando ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processando...
                  </>
                ) : (
                  <>
                    <Receipt className="w-5 h-5" />
                    <span className="hidden sm:inline">Finalizar Venda</span>
                    <span className="sm:hidden">Finalizar</span>
                    <span className="text-sm font-normal opacity-90">
                      (R$ {total.toFixed(2)})
                    </span>
                  </>
                )}
              </button>

              {/* Botão Visualizar Recibo em mobile/tablet */}
              {carrinho.length > 0 && (
                <button
                  onClick={imprimirRecibo}
                  className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl flex justify-center items-center gap-2 transition-all lg:hidden"
                >
                  <Eye className="w-4 h-4" />
                  Visualizar Recibo
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* PAYMENT MODAL */}
      {pagamentoModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800">Forma de Pagamento</h3>
                <button
                  onClick={() => setPagamentoModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-gray-600 mt-1">Selecione como o cliente irá pagar</p>
            </div>

            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <button
                  onClick={() => finalizarVenda('pix')}
                  disabled={processando}
                  className="p-4 sm:p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl hover:border-green-500 hover:shadow-lg transition-all disabled:opacity-50 active:scale-[0.98]"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
                    <QrCode className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                  </div>
                  <span className="font-bold text-gray-800 block text-sm sm:text-base">PIX</span>
                  <span className="text-xs sm:text-sm text-gray-600">Instantâneo</span>
                </button>

                <button
                  onClick={() => finalizarVenda('dinheiro')}
                  disabled={processando}
                  className="p-4 sm:p-6 bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-xl hover:border-amber-500 hover:shadow-lg transition-all disabled:opacity-50 active:scale-[0.98]"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 rounded-full bg-gradient-to-br from-amber-100 to-yellow-100 flex items-center justify-center">
                    <Banknote className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />
                  </div>
                  <span className="font-bold text-gray-800 block text-sm sm:text-base">Dinheiro</span>
                  <span className="text-xs sm:text-sm text-gray-600">Em espécie</span>
                </button>

                <button
                  onClick={() => finalizarVenda('credito')}
                  disabled={processando}
                  className="p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl hover:border-blue-500 hover:shadow-lg transition-all disabled:opacity-50 active:scale-[0.98]"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                  </div>
                  <span className="font-bold text-gray-800 block text-sm sm:text-base">Crédito</span>
                  <span className="text-xs sm:text-sm text-gray-600">Parcelado</span>
                </button>

                <button
                  onClick={() => finalizarVenda('debito')}
                  disabled={processando}
                  className="p-4 sm:p-6 bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200 rounded-xl hover:border-orange-500 hover:shadow-lg transition-all disabled:opacity-50 active:scale-[0.98]"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 rounded-full bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
                  </div>
                  <span className="font-bold text-gray-800 block text-sm sm:text-base">Débito</span>
                  <span className="text-xs sm:text-sm text-gray-600">À vista</span>
                </button>
              </div>

              {/* Fiado/Pendente */}
              <button
                onClick={salvarVendaPendente}
                disabled={carrinho.length === 0 || processando}
                className="w-full mt-4 p-4 bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-300 rounded-xl hover:border-gray-500 hover:shadow-lg transition-all disabled:opacity-50"
              >
                <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <Clock3 className="w-5 h-5 text-gray-600" />
                </div>
                <span className="font-bold text-gray-800 block">Fiado/Pendente</span>
                <span className="text-sm text-gray-600">Pagar depois</span>
              </button>

              {clienteSelecionado?.whatsapp && (
                <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-800">Envio por WhatsApp</p>
                      <p className="text-sm text-gray-600">
                        Recibo será enviado para {clienteSelecionado.nome}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 text-center">
                <p className="text-2xl font-bold text-gray-800">
                  R$ {total.toFixed(2)}
                </p>
                <p className="text-sm text-gray-600 mt-1">Valor total da compra</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};