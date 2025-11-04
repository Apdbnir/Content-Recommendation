document.addEventListener('DOMContentLoaded', () => {
    // Load saved settings on page load
    loadSettings();
    
    // Add event listeners to all color and font inputs
    setupEventListeners();
    
    // Add event listeners to theme presets
    setupThemePresets();
    
    // Add event listener to save button
    document.getElementById('saveSettings').addEventListener('click', saveSettings);
    
    // Add event listener to reset button
    document.getElementById('resetSettings').addEventListener('click', resetSettings);
});

function setupEventListeners() {
    // Get all color inputs
    const colorInputs = document.querySelectorAll('input[type="color"]');
    colorInputs.forEach(input => {
        input.addEventListener('input', applySetting);
    });
    
    // Get all select inputs (fonts, sizes)
    const selectInputs = document.querySelectorAll('select');
    selectInputs.forEach(input => {
        input.addEventListener('change', applySetting);
    });
}

function applySetting(event) {
    const settingName = event.target.name;
    const value = event.target.value;
    
    // Apply the setting based on the name
    switch(settingName) {
        case 'backgroundColor':
            document.documentElement.style.setProperty('--background-color', value);
            document.body.style.backgroundColor = value;
            break;
        case 'textColor':
            document.documentElement.style.setProperty('--text-color', value);
            document.body.style.color = value;
            break;
        case 'accentColor':
            document.documentElement.style.setProperty('--accent-color', value);
            break;
        case 'headerColor':
            document.documentElement.style.setProperty('--header-color', value);
            break;
        case 'footerColor':
            document.documentElement.style.setProperty('--footer-color', value);
            break;
        case 'cardBackgroundColor':
            document.documentElement.style.setProperty('--card-background-color', value);
            break;
        case 'mainFont':
            document.documentElement.style.setProperty('--main-font', value);
            document.body.style.fontFamily = value;
            break;
        case 'fontSize':
            document.documentElement.style.setProperty('--font-size', value);
            document.body.style.fontSize = value;
            break;
        case 'headerFont':
            document.documentElement.style.setProperty('--header-font', value);
            break;
        case 'linkColor':
            document.documentElement.style.setProperty('--link-color', value);
            break;
        case 'buttonColor':
            document.documentElement.style.setProperty('--button-color', value);
            break;
        case 'buttonTextColor':
            document.documentElement.style.setProperty('--button-text-color', value);
            break;
    }
    
    // Store the setting in localStorage
    localStorage.setItem(`setting_${settingName}`, value);
}

function loadSettings() {
    // Define all possible settings
    const settings = [
        'backgroundColor', 'textColor', 'accentColor', 'headerColor', 
        'footerColor', 'cardBackgroundColor', 'mainFont', 'fontSize', 
        'headerFont', 'linkColor', 'buttonColor', 'buttonTextColor'
    ];
    
    // Load each setting from localStorage if available
    settings.forEach(setting => {
        const savedValue = localStorage.getItem(`setting_${setting}`);
        if (savedValue) {
            // Set the value in the input field
            const inputElement = document.querySelector(`[name="${setting}"]`);
            if (inputElement) {
                inputElement.value = savedValue;
                
                // Apply the setting
                const event = new Event('input', { bubbles: true });
                if (inputElement.type === 'select-one') {
                    event = new Event('change', { bubbles: true });
                }
                inputElement.dispatchEvent(event);
            }
        }
    });
    
    // Apply saved CSS custom properties if they exist
    const cssProps = {
        '--background-color': localStorage.getItem('cssprop--background-color'),
        '--text-color': localStorage.getItem('cssprop--text-color'),
        '--accent-color': localStorage.getItem('cssprop--accent-color'),
        '--header-color': localStorage.getItem('cssprop--header-color'),
        '--footer-color': localStorage.getItem('cssprop--footer-color'),
        '--card-background-color': localStorage.getItem('cssprop--card-background-color'),
        '--main-font': localStorage.getItem('cssprop--main-font'),
        '--font-size': localStorage.getItem('cssprop--font-size'),
        '--header-font': localStorage.getItem('cssprop--header-font'),
        '--link-color': localStorage.getItem('cssprop--link-color'),
        '--button-color': localStorage.getItem('cssprop--button-color'),
        '--button-text-color': localStorage.getItem('cssprop--button-text-color')
    };
    
    for (const [prop, value] of Object.entries(cssProps)) {
        if (value) {
            document.documentElement.style.setProperty(prop, value);
        }
    }
}

