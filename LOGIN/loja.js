// ======================= VERIFICAÇÕES INICIAIS =======================

document.addEventListener('DOMContentLoaded', function() {
  verificarRedirecionamentoPagamento();
});

function verificarRedirecionamentePagamento() {
  // Verifica se o usuário veio da página de pagamento
  const veioDoPagemento = localStorage.getItem('redirecionamentoPagamento');
  const paginaAnterior = localStorage.getItem('paginaAnterior');
  
  if (veioDoPagemento === 'true') {
    // Mostra o aviso e o botão de voltar
    const avisoDiv = document.getElementById('aviso-pagamento');
    const botaoVoltar = document.getElementById('botao-voltar');
    
    if (avisoDiv) {
      avisoDiv.style.display = 'block';
    }
    
    if (botaoVoltar) {
      botaoVoltar.style.display = 'block';
    }
    
    console.log('Usuário veio do pagamento, exibindo avisos');
  }
}

function voltarPagamento() {
  // Remove as flags de redirecionamento
  localStorage.removeItem('redirecionamentoPagamento');
  localStorage.removeItem('paginaAnterior');
  
  // Volta para a página de pagamento
  window.location.href = '../pagamento/pagamento.html';
}

// ======================= FUNÇÃO DE LOGIN PRINCIPAL =======================

document.getElementById('form-login').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const senha = document.getElementById('senha').value;

  try {
    const res = await fetch('http://localhost:3000/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha })
    });

    if (!res.ok) {
      alert("Email ou senha inválidos.");
      return;
    }

    const data = await res.json();
    
    // Salva dados do usuário no localStorage
    localStorage.setItem('usuario', JSON.stringify({
      email,
      nome: data.nome,
      tipo: data.tipo
    }));

    // ======================= LÓGICA DE REDIRECIONAMENTO =======================
    
    // Verifica se o usuário veio da página de pagamento
    const veioDoPagemento = localStorage.getItem('redirecionamentoPagamento');
    const paginaAnterior = localStorage.getItem('paginaAnterior');
    
    if (veioDoPagemento === 'true' && paginaAnterior) {
      // Usuário veio do pagamento - redireciona de volta
      console.log('Login bem-sucedido, redirecionando para:', paginaAnterior);
      
      // Restaura dados do carrinho se foram salvos temporariamente
      restaurarDadosCarrinho();
      
      // Mantém a flag para que a página de pagamento saiba que o usuário acabou de fazer login
      // (não remove aqui, será removida na página de pagamento)
      
      // Redireciona de volta para o pagamento
      window.location.href = paginaAnterior;
      
    } else {
      // Login normal - vai para a loja
      console.log('Login normal, redirecionando para loja');
      window.location.href = '../PROJETO-TESTE-2/loja/loja.html';
    }

  } catch (error) {
    console.error("Erro no login:", error);
    alert("Erro ao conectar com o servidor.");
  }
});

// ======================= FUNÇÕES AUXILIARES =======================

function restaurarDadosCarrinho() {
  // Restaura valor total se foi salvo temporariamente
  const valorTemp = localStorage.getItem('valorTotalTemp');
  if (valorTemp) {
    localStorage.setItem('valorTotal', valorTemp);
    localStorage.removeItem('valorTotalTemp');
    console.log('Valor total restaurado:', valorTemp);
  }
  
  // Restaura carrinho se foi salvo temporariamente
  const carrinhoTemp = localStorage.getItem('carrinhoTemp');
  if (carrinhoTemp) {
    localStorage.setItem('carrinho', carrinhoTemp);
    localStorage.removeItem('carrinhoTemp');
    console.log('Carrinho restaurado');
  }
}

// ======================= FUNÇÕES DE DEBUG (opcional) =======================

function limparDadosTemporarios() {
  // Função para limpar dados temporários em caso de erro
  localStorage.removeItem('redirecionamentoPagamento');
  localStorage.removeItem('paginaAnterior');
  localStorage.removeItem('valorTotalTemp');
  localStorage.removeItem('carrinhoTemp');
  console.log('Dados temporários limpos');
}