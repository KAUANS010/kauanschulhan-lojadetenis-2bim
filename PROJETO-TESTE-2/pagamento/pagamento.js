// ======================= VERIFICAÇÃO DE LOGIN - NOVO =======================

// ======================= VERIFICAÇÃO DE LOGIN - NOVO =======================

function verificarLoginObrigatorio() {
  const usuario = JSON.parse(localStorage.getItem('usuario'));
  
  if (!usuario) {
    // Usuário não está logado - redirecionar para login
    alert('Para finalizar a compra, é necessário fazer login.');
    
    // Salvar que veio do pagamento para retornar depois
    localStorage.setItem('paginaAnterior', window.location.href);
    localStorage.setItem('redirecionamentoPagamento', 'true');
    
    // Garantir que os dados do carrinho não serão perdidos
    const valorTotal = parseFloat(localStorage.getItem('valorTotal')) || 0;
    const carrinho = localStorage.getItem('carrinho');
    
    // Salva cópia dos dados temporariamente
    if (valorTotal > 0) localStorage.setItem('valorTotalTemp', valorTotal.toString());
    if (carrinho) localStorage.setItem('carrinhoTemp', carrinho);
    
    // Redirecionar para login
    window.location.href = '../../LOGIN/login.html';
    return false;
  }
  
  return true;
}

// ======================= CÓDIGO ORIGINAL =======================

// Quando todo o conteúdo da página estiver carregado
document.addEventListener("DOMContentLoaded", () => {
  // Verifica se há dados temporários e restaura eles
  if (localStorage.getItem('valorTotalTemp')) {
    localStorage.setItem('valorTotal', localStorage.getItem('valorTotalTemp'));
    localStorage.removeItem('valorTotalTemp');
  }
  
  if (localStorage.getItem('carrinhoTemp')) {
    localStorage.setItem('carrinho', localStorage.getItem('carrinhoTemp'));
    localStorage.removeItem('carrinhoTemp');
  }

  // Recupera o valor total da compra salvo no localStorage (ou 0 se não houver)
  const total = parseFloat(localStorage.getItem('valorTotal')) || 0;

  // Exibe esse valor no elemento com o ID 'resumoPagamento'
  document.getElementById('resumoPagamento').textContent = `Total: R$ ${total.toFixed(2)}`;

  // Verificar se o usuário chegou aqui após fazer login
  const redirecionamentoPagamento = localStorage.getItem('redirecionamentoPagamento');
  if (redirecionamentoPagamento) {
    // Remove a flag de redirecionamento
    localStorage.removeItem('redirecionamentoPagamento');
    
    // Mostra mensagem de boas-vindas
    const usuario = JSON.parse(localStorage.getItem('usuario'));
    if (usuario) {
      alert(`Bem-vindo de volta, ${usuario.nome}! Agora você pode finalizar sua compra.`);
    }
  }
  verificarUsuario(); // <-- ADICIONE AQUI
});

// ======================= CÓDIGO ORIGINAL =======================

// Quando todo o conteúdo da página estiver carregado
document.addEventListener("DOMContentLoaded", () => {
  // Verifica se há dados temporários e restaura eles
  if (localStorage.getItem('valorTotalTemp')) {
    localStorage.setItem('valorTotal', localStorage.getItem('valorTotalTemp'));
    localStorage.removeItem('valorTotalTemp');
  }
  
  if (localStorage.getItem('carrinhoTemp')) {
    localStorage.setItem('carrinho', localStorage.getItem('carrinhoTemp'));
    localStorage.removeItem('carrinhoTemp');
  }

  // Recupera o valor total da compra salvo no localStorage (ou 0 se não houver)
  const total = parseFloat(localStorage.getItem('valorTotal')) || 0;

  // Exibe esse valor no elemento com o ID 'resumoPagamento'
  document.getElementById('resumoPagamento').textContent = `Total: R$ ${total.toFixed(2)}`;

  // Verificar se o usuário chegou aqui após fazer login
  const redirecionamentoPagamento = localStorage.getItem('redirecionamentoPagamento');
  if (redirecionamentoPagamento) {
    // Remove a flag de redirecionamento
    localStorage.removeItem('redirecionamentoPagamento');
    
    // Mostra mensagem de boas-vindas
    const usuario = JSON.parse(localStorage.getItem('usuario'));
    if (usuario) {
      alert(`Bem-vindo de volta, ${usuario.nome}! Agora você pode finalizar sua compra.`);
    }
  }
  verificarUsuario(); // <-- ADICIONE AQUI
});

// Função chamada quando o usuário escolhe uma forma de pagamento
function verificarPagamento() {
  const forma = document.getElementById("formaPagamento").value; // Pega o valor selecionado

  // Se o usuário escolher Pix, chama a função que gera o QR Code
  if (forma === "Pix") {
    pagarPIX();
  } else {
    // Se for outra forma de pagamento, esconde o QR Code e limpa o conteúdo
    document.getElementById("qrcode-area").style.display = "none";
    document.getElementById("qrcode").innerHTML = "";
  }
}

