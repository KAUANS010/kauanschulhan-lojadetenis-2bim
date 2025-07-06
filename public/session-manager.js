// ======================= GERENCIADOR DE SESSÃO ATUALIZADO =======================

class SessionManager {
  constructor() {
    this.inactivityTimeout = 30 * 60 * 1000; // ✅ REDUZIDO: 30 minutos
    this.warningTimeout = 25 * 60 * 1000; // Aviso 5 minutos antes
    this.checkInterval = 2 * 60 * 1000; // Verifica a cada 2 minutos
    this.heartbeatInterval = 5 * 60 * 1000; // Heartbeat a cada 5 minutos

    this.lastActivity = Date.now();
    this.inactivityTimer = null;
    this.warningTimer = null;
    this.intervalTimer = null;
    this.heartbeatTimer = null;
    this.warningShown = false;

    this.init();
  }

  init() {
    // Monitora atividade do usuário
    this.setupActivityListeners();

    // Verifica sessão inicial
    this.checkInitialSession();

    // Inicia monitoramento
    this.startMonitoring();
  }

  setupActivityListeners() {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

    events.forEach(event => {
      document.addEventListener(event, () => {
        this.updateActivity();
      }, true);
    });
  }

  updateActivity() {
    this.lastActivity = Date.now();
    this.warningShown = false;

    // Limpa timers existentes
    this.clearTimers();

    // Reinicia os timers apenas se há usuário logado
    if (this.hasLocalUser()) {
      this.startInactivityTimers();
    }
  }

