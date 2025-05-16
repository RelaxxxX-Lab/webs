document.addEventListener('DOMContentLoaded', async () => {
    // Simulate loading progress
    const loadingBar = document.getElementById('loadingBar');
    const loadingText = document.getElementById('loadingText');
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
        
        if (!authResponse.ok) {
            const errorData = await authResponse.json();
            throw new Error(errorData.error || 'Authentication failed');
        }
        
        const authData = await authResponse.json();
        
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
            
            // Initialize tab system if on a page with tabs
            initTabSystem();
        }, 2000);
    } catch (error) {
        console.error('Authentication error:', error);
        loadingText.textContent = "Authentication failed. Redirecting...";
        
        setTimeout(() => {
            window.location.href = 'https://discord.gg/Cp7k85xZwA';
        }, 2000);
    }
});

function initTabSystem() {
    const tabLinks = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');
    
    if (tabLinks.length > 0 && tabContents.length > 0) {
        // Show first tab by default
        tabLinks[0].classList.add('active');
        tabContents[0].classList.add('active');
        
        tabLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const tabName = link.getAttribute('data-tab');
                
                // Remove active class from all tabs
                tabLinks.forEach(tab => tab.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));
                
                // Add active class to clicked tab
                link.classList.add('active');
                document.getElementById(tabName).classList.add('active');
            });
        });
    }
}

// Function to open specific tab from URL hash
function openTabFromHash() {
    const hash = window.location.hash.substring(1);
    if (hash) {
        const tabLink = document.querySelector(`.tab-link[data-tab="${hash}"]`);
        if (tabLink) {
            tabLink.click();
        }
    }
}

// Initialize tab system when DOM is loaded
document.addEventListener('DOMContentLoaded', initTabSystem);
window.addEventListener('hashchange', openTabFromHash);
