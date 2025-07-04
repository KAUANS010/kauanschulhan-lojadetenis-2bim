// Variáveis globais para controle do upload
let arquivoSelecionado = null;
let arquivoTemporario = null; // Para armazenar info do arquivo temporário

async function buscarProduto() {
  const baseUrl = window.location.origin;
  const nomeBusca = document.getElementById("busca").value.toLowerCase();
  const res = await fetch(`${baseUrl}/products`);
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
  const baseUrl = window.location.origin;
  const res = await fetch(`${baseUrl}/products/${id}`);
  const produto = await res.json();

  document.getElementById("produto-id").value = produto.id;
  document.getElementById("nome").value = produto.name;
  // Formatar preço com 2 casas decimais
  document.getElementById("preco").value = parseFloat(produto.price).toFixed(2);
  
  // Garantir que a imagem tenha o caminho correto
  let imagemPath = produto.img;
  if (imagemPath && !imagemPath.startsWith('/public/')) {
    const nomeImagem = imagemPath.split('/').pop();
    imagemPath = `/public/imgs/${nomeImagem}`;
  }
  document.getElementById("img").value = imagemPath;
  
  document.getElementById("quantidade").value = produto.quantity;
  document.getElementById("features").value = Array.isArray(produto.features) ? produto.features.join("|") : "";

  // Mostrar preview da imagem existente quando editando
  if (produto.img) {
    const nomeImagem = produto.img.split('/').pop();
    const imageUrl = `${baseUrl}/public/imgs/${nomeImagem}`;
    document.getElementById("preview-image").src = imageUrl;
    document.getElementById("file-name").textContent = `Imagem atual: ${nomeImagem}`;
    document.getElementById("preview-container").style.display = "block";
  }

  // Limpar arquivo temporário quando editando
  arquivoTemporario = null;
}

async function deletarProduto(id) {
  if (!confirm("Tem certeza que deseja deletar este produto?")) return;

  const baseUrl = window.location.origin;
  
  try {
    const res = await fetch(`${baseUrl}/products/${id}`, {
      method: "DELETE",
    });

    const resultado = await res.json();

    if (res.ok && resultado.success) {
      // Sucesso na deleção
      alert(resultado.message);
      
      // Limpar todos os campos do formulário
      limparFormulario();
      
      // Limpar resultado da busca
      document.getElementById("resultado-produto").innerHTML = "";
      
      // Limpar campo de busca
      document.getElementById("busca").value = "";
      
    } else {
      // Erro na deleção
      alert(resultado.message || "Erro ao deletar produto.");
    }
  } catch (error) {
    console.error("Erro ao deletar produto:", error);
    alert("Erro ao conectar com o servidor. Verifique se o servidor está rodando.");
  }
}

// =================== FUNÇÃO PARA LIMPAR FORMULÁRIO ===================
function limparFormulario() {
  // Limpar todos os campos do formulário
  document.getElementById("form-produto").reset();
  document.getElementById("produto-id").value = "";
  
  // Limpar seleção de imagem
  limparSelecaoImagem();
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
    const baseUrl = window.location.origin;
    const res = await fetch(`${baseUrl}/upload-image`, {
      method: "POST",
      body: formData,
    });

    console.log("Resposta do servidor:", res.status);

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const result = await res.json();
    console.log("Resultado do upload:", result);

    if (result.file) {
      // Armazenar informações do arquivo temporário
      arquivoTemporario = {
        tempFileName: result.file,
        tempPath: `/public/imgs/${result.file}`
      };

      // Preenche temporariamente o campo URL
      document.getElementById("img").value = `/public/imgs/${result.file}`;
      document.getElementById("file-name").textContent = `✅ Upload concluído: ${file.name}`;

      console.log("Arquivo temporário armazenado:", arquivoTemporario);
    } else {
      throw new Error("Nome do arquivo não retornado pelo servidor");
    }
  } catch (error) {
    console.error("Erro detalhado no upload:", error);
    alert(
      `Erro ao enviar imagem: ${error.message}\nVerifique se o servidor está rodando em ${window.location.origin}`
    );
    limparSelecaoImagem();
  } finally {
    // Restaurar botão
    btnSelecionar.textContent = originalText;
    btnSelecionar.disabled = false;
  }
});

// =================== FORM SUBMISSION COM VALIDAÇÕES APRIMORADAS ===================

