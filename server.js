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

app.use(session({
  secret: 'sua_chave_secreta_aqui',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000,
    expires: false
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
    const extension = path.extname(file.originalname) || '.jpeg';
    let nomeFinal = `produto_${timestamp}${extension}`;

    if (req.body.nomeArquivo) {
      nomeFinal = req.body.nomeArquivo;
    }

    console.log('Nome do arquivo:', nomeFinal);

    const caminhoCompleto = path.join(__dirname, 'public', 'imgs', nomeFinal);

    if (fs.existsSync(caminhoCompleto)) {
      fs.unlinkSync(caminhoCompleto);
    }

    cb(null, nomeFinal);
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
    const header = data[0].split(',');
    products = data.slice(1).map(line => {
      const [id, name, price, img, quantity, features] = line.split(',');
      return {
        id: parseInt(id),
        name,
        price: parseFloat(price),
        img,
        quantity: parseInt(quantity),
        features: features ? features.split('|') : []
      };
    });
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
      Array.isArray(p.features) ? p.features.join(';') : ''
    ].join(','));
  }
  fs.writeFileSync(CSV_PRODUCTS, data.join('\n'));
}

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

// Função para corrigir caminho da imagem
function corrigirCaminhoImagem(img) {
  if (!img.startsWith('/public/')) {
    return '/public/imgs/' + img;
  }
  return img;
}

// Carrega os dados na inicialização
loadProducts();
loadUsers();
setupAutoSave();

// ======================= ROTAS API =======================

// Produtos
app.get('/products', (req, res) => res.json(products));

app.get('/products/:id', (req, res) => {
  const product = products.find(p => p.id === parseInt(req.params.id));
  product ? res.json(product) : res.status(404).json({ message: 'Produto não encontrado' });
});

app.post('/products', async (req, res) => {
  const { name, price, img, quantity, features, tempFileName } = req.body;
  if (!name || !img || price === undefined || quantity === undefined)
    return res.status(400).json({ message: 'Campos obrigatórios faltando.' });

  const newProduct = {
    id: nextId++,
    name,
    price: parseFloat(price),
    img: corrigirCaminhoImagem(img),
    quantity: parseInt(quantity),
    features: features || []
  };

  products.push(newProduct);

  if (tempFileName) {
    // Lógica para renomear arquivo temporário, se necessário
  }

  saveProducts();

  res.status(201).json(newProduct);
});

app.put('/products/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const index = products.findIndex(p => p.id === id);
  if (index === -1)
    return res.status(404).json({ message: 'Produto não encontrado.' });

  const { name, price, img, quantity, features, tempFileName } = req.body;

  let finalImg = img;
  if (tempFileName) {
    // Lógica para renomear arquivo temporário, se necessário
  }

  products[index] = { id, name, price, img: corrigirCaminhoImagem(finalImg), quantity, features };
  saveProducts();
  res.json(products[index]);
});

app.delete('/products/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = products.findIndex(p => p.id === id);
  if (index === -1)
    return res.status(404).json({ message: 'Produto não encontrado.' });

  products.splice(index, 1);
  saveProducts();
  res.status(204).send();
});

// UPLOAD DE IMAGENS
app.post('/upload-image', upload.single('imagem'), (req, res) => {
  try {
    res.json({ file: req.file.filename });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao fazer upload.' });
  }
});

// NOVA ROTA PARA RENOMEAR IMAGEM
app.post('/rename-image', (req, res) => {
  try {
    // Lógica para renomear imagem
    res.json({ message: 'Imagem renomeada.' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao renomear imagem.' });
  }
});

// Autenticação
app.post("/login", (req, res) => {
  const { email, senha } = req.body;
  const user = users.find(u => u.email === email && u.senha === senha);
  if (!user)
    return res.status(401).json({ message: 'Usuário ou senha inválidos.' });

  req.session.user = { nome: user.nome, tipo: user.tipo };
  res.json({ nome: user.nome, tipo: user.tipo });
});

app.get("/check-session", (req, res) => {
  if (req.session && req.session.user) {
    res.json({ logado: true, user: req.session.user });
  } else {
    res.json({ logado: false });
  }
});

app.post("/logout", (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ message: 'Erro ao sair.' });
    res.json({ message: 'Logout realizado com sucesso.' });
  });
});

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
  const { email, novoEmail, novaSenha, novoNome } = req.body;
  const user = users.find(u => u.email === email);
  if (!user) return res.status(404).json({ message: 'Usuário não encontrado.' });

  user.email = novoEmail;
  user.senha = novaSenha;
  user.nome = novoNome;
  saveUsers();
  res.json({ message: 'Usuário atualizado com sucesso.' });
});

app.post('/users/import', uploadUsers.single('arquivo'), (req, res) => {
  const filePath = req.file.path;
  const data = fs.readFileSync(filePath, 'utf8').split('\n').filter(Boolean);
  const header = data[0].split(',');
  if (header[0] !== 'email' || header[1] !== 'senha') return res.status(400).json({ message: 'CSV inválido.' });

  users = data.slice(1).map(line => {
    const [email, senha, nome, tipo] = line.split(',');
    return { email, senha, nome, tipo };
  });

  saveUsers();
  fs.unlinkSync(filePath);
  res.json({ message: 'CSV importado com sucesso.' });
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

// ====================== FUNÇÃO PARA LIMPAR ARQUIVOS TEMPORÁRIOS ============================
function limparArquivosTemporarios() {
  const imgDir = path.join(__dirname, 'public', 'imgs');

  if (!fs.existsSync(imgDir)) return;

  const files = fs.readdirSync(imgDir);
  const agora = Date.now();
  const umDiaEmMs = 24 * 60 * 60 * 1000;

  files.forEach(file => {
    const filePath = path.join(imgDir, file);
    const stats = fs.statSync(filePath);

    if (agora - stats.mtime.getTime() > umDiaEmMs && file.startsWith('produto_')) {
      try {
        fs.unlinkSync(filePath);
      } catch (error) {
        console.error('Erro ao remover arquivo temporário:', error);
      }
    }
  });
}

setInterval(limparArquivosTemporarios, 60 * 60 * 1000);

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