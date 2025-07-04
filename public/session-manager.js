// ======================= GERENCIADOR DE SESSÃO E INATIVIDADE =======================

class SessionManager {
  constructor( ) {
    this.inactivityTimeout = 24 * 60 * 60 * 1000; // 24 horas em milissegundos
    this.warningTimeout = 23 * 60 * 60 * 1000; // Aviso 1 hora antes (23 horas)
    this.checkInterval = 5 * 60 * 1000; // Verifica a cada 5 minutos

    this.lastActivity = Date.now();
    this.inactivityTimer = null;
    this.warningTimer = null;
    this.intervalTimer = null;
    this.warningShown = false;

    this.init();
  }

  init() {
    // Monitora atividade do usuário
    this.setupActivityListeners();

    // Inicia o monitoramento
    this.startMonitoring();

    // Verifica se há usuário logado
    this.checkUserSession();
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
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
    }
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
    }

    // Reinicia os timers
    this.startInactivityTimers();
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
    if (this.warningShown || !this.isUserLoggedIn()) {
      return;
    }

    this.warningShown = true;
    const remainingTime = Math.ceil((this.inactivityTimeout - this.warningTimeout) / (60 * 1000)); // em minutos

    const continuar = confirm(
      `Você ficará inativo em breve!\n\n` +
      `Sua sessão expirará em ${remainingTime} minutos devido à inatividade.\n\n` +
      `Clique em "OK" para continuar navegando ou "Cancelar" para fazer logout agora.`
    );

    if (continuar) {
      // Usuário quer continuar, atualiza atividade
      this.updateActivity();
    } else {
      // Usuário quer fazer logout
      this.performManualLogout();
    }
  }

  async performAutoLogout() {
    if (!this.isUserLoggedIn()) {
      return;
    }

    console.log('Realizando logout automático por inatividade');

    try {
      const baseUrl = window.location.origin; // Adicionado
      await fetch(`${baseUrl}/logout`, { // Modificado
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Erro ao fazer logout no servidor:', error);
    }

    // Remove dados locais
    localStorage.removeItem('usuario');

    // Mostra mensagem e redireciona
    alert('Sua sessão expirou devido à inatividade. Você será redirecionado para a página de login.');
    // Ajuste o caminho para o login.html se necessário, dependendo da estrutura de pastas
    window.location.href = '/LOGIN/login.html';
  }

  async performManualLogout() {
    if (!this.isUserLoggedIn()) {
      return;
    }

    try {
      const baseUrl = window.location.origin; // Adicionado
      await fetch(`${baseUrl}/logout`, { // Modificado
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Erro ao fazer logout no servidor:', error);
    }

    localStorage.removeItem('usuario');
    alert('Logout realizado com sucesso!');
    // Ajuste o caminho para o login.html se necessário, dependendo da estrutura de pastas
    window.location.href = '/LOGIN/login.html';
  }

  startMonitoring() {
    // Verifica periodicamente se a sessão ainda é válida
    this.intervalTimer = setInterval(() => {
      this.checkSessionValidity();
    }, this.checkInterval);

    // Inicia os timers de inatividade se há usuário logado
    if (this.isUserLoggedIn()) {
      this.startInactivityTimers();
    }
  }

  async checkSessionValidity() {
    if (!this.isUserLoggedIn()) {
      return;
    }

    try {
      const baseUrl = window.location.origin; // Adicionado
      const response = await fetch(`${baseUrl}/check-session`, { // Modificado
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) {
        // Sessão inválida no servidor
        console.log('Sessão inválida no servidor, fazendo logout local');
        localStorage.removeItem('usuario');

        // Atualiza interface se possível
        if (typeof atualizarBotaoLogin === 'function') {
          atualizarBotaoLogin(null);
        }

        // Redireciona para login se não estiver já lá
        if (!window.location.pathname.includes('login')) {
          alert('Sua sessão expirou. Você será redirecionado para a página de login.');
          // Ajuste o caminho para o login.html se necessário, dependendo da estrutura de pastas
          window.location.href = '/LOGIN/login.html';
        }
      }
    } catch (error) {
      console.error('Erro ao verificar sessão:', error);
    }
  }

  checkUserSession() {
    const usuario = localStorage.getItem('usuario');
    if (usuario) {
      // Há usuário logado, inicia monitoramento
      this.startInactivityTimers();
    }
  }

  isUserLoggedIn() {
    return localStorage.getItem('usuario') !== null;
  }

  // Método para ser chamado quando usuário faz login
  onUserLogin() {
    this.lastActivity = Date.now();
    this.warningShown = false;
    this.startInactivityTimers();
  }

  // Método para ser chamado quando usuário faz logout
  onUserLogout() {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
    }
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
    }
    this.warningShown = false;
  }

  // Método para limpar todos os timers (útil para cleanup)
  destroy() {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
    }
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
    }
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
    }
  }
}

// Inicializa o gerenciador de sessão quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
  window.sessionManager = new SessionManager();
});

// Limpa timers quando a página é descarregada
window.addEventListener('beforeunload', function() {
  if (window.sessionManager) {
    window.sessionManager.destroy();
  }
});
