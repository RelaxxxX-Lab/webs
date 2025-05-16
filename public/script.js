document.addEventListener('DOMContentLoaded', function() {
  // Tab functionality
  const tabs = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');
  
  if (tabs.length && tabContents.length) {
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        // Remove active class from all tabs and contents
        tabs.forEach(t => t.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        
        // Add active class to clicked tab and corresponding content
        tab.classList.add('active');
        const tabId = tab.getAttribute('data-tab');
        document.getElementById(tabId).classList.add('active');
      });
    });
    
    // Activate first tab by default
    tabs[0].click();
  }
  
  // Check authentication status
  async function checkAuth() {
    try {
      const response = await fetch('/auth/status', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      const data = await response.json();
      
      if (data.authenticated) {
        // Update UI for logged in user
        const authButtons = document.querySelector('.auth-buttons');
        if (authButtons) {
          authButtons.innerHTML = `
            <a href="/dashboard" class="btn login-btn">Dashboard</a>
            <a href="/logout" class="btn secondary-btn">Logout</a>
          `;
        }
        
        // Display user info on dashboard
        const userInfoElement = document.getElementById('user-info');
        if (userInfoElement) {
          document.getElementById('username').textContent = data.user.username;
          document.getElementById('discriminator').textContent = data.user.discriminator ? `#${data.user.discriminator}` : '';
          const avatarElement = document.getElementById('avatar');
          if (avatarElement) {
            avatarElement.src = data.user.avatar 
              ? `https://cdn.discordapp.com/avatars/${data.user.discordId}/${data.user.avatar}.png`
              : 'https://cdn.discordapp.com/embed/avatars/0.png';
          }
          const whitelistStatusElement = document.getElementById('whitelist-status');
          if (whitelistStatusElement) {
            whitelistStatusElement.textContent = data.user.whitelisted ? 'Whitelisted' : 'Not Whitelisted';
            whitelistStatusElement.className = data.user.whitelisted ? 'status-badge success' : 'status-badge danger';
          }
        }
      }
    } catch (err) {
      console.error('Auth check failed:', err);
      // Redirect to home if not authenticated on protected pages
      if (window.location.pathname !== '/' && window.location.pathname !== '/pricing') {
        window.location.href = '/';
      }
    }
  }
  
  // Handle restricted access pages
  if (window.location.pathname !== '/' && window.location.pathname !== '/pricing') {
    checkAuth();
  }
  
  // Discord verification for game logs
  if (window.location.pathname === '/games') {
    async function verifyDiscordRoles() {
      try {
        const response = await fetch('/verify-roles', {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Role verification failed');
        }
        
        const data = await response.json();
        
        if (!data.hasRequiredRoles) {
          window.location.href = '/pricing';
        }
      } catch (err) {
        console.error('Role verification failed:', err);
        window.location.href = '/pricing';
      }
    }
    
    verifyDiscordRoles();
  }
});