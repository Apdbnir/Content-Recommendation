document.addEventListener('DOMContentLoaded', () => {
    // Apply saved theme settings globally when any page loads
    applySavedTheme();
    
    const menuIcon = document.querySelector('.menu-icon');
    const menuNav = document.querySelector('.menu-nav');
    const langSwitcherToggle = document.getElementById('lang-switcher-toggle');
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');

    // --- Menu Logic ---
    if (menuIcon && menuNav) {
        menuIcon.addEventListener('click', () => {
            menuIcon.classList.toggle('open');
            menuNav.classList.toggle('open');
        });
    }

    // --- Language Switcher Toggle Logic ---
    if (langSwitcherToggle) {
        langSwitcherToggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation(); // Prevent closing the menu when clicking the language toggle
            const languageSwitcher = langSwitcherToggle.closest('.language-switcher');
            languageSwitcher.classList.toggle('expanded');
        });
    }

    // --- Language Selection Logic ---
    const languageLinks = document.querySelectorAll('.language-submenu a');
    languageLinks.forEach(link => {
        link.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const selectedLang = e.target.getAttribute('data-lang');
            setLanguage(selectedLang);
            await applyTranslations(selectedLang);
            document.dispatchEvent(new CustomEvent('languageChanged'));
            
            // Close the submenu after selection
            const languageSwitcher = langSwitcherToggle.closest('.language-switcher');
            languageSwitcher.classList.remove('expanded');
            
            // Also close the main menu if needed
            menuIcon.classList.remove('open');
            menuNav.classList.remove('open');
        });
    });

    // --- Authentication Logic ---
    // Check if user is authenticated
    function isAuthenticated() {
        return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    }

    // Update login/logout buttons based on authentication status
    function updateAuthButtons() {
        if (isAuthenticated()) {
            if (loginBtn) loginBtn.style.display = 'none';
            if (logoutBtn) {
                logoutBtn.style.display = 'block';
                // Remove any existing event listeners to avoid duplicates
                logoutBtn.removeEventListener('click', handleLogout);
                logoutBtn.addEventListener('click', handleLogout);
            }
        } else {
            if (loginBtn) {
                loginBtn.style.display = 'block';
                // Remove any existing event listeners to avoid duplicates
                loginBtn.removeEventListener('click', handleLogin);
                loginBtn.addEventListener('click', handleLogin);
            }
            if (logoutBtn) logoutBtn.style.display = 'none';
        }
    }
    
    // Handle login by redirecting to login page
    function handleLogin() {
        // Close the menu before redirecting
        menuIcon.classList.remove('open');
        menuNav.classList.remove('open');
        
        // Redirect to login page
        window.location.href = 'login.html';
    }

    // Handle logout
    function handleLogout() {
        // Get user info before clearing it to remove user-specific data
        const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || null);
        
        // Remove authentication tokens
        localStorage.removeItem('authToken');
        sessionStorage.removeItem('authToken');
        localStorage.removeItem('user');
        
        // Clear platform and interest selections if we know the user
        if (user && user.id) {
            localStorage.removeItem(`user_${user.id}_selectedPlatforms`);
            localStorage.removeItem(`user_${user.id}_selectedInterests`);
        } else {
            // Fallback to remove generic keys if no user was identified
            localStorage.removeItem('selectedPlatforms');
            localStorage.removeItem('selectedInterests');
        }
        
        // Redirect to index page
        window.location.href = 'index.html';
    }

    // --- Close menu when clicking outside ---
    document.addEventListener('click', (e) => {
        if (menuNav.classList.contains('open')) {
            // Check if the click is outside the menu and menu icon
            if (!menuNav.contains(e.target) && !menuIcon.contains(e.target)) {
                menuIcon.classList.remove('open');
                menuNav.classList.remove('open');
                
                // Also close the language submenu if open
                const languageSwitcher = document.querySelector('.language-switcher');
                if (languageSwitcher) {
                    languageSwitcher.classList.remove('expanded');
                }
            }
        }
    });

    // --- Initial Load ---
    const initialLang = getLanguage();
    applyTranslations(initialLang);
    
    // Update authentication state
    updateAuthButtons();

    // --- Offline Game Logic ---
    const showOfflineGame = () => {
        if (document.getElementById('offline-container')) return;

        const container = document.createElement('div');
        container.id = 'offline-container';
        
        const canvas = document.createElement('canvas');
        canvas.id = 'game-canvas';

        container.appendChild(canvas);
        document.body.appendChild(container);
        
        // Make it visible with a smooth transition
        requestAnimationFrame(() => {
            container.classList.add('visible');
        });

        const ctx = canvas.getContext('2d');
        let animationFrameId;

        // --- Game Setup ---
        canvas.width = Math.min(window.innerWidth * 0.8, 800);
        canvas.height = 400;

        // Game objects
        const paddle = {
            height: 10,
            width: 100,
            x: (canvas.width - 100) / 2,
            color: '#333'
        };

        const ball = {
            x: canvas.width / 2,
            y: canvas.height - 30,
            radius: 8,
            speed: 4,
            dx: 3,
            dy: -3,
            color: '#555'
        };

        // Bricks (from the error message)
        const message = getLanguage() === 'ru' ? "Нет доступа к интернету" : "No internet connection";
        const bricks = [];
        const brickConfig = {
            rows: 1,
            padding: 1,
            color: '#333',
            font: 'bold 48px Nunito'
        };
        
        ctx.font = brickConfig.font;
        const textWidth = ctx.measureText(message).width;
        let currentX = (canvas.width - textWidth) / 2;
        const startY = 80;

        for (let i = 0; i < message.length; i++) {
            const char = message[i];
            if (char === ' ') {
                currentX += 20; // Space width
                continue;
            }
            const charWidth = ctx.measureText(char).width;
            bricks.push({
                x: currentX,
                y: startY,
                width: charWidth,
                height: 40,
                char: char,
                status: 1, // 1: visible, 0: broken
                alpha: 1,
                regenerateTimer: null
            });
            currentX += charWidth + brickConfig.padding;
        }

        // --- Drawing Functions ---
        const drawPaddle = () => {
            ctx.beginPath();
            ctx.rect(paddle.x, canvas.height - paddle.height, paddle.width, paddle.height);
            ctx.fillStyle = paddle.color;
            ctx.fill();
            ctx.closePath();
        };

        const drawBall = () => {
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
            ctx.fillStyle = ball.color;
            ctx.fill();
            ctx.closePath();
        };

        const drawBricks = () => {
            ctx.font = brickConfig.font;
            bricks.forEach(brick => {
                ctx.fillStyle = `rgba(51, 51, 51, ${brick.alpha})`;
                ctx.fillText(brick.char, brick.x, brick.y);
            });
        };

        // --- Collision & Game Logic ---
        const collisionDetection = () => {
            bricks.forEach(b => {
                if (b.status === 1) {
                    if (ball.x > b.x && ball.x < b.x + b.width && ball.y > b.y - b.height && ball.y < b.y) {
                        ball.dy = -ball.dy;
                        b.status = 0;
                        
                        // Fade out
                        let fadeOut = setInterval(() => {
                            if (b.alpha > 0) {
                                b.alpha -= 0.1;
                            } else {
                                b.alpha = 0;
                                clearInterval(fadeOut);
                            }
                        }, 20);

                        // Schedule regeneration
                        clearTimeout(b.regenerateTimer);
                        b.regenerateTimer = setTimeout(() => {
                            b.status = 1;
                            // Fade in
                            let fadeIn = setInterval(() => {
                                if (b.alpha < 1) {
                                    b.alpha += 0.1;
                                } else {
                                    b.alpha = 1;
                                    clearInterval(fadeIn);
                                }
                            }, 50);
                        }, 5000); // Regenerate after 5 seconds
                    }
                }
            });
        };

        const movePaddle = (e) => {
            const relativeX = e.clientX - canvas.getBoundingClientRect().left;
            if (relativeX > 0 && relativeX < canvas.width) {
                paddle.x = relativeX - paddle.width / 2;
            }
        };

        document.addEventListener('mousemove', movePaddle);

        // --- Main Game Loop ---
        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawBricks();
            drawBall();
            drawPaddle();
            collisionDetection();

            // Wall collision (left/right)
            if (ball.x + ball.dx > canvas.width - ball.radius || ball.x + ball.dx < ball.radius) {
                ball.dx = -ball.dx;
            }

            // Wall collision (top)
            if (ball.y + ball.dy < ball.radius) {
                ball.dy = -ball.dy;
            } else if (ball.y + ball.dy > canvas.height - ball.radius) {
                // Paddle collision
                if (ball.x > paddle.x && ball.x < paddle.x + paddle.width) {
                    ball.dy = -ball.dy;
                } else {
                    // Ball missed the paddle, reset position
                    ball.x = canvas.width / 2;
                    ball.y = canvas.height - 30;
                    ball.dx = 3;
                    ball.dy = -3;
                }
            }

            ball.x += ball.dx;
            ball.y += ball.dy;

            animationFrameId = requestAnimationFrame(draw);
        };

        draw();

        // Cleanup function
        container.cleanup = () => {
            cancelAnimationFrame(animationFrameId);
            document.removeEventListener('mousemove', movePaddle);
        };
    };

    const hideOfflineGame = () => {
        const container = document.getElementById('offline-container');
        if (container) {
            if (container.cleanup) {
                container.cleanup();
            }
            container.classList.remove('visible');
            // Remove from DOM after transition ends
            setTimeout(() => {
                container.remove();
            }, 500);
        }
    };

    // --- Event Listeners for Online/Offline Status ---
    window.addEventListener('offline', showOfflineGame);
    window.addEventListener('online', hideOfflineGame);

    // Initial check on load
    if (!navigator.onLine) {
        showOfflineGame();
    }

    // --- New UI element logic ---
    const changePlatformsInterestsBtn = document.querySelector('a[data-translate="change_platforms_interests"]');
    if (changePlatformsInterestsBtn) {
        changePlatformsInterestsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'platforms.html';
        });
    }

    // Profile dropdown functionality
    const profileIcon = document.querySelector('.profile-icon');
    const profileDropdown = document.getElementById('profileDropdown');
    
    if (profileIcon) {
        // Click on the icon itself (not the dropdown) to navigate based on current page
        profileIcon.addEventListener('click', (e) => {
            // If the click is on the icon part (not the dropdown), handle navigation
            if (e.target.closest('.profile-icon') === profileIcon && !e.target.closest('.profile-dropdown')) {
                // Check if user is authenticated
                const isAuthenticated = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
                
                // Check if we're currently on the profile page
                const isOnProfilePage = window.location.pathname.includes('profile.html');
                
                if (isOnProfilePage) {
                    // If on profile page, go back to previous page
                    window.history.back();
                } else if (isAuthenticated) {
                    // If not on profile page and authenticated, go to profile page
                    window.location.href = 'profile.html';
                } else {
                    // If not authenticated, redirect to login
                    window.location.href = 'login.html';
                }
            } else {
                // If click is on dropdown elements, let the default behavior apply
                e.stopPropagation();
            }
        });
    }
    
    // Handle settings link navigation
    const settingsLink = document.querySelector('a[data-translate="settings"]');
    if (settingsLink) {
        settingsLink.addEventListener('click', (e) => {
            // Prevent default behavior to handle the navigation properly
            e.preventDefault();
            
            // Navigate to settings page
            window.location.href = 'settings.html';
        });
    }
    
    // Close dropdown when clicking elsewhere (only if dropdown was opened by click)
    document.addEventListener('click', (e) => {
        if (profileDropdown && !profileIcon.contains(e.target) && !profileDropdown.contains(e.target)) {
            profileDropdown.classList.remove('show');
        }
    });
    

    
    // Function to update profile icon with profile picture if available
    function updateProfileIcon() {
        const profileIcon = document.querySelector('.profile-icon');
        if (!profileIcon) return;
        
        const profilePicture = localStorage.getItem('profilePicture');
        const profileIconSvg = profileIcon.querySelector('svg');
        const profileIconCurrentImg = profileIcon.querySelector('img:not(.profile-photo img)'); // Don't select the profile photo in the profile page content
        
        // Remove current image if exists (but not the profile photo in the profile form)
        if (profileIconCurrentImg) {
            profileIconCurrentImg.remove();
        }
        
        if (profilePicture) {
            // Create new image element
            const img = document.createElement('img');
            img.src = profilePicture;
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'cover';
            img.style.borderRadius = '50%'; // Make sure it's circular
            
            // Add the image to the profile icon container
            // Insert it before the dropdown if it exists, otherwise at the end
            const dropdown = profileIcon.querySelector('.profile-dropdown');
            if (dropdown) {
                profileIcon.insertBefore(img, dropdown);
            } else {
                profileIcon.appendChild(img);
            }
            
            // Remove the SVG if we're adding an image
            if (profileIconSvg) {
                profileIconSvg.remove();
            }
        } else {
            // If no profile picture, ensure the default SVG is present
            if (!profileIcon.querySelector('svg')) {
                const svg = document.createElement('svg');
                svg.setAttribute('width', '100%');
                svg.setAttribute('height', '100%');
                svg.setAttribute('viewBox', '0 0 24 24');
                svg.setAttribute('fill', 'none');
                svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
                
                svg.innerHTML = `
                    <circle cx="12" cy="8" r="4" fill="currentColor"/>
                    <path d="M20 20C20 17.9231 20 16.3077 19.1304 15.1538C18.3643 14.133 17.133 13.6357 16 13.5C14.4615 13.5 13.2308 13.5 12 13.5C10.7692 13.5 9.53846 13.5 8 13.5C6.86704 13.6357 5.63571 14.133 4.86957 15.1538C4 16.3077 4 17.9231 4 20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                `;
                
                // Insert SVG before dropdown if it exists
                const dropdown = profileIcon.querySelector('.profile-dropdown');
                if (dropdown) {
                    profileIcon.insertBefore(svg, dropdown);
                } else {
                    profileIcon.appendChild(svg);
                }
            }
        }
    }
    
    // Function to update profile dropdown content based on auth status
    function updateProfileDropdown() {
        if (!profileDropdown) return;
        
        const isAuthenticated = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        const isOnProfilePage = window.location.pathname.includes('profile.html');
        
        if (isAuthenticated) {
            // User is authenticated - show profile options
            if (isOnProfilePage) {
                // When on profile page, show back option instead of additional logout
                profileDropdown.innerHTML = `
                    <a href="profile.html" data-translate="edit_profile">Edit Profile</a>
                    <div class="divider"></div>
                    <a href="#" id="backBtn" data-translate="back">Back</a>
                    <a href="#" id="logoutDropdownBtn" data-translate="logout">Logout</a>
                `;
            } else {
                // On other pages, show edit profile and logout options
                profileDropdown.innerHTML = `
                    <a href="profile.html" data-translate="edit_profile">Edit Profile</a>
                    <div class="divider"></div>
                    <a href="#" id="logoutDropdownBtn" data-translate="logout">Logout</a>
                `;
            }
            
            // Add event listener to logout button in dropdown
            const logoutBtn = document.getElementById('logoutDropdownBtn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    handleLogout();
                });
            }
            
            // Add event listener to back button if on profile page
            const backBtn = document.getElementById('backBtn');
            if (backBtn && isOnProfilePage) {
                backBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    window.history.back();
                });
            }
        } else {
            // User is not authenticated - show auth options
            profileDropdown.innerHTML = `
                <a href="login.html" data-translate="login">Login</a>
                <a href="register.html" data-translate="register">Register</a>
            `;
        }
        
        // Apply translations to dropdown items
        const dropdownLinks = profileDropdown.querySelectorAll('a');
        dropdownLinks.forEach(link => {
            const key = link.getAttribute('data-translate');
            if (key) {
                const currentLang = localStorage.getItem('language') || 'ru';
                let translations = {};
                if (currentLang === 'ru') {
                    translations = { edit_profile: 'Редактировать профиль', logout: 'Выйти', back: 'Вернуться', login: 'Войти', register: 'Зарегистрироваться' };
                } else if (currentLang === 'be') { 
                    translations = { edit_profile: 'Рэдагаваць профіль', logout: 'Выйсці', back: 'Вярнуцца', login: 'Увайсці', register: 'Зарэгістравацца' };
                } else {
                    translations = { edit_profile: 'Edit Profile', logout: 'Logout', back: 'Back', login: 'Login', register: 'Register' };
                }
                
                link.textContent = translations[key] || key;
            }
        });
    }
    
    // Initialize profile dropdown with correct content
    if (profileDropdown) {
        updateProfileDropdown();
    }
    
    // Initialize profile icon with profile picture if available
    updateProfileIcon();
    
    // Listen for changes to profile picture in localStorage
    window.addEventListener('storage', function(e) {
        if (e.key === 'profilePicture') {
            updateProfileIcon();
        }
    });
    

});