function saveSettings() {
    // Save all current settings to localStorage
    const inputs = document.querySelectorAll('input[type="color"], select');
    inputs.forEach(input => {
        localStorage.setItem(`setting_${input.name}`, input.value);
    });
    
    // Save current CSS custom properties
    const cssProps = [
        '--background-color', '--text-color', '--accent-color', 
        '--header-color', '--footer-color', '--card-background-color',
        '--main-font', '--font-size', '--header-font', 
        '--link-color', '--button-color', '--button-text-color'
    ];
    
    cssProps.forEach(prop => {
        const value = getComputedStyle(document.documentElement).getPropertyValue(prop);
        if (value) {
            localStorage.setItem(`cssprop${prop}`, value.trim());
        }
    });
    
    // Show success message
    showSaveNotification();
}

function resetSettings() {
    // Reset all inputs to default values
    document.getElementById('backgroundColor').value = '#ffffff';
    document.getElementById('textColor').value = '#333333';
    document.getElementById('accentColor').value = '#a1c4fd';
    document.getElementById('headerColor').value = '#f8f9fa';
    document.getElementById('footerColor').value = '#e9ecef';
    document.getElementById('cardBackgroundColor').value = '#ffffff';
    document.getElementById('mainFont').value = 'Arial, sans-serif';
    document.getElementById('fontSize').value = '16px';
    document.getElementById('headerFont').value = 'Arial, sans-serif';
    document.getElementById('linkColor').value = '#007bff';
    document.getElementById('buttonColor').value = '#a1c4fd';
    document.getElementById('buttonTextColor').value = '#ffffff';
    
    // Apply all default settings
    const inputs = document.querySelectorAll('input[type="color"], select');
    inputs.forEach(input => {
        const event = new Event('input', { bubbles: true });
        if (input.type === 'select-one') {
            event = new Event('change', { bubbles: true });
        }
        input.dispatchEvent(event);
    });
    
    // Remove all saved settings from localStorage
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
        if (key.startsWith('setting_') || key.startsWith('cssprop')) {
            localStorage.removeItem(key);
        }
    });
    
    // Show reset notification
    showResetNotification();
}

function setupThemePresets() {
    const presets = document.querySelectorAll('.theme-preset');
    presets.forEach(preset => {
        preset.addEventListener('click', () => {
            const theme = preset.getAttribute('data-theme');
            
            // Remove active class from all presets
            presets.forEach(p => p.classList.remove('active'));
            
            // Add active class to clicked preset
            preset.classList.add('active');
            
            // Apply theme settings based on selected theme
            applyTheme(theme);
        });
    });
}

