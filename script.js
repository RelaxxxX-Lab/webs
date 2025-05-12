document.addEventListener('DOMContentLoaded', function() {
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    // Whitelist verification functionality
    const verifyBtn = document.getElementById('verify-btn');
    const usernameInput = document.getElementById('username-input');
    const resultContainer = document.getElementById('result-container');
    const resultText = document.getElementById('result-text');

    verifyBtn.addEventListener('click', async function() {
        const username = usernameInput.value.trim();
        
        if (!username) {
            showResult('Please enter a username', 'error');
            return;
        }

        try {
            const response = await fetch(`/api/verify/${username}`);
            const data = await response.json();
            
            if (data.error) {
                showResult(data.error, 'error');
            } else {
                showResult(`Username: ${data.User}<br>Whitelist Tier: ${data.Whitelist}`, 'success');
            }
        } catch (error) {
            showResult('Error verifying username. Please try again.', 'error');
            console.error('Verification error:', error);
        }
    });

    function showResult(message, type) {
        resultText.innerHTML = message;
        resultContainer.className = type;
        resultContainer.classList.remove('hidden');
    }
});