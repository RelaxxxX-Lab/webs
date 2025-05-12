export default async function handler(req, res) {
    // Get the username from the URL
    const { username } = req.query;

    try {
        // Fetch the whitelist data
        const response = await fetch('https://raw.githubusercontent.com/RelaxxxX-Lab/Lua-things/refs/heads/main/Whitelist.json');
        
        if (!response.ok) {
            throw new Error('Failed to fetch whitelist');
        }
        
        const whitelist = await response.json();

        // Find the user in the whitelist (case insensitive)
        const user = whitelist.find(item => 
            item.User.toLowerCase() === username.toLowerCase()
        );

        if (user) {
            // User found - return their info
            return res.status(200).json({
                status: "success",
                user: user.User,
                discord: user.Discord,
                whitelist: user.Whitelist,
                message: "User is whitelisted."
            });
        } else {
            // User not found
            return res.status(404).json({
                status: "error",
                message: "User is not whitelisted."
            });
        }
    } catch (error) {
        // Error handling
        console.error('Error:', error);
        return res.status(500).json({
            status: "error",
            message: "An error occurred while checking the whitelist."
        });
    }
}