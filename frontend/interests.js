document.addEventListener('DOMContentLoaded', async () => {
    const interestsContainer = document.getElementById('interestsContainer');
    const finishButton = document.getElementById('finishButton');
    let selectedInterests = new Map();
    let idleTimer;

    const colorPalette = [
        'linear-gradient(135deg, #a1c4fd, #c2e9fb)',
        'linear-gradient(135deg, #ff9a9e, #fecfef)',
        'linear-gradient(135deg, #84fab0, #8fd3f4)',
        'linear-gradient(135deg, #f6d365, #fda085)',
        'linear-gradient(135deg, #d4fc79, #96e6a1)',
        'linear-gradient(135deg, #a3bded, #6991c7)',
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

    // Load saved interests from localStorage (user-specific)
    const savedInterests = JSON.parse(localStorage.getItem(getUserStorageKey('selectedInterests')) || '[]');
    
    function getRandomColor() {
        return colorPalette[Math.floor(Math.random() * colorPalette.length)];
    }

    async function populateInterests() {
        const lang = getLanguage();
        const translations = await fetchTranslations(lang);
        const interests = translations.interests;
        
        // Проверяем, что interests - это объект, а не строка
        if (!interests || typeof interests !== 'object') {
            console.error('Interests data is not an object:', interests);
            return;
        }
        
        interestsContainer.innerHTML = '';

        for (const key in interests) {
            const interest = interests[key];
            const tag = document.createElement('div');
            tag.classList.add('interest-tag');
            tag.textContent = interest;
            tag.dataset.interest = key;
            interestsContainer.appendChild(tag);

            // Check if this interest was previously selected
            if (savedInterests.includes(key)) {
                selectedInterests.set(key, getRandomColor());
                tag.classList.add('selected');
                tag.style.background = selectedInterests.get(key);
            }

            if (selectedInterests.has(key)) {
                tag.classList.add('selected');
                tag.style.background = selectedInterests.get(key);
            }
        }
    }

    interestsContainer.addEventListener('click', (event) => {
        if (event.target.classList.contains('interest-tag')) {
            const interestKey = event.target.dataset.interest;
            const tag = event.target;
            
            if (selectedInterests.has(interestKey)) {
                selectedInterests.delete(interestKey);
                tag.classList.remove('selected');
                tag.style.background = '';
            } else {
                const color = getRandomColor();
                selectedInterests.set(interestKey, color);
                tag.classList.add('selected');
                tag.style.background = color;
            }
        }
    });

    finishButton.addEventListener('click', () => {
        // Save selected interests to localStorage (user-specific)
        const selectedInterestKeys = Array.from(selectedInterests.keys());
        localStorage.setItem(getUserStorageKey('selectedInterests'), JSON.stringify(selectedInterestKeys));
        console.log('Выбранные интересы:', selectedInterestKeys);
        
        // Check if user is authenticated
        const isAuthenticated = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        
        // Prepare interests data for API
        const interestsForAPI = selectedInterestKeys.map(interest => ({ interest, weight: 1 }));
        
        // If authenticated, send interests to backend
        if (isAuthenticated) {
            const authToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
            fetch('/api/interests', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({ interests: interestsForAPI })
            })
            .then(response => response.json())
            .then(data => {
                console.log('Interests saved to server:', data);
            })
            .catch(error => {
                console.error('Error saving interests to server:', error);
            });
        }
        
        // Check if this is an update from the main page (not initial setup)
        const urlParams = new URLSearchParams(window.location.search);
        const fromParam = urlParams.get('from');
        
        if (fromParam === 'main') {
            // If updating from main page, go directly back to main page
            window.location.href = 'main.html';
        } else if (isAuthenticated) {
            // If user is already authenticated, go to main page instead of login
            window.location.href = 'main.html';
        } else {
            // If this is initial setup and user is not authenticated, continue to login page
            window.location.href = 'login.html';
        }
    });

    document.addEventListener('languageChanged', async () => {
        await populateInterests();
    });

    await populateInterests();

    // --- Animation Logic ---

    function handleMouseMove(e) {
        const tags = document.querySelectorAll('.interest-tag');
        tags.forEach(tag => {
            if (tag.classList.contains('idle')) return; // Don't interact while idle animation is active

            const rect = tag.getBoundingClientRect();
            const tagCenterX = rect.left + rect.width / 2;
            const tagCenterY = rect.top + rect.height / 2;
            
            const dx = e.clientX - tagCenterX;
            const dy = e.clientY - tagCenterY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            let transformStyle = 'translate(0, 0)';
            const INTERACTION_RADIUS = 150;
            const MAX_TRANSLATE = 15;

            if (distance < INTERACTION_RADIUS) {
                const pushFactor = (INTERACTION_RADIUS - distance) / INTERACTION_RADIUS;
                const moveX = -(dx / distance) * MAX_TRANSLATE * pushFactor;
                const moveY = -(dy / distance) * MAX_TRANSLATE * pushFactor;
                transformStyle = `translate(${moveX}px, ${moveY}px)`;
            }
            
            const scale = tag.classList.contains('selected') ? ' scale(1.05)' : '';
            tag.style.transform = `${transformStyle}${scale}`;
        });
    }

    function startIdleAnimation() {
        const tags = document.querySelectorAll('.interest-tag');
        tags.forEach(tag => {
            // Reset any transform from mouse interaction
            const scale = tag.classList.contains('selected') ? ' scale(1.05)' : '';
            tag.style.transform = `translate(0,0)${scale}`;
            
            const delay = Math.random() * 2; // Shorter delay for quicker start
            tag.style.setProperty('--animation-delay', `${delay}s`);
            tag.classList.add('idle');
        });
    }

    function stopIdleAnimation() {
        clearTimeout(idleTimer);
        const tags = document.querySelectorAll('.interest-tag');
        tags.forEach(tag => {
            if (tag.classList.contains('idle')) {
                const computedStyle = window.getComputedStyle(tag);
                const currentTransform = computedStyle.transform;
                tag.classList.remove('idle');
                tag.style.transform = currentTransform; // Freeze in place
                tag.offsetHeight; // Force reflow
                const scale = tag.classList.contains('selected') ? ' scale(1.05)' : '';
                tag.style.transform = `translate(0,0)${scale}`; // Transition back to base
            }
        });
    }

    function resetIdleTimer() {
        stopIdleAnimation();
        idleTimer = setTimeout(startIdleAnimation, 4000); // 4 seconds of inactivity
    }

    // Event Listeners
    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mousemove', resetIdleTimer, { passive: true });
    document.addEventListener('mousedown', resetIdleTimer);
    document.addEventListener('keypress', resetIdleTimer);
    document.addEventListener('touchstart', resetIdleTimer, { passive: true });

    // Initial setup
    resetIdleTimer();
});