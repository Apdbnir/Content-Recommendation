import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();
app.use(cors());
app.use(express.json());

// Platforms config (example)
const platforms = [
  { name: 'YouTube', apiUrl: 'https://www.googleapis.com/youtube/v3' },
  { name: 'Spotify', apiUrl: 'https://api.spotify.com/v1' },
  { name: 'VK', apiUrl: 'https://api.vk.com/method' }
];

// Get available platforms
app.get('/api/platforms', (req, res) => {
  res.json(platforms);
});

// Get recommendations (mock)
app.post('/api/recommendations', async (req, res) => {
  const { selectedPlatforms, userMeta } = req.body;
  // Собираем данные пользователя для каждой платформы
  let userData = {};
  for (const platform of selectedPlatforms) {
    // Пример: userMeta[platform] содержит данные пользователя для платформы
    userData[platform] = userMeta[platform] || {};
  }

  // Отправляем данные на внешний сервис рекомендаций
  try {
    // Замените URL на реальный внешний сервис
    const recRes = await axios.post('https://external-recommendation-service.com/api/recommend', {
      platforms: selectedPlatforms,
      userData
    });
    res.json({ recommendations: recRes.data.recommendations });
  } catch (err) {
    console.error('Ошибка при получении рекомендаций:', err.message);
    res.status(500).json({ error: 'Ошибка при получении рекомендаций' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
