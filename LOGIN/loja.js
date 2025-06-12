document.getElementById('form-login').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const senha = document.getElementById('senha').value;

  try {
    const res = await fetch('http://localhost:3000/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha })
    });

    if (!res.ok) {
      alert("Email ou senha inválidos.");
      return;
    }

    const data = await res.json();
    // Salva dados no localStorage
    localStorage.setItem('usuario', JSON.stringify({
      email,
      nome: data.nome,
      tipo: data.tipo
    }));

    // Redireciona para a loja
    window.location.href = '../PROJETO-TESTE-2/loja/loja.html';
  } catch (error) {
    console.error("Erro no login:", error);
    alert("Erro ao conectar com o servidor.");
  }
});
