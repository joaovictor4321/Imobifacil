const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const db = require('./db');

const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));

app.use((req, res, next) => {
    res.locals.usuario = req.session.usuario;
    res.locals.mensagem = req.session.mensagem;
    req.session.mensagem = null;
    next();
});

function verificarLogin(req, res, next) {
    if (req.session.usuario) {
        next();
    } else {
        req.session.mensagem = 'Faça login para continuar.';
        res.redirect('/formulario');
    }
}

app.get('/', async (req, res) => {
    let sql = 'select imovel.*, usuarioNome, usuarioTelefone, usuarioEmail from imovel join usuario on usuarioID = imovelUsuarioIDFK';
    let valores = [];

    if (req.query.finalidade) {
        sql = sql + ' where imovelFinalidade = ?';
        valores.push(req.query.finalidade);
    }

    sql = sql + ' order by imovelID desc';

    try {
        const [imoveis] = await db.query(sql, valores);

        for (let i = 0; i < imoveis.length; i++) {
            const [comodidades] = await db.query('select comodidadeNome from comodidade join imovelComodidade on comodidadeID = imovelComodidadeComodidadeIDFK where imovelComodidadeImovelIDFK = ?', [imoveis[i].imovelID]);
            imoveis[i].comodidades = comodidades;
        }

        res.render('home', { imoveis: imoveis, finalidade: req.query.finalidade });
    } catch (error) {
        console.log('Erro ao buscar imóveis', error);
        res.status(500).send('Erro ao carregar os imóveis.');
    }
});

app.post('/registro', async (req, res) => {
    const { usuarioNome, usuarioEmail, usuarioTelefone, usuarioSenha } = req.body;

    if (!usuarioNome || !usuarioEmail || !usuarioTelefone || !usuarioSenha) {
        req.session.mensagem = 'Preencha todos os campos.';
        return res.redirect('/formulario');
    }

    if (usuarioSenha.length < 6) {
        req.session.mensagem = 'A senha precisa ter pelo menos 6 caracteres.';
        return res.redirect('/formulario');
    }

    try {
        const [existe] = await db.query('select * from usuario where usuarioEmail = ?', [usuarioEmail]);

        if (existe.length > 0) {
            req.session.mensagem = 'Esse e-mail já está cadastrado.';
            return res.redirect('/formulario');
        }

        const senhaHash = await bcrypt.hash(usuarioSenha, 10);

        await db.query('insert into usuario (usuarioNome, usuarioEmail, usuarioTelefone, usuarioSenha) values (?, ?, ?, ?)', [usuarioNome, usuarioEmail, usuarioTelefone, senhaHash]);

        req.session.mensagem = 'Conta criada! Agora faça o login.';
        res.redirect('/formulario');
    } catch (error) {
        console.log('Erro no cadastro', error);
        res.status(500).send('Erro ao criar a conta.');
    }
});

