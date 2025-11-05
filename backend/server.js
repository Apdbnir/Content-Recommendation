const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const session = require('express-session');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require('axios'); // Added for HTTP requests to 2index.ninja API
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Route to serve Doc.pdf from the project root
app.get('/Doc.pdf', (req, res) => {
    res.sendFile(path.join(__dirname, '../Doc.pdf'));
});

// Route to serve index.html for the root path
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Session middleware
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-session-secret',
    resave: false,
    saveUninitialized: false
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());



// Function to generate fallback recommendations when API is unavailable
function generateFallbackRecommendations(query, userProfile = null, userPreferences = {}, platformPreferences = [], userInterests = []) {
    // Special handling for specific terms like "кацка", "Вредный котик Адольф", and "Warhammer"
    const queryLower = query.toLowerCase();
    let fallbackData = [];
    
    // Get user context information to personalize recommendations
    let contextInfo = '';
    if (userProfile) {
        const { gender, country, city, birthDate } = userProfile;
        const age = birthDate ? new Date().getFullYear() - new Date(birthDate).getFullYear() : null;
        
        if (age) contextInfo += ` for a ${age} year old`;
        if (gender) contextInfo += ` ${gender}`;
        if (country) contextInfo += ` from ${country}`;
        if (city) contextInfo += ` in ${city}`;
    }
    
    // Combine user interests and preferences for better fallback recommendations
    const allInterests = [...new Set([...Object.keys(userPreferences), ...userInterests])].slice(0, 3).join(', ');
    
    if (queryLower.includes('кацка') || queryLower.includes('кот') || queryLower.includes('cat')) {
        // Recommendations related to cats
        fallbackData = [
            { title: 'Funny Cat Videos Compilation', author: 'Cat Lovers', platform: 'YouTube', type: 'video', url: 'https://www.youtube.com/results?search_query=funny+cat+videos' },
            { title: 'Cute Cat Memes Collection', author: 'Animal Humor', platform: 'Instagram', type: 'photo', url: 'https://www.instagram.com/explore/tags/cute_cats/' },
            { title: 'Top Cat Care Tips', author: 'Pet Experts', platform: 'Medium', type: 'article', url: 'https://medium.com/search?q=cat+care+tips' },
            { title: 'Relaxing Cat Purring Sounds', author: 'Nature Sounds', platform: 'Spotify', type: 'music', url: 'https://open.spotify.com/search/cats+purring' },
            { title: 'Beautiful Cat Photography', author: 'Pet Photographers', platform: 'Unsplash', type: 'photo', url: 'https://unsplash.com/s/photos/cat' },
            { title: 'Cat Breeds Guide', author: 'Veterinary Professionals', platform: 'Medium', type: 'article', url: 'https://medium.com/search?q=cat+breeds' }
        ];
    } else if (queryLower.includes('warhammer')) {
        // Recommendations related to Warhammer
        fallbackData = [
            { title: 'Warhammer 40K Lore Explained', author: 'Warhammer Community', platform: 'YouTube', type: 'video', url: 'https://www.youtube.com/results?search_query=warhammer+40k+lore' },
            { title: 'Top Warhammer Strategy Guides', author: 'Gaming Experts', platform: 'YouTube', type: 'video', url: 'https://www.youtube.com/results?search_query=warhammer+strategy+guide' },
            { title: 'Warhammer News and Updates', author: 'Games Workshop', platform: 'Reddit', type: 'text', url: 'https://www.reddit.com/r/Warhammer/' },
            { title: 'Warhammer Soundtrack Collection', author: 'Warhammer Official', platform: 'Spotify', type: 'music', url: 'https://open.spotify.com/search/warhammer+soundtrack' },
            { title: 'Warhammer Miniatures Showcase', author: 'Model Painters', platform: 'Instagram', type: 'photo', url: 'https://www.instagram.com/explore/tags/warhammer/' },
            { title: 'Warhammer Game Reviews', author: 'Tabletop Gaming', platform: 'Medium', type: 'article', url: 'https://medium.com/search?q=warhammer+game+review' }
        ];
    } else {
        // General recommendations based on common platforms and content types
        // If user has specific interests, try to incorporate them
        const interestBasedQuery = allInterests ? `${query} ${allInterests}` : query;
        
        // If user has selected platforms, prioritize those
        const platformsToUse = platformPreferences.length > 0 ? platformPreferences : ['YouTube', 'Spotify', 'Netflix', 'Instagram', 'X', 'GitHub', 'Reddit'];
        
        fallbackData = [
            { title: `Popular ${query} Resources${contextInfo}`, author: 'Community', platform: platformsToUse[0] || 'YouTube', type: 'video', url: `https://www.youtube.com/results?search_query=${encodeURIComponent(interestBasedQuery)}` },
            { title: `${query} Guide${contextInfo}`, author: 'Experts', platform: platformsToUse[1] || 'Medium', type: 'article', url: `https://medium.com/search?q=${encodeURIComponent(interestBasedQuery)}` },
            { title: `${query} Tutorials${contextInfo}`, author: 'Teachers', platform: platformsToUse[2] || 'Coursera', type: 'course', url: `https://www.coursera.org/search?query=${encodeURIComponent(interestBasedQuery)}` },
            { title: `${query} Music${contextInfo}`, author: 'Artists', platform: platformsToUse[3] || 'Spotify', type: 'music', url: `https://open.spotify.com/search/${encodeURIComponent(query)}` },
            { title: `${query} Photos${contextInfo}`, author: 'Photographers', platform: platformsToUse[4] || 'Unsplash', type: 'photo', url: `https://unsplash.com/s/photos/${encodeURIComponent(query)}` },
            { title: `${query} Code Examples${contextInfo}`, author: 'Developers', platform: platformsToUse[5] || 'GitHub', type: 'code', url: `https://github.com/search?q=${encodeURIComponent(query)}` }
        ];
    }
    
    // Return up to 5 recommendations
    return fallbackData.slice(0, 5);
}

// Database setup
const dbPath = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath);

