// ======================= VERIFICAÇÃO DE LOGIN - APRIMORADA =======================

function verificarLoginObrigatorio() {
  const usuario = JSON.parse(localStorage.getItem('usuario'));
  
  if (!usuario) {
    // Usuário não está logado - preparar redirecionamento
    console.log('Usuário não logado, redirecionando para login...');
    
    // Salvar dados do carrinho para não perder
    salvarDadosTemporarios();
    
    // Configurar flags de redirecionamento
    localStorage.setItem('paginaAnterior', window.location.href);
    localStorage.setItem('redirecionamentoPagamento', 'true');
    
    // Informar ao usuário
    alert('Para finalizar a compra, é necessário fazer login.');
    
    // Redirecionar para login
    window.location.href = '/LOGIN/login.html';
    return false;
  }
  
  return true;
}

function salvarDadosTemporarios() {
  // Salva valor total temporariamente
  const valorTotal = parseFloat(localStorage.getItem('valorTotal')) || 0;
  if (valorTotal > 0) {
    localStorage.setItem('valorTotalTemp', valorTotal.toString());
    console.log('Valor total salvo temporariamente:', valorTotal);
  }
  
  // Salva carrinho temporariamente
  const carrinho = localStorage.getItem('carrinho');
  if (carrinho) {
    localStorage.setItem('carrinhoTemp', carrinho);
    console.log('Carrinho salvo temporariamente');
  }
}

// ======================= INICIALIZAÇÃO DA PÁGINA =======================

document.addEventListener("DOMContentLoaded", () => {
  console.log('Página de pagamento carregada');
  
  // Restaura dados se necessário
  restaurarDadosSeNecessario();
  
  // Exibe o resumo do pagamento
  exibirResumoPagamento();
  
  // Verifica se usuário acabou de fazer login
  verificarLoginRecente();
  
  // Atualiza interface do usuário
  verificarUsuario();
});

function restaurarDadosSeNecessario() {
  // Verifica se há dados temporários e restaura
  const valorTemp = localStorage.getItem('valorTotalTemp');
  const carrinhoTemp = localStorage.getItem('carrinhoTemp');
  
  if (valorTemp) {
    localStorage.setItem('valorTotal', valorTemp);
    localStorage.removeItem('valorTotalTemp');
    console.log('Valor total restaurado da sessão temporária:', valorTemp);
  }
  
  if (carrinhoTemp) {
    localStorage.setItem('carrinho', carrinhoTemp);
    localStorage.removeItem('carrinhoTemp');
    console.log('Carrinho restaurado da sessão temporária');
  }
}

function exibirResumoPagamento() {
  // Recupera o valor total da compra
  const total = parseFloat(localStorage.getItem('valorTotal')) || 0;
  
  // Exibe no elemento de resumo
  const resumoElement = document.getElementById('resumoPagamento');
  if (resumoElement) {
    resumoElement.textContent = `Total: R$ ${total.toFixed(2)}`;
  }
  
  console.log('Resumo do pagamento exibido:', total);
}

function verificarLoginRecente() {
  // Verifica se o usuário acabou de fazer login
  const redirecionamentoPagamento = localStorage.getItem('redirecionamentoPagamento');
  
  if (redirecionamentoPagamento === 'true') {
    // Remove a flag
    localStorage.removeItem('redirecionamentoPagamento');
    localStorage.removeItem('paginaAnterior');
    
    // Mostra mensagem de boas-vindas
    const usuario = JSON.parse(localStorage.getItem('usuario'));
    if (usuario) {
      alert(`Bem-vindo de volta, ${usuario.nome}! Agora você pode finalizar sua compra.`);
      console.log('Usuário retornou após login:', usuario.nome);
    }
  }
}

// ======================= FUNÇÕES DE PAGAMENTO =======================

function verificarPagamento() {
  const forma = document.getElementById("formaPagamento").value;

  if (forma === "Pix") {
    pagarPIX();
  } else {
    // Esconde área do QR Code para outras formas de pagamento
    const qrcodeArea = document.getElementById("qrcode-area");
    const qrcodeDiv = document.getElementById("qrcode");
    
    if (qrcodeArea) qrcodeArea.style.display = "none";
    if (qrcodeDiv) qrcodeDiv.innerHTML = "";
  }
}