document.getElementById("form-produto").addEventListener("submit", async (e) => {
  e.preventDefault();

  // Pegar valores dos campos
  const nome = document.getElementById("nome").value.trim();
  const preco = document.getElementById("preco").value;
  const img = document.getElementById("img").value.trim();
  const quantidade = document.getElementById("quantidade").value;
  const id = document.getElementById("produto-id").value;

  // Validação mais específica
  if (!nome) {
    alert("Por favor, preencha o nome do produto.");
    document.getElementById("nome").focus();
    return;
  }

  if (nome.length < 3) {
    alert("O nome do produto deve ter pelo menos 3 caracteres.");
    document.getElementById("nome").focus();
    return;
  }

  if (!preco || preco <= 0) {
    alert("Por favor, insira um preço válido.");
    document.getElementById("preco").focus();
    return;
  }

  if (!img) {
    alert("Por favor, selecione uma imagem para o produto.");
    document.querySelector(".btn-selecionar").focus();
    return;
  }

  if (!quantidade || quantidade < 0) {
    alert("Por favor, insira uma quantidade válida.");
    document.getElementById("quantidade").focus();
    return;
  }

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

  const baseUrl = window.location.origin;
  const url = id
    ? `${baseUrl}/products/${id}`
    : `${baseUrl}/products`;
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

    const resultado = await res.json();

    if (res.ok) {
      // Sucesso no salvamento
      let mensagem = id ? "Produto atualizado com sucesso!" : "Produto adicionado com sucesso!";
      
      if (arquivoTemporario) {
        mensagem += `\nImagem salva como: ${arquivoTemporario.tempFileName}`;
      }
      
      alert(mensagem);

      // Limpar formulário completamente
      limparFormulario();
      
      // Limpar resultado da busca
      document.getElementById("resultado-produto").innerHTML = "";
      
      // Limpar campo de busca
      document.getElementById("busca").value = "";

    } else {
      // Erro no salvamento - mostrar mensagem específica do servidor
      alert(`Erro ao salvar produto: ${resultado.message || "Erro desconhecido"}`);
      
      // Se o erro for de nome duplicado, focar no campo nome
      if (resultado.message && resultado.message.includes("nome")) {
        document.getElementById("nome").focus();
        document.getElementById("nome").select();
      }
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

// =================== FORMATAÇÃO DE PREÇO ===================
// Event listener para formatar o preço automaticamente
document.getElementById("preco").addEventListener("blur", function() {
  const precoInput = this;
  let valor = parseFloat(precoInput.value);
  
  // Se o valor for válido, formatar com 2 casas decimais
  if (!isNaN(valor) && valor > 0) {
    precoInput.value = valor.toFixed(2);
  }
});

// Event listener para aceitar apenas números e vírgula/ponto
document.getElementById("preco").addEventListener("input", function(e) {
  let valor = e.target.value;
  
  // Remove caracteres que não são números, vírgula ou ponto
  valor = valor.replace(/[^0-9.,]/g, '');
  
  // Substitui vírgula por ponto para processamento
  valor = valor.replace(',', '.');
  
  // Permite apenas um ponto decimal
  const partes = valor.split('.');
  if (partes.length > 2) {
    valor = partes[0] + '.' + partes.slice(1).join('');
  }
  
  e.target.value = valor;
});

// =================== VALIDAÇÃO DE NOME EM TEMPO REAL ===================
document.getElementById("nome").addEventListener("input", function(e) {
  const nome = e.target.value.trim();
  
  // Remover caracteres especiais desnecessários
  const nomeFormatado = nome.replace(/[<>]/g, '');
  
  if (nomeFormatado !== nome) {
    e.target.value = nomeFormatado;
  }
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

// =================== FUNÇÃO PARA LIMPAR TUDO (BOTÃO EXTRA) ===================
function limparTudo() {
  // Limpar formulário
  limparFormulario();
  
  // Limpar resultado da busca
  document.getElementById("resultado-produto").innerHTML = "";
  
  // Limpar campo de busca
  document.getElementById("busca").value = "";
  
  // Focar no campo de busca
  document.getElementById("busca").focus();
}

// Adicionar botão de limpar tudo (opcional)
document.addEventListener("DOMContentLoaded", function() {
  const container = document.querySelector(".container");
  const botaoLimpar = document.createElement("button");
  botaoLimpar.type = "button";
  botaoLimpar.textContent = "🧹 Limpar Tudo";
  botaoLimpar.style.cssText = "background: #dc3545; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin: 10px 0;";
  botaoLimpar.onclick = limparTudo;
  
  // Inserir antes do botão "Voltar à loja"
  const botaoVoltar = document.querySelector(".botao-voltar");
  container.insertBefore(botaoLimpar, botaoVoltar);
});