document.getElementById('form-cadastro' ).addEventListener('submit', async (e) => {
  e.preventDefault();

  const nome = document.getElementById('nome').value;
  const email = document.getElementById('email').value;
  const senha = document.getElementById('senha').value;
  const confirmar = document.getElementById('confirmar').value;

  if (senha !== confirmar) {
    alert("As senhas não coincidem.");
    return;
  }

  try {
    // Adicionado: Obtém a base URL dinamicamente
    const baseUrl = window.location.origin;

    const res = await fetch(`${baseUrl}/register`, { // Modificado para usar baseUrl
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, email, senha })
    });

    const data = await res.json();

    if (res.status === 201) {
      alert("Cadastro realizado com sucesso!");
      // Auto login
      localStorage.setItem('usuario', JSON.stringify({
        email,
        nome,
        tipo: 'cliente'
      }));
      window.location.href = '/PROJETO-2/loja/loja.html';
    } else {
      alert(data.message || "Erro ao cadastrar.");
    }
  } catch (error) {
    console.error("Erro no cadastro:", error);
    alert("Erro de conexão com o servidor.");
  }
});