function pagarPIX() {
  const forma = document.getElementById("formaPagamento").value;

  if (forma !== "Pix") {
    alert("Selecione a forma de pagamento como Pix para gerar o QR Code.");
    return;
  }

  const valor = parseFloat(localStorage.getItem('valorTotal')) || 0;

  // Dados do recebedor
  const chavePix = '73378690968';
  const nomeRecebedor = 'KAUAN SCHULHAN ';
  const cidade = 'SAO PAULO';
  const descricao = 'Pagamento LojaDeTenis';

  // Função auxiliar para formatação
  function format(id, value) {
    const size = value.length.toString().padStart(2, '0');
    return `${id}${size}${value}`;
  }

  // Monta informações da conta
  const merchantAccount = format("00", "BR.GOV.BCB.PIX") +
                          format("01", chavePix) +
                          format("02", descricao);

  // Monta payload sem CRC
  const payloadSemCRC =
    format("00", "01") +
    format("26", merchantAccount) +
    format("52", "0000") +
    format("53", "986") +
    format("54", valor.toFixed(2)) +
    format("58", "BR") +
    format("59", nomeRecebedor) +
    format("60", cidade) +
    format("62", format("05", "***")) +
    "6304";

  // Função CRC16
  function crc16(str) {
    let crc = 0xFFFF;
    for (let i = 0; i < str.length; i++) {
      crc ^= str.charCodeAt(i) << 8;
      for (let j = 0; j < 8; j++) {
        if ((crc & 0x8000) !== 0) {
          crc = (crc << 1) ^ 0x1021;
        } else {
          crc <<= 1;
        }
        crc &= 0xFFFF;
      }
    }
    return crc.toString(16).toUpperCase().padStart(4, '0');
  }

  // Payload completo
  const payloadCompleto = payloadSemCRC + crc16(payloadSemCRC);

  // Gera QR Code
  const qrCodeDiv = document.getElementById("qrcode");
  const qrcodeArea = document.getElementById("qrcode-area");
  
  if (qrCodeDiv) {
    qrCodeDiv.innerHTML = '';
    
    if (qrcodeArea) {
      qrcodeArea.style.display = "block";
    }

    new QRCode(qrCodeDiv, {
      text: payloadCompleto,
      width: 250,
      height: 250,
      colorDark: "#000000",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.H
    });

    // Adiciona informações
    const info = document.createElement("div");
    info.className = "nome-valor";
    info.innerHTML = `
      <p><strong>Nome:</strong> ${nomeRecebedor}</p>
      <p><strong>CPF/CNPJ (PIX):</strong> ${chavePix}</p>
      <p><strong>Valor:</strong> R$ ${valor.toFixed(2)}</p>
    `;
    qrCodeDiv.appendChild(info);
  }
}

// ======================= MODAL DE CONFIRMAÇÃO =======================

function mostrarConfirmacaoPagamento() {
  const modal = document.getElementById('modal-confirmacao');
  const modalInfo = document.querySelector('.modal-info');
  const formaPagamento = document.getElementById("formaPagamento").value;
  const valorTotal = parseFloat(localStorage.getItem('valorTotal')) || 0;
  const usuario = JSON.parse(localStorage.getItem('usuario'));

  if (modal && modalInfo) {
    modalInfo.innerHTML = `
      <p><strong>Forma de Pagamento:</strong> ${formaPagamento}</p>
      <p><strong>Valor Total:</strong> R$ ${valorTotal.toFixed(2)}</p>
      ${usuario ? `<p><strong>Cliente:</strong> ${usuario.nome}</p>` : ''}
    `;
    
    modal.style.display = 'flex';

    // Configura os botões do modal
    document.querySelector('.modal-botao-confirmar').onclick = () => {
      modal.style.display = 'none';
      finalizarCompra();
    };

    document.querySelector('.modal-botao-cancelar').onclick = () => {
      modal.style.display = 'none';
    };
  }
}

// ======================= FINALIZAÇÃO DA COMPRA - APRIMORADA =======================

function finalizarCompra() {
  console.log('Tentativa de finalizar compra...');
  
  // Verificação obrigatória de login
  if (!verificarLoginObrigatorio()) {
    return;
  }

  // Verifica se há uma forma de pagamento selecionada
  const formaPagamento = document.getElementById("formaPagamento").value;
  if (!formaPagamento || formaPagamento === "Escolha sua forma de pagamento") {
    alert("Por favor, selecione uma forma de pagamento antes de finalizar.");
    return;
  }

  // Verifica se há valor no carrinho
  const valorTotal = parseFloat(localStorage.getItem('valorTotal')) || 0;
  if (valorTotal <= 0) {
    alert("Não há itens no carrinho para finalizar a compra.");
    return;
  }

  // Recupera dados do usuário
  const usuario = JSON.parse(localStorage.getItem('usuario'));
  const nomeUsuario = usuario ? usuario.nome : 'Cliente';

  // Confirma a finalização
  const confirmar = confirm(`Finalizar compra no valor de R$ ${valorTotal.toFixed(2)} via ${formaPagamento}?`);
  
  if (confirmar) {
    // Mensagem de sucesso personalizada
    alert(`Compra finalizada com sucesso, ${nomeUsuario}! Obrigado pela preferência, volte sempre!`);

    // Limpa dados do carrinho
    localStorage.removeItem("carrinho");
    localStorage.removeItem('valorTotal');
    
    // Limpa possíveis dados temporários
    localStorage.removeItem('valorTotalTemp');
    localStorage.removeItem('carrinhoTemp');

    console.log('Compra finalizada, redirecionando para loja...');
    
    // Redireciona para a loja
    window.location.href = '/PROJETO-2/loja/loja.html';
  }
}

// ======================= CONTROLE DE LOGIN NA INTERFACE =======================

function verificarUsuario() {
  const usuario = JSON.parse(localStorage.getItem('usuario'));

  if (usuario) {
    atualizarBotaoLogin(usuario);
  } else {
    atualizarBotaoLogin(null);
  }
}

function atualizarBotaoLogin(usuario) {
  const botao = document.getElementById('botao-login');
  const icone = document.getElementById('login-icone');
  const texto = document.getElementById('login-texto');

  if (botao && icone && texto) {
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
}

function gerenciarLogin() {
  const usuario = JSON.parse(localStorage.getItem('usuario'));

  if (usuario) {
    const opcao = confirm(`Olá, ${usuario.nome}!\n\nDeseja fazer logout?`);
    if (opcao) {
      logout();
    }
  } else {
    // Salva a página atual como anterior
    localStorage.setItem('paginaAnterior', window.location.href);
    window.location.href = '/LOGIN/login.html';
  }
}

function logout() {
  localStorage.removeItem('usuario');
  atualizarBotaoLogin(null);
  alert('Logout realizado com sucesso!');
}