// Create tables
db.serialize(() => {
    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        firstName TEXT NOT NULL,
        lastName TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        birthDate DATE,
        gender TEXT,
        country TEXT,
        city TEXT,
        newsletter BOOLEAN DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Check if the user_sessions table exists and has the old schema
    db.get("SELECT sql FROM sqlite_master WHERE type='table' AND name='user_sessions'", (err, row) => {
        if (err) {
            console.error('Error checking user_sessions table:', err);
        } else if (row && row.sql) {
            // Check if the table has the old schema (with userId column instead of session_token)
            if (row.sql.includes('userId INTEGER NOT NULL') && !row.sql.includes('session_token')) {
                console.log('Old user_sessions table detected, dropping and recreating with new schema...');
                
                // Drop the old table and recreate with new schema
                db.run('DROP TABLE user_sessions', (err) => {
                    if (err) {
                        console.error('Error dropping old user_sessions table:', err);
                    }
                    // Create the new table structure
                    db.run(`CREATE TABLE user_sessions (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        session_token TEXT UNIQUE NOT NULL,
                        data TEXT,
                        expiresAt DATETIME NOT NULL,
                        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
                    )`);
                    console.log('Created user_sessions table with new schema');
                });
            } else {
                // Either the table has the correct schema or it's a new table
                db.run(`CREATE TABLE IF NOT EXISTS user_sessions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    session_token TEXT UNIQUE NOT NULL,
                    data TEXT,
                    expiresAt DATETIME NOT NULL,
                    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
                )`);
            }
        } else {
            // Table doesn't exist, create it
            db.run(`CREATE TABLE user_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_token TEXT UNIQUE NOT NULL,
                data TEXT,
                expiresAt DATETIME NOT NULL,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);
            console.log('Created user_sessions table with new schema');
        }
    });

    // Connected platforms table
    db.run(`CREATE TABLE IF NOT EXISTS connected_platforms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        platformName TEXT NOT NULL,
        platformId TEXT,
        accessToken TEXT,
        refreshToken TEXT,
        connectedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(userId) REFERENCES users(id)
    )`);

    // User preferences table
    db.run(`CREATE TABLE IF NOT EXISTS user_preferences (
        userId INTEGER PRIMARY KEY,
        preferences TEXT,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(userId) REFERENCES users(id)
    )`);

    // User interactions table
    db.run(`CREATE TABLE IF NOT EXISTS user_interactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        title TEXT NOT NULL,
        action TEXT NOT NULL, -- e.g., 'click', 'like', 'view'
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(userId) REFERENCES users(id)
    )`);

    // User selected platforms table
    db.run(`CREATE TABLE IF NOT EXISTS user_selected_platforms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        platformName TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(userId) REFERENCES users(id),
        UNIQUE(userId, platformName)
    )`);

    // User interests table
    db.run(`CREATE TABLE IF NOT EXISTS user_interests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        interest TEXT NOT NULL,
        weight INTEGER DEFAULT 1, -- For tracking interest frequency
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(userId) REFERENCES users(id),
        UNIQUE(userId, interest)
    )`);
});

// Passport configuration for OAuth
passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    db.get('SELECT * FROM users WHERE id = ?', [id], (err, user) => {
        done(err, user);
    });
});

// Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback"
},
async (accessToken, refreshToken, profile, done) => {
    try {
        // Check if user already exists
        db.get('SELECT * FROM users WHERE email = ?', [profile.emails[0].value], (err, user) => {
            if (err) {
                return done(err, null);
            }
            
            if (user) {
                // User exists, return user
                return done(null, user);
            } else {
                // Create new user
                const newUser = {
                    id: profile.id,
                    firstName: profile.name.givenName,
                    lastName: profile.name.familyName,
                    email: profile.emails[0].value,
                    username: profile.displayName,
                    password: null, // OAuth users don't have passwords
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };

                // Insert into database
                db.run(
                    `INSERT INTO users (firstName, lastName, email, username, password, createdAt, updatedAt)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [newUser.firstName, newUser.lastName, newUser.email, newUser.username, null, newUser.createdAt, newUser.updatedAt],
                    function(err) {
                        if (err) {
                            return done(err, null);
                        }
                        newUser.id = this.lastID;
                        return done(null, newUser);
                    }
                );
            }
        });
    } catch (error) {
        return done(error, null);
    }
}));

// Facebook OAuth Strategy
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "/api/auth/facebook/callback",
    profileFields: ['id', 'emails', 'name']
},
async (accessToken, refreshToken, profile, done) => {
    try {
        // Check if user already exists
        db.get('SELECT * FROM users WHERE email = ?', [profile.emails[0].value], (err, user) => {
            if (err) {
                return done(err, null);
            }
            
            if (user) {
                // User exists, return user
                return done(null, user);
            } else {
                // Create new user
                const newUser = {
                    id: profile.id,
                    firstName: profile.name.givenName,
                    lastName: profile.name.familyName,
                    email: profile.emails[0].value,
                    username: profile.displayName,
                    password: null, // OAuth users don't have passwords
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };

                // Insert into database
                db.run(
                    `INSERT INTO users (firstName, lastName, email, username, password, createdAt, updatedAt)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [newUser.firstName, newUser.lastName, newUser.email, newUser.username, null, newUser.createdAt, newUser.updatedAt],
                    function(err) {
                        if (err) {
                            return done(err, null);
                        }
                        newUser.id = this.lastID;
                        return done(null, newUser);
                    }
                );
            }
        });
    } catch (error) {
        return done(error, null);
    }
}));

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Helper function to hash passwords
const hashPassword = async (password) => {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
};

// Helper function to verify passwords
const verifyPassword = async (password, hashedPassword) => {
    return await bcrypt.compare(password, hashedPassword);
};

// Registration endpoint
app.post('/api/register', async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            email,
            username,
            password,
            birthDate,
            gender,
            country,
            city,
            newsletter
        } = req.body;

        // Validation
        if (!firstName || !lastName || !email || !username || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'All required fields must be provided' 
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid email format' 
            });
        }

        if (password.length < 6) {
            return res.status(400).json({ 
                success: false, 
                message: 'Password must be at least 6 characters long' 
            });
        }

        // Check if user already exists
        db.get(
            'SELECT id FROM users WHERE email = ? OR username = ?',
            [email, username],
            async (err, user) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ 
                        success: false, 
                        message: 'Internal server error' 
                    });
                }

                if (user) {
                    return res.status(409).json({ 
                        success: false, 
                        message: 'User with this email or username already exists' 
                    });
                }

                // Hash password
                const hashedPassword = await hashPassword(password);

                // Insert new user
                db.run(
                    `INSERT INTO users (firstName, lastName, email, username, password, birthDate, gender, country, city, newsletter)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        firstName,
                        lastName,
                        email.toLowerCase(),
                        username,
                        hashedPassword,
                        birthDate || null,
                        gender || null,
                        country || null,
                        city || null,
                        newsletter ? 1 : 0
                    ],
                    function (err) {
                        if (err) {
                            console.error('Database error:', err);
                            return res.status(500).json({ 
                                success: false, 
                                message: 'Internal server error' 
                            });
                        }

                        // Return success
                        res.status(201).json({
                            success: true,
                            message: 'User registered successfully'
                        });
                    }
                );
            }
        );
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email and password are required' 
            });
        }

        // Get user from database
        db.get(
            'SELECT * FROM users WHERE email = ?',
            [email.toLowerCase()],
            async (err, user) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ 
                        success: false, 
                        message: 'Internal server error' 
                    });
                }

                if (!user) {
                    return res.status(401).json({ 
                        success: false, 
                        message: 'Invalid email or password' 
                    });
                }

                // Verify password
                const isValidPassword = await verifyPassword(password, user.password);
                if (!isValidPassword) {
                    return res.status(401).json({ 
                        success: false, 
                        message: 'Invalid email or password' 
                    });
                }

                // Generate JWT token
                const token = jwt.sign(
                    { userId: user.id, email: user.email },
                    JWT_SECRET,
                    { expiresIn: '7d' } // Token valid for 7 days
                );

                // Store session in database (optional, for server-side session tracking)
                const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
                db.run(
                    'INSERT INTO user_sessions (userId, token, expiresAt) VALUES (?, ?, ?)',
                    [user.id, token, expiresAt],
                    (err) => {
                        if (err) {
                            console.error('Session storage error:', err);
                            // We'll still return the token, but log the error
                        }
                    }
                );

                res.json({
                    success: true,
                    message: 'Login successful',
                    token,
                    user: {
                        id: user.id,
                        email: user.email,
                        username: user.username,
                        firstName: user.firstName,
                        lastName: user.lastName
                    }
                });
            }
        );
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Middleware to verify JWT token or handle session context
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (token) {
        // Check for JWT token
        jwt.verify(token, JWT_SECRET, (err, user) => {
            if (err) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Invalid or expired token' 
                });
            }
            req.user = user;
            req.isAuthenticated = true;
            next();
        });
    } else {
        // For non-authenticated requests, set up session context but don't require authentication
        const userContext = getUserContext(req);
        req.userContext = userContext;
        req.isAuthenticated = false;
        next();
    }
};

// Get user profile endpoint
app.get('/api/profile', authenticateToken, (req, res) => {
    db.get(
        'SELECT id, firstName, lastName, email, username, birthDate, gender, country, city, newsletter, createdAt FROM users WHERE id = ?',
        [req.user.userId],
        (err, user) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Internal server error' 
                });
            }

            if (!user) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'User not found' 
                });
            }

            res.json({
                success: true,
                user: {
                    id: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    username: user.username,
                    birthDate: user.birthDate,
                    gender: user.gender,
                    country: user.country,
                    city: user.city,
                    newsletter: user.newsletter === 1,
                    createdAt: user.createdAt
                }
            });
        }
    );
});

