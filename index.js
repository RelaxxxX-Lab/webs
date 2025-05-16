// index.js
const express = require('express');
const fetch = require('node-fetch');
const path = require('path');
require('dotenv').config();

const app = express();
const DISCORD_API = 'https://discord.com/api';
const GUILD_ID = '1325936731383660584';

const ROLES = {
  STANDARD: '1330552089759191064',
  PREMIUM: '1333286640248029264',
  ULTIMATE: '1337177751202828300',
  OWNER: '1330551770317066270',
  MOD: '1330780991777804350',
  ADMIN: '1330781286087921834',
  HEAD_ADMIN: '1351255262232838287',
  MANAGER: '1351255389601136742',
  CCO: '1364279486891163748'
};

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Serve a página inicial
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Autenticação Discord
app.get('/login', (req, res) => {
  const redirect = `https://discord.com/api/oauth2/authorize?client_id=${process.env.BOT_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.REDIRECT_URI)}&response_type=code&scope=identify%20guilds%20guilds.members.read`;
  res.redirect(redirect);
});

// Callback após autenticação
app.get('/callback', async (req, res) => {
  const code = req.query.code;

  try {
    const tokenRes = await fetch(`${DISCORD_API}/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.BOT_CLIENT_ID,
        client_secret: process.env.BOT_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: process.env.REDIRECT_URI,
        scope: 'identify guilds guilds.members.read'
      })
    });

    const tokenData = await tokenRes.json();
    const access_token = tokenData.access_token;

    // Pegar informações do usuário
    const userRes = await fetch(`${DISCORD_API}/users/@me`, {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    const user = await userRes.json();

    // Verificar se o usuário tem permissão
    const memberRes = await fetch(`${DISCORD_API}/guilds/${GUILD_ID}/members/${user.id}`, {
      headers: { Authorization: `Bot ${process.env.BOT_TOKEN}` }
    });

    if (!memberRes.ok) return res.send('Erro ao verificar seus cargos.');

    const member = await memberRes.json();
    const hasRole = member.roles.some(role => Object.values(ROLES).includes(role));

    if (!hasRole) return res.send('Você não está autorizado.');

    res.redirect(`/dashboard?user=${user.username}`);
  } catch (error) {
    console.error('Erro na autenticação:', error);
    res.status(500).send('Erro ao autenticar.');
  }
});

// Envio de script
app.post('/submit', async (req, res) => {
  const { username, script } = req.body;

  try {
    const response = await fetch(`https://luaserverside.onrender.com/queue/${username}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ script })
    });

    if (!response.ok) throw new Error('Erro ao enviar script.');
    res.send('Script enviado com sucesso!');
  } catch (err) {
    console.error('Erro ao enviar script:', err);
    res.status(500).send('Erro no servidor.');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
