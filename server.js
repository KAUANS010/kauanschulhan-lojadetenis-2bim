const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const session = require('express-session');

const app = express();
// ✅ PORTA FLEXÍVEL - Aceita 5500 ou 3000
const PORT = process.env.PORT || 3000;

// ✅ CORS configurado para aceitar ambas as portas
const allowedOrigins = [
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

// ======================= CONFIGURAÇÃO DE SESSÃO ATUALIZADA =======================

app.use(session({
  secret: 'sua_chave_secreta_aqui',
  resave: false,
  saveUninitialized: false,
  cookie: {
    // ✅ MUDANÇA PRINCIPAL: Remove maxAge e expires
    // Isso faz com que seja uma "session cookie" que expira ao fechar o navegador
    httpOnly: true,        // Protege contra XSS
    secure: false,         // false para desenvolvimento (HTTP), true para produção (HTTPS)
    sameSite: 'lax'        // Proteção CSRF
  },
  // ✅ OPCIONAL: Força nova sessão a cada restart do servidor
  genid: function(req) {
    return require('crypto').randomBytes(16).toString('hex');
  }
}));
const CSV_PRODUCTS = 'products.csv';
const CSV_USERS = 'users.csv';

// Configuração do Multer para upload de imagens
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, 'public', 'imgs');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const extension = path.extname(file.originalname) || '.jpg';

    // Se vier com ID específico no body, usar o ID
    if (req.body.produtoId) {
      const nomeComId = `${req.body.produtoId}${extension}`;
      cb(null, nomeComId);
    } else {
      // Caso contrário, usar timestamp (para arquivos temporários)
      const nomeTemporario = `temp_${timestamp}${extension}`;
      cb(null, nomeTemporario);
    }
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos de imagem são permitidos!'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

const uploadUsers = multer({ dest: 'uploads/' });

// ====================== VARIÁVEIS =============================
let products = [];
let users = [];
let nextId = 1;

// ======================= PRODUTOS =======================
function loadProducts() {
  if (fs.existsSync(CSV_PRODUCTS)) {
    const data = fs.readFileSync(CSV_PRODUCTS, 'utf8').split('\n').filter(Boolean);
    // Pula o cabeçalho
    products = data.slice(1).map(line => {
      // Usar regex para splitar apenas a primeira ocorrência de vírgula para os primeiros 5 campos
      const parts = line.match(/^([^,]+),([^,]+),([^,]+),([^,]+),([^,]+),(.*)$/);
      if (!parts) {
        console.warn('Linha CSV mal formatada, pulando:', line);
        return null;
      }
      const [, id, name, price, img, quantity, featuresString] = parts;

      // ✅ SEMPRE usar "|" como separador
      let features = [];
      if (featuresString) {
        // Converte tanto ";" quanto "|" para "|" (compatibilidade com dados antigos)
        const normalizedFeatures = featuresString.replace(/;/g, '|');
        features = normalizedFeatures.split('|').map(f => f.trim()).filter(f => f);
      }

      return {
        id: parseInt(id),
        name,
        price: parseFloat(price),
        img,
        quantity: parseInt(quantity),
        features
      };
    }).filter(Boolean); // Remove quaisquer linhas nulas de formatação incorreta

    if (products.length > 0) {
      nextId = Math.max(...products.map(p => p.id)) + 1;
    }
  } else {
    products = [];
    nextId = 1;
  }
}

function saveProducts() {
  const data = ['id,name,price,img,quantity,features'];
  for (const p of products) {
    data.push([
      p.id,
      p.name,
      p.price,
      p.img,
      p.quantity,
      // ✅ SEMPRE usar "|" como separador
      Array.isArray(p.features) ? p.features.join('|') : ''
    ].join(','));
  }
  fs.writeFileSync(CSV_PRODUCTS, data.join('\n'));
}

// ======================= FUNÇÕES DE VALIDAÇÃO =======================
function validarNomeProdutoUnico(nome, idExcluir = null) {
  // Normaliza o nome para comparação (remove espaços extras e converte para minúsculas)
  const nomeNormalizado = nome.trim().toLowerCase();

  return !products.some(produto => {
    const produtoNomeNormalizado = produto.name.trim().toLowerCase();
    return produtoNomeNormalizado === nomeNormalizado && produto.id !== idExcluir;
  });
}

function validarIdUnico(id) {
  return !products.some(produto => produto.id === id);
}

// Função para corrigir caminho da imagem
function corrigirCaminhoImagem(img) {
  if (!img.startsWith('/public/')) {
    return '/public/imgs/' + img;
  }
  return img;
}