// Update user profile endpoint
app.put('/api/profile', authenticateToken, (req, res) => {
    const { firstName, lastName, birthDate, gender, country, city, newsletter } = req.body;

    db.run(
        `UPDATE users SET firstName = ?, lastName = ?, birthDate = ?, gender = ?, 
         country = ?, city = ?, newsletter = ?, updatedAt = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [firstName, lastName, birthDate, gender, country, city, newsletter ? 1 : 0, req.user.userId],
        function (err) {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Internal server error' 
                });
            }

            if (this.changes === 0) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'User not found' 
                });
            }

            res.json({
                success: true,
                message: 'Profile updated successfully'
            });
        }
    );
});

// OAuth endpoints will go here (simplified for this example)
app.get('/api/auth/google', (req, res) => {
    // This would redirect to Google OAuth
    res.json({ 
        success: true, 
        message: 'Google OAuth redirect would happen here' 
    });
});

app.get('/api/auth/facebook', (req, res) => {
    // This would redirect to Facebook OAuth
    res.json({ 
        success: true, 
        message: 'Facebook OAuth redirect would happen here' 
    });
});

// Helper function to get or create a session token for non-authenticated users
function getOrCreateSessionToken(req) {
    // Try to get existing session token from headers or cookies
    let sessionToken = req.headers['x-session-token'] || req.cookies?.sessionToken;
    
    if (!sessionToken) {
        // Create a new session token
        sessionToken = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    return sessionToken;
}

// Middleware to check if user is authenticated or get session token
function getUserContext(req) {
    // Check if user is authenticated
    if (req.user && req.user.userId) {
        return { userId: req.user.userId, isAuthenticated: true, sessionToken: null };
    } else {
        // Non-authenticated user - use session token
        const sessionToken = getOrCreateSessionToken(req);
        return { userId: null, isAuthenticated: false, sessionToken: sessionToken };
    }
}

// Endpoint to get user's selected platforms (works for both authenticated and non-authenticated users)
app.get('/api/selected-platforms', (req, res) => {
    const userContext = getUserContext(req);
    
    if (userContext.isAuthenticated) {
        // Authenticated user - get from database
        db.all(
            'SELECT platformName FROM user_selected_platforms WHERE userId = ?',
            [userContext.userId],
            (err, rows) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ 
                        success: false, 
                        message: 'Internal server error' 
                    });
                }
                
                res.json({
                    success: true,
                    selectedPlatforms: rows.map(row => row.platformName)
                });
            }
        );
    } else {
        // Non-authenticated user - get from session storage
        db.get(
            'SELECT data FROM user_sessions WHERE session_token = ? AND expiresAt > datetime("now")',
            [userContext.sessionToken],
            (err, row) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ 
                        success: false, 
                        message: 'Internal server error' 
                    });
                }
                
                if (row && row.data) {
                    try {
                        const sessionData = JSON.parse(row.data);
                        res.json({
                            success: true,
                            selectedPlatforms: sessionData.selectedPlatforms || [],
                            sessionToken: userContext.sessionToken
                        });
                    } catch (parseError) {
                        console.error('Error parsing session data:', parseError);
                        res.json({
                            success: true,
                            selectedPlatforms: [],
                            sessionToken: userContext.sessionToken
                        });
                    }
                } else {
                    res.json({
                        success: true,
                        selectedPlatforms: [],
                        sessionToken: userContext.sessionToken
                    });
                }
            }
        );
    }
});

// Endpoint to save user's selected platforms (works for both authenticated and non-authenticated users)
app.post('/api/selected-platforms', (req, res) => {
    const { platforms } = req.body;
    const userContext = getUserContext(req);
    
    if (!Array.isArray(platforms)) {
        return res.status(400).json({ 
            success: false, 
            message: 'Platforms must be an array' 
        });
    }
    
    if (userContext.isAuthenticated) {
        // Authenticated user - save to database
        // First, delete existing entries
        db.run(
            'DELETE FROM user_selected_platforms WHERE userId = ?',
            [userContext.userId],
            function(err) {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ 
                        success: false, 
                        message: 'Internal server error' 
                    });
                }
                
                // Insert new platform selections
                let insertedCount = 0;
                platforms.forEach(platform => {
                    db.run(
                        'INSERT INTO user_selected_platforms (userId, platformName) VALUES (?, ?)',
                        [userContext.userId, platform],
                        function(err) {
                            if (err) {
                                console.error('Database error:', err);
                            } else {
                                insertedCount++;
                            }
                            
                            // Send response when all inserts are complete
                            if (insertedCount === platforms.length) {
                                res.json({
                                    success: true,
                                    message: 'Selected platforms saved successfully'
                                });
                            }
                        }
                    );
                });
                
                // Handle case where platforms array is empty
                if (platforms.length === 0) {
                    res.json({
                        success: true,
                        message: 'Selected platforms saved successfully'
                    });
                }
            }
        );
    } else {
        // Non-authenticated user - save to session storage
        db.get(
            'SELECT id FROM user_sessions WHERE session_token = ?',
            [userContext.sessionToken],
            (err, row) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ 
                        success: false, 
                        message: 'Internal server error' 
                    });
                }
                
                const sessionData = { selectedPlatforms: platforms };
                const dataStr = JSON.stringify(sessionData);
                
                if (row) {
                    // Update existing session
                    db.run(
                        'UPDATE user_sessions SET data = ?, expiresAt = datetime("now", "+1 hour") WHERE session_token = ?',
                        [dataStr, userContext.sessionToken],
                        function(err) {
                            if (err) {
                                console.error('Database error:', err);
                                return res.status(500).json({ 
                                    success: false, 
                                    message: 'Internal server error' 
                                });
                            }
                            
                            res.json({
                                success: true,
                                message: 'Selected platforms saved successfully',
                                sessionToken: userContext.sessionToken
                            });
                        }
                    );
                } else {
                    // Create new session
                    db.run(
                        'INSERT INTO user_sessions (session_token, data, expiresAt) VALUES (?, ?, datetime("now", "+1 hour"))',
                        [userContext.sessionToken, dataStr],
                        function(err) {
                            if (err) {
                                console.error('Database error:', err);
                                return res.status(500).json({ 
                                    success: false, 
                                    message: 'Internal server error' 
                                });
                            }
                            
                            res.json({
                                success: true,
                                message: 'Selected platforms saved successfully',
                                sessionToken: userContext.sessionToken
                            });
                        }
                    );
                }
            }
        );
    }
});

// Endpoint to get user interests (works for both authenticated and non-authenticated users)
app.get('/api/interests', (req, res) => {
    const userContext = getUserContext(req);
    
    if (userContext.isAuthenticated) {
        // Authenticated user - get from database
        db.all(
            'SELECT interest, weight FROM user_interests WHERE userId = ? ORDER BY weight DESC LIMIT 20',
            [userContext.userId],
            (err, rows) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ 
                        success: false, 
                        message: 'Internal server error' 
                    });
                }
                
                res.json({
                    success: true,
                    interests: rows.map(row => ({
                        interest: row.interest,
                        weight: row.weight
                    }))
                });
            }
        );
    } else {
        // Non-authenticated user - get from session storage (stored in the same session record as selected platforms)
        db.get(
            'SELECT data FROM user_sessions WHERE session_token = ? AND expiresAt > datetime("now")',
            [userContext.sessionToken],
            (err, row) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ 
                        success: false, 
                        message: 'Internal server error' 
                    });
                }
                
                if (row && row.data) {
                    try {
                        const sessionData = JSON.parse(row.data);
                        res.json({
                            success: true,
                            interests: sessionData.interests || [],
                            sessionToken: userContext.sessionToken
                        });
                    } catch (parseError) {
                        console.error('Error parsing session data:', parseError);
                        res.json({
                            success: true,
                            interests: [],
                            sessionToken: userContext.sessionToken
                        });
                    }
                } else {
                    res.json({
                        success: true,
                        interests: [],
                        sessionToken: userContext.sessionToken
                    });
                }
            }
        );
    }
});

// Endpoint to save user interests (works for both authenticated and non-authenticated users)
app.post('/api/interests', (req, res) => {
    const { interests } = req.body;
    const userContext = getUserContext(req);
    
    if (!Array.isArray(interests)) {
        return res.status(400).json({ 
            success: false, 
            message: 'Interests must be an array' 
        });
    }
    
    if (userContext.isAuthenticated) {
        // Authenticated user - save to database
        // First, delete existing entries
        db.run(
            'DELETE FROM user_interests WHERE userId = ?',
            [userContext.userId],
            function(err) {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ 
                        success: false, 
                        message: 'Internal server error' 
                    });
                }
                
                // Insert new interest entries
                let insertedCount = 0;
                interests.forEach(interest => {
                    db.run(
                        'INSERT INTO user_interests (userId, interest, weight) VALUES (?, ?, ?)',
                        [userContext.userId, interest.interest, interest.weight || 1],
                        function(err) {
                            if (err) {
                                console.error('Database error:', err);
                            } else {
                                insertedCount++;
                            }
                            
                            // Send response when all inserts are complete
                            if (insertedCount === interests.length) {
                                res.json({
                                    success: true,
                                    message: 'Interests saved successfully'
                                });
                            }
                        }
                    );
                });
                
                // Handle case where interests array is empty
                if (interests.length === 0) {
                    res.json({
                        success: true,
                        message: 'Interests saved successfully'
                    });
                }
            }
        );
    } else {
        // Non-authenticated user - save to session storage
        db.get(
            'SELECT id FROM user_sessions WHERE session_token = ?',
            [userContext.sessionToken],
            (err, row) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ 
                        success: false, 
                        message: 'Internal server error' 
                    });
                }
                
                // Get existing data and merge with new interests
                let sessionData = {};
                if (row && row.data) {
                    try {
                        sessionData = JSON.parse(row.data);
                    } catch (parseError) {
                        console.error('Error parsing existing session data:', parseError);
                    }
                }
                
                sessionData.interests = interests;
                const dataStr = JSON.stringify(sessionData);
                
                if (row) {
                    // Update existing session
                    db.run(
                        'UPDATE user_sessions SET data = ?, expiresAt = datetime("now", "+1 hour") WHERE session_token = ?',
                        [dataStr, userContext.sessionToken],
                        function(err) {
                            if (err) {
                                console.error('Database error:', err);
                                return res.status(500).json({ 
                                    success: false, 
                                    message: 'Internal server error' 
                                });
                            }
                            
                            res.json({
                                success: true,
                                message: 'Interests saved successfully',
                                sessionToken: userContext.sessionToken
                            });
                        }
                    );
                } else {
                    // Create new session
                    db.run(
                        'INSERT INTO user_sessions (session_token, data, expiresAt) VALUES (?, ?, datetime("now", "+1 hour"))',
                        [userContext.sessionToken, dataStr],
                        function(err) {
                            if (err) {
                                console.error('Database error:', err);
                                return res.status(500).json({ 
                                    success: false, 
                                    message: 'Internal server error' 
                                });
                            }
                            
                            res.json({
                                success: true,
                                message: 'Interests saved successfully',
                                sessionToken: userContext.sessionToken
                            });
                        }
                    );
                }
            }
        );
    }
});

// Endpoint to get connected platforms
app.get('/api/platforms/connected', authenticateToken, (req, res) => {
    db.all(
        'SELECT platformName, connectedAt FROM connected_platforms WHERE userId = ?',
        [req.user.userId],
        (err, platforms) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Internal server error' 
                });
            }

            res.json({
                success: true,
                platforms
            });
        }
    );
});

// Endpoint to disconnect platform
app.delete('/api/platforms/disconnect/:platformName', authenticateToken, (req, res) => {
    const { platformName } = req.params;

    db.run(
        'DELETE FROM connected_platforms WHERE userId = ? AND platformName = ?',
        [req.user.userId, platformName],
        function (err) {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Internal server error' 
                });
            }

            if (this.changes === 0) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Platform connection not found' 
                });
            }

            res.json({
                success: true,
                message: 'Platform disconnected successfully'
            });
        }
    );
});

// Endpoint to save user preferences (works for both authenticated and non-authenticated users)
app.post('/api/preferences', authenticateToken, (req, res) => {
    const { preferences } = req.body;
    
    if (!preferences) {
        return res.status(400).json({ 
            success: false, 
            message: 'Preferences data is required' 
        });
    }
    
    if (req.isAuthenticated) {
        // Authenticated user - save to database
        try {
            // Convert preferences to JSON string for storage
            const preferencesJson = JSON.stringify(preferences);
            
            db.run(
                'INSERT OR REPLACE INTO user_preferences (userId, preferences, updatedAt) VALUES (?, ?, CURRENT_TIMESTAMP)',
                [req.user.userId, preferencesJson],
                function(err) {
                    if (err) {
                        console.error('Database error:', err);
                        return res.status(500).json({ 
                            success: false, 
                            message: 'Internal server error' 
                        });
                    }
                    
                    res.json({
                        success: true,
                        message: 'Preferences saved successfully'
                    });
                }
            );
        } catch (error) {
            console.error('Error saving preferences:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Invalid preferences format' 
            });
        }
    } else {
        // Non-authenticated user - save to session storage
        const sessionToken = req.userContext.sessionToken;
        
        db.get(
            'SELECT id FROM user_sessions WHERE session_token = ?',
            [sessionToken],
            (err, row) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ 
                        success: false, 
                        message: 'Internal server error' 
                    });
                }
                
                // Get existing data and merge with new preferences
                let sessionData = {};
                if (row && row.data) {
                    try {
                        sessionData = JSON.parse(row.data);
                    } catch (parseError) {
                        console.error('Error parsing existing session data:', parseError);
                    }
                }
                
                sessionData.preferences = preferences;
                const dataStr = JSON.stringify(sessionData);
                
                if (row) {
                    // Update existing session
                    db.run(
                        'UPDATE user_sessions SET data = ?, expiresAt = datetime("now", "+1 hour") WHERE session_token = ?',
                        [dataStr, sessionToken],
                        function(err) {
                            if (err) {
                                console.error('Database error:', err);
                                return res.status(500).json({ 
                                    success: false, 
                                    message: 'Internal server error' 
                                });
                            }
                            
                            res.json({
                                success: true,
                                message: 'Preferences saved successfully',
                                sessionToken: sessionToken
                            });
                        }
                    );
                } else {
                    // Create new session
                    db.run(
                        'INSERT INTO user_sessions (session_token, data, expiresAt) VALUES (?, ?, datetime("now", "+1 hour"))',
                        [sessionToken, dataStr],
                        function(err) {
                            if (err) {
                                console.error('Database error:', err);
                                return res.status(500).json({ 
                                    success: false, 
                                    message: 'Internal server error' 
                                });
                            }
                            
                            res.json({
                                success: true,
                                message: 'Preferences saved successfully',
                                sessionToken: sessionToken
                            });
                        }
                    );
                }
            }
        );
    }
});

// Endpoint to get user preferences (works for both authenticated and non-authenticated users)
app.get('/api/preferences', authenticateToken, (req, res) => {
    if (req.isAuthenticated) {
        // Authenticated user - get from database
        db.get(
            'SELECT preferences FROM user_preferences WHERE userId = ?',
            [req.user.userId],
            (err, row) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ 
                        success: false, 
                        message: 'Internal server error' 
                    });
                }
                
                if (!row) {
                    return res.json({
                        success: true,
                        preferences: {}
                    });
                }
                
                try {
                    const preferences = JSON.parse(row.preferences);
                    res.json({
                        success: true,
                        preferences: preferences
                    });
                } catch (error) {
                    console.error('Error parsing preferences:', error);
                    res.json({
                        success: true,
                        preferences: {}
                    });
                }
            }
        );
    } else {
        // Non-authenticated user - get from session storage
        const sessionToken = req.userContext.sessionToken;
        
        db.get(
            'SELECT data FROM user_sessions WHERE session_token = ? AND expiresAt > datetime("now")',
            [sessionToken],
            (err, row) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ 
                        success: false, 
                        message: 'Internal server error' 
                    });
                }
                
                if (row && row.data) {
                    try {
                        const sessionData = JSON.parse(row.data);
                        res.json({
                            success: true,
                            preferences: sessionData.preferences || {}
                        });
                    } catch (parseError) {
                        console.error('Error parsing session data:', parseError);
                        res.json({
                            success: true,
                            preferences: {}
                        });
                    }
                } else {
                    res.json({
                        success: true,
                        preferences: {}
                    });
                }
            }
        );
    }
});

// Google OAuth routes
app.get('/api/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/api/auth/google/callback',
    passport.authenticate('google', { session: false }),
    (req, res) => {
        // Generate JWT token for OAuth user
        const token = jwt.sign(
            { userId: req.user.id, email: req.user.email },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        // In a real app, you would redirect to frontend with the token
        // For demo, we'll send the token in the response
        res.redirect(`/oauth-success.html?token=${token}`);
    }
);

// Facebook OAuth routes
app.get('/api/auth/facebook',
    passport.authenticate('facebook', { scope: ['email'] })
);

app.get('/api/auth/facebook/callback',
    passport.authenticate('facebook', { session: false }),
    (req, res) => {
        // Generate JWT token for OAuth user
        const token = jwt.sign(
            { userId: req.user.id, email: req.user.email },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        // In a real app, you would redirect to frontend with the token
        // For demo, we'll send the token in the response
        res.redirect(`/oauth-success.html?token=${token}`);
    }
);

// OAuth success page that will handle the token
app.get('/oauth-success.html', (req, res) => {
    const token = req.query.token;
    
    // Simple HTML page that stores the token and redirects
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Authentication Successful</title>
    </head>
    <body>
        <h1>Authentication Successful!</h1>
        <p>Redirecting to application...</p>
        <script>
            // Store the token in localStorage
            localStorage.setItem('authToken', '${token}');
            
            // Redirect to main page
            window.location.href = 'main.html';
        </script>
    </body>
    </html>
    `;
    
    res.send(html);
});

// Endpoint to track user interactions with recommendations (works for both authenticated and non-authenticated users)
app.post('/api/track-interaction', authenticateToken, (req, res) => {
    const { title, action, timestamp } = req.body;
    
    if (!title || !action) {
        return res.status(400).json({ 
            success: false, 
            message: 'Title and action are required' 
        });
    }
    
    if (req.isAuthenticated) {
        // Authenticated user - save to database
        // Insert the interaction into the database
        const query = `
            INSERT INTO user_interactions (userId, title, action, timestamp) 
            VALUES (?, ?, ?, ?)
        `;
        
        db.run(query, [req.user.userId, title, action, timestamp || new Date().toISOString()], (err) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Internal server error' 
                });
            }
            
            res.json({
                success: true,
                message: 'Interaction tracked successfully'
            });
        });
    } else {
        // Non-authenticated user - save to session storage
        const sessionToken = req.userContext.sessionToken;
        
        db.get(
            'SELECT id FROM user_sessions WHERE session_token = ?',
            [sessionToken],
            (err, row) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ 
                        success: false, 
                        message: 'Internal server error' 
                    });
                }
                
                // Get existing data and merge with new interaction
                let sessionData = {};
                if (row && row.data) {
                    try {
                        sessionData = JSON.parse(row.data);
                    } catch (parseError) {
                        console.error('Error parsing existing session data:', parseError);
                    }
                }
                
                // Initialize interactions array if not exists
                if (!sessionData.interactions) {
                    sessionData.interactions = [];
                }
                
                // Add new interaction
                sessionData.interactions.push({
                    title: title,
                    action: action,
                    timestamp: timestamp || new Date().toISOString()
                });
                
                // Keep only the most recent 50 interactions to prevent data bloat
                if (sessionData.interactions.length > 50) {
                    sessionData.interactions = sessionData.interactions.slice(-50);
                }
                
                const dataStr = JSON.stringify(sessionData);
                
                if (row) {
                    // Update existing session
                    db.run(
                        'UPDATE user_sessions SET data = ?, expiresAt = datetime("now", "+1 hour") WHERE session_token = ?',
                        [dataStr, sessionToken],
                        function(err) {
                            if (err) {
                                console.error('Database error:', err);
                                return res.status(500).json({ 
                                    success: false, 
                                    message: 'Internal server error' 
                                });
                            }
                            
                            res.json({
                                success: true,
                                message: 'Interaction tracked successfully',
                                sessionToken: sessionToken
                            });
                        }
                    );
                } else {
                    // Create new session
                    db.run(
                        'INSERT INTO user_sessions (session_token, data, expiresAt) VALUES (?, ?, datetime("now", "+1 hour"))',
                        [sessionToken, dataStr],
                        function(err) {
                            if (err) {
                                console.error('Database error:', err);
                                return res.status(500).json({ 
                                    success: false, 
                                    message: 'Internal server error' 
                                });
                            }
                            
                            res.json({
                                success: true,
                                message: 'Interaction tracked successfully',
                                sessionToken: sessionToken
                            });
                        }
                    );
                }
            }
        );
    }
});

