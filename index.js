const express = require('express');
const fetch = require('node-fetch');
const path = require('path');
require('dotenv').config();
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

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

app.get('/login', (req, res) => {
  const redirect = `https://discord.com/api/oauth2/authorize?client_id=${process.env.BOT_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.REDIRECT_URI)}&response_type=code&scope=identify%20guilds%20guilds.members.read`;
  res.redirect(redirect);
});

app.get('/callback', async (req, res) => {
  const code = req.query.code;

  const data = {
    client_id: process.env.BOT_CLIENT_ID,
    client_secret: process.env.BOT_CLIENT_SECRET,
    grant_type: 'authorization_code',
    code,
    redirect_uri: process.env.REDIRECT_URI,
    scope: 'identify guilds guilds.members.read',
  };

  const response = await fetch(`${DISCORD_API}/oauth2/token`, {
    method: 'POST',
    body: new URLSearchParams(data),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  const { access_token } = await response.json();

  const user = await fetch(`${DISCORD_API}/users/@me`, {
    headers: { Authorization: `Bearer ${access_token}` },
  }).then(res => res.json());

  const member = await fetch(`${DISCORD_API}/guilds/${GUILD_ID}/members/${user.id}`, {
    headers: { Authorization: `Bot ${process.env.BOT_TOKEN}` },
  }).then(res => res.ok ? res.json() : null);

  const whitelist = await fetch('https://raw.githubusercontent.com/RelaxxxX-Lab/Lua-things/main/Whitelist.json').then(res => res.json());
  const wlEntry = whitelist.find(entry => entry.Discord === user.id);

  if (!member || !wlEntry || !Object.values(ROLES).some(role => member.roles.includes(role))) {
    return res.send('<h2>Você não tem permissão para acessar.</h2>');
  }

  res.redirect(`/dashboard.html?user=${wlEntry.User}`);
});

app.post('/submit', async (req, res) => {
  const { username, script } = req.body;

  try {
    const response = await fetch(`https://luaserverside.onrender.com/queue/${username}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ script })
    });

    if (!response.ok) return res.status(500).send('Erro ao enviar script.');

    res.send('Script enviado!');
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro no servidor.');
  }
});

app.listen(3000);
