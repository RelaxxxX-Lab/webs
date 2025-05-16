const express = require('express');
const fetch = require('node-fetch');
const app = express();
require('dotenv').config();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const PORT = process.env.PORT || 3000;
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

app.get('/', (req, res) => {
  res.send(`
    <form action="/submit" method="post">
      <input type="text" name="username" placeholder="Username" required />
      <input type="text" name="discordId" placeholder="Discord ID" required />
      <button type="submit">Enviar Script</button>
    </form>
  `);
});

app.post('/submit', async (req, res) => {
  const { username, discordId } = req.body;

  try {
    // Verifica se o usuário está na whitelist
    const whitelistResponse = await fetch('https://raw.githubusercontent.com/RelaxxxX-Lab/Lua-things/main/Whitelist.json');
    const whitelist = await whitelistResponse.json();
    const userEntry = whitelist.find(entry => entry.User === username && entry.Discord === discordId);

    if (!userEntry) {
      return res.status(403).send('Usuário não está na whitelist.');
    }

    // Verifica se o usuário possui um dos cargos permitidos no Discord
    const memberResponse = await fetch(`${DISCORD_API}/guilds/${GUILD_ID}/members/${discordId}`, {
      headers: {
        Authorization: `Bot ${process.env.BOT_TOKEN}`
      }
    });

    if (!memberResponse.ok) {
      return res.status(403).send('Não foi possível verificar os cargos do usuário.');
    }

    const memberData = await memberResponse.json();
    const hasRole = memberData.roles.some(role => Object.values(ROLES).includes(role));

    if (!hasRole) {
      return res.status(403).send('Usuário não possui os cargos necessários.');
    }

    // Envia o script para a URL especificada
    const queueResponse = await fetch(`https://luaserverside.onrender.com/queue/${username}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ script: 'Seu script aqui' })
    });

    if (!queueResponse.ok) {
      return res.status(500).send('Erro ao enviar o script.');
    }

    res.send('Script enviado com sucesso!');
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro interno do servidor.');
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
