document.addEventListener('DOMContentLoaded', () => {
    // Load saved settings on page load
    loadSettings();
    
    // Add event listeners to all color and font inputs
    setupEventListeners();
    
    // Add event listeners to theme presets
    setupThemePresets();
    
    // Add event listener to save button
    document.getElementById('saveSettings').addEventListener('click', saveSettings);
    
    // Add event listener to back button
    const backButton = document.getElementById('backButton');
    if (backButton) {
        backButton.addEventListener('click', () => {
            // Apply the current theme globally before navigating back
            applyThemeGlobally();
            window.history.back();
        });
    }
    
    // Initialize the theme preview
    updateThemePreview();
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
        case 'backgroundGradient1':
            document.documentElement.style.setProperty('--background-gradient-1', value);
            updateBackgroundGradient();
            break;
        case 'backgroundGradient2':
            document.documentElement.style.setProperty('--background-gradient-2', value);
            updateBackgroundGradient();
            break;
        case 'backgroundGradient3':
            document.documentElement.style.setProperty('--background-gradient-3', value);
            updateBackgroundGradient();
            break;
        case 'backgroundGradient4':
            document.documentElement.style.setProperty('--background-gradient-4', value);
            updateBackgroundGradient();
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
        case 'headerTextColor':
            document.documentElement.style.setProperty('--header-text-color', value);
            break;
        case 'mainTextColor':
            document.documentElement.style.setProperty('--main-text-color', value);
            break;
        case 'hintTextColor':
            document.documentElement.style.setProperty('--hint-text-color', value);
            break;
    }
    
    // Store the setting in localStorage
    localStorage.setItem(`setting_${settingName}`, value);
    
    // Update the theme preview
    updateThemePreview();
}

// Function to update the background gradient based on all gradient colors
function updateBackgroundGradient() {
    const grad1 = localStorage.getItem('setting_backgroundGradient1') || '#ff9a9e';
    const grad2 = localStorage.getItem('setting_backgroundGradient2') || '#fad0c4';
    const grad3 = localStorage.getItem('setting_backgroundGradient3') || '#a1c4fd';
    const grad4 = localStorage.getItem('setting_backgroundGradient4') || '#c2e9fb';
    
    const gradientValue = `linear-gradient(-45deg, ${grad1}, ${grad2}, ${grad3}, ${grad4})`;
    document.documentElement.style.setProperty('--background-gradient', gradientValue);
    document.body.style.background = gradientValue;
    document.body.style.backgroundSize = '400% 400%';
}

