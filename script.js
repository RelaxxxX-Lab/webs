document.addEventListener('DOMContentLoaded', async () => {
    // Simulate loading progress
    const loadingBar = document.getElementById('loadingBar');
    const loadingText = document.querySelector('.loading-text');
    const loadingScreen = document.getElementById('loadingScreen');
    const mainContent = document.getElementById('mainContent');
    const accessDenied = document.getElementById('accessDenied');
    
    // Animate loading bar
    for (let i = 0; i <= 100; i++) {
        setTimeout(() => {
            loadingBar.style.width = `${i}%`;
            
            if (i < 30) {
                loadingText.textContent = "Initializing...";
            } else if (i < 60) {
                loadingText.textContent = "Connecting to Discord...";
            } else if (i < 90) {
                loadingText.textContent = "Verifying permissions...";
            } else {
                loadingText.textContent = "Almost there...";
            }
        }, i * 20);
    }
    
    try {
        // Check authentication and permissions
        const authResponse = await fetch('/api/auth', {
            credentials: 'include'
        });
        
        const authData = await authResponse.json();
        
        if (!authResponse.ok) {
            throw new Error(authData.error || 'Authentication failed');
        }
        
        // Update UI with user data
        const userAvatar = document.getElementById('userAvatar');
        const username = document.getElementById('username');
        
        userAvatar.src = authData.user.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png';
        username.textContent = authData.user.username || 'User';
        
        // Check if user has access
        if (!authData.hasAccess) {
            loadingScreen.style.display = 'none';
            accessDenied.style.display = 'flex';
            return;
        }
        
        // Successful authentication and has access
        setTimeout(() => {
            loadingScreen.style.display = 'none';
            mainContent.style.display = 'flex';
            
            // Highlight active tab based on current page
            const currentPath = window.location.pathname;
            const navLinks = document.querySelectorAll('.nav-link');
            
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === currentPath) {
                    link.classList.add('active');
                }
            });
            
            // Get started button functionality
            const getStartedBtn = document.getElementById('getStartedBtn');
            if (getStartedBtn) {
                getStartedBtn.addEventListener('click', () => {
                    window.location.href = '/dashboard';
                });
            }
        }, 2000);
    } catch (error) {
        console.error('Authentication error:', error);
        loadingText.textContent = "Authentication failed. Redirecting...";
        
        setTimeout(() => {
            window.location.href = 'https://discord.gg/Cp7k85xZwA';
        }, 2000);
    }
});

// Tab system for dashboard and other pages
function openTab(evt, tabName) {
    const tabContents = document.getElementsByClassName('tab-content');
    for (let i = 0; i < tabContents.length; i++) {
        tabContents[i].style.display = 'none';
    }
    
    const tabLinks = document.getElementsByClassName('tab-link');
    for (let i = 0; i < tabLinks.length; i++) {
        tabLinks[i].className = tabLinks[i].className.replace(' active', '');
    }
    
    document.getElementById(tabName).style.display = 'block';
    evt.currentTarget.className += ' active';
}

// Initialize first tab as active by default
document.addEventListener('DOMContentLoaded', function() {
    const firstTab = document.querySelector('.tab-link');
    if (firstTab) {
        firstTab.click();
    }
});