// ======================= ROTAS API =======================

// Produtos
app.get('/products', (req, res) => res.json(products));

app.get('/products/:id', (req, res) => {
  const product = products.find(p => p.id === parseInt(req.params.id));
  product ? res.json(product) : res.status(404).json({ message: 'Produto não encontrado' });
});

app.post('/products', async (req, res) => {
  const { name, price, img, quantity, features, tempFileName } = req.body;

  // Validações básicas
  if (!name || !img || price === undefined || quantity === undefined) {
    return res.status(400).json({ message: 'Campos obrigatórios faltando.' });
  }

  // Validar nome único
  if (!validarNomeProdutoUnico(name)) {
    return res.status(409).json({
      message: 'Já existe um produto com este nome. Por favor, escolha outro nome.'
    });
  }

  // Validar preço
  const precoNumerico = parseFloat(price);
  if (isNaN(precoNumerico) || precoNumerico <= 0) {
    return res.status(400).json({ message: 'Preço deve ser um número positivo.' });
  }

  // Validar quantidade
  const quantidadeNumerica = parseInt(quantity);
  if (isNaN(quantidadeNumerica) || quantidadeNumerica < 0) {
    return res.status(400).json({ message: 'Quantidade deve ser um número não negativo.' });
  }

  // Criar produto com ID
  const newProduct = {
    id: nextId,
    name: name.trim(),
    price: precoNumerico,
    img: '', // Será preenchido depois
    quantity: quantidadeNumerica,
    features: features || []
  };

  // Se há arquivo temporário, renomear para usar o ID
  let finalImg = img;
  if (tempFileName) {
    const novoNome = renomearArquivoParaId(tempFileName, nextId);
    if (novoNome) {
      finalImg = `/public/imgs/${novoNome}`;
    }
  }

  // Atualizar imagem no produto
  newProduct.img = finalImg;

  // Adicionar produto e incrementar ID
  products.push(newProduct);
  nextId++;

  saveProducts();

  res.status(201).json(newProduct);
});

app.put('/products/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const index = products.findIndex(p => p.id === id);

  if (index === -1) {
    return res.status(404).json({ message: 'Produto não encontrado.' });
  }

  const { name, price, img, quantity, features, tempFileName } = req.body;

  // Validações básicas
  if (!name || !img || price === undefined || quantity === undefined) {
    return res.status(400).json({ message: 'Campos obrigatórios faltando.' });
  }

  // Validar nome único (excluindo o produto atual)
  if (!validarNomeProdutoUnico(name, id)) {
    return res.status(409).json({
      message: 'Já existe outro produto com este nome. Por favor, escolha outro nome.'
    });
  }

  // Validar preço
  const precoNumerico = parseFloat(price);
  if (isNaN(precoNumerico) || precoNumerico <= 0) {
    return res.status(400).json({ message: 'Preço deve ser um número positivo.' });
  }

  // Validar quantidade
  const quantidadeNumerica = parseInt(quantity);
  if (isNaN(quantidadeNumerica) || quantidadeNumerica < 0) {
    return res.status(400).json({ message: 'Quantidade deve ser um número não negativo.' });
  }

  let finalImg = img;
  if (tempFileName) {
    const novoNome = renomearArquivoParaId(tempFileName, id);
    if (novoNome) {
      finalImg = `/public/imgs/${novoNome}`;
    }
  }

  products[index] = {
    id,
    name: name.trim(),
    price: precoNumerico,
    img: corrigirCaminhoImagem(finalImg),
    quantity: quantidadeNumerica,
    features
  };

  saveProducts();
  res.json(products[index]);
});

app.delete('/products/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = products.findIndex(p => p.id === id);

  if (index === -1) {
    return res.status(404).json({
      message: 'Produto não encontrado.',
      success: false
    });
  }

  const produtoRemovido = products[index];
  products.splice(index, 1);
  saveProducts();

  res.json({
    message: `Produto "${produtoRemovido.name}" deletado com sucesso!`,
    success: true
  });
});

function setupAutoSave() {
  setInterval(() => saveProducts(), 600000);
}

// ======================= USUÁRIOS =======================
function loadUsers() {
  if (fs.existsSync(CSV_USERS)) {
    const data = fs.readFileSync(CSV_USERS, 'utf8').split('\n').filter(Boolean);
    const header = data[0].split(',');
    users = data.slice(1).map(line => {
      const [email, senha, nome, tipo] = line.split(',');
      return { email, senha, nome, tipo };
    });
  } else {
    users = [];
  }
}

