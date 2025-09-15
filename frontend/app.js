// Эффект притяжения кнопок к курсору, пока курсор внутри платформенного окна
  const platformWindow = document.querySelector('.platform-window');
  platformWindow.addEventListener('mousemove', e => {
    document.querySelectorAll('.platform-btn').forEach(btn => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - (rect.left + rect.width / 2);
      const y = e.clientY - (rect.top + rect.height / 2);
      const dist = Math.sqrt(x * x + y * y);
      // Чем ближе курсор, тем сильнее притяжение (max 1, min 0.2)
      const force = Math.max(1.2 - dist / 400, 0.2);
      btn.style.transform = `translate(${x * 0.12 * force}px, ${y * 0.12 * force}px)`;
    });
  });
  platformWindow.addEventListener('mouseleave', () => {
    document.querySelectorAll('.platform-btn').forEach(btn => {
      btn.style.transform = '';
    });
  });
  // Эффект притяжения кнопки к курсору
  document.querySelectorAll('.platform-btn').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = `translate(${x * 0.18}px, ${y * 0.18}px)`;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
    });
  });
document.addEventListener('DOMContentLoaded', async () => {
  const buttons = document.querySelectorAll('.platform-btn');
  const platformWindow = document.querySelector('.platform-window');
  const buttonsContainer = document.getElementById('platformButtons');

  let idleTimer;
  let isIdle = false;
  let animationFrameId;
  let buttonsState = [];

  // 1. Initial Chaotic Layout
  buttons.forEach(btn => {
    const x = Math.random() * 30 - 15;
    const y = Math.random() * 30 - 15;
    const rot = Math.random() * 10 - 5;
    const baseTransform = `translate(${x}px, ${y}px) rotate(${rot}deg)`;
    btn.dataset.baseTransform = baseTransform;
    btn.style.transform = baseTransform;
  });

  // 2. Inactivity Detection & Animation Control
  function resetIdleTimer() {
    clearTimeout(idleTimer);
    if (isIdle) {
      stopIdleAnimation();
    }
    isIdle = false;
    idleTimer = setTimeout(() => {
      isIdle = true;
      startIdleAnimation();
    }, 10000); // 10 seconds of inactivity
  }

  function startIdleAnimation() {
    if (animationFrameId) return; // Already running

    // Initialize physics state for each button
    buttonsState = Array.from(buttons).map(btn => {
      const rect = btn.getBoundingClientRect();
      return {
        element: btn,
        x: btn.offsetLeft,
        y: btn.offsetTop,
        vx: Math.random() * 2 - 1, // Random horizontal velocity
        vy: Math.random() * 2 - 1, // Random vertical velocity
        radius: rect.width / 2
      };
    });

    animateButtons();
  }

  function stopIdleAnimation() {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
    buttons.forEach(btn => {
      btn.style.transform = btn.dataset.baseTransform; // Return to calm state
    });
  }

  // 3. Physics Animation Loop
  function animateButtons() {
    const containerRect = buttonsContainer.getBoundingClientRect();

    buttonsState.forEach((p1, i) => {
      // Update position
      p1.x += p1.vx;
      p1.y += p1.vy;

      // Boundary collision
      if (p1.x - p1.radius < 0 || p1.x + p1.radius > containerRect.width) {
        p1.vx *= -1;
      }
      if (p1.y - p1.radius < 0 || p1.y + p1.radius > containerRect.height) {
        p1.vy *= -1;
      }

      // Button-to-button collision
      for (let j = i + 1; j < buttonsState.length; j++) {
        const p2 = buttonsState[j];
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDistance = p1.radius + p2.radius;

        if (distance < minDistance) {
          // Simple collision response: swap velocities
          [p1.vx, p2.vx] = [p2.vx, p1.vx];
          [p1.vy, p2.vy] = [p2.vy, p1.vy];
        }
      }

      // Apply transform
      p1.element.style.transform = `translate(${p1.x - p1.element.offsetLeft}px, ${p1.y - p1.element.offsetTop}px)`;
    });

    if (isIdle) {
      animationFrameId = requestAnimationFrame(animateButtons);
    }
  }

  // 4. Event Listeners
  window.addEventListener('mousemove', resetIdleTimer);
  window.addEventListener('mousedown', resetIdleTimer);
  window.addEventListener('keypress', resetIdleTimer);
  resetIdleTimer(); // Initial call

  // Button selection logic (no changes needed here)
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      btn.classList.toggle('selected');
    });
  });

  // --- The rest of your existing code for form handling etc. ---
  const startForm = document.getElementById('startForm');
  const platformSelectSection = document.getElementById('platformSelectSection');
  const platformsDiv = document.getElementById('platforms');
  const platformForm = document.getElementById('platformForm');
  const userDataSection = document.getElementById('userDataSection');
  const recommendationsSection = document.getElementById('recommendationsSection');

  // This part seems to be for a different flow, I'll keep it but it might need integration
  if (startForm) {
    platformSelectSection.style.display = 'none';
    startForm.addEventListener('submit', (e) => {
      e.preventDefault();
      startForm.style.display = 'none';
      platformSelectSection.style.display = 'block';
      // loadPlatforms(); // Assuming this function exists elsewhere
    });
  }

  if (platformForm) {
    platformForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const selectedPlatforms = Array.from(document.querySelectorAll('.platform-btn.selected')).map(btn => btn.dataset.platform);
      if (selectedPlatforms.length === 0) {
        alert('Выберите хотя бы одну платформу!');
        return;
      }
      // ... proceed with form submission logic
    });
  }
});