// Update the theme preview based on current settings
function updateThemePreview() {
    const backgroundColor = document.getElementById('backgroundColor')?.value || '#ffffff';
    const textColor = document.getElementById('textColor')?.value || '#333333';
    const headerColor = document.getElementById('headerColor')?.value || '#f8f9fa';
    const footerColor = document.getElementById('footerColor')?.value || '#e9ecef';
    const cardBackgroundColor = document.getElementById('cardBackgroundColor')?.value || '#ffffff';
    const backgroundGradient1 = document.getElementById('backgroundGradient1')?.value || '#ff9a9e';
    const backgroundGradient2 = document.getElementById('backgroundGradient2')?.value || '#fad0c4';
    const backgroundGradient3 = document.getElementById('backgroundGradient3')?.value || '#a1c4fd';
    const backgroundGradient4 = document.getElementById('backgroundGradient4')?.value || '#c2e9fb';
    const mainFont = document.getElementById('mainFont')?.value || "'Nunito', 'Poppins', 'Segoe UI', Arial, sans-serif";
    const fontSize = document.getElementById('fontSize')?.value || '16px';
    const headerFont = document.getElementById('headerFont')?.value || "'Nunito', 'Poppins', 'Segoe UI', Arial, sans-serif";
    const headerTextColor = document.getElementById('headerTextColor')?.value || '#333333';
    const mainTextColor = document.getElementById('mainTextColor')?.value || '#333333';
    const hintTextColor = document.getElementById('hintTextColor')?.value || '#6c757d';
    const linkColor = document.getElementById('linkColor')?.value || '#007bff';
    const buttonColor = document.getElementById('buttonColor')?.value || '#a1c4fd';
    const buttonTextColor = document.getElementById('buttonTextColor')?.value || '#ffffff';
    
    // Update preview elements
    const previewContent = document.getElementById('previewContent');
    const previewHeader = document.getElementById('previewHeader');
    const previewFooter = document.getElementById('previewFooter');
    const previewCard = document.getElementById('previewCard');
    const previewButton = document.getElementById('previewButton');
    
    if (previewContent) {
        // Create a combined background that matches the main page
        const previewBackground = backgroundColor !== '#ffffff' 
            ? backgroundColor 
            : `linear-gradient(-45deg, ${backgroundGradient1}, ${backgroundGradient2}, ${backgroundGradient3}, ${backgroundGradient4})`;
        previewContent.style.background = previewBackground;
        previewContent.style.backgroundSize = '400% 400%';
        previewContent.style.color = mainTextColor || textColor;
        previewContent.style.fontFamily = mainFont;
        previewContent.style.fontSize = fontSize;
    }
    
    if (previewHeader) {
        previewHeader.style.backgroundColor = headerColor;
        previewHeader.style.color = headerTextColor;
    }
    
    if (previewFooter) {
        previewFooter.style.backgroundColor = footerColor;
    }
    
    if (previewCard) {
        previewCard.style.backgroundColor = cardBackgroundColor;
        previewCard.style.color = mainTextColor || textColor;
        previewCard.style.fontFamily = mainFont;
    }
    
    if (previewButton) {
        previewButton.style.backgroundColor = buttonColor;
        previewButton.style.color = buttonTextColor;
        previewButton.style.fontFamily = mainFont;
    }
    
    // Also update any links in the preview
    const previewLinks = document.querySelectorAll('#previewContent a');
    previewLinks.forEach(link => {
        link.style.color = linkColor;
    });
    
    // Update preview header text color
    const previewTitle = document.querySelector('#previewContent h3');
    if (previewTitle) {
        previewTitle.style.color = headerTextColor;
    }
    
    // Update preview text color
    const previewText = document.querySelector('#previewContent p');
    if (previewText) {
        previewText.style.color = mainTextColor || textColor;
    }
}

