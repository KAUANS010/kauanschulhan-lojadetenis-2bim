// Variáveis globais para controle do upload
let arquivoSelecionado = null;
let arquivoTemporario = null; // Para armazenar info do arquivo temporário

async function buscarProduto( ) {
  const baseUrl = window.location.origin; // Adicionado
  const nomeBusca = document.getElementById("busca").value.toLowerCase();
  const res = await fetch(`${baseUrl}/products`); // Modificado
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
  const baseUrl = window.location.origin; // Adicionado
  const res = await fetch(`${baseUrl}/products/${id}`); // Modificado
  const produto = await res.json();

  document.getElementById("produto-id").value = produto.id;
  document.getElementById("nome").value = produto.name;
  document.getElementById("preco").value = produto.price;
  const nomeImagem = produto.img.split('/').pop();
  const caminhoCorreto = `/public/imgs/${nomeImagem}`;
  document.getElementById("img").value = caminhoCorreto;
  document.getElementById("quantidade").value = produto.quantity;
  document.getElementById("features").value = produto.features.join("|");

  // Mostrar preview da imagem existente quando editando
  if (produto.img) {
    // Construir URL completa para preview
    const imageUrl = `${baseUrl}/public/imgs/${nomeImagem}`; // Modificado
    document.getElementById("preview-image").src = imageUrl;
    document.getElementById("file-name").textContent = `Imagem atual: ${produto.id}.jpg`;
    document.getElementById("preview-container").style.display = "block";
  }

  // Limpar arquivo temporário quando editando
  arquivoTemporario = null;
}

async function deletarProduto(id) {
  if (!confirm("Tem certeza que deseja deletar este produto?")) return;

  const baseUrl = window.location.origin; // Adicionado
  await fetch(`${baseUrl}/products/${id}`, { // Modificado
    method: "DELETE",
  });

  alert("Produto deletado com sucesso.");
  buscarProduto();
}

// =================== FUNCIONALIDADES DE UPLOAD ===================

function selecionarImagem() {
  const fileInput = document.getElementById("file-input");
  fileInput.click();
}

// Função para limpar preview e seleção
function limparSelecaoImagem() {
  document.getElementById("file-input").value = "";
  document.getElementById("preview-container").style.display = "none";
  document.getElementById("img").value = "";
  arquivoSelecionado = null;
  arquivoTemporario = null;
}

// Event listener para quando um arquivo é selecionado
document.getElementById("file-input").addEventListener("change", async function (e) {
  const file = e.target.files[0];

  if (!file) {
    limparSelecaoImagem();
    return;
  }

  console.log(
    "Arquivo selecionado:",
    file.name,
    "Tamanho:",
    file.size,
    "Tipo:",
    file.type
  );

  // Validação de tipo de arquivo
  if (!file.type.startsWith("image/")) {
    alert("Por favor, selecione apenas arquivos de imagem.");
    limparSelecaoImagem();
    return;
  }

  // Validação de tamanho (5MB)
  if (file.size > 5 * 1024 * 1024) {
    alert("A imagem deve ter no máximo 5MB.");
    limparSelecaoImagem();
    return;
  }

  // Mostrar preview imediatamente
  const reader = new FileReader();
  reader.onload = function (evt) {
    document.getElementById("preview-image").src = evt.target.result;
    document.getElementById("file-name").textContent = `Arquivo selecionado: ${file.name}`;
    document.getElementById("preview-container").style.display = "block";
  };
  reader.readAsDataURL(file);

  // Mostrar indicador de carregamento
  const btnSelecionar = document.querySelector(".btn-selecionar");
  const originalText = btnSelecionar.textContent;
  btnSelecionar.textContent = "📤 Enviando...";
  btnSelecionar.disabled = true;

  // Upload automático da imagem (arquivo temporário)
  const formData = new FormData();
  formData.append("imagem", file);

  try {
    console.log("Iniciando upload temporário...");
    const baseUrl = window.location.origin; // Adicionado
    const res = await fetch(`${baseUrl}/upload-image`, { // Modificado
      method: "POST",
      body: formData,
    });

    console.log("Resposta do servidor:", res.status);

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const result = await res.json();
    console.log("Resultado do upload:", result);

    if (result.imagePath && result.fileName) {
      // Armazenar informações do arquivo temporário
      arquivoTemporario = {
        tempFileName: result.fileName,
        tempPath: result.imagePath
      };

      // Preenche temporariamente o campo URL
      document.getElementById("img").value = result.imagePath;
      document.getElementById("file-name").textContent = `✅ Upload concluído: ${file.name} (será renomeado ao salvar)`;

      console.log("Arquivo temporário armazenado:", arquivoTemporario);
    } else {
      throw new Error("Informações do arquivo não retornadas pelo servidor");
    }
  } catch (error) {
    console.error("Erro detalhado no upload:", error);
    alert(
      `Erro ao enviar imagem: ${error.message}\nVerifique se o servidor está rodando em ${window.location.origin}` // Modificado
    );
    limparSelecaoImagem();
  } finally {
    // Restaurar botão
    btnSelecionar.textContent = originalText;
    btnSelecionar.disabled = false;
  }
});

