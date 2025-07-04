// ======================= FUNÇÕES PRINCIPAIS =======================

async function carregarUsuarios() {
  try {
    const baseUrl = window.location.origin;
    const res = await fetch(`${baseUrl}/users`);
    
    if (!res.ok) {
      throw new Error('Erro ao carregar usuários');
    }
    
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
          <button onclick="alterarTipo('${usuario.email}', '${usuario.nome}', '${usuario.senha}', '${tipoAlternativo}')">
            Tornar ${tipoAlternativo}
          </button>
        </td>
      `;

      tabela.appendChild(tr);
    });
  } catch (error) {
    console.error('Erro ao carregar usuários:', error);
    alert('Erro ao carregar lista de usuários');
  }
}

async function alterarTipo(email, nome, senha, novoTipo) {
  if (!confirm(`Deseja mesmo mudar o tipo de "${email}" para ${novoTipo}?`)) return;

  try {
    const baseUrl = window.location.origin;
    
    const res = await fetch(`${baseUrl}/users/update`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email: email,
        novoEmail: email,
        novaSenha: senha,
        novoNome: nome,
        novoTipo: novoTipo
      })
    });

    const data = await res.json();
    
    if (res.ok) {
      alert(`Usuário ${email} atualizado para ${novoTipo} com sucesso!`);
      carregarUsuarios();
    } else {
      alert(`Erro ao atualizar o usuário: ${data.message}`);
    }
  } catch (error) {
    console.error('Erro ao alterar tipo:', error);
    alert('Erro ao conectar com o servidor');
  }
}

// ======================= FUNÇÕES DE GERENCIAMENTO =======================

async function adicionarUsuario() {
  const email = prompt("Digite o e-mail do novo usuário:");
  const senha = prompt("Digite a senha do novo usuário:");
  const nome = prompt("Digite o nome do novo usuário:");
  
  if (!email || !senha || !nome) {
    return alert("Todos os campos são obrigatórios.");
  }

  try {
    const baseUrl = window.location.origin;
    const res = await fetch(`${baseUrl}/users/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha, nome })
    });

    const data = await res.json();
    alert(data.message);
    
    if (res.ok) {
      carregarUsuarios();
    }
  } catch (error) {
    console.error('Erro ao adicionar usuário:', error);
    alert('Erro ao conectar com o servidor');
  }
}

async function atualizarUsuario() {
  const email = prompt("Digite o e-mail do usuário a ser atualizado:");
  if (!email) return;
  
  const novoEmail = prompt("Novo e-mail (ou deixe igual):", email);
  const novaSenha = prompt("Nova senha:");
  const novoNome = prompt("Novo nome:");
  
  if (!novaSenha || !novoNome) {
    return alert("Todos os campos são obrigatórios.");
  }

  try {
    const baseUrl = window.location.origin;
    const res = await fetch(`${baseUrl}/users/update`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email, 
        novoEmail: novoEmail || email, 
        novaSenha, 
        novoNome 
      })
    });

    const data = await res.json();
    alert(data.message);
    
    if (res.ok) {
      carregarUsuarios();
    }
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    alert('Erro ao conectar com o servidor');
  }
}

async function deletarUsuario() {
  const email = prompt("Digite o e-mail do usuário que deseja deletar:");
  if (!email) return;
  
  if (!confirm(`Tem certeza que deseja deletar o usuário "${email}"?`)) return;

  try {
    const baseUrl = window.location.origin;
    const res = await fetch(`${baseUrl}/users/${encodeURIComponent(email)}`, {
      method: 'DELETE'
    });

    const data = await res.json();
    alert(data.message);
    
    if (res.ok) {
      carregarUsuarios();
    }
  } catch (error) {
    console.error('Erro ao deletar usuário:', error);
    alert('Erro ao conectar com o servidor');
  }
}

// ======================= FUNÇÕES DE IMPORT/EXPORT =======================

async function importarCSV() {
  const input = document.getElementById("arquivo-csv");
  if (!input.files.length) {
    return alert("Selecione um arquivo CSV.");
  }
  
  const file = input.files[0];
  
  if (!file.name.endsWith('.csv')) {
    return alert("Por favor, selecione apenas arquivos CSV.");
  }

  const formData = new FormData();
  formData.append('arquivo', file);

  try {
    const baseUrl = window.location.origin;
    const res = await fetch(`${baseUrl}/users/import`, {
      method: 'POST',
      body: formData
    });

    const data = await res.json();
    
    if (res.ok) {
      alert(data.message);
      carregarUsuarios();
      // Limpar o input
      input.value = '';
    } else {
      alert(`Erro: ${data.message}`);
      console.error('Erro detalhado:', data);
    }
  } catch (error) {
    console.error('Erro na importação:', error);
    alert('Erro ao conectar com o servidor.');
  }
}

// Função corrigida para exportar CSV
function exportarCSV() {
  try {
    const baseUrl = window.location.origin;
    // Criar um link temporário para download
    const link = document.createElement('a');
    link.href = `${baseUrl}/users/export`;
    link.download = 'usuarios.csv';
    link.style.display = 'none';
    
    // Adicionar ao DOM, clicar e remover
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log('Download do CSV iniciado');
  } catch (error) {
    console.error('Erro ao exportar CSV:', error);
    alert('Erro ao exportar CSV');
  }
}

// Função alternativa para baixar CSV (manter compatibilidade)
function baixarCSV() {
  exportarCSV();
}

// ======================= INICIALIZAÇÃO =======================

window.addEventListener('DOMContentLoaded', function() {
  // Verificar se o usuário tem permissão
  const usuario = JSON.parse(localStorage.getItem('usuario'));
  if (!usuario || usuario.tipo !== 'gerente') {
    alert("Acesso negado. Apenas gerentes podem acessar.");
    window.location.href = "/LOGIN/login.html";
    return;
  }

  // Carregar usuários
  carregarUsuarios();
});

// Garantir que as funções estejam disponíveis globalmente
window.carregarUsuarios = carregarUsuarios;
window.alterarTipo = alterarTipo;
window.adicionarUsuario = adicionarUsuario;
window.atualizarUsuario = atualizarUsuario;
window.deletarUsuario = deletarUsuario;
window.importarCSV = importarCSV;
window.exportarCSV = exportarCSV;
window.baixarCSV = baixarCSV;