function loadSettings() {
    // Define all possible settings
    const settings = [
        'backgroundColor', 'textColor', 'accentColor', 'headerColor', 
        'footerColor', 'cardBackgroundColor', 'backgroundGradient1',
        'backgroundGradient2', 'backgroundGradient3', 'backgroundGradient4',
        'mainFont', 'fontSize', 'headerFont', 'linkColor', 
        'buttonColor', 'buttonTextColor', 'headerTextColor',
        'mainTextColor', 'hintTextColor'
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
                let event;
                if (inputElement.type === 'select-one') {
                    event = new Event('change', { bubbles: true });
                } else {
                    event = new Event('input', { bubbles: true });
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
        '--background-gradient-1': localStorage.getItem('cssprop--background-gradient-1'),
        '--background-gradient-2': localStorage.getItem('cssprop--background-gradient-2'),
        '--background-gradient-3': localStorage.getItem('cssprop--background-gradient-3'),
        '--background-gradient-4': localStorage.getItem('cssprop--background-gradient-4'),
        '--background-gradient': localStorage.getItem('cssprop--background-gradient'),
        '--main-font': localStorage.getItem('cssprop--main-font'),
        '--font-size': localStorage.getItem('cssprop--font-size'),
        '--header-font': localStorage.getItem('cssprop--header-font'),
        '--header-text-color': localStorage.getItem('cssprop--header-text-color'),
        '--main-text-color': localStorage.getItem('cssprop--main-text-color'),
        '--hint-text-color': localStorage.getItem('cssprop--hint-text-color'),
        '--link-color': localStorage.getItem('cssprop--link-color'),
        '--button-color': localStorage.getItem('cssprop--button-color'),
        '--button-text-color': localStorage.getItem('cssprop--button-text-color')
    };
    
    for (const [prop, value] of Object.entries(cssProps)) {
        if (value) {
            document.documentElement.style.setProperty(prop, value);
        }
    }
    
    // Update the theme preview after loading settings
    setTimeout(updateThemePreview, 0);
}

function saveSettings() {
    // Save all current settings to localStorage
    const inputs = document.querySelectorAll('input[type="color"], select');
    inputs.forEach(input => {
        localStorage.setItem(`setting_${input.name}`, input.value);
    });
    
    // Apply the current theme globally to the entire project
    applyThemeGlobally();
    
    // Save current CSS custom properties to apply globally
    const cssProps = [
        '--background-color', '--text-color', '--accent-color', 
        '--header-color', '--footer-color', '--card-background-color',
        '--background-gradient-1', '--background-gradient-2', 
        '--background-gradient-3', '--background-gradient-4',
        '--background-gradient',
        '--main-font', '--font-size', '--header-font', 
        '--link-color', '--button-color', '--button-text-color',
        '--header-text-color', '--main-text-color', '--hint-text-color'
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

// Function to apply the theme globally across the entire project
function applyThemeGlobally() {
    // Get the current values from the input fields and apply them globally
    const settings = {
        'backgroundColor': '--background-color',
        'textColor': '--text-color',
        'accentColor': '--accent-color',
        'headerColor': '--header-color',
        'footerColor': '--footer-color',
        'cardBackgroundColor': '--card-background-color',
        'backgroundGradient1': '--background-gradient-1',
        'backgroundGradient2': '--background-gradient-2',
        'backgroundGradient3': '--background-gradient-3',
        'backgroundGradient4': '--background-gradient-4',
        'mainFont': '--main-font',
        'fontSize': '--font-size',
        'headerFont': '--header-font',
        'linkColor': '--link-color',
        'buttonColor': '--button-color',
        'buttonTextColor': '--button-text-color',
        'headerTextColor': '--header-text-color',
        'mainTextColor': '--main-text-color',
        'hintTextColor': '--hint-text-color'
    };
    
    // Apply CSS custom properties to document root so they affect the entire project
    Object.keys(settings).forEach(key => {
        const inputElement = document.querySelector(`[name="${key}"]`);
        if (inputElement) {
            const currentValue = inputElement.value;
            document.documentElement.style.setProperty(settings[key], currentValue);
        }
    });
    
    // Also update the background gradient
    updateBackgroundGradient();
}

// Note: The resetSettings function is kept for potential future use,
// but it's no longer called since the reset button was removed
function resetSettings() {
    // Reset all inputs to default values
    document.getElementById('backgroundColor').value = '#ffffff';
    document.getElementById('textColor').value = '#333333';
    document.getElementById('accentColor').value = '#a1c4fd';
    document.getElementById('headerColor').value = '#f8f9fa';
    document.getElementById('footerColor').value = '#e9ecef';
    document.getElementById('cardBackgroundColor').value = '#ffffff';
    document.getElementById('backgroundGradient1').value = '#ff9a9e';
    document.getElementById('backgroundGradient2').value = '#fad0c4';
    document.getElementById('backgroundGradient3').value = '#a1c4fd';
    document.getElementById('backgroundGradient4').value = '#c2e9fb';
    document.getElementById('mainFont').value = "'Nunito', 'Poppins', 'Segoe UI', Arial, sans-serif";
    document.getElementById('fontSize').value = '16px';
    document.getElementById('headerFont').value = "'Nunito', 'Poppins', 'Segoe UI', Arial, sans-serif";
    document.getElementById('headerTextColor').value = '#333333';
    document.getElementById('mainTextColor').value = '#333333';
    document.getElementById('hintTextColor').value = '#6c757d';
    document.getElementById('linkColor').value = '#007bff';
    document.getElementById('buttonColor').value = '#a1c4fd';
    document.getElementById('buttonTextColor').value = '#ffffff';
    
    // Apply all default settings
    const inputs = document.querySelectorAll('input[type="color"], select');
    inputs.forEach(input => {
        let event;
        if (input.type === 'select-one') {
            event = new Event('change', { bubbles: true });
        } else {
            event = new Event('input', { bubbles: true });
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
    
    // Update the theme preview after resetting
    updateThemePreview();
    
    // Reset CSS custom properties to defaults
    document.documentElement.style.setProperty('--background-color', '#ffffff');
    document.documentElement.style.setProperty('--text-color', '#333333');
    document.documentElement.style.setProperty('--accent-color', '#a1c4fd');
    document.documentElement.style.setProperty('--header-color', '#f8f9fa');
    document.documentElement.style.setProperty('--footer-color', '#e9ecef');
    document.documentElement.style.setProperty('--card-background-color', '#ffffff');
    document.documentElement.style.setProperty('--background-gradient-1', '#ff9a9e');
    document.documentElement.style.setProperty('--background-gradient-2', '#fad0c4');
    document.documentElement.style.setProperty('--background-gradient-3', '#a1c4fd');
    document.documentElement.style.setProperty('--background-gradient-4', '#c2e9fb');
    document.documentElement.style.setProperty('--main-font', "'Nunito', 'Poppins', 'Segoe UI', Arial, sans-serif");
    document.documentElement.style.setProperty('--font-size', '16px');
    document.documentElement.style.setProperty('--header-font', "'Nunito', 'Poppins', 'Segoe UI', Arial, sans-serif");
    document.documentElement.style.setProperty('--header-text-color', '#333333');
    document.documentElement.style.setProperty('--main-text-color', '#333333');
    document.documentElement.style.setProperty('--hint-text-color', '#6c757d');
    document.documentElement.style.setProperty('--link-color', '#007bff');
    document.documentElement.style.setProperty('--button-color', '#a1c4fd');
    document.documentElement.style.setProperty('--button-text-color', '#ffffff');
    
    // Update background gradient
    updateBackgroundGradient();
    
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
                backgroundGradient1: '#ff9a9e',
                backgroundGradient2: '#fad0c4',
                backgroundGradient3: '#a1c4fd',
                backgroundGradient4: '#c2e9fb',
                mainFont: "'Nunito', 'Poppins', 'Segoe UI', Arial, sans-serif",
                fontSize: '16px',
                headerFont: "'Nunito', 'Poppins', 'Segoe UI', Arial, sans-serif",
                headerTextColor: '#333333',
                mainTextColor: '#333333',
                hintTextColor: '#6c757d',
                linkColor: '#007bff',
                buttonColor: '#a1c4fd',
                buttonTextColor: '#ffffff'
            };
            break;
        case 'dark':
            settings = {
                backgroundColor: '#121212',
                textColor: '#ffffff', // Changed to white text
                accentColor: '#9e9e9e', // Changed to grey
                headerColor: '#1e1e1e',
                footerColor: '#2d2d2d',
                cardBackgroundColor: '#1e1e1e',
                backgroundGradient1: '#121212',
                backgroundGradient2: '#1e1e1e',
                backgroundGradient3: '#2d2d2d',
                backgroundGradient4: '#434343',
                mainFont: "'Nunito', 'Poppins', 'Segoe UI', Arial, sans-serif", // Changed to Nunito font
                fontSize: '16px',
                headerFont: "'Nunito', 'Poppins', 'Segoe UI', Arial, sans-serif", // Changed to Nunito font
                headerTextColor: '#ffffff',
                mainTextColor: '#ffffff',
                hintTextColor: '#95a5a6',
                linkColor: '#9e9e9e', // Changed to grey
                buttonColor: '#9e9e9e', // Changed to grey
                buttonTextColor: '#000000' // Keep black text on buttons for contrast
            };
            break;
        case 'blue':
            settings = {
                backgroundColor: '#e3f2fd',
                textColor: '#000000', // Changed to black text
                accentColor: '#1976d2',
                headerColor: '#bbdefb',
                footerColor: '#90caf9',
                cardBackgroundColor: '#ffffff',
                backgroundGradient1: '#e3f2fd',
                backgroundGradient2: '#bbdefb',
                backgroundGradient3: '#90caf9',
                backgroundGradient4: '#c5e1ff',
                mainFont: "'Nunito', 'Poppins', 'Segoe UI', Arial, sans-serif", // Changed to Nunito font
                fontSize: '16px',
                headerFont: "'Nunito', 'Poppins', 'Segoe UI', Arial, sans-serif", // Changed to Nunito font
                headerTextColor: '#1976d2',
                mainTextColor: '#000000',
                hintTextColor: '#64b5f6',
                linkColor: '#1976d2',
                buttonColor: '#2196f3',
                buttonTextColor: '#ffffff'
            };
            break;
        case 'green':
            settings = {
                backgroundColor: '#e8f5e9',
                textColor: '#000000', // Changed to black text
                accentColor: '#4caf50',
                headerColor: '#c8e6c9',
                footerColor: '#a5d6a7',
                cardBackgroundColor: '#ffffff',
                backgroundGradient1: '#e8f5e9',
                backgroundGradient2: '#c8e6c9',
                backgroundGradient3: '#a5d6a7',
                backgroundGradient4: '#81c784',
                mainFont: "'Nunito', 'Poppins', 'Segoe UI', Arial, sans-serif", // Changed to Nunito font
                fontSize: '16px',
                headerFont: "'Nunito', 'Poppins', 'Segoe UI', Arial, sans-serif", // Changed to Nunito font
                headerTextColor: '#4caf50',
                mainTextColor: '#000000',
                hintTextColor: '#81c784',
                linkColor: '#4caf50',
                buttonColor: '#8bc34a',
                buttonTextColor: '#ffffff'
            };
            break;
        case 'sunset':
            settings = {
                backgroundColor: '#ffecd2',
                textColor: '#000000', // Changed to black text
                accentColor: '#ff9800',
                headerColor: '#ffccbc',
                footerColor: '#ffab91',
                cardBackgroundColor: '#ffefe0',
                backgroundGradient1: '#ffecd2',
                backgroundGradient2: '#ffccbc',
                backgroundGradient3: '#ffab91',
                backgroundGradient4: '#ff8a65',
                mainFont: "'Nunito', 'Poppins', 'Segoe UI', Arial, sans-serif", // Changed to Nunito font
                fontSize: '16px',
                headerFont: "'Nunito', 'Poppins', 'Segoe UI', Arial, sans-serif", // Changed to Nunito font
                headerTextColor: '#ff9800',
                mainTextColor: '#000000',
                hintTextColor: '#ff8a65',
                linkColor: '#e65100',
                buttonColor: '#ff9800',
                buttonTextColor: '#ffffff'
            };
            break;
        case 'red':
            settings = {
                backgroundColor: '#ffebee',
                textColor: '#000000', // Black text
                accentColor: '#f44336',
                headerColor: '#ffcdd2',
                footerColor: '#ef9a9a',
                cardBackgroundColor: '#ffffff',
                backgroundGradient1: '#ffebee',
                backgroundGradient2: '#ffcdd2',
                backgroundGradient3: '#ef9a9a',
                backgroundGradient4: '#e57373',
                mainFont: "'Nunito', 'Poppins', 'Segoe UI', Arial, sans-serif", // Nunito font
                fontSize: '16px',
                headerFont: "'Nunito', 'Poppins', 'Segoe UI', Arial, sans-serif", // Nunito font
                headerTextColor: '#f44336',
                mainTextColor: '#000000',
                hintTextColor: '#e57373',
                linkColor: '#d32f2f',
                buttonColor: '#f44336',
                buttonTextColor: '#ffffff'
            };
            break;
        case 'purple':
            settings = {
                backgroundColor: '#f3e5f5',
                textColor: '#000000', // Black text
                accentColor: '#9c27b0',
                headerColor: '#e1bee7',
                footerColor: '#ce93d8',
                cardBackgroundColor: '#ffffff',
                backgroundGradient1: '#f3e5f5',
                backgroundGradient2: '#e1bee7',
                backgroundGradient3: '#ce93d8',
                backgroundGradient4: '#ba68c8',
                mainFont: "'Nunito', 'Poppins', 'Segoe UI', Arial, sans-serif", // Nunito font
                fontSize: '16px',
                headerFont: "'Nunito', 'Poppins', 'Segoe UI', Arial, sans-serif", // Nunito font
                headerTextColor: '#9c27b0',
                mainTextColor: '#000000',
                hintTextColor: '#ba68c8',
                linkColor: '#7b1fa2',
                buttonColor: '#9c27b0',
                buttonTextColor: '#ffffff'
            };
            break;
        case 'orange':
            settings = {
                backgroundColor: '#fff3e0',
                textColor: '#000000', // Black text
                accentColor: '#ff9800',
                headerColor: '#ffe0b2',
                footerColor: '#ffcc80',
                cardBackgroundColor: '#ffffff',
                backgroundGradient1: '#fff3e0',
                backgroundGradient2: '#ffe0b2',
                backgroundGradient3: '#ffcc80',
                backgroundGradient4: '#ffb74d',
                mainFont: "'Nunito', 'Poppins', 'Segoe UI', Arial, sans-serif", // Nunito font
                fontSize: '16px',
                headerFont: "'Nunito', 'Poppins', 'Segoe UI', Arial, sans-serif", // Nunito font
                headerTextColor: '#ff9800',
                mainTextColor: '#000000',
                hintTextColor: '#ffb74d',
                linkColor: '#f57c00',
                buttonColor: '#ff9800',
                buttonTextColor: '#000000'
            };
            break;
        case 'teal':
            settings = {
                backgroundColor: '#e0f2f1',
                textColor: '#000000', // Black text
                accentColor: '#009688',
                headerColor: '#b2dfdb',
                footerColor: '#80cbc4',
                cardBackgroundColor: '#ffffff',
                backgroundGradient1: '#e0f2f1',
                backgroundGradient2: '#b2dfdb',
                backgroundGradient3: '#80cbc4',
                backgroundGradient4: '#4db6ac',
                mainFont: "'Nunito', 'Poppins', 'Segoe UI', Arial, sans-serif", // Nunito font
                fontSize: '16px',
                headerFont: "'Nunito', 'Poppins', 'Segoe UI', Arial, sans-serif", // Nunito font
                headerTextColor: '#009688',
                mainTextColor: '#000000',
                hintTextColor: '#4db6ac',
                linkColor: '#00796b',
                buttonColor: '#009688',
                buttonTextColor: '#ffffff'
            };
            break;
        case 'pink':
            settings = {
                backgroundColor: '#fce4ec',
                textColor: '#000000', // Black text
                accentColor: '#e91e63',
                headerColor: '#f8bbd0',
                footerColor: '#f48fb1',
                cardBackgroundColor: '#ffffff',
                backgroundGradient1: '#fce4ec',
                backgroundGradient2: '#f8bbd0',
                backgroundGradient3: '#f48fb1',
                backgroundGradient4: '#f06292',
                mainFont: "'Nunito', 'Poppins', 'Segoe UI', Arial, sans-serif", // Nunito font
                fontSize: '16px',
                headerFont: "'Nunito', 'Poppins', 'Segoe UI', Arial, sans-serif", // Nunito font
                headerTextColor: '#e91e63',
                mainTextColor: '#000000',
                hintTextColor: '#f06292',
                linkColor: '#c2185b',
                buttonColor: '#e91e63',
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
            let event;
            if (inputElement.type === 'select-one') {
                event = new Event('change', { bubbles: true });
            } else {
                event = new Event('input', { bubbles: true });
            }
            inputElement.dispatchEvent(event);
        }
    });
    
    // Update the theme preview after applying theme
    updateThemePreview();
    
    // Apply CSS custom properties to document root so they affect the entire project
    Object.keys(settings).forEach(settingName => {
        const cssVar = settingName.replace(/([A-Z])/g, '-$1').toLowerCase(); // Convert camelCase to kebab-case
        let cssProp = `--${cssVar}`;
        
        // Special case mappings for some variables
        if (settingName === 'mainFont') cssProp = '--main-font';
        else if (settingName === 'headerFont') cssProp = '--header-font';
        else if (settingName === 'fontSize') cssProp = '--font-size';
        else if (settingName === 'linkColor') cssProp = '--link-color';
        else if (settingName === 'buttonColor') cssProp = '--button-color';
        else if (settingName === 'buttonTextColor') cssProp = '--button-text-color';
        else if (settingName === 'backgroundColor') cssProp = '--background-color';
        else if (settingName === 'textColor') cssProp = '--text-color';
        else if (settingName === 'accentColor') cssProp = '--accent-color';
        else if (settingName === 'headerColor') cssProp = '--header-color';
        else if (settingName === 'footerColor') cssProp = '--footer-color';
        else if (settingName === 'cardBackgroundColor') cssProp = '--card-background-color';
        
        document.documentElement.style.setProperty(cssProp, settings[settingName]);
    });
    
    // Update the background gradient based on the new settings
    updateBackgroundGradient();
    
    // Update body styles to ensure theme is applied properly
    const bg = settings['backgroundColor'];
    const text = settings['textColor'];
    const font = settings['mainFont'];
    
    document.body.style.backgroundColor = bg;
    document.body.style.color = text;
    document.body.style.fontFamily = font;
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