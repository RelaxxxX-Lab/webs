const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON
app.use(express.json());

// Whitelist verification endpoint
app.get('/api/verify/:username', async (req, res) => {
    try {
        const { username } = req.params;
        
        // Fetch the whitelist data from GitHub
        const response = await axios.get('https://raw.githubusercontent.com/RelaxxxX-Lab/Lua-things/refs/heads/main/Whitelist.json');
        const whitelistData = response.data;
        
        // Find the user in the whitelist
        const user = whitelistData.find(u => u.User.toLowerCase() === username.toLowerCase());
        
        if (user) {
            res.json({
                User: user.User,
                Discord: user.Discord,
                Whitelist: user.Whitelist
            });
        } else {
            res.status(404).json({ error: 'Username not found in whitelist' });
        }
    } catch (error) {
        console.error('Error in verification:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});