function saveUsers() {
  const data = ['email,senha,nome,tipo'];
  for (const u of users) {
    data.push([u.email, u.senha, u.nome, u.tipo].join(','));
  }
  fs.writeFileSync(CSV_USERS, data.join('\n'));
}

// Carrega os dados na inicialização
loadProducts();
loadUsers();
setupAutoSave();

// UPLOAD DE IMAGENS
app.post('/upload-image-with-id', upload.single('imagem'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Nenhum arquivo enviado.' });
    }

    const { produtoId } = req.body;

    if (!produtoId) {
      return res.status(400).json({ message: 'ID do produto é obrigatório.' });
    }

    // Retorna o nome do arquivo com ID
    res.json({
      file: req.file.filename,
      path: `/public/imgs/${req.file.filename}`,
      message: 'Upload realizado com sucesso!'
    });
  } catch (error) {
    console.error('Erro no upload:', error);
    res.status(500).json({ message: 'Erro ao fazer upload.' });
  }
});

// ROTA PARA UPLOAD DE IMAGEM TEMPORÁRIA (SEM ID)
app.post('/upload-image', upload.single('imagem'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Nenhum arquivo enviado.' });
    }

    // Para upload sem ID, criar nome temporário
    const timestamp = Date.now();
    const extension = path.extname(req.file.originalname) || '.jpg';
    const nomeTemporario = `temp_${timestamp}${extension}`;

    // Caminho atual do arquivo
    const caminhoAtual = req.file.path;
    const caminhoNovo = path.join(path.dirname(caminhoAtual), nomeTemporario);

    // Renomear o arquivo para nome temporário
    fs.renameSync(caminhoAtual, caminhoNovo);

    // Retorna o nome do arquivo temporário
    res.json({
      file: nomeTemporario,
      path: `/public/imgs/${nomeTemporario}`,
      message: 'Upload temporário realizado com sucesso!'
    });
  } catch (error) {
    console.error('Erro no upload temporário:', error);
    res.status(500).json({ message: 'Erro ao fazer upload temporário.' });
  }
});

// 3. FUNÇÃO PARA RENOMEAR ARQUIVO TEMPORÁRIO PARA ID
function renomearArquivoParaId(nomeTemporario, novoId) {
  const imgDir = path.join(__dirname, 'public', 'imgs');
  const caminhoAntigo = path.join(imgDir, nomeTemporario);

  if (!fs.existsSync(caminhoAntigo)) {
    console.error('Arquivo temporário não encontrado:', caminhoAntigo);
    return null;
  }

  // Extrair extensão do arquivo temporário
  const extensao = path.extname(nomeTemporario);
  const novoNome = `${novoId}${extensao}`;
  const caminhoNovo = path.join(imgDir, novoNome);

  try {
    // Remove arquivo com mesmo ID se existir
    if (fs.existsSync(caminhoNovo)) {
      fs.unlinkSync(caminhoNovo);
    }

    // Renomeia arquivo temporário
    fs.renameSync(caminhoAntigo, caminhoNovo);

    return novoNome;
  } catch (error) {
    console.error('Erro ao renomear arquivo:', error);
    return null;
  }
}

// NOVA ROTA PARA RENOMEAR IMAGEM
app.post('/rename-image', (req, res) => {
  try {
    // Lógica para renomear imagem
    res.json({ message: 'Imagem renomeada.' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao renomear imagem.' });
  }
});

// ======================= ROTAS DE AUTENTICAÇÃO ATUALIZADAS =======================

app.post("/login", (req, res) => {
  const { email, senha } = req.body;
  const user = users.find(u => u.email === email && u.senha === senha);
  
  if (!user) {
    return res.status(401).json({ message: 'Usuário ou senha inválidos.' });
  }

  // ✅ LIMPA QUALQUER SESSÃO ANTERIOR
  req.session.regenerate((err) => {
    if (err) {
      console.error('Erro ao regenerar sessão:', err);
      return res.status(500).json({ message: 'Erro interno do servidor.' });
    }

    // Define os dados da sessão
    req.session.user = { 
      nome: user.nome, 
      tipo: user.tipo,
      email: user.email,
      loginTime: new Date().toISOString() // Para debug
    };

    // ✅ FORÇA SALVAMENTO DA SESSÃO
    req.session.save((err) => {
      if (err) {
        console.error('Erro ao salvar sessão:', err);
        return res.status(500).json({ message: 'Erro ao salvar sessão.' });
      }

      console.log(`✅ Login realizado: ${user.email} - Sessão ID: ${req.sessionID}`);
      res.json({ nome: user.nome, tipo: user.tipo });
    });
  });
});

app.get("/check-session", (req, res) => {
  // ✅ VERIFICAÇÃO MAIS ROBUSTA
  if (req.session && req.session.user) {
    console.log(`✅ Sessão válida: ${req.session.user.email} - ID: ${req.sessionID}`);
    res.json({ 
      logado: true, 
      user: req.session.user,
      sessionId: req.sessionID // Para debug
    });
  } else {
    console.log(`❌ Sessão inválida - ID: ${req.sessionID || 'undefined'}`);
    res.json({ logado: false });
  }
});

app.post("/logout", (req, res) => {
  const userEmail = req.session?.user?.email || 'desconhecido';
  
  req.session.destroy((err) => {
    if (err) {
      console.error('Erro ao destruir sessão:', err);
      return res.status(500).json({ message: 'Erro ao sair.' });
    }

    // ✅ LIMPA O COOKIE DE SESSÃO
    res.clearCookie('connect.sid'); // Nome padrão do cookie de sessão
    
    console.log(`✅ Logout realizado: ${userEmail}`);
    res.json({ message: 'Logout realizado com sucesso.' });
  });
});

// ======================= MIDDLEWARE DE VERIFICAÇÃO DE SESSÃO =======================

function verificarSessao(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ message: 'Acesso negado. Faça login primeiro.' });
  }
  next();
}

