document.addEventListener('DOMContentLoaded', function() {
  const carrinhoContainer = document.getElementById('carrinho');

  // Verifica se o elemento 'carrinho' existe na página atual
  if (carrinhoContainer) {
    // Seleciona o elemento HTML com o ID 'carrinho' (onde os itens serão exibidos)

    let produtos = JSON.parse(localStorage.getItem('carrinho')) || [];
    // Busca os itens salvos no localStorage (convertendo de string para objeto).
    // Se não existir nada, usa um array vazio como padrão.

    if (produtos.length === 0) {
      carrinhoContainer.innerHTML = '<p>Seu carrinho está vazio.</p>';
      // Se não há produtos, mostra mensagem de carrinho vazio
    } else {
      produtos.forEach(produto => adicionarAoCarrinho(produto));
      // Se há produtos, adiciona cada um no HTML chamando a função abaixo

      adicionarBotaoFinalizar();
      // Adiciona o botão de finalizar compra
    }
  }
});


function adicionarAoCarrinho(produto) {
  const carrinhoContainer = document.getElementById('carrinho'); // Garante que o container é acessível aqui
  if (!carrinhoContainer) return; // Proteção adicional caso a função seja chamada sem o container

  const card = document.createElement('div');
  // Cria uma div para representar o produto no carrinho

  card.className = 'card';
  // Adiciona a classe CSS 'card' à div

  card.id = `produto-${produto.id}`;
  // Define um ID único baseado no ID do produto

  card.innerHTML = `
    <img src="${produto.img}" alt="${produto.name}" />
    <h3>${produto.name}</h3>
    <p><strong>Tamanho:</strong> ${produto.tamanho}</p>
    <p><strong>Cor:</strong> ${produto.cor}</p>
    <p><strong>Quantidade:</strong> ${produto.quantity}</p>
    <p>${produto.descricao || 'Sem descrição disponível.'}</p>
    <button class="remover-btn" onclick="removerItem(${produto.id})">Remover</button>
  `;
  // Preenche o HTML do card com as informações do produto e um botão para remover

  carrinhoContainer.appendChild(card);
  // Adiciona o card ao contêiner do carrinho
}

function removerItem(id) {
  let produtos = JSON.parse(localStorage.getItem('carrinho')) || []; // Recarrega produtos para garantir que está atualizado
  produtos = produtos.filter(p => p.id !== id);
  // Remove o produto com o ID correspondente do array de produtos

  localStorage.setItem('carrinho', JSON.stringify(produtos));
  // Atualiza o localStorage com o novo array (sem o item removido)

  const produtoCard = document.getElementById(`produto-${id}`);
  if (produtoCard) { // Verifica se o elemento existe antes de tentar remover
    produtoCard.remove();
  }

  const carrinhoContainer = document.getElementById('carrinho'); // Garante que o container é acessível aqui
  const botao = document.getElementById('botao-pagamento');
  // Seleciona o botão de pagamento, se existir

  if (produtos.length === 0) {
    if (carrinhoContainer) { // Verifica se o container existe
      carrinhoContainer.innerHTML = '<p>Seu carrinho está vazio.</p>';
    }
    // Se o carrinho ficou vazio, mostra a mensagem

    if (botao) botao.remove();
    // Remove o botão de pagamento se ele existir
  }
}

function adicionarBotaoFinalizar() {
  const botao = document.createElement('button');
  // Cria um novo botão

  botao.textContent = 'Confirmar Pagamento de Todos os Itens';
  // Define o texto do botão

  botao.id = 'botao-pagamento';
  // Define um ID para o botão

  botao.onclick = () => {
    // Define o que acontece ao clicar no botão
    const produtos = JSON.parse(localStorage.getItem('carrinho')) || []; // Recarrega produtos para garantir que está atualizado

    if (produtos.length > 0) {
      const valorTotal = produtos.reduce((soma, p) => soma + (p.price * p.quantity), 0);
      // Calcula o valor total dos produtos multiplicando preço por quantidade

      localStorage.setItem('valorTotal', valorTotal.toFixed(2));
      // Salva o valor total (com duas casas decimais) no localStorage

      window.location.href = '/PROJETO-2/pagamento/pagamento.html';
      // Redireciona o usuário para a página de pagamento
    } else {
      alert('Seu carrinho está vazio. Adicione itens antes de finalizar a compra.'); // Mensagem mais clara
    }
  };

  // Adiciona o botão ao final do corpo da página, mas verifica se o elemento existe
  const carrinhoContainer = document.getElementById('carrinho');
  if (carrinhoContainer) { // Adiciona o botão dentro do container do carrinho se ele existir
    carrinhoContainer.appendChild(botao);
  } else { // Caso contrário, adiciona ao body como fallback, mas é melhor que esteja dentro de um container específico
    document.body.appendChild(botao);
  }
}
