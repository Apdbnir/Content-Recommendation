document.addEventListener('DOMContentLoaded', () => {
    const platforms = [
        'YouTube', 'Spotify', 'VK', 'Netflix', 'Telegram', 'Twitch', 'Reddit', 'Facebook',
        'X', 'Instagram', 'TikTok', 'LinkedIn', 'Discord', 'Steam', 'GitHub', 'Pinterest',
        'SoundCloud', 'GitLab', 'WhatsApp', 'Messenger', 'Snapchat', 'Odnoklassniki',
        'YandexMusic', 'Dailymotion', 'Medium', 'Tumblr', 'AppleMusic', 'PrimeVideo',
        'Goodreads', 'Quora', 'Behance'
    ];

    // Helper function to get session token for non-authenticated users
    function getSessionToken() {
        let sessionToken = localStorage.getItem('sessionToken');
        if (!sessionToken) {
            // Create a new session token
            sessionToken = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            localStorage.setItem('sessionToken', sessionToken);
        }
        return sessionToken;
    }
    
    // Helper function to get user-specific storage key
    function getUserStorageKey(keyName) {
        const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || null);
        if (user && user.id) {
            return `user_${user.id}_${keyName}`;
        }
        // For non-authenticated users, use session token as identifier
        return `session_${getSessionToken()}_${keyName}`;
    }

    const container = document.querySelector('.platform-buttons-container');
    const nextButton = document.getElementById('nextButton');
    const errorMessage = document.querySelector('.error-message');
    let idleTimer;

    platforms.forEach(platform => {
        const button = document.createElement('button');
        button.className = `platform-btn ${platform.toLowerCase()}`;
        button.textContent = platform;
        button.dataset.platform = platform;
        container.appendChild(button);

        button.addEventListener('click', () => {
            button.classList.toggle('selected');
            validateSelection();
        });
    });

    // Load previously selected platforms from localStorage
    const previouslySelectedPlatforms = JSON.parse(localStorage.getItem(getUserStorageKey('selectedPlatforms')) || '[]');
    previouslySelectedPlatforms.forEach(platform => {
        const button = document.querySelector(`.platform-btn[data-platform="${platform}"]`);
        if (button) {
            button.classList.add('selected');
        }
    });

    const validateSelection = () => {
        const selectedButtons = document.querySelectorAll('.platform-btn.selected');
        if (selectedButtons.length > 0) {
            errorMessage.style.opacity = '0';
            return true;
        } else {
            const lang = localStorage.getItem('language') || 'ru';
            errorMessage.textContent = lang === 'ru' ? 'Пожалуйста, выберите хотя бы одну платформу.' : 'Please select at least one platform.';
            errorMessage.style.opacity = '1';
            return false;
        }
    };

    nextButton.addEventListener('click', () => {
        if (validateSelection()) {
            const selectedPlatforms = Array.from(document.querySelectorAll('.platform-btn.selected')).map(btn => btn.dataset.platform);
            
            // Save selected platforms to localStorage (user-specific)
            localStorage.setItem(getUserStorageKey('selectedPlatforms'), JSON.stringify(selectedPlatforms));
            
            // If user is authenticated, send selected platforms to backend
            const authToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
            if (authToken) {
                fetch('/api/selected-platforms', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    },
                    body: JSON.stringify({ platforms: selectedPlatforms })
                })
                .then(response => response.json())
                .then(data => {
                    console.log('Selected platforms saved to server:', data);
                })
                .catch(error => {
                    console.error('Error saving selected platforms to server:', error);
                });
            }
            
            window.location.href = 'interests.html';
        }
    });

    // Idle Animation Logic
    function stopFloating() {
        const buttons = document.querySelectorAll('.platform-btn.floating');
        buttons.forEach(button => {
            const computedStyle = window.getComputedStyle(button);
            const currentTransform = computedStyle.transform;
            
            button.classList.remove('floating');
            button.style.animationDelay = ''; // Clean up delay

            button.style.transform = currentTransform;
            button.offsetHeight; // Force reflow
            button.style.transform = 'translate(0, 0) scale(1)';
            
            const onTransitionEnd = () => {
                button.style.transform = '';
                button.removeEventListener('transitionend', onTransitionEnd);
            };
            button.addEventListener('transitionend', onTransitionEnd);
        });
    }

    function startStaggeredFloating() {
        const buttons = Array.from(document.querySelectorAll('.platform-btn'));
        const rows = new Map();

        // Group buttons by row based on their vertical position
        buttons.forEach(btn => {
            const top = btn.offsetTop;
            if (!rows.has(top)) {
                rows.set(top, []);
            }
            rows.get(top).push(btn);
        });

        const ROW_DELAY = 0.2; // 200ms delay between rows
        const BUTTON_DELAY = 0.1; // 100ms delay between buttons in a row

        Array.from(rows.values()).forEach((rowButtons, rowIndex) => {
            rowButtons.forEach((button, colIndex) => {
                const totalDelay = (rowIndex * ROW_DELAY) + (colIndex * BUTTON_DELAY);
                button.style.animationDelay = `${totalDelay}s`;
                button.classList.add('floating');
            });
        });
    }

    function resetIdleTimer() {
        stopFloating();
        clearTimeout(idleTimer);
        idleTimer = setTimeout(startStaggeredFloating, 3000); // 3 seconds of inactivity
    }

    // Event Listeners for user activity
    window.addEventListener('mousemove', resetIdleTimer, { passive: true });
    window.addEventListener('mousedown', resetIdleTimer);
    window.addEventListener('keypress', resetIdleTimer);
    window.addEventListener('touchstart', resetIdleTimer, { passive: true });

    // Initial setup
    setTimeout(() => {
        resetIdleTimer();
    }, 100); // Small delay to ensure DOM is fully rendered
});