// Endpoint to search content across connected platforms with user personalization
app.post('/api/search-platforms', authenticateToken, async (req, res) => {
    const { query, platforms } = req.body;
    const userId = req.user.userId;
    
    if (!query) {
        return res.status(400).json({ 
            success: false, 
            message: 'Query is required' 
        });
    }
    
    // Check if the API key is properly configured before making requests
    if (!process.env.GOOGLE_API_KEY) {
        console.error('Google API key not configured. Returning empty recommendations.');
        return res.json({
            success: true,
            recommendations: []
        });
    }
    
    try {
        // Initialize the Google Generative AI client
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        
        // Get user's selected platforms if platforms array is not provided
        let platformList = platforms;
        if (!platformList || platformList.length === 0) {
            const platformRows = await new Promise((resolve, reject) => {
                db.all(
                    'SELECT platformName FROM user_selected_platforms WHERE userId = ?',
                    [userId],
                    (err, rows) => {
                        if (err) {
                            console.error('Database error:', err);
                            return reject(err);
                        }
                        resolve(rows.map(row => row.platformName));
                    }
                );
            });
            platformList = platformRows;
        }
        
        if (platformList.length === 0) {
            return res.json({
                success: true,
                recommendations: []
            });
        }
        
        let allRecommendations = [];
        
        // For each platform, make an API call to search for content
        // This is a simplified approach - in a real implementation you would have specific API calls for each platform
        for (const platform of platformList) {
            try {
                // For demonstration purposes, we'll use Google Gemini API to generate platform-specific content
                // In a real app, you would use the specific platform's API
                const prompt = `Search for content related to "${query}" on ${platform}. 
                Return recommendations in JSON format with fields: title, author, platform, type (video, music, article, photo, text, code), url (URL to the content).
                Example format: [{"title": "...", "author": "...", "platform": "${platform}", "type": "...", "url": "..."}]
                Make sure the URL is a real and accessible URL that can be opened in a browser.`;
                
                const result = await model.generateContent(prompt);
                const response = result.response;
                const content = await response.text();
                
                // Extract JSON from the response (in case it contains extra text)
                const jsonStart = content.indexOf('[');
                const jsonEnd = content.lastIndexOf(']') + 1;
                if (jsonStart !== -1 && jsonEnd !== 0) {
                    const jsonStr = content.substring(jsonStart, jsonEnd);
                    const recommendations = JSON.parse(jsonStr);
                    
                    // Add platform-specific recommendations
                    for (const rec of recommendations) {
                        allRecommendations.push({
                            title: rec.title,
                            author: rec.author,
                            platform: rec.platform || platform,
                            type: rec.type,
                            url: rec.url || '', // Include URL from the API response
                            source: 'platform_search'
                        });
                    }
                }
            } catch (error) {
                console.error(`Error searching ${platform}:`, error.message);
                // Add error info but continue with other platforms
                allRecommendations.push({
                    title: `Error searching ${platform} for "${query}"`,
                    author: 'System',
                    platform: platform,
                    type: 'error',
                    source: 'platform_search'
                });
            }
        }
        
        // Validate URLs in the recommendations
        const validatedRecommendations = await validateRecommendationUrls(allRecommendations);
        
        res.json({
            success: true,
            recommendations: validatedRecommendations
        });
        
    } catch (error) {
        console.error('Error in search-platforms endpoint:', error);
        res.status(500).json({
            success: false,
            message: 'Error searching platforms',
            error: error.message
        });
    }
});