// =================== FORM SUBMISSION ===================

document.getElementById("form-produto").addEventListener("submit", async (e) => {
  e.preventDefault();

  // Validação dos campos obrigatórios
  const nome = document.getElementById("nome").value.trim();
  const preco = document.getElementById("preco").value;
  const img = document.getElementById("img").value.trim();
  const quantidade = document.getElementById("quantidade").value;

  if (!nome || !preco || !img || !quantidade) {
    alert(
      "Por favor, preencha todos os campos obrigatórios (Nome, Preço, Imagem e Quantidade)."
    );
    return;
  }

  const id = document.getElementById("produto-id").value;
  const produto = {
    name: nome,
    price: parseFloat(preco),
    img: img,
    quantity: parseInt(quantidade),
    features: document
      .getElementById("features")
      .value.split("|")
      .map((f) => f.trim())
      .filter((f) => f),
  };

  // Adicionar informação do arquivo temporário se existir
  if (arquivoTemporario) {
    produto.tempFileName = arquivoTemporario.tempFileName;
  }

  const baseUrl = window.location.origin; // Adicionado
  const url = id
    ? `${baseUrl}/products/${id}` // Modificado
    : `${baseUrl}/products`; // Modificado
  const method = id ? "PUT" : "POST";

  // Mostrar indicador de salvamento
  const submitBtn = document.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.textContent = "💾 Salvando...";
  submitBtn.disabled = true;

  try {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(produto),
    });

    if (res.ok) {
      const produtoSalvo = await res.json();

      // Mensagem de sucesso mostrando o novo nome do arquivo
      if (arquivoTemporario) {
        const extension = arquivoTemporario.tempFileName.split('.').pop();
        const novoNome = `${produtoSalvo.id}.${extension}`;
        alert(
          `${id ? "Produto atualizado" : "Produto adicionado"} com sucesso!\n` +
          `Imagem renomeada para: ${novoNome}`
        );
      } else {
        alert(id ? "Produto atualizado com sucesso!" : "Produto adicionado com sucesso!");
      }

      // Limpar formulário
      document.getElementById("form-produto").reset();
      document.getElementById("produto-id").value = "";
      document.getElementById("resultado-produto").innerHTML = "";

      // Limpar seleção de imagem
      limparSelecaoImagem();
    } else {
      const error = await res.json();
      alert(`Erro ao salvar o produto: ${error.message || "Erro desconhecido"}`);
    }
  } catch (error) {
    console.error("Erro ao salvar produto:", error);
    alert("Erro ao conectar com o servidor. Verifique se o servidor está rodando.");
  } finally {
    // Restaurar botão
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  }
});

// Adicionar um event listener para o evento 'reset' do formulário
document.getElementById("form-produto").addEventListener("reset", function () {
  // Limpar a imagem de preview e o campo de URL da imagem
  limparSelecaoImagem();
});

// =================== FUNÇÃO AUXILIAR PARA MOSTRAR PREVIEW DE IMAGENS EXISTENTES ===================
function mostrarPreviewImagemExistente(imageUrl, nomeArquivo) {
  const img = document.getElementById("preview-image");
  const fileName = document.getElementById("file-name");
  const container = document.getElementById("preview-container");

  img.src = imageUrl;
  fileName.textContent = nomeArquivo;
  container.style.display = "block";
}
