// Versão corrigida do produto.js com melhor tratamento de upload

// Variáveis globais para controle do upload
let arquivoSelecionado = null;
let arquivoTemporario = null; // Para armazenar info do arquivo temporário

async function buscarProduto() {
  const baseUrl = window.location.origin;
  const nomeBusca = document.getElementById("busca").value.toLowerCase();
  
  try {
    const res = await fetch(`${baseUrl}/products`);
    if (!res.ok) {
      throw new Error(`Erro HTTP: ${res.status}`);
    }
    const produtos = await res.json();

    const produto = produtos.find(p => p.name.toLowerCase().includes(nomeBusca));
    const resultado = document.getElementById("resultado-produto");

    if (produto) {
      resultado.innerHTML = `
        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 10px 0;">
          <p><strong>${produto.name}</strong> (ID: ${produto.id})</p>
          <p>Preço: R$ ${produto.price.toFixed(2)}</p>
          <p>Estoque: ${produto.quantity}</p>
          <div style="margin-top: 10px;">
            <button onclick="editarProduto(${produto.id})" style="background: #007bff; color: white; padding: 8px 16px; border: none; border-radius: 4px; margin-right: 10px; cursor: pointer;">Editar</button>
            <button onclick="deletarProduto(${produto.id})" style="background: #dc3545; color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer;">Deletar</button>
          </div>
        </div>
      `;
    } else {
      resultado.innerHTML = `
        <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 10px 0; border: 1px solid #ffeaa7;">
          <p>⚠️ Produto não encontrado. Você pode adicioná-lo usando o formulário abaixo.</p>
        </div>
      `;
    }
  } catch (error) {
    console.error("Erro ao buscar produto:", error);
    document.getElementById("resultado-produto").innerHTML = `
      <div style="background: #f8d7da; padding: 15px; border-radius: 8px; margin: 10px 0; border: 1px solid #f5c6cb;">
        <p>❌ Erro ao buscar produto. Verifique se o servidor está rodando.</p>
      </div>
    `;
  }
}

async function editarProduto(id) {
  const baseUrl = window.location.origin;
  
  try {
    const res = await fetch(`${baseUrl}/products/${id}`);
    if (!res.ok) {
      throw new Error(`Produto não encontrado: ${res.status}`);
    }
    
    const produto = await res.json();

    // Preencher campos do formulário
    document.getElementById("produto-id").value = produto.id;
    document.getElementById("nome").value = produto.name;
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

    // Mostrar preview da imagem existente
    if (produto.img) {
      const nomeImagem = produto.img.split('/').pop();
      const imageUrl = `${baseUrl}/public/imgs/${nomeImagem}`;
      document.getElementById("preview-image").src = imageUrl;
      document.getElementById("file-name").textContent = `Imagem atual: ${nomeImagem}`;
      document.getElementById("preview-container").style.display = "block";
    }

    // Limpar arquivo temporário quando editando
    arquivoTemporario = null;
    
    // Rolar para o formulário
    document.getElementById("form-produto").scrollIntoView({ behavior: 'smooth' });
    
  } catch (error) {
    console.error("Erro ao carregar produto:", error);
    alert("Erro ao carregar dados do produto. Verifique se o servidor está rodando.");
  }
}

async function deletarProduto(id) {
  if (!confirm("⚠️ Tem certeza que deseja deletar este produto?\n\nEsta ação não pode ser desfeita!")) {
    return;
  }

  const baseUrl = window.location.origin;
  
  try {
    const res = await fetch(`${baseUrl}/products/${id}`, {
      method: "DELETE",
    });

    const resultado = await res.json();

    if (res.ok && resultado.success) {
      alert(`✅ ${resultado.message}`);
      
      // Limpar todos os campos do formulário
      limparFormulario();
      
      // Limpar resultado da busca
      document.getElementById("resultado-produto").innerHTML = "";
      
      // Limpar campo de busca
      document.getElementById("busca").value = "";
      
    } else {
      alert(`❌ ${resultado.message || "Erro ao deletar produto."}`);
    }
  } catch (error) {
    console.error("Erro ao deletar produto:", error);
    alert("❌ Erro ao conectar com o servidor. Verifique se o servidor está rodando.");
  }
}

