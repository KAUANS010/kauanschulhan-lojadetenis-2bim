// ======================= VERIFICAÇÕES INICIAIS =======================

document.addEventListener('DOMContentLoaded', function() {
  verificarSessaoExistente();
  verificarRedirecionamentoPagamento();
});

async function verificarSessaoExistente() {
  try {
    const baseUrl = window.location.origin;
    const response = await fetch(`${baseUrl}/check-session`, {
      method: 'GET',
      credentials: 'include'
    });

    if (response.ok) {
      const data = await response.json();
      
      if (data.logado) {
        console.log('✅ Usuário já está logado:', data.user.nome);
        
        // Verifica se veio do pagamento
        const veioDoPagemento = localStorage.getItem('redirecionamentoPagamento');
        const paginaAnterior = localStorage.getItem('paginaAnterior');
        
        if (veioDoPagemento === 'true' && paginaAnterior) {
          // Redireciona para o pagamento
          window.location.href = paginaAnterior;
        } else {
          // Redireciona para a loja
          window.location.href = '/PROJETO-2/loja/loja.html';
        }
        return;
      }
    }
  } catch (error) {
    console.error('❌ Erro ao verificar sessão existente:', error);
  }
  
  // ✅ LIMPA DADOS LOCAIS SE SESSÃO INVÁLIDA
  localStorage.removeItem('usuario');
}

function verificarRedirecionamentoPagamento() {
  const veioDoPagemento = localStorage.getItem('redirecionamentoPagamento');
  const paginaAnterior = localStorage.getItem('paginaAnterior');

  if (veioDoPagemento === 'true') {
    const avisoDiv = document.getElementById('aviso-pagamento');
    const botaoVoltar = document.getElementById('botao-voltar');

    if (avisoDiv) {
      avisoDiv.style.display = 'block';
    }

    if (botaoVoltar) {
      botaoVoltar.style.display = 'block';
    }

    console.log('👤 Usuário veio do pagamento, exibindo avisos');
  }
}

function voltarPagamento() {
  localStorage.removeItem('redirecionamentoPagamento');
  localStorage.removeItem('paginaAnterior');
  window.location.href = '/PROJETO-2/pagamento/pagamento.html';
}

// ======================= FUNÇÃO DE LOGIN PRINCIPAL =======================

document.getElementById('form-login').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value.trim();
  const senha = document.getElementById('senha').value;

  if (!email || !senha) {
    alert('Por favor, preencha todos os campos.');
    return;
  }

  // ✅ ADICIONA LOADING
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.textContent = 'Entrando...';
  submitBtn.disabled = true;

  try {
    const baseUrl = window.location.origin;

    const response = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, senha })
    });

    if (!response.ok) {
      if (response.status === 401) {
        alert('❌ Email ou senha inválidos.');
      } else {
        alert('❌ Erro no servidor. Tente novamente.');
      }
      return;
    }

    const data = await response.json();
    console.log('✅ Login realizado com sucesso:', data.nome);

    // ✅ SALVA DADOS DO USUÁRIO NO LOCALSTORAGE
    const userData = {
      email,
      nome: data.nome,
      tipo: data.tipo,
      loginTime: new Date().toISOString()
    };
    
    localStorage.setItem('usuario', JSON.stringify(userData));

    // ✅ NOTIFICA O SESSION MANAGER
    if (window.sessionManager) {
      window.sessionManager.onUserLogin();
    }

    // ✅ LÓGICA DE REDIRECIONAMENTO
    await handleRedirectAfterLogin();

  } catch (error) {
    console.error('❌ Erro no login:', error);
    alert('❌ Erro ao conectar com o servidor. Verifique sua conexão.');
  } finally {
    // ✅ RESTAURA BOTÃO
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  }
});

async function handleRedirectAfterLogin() {
  const veioDoPagemento = localStorage.getItem('redirecionamentoPagamento');
  const paginaAnterior = localStorage.getItem('paginaAnterior');

  if (veioDoPagemento === 'true' && paginaAnterior) {
    console.log('🔄 Redirecionando para pagamento:', paginaAnterior);
    
    // Restaura dados do carrinho
    restaurarDadosCarrinho();
    
    // Aguarda um pouco para garantir que o localStorage foi salvo
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Redireciona para o pagamento
    window.location.href = paginaAnterior;
  } else {
    console.log('🔄 Redirecionando para loja');
    
    // Aguarda um pouco para garantir que o localStorage foi salvo
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Login normal - vai para a loja
    window.location.href = '/PROJETO-2/loja/loja.html';
  }
}

// ======================= FUNÇÕES AUXILIARES =======================

function restaurarDadosCarrinho() {
  // Restaura valor total
  const valorTemp = localStorage.getItem('valorTotalTemp');
  if (valorTemp) {
    localStorage.setItem('valorTotal', valorTemp);
    localStorage.removeItem('valorTotalTemp');
    console.log('💰 Valor total restaurado:', valorTemp);
  }

  // Restaura carrinho
  const carrinhoTemp = localStorage.getItem('carrinhoTemp');
  if (carrinhoTemp) {
    localStorage.setItem('carrinho', carrinhoTemp);
    localStorage.removeItem('carrinhoTemp');
    console.log('🛒 Carrinho restaurado');
  }
}

function limparDadosTemporarios() {
  localStorage.removeItem('redirecionamentoPagamento');
  localStorage.removeItem('paginaAnterior');
  localStorage.removeItem('valorTotalTemp');
  localStorage.removeItem('carrinhoTemp');
  console.log('🧹 Dados temporários limpos');
}

// ======================= VERIFICAÇÃO DE SESSÃO EM TEMPO REAL =======================

// Verifica se a sessão ainda é válida quando a página ganha foco
window.addEventListener('focus', async () => {
  const usuario = localStorage.getItem('usuario');
  if (usuario) {
    try {
      const baseUrl = window.location.origin;
      const response = await fetch(`${baseUrl}/check-session`, {
        method: 'GET',
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (!data.logado) {
          console.log('❌ Sessão expirada detectada');
          localStorage.removeItem('usuario');
          // Não redireciona pois já está na página de login
        }
      }
    } catch (error) {
      console.error('❌ Erro ao verificar sessão:', error);
    }
  }
});

// ======================= FUNÇÕES DE DEBUG =======================

function debugSessao() {
  console.log('=== DEBUG SESSÃO ===');
  console.log('Usuario local:', localStorage.getItem('usuario'));
  console.log('Redirecionamento:', localStorage.getItem('redirecionamentoPagamento'));
  console.log('Página anterior:', localStorage.getItem('paginaAnterior'));
  console.log('Valor temp:', localStorage.getItem('valorTotalTemp'));
  console.log('Carrinho temp:', localStorage.getItem('carrinhoTemp'));
}

// Para debug no console
window.debugSessao = debugSessao;
window.limparDadosTemporarios = limparDadosTemporarios;