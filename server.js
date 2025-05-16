require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const mongoose = require('mongoose');
const { Client, GatewayIntentBits } = require('discord.js');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB Connection
mongoose.connect(process.env.MONGODB_KEYS_URL)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Discord Bot Client
const discordClient = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages
  ]
});

discordClient.login(process.env.BOT_TOKEN);

// User Schema
const UserSchema = new mongoose.Schema({
  discordId: String,
  username: String,
  discriminator: String,
  avatar: String,
  accessToken: String,
  refreshToken: String,
  roles: [String],
  whitelisted: Boolean,
  lastLogin: Date
});

const User = mongoose.model('User', UserSchema);

// Passport Configuration
passport.serializeUser((user, done) => done(null, user.discordId));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findOne({ discordId: id });
    return user ? done(null, user) : done(null, null);
  } catch (err) {
    done(err, null);
  }
});

passport.use(new DiscordStrategy({
  clientID: process.env.BOT_CLIENT_ID,
  clientSecret: process.env.BOT_CLIENT_SECRET,
  callbackURL: process.env.CALLBACK_URL || 'http://localhost:3000/auth/discord/callback',
  scope: ['identify', 'guilds', 'guilds.members.read']
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const guild = await discordClient.guilds.fetch(process.env.SERVER_ID);
    const member = await guild.members.fetch(profile.id);
    
    const roles = member.roles.cache.map(role => role.id);
    const whitelisted = roles.some(roleId => 
      ['WHITELIST_ROLE_ID_1', 'WHITELIST_ROLE_ID_2'].includes(roleId)
    );

    const user = await User.findOneAndUpdate(
      { discordId: profile.id },
      {
        username: profile.username,
        discriminator: profile.discriminator,
        avatar: profile.avatar,
        accessToken,
        refreshToken,
        roles,
        whitelisted,
        lastLogin: new Date()
      },
      { upsert: true, new: true }
    );

    return done(null, user);
  } catch (err) {
    return done(err, null);
  }
}));

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

// Auth Routes
app.get('/auth/discord', passport.authenticate('discord'));
app.get('/auth/discord/callback',
  passport.authenticate('discord', {
    failureRedirect: '/',
    successRedirect: '/dashboard'
  })
);

app.get('/logout', (req, res) => {
  req.logout(() => {
    res.redirect('/');
  });
});

// Middleware to check authentication and roles
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect('/');
}

function checkWhitelist(req, res, next) {
  if (req.user?.whitelisted) return next();
  res.redirect('/pricing');
}

function checkStaff(req, res, next) {
  if (req.user?.roles.includes('STAFF_ROLE_ID')) return next();
  res.status(403).send('Access Denied');
}

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/dashboard', ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/games', ensureAuthenticated, checkWhitelist, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'games.html'));
});

app.get('/executor', ensureAuthenticated, checkWhitelist, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'executor.html'));
});

app.get('/pricing', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pricing.html'));
});

app.get('/admin', ensureAuthenticated, checkStaff, async (req, res) => {
  try {
    const users = await User.find({});
    res.render('admin', { users });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});