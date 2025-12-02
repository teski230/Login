const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
const PORT = 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Conexão com banco
const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'faleconosco'
});


// --------------------------------------------------------
// ✅ ROTA DE CADASTRO
// --------------------------------------------------------
app.post('/cadastro', async (req, res) => {

    const { nome, email, telefone, senha } = req.body;

    if (!nome || !email || !telefone || !senha) {
        return res.json({
            success: false,
            message: "Preencha todos os campos."
        });
    }

    try {
        const senhaHash = crypto
            .createHash("sha256")
            .update(senha)
            .digest("hex");

        const sql = `
            INSERT INTO cadastro (nome, email, telefone, senha)
            VALUES (?, ?, ?, ?)
        `;

        const [result] = await db.query(sql, [
            nome, email, telefone, senhaHash
        ]);

        return res.json({
            success: true,
            message: "Cadastro realizado com sucesso!",
            id: result.insertId
        });

    } catch (err) {
        console.log("❌ Erro no cadastro:", err);
        return res.json({
            success: false,
            message: "Erro ao salvar no banco."
        });
    }
});


// --------------------------------------------------------
// ✅ ROTA DE LOGIN
// --------------------------------------------------------
app.post('/login', async (req, res) => {

    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.json({
            success: false,
            message: "Preencha email e senha."
        });
    }

    try {
        const senhaHash = crypto
            .createHash("sha256")
            .update(senha)
            .digest("hex");

        const [results] = await db.query(
            `SELECT id, nome, email, telefone 
             FROM cadastro 
             WHERE email = ? AND senha = ?`,
            [email, senhaHash]
        );

        if (results.length > 0) {
            return res.json({
                success: true,
                message: "Login realizado com sucesso!",
                usuario: results[0]
            });
        }

        return res.json({
            success: false,
            message: "Email ou senha incorretos."
        });

    } catch (err) {
        console.log("❌ Erro no login:", err);
        return res.json({
            success: false,
            message: "Erro interno do servidor."
        });
    }
});


// --------------------------------------------------------
// ✅ ROTA PARA SALVAR CONTATO
// --------------------------------------------------------
app.post('/contato', async (req, res) => {
    const { nome, email, telefone, assunto, mensagem } = req.body;

    if (!nome || !email || !mensagem) {
        return res.json({
            success: false,
            message: "Preencha nome, email e mensagem"
        });
    }

    try {
        const sql = `
            INSERT INTO clientes (nome, email, telefone, assunto, mensagem)
            VALUES (?, ?, ?, ?, ?)
        `;

        const [result] = await db.query(sql, [
            nome, email, telefone, assunto, mensagem
        ]);

        res.json({
            success: true,
            message: "Mensagem enviada com sucesso!",
            id: result.insertId
        });

    } catch (err) {
        console.log("❌ Erro ao salvar contato:", err);
        res.json({
            success: false,
            message: "Erro ao salvar"
        });
    }
});


// --------------------------------------------------------
// ✅ ROTA PARA LISTAR CONTATOS
// --------------------------------------------------------
app.get('/contatos', async (req, res) => {
    try {
        const [results] = await db.query(
            `SELECT * FROM clientes ORDER BY data_criacao DESC`
        );

        res.json({ success: true, data: results });

    } catch (err) {
        res.json({
            success: false,
            message: "Erro ao buscar contatos"
        });
    }
});


// --------------------------------------------------------
// ✅ ROTA DE SAÚDE
// --------------------------------------------------------
app.get('/health', (req, res) => {
    res.json({ status: "Servidor rodando!", timestamp: new Date() });
});


// --------------------------------------------------------
// ROTA DE TESTE
// --------------------------------------------------------
app.get('/test', (req, res) => {
    res.json({ message: 'Servidor funcionando!' });
});


// --------------------------------------------------------
// INICIAR SERVIDOR
// --------------------------------------------------------
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📍 Teste: http://localhost:${PORT}/test`);
});