// Endpoint to get user interaction history
app.get('/api/interaction-history', authenticateToken, (req, res) => {
    const { limit = 50, offset = 0 } = req.query;
    
    // Query to get user's interaction history
    const query = `
        SELECT title, action, timestamp
        FROM user_interactions 
        WHERE userId = ?
        ORDER BY timestamp DESC
        LIMIT ? OFFSET ?
    `;
    
    db.all(query, [req.user.userId, parseInt(limit), parseInt(offset)], (err, rows) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Internal server error' 
            });
        }
        
        res.json({
            success: true,
            interactions: rows
        });
    });
});

// Endpoint to save search history (works for both authenticated and non-authenticated users)
app.post('/api/search-history', authenticateToken, (req, res) => {
    const { query } = req.body;
    
    if (!query) {
        return res.status(400).json({ 
            success: false, 
            message: 'Query is required' 
        });
    }
    
    if (req.isAuthenticated) {
        // For authenticated users, we'll track searches as interactions
        const queryInteraction = `
            INSERT INTO user_interactions (userId, title, action, timestamp) 
            VALUES (?, ?, ?, ?)
        `;
        
        db.run(queryInteraction, [req.user.userId, query, 'search', new Date().toISOString()], (err) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Internal server error' 
                });
            }
            
            res.json({
                success: true,
                message: 'Search history updated successfully'
            });
        });
    } else {
        // Non-authenticated user - save to session storage
        const sessionToken = req.userContext.sessionToken;
        
        db.get(
            'SELECT id FROM user_sessions WHERE session_token = ?',
            [sessionToken],
            (err, row) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ 
                        success: false, 
                        message: 'Internal server error' 
                    });
                }
                
                // Get existing data and merge with new search
                let sessionData = {};
                if (row && row.data) {
                    try {
                        sessionData = JSON.parse(row.data);
                    } catch (parseError) {
                        console.error('Error parsing existing session data:', parseError);
                    }
                }
                
                // Initialize search history array if not exists
                if (!sessionData.searchHistory) {
                    sessionData.searchHistory = [];
                }
                
                // Add new search (avoid duplicates and keep only recent ones)
                const existingIndex = sessionData.searchHistory.findIndex(item => item.title === query);
                if (existingIndex !== -1) {
                    // Remove existing entry to reposition it as most recent
                    sessionData.searchHistory.splice(existingIndex, 1);
                }
                
                sessionData.searchHistory.unshift({
                    title: query,
                    timestamp: new Date().toISOString()
                });
                
                // Keep only the most recent 20 searches to prevent data bloat
                if (sessionData.searchHistory.length > 20) {
                    sessionData.searchHistory = sessionData.searchHistory.slice(0, 20);
                }
                
                const dataStr = JSON.stringify(sessionData);
                
                if (row) {
                    // Update existing session
                    db.run(
                        'UPDATE user_sessions SET data = ?, expiresAt = datetime("+1 hour") WHERE session_token = ?',
                        [dataStr, sessionToken],
                        function(err) {
                            if (err) {
                                console.error('Database error:', err);
                                return res.status(500).json({ 
                                    success: false, 
                                    message: 'Internal server error' 
                                });
                            }
                            
                            res.json({
                                success: true,
                                message: 'Search history updated successfully',
                                sessionToken: sessionToken
                            });
                        }
                    );
                } else {
                    // Create new session
                    db.run(
                        'INSERT INTO user_sessions (session_token, data, expiresAt) VALUES (?, ?, datetime("+1 hour"))',
                        [sessionToken, dataStr],
                        function(err) {
                            if (err) {
                                console.error('Database error:', err);
                                return res.status(500).json({ 
                                    success: false, 
                                    message: 'Internal server error' 
                                });
                            }
                            
                            res.json({
                                success: true,
                                message: 'Search history updated successfully',
                                sessionToken: sessionToken
                            });
                        }
                    );
                }
            }
        );
    }
});

