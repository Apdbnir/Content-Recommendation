document.addEventListener('DOMContentLoaded', () => {
    console.log('Login page loaded');
    
    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Get form data
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            const rememberMe = document.getElementById('rememberMe').checked;
            
            try {
                // In a real app, this would send to backend API
                const response = await loginUser({ email, password, rememberMe });
                
                if (response.success) {
                    // Store token in localStorage or sessionStorage based on "remember me"
                    if (rememberMe) {
                        localStorage.setItem('authToken', response.token);
                    } else {
                        sessionStorage.setItem('authToken', response.token);
                    }
                    
                    // Set user data in localStorage
                    localStorage.setItem('user', JSON.stringify(response.user));
                    
                    // Redirect to main page
                    window.location.href = 'main.html';
                } else {
                    alert(`Login failed: ${response.message}`);
                }
            } catch (error) {
                console.error('Login error:', error);
                alert('An error occurred during login. Please try again.');
            }
        });
    }
    
    // Set up OAuth buttons
    document.getElementById('googleLogin')?.addEventListener('click', () => {
        // In a real app, this would initiate Google OAuth flow
        initiateOAuth('google');
    });
    
    document.getElementById('facebookLogin')?.addEventListener('click', () => {
        // In a real app, this would initiate Facebook OAuth flow
        initiateOAuth('facebook');
    });
    
    // Function to login user via API
    async function loginUser(credentials) {
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(credentials)
            });
            
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Login API error:', error);
            return { success: false, message: 'Network error. Please try again.' };
        }
    }
    
    // Function to initiate OAuth flow
    function initiateOAuth(provider) {
        // Redirect to backend OAuth endpoint
        if (provider === 'google') {
            window.location.href = '/api/auth/google';
        } else if (provider === 'facebook') {
            window.location.href = '/api/auth/facebook';
        }
    }
    
    // Listen for language change events
    document.addEventListener('languageChanged', async () => {
        console.log('Language changed event received on login page');
        await applyTranslations(localStorage.getItem('language') || 'ru');
    });
    
    // Initialize translations
    const currentLang = localStorage.getItem('language') || 'ru';
    applyTranslations(currentLang);
});