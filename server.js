const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// ✅ Middlewares para JSON e formulário
app.use(cors());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

const CSV_PRODUCTS = 'products.csv';
const CSV_USERS = 'users.csv';
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

// ====================== admp ============================




// Criar novo usuário
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

// Atualizar usuário
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

// Importar CSV
app.post('/users/import', upload.single('arquivo'), (req, res) => {
    const filePath = req.file.path;
    const data = fs.readFileSync(filePath, 'utf8').split('\n').filter(Boolean);
    const header = data[0].split(',');
    if (header[0] !== 'email' || header[1] !== 'senha') return res.status(400).json({ message: 'CSV inválido.' });

    users = data.slice(1).map(line => {
        const [email, senha, nome, tipo] = line.split(',');
        return { email, senha, nome, tipo };
    });

    saveUsers();
    fs.unlinkSync(filePath); // limpa o arquivo temporário
    res.json({ message: 'CSV importado com sucesso.' });
});

// Exportar CSV
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


// ===================== admp =============================






let products = [];
let users = [];
let nextId = 1;

// ======================= PRODUTOS =======================

function loadProducts() {
    if (fs.existsSync(CSV_PRODUCTS)) {
        const data = fs.readFileSync(CSV_PRODUCTS, 'utf8').split('\n').filter(Boolean);
        const headers = data[0].split(',');
        products = data.slice(1).map(l => {
            const [id, name, price, img, quantity, features] = l.split(',');
            return {
                id: parseInt(id),
                name,
                price: parseFloat(price),
                img,
                quantity: parseInt(quantity),
                features: features ? features.split('|') : []
            };
        });
        nextId = Math.max(...products.map(p => p.id)) + 1;
    } else {
        fs.writeFileSync(CSV_PRODUCTS, 'id,name,price,img,quantity,features\n');
    }
}

function saveProducts() {
    const data = ['id,name,price,img,quantity,features'];
    for (const p of products) {
        data.push(`${p.id},${p.name},${p.price},${p.img},${p.quantity},${p.features.join('|')}`);
    }
    fs.writeFileSync(CSV_PRODUCTS, data.join('\n'));
}

function setupAutoSave() {
    setInterval(() => saveProducts(), 60000);
}

loadProducts();
setupAutoSave();

// ======================= USUÁRIOS =======================

function loadUsers() {
    if (fs.existsSync(CSV_USERS)) {
        const data = fs.readFileSync(CSV_USERS, 'utf8').split('\n').filter(Boolean);
        users = data.slice(1).map(line => {
            const [email, senha, nome, tipo] = line.split(',');
            return { email, senha, nome, tipo };
        });
    } else {
        fs.writeFileSync(CSV_USERS, 'email,senha,nome,tipo\nadmin@loja.com,admin123,Administrador,gerente\n');
        loadUsers();
    }
}

function saveUsers() {
    const data = ['email,senha,nome,tipo'];
    for (const u of users) {
        data.push(`${u.email},${u.senha},${u.nome},${u.tipo}`);
    }
    fs.writeFileSync(CSV_USERS, data.join('\n'));
}

loadUsers();

// ======================= ROTAS =======================

// Produtos
app.get('/products', (req, res) => res.json(products));

app.get('/products/:id', (req, res) => {
    const product = products.find(p => p.id === parseInt(req.params.id));
    product ? res.json(product) : res.status(404).json({ message: 'Produto não encontrado' });
});

app.post('/products', (req, res) => {
    const { name, price, img, quantity, features } = req.body;
    if (!name || !img || price === undefined || quantity === undefined)
        return res.status(400).json({ message: 'Campos obrigatórios faltando.' });

    const newProduct = {
        id: nextId++,
        name,
        price: parseFloat(price),
        img,
        quantity: parseInt(quantity),
        features: features || []
    };

    products.push(newProduct);
    res.status(201).json(newProduct);
});

app.put('/products/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = products.findIndex(p => p.id === id);
    if (index === -1) return res.status(404).json({ message: 'Produto não encontrado' });

    const { name, price, img, quantity, features } = req.body;
    products[index] = { id, name, price, img, quantity, features };
    res.json(products[index]);
});

app.delete('/products/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = products.findIndex(p => p.id === id);
    if (index === -1) return res.status(404).json({ message: 'Produto não encontrado' });

    products.splice(index, 1);
    res.status(204).send();
});

// Autenticação
app.post('/login', (req, res) => {
    const { email, senha } = req.body;
    const user = users.find(u => u.email === email && u.senha === senha);
    if (!user) return res.status(401).json({ message: 'Credenciais inválidas' });

    res.json({ nome: user.nome, tipo: user.tipo });
});

app.post('/register', (req, res) => {
    const { email, senha, nome } = req.body;
    if (!email || !senha || !nome) return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
    if (users.find(u => u.email === email)) return res.status(409).json({ message: 'Usuário já existe.' });

    const novo = { email, senha, nome, tipo: 'cliente' };
    users.push(novo);
    saveUsers();
    res.status(201).json({ message: 'Usuário cadastrado com sucesso.' });
});

app.get('/users', (req, res) => res.json(users));

app.put('/users/:email', (req, res) => {
    const { email } = req.params;
    const { tipo } = req.body;
    const index = users.findIndex(u => u.email === email);
    if (index === -1) return res.status(404).json({ message: 'Usuário não encontrado' });

    users[index].tipo = tipo;
    saveUsers();
    res.json(users[index]);
});

app.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));

process.on('SIGINT', () => {
    saveProducts();
    saveUsers();
    process.exit();
});
