document.addEventListener('DOMContentLoaded', () => {
    // Initialize counters
    let userCookies = 0;
    let userTea = 0;
    let totalCookies = 0;
    let totalTea = 0;
    
    // Get DOM elements
    const userCookiesEl = document.getElementById('user-cookies');
    const userTeaEl = document.getElementById('user-tea');
    const totalCookiesEl = document.getElementById('total-cookies');
    const totalTeaEl = document.getElementById('total-tea');
    const cookieButton = document.getElementById('cookie-button');
    const teaButton = document.getElementById('tea-button');
    const messageEl = document.getElementById('message');
    
    // Load saved data from localStorage
    function loadSavedData() {
        const savedUserCookies = localStorage.getItem('donate_user_cookies');
        const savedUserTea = localStorage.getItem('donate_user_tea');
        const savedTotalCookies = localStorage.getItem('donate_total_cookies');
        const savedTotalTea = localStorage.getItem('donate_total_tea');
        
        userCookies = savedUserCookies ? parseInt(savedUserCookies) : 0;
        userTea = savedUserTea ? parseInt(savedUserTea) : 0;
        totalCookies = savedTotalCookies ? parseInt(savedTotalCookies) : 0;
        totalTea = savedTotalTea ? parseInt(savedTotalTea) : 0;
        
        updateDisplay();
    }
    
    // Save data to localStorage
    function saveData() {
        localStorage.setItem('donate_user_cookies', userCookies.toString());
        localStorage.setItem('donate_user_tea', userTea.toString());
        localStorage.setItem('donate_total_cookies', totalCookies.toString());
        localStorage.setItem('donate_total_tea', totalTea.toString());
    }
    
    // Update display with current values
    function updateDisplay() {
        userCookiesEl.textContent = userCookies;
        userTeaEl.textContent = userTea;
        totalCookiesEl.textContent = totalCookies;
        totalTeaEl.textContent = totalTea;
    }
    
    // Function to handle cookie click
    function handleCookieClick() {
        userCookies++;
        totalCookies++;
        
        // Add animation effect
        cookieButton.style.transform = 'scale(0.9)';
        setTimeout(() => {
            cookieButton.style.transform = 'scale(1)';
        }, 100);
        
        updateDisplay();
        saveData();
        
        // Show message
        showMessage('cookie');
    }
    
    // Function to handle tea click
    function handleTeaClick() {
        userTea++;
        totalTea++;
        
        // Add animation effect
        teaButton.style.transform = 'scale(0.9)';
        setTimeout(() => {
            teaButton.style.transform = 'scale(1)';
        }, 100);
        
        updateDisplay();
        saveData();
        
        // Show message
        showMessage('tea');
    }
    
    // Show message based on what was clicked
    function showMessage(item) {
        const messages = {
            cookie: {
                ru: 'Вы кликнули на печенюшку!',
                en: 'You clicked on a cookie!',
                be: 'Вы клікнулі па пячэнні!'
            },
            tea: {
                ru: 'Вы кликнули на чай!',
                en: 'You clicked on tea!',
                be: 'Вы клікнулі па чаю!'
            }
        };
        
        const currentLang = localStorage.getItem('language') || 'ru';
        const langMessages = messages[item];
        
        messageEl.textContent = langMessages[currentLang] || langMessages.en;
        
        // Reset message after delay
        setTimeout(() => {
            const defaultMessage = {
                ru: 'Кликайте на печеньки и чай!',
                en: 'Click on the cookies and tea!',
                be: 'Націскайце на пячэнні і чай!'
            };
            
            messageEl.textContent = defaultMessage[currentLang] || defaultMessage.en;
        }, 2000);
    }
    
    // Initialize the page
    loadSavedData();
    
    // Add event listeners with error checking
    if (cookieButton) {
        cookieButton.addEventListener('click', handleCookieClick);
        console.log('Cookie button event listener added');
    } else {
        console.error('Cookie button not found!');
    }
    
    if (teaButton) {
        teaButton.addEventListener('click', handleTeaClick);
        console.log('Tea button event listener added');
    } else {
        console.error('Tea button not found!');
    }
    
    // Apply translations when the page loads
    const currentLang = localStorage.getItem('language') || 'ru';
    applyTranslations(currentLang);
    
    // Listen for language change events
    document.addEventListener('languageChanged', async () => {
        const lang = localStorage.getItem('language') || 'ru';
        await applyTranslations(lang);
        updateDisplay(); // Update the display in case translations changed
    });
    
    // Initial message using the existing currentLang variable
    const initialMessage = {
        ru: 'Кликайте на печеньки и чай!',
        en: 'Click on the cookies and tea!',
        be: 'Націскайце на пячэнні і чай!'
    };
    messageEl.textContent = initialMessage[currentLang] || initialMessage.en;
});