// Endpoint to get search history (works for both authenticated and non-authenticated users)
app.get('/api/search-history', authenticateToken, (req, res) => {
    if (req.isAuthenticated) {
        // For authenticated users, get from database interactions
        const query = `
            SELECT DISTINCT title, max(timestamp) as timestamp
            FROM user_interactions 
            WHERE userId = ? AND action = 'search'
            GROUP BY title
            ORDER BY timestamp DESC
            LIMIT 20
        `;
        
        db.all(query, [req.user.userId], (err, rows) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Internal server error' 
                });
            }
            
            res.json({
                success: true,
                searchHistory: rows
            });
        });
    } else {
        // Non-authenticated user - get from session storage
        const sessionToken = req.userContext.sessionToken;
        
        db.get(
            'SELECT data FROM user_sessions WHERE session_token = ? AND expiresAt > datetime("now")',
            [sessionToken],
            (err, row) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ 
                        success: false, 
                        message: 'Internal server error' 
                    });
                }
                
                if (row && row.data) {
                    try {
                        const sessionData = JSON.parse(row.data);
                        res.json({
                            success: true,
                            searchHistory: sessionData.searchHistory || []
                        });
                    } catch (parseError) {
                        console.error('Error parsing session data:', parseError);
                        res.json({
                            success: true,
                            searchHistory: []
                        });
                    }
                } else {
                    res.json({
                        success: true,
                        searchHistory: []
                    });
                }
            }
        );
    }
});

// Helper function to validate URLs returned by the neural network
function validateRecommendationUrls(recommendations) {
    return recommendations.map(rec => {
        // Check if the URL is valid
        if (rec.url && typeof rec.url === 'string') {
            try {
                const urlObj = new URL(rec.url);
                // Ensure it's http or https
                if (urlObj.protocol === 'http:' || urlObj.protocol === 'https:') {
                    return rec; // URL is valid
                } else {
                    // If not http/https, make it a search URL for the content
                    const searchQuery = encodeURIComponent(`${rec.title} ${rec.platform || ''}`);
                    rec.url = `https://www.google.com/search?q=${searchQuery}`;
                    return rec;
                }
            } catch (e) {
                // If URL construction fails, create a search URL for the content
                const searchQuery = encodeURIComponent(`${rec.title} ${rec.platform || ''}`);
                rec.url = `https://www.google.com/search?q=${searchQuery}`;
                return rec;
            }
        } else {
            // If no URL is provided, create a search URL for the content
            const searchQuery = encodeURIComponent(`${rec.title} ${rec.platform || ''}`);
            rec.url = `https://www.google.com/search?q=${searchQuery}`;
            return rec;
        }
    });
}

