function verificarUsuario() {
  const usuario = JSON.parse(localStorage.getItem('usuario'));

  if (usuario) {
    // Usuário está logado
    atualizarBotaoLogin(usuario);
    if (usuario.tipo === 'gerente') {
      const botoes = document.getElementById("botoes-gerente");
      if (botoes) botoes.style.display = "flex";
    }
  } else {
    // Usuário não está logado
    atualizarBotaoLogin(null);
  }
}

function atualizarBotaoLogin(usuario) {
  const botao = document.getElementById('botao-login');
  const icone = document.getElementById('login-icone');
  const texto = document.getElementById('login-texto');

  if (!botao || !icone || !texto) return;

  if (usuario) {
    botao.classList.add('logado');
    icone.textContent = '👤';
    texto.textContent = usuario.nome.split(' ')[0];
    botao.title = `Logado como: ${usuario.nome}`;
  } else {
    botao.classList.remove('logado');
    icone.textContent = '🔐';
    texto.textContent = 'Login';
    botao.title = 'Fazer login';
  }
}

function gerenciarLogin() {
  const usuario = JSON.parse(localStorage.getItem('usuario'));

  if (usuario) {
    const opcao = confirm(`Olá, ${usuario.nome}!\n\nDeseja fazer logout?`);
    if (opcao) logout();
  } else {
    localStorage.setItem('paginaAnterior', window.location.href);
    window.location.href = '/LOGIN/login.html';
  }
}

async function logout() {
  try {
    const baseUrl = window.location.origin;
    const res = await fetch(`${baseUrl}/logout`, {
      method: 'POST',
      credentials: 'include'
    });

    localStorage.removeItem('usuario');

    if (window.sessionManager) {
      window.sessionManager.onUserLogout();
    }

    atualizarBotaoLogin(null);
    const botoes = document.getElementById("botoes-gerente");
    if (botoes) botoes.style.display = "none";

    alert('Logout realizado com sucesso!');
  } catch (error) {
    console.error('Erro ao sair:', error);
    localStorage.removeItem('usuario');
    if (window.sessionManager) {
      window.sessionManager.onUserLogout();
    }
    atualizarBotaoLogin(null);
    const botoes = document.getElementById("botoes-gerente");
    if (botoes) botoes.style.display = "none";
    alert('Logout realizado com sucesso!');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  verificarUsuario();
});
