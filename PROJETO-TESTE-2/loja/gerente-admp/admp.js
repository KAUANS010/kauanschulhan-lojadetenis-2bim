async function carregarUsuarios() {
  const res = await fetch('http://localhost:3000/users');
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

  const res = await fetch(`http://localhost:3000/users/${email}`, {
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
    window.location.href = "./login.html";
    return;
  }

  carregarUsuarios();
};