// New endpoint to get content through LLM-generated URLs for selected platforms
app.post('/api/search-content', authenticateToken, async (req, res) => {
    const { query } = req.body;
    
    // Get user profile for additional personalization
    const userProfile = await new Promise((resolve, reject) => {
        db.get(
            'SELECT firstName, lastName, email, username, birthDate, gender, country, city FROM users WHERE id = ?',
            [req.user.userId],
            (err, row) => {
                if (err) {
                    console.error('Database error:', err);
                    return reject(err);
                }
                resolve(row);
            }
        );
    });
    
    // Get user preferences for more personalized results
    const userPreferencesRow = await new Promise((resolve, reject) => {
        db.get(
            'SELECT preferences FROM user_preferences WHERE userId = ?',
            [req.user.userId],
            (err, row) => {
                if (err) {
                    console.error('Database error:', err);
                    return reject(err);
                }
                resolve(row);
            }
        );
    });
    
    let userPreferences = {};
    if (userPreferencesRow && userPreferencesRow.preferences) {
        try {
            userPreferences = JSON.parse(userPreferencesRow.preferences);
        } catch (e) {
            console.error('Error parsing user preferences:', e);
        }
    }
    
    // Get user's selected platforms
    const platformRows = await new Promise((resolve, reject) => {
        db.all(
            'SELECT platformName FROM user_selected_platforms WHERE userId = ?',
            [req.user.userId],
            (err, rows) => {
                if (err) {
                    console.error('Database error:', err);
                    return reject(err);
                }
                resolve(rows);
            }
        );
    });
    
    const platformPreferences = platformRows.map(row => row.platformName);
    
    // Get user's interests
    const interestsRows = await new Promise((resolve, reject) => {
        db.all(
            'SELECT interest, weight FROM user_interests WHERE userId = ? ORDER BY weight DESC',
            [req.user.userId],
            (err, rows) => {
                if (err) {
                    console.error('Database error:', err);
                    return reject(err);
                }
                resolve(rows);
            }
        );
    });
    
    const userInterests = interestsRows.map(row => row.interest);
    
    try {
        // Initialize the Google Generative AI client
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        
        // Construct prompt to have the LLM generate direct URLs for selected platforms
        let platformPrompt = `Generate recent content URLs for the following platforms related to "${query}": `;
        platformPrompt += platformPreferences.length > 0 ? platformPreferences.join(', ') : 'YouTube, Spotify, Netflix, Instagram, X, GitHub, Reddit';
        
        if (userProfile) {
            const { firstName, lastName, gender, country, city, birthDate } = userProfile;
            const age = birthDate ? new Date().getFullYear() - new Date(birthDate).getFullYear() : null;
            
            platformPrompt += ` User is `;
            if (age) platformPrompt += `${age} years old, `;
            if (gender) platformPrompt += `identifies as ${gender}, `;
            if (country) platformPrompt += `from ${country}, `;
            if (city) platformPrompt += `in ${city}. `;
        }
        
        if (userInterests.length > 0) {
            const topInterests = userInterests.slice(0, 5).join(', ');
            platformPrompt += ` User interests include: ${topInterests}. `;
        }
        
        platformPrompt += `Provide the most recent content with dates close to today's date (${new Date().toISOString().split('T')[0]}). `;
        platformPrompt += `Return exactly 5-10 recommendations in JSON format with real, working URLs: [{"title": "content title", "url": "direct_URL_to_content", "platform": "platform_name", "type": "video|music|article|photo|text|code", "author": "content creator/author"}]. `;
        platformPrompt += `IMPORTANT: Every recommendation MUST include a working URL. If you don't know a specific URL, create a search URL like https://www.youtube.com/results?search_query=term. `;
        platformPrompt += `Make URLs as specific as possible to actual content, not just homepage URLs.`;
        
        // Check if the API key is properly configured before making requests
        if (!process.env.GOOGLE_API_KEY) {
            console.error('Google API key not configured. Returning empty recommendations.');
            return res.json({
                success: true,
                recommendations: []
            });
        }
        
        console.log(`[PLATFORM CONTENT QUERY] Sending request to neural network for user ${req.user.userId} with prompt: "${platformPrompt}"`);
        
        const result = await model.generateContent(platformPrompt);
        const response = result.response;
        const content = await response.text();
        
        console.log(`[PLATFORM CONTENT RESPONSE] Received response from neural network: ${content.substring(0, 200)}...`);
        
        // Extract JSON from the response
        const jsonStart = content.indexOf('[');
        const jsonEnd = content.lastIndexOf(']') + 1;
        if (jsonStart !== -1 && jsonEnd !== 0) {
            const jsonStr = content.substring(jsonStart, jsonEnd);
            let recommendations = JSON.parse(jsonStr);
            
            // Validate and ensure all recommendations have URLs
            recommendations = validateRecommendationUrls(recommendations);
            
            res.json({
                success: true,
                recommendations: recommendations
            });
        } else {
            console.log(`[PLATFORM CONTENT RESPONSE] No JSON found in response, using fallback. Response content: ${content.substring(0, 200)}...`);
            
            // If no JSON found, return fallback recommendations
            const fallbackRecommendations = generateFallbackRecommendations(query, userProfile, userPreferences, platformPreferences, userInterests);
            res.json({
                success: true,
                recommendations: fallbackRecommendations
            });
        }
    } catch (error) {
        console.error('Error in search-content endpoint:', error);
        // Generate fallback recommendations when API is unavailable
        const fallbackRecommendations = generateFallbackRecommendations(query, userProfile, userPreferences, platformPreferences, userInterests);
        
        res.json({
            success: true,
            recommendations: fallbackRecommendations,
            error: error.message
        });
    }
});