// ✅ EXEMPLO DE USO DO MIDDLEWARE (adicione às rotas que precisam de autenticação)
// app.get('/admin/usuarios', verificarSessao, (req, res) => {
//   res.json(users);
// });


// ======================= LIMPEZA DE SESSÕES ÓRFÃS =======================

setInterval(() => {
  // Esta função roda automaticamente com express-session
  // Mas você pode adicionar logs para debug
  console.log('🧹 Limpeza automática de sessões executada');
}, 300000); // A cada 1 minuto


app.post("/register", (req, res) => {
  const { email, senha, nome } = req.body;
  if (!email || !senha || !nome)
    return res.status(400).json({ message: 'Campos obrigatórios.' });
  if (users.find(u => u.email === email))
    return res.status(409).json({ message: 'Usuário já existe.' });

  const novo = { email, senha, nome, tipo: 'cliente' };
  users.push(novo);
  saveUsers();
  res.status(201).json({ message: 'Usuário cadastrado com sucesso.' });
});

// ADMIN
app.post('/users/create', (req, res) => {
  const { email, senha, nome } = req.body;
  if (!email || !senha || !nome) return res.status(400).json({ message: 'Campos obrigatórios.' });

  if (users.find(u => u.email === email)) {
    return res.status(409).json({ message: 'Usuário já existe.' });
  }

  const novo = { email, senha, nome, tipo: 'cliente' };
  users.push(novo);
  saveUsers();
  res.status(201).json({ message: 'Usuário criado com sucesso.' });
});

app.put('/users/update', (req, res) => {
  const { email, novoEmail, novaSenha, novoNome, novoTipo } = req.body;
  const user = users.find(u => u.email === email);
  if (!user) return res.status(404).json({ message: 'Usuário não encontrado.' });

  // Atualiza os dados do usuário
  user.email = novoEmail || user.email;
  user.senha = novaSenha || user.senha;
  user.nome = novoNome || user.nome;
  user.tipo = novoTipo || user.tipo; // Adiciona suporte para alterar o tipo

  saveUsers();
  res.json({ message: 'Usuário atualizado com sucesso.' });
});