function applyTheme(theme) {
    let settings = {};
    
    switch(theme) {
        case 'default':
            settings = {
                backgroundColor: '#ffffff',
                textColor: '#333333',
                accentColor: '#a1c4fd',
                headerColor: '#f8f9fa',
                footerColor: '#e9ecef',
                cardBackgroundColor: '#ffffff',
                mainFont: 'Arial, sans-serif',
                fontSize: '16px',
                headerFont: 'Arial, sans-serif',
                linkColor: '#007bff',
                buttonColor: '#a1c4fd',
                buttonTextColor: '#ffffff'
            };
            break;
        case 'dark':
            settings = {
                backgroundColor: '#121212',
                textColor: '#ffffff',
                accentColor: '#bb86fc',
                headerColor: '#1e1e1e',
                footerColor: '#2d2d2d',
                cardBackgroundColor: '#1e1e1e',
                mainFont: 'Arial, sans-serif',
                fontSize: '16px',
                headerFont: 'Arial, sans-serif',
                linkColor: '#bb86fc',
                buttonColor: '#bb86fc',
                buttonTextColor: '#000000'
            };
            break;
        case 'blue':
            settings = {
                backgroundColor: '#e3f2fd',
                textColor: '#1a237e',
                accentColor: '#1976d2',
                headerColor: '#bbdefb',
                footerColor: '#90caf9',
                cardBackgroundColor: '#ffffff',
                mainFont: 'Arial, sans-serif',
                fontSize: '16px',
                headerFont: 'Arial, sans-serif',
                linkColor: '#1976d2',
                buttonColor: '#2196f3',
                buttonTextColor: '#ffffff'
            };
            break;
        case 'green':
            settings = {
                backgroundColor: '#e8f5e9',
                textColor: '#1b5e20',
                accentColor: '#4caf50',
                headerColor: '#c8e6c9',
                footerColor: '#a5d6a7',
                cardBackgroundColor: '#ffffff',
                mainFont: 'Arial, sans-serif',
                fontSize: '16px',
                headerFont: 'Arial, sans-serif',
                linkColor: '#4caf50',
                buttonColor: '#8bc34a',
                buttonTextColor: '#ffffff'
            };
            break;
        case 'sunset':
            settings = {
                backgroundColor: '#ffecd2',
                textColor: '#3e2723',
                accentColor: '#ff9800',
                headerColor: '#ffccbc',
                footerColor: '#ffab91',
                cardBackgroundColor: '#ffefe0',
                mainFont: 'Arial, sans-serif',
                fontSize: '16px',
                headerFont: 'Arial, sans-serif',
                linkColor: '#e65100',
                buttonColor: '#ff9800',
                buttonTextColor: '#ffffff'
            };
            break;
    }
    
    // Apply all settings for the theme
    Object.keys(settings).forEach(settingName => {
        const inputElement = document.querySelector(`[name="${settingName}"]`);
        if (inputElement) {
            inputElement.value = settings[settingName];
            
            // Apply the setting
            const event = new Event('input', { bubbles: true });
            if (inputElement.type === 'select-one') {
                event = new Event('change', { bubbles: true });
            }
            inputElement.dispatchEvent(event);
        }
    });
}

function showSaveNotification() {
    // Remove any existing notifications
    const existingNotification = document.getElementById('settings-notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.id = 'settings-notification';
    notification.className = 'settings-notification success';
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-check-circle"></i>
            <span>Settings saved successfully!</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
    
    // Add click to dismiss
    notification.addEventListener('click', () => {
        notification.style.opacity = '0';
        setTimeout(() => {
            notification.remove();
        }, 300);
    });
}

function showResetNotification() {
    // Remove any existing notifications
    const existingNotification = document.getElementById('settings-notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.id = 'settings-notification';
    notification.className = 'settings-notification info';
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-redo"></i>
            <span>Settings reset to default!</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
    
    // Add click to dismiss
    notification.addEventListener('click', () => {
        notification.style.opacity = '0';
        setTimeout(() => {
            notification.remove();
        }, 300);
    });
}

// Add CSS for the notification to the page
const style = document.createElement('style');
style.textContent = `
    .settings-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 600;
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 10px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        transition: opacity 0.3s ease, transform 0.3s ease;
        cursor: pointer;
        min-width: 250px;
    }
    
    .settings-notification.success {
        background: #28a745;
    }
    
    .settings-notification.info {
        background: #17a2b8;
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        gap: 10px;
    }
    
    .settings-notification i {
        font-size: 1.2rem;
    }
`;
document.head.appendChild(style);