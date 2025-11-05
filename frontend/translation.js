
async function fetchTranslations(lang) {
    const response = await fetch(`${lang}.json`);
    if (!response.ok) {
        throw new Error(`Failed to load translation file for language: ${lang}`);
    }
    return await response.json();
}

async function applyTranslations(lang) {
    try {
        const translations = await fetchTranslations(lang);
        
        // Apply translations for elements with data-translate-key attribute
        document.querySelectorAll('[data-translate-key]').forEach(element => {
            const key = element.getAttribute('data-translate-key');
            if (translations[key]) {
                element.textContent = translations[key];
            }
        });
        
        // Apply translations for elements with data-translate attribute (for menu items)
        document.querySelectorAll('[data-translate]').forEach(element => {
            const key = element.getAttribute('data-translate');
            if (translations[key]) {
                element.textContent = translations[key];
            }
        });
        
        // Update the page title if it has a translation key
        const titleElement = document.querySelector('title[data-translate-key]');
        if (titleElement) {
            const key = titleElement.getAttribute('data-translate-key');
            if (translations[key]) {
                titleElement.textContent = translations[key];
            }
        }
    } catch (error) {
        console.error('Error applying translations:', error);
    }
}

function getLanguage() {
    return localStorage.getItem('language') || 'ru';
}

function setLanguage(lang) {
    localStorage.setItem('language', lang);
}

document.addEventListener('DOMContentLoaded', () => {
    const lang = getLanguage();
    applyTranslations(lang);
});
