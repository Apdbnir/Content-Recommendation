document.addEventListener('DOMContentLoaded', async () => {
  // Обработка кнопок выбора платформ (работает для всех)
  function updatePlatformButtons() {
    document.querySelectorAll('.platform-btn').forEach(btn => {
      const platform = btn.getAttribute('data-platform');
      const checkbox = document.querySelector(`input[name="platform"][value="${platform}"]`);
      if (checkbox) {
        btn.classList.toggle('selected', checkbox.checked);
      }
    });
  }

  document.querySelectorAll('.platform-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const platform = btn.getAttribute('data-platform');
      const checkbox = document.querySelector(`input[name="platform"][value="${platform}"]`);
      if (checkbox) {
        checkbox.checked = !checkbox.checked;
        updatePlatformButtons();
      }
    });
  });
  const startForm = document.getElementById('startForm');
  const platformSelectSection = document.getElementById('platformSelectSection');
  const platformsDiv = document.getElementById('platforms');
  const platformForm = document.getElementById('platformForm');
  const userDataSection = document.getElementById('userDataSection');
  const recommendationsSection = document.getElementById('recommendationsSection');

  // Fetch platforms from backend с автоматической повторной попыткой
  let platforms = [];
  async function loadPlatforms(retry = 0) {
    try {
      const res = await fetch('http://localhost:3001/api/platforms');
      platforms = await res.json();
    } catch (err) {
      if (retry < 10) {
        platformsDiv.innerHTML = `<div style='color:orange'>Пробуем подключиться к серверу... (${retry+1}/10)</div>`;
        setTimeout(() => loadPlatforms(retry+1), 1000);
        return;
      } else {
        platformsDiv.innerHTML = '<div style="color:red">Ошибка загрузки платформ. Проверьте подключение к серверу!</div>';
        return;
      }
    }
    if (!platforms || platforms.length === 0) {
      platformsDiv.innerHTML = '<div style="color:red">Нет доступных платформ для рекомендаций.</div>';
      return;
    }
    // Render checkboxes for platforms
    platformsDiv.innerHTML = '';
    platforms.forEach(platform => {
      const label = document.createElement('label');
      label.innerHTML = `<input type="checkbox" name="platform" value="${platform.name}"> ${platform.name}`;
      platformsDiv.appendChild(label);
      platformsDiv.appendChild(document.createElement('br'));
    });
  }

  // Скрыть выбор платформ до нажатия 'Далее'
  platformSelectSection.style.display = 'none';

  startForm.addEventListener('submit', (e) => {
    e.preventDefault();
    startForm.style.display = 'none';
    platformSelectSection.style.display = 'block';
    loadPlatforms();
  });

  // Render checkboxes for platforms
  platforms.forEach(platform => {
    const label = document.createElement('label');
    label.innerHTML = `<input type="checkbox" name="platform" value="${platform.name}"> ${platform.name}`;
    platformsDiv.appendChild(label);
    platformsDiv.appendChild(document.createElement('br'));
  });

  platformForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const selectedPlatforms = Array.from(document.querySelectorAll('input[name="platform"]:checked')).map(cb => cb.value);
    if (selectedPlatforms.length === 0) {
      alert('Выберите хотя бы одну платформу!');
      return;
    }
    // Здесь можно добавить переход к следующему шагу (например, сбор данных пользователя)
    userDataSection.style.display = 'block';
    userDataSection.innerHTML = `<div>Вы выбрали: ${selectedPlatforms.join(', ')}</div>`;
    // recommendationsSection.style.display = 'none';
  });
});
