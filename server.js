const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());

// Whitelist verification endpoint
app.get('/verify/:username', async (req, res) => {
    try {
        const { username } = req.params;
        
        if (!username) {
            return res.status(400).json({ error: 'Username is required' });
        }

        // Fetch whitelist data from GitHub
        const response = await axios.get('https://raw.githubusercontent.com/RelaxxxX-Lab/Lua-things/main/Whitelist.json');
        const whitelistData = response.data;
        
        // Find user in whitelist
        const user = whitelistData.find(u => u.User.toLowerCase() === username.toLowerCase());
        
        if (user) {
            res.json({
                status: 'success',
                user: {
                    username: user.User,
                    discordId: user.Discord,
                    whitelistTier: user.Whitelist
                },
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(404).json({ 
                status: 'error',
                message: 'User not found in whitelist',
                timestamp: new Date().toISOString()
            });
        }
    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({ 
            status: 'error',
            message: 'Internal server error',
            timestamp: new Date().toISOString()
        });
    }
});

// Discord webhook logging endpoint
app.post('/logs/send', async (req, res) => {
    try {
        const { message, data } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        const discordWebhookUrl = 'https://discord.com/api/webhooks/1358494144049184821/oGi8Wxiedvw3HLZRkvFeGnFb9LeCl6t1MnzwF2BteqIu_BV1yxtEJqaox-OKNwsoXPr9';
        
        const embed = {
            title: 'Lua SS Log Entry',
            description: message,
            color: 0x7b2cbf, // Purple color
            fields: [],
            timestamp: new Date().toISOString()
        };

        if (data) {
            if (typeof data === 'object') {
                for (const [key, value] of Object.entries(data)) {
                    embed.fields.push({
                        name: key,
                        value: String(value),
                        inline: true
                    });
                }
            } else {
                embed.fields.push({
                    name: 'Data',
                    value: String(data),
                    inline: false
                });
            }
        }

        await axios.post(discordWebhookUrl, {
            embeds: [embed]
        });

        res.json({
            status: 'success',
            message: 'Log sent to Discord',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ 
            status: 'error',
            message: 'Failed to send log to Discord',
            timestamp: new Date().toISOString()
        });
    }
});

// Block GET requests to /logs/send
app.get('/logs/send', (req, res) => {
    res.status(405).json({ 
        status: 'error',
        message: 'Method not allowed. Use POST instead.',
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        status: 'error',
        message: 'Endpoint not found',
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Lua SS API running on port ${PORT}`);
});
