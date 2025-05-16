document.addEventListener('DOMContentLoaded', async () => {
    const loadingScreen = document.getElementById('loadingScreen');
    const loginBtn = document.getElementById('loginBtn');
    const userSection = document.getElementById('userSection');
    const getStartedBtn = document.getElementById('getStartedBtn');
    
    // Check authentication status
    try {
        const response = await fetch('/api/auth/status', {
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.authenticated) {
            // User is authenticated
            loginBtn.style.display = 'none';
            
            // Create user profile element
            const userProfile = document.createElement('div');
            userProfile.className = 'user-profile';
            userProfile.innerHTML = `
                <img src="${data.user.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'}" alt="User Avatar" class="user-avatar">
                <span class="username">${data.user.username}</span>
            `;
            
            userSection.appendChild(userProfile);
            
            // Redirect to dashboard if on home page
            if (window.location.pathname === '/') {
                window.location.href = '/dashboard';
            }
        } else {
            // User is not authenticated
            loadingScreen.style.display = 'none';
        }
    } catch (error) {
        console.error('Authentication check failed:', error);
        loadingScreen.style.display = 'none';
    }
    
    // Handle login button click
    loginBtn.addEventListener('click', () => {
        window.location.href = `/api/auth/discord/login?redirect=${encodeURIComponent(window.location.pathname)}`;
    });
    
    // Handle get started button click
    if (getStartedBtn) {
        getStartedBtn.addEventListener('click', () => {
            window.location.href = '/pricing';
        });
    }
    
    // Check for unauthorized access
    if (window.location.pathname.includes('unauthorized')) {
        loadingScreen.style.display = 'none';
    }
});