  clearTimers() {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
      this.warningTimer = null;
    }
  }

  startInactivityTimers() {
    // Timer para mostrar aviso
    this.warningTimer = setTimeout(() => {
      this.showInactivityWarning();
    }, this.warningTimeout);

    // Timer para logout automático
    this.inactivityTimer = setTimeout(() => {
      this.performAutoLogout();
    }, this.inactivityTimeout);
  }

  showInactivityWarning() {
    if (this.warningShown || !this.hasLocalUser()) {
      return;
    }

    this.warningShown = true;
    const remainingTime = Math.ceil((this.inactivityTimeout - this.warningTimeout) / (60 * 1000));

    const continuar = confirm(
      `⚠️ Sessão expirando!\n\n` +
      `Você ficará inativo em ${remainingTime} minutos.\n\n` +
      `Clique em "OK" para continuar ou "Cancelar" para sair.`
    );

    if (continuar) {
      this.updateActivity();
    } else {
      this.performManualLogout();
    }
  }

  async performAutoLogout() {
    if (!this.hasLocalUser()) {
      return;
    }

    console.log('🔄 Executando logout automático por inatividade');

    try {
      await this.executeLogout();
      alert('Sua sessão expirou devido à inatividade.');
    } catch (error) {
      console.error('Erro no logout automático:', error);
    }

    this.redirectToLogin();
  }

  async performManualLogout() {
    if (!this.hasLocalUser()) {
      return;
    }

    try {
      await this.executeLogout();
      alert('Logout realizado com sucesso!');
    } catch (error) {
      console.error('Erro no logout manual:', error);
    }

    this.redirectToLogin();
  }

  async executeLogout() {
    try {
      const baseUrl = window.location.origin;
      const response = await fetch(`${baseUrl}/logout`, {
        method: 'POST',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Erro na resposta do servidor');
      }

      console.log('✅ Logout no servidor realizado');
    } catch (error) {
      console.error('❌ Erro ao fazer logout no servidor:', error);
    }

    // ✅ LIMPA DADOS LOCAIS
    this.clearLocalData();
  }

  clearLocalData() {
    localStorage.removeItem('usuario');
    
    // ✅ LIMPA TAMBÉM DADOS DO CARRINHO se necessário
    // localStorage.removeItem('carrinho');
    // localStorage.removeItem('valorTotal');
    
    console.log('🧹 Dados locais limpos');
  }

  redirectToLogin() {
    // Para evitar loop infinito, verifica se já não está na página de login
    if (!window.location.pathname.includes('login')) {
      window.location.href = '/LOGIN/login.html';
    }
  }

  startMonitoring() {
    // ✅ HEARTBEAT: Verifica se a sessão ainda é válida no servidor
    this.heartbeatTimer = setInterval(() => {
      this.heartbeat();
    }, this.heartbeatInterval);

    // Verifica validade da sessão periodicamente
    this.intervalTimer = setInterval(() => {
      this.checkSessionValidity();
    }, this.checkInterval);

    // Inicia timers de inatividade se há usuário logado
    if (this.hasLocalUser()) {
      this.startInactivityTimers();
    }
  }

  async heartbeat() {
    if (!this.hasLocalUser()) {
      return;
    }

    try {
      const baseUrl = window.location.origin;
      const response = await fetch(`${baseUrl}/check-session`, {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Sessão inválida');
      }

      const data = await response.json();
      
      if (!data.logado) {
        console.log('💔 Heartbeat: Sessão perdida no servidor');
        this.handleLostSession();
      } else {
        console.log('💓 Heartbeat: Sessão válida');
      }
    } catch (error) {
      console.error('❌ Erro no heartbeat:', error);
      this.handleLostSession();
    }
  }

  async checkSessionValidity() {
    if (!this.hasLocalUser()) {
      return;
    }

    try {
      const baseUrl = window.location.origin;
      const response = await fetch(`${baseUrl}/check-session`, {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) {
        this.handleLostSession();
        return;
      }

      const data = await response.json();
      
      if (!data.logado) {
        this.handleLostSession();
      }
    } catch (error) {
      console.error('❌ Erro ao verificar sessão:', error);
      this.handleLostSession();
    }
  }

  handleLostSession() {
    console.log('🔄 Sessão perdida, limpando dados locais');
    
    this.clearLocalData();
    this.clearTimers();
    
    // Atualiza interface se possível
    if (typeof atualizarBotaoLogin === 'function') {
      atualizarBotaoLogin(null);
    }

    // Redireciona apenas se não estiver na página de login
    if (!window.location.pathname.includes('login')) {
      alert('Sua sessão expirou. Faça login novamente.');
      this.redirectToLogin();
    }
  }

  async checkInitialSession() {
    const localUser = localStorage.getItem('usuario');
    
    if (localUser) {
      // Verifica se a sessão ainda é válida no servidor
      try {
        const baseUrl = window.location.origin;
        const response = await fetch(`${baseUrl}/check-session`, {
          method: 'GET',
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error('Sessão inválida');
        }

        const data = await response.json();
        
        if (!data.logado) {
          console.log('❌ Sessão local encontrada mas inválida no servidor');
          this.clearLocalData();
        } else {
          console.log('✅ Sessão válida encontrada');
          this.startInactivityTimers();
        }
      } catch (error) {
        console.error('❌ Erro ao verificar sessão inicial:', error);
        this.clearLocalData();
      }
    }
  }

  hasLocalUser() {
    return localStorage.getItem('usuario') !== null;
  }

  // ✅ MÉTODO PARA SER CHAMADO QUANDO USUÁRIO FAZ LOGIN
  onUserLogin() {
    console.log('👤 Usuário logado, iniciando monitoramento');
    this.lastActivity = Date.now();
    this.warningShown = false;
    this.startInactivityTimers();
  }

  // ✅ MÉTODO PARA SER CHAMADO QUANDO USUÁRIO FAZ LOGOUT
  onUserLogout() {
    console.log('👋 Usuário deslogado, parando monitoramento');
    this.clearTimers();
    this.warningShown = false;
  }

  // ✅ MÉTODO PARA LIMPAR TODOS OS TIMERS
  destroy() {
    this.clearTimers();
    
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
    
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    
    console.log('🧹 SessionManager destruído');
  }
}

// ✅ INICIALIZAÇÃO
document.addEventListener('DOMContentLoaded', function() {
  if (typeof window !== 'undefined') {
    window.sessionManager = new SessionManager();
  }
});

// ✅ LIMPEZA
window.addEventListener('beforeunload', function() {
  if (window.sessionManager) {
    window.sessionManager.destroy();
  }
});

// ✅ DETECTA QUANDO A PÁGINA FICA VISÍVEL NOVAMENTE
document.addEventListener('visibilitychange', function() {
  if (!document.hidden && window.sessionManager) {
    // Página ficou visível, verifica sessão
    window.sessionManager.checkSessionValidity();
  }
});