// Função para gerar o QR Code Pix
function pagarPIX() {
  const forma = document.getElementById("formaPagamento").value; // Confirma a forma de pagamento

  // Verifica se é realmente Pix
  if (forma !== "Pix") {
    alert("Selecione a forma de pagamento como Pix para gerar o QR Code.");
    return; // Para a função se não for Pix
  }

  // Recupera o valor total da compra
  const valor = parseFloat(localStorage.getItem('valorTotal')) || 0;

  // Dados do recebedor
  const chavePix = '73378690968'; // Chave Pix do vendedor
  const nomeRecebedor = 'KAUAN SCHULHAN ';
  const cidade = 'SAO PAULO';
  const descricao = 'Pagamento  LojaDeTenis'; // Descrição opcional do pagamento

  // Função auxiliar que formata os campos do padrão Pix (ID, tamanho, valor)
  function format(id, value) {
    const size = value.length.toString().padStart(2, '0'); // Tamanho do valor em dois dígitos
    return `${id}${size}${value}`; // Retorna o campo formatado
  }

  // Monta as informações da conta do recebedor conforme padrão Pix
  const merchantAccount = format("00", "BR.GOV.BCB.PIX") + // Identificador Pix
                          format("01", chavePix) +          // Chave Pix
                          format("02", descricao);          // Descrição do pagamento

  // Monta o payload Pix (código a ser convertido em QR Code), ainda sem o CRC final
  const payloadSemCRC =
    format("00", "01") + // Indicador de formato fixo
    format("26", merchantAccount) + // Informações da conta
    format("52", "0000") + // Categoria do comerciante (0000 = genérico)
    format("53", "986") + // Código da moeda (986 = BRL)
    format("54", valor.toFixed(2)) + // Valor formatado com duas casas
    format("58", "BR") + // País
    format("59", nomeRecebedor) + // Nome do recebedor
    format("60", cidade) + // Cidade
    format("62", format("05", "***")) + // Campo adicional opcional
    "6304"; // Início do campo de CRC (verificação)

  // Função que calcula o CRC16 (checksum exigido pelo padrão Pix)
  function crc16(str) {
    let crc = 0xFFFF; // Valor inicial padrão
    for (let i = 0; i < str.length; i++) {
      crc ^= str.charCodeAt(i) << 8; // Aplica XOR no byte atual
      for (let j = 0; j < 8; j++) {
        // Aplica a operação de shift e XOR conforme o algoritmo CRC16-CCITT
        if ((crc & 0x8000) !== 0) {
          crc = (crc << 1) ^ 0x1021;
        } else {
          crc <<= 1;
        }
        crc &= 0xFFFF; // Garante que fique em 16 bits
      }
    }
    return crc.toString(16).toUpperCase().padStart(4, '0'); // Retorna em hexadecimal com 4 dígitos
  }

  // Junta o payload com o CRC calculado para gerar o código final
  const payloadCompleto = payloadSemCRC + crc16(payloadSemCRC);

  // Seleciona a div onde o QR Code será exibido
  const qrCodeDiv = document.getElementById("qrcode");
  qrCodeDiv.innerHTML = ''; // Limpa qualquer conteúdo anterior (ex: um QR anterior)

  // Torna a área do QR Code visível
  document.getElementById("qrcode-area").style.display = "block";

  // Usa a biblioteca QRCode.js para gerar o QR Code com o payload Pix
  new QRCode(qrCodeDiv, {
    text: payloadCompleto, // Texto que será convertido no QR Code
    width: 250,            // Largura do QR Code
    height: 250,           // Altura
    colorDark: "#000000",  // Cor do QR
    colorLight: "#ffffff", // Cor de fundo
    correctLevel: QRCode.CorrectLevel.H // Nível de correção de erros (H = alta)
  });

  // Cria uma div abaixo do QR com informações adicionais do pagamento
  const info = document.createElement("div");
  info.className = "nome-valor"; // Classe para estilização
  info.innerHTML = `
    <p><strong>Nome:</strong> ${nomeRecebedor}</p>
    <p><strong>CPF/CNPJ (PIX):</strong> ${chavePix}</p>
    <p><strong>Valor:</strong> R$ ${valor.toFixed(2)}</p>
  `;
  qrCodeDiv.appendChild(info); // Adiciona as informações abaixo do QR Code
}

// ======================= FUNÇÃO MODIFICADA - VERIFICAÇÃO OBRIGATÓRIA =======================


// Função chamada quando o usuário clica em "Finalizar"
function finalizarCompra() {
  // NOVA VERIFICAÇÃO OBRIGATÓRIA DE LOGIN
  if (!verificarLoginObrigatorio()) {
    return; // Para a execução se não estiver logado
  }

  // Recuperar dados do usuário para personalizar a mensagem
  const usuario = JSON.parse(localStorage.getItem('usuario'));
  const nomeUsuario = usuario ? usuario.nome : 'Cliente';

  // Mostra mensagem de agradecimento personalizada
  alert(`Compra finalizada com sucesso, ${nomeUsuario}! Obrigado pela preferência, volte sempre!`);

  // Limpa o carrinho e o valor total salvos no localStorage
  localStorage.removeItem("carrinho");
  localStorage.removeItem('valorTotal');

  // Redireciona o usuário de volta para a loja (corrigido de pagamento.html para loja.html)
  window.location.href = '../loja/loja.html';
}



/// ======================= LOGIN: EXIBIÇÃO E CONTROLE DO BOTÃO =======================

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
    localStorage.setItem('paginaAnterior', window.location.href);
    window.location.href = '../../LOGIN/login.html';
  }
}

function logout() {
  localStorage.removeItem('usuario');
  atualizarBotaoLogin(null);
  alert('Logout realizado com sucesso!');
}
