const { fetchDiscordUser, checkUserRoles } = require('./api');

async function authenticate(req, res, next) {
    try {
        const accessToken = req.cookies.access_token;
        if (!accessToken) {
            return res.redirect(`https://discord.com/api/oauth2/authorize?client_id=${process.env.BOT_CLIENT_ID}&redirect_uri=${encodeURIComponent(`${req.protocol}://${req.get('host')}/callback`)}&response_type=code&scope=identify%20guilds`);
        }
        
        const user = await fetchDiscordUser(accessToken);
        if (!user) {
            res.clearCookie('access_token');
            return res.redirect('/');
        }
        
        req.user = user;
        next();
    } catch (err) {
        console.error('Authentication error:', err);
        res.redirect('/');
    }
}

async function checkAccess(req, res, next) {
    try {
        const hasAccess = await checkUserRoles(req.user.id);
        if (!hasAccess) {
            return res.status(403).send('Access denied');
        }
        next();
    } catch (err) {
        console.error('Access check error:', err);
        res.status(500).send('Internal server error');
    }
}

module.exports = { authenticate, checkAccess };
