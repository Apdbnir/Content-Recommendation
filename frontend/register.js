document.addEventListener('DOMContentLoaded', () => {
    console.log('Register page loaded');
    
    const registerForm = document.getElementById('registerForm');
    
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(registerForm);
            const userData = {
                firstName: formData.get('firstName'),
                lastName: formData.get('lastName'),
                email: formData.get('email'),
                username: formData.get('username'),
                password: formData.get('password'),
                confirmPassword: formData.get('confirmPassword'),
                birthDate: formData.get('birthDate'),
                gender: formData.get('gender'),
                country: formData.get('country'),
                city: formData.get('city'),
                newsletter: formData.get('newsletter') === 'on',
                terms: formData.get('terms') === 'on'
            };
            
            // Validate passwords match
            if (userData.password !== userData.confirmPassword) {
                alert('Passwords do not match!');
                return;
            }
            
            // Validate terms agreement
            if (!userData.terms) {
                alert('You must agree to the Terms and Conditions');
                return;
            }
            
            try {
                // In a real app, this would send to backend API
                // For now, we'll simulate the API call
                const response = await registerUser(userData);
                
                if (response.success) {
                    // Redirect to main page or show success message
                    alert('Registration successful! Please check your email to verify your account.');
                    window.location.href = 'login.html';
                } else {
                    alert(`Registration failed: ${response.message}`);
                }
            } catch (error) {
                console.error('Registration error:', error);
                alert('An error occurred during registration. Please try again.');
            }
        });
    }
    
    // Set up OAuth buttons
    document.getElementById('googleRegister')?.addEventListener('click', () => {
        // In a real app, this would initiate Google OAuth flow
        initiateOAuth('google');
    });
    
    document.getElementById('facebookRegister')?.addEventListener('click', () => {
        // In a real app, this would initiate Facebook OAuth flow
        initiateOAuth('facebook');
    });
    
    // Function to register user via API
    async function registerUser(userData) {
        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData)
            });
            
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Registration API error:', error);
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
        console.log('Language changed event received on register page');
        await applyTranslations(localStorage.getItem('language') || 'ru');
    });
    
    // Initialize translations
    const currentLang = localStorage.getItem('language') || 'ru';
    applyTranslations(currentLang);
});

// Add translation keys that might be missing
if (typeof translations === 'undefined') {
    // This would normally be handled by translation.js
    // Just ensuring all keys are available for this page
}