async function carregarProdutos() {
  try {
    const resposta = await fetch("http://localhost:3000/products");
    const produtos = await resposta.json();

    const container = document.getElementById("produtos-container");
    container.innerHTML = "";

    produtos.forEach(produto => {
      const card = document.createElement("div");
      card.className = "card";

      card.innerHTML = `
        <img src="${produto.img}" alt="${produto.name}">
        <h3>${produto.name}</h3>
        <p class="price">R$ ${produto.price.toFixed(2)}</p>
        <p class="descricao">${produto.features?.join(', ') || 'Sem descrição'}</p>
        <div class="opcoes">
          <label for="tamanho-${produto.id}">Tamanho:</label>
          <select id="tamanho-${produto.id}">
            <option>37</option>
            <option>38</option>
            <option>39</option>
            <option>40</option>
          </select>

          <label for="cor-${produto.id}">Cor:</label>
          <select id="cor-${produto.id}">
            <option>Preto</option>
            <option>Branco</option>
            <option>Azul</option>
          </select>

          <label for="qtd-${produto.id}">Quantidade:</label>
          <input id="qtd-${produto.id}" type="number" min="1" value="1">
        </div>
        <button class="add-button" onclick="adicionarAoCarrinhoLoja(${produto.id})">Comprar</button>
      `;

      container.appendChild(card);
    });

    window.produtos = produtos; // torna os produtos acessíveis globalmente
  } catch (erro) {
    console.error("Erro ao carregar produtos:", erro);
  }
}

function adicionarAoCarrinhoLoja(id) {
  const produto = window.produtos.find(p => p.id === id);
  const tamanho = document.getElementById(`tamanho-${id}`).value;
  const cor = document.getElementById(`cor-${id}`).value;
  const quantidade = parseInt(document.getElementById(`qtd-${id}`).value, 10);

  const carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];

  const produtoCarrinho = {
    id: produto.id,
    nome: produto.name,
    preco: produto.price,
    img: produto.img,
    descricao: produto.features?.join(', ') || '',
    tamanho,
    cor,
    quantidade
  };

  const existente = carrinho.find(p =>
    p.id === produtoCarrinho.id && p.tamanho === produtoCarrinho.tamanho && p.cor === produtoCarrinho.cor
  );

  let mensagem = '';

  if (existente) {
    existente.quantidade += produtoCarrinho.quantidade;
    mensagem = `${produtoCarrinho.nome} (+${produtoCarrinho.quantidade} und.) já está no carrinho.`;
  } else {
    carrinho.push(produtoCarrinho);
    mensagem = `${produtoCarrinho.nome} (${produtoCarrinho.quantidade} und.) foi adicionado ao carrinho.`;
  }

  localStorage.setItem('carrinho', JSON.stringify(carrinho));

  const totalItens = carrinho.reduce((sum, p) => sum + p.quantidade, 0);

  alert(`${mensagem}\nTotal de itens: ${totalItens}`);
}

// ======================= FUNÇÕES DE LOGIN - NOVO =======================

function verificarUsuario() {
  const usuario = JSON.parse(localStorage.getItem('usuario'));

  if (usuario) {
    // Usuário está logado
    atualizarBotaoLogin(usuario);
    if (usuario.tipo === 'gerente') {
      document.getElementById("botoes-gerente").style.display = "flex";
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

  if (usuario) {
    // Usuário logado
    botao.classList.add('logado');
    icone.textContent = '👤';
    texto.textContent = usuario.nome.split(' ')[0]; // Primeiro nome
    botao.title = `Logado como: ${usuario.nome}`;
  } else {
    // Usuário não logado
    botao.classList.remove('logado');
    icone.textContent = '🔐';
    texto.textContent = 'Login';
    botao.title = 'Fazer login';
  }
}

function gerenciarLogin() {
  const usuario = JSON.parse(localStorage.getItem('usuario'));

  if (usuario) {
    // Usuário está logado, mostrar opções
    const opcao = confirm(`Olá, ${usuario.nome}!\n\nDeseja fazer logout?`);
    if (opcao) {
      logout();
    }
  } else {
    // Usuário não está logado, redirecionar para login
    // Salvar a página atual para retornar depois
    localStorage.setItem('paginaAnterior', window.location.href);
    window.location.href = '../../LOGIN/login.html';
  }
}

function logout() {
  // Remove dados do usuário
  localStorage.removeItem('usuario');
  
  // Atualiza a interface
  atualizarBotaoLogin(null);
  document.getElementById("botoes-gerente").style.display = "none";
  
  alert('Logout realizado com sucesso!');
}

// ======================= INICIALIZAÇÃO =======================

window.onload = function () {
  verificarUsuario();
  carregarProdutos();
};




document.addEventListener('DOMContentLoaded', () => {
    const formLogin = document.getElementById('form-login');

    if (formLogin) {
        formLogin.addEventListener('submit', async (event) => {
            event.preventDefault();

            const email = document.getElementById('email').value;
            const senha = document.getElementById('senha').value;

            try {
                const response = await fetch('http://localhost:3000/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, senha }),
                });

                const result = await response.json();

                if (response.ok) {
                    // Salvar dados do usuário no localStorage
                    localStorage.setItem('usuario', JSON.stringify({ nome: result.nome, tipo: result.tipo, email: email }));
                    alert(`Login bem-sucedido! Bem-vindo, ${result.nome}!`);

                    // Verificar se há um redirecionamento pendente para a página de pagamento
                    const paginaAnterior = localStorage.getItem('paginaAnterior');
                    const redirecionamentoPagamento = localStorage.getItem('redirecionamentoPagamento');

                    if (redirecionamentoPagamento === 'true' && paginaAnterior) {
                        localStorage.removeItem('paginaAnterior');
                        localStorage.removeItem('redirecionamentoPagamento');
                        // Adiciona um pequeno delay para o usuário ver a mensagem de boas-vindas
                        setTimeout(() => {
                            window.location.href = paginaAnterior;
                        }, 1000); 
                    } else {
                        // Redirecionamento padrão após login (ex: para a loja)
                        // Ajuste o caminho conforme a estrutura do seu projeto
                        setTimeout(() => {
                           window.location.href = '../loja/loja.html'; // Ou outra página principal
                        }, 1000);
                    }

                } else {
                    alert(`Erro no login: ${result.message}`);
                }
            } catch (error) {
                console.error('Erro ao tentar fazer login:', error);
                alert('Ocorreu um erro ao tentar fazer login. Verifique o console para mais detalhes.');
            }
        });
    }
});


