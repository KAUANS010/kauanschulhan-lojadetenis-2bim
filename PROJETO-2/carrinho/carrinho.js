const carrinhoContainer = document.getElementById('carrinho');
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

function adicionarAoCarrinho(produto) {
  const card = document.createElement('div');
  // Cria uma div para representar o produto no carrinho

  card.className = 'card';
  // Adiciona a classe CSS 'card' à div

  card.id = `produto-${produto.id}`;
  // Define um ID único baseado no ID do produto

  card.innerHTML = `
    <img src="${produto.img}" alt="${produto.nome}" />
    <h3>${produto.nome}</h3>
    <p><strong>Tamanho:</strong> ${produto.tamanho}</p>
    <p><strong>Cor:</strong> ${produto.cor}</p>
    <p><strong>Quantidade:</strong> ${produto.quantidade}</p>
    <p>${produto.descricao || 'Sem descrição disponível.'}</p>
    <button class="remover-btn" onclick="removerItem(${produto.id})">Remover</button>
  `;
  // Preenche o HTML do card com as informações do produto e um botão para remover

  carrinhoContainer.appendChild(card);
  // Adiciona o card ao contêiner do carrinho
}

function removerItem(id) {
  produtos = produtos.filter(p => p.id !== id);
  // Remove o produto com o ID correspondente do array de produtos

  localStorage.setItem('carrinho', JSON.stringify(produtos));
  // Atualiza o localStorage com o novo array (sem o item removido)

  document.getElementById(`produto-${id}`).remove();
  // Remove o card do produto da página

  const botao = document.getElementById('botao-pagamento');
  // Seleciona o botão de pagamento, se existir

  if (produtos.length === 0) {
    carrinhoContainer.innerHTML = '<p>Seu carrinho está vazio.</p>';
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

    if (produtos.length > 0) {
      const valorTotal = produtos.reduce((soma, p) => soma + (p.preco * p.quantidade), 0);
      // Calcula o valor total dos produtos multiplicando preço por quantidade

      localStorage.setItem('valorTotal', valorTotal.toFixed(2));
      // Salva o valor total (com duas casas decimais) no localStorage

      window.location.href = '../pagamento/pagamento.html';
      // Redireciona o usuário para a página de pagamento
    } else {
      alert('Todos os itens foram confirmados para pagamento!');
      // Se não houver produtos (por algum motivo), mostra um alerta
    }
  };

  document.body.appendChild(botao);
  // Adiciona o botão ao final do corpo da página
}
