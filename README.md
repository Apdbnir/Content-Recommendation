# 🎯 Contopia - Personalized Content Recommendation System

> AI-powered content recommendations based on your activity across multiple platforms

[![Status](https://img.shields.io/badge/Status-Development-brightgreen)](https://github.com/contopia/contopia)
[![License](https://img.shields.io/badge/License-MIT-blue)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-v18+-success)](https://nodejs.org/)
[![SQLite](https://img.shields.io/badge/SQLite-3.x-informational)](https://www.sqlite.org/)

## 🚀 About Contopia

Contopia is an innovative content recommendation system designed to provide users with personalized recommendations based on their activity across various popular platforms (YouTube, Spotify, Instagram, Netflix, VK, X, Steam and others). The system allows users to connect accounts from different content platforms to receive personalized recommendations based on their preferences and behavioral patterns.

### Key Features

- 🎵 **Multi-Platform Integration**: Connect accounts from YouTube, Spotify, Instagram, Netflix, VK, X, Steam and more
- 🔐 **Secure Authentication**: OAuth support (Google, Facebook) with privacy-focused data handling
- 🧠 **AI-Powered Recommendations**: Advanced algorithms powered by Google Generative AI
- 👤 **Personalized Profiles**: Manage demographic data and preference settings
- 📱 **Responsive Design**: Works seamlessly across devices
- 🔒 **Privacy First**: User data processed only with explicit consent
- 🔄 **Backup Systems**: Fallback recommendation mechanisms for reliability

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **Node.js/Express** | Backend server and API |
| **SQLite** | Data storage and management |
| **Google Generative AI** | Recommendation algorithms |
| **OAuth 2.0** | Secure authentication |
| **REST API** | External service integration |
| **Modern HTML/CSS** | User interface |

## 📦 Installation

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn package manager
- SQLite3

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/contopia.git
   cd contopia
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd backend && npm install
   ```

3. **Configure environment variables**
   Create a `.env` file in the backend directory:
   ```env
   DB_PATH=./database.db
   GOOGLE_AI_API_KEY=your_google_ai_api_key
   CLIENT_ID=your_oauth_client_id
   CLIENT_SECRET=your_oauth_client_secret
   SESSION_SECRET=your_session_secret
   ```

4. **Initialize the database**
   ```bash
   node backend/init_db.js
   ```

5. **Start the application**
   ```bash
   npm start
   # Or separately:
   # Start backend: cd backend && node server.js
   # Start frontend: npm run dev (if applicable)
   ```

## 🎯 Usage

### Getting Started

1. **Connect your accounts**: Select platforms like YouTube, Spotify, Instagram, Netflix
2. **Provide necessary data**: Enter login, IDs, or profile links as required
3. **Analyze preferences**: System analyzes your activity and preferences
4. **Receive recommendations**: Get personalized content suggestions

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/status` | Health check |
| POST | `/api/recommendations` | Get content recommendations |
| GET | `/api/profile` | User profile information |
| POST | `/api/auth/login` | User authentication |
| POST | `/api/migrate` | Data migration |

## 🏗️ Architecture

Contopia follows a modern, scalable architecture:

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │────│   Backend API    │────│  External APIs  │
│                 │    │                  │    │ (YouTube,       │
│  HTML/CSS/JS    │    │  Node.js/        │    │  Spotify, etc.) │
│                 │    │  Express         │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                             │
                    ┌──────────────────┐
                    │   Database       │
                    │   (SQLite)       │
                    └──────────────────┘
```

### Key Components:

- **Authentication Layer**: Secure OAuth integration
- **Data Aggregation**: Collects user activity from multiple platforms
- **Recommendation Engine**: AI-powered content analysis
- **Data Storage**: Secure SQLite database with encrypted sensitive information
- **Fallback Systems**: Backup mechanisms for reliability

## 🤝 Contributing

We welcome contributions to Contopia! Here's how you can help:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style
- Write meaningful commit messages
- Add tests for new features
- Ensure all tests pass before submitting

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

If you have any questions or need assistance:

- 📧 **Email**: support@contopia.example.com
- 🐛 **Issues**: [GitHub Issues](https://github.com/your-username/contopia/issues)
- 📖 **Documentation**: [Project Docs](docs/)

---

<div align="center">
  <p><strong>Contopia - Connecting you with the content you love</strong></p>
  <p>Made with ❤️ by the Contopia Team</p>
</div>