// Endpoint to get AI recommendations through server with enhanced personalization
app.post('/api/ai-recommendations', authenticateToken, async (req, res) => {
    const { query } = req.body;
    
    // Get user profile for additional personalization
    const userProfile = await new Promise((resolve, reject) => {
        db.get(
            'SELECT firstName, lastName, email, username, birthDate, gender, country, city FROM users WHERE id = ?',
            [req.user.userId],
            (err, row) => {
                if (err) {
                    console.error('Database error:', err);
                    return reject(err);
                }
                resolve(row);
            }
        );
    });
    
    // Get user preferences for more personalized results
    const userPreferencesRow = await new Promise((resolve, reject) => {
        db.get(
            'SELECT preferences FROM user_preferences WHERE userId = ?',
            [req.user.userId],
            (err, row) => {
                if (err) {
                    console.error('Database error:', err);
                    return reject(err);
                }
                resolve(row);
            }
        );
    });
    
    let userPreferences = {};
    if (userPreferencesRow && userPreferencesRow.preferences) {
        try {
            userPreferences = JSON.parse(userPreferencesRow.preferences);
        } catch (e) {
            console.error('Error parsing user preferences:', e);
        }
    }
    
    // Get user's selected platforms
    const platformRows = await new Promise((resolve, reject) => {
        db.all(
            'SELECT platformName FROM user_selected_platforms WHERE userId = ?',
            [req.user.userId],
            (err, rows) => {
                if (err) {
                    console.error('Database error:', err);
                    return reject(err);
                }
                resolve(rows);
            }
        );
    });
    
    const platformPreferences = platformRows.map(row => row.platformName);
    
    // Get user's interests
    const interestsRows = await new Promise((resolve, reject) => {
        db.all(
            'SELECT interest, weight FROM user_interests WHERE userId = ? ORDER BY weight DESC',
            [req.user.userId],
            (err, rows) => {
                if (err) {
                    console.error('Database error:', err);
                    return reject(err);
                }
                resolve(rows);
            }
        );
    });
    
    const userInterests = interestsRows.map(row => row.interest);
    
    // Get user's recent interaction history for more personalized results
    const recentInteractions = await new Promise((resolve, reject) => {
        db.all(
            `SELECT title, action, timestamp 
             FROM user_interactions 
             WHERE userId = ? 
             ORDER BY timestamp DESC 
             LIMIT 20`,
            [req.user.userId],
            (err, rows) => {
                if (err) {
                    console.error('Database error:', err);
                    return reject(err);
                }
                resolve(rows || []);
            }
        );
    });
    
    // Extract top interacted content from history
    const topInteractions = recentInteractions
        .filter(interaction => interaction.action === 'click')
        .slice(0, 10)
        .map(interaction => interaction.title);
    
    try {
        // Initialize the Google Generative AI client
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        
        // Process the query to identify and handle special terms
        let processedQuery = query;
        // Handle special Russian cultural terms by mapping them to more general concepts
        const culturalTermMap = {
            'кацка': 'cat content, cute animals, funny',
            'вредный котик адольф': 'cat memes, humorous cats, viral cat content',
            'адольф': 'cat character, funny cat, viral cat content',
            'warhammer': 'warhammer, tabletop games, fantasy, strategy games, gaming'
        };
        
        let processedText = processedQuery.toLowerCase();
        let generalTerms = [];
        
        // Extract and replace cultural terms with general concepts
        for (const [term, replacement] of Object.entries(culturalTermMap)) {
            if (processedText.includes(term)) {
                generalTerms.push(replacement);
                processedText = processedText.replace(new RegExp(term, 'gi'), replacement);
            }
        }
        
        // Combine the original terms with general equivalents
        let finalQuery = query;
        if (generalTerms.length > 0) {
            finalQuery = `${query}, ${generalTerms.join(', ')}`;
        }
        
        // Construct a simplified prompt that focuses on the core query
        let prompt = `Provide personalized recommendations based on this search: "${finalQuery}". `;
        
        // Include user profile information (excluding full name)
        if (userProfile) {
            const { firstName, lastName, gender, country, city, birthDate } = userProfile;
            const age = birthDate ? new Date().getFullYear() - new Date(birthDate).getFullYear() : null;
            
            prompt += `The user is `;
            if (age) prompt += `${age} years old, `;
            if (gender) prompt += `identifies as ${gender}, `;
            if (country) prompt += `from ${country}, `;
            if (city) prompt += `in the city of ${city}. `;
        }
        
        // Include user preferences
        if (Object.keys(userPreferences).length > 0) {
            // Simplify the preferences by focusing on the most relevant ones
            const topPreferences = Object.keys(userPreferences).slice(0, 5).join(', ');
            prompt += `The user has shown interest in: ${topPreferences}. `;
        } else {
            prompt += `The user has not specified particular interests yet. `;
        }
        
        // Include user interests from the interests table
        if (userInterests.length > 0) {
            const topInterests = userInterests.slice(0, 5).join(', ');
            prompt += `The user's specific interests include: ${topInterests}. `;
        }
        
        // Include user's selected platforms
        if (platformPreferences.length > 0) {
            prompt += `The user has selected these platforms: ${platformPreferences.join(', ')}. `;
            prompt += `Provide recommendations that are available on these platforms: ${platformPreferences.join(', ')}. `;
        } else {
            // Use fallback platforms if no connected platforms
            prompt += `Recommendations should be available on these popular platforms: YouTube, Spotify, Netflix, Instagram, X, GitHub, Reddit. `;
        }
        
        // Include interaction history
        if (topInteractions.length > 0) {
            const recentInteractions = topInteractions.slice(0, 3).join(', ');
            prompt += `Recently, the user engaged with: ${recentInteractions}. `;
        }
        
        // Simplify the output format instruction and ensure fallback URLs
        prompt += `Provide relevant recommendations based on the query: "${query}". ` +
                  `Respond with a JSON array of 5-10 recommendations in this exact format: [{"title": "title", "author": "author", "platform": "platform_name", "type": "video|music|article|photo|text|code", "url": "direct_URL_to_content"}]. ` +
                  `IMPORTANT: Every single item MUST include a real, working URL. If you don't know a specific URL, create a relevant search URL like https://www.youtube.com/results?search_query=term. ` +
                  `Focus on content related to the main topics in the query. ` +
                  `Make URLs as specific as possible to actual content.`;
        
        // Check if the API key is properly configured before making requests
        if (!process.env.GOOGLE_API_KEY) {
            console.error('Google API key not configured. Using fallback recommendations.');
            const fallbackRecommendations = generateFallbackRecommendations(query, userProfile, userPreferences, platformPreferences, userInterests);
            
            res.json({
                success: true,
                recommendations: fallbackRecommendations
            });
            return;
        }
        
        // Log the outgoing request to the neural network
        console.log(`[AI REQUEST] Sending request to neural network for user ${req.user.userId} with query: "${query}"`);
        console.log(`[AI REQUEST] Full prompt sent: ${prompt.substring(0, 500)}...`); // Log first 500 chars of prompt
        
        // Retry logic: try up to 3 times with exponential backoff
        let lastError;
        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                console.log(`[AI REQUEST] Attempt ${attempt}: Sending request to neural network...`);
                
                const result = await model.generateContent(prompt);
                const response = result.response;
                const content = await response.text();
                
                console.log(`[AI RESPONSE] Received response from neural network (attempt ${attempt}): ${content.substring(0, 200)}...`);
                
                // Extract JSON from the response (in case it contains extra text)
                const jsonStart = content.indexOf('[');
                const jsonEnd = content.lastIndexOf(']') + 1;
                if (jsonStart !== -1 && jsonEnd !== 0) {
                    const jsonStr = content.substring(jsonStart, jsonEnd);
                    let recommendations = JSON.parse(jsonStr);
                    
                    // Validate and ensure all recommendations have URLs
                    recommendations = validateRecommendationUrls(recommendations);
                    
                    console.log(`[AI RESPONSE] Parsed ${recommendations.length} recommendations from neural network`);
                    
                    // Return all recommendations without filtering - display everything received
                    console.log(`[AI RESPONSE] Returning ${recommendations.length} recommendations without any platform filtering`);
                    
                    res.json({
                        success: true,
                        recommendations: recommendations
                    });
                    return; // Exit after successful response
                } else {
                    console.log(`[AI RESPONSE] No JSON found in response, returning empty array. Response content: ${content.substring(0, 200)}...`);
                    
                    // If no JSON found, return an empty array
                    res.json({
                        success: true,
                        recommendations: []
                    });
                    return; // Exit after successful response
                }
            } catch (error) {
                lastError = error;
                console.error(`[AI REQUEST] Attempt ${attempt} failed:`, error.message);
                
                // If this wasn't the last attempt, wait before retrying
                if (attempt < 3) {
                    const delay = Math.pow(2, attempt) * 1000; // Exponential backoff: 2s, 4s, 8s
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        
        // If all attempts failed, use fallback recommendations instead of throwing an error
        console.error('All attempts to get AI recommendations failed, using fallback:', lastError);
        const fallbackRecommendations = generateFallbackRecommendations(query, userProfile, userPreferences, platformPreferences, userInterests);
        
        // Validate URLs in fallback recommendations
        const validatedFallbackRecommendations = validateRecommendationUrls(fallbackRecommendations);
        
        res.json({
            success: true,
            recommendations: validatedFallbackRecommendations
        });
    } catch (error) {
        console.error('Error getting AI recommendations:', error);
        // Generate fallback recommendations when API is unavailable
        const fallbackRecommendations = generateFallbackRecommendations(query, userProfile, userPreferences, platformPreferences, userInterests);
        
        // Validate URLs in fallback recommendations
        const validatedFallbackRecommendations = await validateRecommendationUrls(fallbackRecommendations);
        
        res.json({
            success: true,
            recommendations: validatedFallbackRecommendations,
            error: error.message
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});