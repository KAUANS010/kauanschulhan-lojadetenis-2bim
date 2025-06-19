async function buscarProduto() {
  const nomeBusca = document.getElementById("busca").value.toLowerCase();
  const res = await fetch("http://localhost:3000/products");
  const produtos = await res.json();

  const produto = produtos.find(p => p.name.toLowerCase().includes(nomeBusca));
  const resultado = document.getElementById("resultado-produto");

  if (produto) {
    resultado.innerHTML = `
      <p><strong>${produto.name}</strong> (ID ${produto.id})</p>
      <button onclick="editarProduto(${produto.id})">Editar</button>
      <button onclick="deletarProduto(${produto.id})">Deletar</button>
    `;
  } else {
    resultado.innerHTML = `<p>Produto não encontrado. Você pode adicioná-lo abaixo.</p>`;
  }
}

async function editarProduto(id) {
  const res = await fetch(`http://localhost:3000/products/${id}`);
  const produto = await res.json();

  document.getElementById("produto-id").value = produto.id;
  document.getElementById("nome").value = produto.name;
  document.getElementById("preco").value = produto.price;
  document.getElementById("img").value = produto.img;
  document.getElementById("quantidade").value = produto.quantity;
  document.getElementById("features").value = produto.features.join('|');
}

async function deletarProduto(id) {
  if (!confirm("Tem certeza que deseja deletar este produto?")) return;

  await fetch(`http://localhost:3000/products/${id}`, {
    method: 'DELETE'
  });

  alert("Produto deletado com sucesso.");
  buscarProduto();
}

document.getElementById("form-produto").addEventListener("submit", async (e) => {
  e.preventDefault();

  const id = document.getElementById("produto-id").value;
  const produto = {
    name: document.getElementById("nome").value,
    price: parseFloat(document.getElementById("preco").value),
    img: document.getElementById("img").value,
    quantity: parseInt(document.getElementById("quantidade").value),
    features: document.getElementById("features").value.split('|').map(f => f.trim())
  };

  const url = id ? `http://localhost:3000/products/${id}` : 'http://localhost:3000/products';
  const method = id ? 'PUT' : 'POST';

  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(produto)
  });

  if (res.ok) {
    alert("Produto salvo com sucesso.");
    document.getElementById("form-produto").reset();
    document.getElementById("produto-id").value = '';
    document.getElementById("resultado-produto").innerHTML = '';
  } else {
    alert("Erro ao salvar o produto.");
  }
});