// Function to apply saved theme settings globally
function applySavedTheme() {
    // Define CSS custom properties and their corresponding localStorage keys
    const themeSettings = {
        '--background-color': 'cssprop--background-color',
        '--text-color': 'cssprop--text-color',
        '--accent-color': 'cssprop--accent-color',
        '--header-color': 'cssprop--header-color',
        '--footer-color': 'cssprop--footer-color',
        '--card-background-color': 'cssprop--card-background-color',
        '--background-gradient-1': 'cssprop--background-gradient-1',
        '--background-gradient-2': 'cssprop--background-gradient-2',
        '--background-gradient-3': 'cssprop--background-gradient-3',
        '--background-gradient-4': 'cssprop--background-gradient-4',
        '--background-gradient': 'cssprop--background-gradient',
        '--main-font': 'cssprop--main-font',
        '--font-size': 'cssprop--font-size',
        '--header-font': 'cssprop--header-font',
        '--link-color': 'cssprop--link-color',
        '--button-color': 'cssprop--button-color',
        '--button-text-color': 'cssprop--button-text-color'
    };
    
    // Apply each saved theme property to the document root
    Object.keys(themeSettings).forEach(prop => {
        const savedValue = localStorage.getItem(themeSettings[prop]);
        if (savedValue) {
            document.documentElement.style.setProperty(prop, savedValue);
        }
    });
    
    // Also update body styles if needed
    const backgroundColor = localStorage.getItem('cssprop--background-color');
    const textColor = localStorage.getItem('cssprop--text-color');
    const mainFont = localStorage.getItem('cssprop--main-font');
    const backgroundGradient = localStorage.getItem('cssprop--background-gradient');
    
    if (backgroundColor) document.body.style.backgroundColor = backgroundColor;
    if (textColor) document.body.style.color = textColor;
    if (mainFont) document.body.style.fontFamily = mainFont;
    if (backgroundGradient) {
        document.body.style.background = backgroundGradient;
        document.body.style.backgroundSize = '400% 400%';
    }
}

// Listen for changes to theme settings in localStorage and apply them immediately
window.addEventListener('storage', function(e) {
    // Check if the changed item is a theme-related property
    const themeProps = [
        'cssprop--background-color', 'cssprop--text-color', 'cssprop--accent-color', 
        'cssprop--header-color', 'cssprop--footer-color', 'cssprop--card-background-color',
        'cssprop--background-gradient-1', 'cssprop--background-gradient-2', 
        'cssprop--background-gradient-3', 'cssprop--background-gradient-4',
        'cssprop--background-gradient',
        'cssprop--main-font', 'cssprop--font-size', 'cssprop--header-font', 
        'cssprop--link-color', 'cssprop--button-color', 'cssprop--button-text-color'
    ];
    
    if (themeProps.includes(e.key)) {
        // Apply the theme again when a theme-related setting changes
        applySavedTheme();
    }
});