app.post('/users/import', uploadUsers.single('arquivo'), (req, res) => {
  try {
    // Verificar se o arquivo foi enviado
    if (!req.file) {
      return res.status(400).json({ message: 'Nenhum arquivo foi enviado.' });
    }

    const filePath = req.file.path;

    // Verificar se o arquivo existe
    if (!fs.existsSync(filePath)) {
      return res.status(400).json({ message: 'Arquivo não encontrado.' });
    }

    // Ler o arquivo CSV
    const data = fs.readFileSync(filePath, 'utf8').split('\n').filter(Boolean);

    // Verificar se o arquivo não está vazio
    if (data.length === 0) {
      fs.unlinkSync(filePath); // Limpar arquivo temporário
      return res.status(400).json({ message: 'Arquivo CSV está vazio.' });
    }

    // Verificar o cabeçalho do CSV
    const header = data[0].split(',');
    if (header.length < 4 || header[0] !== 'email' || header[1] !== 'senha' || header[2] !== 'nome' || header[3] !== 'tipo') {
      fs.unlinkSync(filePath); // Limpar arquivo temporário
      return res.status(400).json({
        message: 'CSV inválido. O cabeçalho deve ser: email,senha,nome,tipo'
      });
    }

    // Processar as linhas do CSV
    const novosUsuarios = [];
    for (let i = 1; i < data.length; i++) {
      const linha = data[i].trim();
      if (!linha) continue; // Pular linhas vazias

      const [email, senha, nome, tipo] = linha.split(',');

      // Validar campos obrigatórios
      if (!email || !senha || !nome || !tipo) {
        fs.unlinkSync(filePath);
        return res.status(400).json({
          message: `Erro na linha ${i + 1}: Todos os campos são obrigatórios (email,senha,nome,tipo)`
        });
      }

      // Verificar se o usuário já existe
      const usuarioExistente = users.find(u => u.email === email);
      if (usuarioExistente) {
        console.log(`Usuário ${email} já existe, será atualizado.`);
        // Atualizar usuário existente
        usuarioExistente.senha = senha;
        usuarioExistente.nome = nome;
        usuarioExistente.tipo = tipo;
      } else {
        // Adicionar novo usuário
        novosUsuarios.push({ email, senha, nome, tipo });
      }
    }

    // Adicionar novos usuários à lista
    users.push(...novosUsuarios);

    // Salvar no arquivo CSV
    saveUsers();

    // Limpar arquivo temporário
    fs.unlinkSync(filePath);

    res.json({
      message: `CSV importado com sucesso! ${novosUsuarios.length} usuários adicionados.`
    });

  } catch (error) {
    console.error('Erro ao importar CSV:', error);

    // Limpar arquivo temporário em caso de erro
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Erro ao limpar arquivo temporário:', unlinkError);
      }
    }

    res.status(500).json({
      message: 'Erro interno do servidor ao processar o arquivo CSV.'
    });
  }
});

app.get('/users/export', (req, res) => {
  res.download(path.resolve(CSV_USERS));
});

app.delete('/users/:email', (req, res) => {
  const { email } = req.params;
  const index = users.findIndex(u => u.email === email);
  if (index === -1) return res.status(404).json({ message: 'Usuário não encontrado.' });

  users.splice(index, 1);
  saveUsers();
  res.json({ message: 'Usuário deletado com sucesso.' });
});

app.get('/users', (req, res) => res.json(users));

function limparArquivosTemporarios() {
  const imgDir = path.join(__dirname, 'public', 'imgs');

  if (!fs.existsSync(imgDir)) return;

  const files = fs.readdirSync(imgDir);
  const agora = Date.now();
  const umaHoraEmMs = 60 * 60 * 1000; // 1 hora em vez de 1 dia

  files.forEach(file => {
    const filePath = path.join(imgDir, file);
    const stats = fs.statSync(filePath);

    // Limpar apenas arquivos temporários antigos
    if (agora - stats.mtime.getTime() > umaHoraEmMs && file.startsWith('temp_')) {
      try {
        fs.unlinkSync(filePath);
        console.log(`Arquivo temporário removido: ${file}`);
      } catch (error) {
        console.error('Erro ao remover arquivo temporário:', error);
      }
    }
  });
}

// Executar limpeza a cada 30 minutos
setInterval(limparArquivosTemporarios, 30 * 60 * 1000);

limparArquivosTemporarios();

// ======================= SERVIR ARQUIVOS ESTÁTICOS E ROTAS HTML =======================

// Servir arquivos estáticos das pastas necessárias
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/PROJETO-2/loja', express.static(path.join(__dirname, 'PROJETO-2', 'loja')));
app.use('/PROJETO-2/carrinho', express.static(path.join(__dirname, 'PROJETO-2', 'carrinho')));
app.use('/PROJETO-2/pagamento', express.static(path.join(__dirname, 'PROJETO-2', 'pagamento')));
app.use('/LOGIN', express.static(path.join(__dirname, 'LOGIN')));
app.use('/cadastro', express.static(path.join(__dirname, 'cadastro')));

// Rota principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'PROJETO-2', 'loja', 'loja.html'));
});

// Rota coringa para SPA (deixe por último!)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'PROJETO-2', 'loja', 'loja.html'));
});

// ✅ INICIAR SERVIDOR COM PORTA FLEXÍVEL
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`📱 Acesse a loja em: http://localhost:${PORT}`);
  console.log(`🔧 Porta configurada: ${PORT}`);
});

process.on('SIGINT', () => {
  saveProducts();
  saveUsers();
  process.exit();
});