app.post('/login', async (req, res) => {
    const { usuarioEmail, usuarioSenha } = req.body;

    try {
        const [usuarios] = await db.query('select * from usuario where usuarioEmail = ?', [usuarioEmail]);

        if (usuarios.length == 0) {
            req.session.mensagem = 'E-mail ou senha incorretos.';
            return res.redirect('/formulario');
        }

        const senhaCerta = await bcrypt.compare(usuarioSenha, usuarios[0].usuarioSenha);

        if (!senhaCerta) {
            req.session.mensagem = 'E-mail ou senha incorretos.';
            return res.redirect('/formulario');
        }

        req.session.usuario = {
            id: usuarios[0].usuarioID,
            nome: usuarios[0].usuarioNome
        };

        res.redirect('/formulario');
    } catch (error) {
        console.log('Erro no login', error);
        res.status(500).send('Erro ao fazer login.');
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
});

app.get('/formulario', async (req, res) => {
    if (!req.session.usuario) {
        return res.render('formulario');
    }

    try {
        const [imoveis] = await db.query('select * from imovel join proprietario on proprietarioID = imovelProprietarioIDFK where imovelUsuarioIDFK = ? order by imovelID desc', [req.session.usuario.id]);
        const [comodidades] = await db.query('select * from comodidade');

        res.render('formulario', { imoveis: imoveis, comodidades: comodidades, imovel: {}, marcadas: [] });
    } catch (error) {
        console.log('Erro ao abrir o painel', error);
        res.status(500).send('Erro ao abrir o painel.');
    }
});

app.post('/cadastrar', verificarLogin, async (req, res) => {
    const { imovelTitulo, imovelDescricao, imovelTipo, imovelFinalidade, imovelPreco, imovelArea, imovelQuartos, imovelBanheiros, imovelVagas, imovelEndereco, imovelBairro, imovelImagemUrl, proprietarioNome, proprietarioCpf, proprietarioTelefone } = req.body;

    let comodidades = req.body.comodidades || [];
    if (typeof comodidades == 'string') {
        comodidades = [comodidades];
    }

    if (!imovelTitulo || !imovelTipo || !imovelFinalidade || !imovelPreco || !imovelArea || !imovelEndereco || !imovelBairro || !proprietarioNome || !proprietarioCpf || !proprietarioTelefone) {
        req.session.mensagem = 'Preencha todos os campos obrigatórios.';
        return res.redirect('/formulario');
    }

    if (imovelPreco <= 0 || imovelArea <= 0) {
        req.session.mensagem = 'O preço e a área precisam ser maiores que zero.';
        return res.redirect('/formulario');
    }

    if (proprietarioCpf.length != 11) {
        req.session.mensagem = 'O CPF precisa ter 11 números.';
        return res.redirect('/formulario');
    }

    try {
        let proprietarioID;
        const [proprietarios] = await db.query('select * from proprietario where proprietarioCpf = ?', [proprietarioCpf]);

        if (proprietarios.length > 0) {
            proprietarioID = proprietarios[0].proprietarioID;
        } else {
            const [novoProprietario] = await db.query('insert into proprietario (proprietarioNome, proprietarioCpf, proprietarioTelefone) values (?, ?, ?)', [proprietarioNome, proprietarioCpf, proprietarioTelefone]);
            proprietarioID = novoProprietario.insertId;
        }

        const [novoImovel] = await db.query('insert into imovel (imovelTitulo, imovelDescricao, imovelTipo, imovelFinalidade, imovelPreco, imovelArea, imovelQuartos, imovelBanheiros, imovelVagas, imovelEndereco, imovelBairro, imovelImagemUrl, imovelProprietarioIDFK, imovelUsuarioIDFK) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [imovelTitulo, imovelDescricao, imovelTipo, imovelFinalidade, imovelPreco, imovelArea, imovelQuartos, imovelBanheiros, imovelVagas, imovelEndereco, imovelBairro, imovelImagemUrl || null, proprietarioID, req.session.usuario.id]);

        for (let i = 0; i < comodidades.length; i++) {
            await db.query('insert into imovelComodidade (imovelComodidadeImovelIDFK, imovelComodidadeComodidadeIDFK) values (?, ?)', [novoImovel.insertId, comodidades[i]]);
        }

        req.session.mensagem = 'Imóvel cadastrado com sucesso!';
        res.redirect('/formulario');
    } catch (error) {
        console.log('Erro ao cadastrar imóvel', error);
        res.status(500).send('Erro ao cadastrar o imóvel.');
    }
});

app.get('/editar/:id', verificarLogin, async (req, res) => {
    try {
        const [resultado] = await db.query('select * from imovel join proprietario on proprietarioID = imovelProprietarioIDFK where imovelID = ? and imovelUsuarioIDFK = ?', [req.params.id, req.session.usuario.id]);

        if (resultado.length == 0) {
            req.session.mensagem = 'Imóvel não encontrado.';
            return res.redirect('/formulario');
        }

        const [imoveis] = await db.query('select * from imovel join proprietario on proprietarioID = imovelProprietarioIDFK where imovelUsuarioIDFK = ? order by imovelID desc', [req.session.usuario.id]);
        const [comodidades] = await db.query('select * from comodidade');
        const [ligacoes] = await db.query('select * from imovelComodidade where imovelComodidadeImovelIDFK = ?', [req.params.id]);

        let marcadas = [];
        for (let i = 0; i < ligacoes.length; i++) {
            marcadas.push(ligacoes[i].imovelComodidadeComodidadeIDFK);
        }

        res.render('formulario', { imoveis: imoveis, comodidades: comodidades, imovel: resultado[0], marcadas: marcadas });
    } catch (error) {
        console.log('Erro ao abrir imóvel', error);
        res.status(500).send('Erro ao abrir o imóvel.');
    }
});

app.post('/editar/:id', verificarLogin, async (req, res) => {
    const { imovelTitulo, imovelDescricao, imovelTipo, imovelFinalidade, imovelPreco, imovelArea, imovelQuartos, imovelBanheiros, imovelVagas, imovelEndereco, imovelBairro, imovelImagemUrl, proprietarioNome, proprietarioCpf, proprietarioTelefone } = req.body;

    let comodidades = req.body.comodidades || [];
    if (typeof comodidades == 'string') {
        comodidades = [comodidades];
    }

    if (!imovelTitulo || !imovelTipo || !imovelFinalidade || !imovelPreco || !imovelArea || !imovelEndereco || !imovelBairro || !proprietarioNome || !proprietarioCpf || !proprietarioTelefone) {
        req.session.mensagem = 'Preencha todos os campos obrigatórios.';
        return res.redirect('/editar/' + req.params.id);
    }

    if (imovelPreco <= 0 || imovelArea <= 0) {
        req.session.mensagem = 'O preço e a área precisam ser maiores que zero.';
        return res.redirect('/editar/' + req.params.id);
    }

    if (proprietarioCpf.length != 11) {
        req.session.mensagem = 'O CPF precisa ter 11 números.';
        return res.redirect('/editar/' + req.params.id);
    }

    try {
        const [resultado] = await db.query('select * from imovel where imovelID = ? and imovelUsuarioIDFK = ?', [req.params.id, req.session.usuario.id]);

        if (resultado.length == 0) {
            req.session.mensagem = 'Imóvel não encontrado.';
            return res.redirect('/formulario');
        }

        let proprietarioID;
        const [proprietarios] = await db.query('select * from proprietario where proprietarioCpf = ?', [proprietarioCpf]);

        if (proprietarios.length > 0) {
            proprietarioID = proprietarios[0].proprietarioID;
            await db.query('update proprietario set proprietarioNome = ?, proprietarioTelefone = ? where proprietarioID = ?', [proprietarioNome, proprietarioTelefone, proprietarioID]);
        } else {
            const [novoProprietario] = await db.query('insert into proprietario (proprietarioNome, proprietarioCpf, proprietarioTelefone) values (?, ?, ?)', [proprietarioNome, proprietarioCpf, proprietarioTelefone]);
            proprietarioID = novoProprietario.insertId;
        }

        await db.query('update imovel set imovelTitulo = ?, imovelDescricao = ?, imovelTipo = ?, imovelFinalidade = ?, imovelPreco = ?, imovelArea = ?, imovelQuartos = ?, imovelBanheiros = ?, imovelVagas = ?, imovelEndereco = ?, imovelBairro = ?, imovelImagemUrl = ?, imovelProprietarioIDFK = ? where imovelID = ?', [imovelTitulo, imovelDescricao, imovelTipo, imovelFinalidade, imovelPreco, imovelArea, imovelQuartos, imovelBanheiros, imovelVagas, imovelEndereco, imovelBairro, imovelImagemUrl || null, proprietarioID, req.params.id]);

        await db.query('delete from imovelComodidade where imovelComodidadeImovelIDFK = ?', [req.params.id]);

        for (let i = 0; i < comodidades.length; i++) {
            await db.query('insert into imovelComodidade (imovelComodidadeImovelIDFK, imovelComodidadeComodidadeIDFK) values (?, ?)', [req.params.id, comodidades[i]]);
        }

        req.session.mensagem = 'Imóvel atualizado!';
        res.redirect('/formulario');
    } catch (error) {
        console.log('Erro ao editar imóvel', error);
        res.status(500).send('Erro ao editar o imóvel.');
    }
});

app.post('/status/:id', verificarLogin, async (req, res) => {
    try {
        const [resultado] = await db.query('select * from imovel where imovelID = ? and imovelUsuarioIDFK = ?', [req.params.id, req.session.usuario.id]);

        if (resultado.length == 0) {
            req.session.mensagem = 'Imóvel não encontrado.';
            return res.redirect('/formulario');
        }

        let novoStatus = 'disponivel';

        if (resultado[0].imovelStatus == 'disponivel') {
            if (resultado[0].imovelFinalidade == 'venda') {
                novoStatus = 'vendido';
            } else {
                novoStatus = 'alugado';
            }
        }

        await db.query('update imovel set imovelStatus = ? where imovelID = ?', [novoStatus, req.params.id]);

        req.session.mensagem = 'Status atualizado!';
        res.redirect('/formulario');
    } catch (error) {
        console.log('Erro ao mudar status', error);
        res.status(500).send('Erro ao mudar o status.');
    }
});

app.post('/excluir/:id', verificarLogin, async (req, res) => {
    try {
        await db.query('delete from imovel where imovelID = ? and imovelUsuarioIDFK = ?', [req.params.id, req.session.usuario.id]);

        req.session.mensagem = 'Imóvel excluído.';
        res.redirect('/formulario');
    } catch (error) {
        console.log('Erro ao excluir imóvel', error);
        res.status(500).send('Erro ao excluir o imóvel.');
    }
});

app.listen(process.env.PORT || 3000, () => {
    console.log('Servidor rodando em http://localhost:3000/');
});
