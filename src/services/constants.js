export const ROUTES = {
  SPLASH: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  AGENDA: '/agenda',
  NOVO_AGENDAMENTO: '/agenda/novo',
  CLIENTES: '/clientes',
  NOVO_CLIENTE: '/clientes/novo',
  FINANCEIRO: '/financeiro',
  EXPERIENCIA_CLIENTE: '/experiencia-cliente',
  PERFORMANCE: '/performance',
  SAUDE_NEGOCIO: '/saude-negocio',
  CONFIGURACOES: '/configuracoes'
};

export const USER_ROLES = {
  SALAO: 'salao',
  PROFISSIONAL: 'profissional'
};

export const AGENDAMENTO_STATUS = {
  CONFIRMADO: 'confirmado',
  CONCLUIDO: 'concluido',
  CANCELADO: 'cancelado',
  AUSENTE: 'ausente'
};

export const theme = {
  colors: {
    primary: '#5B2EFF',
    primaryLight: '#9B8CFF',
    primaryDark: '#4A1ED9',
    accent: '#F472B6',
    accentLight: '#FBB6CE',
    background: '#F8F9FC',
    card: '#FFFFFF',
    cardHover: '#FAFAFF',
    textPrimary: '#1F2937',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    border: '#E5E7EB',
    borderLight: '#F3F4F6',
    gold: '#F59E0B',
    silver: '#9CA3AF',
    bronze: '#ED8936'
  },
  spacing: {
    xs: '4px', sm: '8px', md: '16px', lg: '24px', xl: '32px', xxl: '48px'
  },
  borderRadius: {
    sm: '8px', md: '12px', lg: '16px', xl: '20px', full: '9999px'
  },
  shadows: {
    sm: '0 1px 3px rgba(0,0,0,0.12)',
    md: '0 4px 6px rgba(0,0,0,0.05)',
    lg: '0 10px 25px rgba(0,0,0,0.08)',
    xl: '0 20px 40px rgba(91,46,255,0.1)'
  }
};