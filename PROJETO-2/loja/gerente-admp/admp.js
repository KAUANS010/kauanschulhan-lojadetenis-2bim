async function carregarUsuarios( ) {
  const baseUrl = window.location.origin; // Adicionado
  const res = await fetch(`${baseUrl}/users`); // Modificado
  const usuarios = await res.json();
  const tabela = document.getElementById('tabela-usuarios');
  tabela.innerHTML = '';

  usuarios.forEach(usuario => {
    const tr = document.createElement('tr');

    const tipoAtual = usuario.tipo;
    const tipoAlternativo = tipoAtual === 'cliente' ? 'gerente' : 'cliente';

    tr.innerHTML = `
      <td>${usuario.email}</td>
      <td>${usuario.nome}</td>
      <td>${usuario.tipo}</td>
      <td>
        <button onclick="alterarTipo('${usuario.email}', '${tipoAlternativo}')">
          Tornar ${tipoAlternativo}
        </button>
      </td>
    `;

    tabela.appendChild(tr);
  });
}

async function alterarTipo(email, novoTipo) {
  if (!confirm(`Deseja mesmo mudar o tipo de "${email}" para ${novoTipo}?`)) return;

  const baseUrl = window.location.origin; // Adicionado
  const res = await fetch(`${baseUrl}/users/${email}`, { // Modificado
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tipo: novoTipo })
  });

  if (res.ok) {
    alert("Usuário atualizado com sucesso.");
    carregarUsuarios();
  } else {
    alert("Erro ao atualizar o usuário.");
  }
}

window.onload = () => {
  const usuario = JSON.parse(localStorage.getItem('usuario'));
  if (!usuario || usuario.tipo !== 'gerente') {
    alert("Acesso negado. Apenas gerentes podem acessar.");
    // Ajuste o caminho para o login.html se necessário, dependendo da estrutura de pastas
    window.location.href = "/LOGIN/login.html"; // Ajustado para um caminho mais genérico
    return;
  }

  carregarUsuarios();
};


async function adicionarUsuario() {
  const email = prompt("Digite o e-mail do novo usuário:");
  const senha = prompt("Digite a senha do novo usuário:");
  const nome = prompt("Digite o nome do novo usuário:");
  if (!email || !senha || !nome) return alert("Todos os campos são obrigatórios.");

  const baseUrl = window.location.origin; // Adicionado
  const res = await fetch(`${baseUrl}/users/create`, { // Modificado
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, senha, nome })
  });

  const data = await res.json();
  alert(data.message);
  if (res.ok) carregarUsuarios();
}

async function atualizarUsuario() {
  const email = prompt("Digite o e-mail do usuário a ser atualizado:");
  const novoEmail = prompt("Novo e-mail (ou deixe igual):", email);
  const novaSenha = prompt("Nova senha:");
  const novoNome = prompt("Novo nome:");
  if (!email || !novaSenha || !novoNome) return alert("Todos os campos são obrigatórios.");

  const baseUrl = window.location.origin; // Adicionado
  const res = await fetch(`${baseUrl}/users/update`, { // Modificado
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, novoEmail, novaSenha, novoNome })
  });

  const data = await res.json();
  alert(data.message);
  if (res.ok) carregarUsuarios();
}

async function importarCSV() {
  const input = document.getElementById("arquivo-csv");
  if (!input.files.length) return alert("Selecione um arquivo CSV.");
  const file = input.files[0];

  const formData = new FormData();
  formData.append('arquivo', file);

  const baseUrl = window.location.origin; // Adicionado
  const res = await fetch(`${baseUrl}/users/import`, { // Modificado
    method: 'POST',
    body: formData
  });

  const data = await res.json();
  alert(data.message);
  if (res.ok) carregarUsuarios();
}

function baixarCSV() {
  const baseUrl = window.location.origin; // Adicionado
  window.location.href = `${baseUrl}/users/export`; // Modificado
}

async function deletarUsuario() {
  const email = prompt("Digite o e-mail do usuário que deseja deletar:");
  if (!email) return alert("E-mail é obrigatório.");
  if (!confirm(`Tem certeza que deseja deletar o usuário "${email}"?`)) return;

  const baseUrl = window.location.origin; // Adicionado
  const res = await fetch(`${baseUrl}/users/${email}`, { // Modificado
    method: 'DELETE'
  });

  const data = await res.json();
  alert(data.message);
  if (res.ok) carregarUsuarios();
}