// Função para limpar formulário
function limparFormulario() {
  document.getElementById("form-produto").reset();
  document.getElementById("produto-id").value = "";
  limparSelecaoImagem();
}

// Funcionalidades de upload
function selecionarImagem() {
  document.getElementById("file-input").click();
}

function limparSelecaoImagem() {
  document.getElementById("file-input").value = "";
  document.getElementById("preview-container").style.display = "none";
  document.getElementById("img").value = "";
  arquivoSelecionado = null;
  arquivoTemporario = null;
}

// Event listener para upload de arquivo
document.getElementById("file-input").addEventListener("change", async function (e) {
  const file = e.target.files[0];

  if (!file) {
    limparSelecaoImagem();
    return;
  }

  console.log("Arquivo selecionado:", file.name, "Tamanho:", file.size, "Tipo:", file.type);

  // Validação de tipo
  if (!file.type.startsWith("image/")) {
    alert("❌ Por favor, selecione apenas arquivos de imagem (JPG, PNG, GIF, etc.).");
    limparSelecaoImagem();
    return;
  }

  // Validação de tamanho (5MB)
  if (file.size > 5 * 1024 * 1024) {
    alert("❌ A imagem deve ter no máximo 5MB.");
    limparSelecaoImagem();
    return;
  }

  // Mostrar preview imediatamente
  const reader = new FileReader();
  reader.onload = function (evt) {
    document.getElementById("preview-image").src = evt.target.result;
    document.getElementById("file-name").textContent = `📁 Carregando: ${file.name}`;
    document.getElementById("preview-container").style.display = "block";
  };
  reader.readAsDataURL(file);

  // Indicador de carregamento
  const btnSelecionar = document.querySelector(".btn-selecionar");
  const originalText = btnSelecionar.textContent;
  btnSelecionar.textContent = "⏳ Enviando...";
  btnSelecionar.disabled = true;

  // Upload automático
  const formData = new FormData();
  formData.append("imagem", file);

  try {
    const baseUrl = window.location.origin;
    console.log("Enviando para:", `${baseUrl}/upload-image`);
    
    const res = await fetch(`${baseUrl}/upload-image`, {
      method: "POST",
      body: formData,
    });

    console.log("Status da resposta:", res.status);

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Erro HTTP ${res.status}: ${errorText}`);
    }

    const result = await res.json();
    console.log("Resultado do upload:", result);

    if (result.file) {
      // Armazenar informações do arquivo temporário
      arquivoTemporario = {
        tempFileName: result.file,
        tempPath: result.path,
        originalName: file.name
      };

      // Preencher campo URL
      document.getElementById("img").value = result.path;
      document.getElementById("file-name").textContent = `✅ Upload concluído: ${file.name}`;

      console.log("Arquivo temporário salvo:", arquivoTemporario);
    } else {
      throw new Error("Nome do arquivo não retornado pelo servidor");
    }
  } catch (error) {
    console.error("Erro no upload:", error);
    alert(`❌ Erro ao enviar imagem: ${error.message}\n\nVerifique se:\n- O servidor está rodando\n- A conexão está funcionando\n- O arquivo não está corrompido`);
    limparSelecaoImagem();
  } finally {
    // Restaurar botão
    btnSelecionar.textContent = originalText;
    btnSelecionar.disabled = false;
  }
});

// Submit do formulário
document.getElementById("form-produto").addEventListener("submit", async (e) => {
  e.preventDefault();

  // Validações
  const nome = document.getElementById("nome").value.trim();
  const preco = document.getElementById("preco").value;
  const img = document.getElementById("img").value.trim();
  const quantidade = document.getElementById("quantidade").value;
  const id = document.getElementById("produto-id").value;

  if (!nome || nome.length < 3) {
    alert("❌ Nome do produto deve ter pelo menos 3 caracteres.");
    document.getElementById("nome").focus();
    return;
  }

  if (!preco || parseFloat(preco) <= 0) {
    alert("❌ Preço deve ser um valor positivo.");
    document.getElementById("preco").focus();
    return;
  }

  if (!img) {
    alert("❌ Selecione uma imagem para o produto.");
    document.querySelector(".btn-selecionar").focus();
    return;
  }

  if (!quantidade || parseInt(quantidade) < 0) {
    alert("❌ Quantidade deve ser um número não negativo.");
    document.getElementById("quantidade").focus();
    return;
  }

  // Preparar dados
  const produto = {
    name: nome,
    price: parseFloat(preco),
    img: img,
    quantity: parseInt(quantidade),
    features: document.getElementById("features").value
      .split("|")
      .map(f => f.trim())
      .filter(f => f),
  };

  // Adicionar arquivo temporário se existir
  if (arquivoTemporario) {
    produto.tempFileName = arquivoTemporario.tempFileName;
  }

  const baseUrl = window.location.origin;
  const url = id ? `${baseUrl}/products/${id}` : `${baseUrl}/products`;
  const method = id ? "PUT" : "POST";

  // Indicador de salvamento
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
      let mensagem = id ? "✅ Produto atualizado com sucesso!" : "✅ Produto adicionado com sucesso!";
      
      if (arquivoTemporario) {
        const extensao = arquivoTemporario.tempFileName.split('.').pop();
        const nomeDefinitivo = `${resultado.id}.${extensao}`;
        mensagem += `\n\n📸 Imagem salva como: ${nomeDefinitivo}`;
      }
      
      alert(mensagem);

      // Limpar formulário
      limparFormulario();
      document.getElementById("resultado-produto").innerHTML = "";
      document.getElementById("busca").value = "";

    } else {
      alert(`❌ ${resultado.message || "Erro ao salvar produto"}`);
      
      if (resultado.message && resultado.message.includes("nome")) {
        document.getElementById("nome").focus();
        document.getElementById("nome").select();
      }
    }
  } catch (error) {
    console.error("Erro ao salvar:", error);
    alert("❌ Erro ao conectar com o servidor. Verifique se o servidor está rodando.");
  } finally {
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  }
});

// Formatação de preço
document.getElementById("preco").addEventListener("blur", function() {
  const valor = parseFloat(this.value);
  if (!isNaN(valor) && valor > 0) {
    this.value = valor.toFixed(2);
  }
});

// Permitir apenas números no preço
document.getElementById("preco").addEventListener("input", function(e) {
  let valor = e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.');
  const partes = valor.split('.');
  if (partes.length > 2) {
    valor = partes[0] + '.' + partes.slice(1).join('');
  }
  e.target.value = valor;
});

// Limpar caracteres especiais do nome
document.getElementById("nome").addEventListener("input", function(e) {
  const nome = e.target.value.replace(/[<>]/g, '');
  if (nome !== e.target.value) {
    e.target.value = nome;
  }
});

// Função para limpar tudo
function limparTudo() {
  limparFormulario();
  document.getElementById("resultado-produto").innerHTML = "";
  document.getElementById("busca").value = "";
  document.getElementById("busca").focus();
}

// Adicionar botão limpar na inicialização
document.addEventListener("DOMContentLoaded", function() {
  const container = document.querySelector(".container");
  const botaoLimpar = document.createElement("button");
  botaoLimpar.type = "button";
  botaoLimpar.textContent = "🧹 Limpar Tudo";
  botaoLimpar.style.cssText = `
    background: #dc3545; 
    color: white; 
    padding: 10px 20px; 
    border: none; 
    border-radius: 5px; 
    cursor: pointer; 
    margin: 10px 0;
    font-size: 14px;
  `;
  botaoLimpar.onclick = limparTudo;
  
  const botaoVoltar = document.querySelector(".botao-voltar");
  if (botaoVoltar) {
    container.insertBefore(botaoLimpar, botaoVoltar);
  }
});