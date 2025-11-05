const startButton = document.getElementById('startButton');
let idleTimer;


function stopFloating(callback) {
    // Only act if the button is actually floating.
    if (!startButton.classList.contains('floating')) {
        // If not floating, just run the callback if it exists.
        if (callback) {
            callback();
        }
        return;
    }

    // Get the button's current on-screen position.
    const computedStyle = window.getComputedStyle(startButton);
    const currentTransform = computedStyle.transform;

    // This function will be called when the return transition animation ends.
    const onTransitionEnd = () => {
        // Clean up the inline style so it doesn't interfere with the floating animation later.
        startButton.style.transform = '';
        // If there's a callback (like navigating to the next page), run it.
        if (callback) {
            callback();
        }
        // Important: remove the event listener to avoid it firing multiple times.
        startButton.removeEventListener('transitionend', onTransitionEnd);
    };
    startButton.addEventListener('transitionend', onTransitionEnd, { once: true });

    // 1. Remove the 'floating' class to stop the @keyframes animation.
    startButton.classList.remove('floating');
    
    // 2. Immediately apply its current position as an inline style. This "freezes" it in place.
    startButton.style.transform = currentTransform;

    // 3. !!! IMPORTANT PART !!!
    // We force the browser to apply the style change above by reading a layout property.
    // This is a trick to prevent the jerky snap. It ensures the "freeze" frame is rendered.
    startButton.offsetHeight; 

    // 4. Now, set the transform to the target position (the center).
    // Because of the `transition` property in the CSS, this change will be animated smoothly.
    startButton.style.transform = 'translate(0, 0)';
}

// This function resets the idle timer. It's called on any user activity.
function resetIdleTimer() {
    // Smoothly stop the floating animation.
    stopFloating();
    
    // Clear the previous timer.
    clearTimeout(idleTimer);
    
    // Set a new timer to make the button float again after 3 seconds of inactivity.
    idleTimer = setTimeout(() => {
        startButton.classList.add('floating');
    }, 3000);
}



// Event Listeners for user activity
window.addEventListener('mousemove', resetIdleTimer, { passive: true });
window.addEventListener('mousedown', resetIdleTimer);
window.addEventListener('keypress', resetIdleTimer);
window.addEventListener('touchstart', resetIdleTimer, { passive: true });

// Click handler for the start button
startButton.addEventListener('click', function(event) {
    event.preventDefault(); // Prevent the browser from navigating immediately.
    
    const proceed = () => {
        const isAuthenticated = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        if (isAuthenticated) {
            window.location.href = 'main.html';
        } else {
            window.location.href = 'platforms.html';
        }
    };

    // Use our function to stop the floating and navigate after the animation.
    stopFloating(proceed);
});

document.addEventListener('DOMContentLoaded', () => {
    const lang = getLanguage();
    applyTranslations(lang);
});

// Initial setup when the page loads.
resetIdleTimer();
