const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const { MongoClient } = require('mongodb');
const DiscordOauth2 = require('discord-oauth2');
const oauth = new DiscordOauth2();

// Environment variables
const {
    BOT_TOKEN,
    SERVER_ID,
    MONGODB_KEYS_URL,
    BOT_CLIENT_ID,
    BOT_CLIENT_SECRET
} = process.env;

// MongoDB connection
let db;
(async () => {
    try {
        const client = new MongoClient(MONGODB_KEYS_URL);
        await client.connect();
        db = client.db('keys');
        console.log('Connected to MongoDB');
    } catch (err) {
        console.error('MongoDB connection error:', err);
    }
})();

// Discord API helper
async function fetchDiscordUser(accessToken) {
    try {
        const user = await oauth.getUser(accessToken);
        return user;
    } catch (err) {
        console.error('Discord API error:', err);
        return null;
    }
}

async function checkUserRoles(userId) {
    try {
        const response = await fetch(`https://discord.com/api/guilds/${SERVER_ID}/members/${userId}`, {
            headers: {
                'Authorization': `Bot ${BOT_TOKEN}`
            }
        });
        
        if (!response.ok) return false;
        
        const memberData = await response.json();
        const requiredRoles = ['Staff', 'Whitelisted', 'VIP']; // Example roles
        
        // Get all roles from the server
        const rolesResponse = await fetch(`https://discord.com/api/guilds/${SERVER_ID}/roles`, {
            headers: {
                'Authorization': `Bot ${BOT_TOKEN}`
            }
        });
        
        if (!rolesResponse.ok) return false;
        
        const allRoles = await rolesResponse.json();
        const roleNames = {};
        allRoles.forEach(role => {
            roleNames[role.id] = role.name;
        });
        
        // Check if user has any of the required roles
        return memberData.roles && memberData.roles.some(roleId => 
            requiredRoles.includes(roleNames[roleId])
        );
    } catch (err) {
        console.error('Discord roles check error:', err);
        return false;
    }
}

// Authentication endpoint
router.get('/auth', async (req, res) => {
    try {
        const accessToken = req.cookies.access_token;
        if (!accessToken) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        
        const user = await fetchDiscordUser(accessToken);
        if (!user) {
            return res.status(401).json({ error: 'Invalid Discord token' });
        }
        
        const hasAccess = await checkUserRoles(user.id);
        
        res.json({
            user: {
                id: user.id,
                username: user.username,
                discriminator: user.discriminator,
                avatar: user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` : null
            },
            hasAccess
        });
    } catch (err) {
        console.error('Auth error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Discord OAuth callback
router.get('/callback', async (req, res) => {
    try {
        const code = req.query.code;
        if (!code) {
            return res.redirect('/');
        }
        
        const tokenData = await oauth.tokenRequest({
            clientId: BOT_CLIENT_ID,
            clientSecret: BOT_CLIENT_SECRET,
            code,
            scope: ['identify', 'guilds'],
            grantType: 'authorization_code',
            redirectUri: `${req.protocol}://${req.get('host')}/callback`
        });
        
        res.cookie('access_token', tokenData.access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: tokenData.expires_in * 1000
        });
        
        res.redirect('/dashboard');
    } catch (err) {
        console.error('OAuth callback error:', err);
        res.redirect('/');
    }
});

// Admin endpoint (only for Staff)
router.get('/admin/users', async (req, res) => {
    try {
        const accessToken = req.cookies.access_token;
        if (!accessToken) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        
        const user = await fetchDiscordUser(accessToken);
        if (!user) {
            return res.status(401).json({ error: 'Invalid Discord token' });
        }
        
        // Check if user has Staff role
        const isStaff = await checkUserHasRole(user.id, 'Staff');
        if (!isStaff) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        
        // Get all users from database
        const users = await db.collection('users').find().toArray();
        res.json(users);
    } catch (err) {
        console.error('Admin users error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

async function checkUserHasRole(userId, roleName) {
    try {
        const response = await fetch(`https://discord.com/api/guilds/${SERVER_ID}/members/${userId}`, {
            headers: {
                'Authorization': `Bot ${BOT_TOKEN}`
            }
        });
        
        if (!response.ok) return false;
        
        const memberData = await response.json();
        
        // Get all roles from the server
        const rolesResponse = await fetch(`https://discord.com/api/guilds/${SERVER_ID}/roles`, {
            headers: {
                'Authorization': `Bot ${BOT_TOKEN}`
            }
        });
        
        if (!rolesResponse.ok) return false;
        
        const allRoles = await rolesResponse.json();
        const roleNames = {};
        allRoles.forEach(role => {
            roleNames[role.id] = role.name;
        });
        
        // Check if user has the specified role
        return memberData.roles && memberData.roles.some(roleId => 
            roleNames[roleId] === roleName
        );
    } catch (err) {
        console.error('Role check error:', err);
        return false;
    }
}

module.exports = router;
