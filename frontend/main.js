document.addEventListener('DOMContentLoaded', () => {
    const feed = document.getElementById('pinterest-feed');
    
    // Helper function to get session token for non-authenticated users
    function getSessionToken() {
        let sessionToken = localStorage.getItem('sessionToken');
        if (!sessionToken) {
            // Create a new session token
            sessionToken = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            localStorage.setItem('sessionToken', sessionToken);
        }
        return sessionToken;
    }
    
    // Helper function to get auth token with fallback to session token
    function getAuthHeader() {
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        
        if (token) {
            return { 'Authorization': `Bearer ${token}` };
        } else {
            // For non-authenticated users, send session token
            return { 'X-Session-Token': getSessionToken() };
        }
    }
    
    // Helper function to get user-specific storage key
    function getUserStorageKey(keyName) {
        const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || null);
        if (user && user.id) {
            return `user_${user.id}_${keyName}`;
        }
        // For non-authenticated users, use session token as identifier
        return `session_${getSessionToken()}_${keyName}`;
    }

    // Function to create loading placeholder
    function createPlaceholder(platform = null) {
        const placeholder = document.createElement('div');
        placeholder.className = 'feed-item placeholder';
        
        // Add platform-specific data attribute if provided
        if (platform) {
            placeholder.setAttribute('data-platform', platform);
        }
        
        placeholder.innerHTML = `
            <div class="item-wrapper" style="height: 300px;">
                <div class="item-overlay">
                    <div class="item-content">
                        <div class="item-title"></div>
                        <div class="item-author">
                            <div class="author-avatar"></div>
                            <div class="author-name"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        return placeholder;
    }

    // Function to get connected platforms from localStorage
    function getConnectedPlatforms() {
        // Get selected platforms (user chose these) - now user-specific
        const selectedPlatforms = JSON.parse(localStorage.getItem(getUserStorageKey('selectedPlatforms')) || '[]');
        
        // Get authenticated platforms (user actually connected to these)
        const connectedPlatforms = JSON.parse(localStorage.getItem('connectedPlatforms')) || [];
        
        // Return platforms that are both selected AND connected
        return selectedPlatforms.filter(platform => connectedPlatforms.includes(platform));
    }
    
    // Function to get selected platforms (user chose these) - regardless of connection status
    function getSelectedPlatforms() {
        // Get selected platforms (user chose these) - now user-specific
        const selectedPlatforms = JSON.parse(localStorage.getItem(getUserStorageKey('selectedPlatforms')) || '[]');
        return selectedPlatforms;
    }
    
    // Function to check if API token is still valid
    function isTokenValid(platform) {
        const tokenData = JSON.parse(localStorage.getItem(`api_token_${platform}`) || null);
        
        if (!tokenData) {
            return false;
        }
        
        // Check if token has expired
        const currentTime = Date.now();
        const expiresAt = tokenData.expiresAt;
        
        return !expiresAt || currentTime < expiresAt;
    }
    
    // Function to validate a URL by making an HTTP request
    async function validateUrl(url) {
        try {
            // Only validate HTTP/HTTPS URLs
            if (!url || !url.startsWith('http')) {
                return false;
            }
            
            // Use fetch with HEAD request to check if URL is accessible
            const response = await fetch(url, { 
                method: 'HEAD', 
                mode: 'cors',
                cache: 'no-cache'
            });
            
            // Consider URLs with 2xx or 3xx status codes as valid
            return response.status >= 200 && response.status < 400;
        } catch (error) {
            // If there's an error (network error, CORS issue, etc.), consider URL invalid
            console.log(`URL validation failed for ${url}:`, error.message);
            return false;
        }
    }
    
    // Function to validate multiple URLs concurrently
    async function validateUrls(urls) {
        try {
            // Validate all URLs concurrently with a timeout
            const validationPromises = urls.map(url => {
                return Promise.race([
                    validateUrl(url),
                    new Promise(resolve => setTimeout(() => resolve(false), 5000)) // 5 second timeout
                ]);
            });
            
            const results = await Promise.all(validationPromises);
            return results;
        } catch (error) {
            console.error('Error validating URLs:', error);
            return urls.map(() => false);
        }
    }
    
    // Function to get platform-based recommendations
    async function getPlatformRecommendations(searchQuery = null) {
        const connectedPlatforms = getConnectedPlatforms();
        const selectedPlatforms = getSelectedPlatforms(); // Get all selected platforms, not just connected
        
        let recommendations = [];
        
        if (searchQuery) {
            // Perform search across all selected platforms using the new API endpoint
            try {
                const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
                
                if (!token) {
                    console.warn('User not authenticated. Returning empty search results.');
                    return [];
                }
                
                // Log outgoing request to the backend
                console.log(`[FRONTEND REQUEST] Sending search-platforms request to backend with query: "${searchQuery}", platforms: [${selectedPlatforms.join(', ')}]`);
                
                const response = await fetch('/api/search-platforms', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...getAuthHeader() // Use the new auth header function
                    },
                    body: JSON.stringify({ 
                        query: searchQuery,
                        platforms: selectedPlatforms // Search on all selected platforms, not just connected
                    })
                });
                
                // Log response status from backend
                console.log(`[FRONTEND RESPONSE] Received response from backend for search-platforms with status: ${response.status}`);
                
                if (!response.ok) {
                    const errorData = await response.json();
                    console.error(`[FRONTEND ERROR] Backend search-platforms API request failed:`, errorData.message || `Status ${response.status}`);
                    throw new Error(errorData.message || `API request failed with status ${response.status}`);
                }
                
                const data = await response.json();
                
                if (data.success && data.recommendations) {
                    console.log(`[FRONTEND RESPONSE] Received ${data.recommendations.length} recommendations from backend for search-platforms`);
                    // Transform the response to match the expected format
                    recommendations = data.recommendations.map(item => ({
                        type: item.type || 'text',
                        title: item.title,
                        author: item.author,
                        avatar: 'https://randomuser.me/api/portraits/men/1.jpg', // Default avatar
                        platform: item.platform,
                        url: item.url || '' // Include URL from the API response
                    }));
                }
            } catch (error) {
                console.error(`Error searching selected platforms for query "${searchQuery}":`, error);
                // Add error messages to the feed
                selectedPlatforms.forEach(platform => {
                    recommendations.push({
                        type: 'error',
                        title: `Error searching ${platform} for "${searchQuery}"`,
                        author: 'System',
                        avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
                        platform: platform
                    });
                });
            }
        } else {
            // Only fetch from connected platforms if platforms exist
            if (connectedPlatforms.length > 0) {
                // Fetch data from each selected platform using its API
                for (const platform of connectedPlatforms) {
                    try {
                        // In a real implementation, this would make actual API calls
                        // For demo purposes, we're simulating API calls with mock data
                        const platformData = await generatePlatformRecommendationsForPlatform(platform);
                        recommendations = recommendations.concat(platformData);
                    } catch (error) {
                        console.error(`Error fetching data from ${platform}:`, error);
                        // Add an error message to the feed
                        recommendations.push({
                            type: 'error',
                            title: `Error loading content from ${platform}`,
                            author: 'System',
                            avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
                            platform: platform
                        });
                    }
                }
                
                // Add recommendation to connect other selected platforms
                const unconnectedSelectedPlatforms = selectedPlatforms.filter(platform => !connectedPlatforms.includes(platform));
                if (unconnectedSelectedPlatforms.length > 0) {
                    // Add prompt to connect other platforms
                    for (const platform of unconnectedSelectedPlatforms) {
                        recommendations.push({
                            type: 'connect-prompt',
                            title: `Connect to ${platform} for personalized recommendations`,
                            author: 'Connect Platform',
                            avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
                            platform: platform
                        });
                    }
                }
            }
        }
        
        // Filter out recommendations with invalid URLs
        const validRecommendations = [];
        const urlsToValidate = recommendations
            .filter(item => item.url && item.url.trim() !== '')
            .map(item => item.url);
        
        // If we have URLs to validate, do so
        if (urlsToValidate.length > 0) {
            const validationResults = await validateUrls(urlsToValidate);
            
            // Map URLs to their validation results
            const urlValidationMap = {};
            urlsToValidate.forEach((url, index) => {
                urlValidationMap[url] = validationResults[index];
            });
            
            // Filter recommendations based on URL validation
            for (const item of recommendations) {
                // If item has a URL, check if it's valid
                if (item.url && item.url.trim() !== '') {
                    if (urlValidationMap[item.url]) {
                        validRecommendations.push(item);
                    } else {
                        console.log(`Skipping invalid URL: ${item.url}`);
                    }
                } else {
                    // If item doesn't have a URL, still include it (will use fallback image)
                    validRecommendations.push(item);
                }
            }
        } else {
            // If no URLs to validate, include all recommendations
            validRecommendations.push(...recommendations);
        }
        
        // Shuffle the recommendations for variety
        const shuffledRecommendations = shuffleArray(validRecommendations);
        
        return shuffledRecommendations;
    }
    
    // Function to search a specific platform for a query
    async function searchPlatformForQuery(platform, query) {
        // Check if we have a valid API token for this platform
        const tokenData = JSON.parse(localStorage.getItem(`api_token_${platform}`) || null);
        
        if (!tokenData || !tokenData.token) {
            // No API token, return empty array
            console.log(`No API token for ${platform}`);
            return [];
        }
        
        // Check if token is expired
        if (tokenData.expiresAt && Date.now() > tokenData.expiresAt) {
            console.log(`Token for ${platform} has expired`);
            return [];
        }
        
        try {
            // Make API request to backend to search across connected platforms
            const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
            
            if (!token) {
                console.warn('User not authenticated. Returning empty search results.');
                return [];
            }
            
            // Log outgoing request to the backend
            console.log(`[FRONTEND REQUEST] Sending platform search request to backend for platform: ${platform}, query: "${query}"`);
            
            const response = await fetch('/api/search-platforms', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeader() // Use the new auth header function
                },
                body: JSON.stringify({ 
                    query: query,
                    platforms: [platform] // Search only on this specific platform
                })
            });
            
            // Log response status from backend
            console.log(`[FRONTEND RESPONSE] Received response from backend for ${platform} search with status: ${response.status}`);
            
            if (!response.ok) {
                const errorData = await response.json();
                console.error(`[FRONTEND ERROR] Backend search API request failed:`, errorData.message || `Status ${response.status}`);
                throw new Error(errorData.message || `API request failed with status ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success && data.recommendations) {
                console.log(`[FRONTEND RESPONSE] Received ${data.recommendations.length} recommendations from backend for ${platform}`);
                // Transform the response to match the expected format
                return data.recommendations.map(item => ({
                    type: item.type || 'text',
                    title: item.title,
                    author: item.author,
                    avatar: 'https://randomuser.me/api/portraits/men/1.jpg', // Default avatar
                    platform: item.platform,
                    url: item.url || '' // Include URL from the API response
                }));
            } else {
                console.warn('Server returned no recommendations for platform search');
                return [];
            }
        } catch (error) {
            console.error(`Error searching ${platform} for query "${query}":`, error);
            return [];
        }
    }
    
    // Function to fetch data from connected platforms using their API tokens
    async function generatePlatformRecommendationsForPlatform(platform) {
        // Check if we have a valid API token for this platform
        const tokenData = JSON.parse(localStorage.getItem(`api_token_${platform}`) || null);
        
        if (!tokenData || !tokenData.token) {
            // No API token, return empty array
            console.log(`No API token for ${platform}`);
            return [];
        }
        
        // Check if token is expired
        if (tokenData.expiresAt && Date.now() > tokenData.expiresAt) {
            console.log(`Token for ${platform} has expired`);
            return [];
        }
        
        try {
            // Simulate API call with API token
            // In a real implementation, this would be an actual API call with the API token
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Return mock data based on platform but showing user-specific content
            const mockData = {
                'YouTube': [
                    { type: 'video', title: 'Videos from your subscriptions', author: 'YouTube', avatar: 'https://randomuser.me/api/portraits/men/1.jpg', platform: 'YouTube', url: 'https://www.youtube.com/feed/subscriptions' },
                    { type: 'video', title: 'Based on your watch history', author: 'YouTube Algorithm', avatar: 'https://randomuser.me/api/portraits/women/2.jpg', platform: 'YouTube', url: 'https://www.youtube.com/feed/recommendations' },
                    { type: 'video', title: 'Trending in your area', author: 'Local YouTube', avatar: 'https://randomuser.me/api/portraits/men/3.jpg', platform: 'YouTube', url: 'https://www.youtube.com/feed/trending' }
                ],
                'Spotify': [
                    { type: 'music', title: 'Your daily mix', author: 'Spotify', avatar: 'https://randomuser.me/api/portraits/women/4.jpg', platform: 'Spotify', url: 'https://open.spotify.com/collection/playlists' },
                    { type: 'music', title: 'Discover weekly for you', author: 'Spotify', avatar: 'https://randomuser.me/api/portraits/men/5.jpg', platform: 'Spotify', url: 'https://open.spotify.com/playlist/37i9dQZEVXcJZyENORQR4j' },
                    { type: 'music', title: 'Recently played tracks', author: 'Spotify', avatar: 'https://randomuser.me/api/portraits/women/6.jpg', platform: 'Spotify', url: 'https://open.spotify.com/collection/recently-played' }
                ],
                'Netflix': [
                    { type: 'video', title: 'Continue watching', author: 'Netflix', avatar: 'https://randomuser.me/api/portraits/men/1.jpg', platform: 'Netflix', url: 'https://www.netflix.com/browse/my-list' },
                    { type: 'video', title: 'Because you watched', author: 'Netflix', avatar: 'https://randomuser.me/api/portraits/women/2.jpg', platform: 'Netflix', url: 'https://www.netflix.com/recommendations' },
                    { type: 'video', title: 'Popular in your country', author: 'Netflix', avatar: 'https://randomuser.me/api/portraits/men/3.jpg', platform: 'Netflix', url: 'https://www.netflix.com/browse/genre/83' }
                ],
                'Instagram': [
                    { type: 'photo', title: 'Posts from accounts you follow', author: 'Instagram Feed', avatar: 'https://randomuser.me/api/portraits/women/3.jpg', platform: 'Instagram', url: 'https://www.instagram.com' },
                    { type: 'photo', title: 'Suggestions for you', author: 'Instagram Algorithm', avatar: 'https://randomuser.me/api/portraits/men/4.jpg', platform: 'Instagram', url: 'https://www.instagram.com/explore/' },
                    { type: 'photo', title: 'Trending in your area', author: 'Instagram', avatar: 'https://randomuser.me/api/portraits/women/5.jpg', platform: 'Instagram', url: 'https://www.instagram.com/explore/tags/explore/' }
                ],
                'Facebook': [
                    { type: 'photo', title: 'From your friends', author: 'Facebook Feed', avatar: 'https://randomuser.me/api/portraits/men/5.jpg', platform: 'Facebook', url: 'https://www.facebook.com' },
                    { type: 'video', title: 'Watch suggestions', author: 'Facebook', avatar: 'https://randomuser.me/api/portraits/women/1.jpg', platform: 'Facebook', url: 'https://www.facebook.com/watch/' },
                    { type: 'text', title: 'Pages you follow', author: 'Facebook', avatar: 'https://randomuser.me/api/portraits/men/2.jpg', platform: 'Facebook', url: 'https://www.facebook.com/pages/' }
                ],
                'X': [
                    { type: 'text', title: 'Your timeline', author: 'X Feed', avatar: 'https://randomuser.me/api/portraits/women/2.jpg', platform: 'X', url: 'https://x.com/home' },
                    { type: 'text', title: 'Trending in your topics', author: 'X', avatar: 'https://randomuser.me/api/portraits/men/3.jpg', platform: 'X', url: 'https://x.com/explore' },
                    { type: 'text', title: 'Posts from accounts you follow', author: 'X', avatar: 'https://randomuser.me/api/portraits/women/4.jpg', platform: 'X', url: 'https://x.com/home' }
                ],
                'Reddit': [
                    { type: 'text', title: 'Posts from subscribed subreddits', author: 'Reddit', avatar: 'https://randomuser.me/api/portraits/men/4.jpg', platform: 'Reddit', url: 'https://www.reddit.com/' },
                    { type: 'text', title: 'Popular in your communities', author: 'Reddit', avatar: 'https://randomuser.me/api/portraits/women/5.jpg', platform: 'Reddit', url: 'https://www.reddit.com/r/popular/' },
                    { type: 'text', title: 'For you based on history', author: 'Reddit', avatar: 'https://randomuser.me/api/portraits/men/6.jpg', platform: 'Reddit', url: 'https://www.reddit.com/r/foryou/' }
                ],
                'GitHub': [
                    { type: 'code', title: 'Activity from repositories you contribute to', author: 'GitHub', avatar: 'https://randomuser.me/api/portraits/women/1.jpg', platform: 'GitHub', url: 'https://github.com/' },
                    { type: 'code', title: 'Trending repositories', author: 'GitHub', avatar: 'https://randomuser.me/api/portraits/men/2.jpg', platform: 'GitHub', url: 'https://github.com/trending' },
                    { type: 'code', title: 'Issues assigned to you', author: 'GitHub', avatar: 'https://randomuser.me/api/portraits/women/3.jpg', platform: 'GitHub', url: 'https://github.com/issues' }
                ],
                'LinkedIn': [
                    { type: 'article', title: 'Posts from your network', author: 'LinkedIn Feed', avatar: 'https://randomuser.me/api/portraits/men/1.jpg', platform: 'LinkedIn', url: 'https://www.linkedin.com/feed/' },
                    { type: 'article', title: 'Job recommendations', author: 'LinkedIn', avatar: 'https://randomuser.me/api/portraits/women/2.jpg', platform: 'LinkedIn', url: 'https://www.linkedin.com/jobs/' },
                    { type: 'article', title: 'Learning recommendations', author: 'LinkedIn Learning', avatar: 'https://randomuser.me/api/portraits/men/3.jpg', platform: 'LinkedIn', url: 'https://www.linkedin.com/learning/' }
                ],
                default: [
                    { type: 'photo', title: `Personalized content from ${platform}`, author: `${platform} service`, avatar: 'https://randomuser.me/api/portraits/men/1.jpg', platform: platform, url: '#' },
                ]
            };
            
            // Return data for the specific platform or default if not found
            return mockData[platform] || mockData.default;
        } catch (error) {
            console.error(`Error fetching data from ${platform}:`, error);
            return [];
        }
    }
    
    // Function to show message when no platforms are connected
    function showNoPlatformsMessage() {
        if (!feed) return;
        
        feed.innerHTML = `
            <div class="no-platforms-message">
                <h2>No Connected Platforms</h2>
                <p>You haven't connected any platforms yet. Connect your platforms to get personalized recommendations.</p>
            </div>
        `;
    }
    
    // Function to show message when selected platforms are not connected
    function showPartialPlatformsMessage() {
        if (!feed) return;
        
        feed.innerHTML = `
            <div class="no-platforms-message">
                <h2>Connect Your Selected Platforms</h2>
                <p>You have selected platforms but haven't connected them yet. Connect your platforms to get personalized recommendations.</p>
            </div>
        `;
    }
    
    // Function to shuffle an array
    function shuffleArray(array) {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    }

    // Function to create a single feed item
    function createFeedItem(itemData) {
        const item = document.createElement('div');
        item.className = 'feed-item';

        // Add platform indicator to the item if available
        const platformIndicator = itemData.platform ? `<span class="platform-badge">${itemData.platform}</span>` : '';
        
        // Format content based on type
        let content = '';
        if (itemData.type === 'error') {
            // Skip error messages
            return null;
        } else if (itemData.type === 'info') {
            // Skip info messages like "No recommendations found for this query"
            return null;
        } else if (itemData.type === 'connect-prompt') {
            // Skip connect-prompt items entirely
            return null;
        } else {
            // For all other types, create content with background image or gradient
            let backgroundImageStyle = '';
            
            // Use the item's URL as the background image if it has a URL ending with image extension
            if (itemData.url && itemData.url.trim() !== '') {
                // Check if the URL looks like an image URL
                const imageUrlPattern = /\.(jpeg|jpg|gif|png|webp|bmp|svg)$/i;
                if (imageUrlPattern.test(itemData.url.split('?')[0])) {
                    backgroundImageStyle = `background-image: url('${itemData.url}');`;
                } else {
                    // Generate a random image using picsum if no image URL provided directly
                    const randomHeight = Math.floor(Math.random() * (450 - 200 + 1)) + 200;
                    const randomImageUrl = `https://picsum.photos/400/${randomHeight}?random=${Math.random()}`;
                    backgroundImageStyle = `background-image: url('${randomImageUrl}');`;
                }
            } else {
                // Generate a random image if no URL is provided
                const randomHeight = Math.floor(Math.random() * (450 - 200 + 1)) + 200;
                const randomImageUrl = `https://picsum.photos/400/${randomHeight}?random=${Math.random()}`;
                backgroundImageStyle = `background-image: url('${randomImageUrl}');`;
            }
            
            // Create content with background image
            content = `
                <div class="item-wrapper" style="${backgroundImageStyle}">
                    <div class="item-overlay">
                        <div class="item-content">
                            <p class="item-title">${itemData.title}</p>
                            <div class="item-author">
                                <img src="${itemData.avatar}" alt="${itemData.author}" class="author-avatar">
                                <span>${itemData.author}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        item.innerHTML = `
            ${content}
            ${platformIndicator}
        `;
        
        // Add platform-specific data attribute for styling
        if (itemData.platform) {
            item.setAttribute('data-platform', itemData.platform);
            // Add a class that reflects the platform for gradient styling
            item.classList.add(`platform-${itemData.platform.toLowerCase().replace(/\s+/g, '-')}`);
        }
        
        // Add event listener to make the entire item clickable if it has a URL
        if (itemData.url && itemData.url.trim() !== '') {
            item.style.cursor = 'pointer';
            item.addEventListener('click', (e) => {
                // Prevent click if it was on a button or link inside the item
                if (e.target.tagName === 'BUTTON' || e.target.tagName === 'A') {
                    return;
                }
                
                // Track the click interaction
                trackInteraction(itemData.title, 'click');
                
                // Open the URL in a new tab
                window.open(itemData.url, '_blank');
            });
        }
        
        return item;
    }

    // Function to populate the feed with initial placeholders
    function initializeFeedWithPlaceholders(count = 10) {
        if (!feed) return;
        
        // Clear any existing content
        feed.innerHTML = '';
        
        // Add placeholders to the feed (using generic placeholders since we don't know the platforms yet)
        for (let i = 0; i < count; i++) {
            const placeholder = createPlaceholder();
            feed.appendChild(placeholder);
        }
    }

    // Function to populate the feed with recommendations (one by one)
    async function populateFeed(searchQuery = null) {
        if (!feed) return;

        // Initialize with placeholders
        // Use platform-specific placeholders when we have platform information
        if (searchQuery) {
            // For search, we don't know the platforms yet, so use generic placeholders
            initializeFeedWithPlaceholders(10);
        } else {
            // For personalized feed, try to use platform-specific placeholders
            const connectedPlatforms = getConnectedPlatforms();
            if (connectedPlatforms.length > 0) {
                // Clear any existing content
                feed.innerHTML = '';
                
                // Add platform-specific placeholders
                for (let i = 0; i < 10; i++) {
                    // Cycle through connected platforms
                    const platform = connectedPlatforms[i % connectedPlatforms.length];
                    const placeholder = createPlaceholder(platform);
                    feed.appendChild(placeholder);
                }
            } else {
                // Use generic placeholders if no platforms connected
                initializeFeedWithPlaceholders(10);
            }
        }
        
        try {
            // Get both platform-based and AI recommendations
            let platformRecommendations = [];
            let aiRecommendations = [];
            
            // Get platform recommendations if not searching
            if (!searchQuery) {
                platformRecommendations = await getPlatformRecommendations(searchQuery);
            }
            
            // Get AI recommendations based on user preferences for personalized feed
            if (!searchQuery) {
                // Create a personalized AI query based on user interests and preferences
                const userInterests = JSON.parse(localStorage.getItem(getUserStorageKey('selectedInterests')) || '[]');
                const userPreferences = await getUserPreferences();
                const selectedPlatforms = getSelectedPlatforms();
                
                let aiQuery = '';
                if (userInterests.length > 0) {
                    aiQuery = `content related to: ${userInterests.slice(0, 3).join(', ')}`;
                } else if (Object.keys(userPreferences).length > 0) {
                    const topPreferences = Object.entries(userPreferences)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 3)
                        .map(item => item[0]);
                    if (topPreferences.length > 0) {
                        aiQuery = `content related to: ${topPreferences.join(', ')}`;
                    }
                } else {
                    aiQuery = 'trending content and popular topics';
                }
                
                if (selectedPlatforms.length > 0) {
                    aiQuery += `. Content should be available on platforms: ${selectedPlatforms.join(', ')}`;
                }
                
                aiRecommendations = await getAIRecommendations(aiQuery);
            }
            
            // Get AI recommendations for search queries
            if (searchQuery) {
                aiRecommendations = await getAIRecommendations(searchQuery);
            }
            
            // Combine platform and AI recommendations
            const recommendations = [...aiRecommendations, ...platformRecommendations];
            
            // Remove all placeholders
            const placeholders = feed.querySelectorAll('.feed-item.placeholder');
            placeholders.forEach(placeholder => placeholder.remove());
            
            // Add recommendations one by one with a delay for smooth effect
            // Filter out null items (skipped items)
            for (let i = 0; i < recommendations.length; i++) {
                const itemData = recommendations[i];
                const feedItem = createFeedItem(itemData);
                
                // Skip null items (filtered out items like connect-prompts)
                if (feedItem) {
                    // Add to feed
                    feed.appendChild(feedItem);
                    
                    // Add a slight delay between each item for smooth effect
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }
            
            // Add additional placeholders at the bottom for infinite scroll
            // Use platform-specific placeholders if possible
            const connectedPlatforms = getConnectedPlatforms();
            if (connectedPlatforms.length > 0) {
                for (let i = 0; i < 5; i++) {
                    // Cycle through connected platforms
                    const platform = connectedPlatforms[i % connectedPlatforms.length];
                    const placeholder = createPlaceholder(platform);
                    placeholder.classList.add('loading-bottom');
                    feed.appendChild(placeholder);
                }
            } else {
                // Add generic placeholders
                addLoadingPlaceholders(5);
            }
            
        } catch (error) {
            console.error('Error populating feed:', error);
            
            // Remove placeholders and show error
            const placeholders = feed.querySelectorAll('.feed-item.placeholder');
            placeholders.forEach(placeholder => placeholder.remove());
            
            feed.innerHTML = `
                <div class="error-message">
                    <h3>Error loading recommendations</h3>
                    <p>There was an issue loading recommendations. Please try again later.</p>
                </div>
            `;
        }
    }

    // Function to add loading placeholders to the bottom
    function addLoadingPlaceholders(count = 3) {
        for (let i = 0; i < count; i++) {
            const placeholder = createPlaceholder();
            placeholder.classList.add('loading-bottom');
            feed.appendChild(placeholder);
        }
    }

    // Function to remove loading placeholders
    function removeLoadingPlaceholders() {
        const loadingPlaceholders = feed.querySelectorAll('.feed-item.placeholder.loading-bottom');
        loadingPlaceholders.forEach(placeholder => placeholder.remove());
    }
    
    // Function to add loading placeholders to the bottom
    function addLoadingPlaceholders(count = 3, platform = null) {
        for (let i = 0; i < count; i++) {
            const placeholder = createPlaceholder(platform);
            placeholder.classList.add('loading-bottom');
            feed.appendChild(placeholder);
        }
    }

    // Function to remove loading placeholders
    function removeLoadingPlaceholders() {
        const loadingPlaceholders = feed.querySelectorAll('.feed-item.placeholder.loading-bottom');
        loadingPlaceholders.forEach(placeholder => placeholder.remove());
    }
    
    // Function to load more recommendations when user scrolls to bottom
    async function loadMoreRecommendations() {
        if (window.loadingMore) return; // Prevent multiple simultaneous loads
        
        window.loadingMore = true;
        
        try {
            // Remove existing loading placeholders
            removeLoadingPlaceholders();
            
            // Add temporary loading indicators while loading more
            addLoadingPlaceholders(3);
            
            // Simulate loading delay for better UX
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Get additional recommendations (without search query, so personalized)
            const moreRecommendations = await getPersonalizedRecommendations();
            
            // Remove the temporary loading indicators
            removeLoadingPlaceholders();
            
            // Add new recommendations one by one
            // Filter out null items (skipped items)
            for (let i = 0; i < moreRecommendations.length; i++) {
                const itemData = moreRecommendations[i];
                const feedItem = createFeedItem(itemData);
                
                // Skip null items (filtered out items like connect-prompts)
                if (feedItem) {
                    // Add to feed
                    feed.appendChild(feedItem);
                    
                    // Add a slight delay between each item for smooth effect
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }
            
            // Add new loading placeholders at the bottom
            // Use a default platform or determine from context
            addLoadingPlaceholders(5);
            
        } catch (error) {
            console.error('Error loading more recommendations:', error);
            
            // Remove loading placeholders and add error indicator
            removeLoadingPlaceholders();
            
            const errorItem = document.createElement('div');
            errorItem.className = 'feed-item error';
            errorItem.innerHTML = `
                <div class="error-content">
                    <h3>Error loading more recommendations</h3>
                    <p>Click to try again</p>
                </div>
            `;
            errorItem.addEventListener('click', () => {
                loadMoreRecommendations();
            });
            
            feed.appendChild(errorItem);
        } finally {
            window.loadingMore = false;
        }
    }

    // Function to get personalized recommendations without search based on user preferences
    async function getPersonalizedRecommendations() {
        // Get user preferences
        const userPreferences = await getUserPreferences();
        
        // Get user's selected platforms
        const selectedPlatforms = getSelectedPlatforms();
        
        // Get user's interests
        const userInterests = JSON.parse(localStorage.getItem(getUserStorageKey('selectedInterests')) || '[]');
        
        // Get user profile if authenticated
        let userProfile = null;
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        if (token) {
            try {
                userProfile = await getUserProfile();
            } catch (error) {
                console.error('Error getting user profile:', error);
            }
        }
        
        // Create a focused AI query that prioritizes user interests and preferences
        let aiQuery = '';
        
        // Prioritize user interests as the main query
        if (userInterests.length > 0) {
            // Use top interests to form the query
            aiQuery = `content related to: ${userInterests.slice(0, 3).join(', ')}`;
        } else if (Object.keys(userPreferences).length > 0) {
            // Fallback to top preferences if no interests
            const topPreferences = Object.entries(userPreferences)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3) // Get top 3 preferences
                .map(item => item[0]);
            if (topPreferences.length > 0) {
                aiQuery = `content related to: ${topPreferences.join(', ')}`;
            }
        } else {
            // Default query if no preferences or interests
            aiQuery = 'trending content and popular topics';
        }
        
        // Add platform context if available
        if (selectedPlatforms.length > 0) {
            aiQuery += `. Content should be available on platforms: ${selectedPlatforms.join(', ')}`;
        }
        
        // Get AI recommendations based on comprehensive user context
        const aiRecommendations = await getAIRecommendations(aiQuery);
        
        // Also get platform recommendations
        const platformRecommendations = await getPlatformRecommendations();
        
        // Combine and shuffle the results
        const allRecommendations = [...aiRecommendations, ...platformRecommendations];
        return shuffleArray(allRecommendations);
    }

    // Initialize the feed with placeholders immediately
    initializeFeedWithPlaceholders(10);
    
    // Then populate with actual recommendations
    setTimeout(async () => {
        // Always try to show AI recommendations, even if no platforms are connected
        await populateFeed();
    }, 500);
    
    // Add scroll event listener for infinite scrolling
    let lastScrollTop = 0;
    window.addEventListener('scroll', async () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // Check if user is near the bottom of the page
        if (scrollTop > lastScrollTop) { // Scrolling down
            const documentHeight = document.documentElement.scrollHeight;
            const windowHeight = window.innerHeight;
            const scrollPosition = scrollTop + windowHeight;
            
            // If user is within 500px of the bottom, load more
            if (documentHeight - scrollPosition < 500) {
                await loadMoreRecommendations();
            }
        }
        
        lastScrollTop = scrollTop;
    });
    
    // Add event listener to refresh recommendations if the user connects more platforms
    // This would be triggered by a custom event when auth status changes
    document.addEventListener('platformsChanged', async () => {
        await populateFeed();
    });
    
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    const searchSuggestions = document.getElementById('searchSuggestions');
    const historyItemsContainer = document.getElementById('historyItems');
    const searchHistoryHeader = document.getElementById('searchHistoryHeader');
    const historyToggle = document.getElementById('historyToggle');
    const searchHistory = document.getElementById('searchHistory');
    
    // Initialize search history from localStorage
    let searchHistoryList = JSON.parse(localStorage.getItem('searchHistory')) || [];
    
    // Function to show search suggestions
    function showSearchSuggestions(query) {
        searchSuggestions.innerHTML = '';
        
        if (query) {
            // Filter history based on current query
            const filteredHistory = searchHistoryList.filter(item => 
                item.toLowerCase().includes(query.toLowerCase())
            );
            
            // Add matching history items to suggestions
            filteredHistory.forEach(item => {
                const suggestionItem = document.createElement('div');
                suggestionItem.className = 'suggestion-item';
                suggestionItem.textContent = item;
                suggestionItem.addEventListener('click', () => {
                    searchInput.value = item;
                    performSearch(item);
                    searchSuggestions.style.display = 'none';
                });
                searchSuggestions.appendChild(suggestionItem);
            });
        } else {
            // Show all history items when query is empty (on focus)
            searchHistoryList.slice(0, 5).forEach(item => {
                const suggestionItem = document.createElement('div');
                suggestionItem.className = 'suggestion-item';
                suggestionItem.textContent = item;
                suggestionItem.addEventListener('click', () => {
                    searchInput.value = item;
                    performSearch(item);
                    searchSuggestions.style.display = 'none';
                });
                searchSuggestions.appendChild(suggestionItem);
            });
        }
        
        // Add a "search for current query" option if there's a query
        if (query && searchSuggestions.children.length === 0) {
            const suggestionItem = document.createElement('div');
            suggestionItem.className = 'suggestion-item';
            suggestionItem.textContent = `Search for: "${query}"`;
            suggestionItem.addEventListener('click', () => {
                performSearch(query);
                searchSuggestions.style.display = 'none';
            });
            searchSuggestions.appendChild(suggestionItem);
        } else if (query) {
            const searchCurrent = document.createElement('div');
            searchCurrent.className = 'suggestion-item';
            searchCurrent.textContent = `Search for: "${query}"`;
            searchCurrent.addEventListener('click', () => {
                performSearch(query);
                searchSuggestions.style.display = 'none';
            });
            searchSuggestions.appendChild(searchCurrent);
        }
    }
    
    // Event listener to make the search bar "move" to the top when clicked
    searchInput.addEventListener('click', function() {
        // Add the 'active' class to move the search bar to the top
        document.querySelector('.search-container').classList.add('active');
        
        // Show search history when input is clicked
        const query = this.value.trim();
        if (query.length === 0 && searchHistoryList.length > 0) {
            showSearchSuggestions('');
        }
        searchSuggestions.style.display = 'block';
    });
    
    // Event listener for input changes
    searchInput.addEventListener('input', function() {
        const query = this.value.trim();
        
        if (query.length > 0) {
            // Show suggestions based on search history
            showSearchSuggestions(query);
            searchSuggestions.style.display = 'block';
        } else {
            searchSuggestions.style.display = 'none';
        }
    });
    
    // Event listener for focus
    searchInput.addEventListener('focus', function() {
        // Make sure the search bar is at the top when focused
        document.querySelector('.search-container').classList.add('active');
        
        // Show search history when input is focused
        const query = this.value.trim();
        if (query.length === 0 && searchHistoryList.length > 0) {
            showSearchSuggestions('');
        }
        searchSuggestions.style.display = 'block';
    });
    
    // Event listener for keypress (Enter to search)
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const query = this.value.trim();
            if (query) {
                performSearch(query);
                searchSuggestions.style.display = 'none';
            }
        }
    });
    
    // Event listener for when the input loses focus
    searchInput.addEventListener('blur', function() {
        // Optionally, we can hide suggestions after a short delay to allow clicking on them
        setTimeout(() => {
            searchSuggestions.style.display = 'none';
        }, 200);
    });
    
    // Function to get user preferences from the backend
    async function getUserPreferences() {
        try {
            const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
            if (!token) {
                // If no token, use localStorage as fallback
                return JSON.parse(localStorage.getItem('userPreferences') || '{}');
            }
            
            const response = await fetch('/api/preferences', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeader() // Use the new auth header function
                }
            });
            
            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }
            
            const data = await response.json();
            return data.preferences || {};
        } catch (error) {
            console.error('Error getting user preferences:', error);
            // Fallback to localStorage
            return JSON.parse(localStorage.getItem('userPreferences') || '{}');
        }
    }

    // Function to save user preferences to the backend
    async function saveUserPreferences(preferences) {
        try {
            const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
            if (!token) {
                // If no token, save to localStorage as fallback
                localStorage.setItem('userPreferences', JSON.stringify(preferences));
                return;
            }
            
            const response = await fetch('/api/preferences', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeader() // Use the new auth header function
                },
                body: JSON.stringify({ preferences })
            });
            
            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }
            
            // Also save to localStorage as a backup
            localStorage.setItem('userPreferences', JSON.stringify(preferences));
        } catch (error) {
            console.error('Error saving user preferences:', error);
            // Still save to localStorage as a backup even if backend fails
            localStorage.setItem('userPreferences', JSON.stringify(preferences));
        }
    }

    // Function to get AI recommendations via server using the AI recommendations endpoint
    async function getAIRecommendations(query) {
        try {
            // Get authentication token
            const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
            
            if (!token) {
                console.warn('User not authenticated. Returning empty recommendations.');
                return [];
            }
            
            // Log outgoing request to the backend
            console.log(`[FRONTEND REQUEST] Sending ai-recommendations request to backend with query: "${query}"`);
            
            const response = await fetch('/api/ai-recommendations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeader() // Use the new auth header function
                },
                body: JSON.stringify({ query })
            });
            
            // Log response status from backend
            console.log(`[FRONTEND RESPONSE] Received response from backend with status: ${response.status}`);
            
            if (!response.ok) {
                const errorData = await response.json();
                console.error(`[FRONTEND ERROR] Backend API request failed:`, errorData.message || `Status ${response.status}`);
                throw new Error(errorData.message || `API request failed with status ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success && data.recommendations) {
                console.log(`[FRONTEND RESPONSE] Received ${data.recommendations.length} recommendations from backend`);
                
                // If we got empty recommendations, add a warning to show the user
                if (data.recommendations.length === 0) {
                    console.warn(`AI API returned 0 recommendations for query: "${query}"`);
                    
                    // Add a fallback recommendation to inform the user
                    return [{
                        type: 'info',
                        title: `No recommendations found for "${query}"`,
                        author: 'AI Assistant',
                        avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
                        platform: 'AI',
                        message: 'The AI is still learning about this topic. Try searching for something more general.'
                    }];
                }
                
                return data.recommendations;
            } else {
                console.warn('Server returned no recommendations');
                return [];
            }
        } catch (error) {
            console.error('Error getting AI recommendations:', error);
            // Return an error recommendation to show the user
            return [{
                type: 'error',
                title: `Error getting recommendations for "${query}"`,
                author: 'System',
                avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
                platform: 'AI',
                message: 'Unable to fetch AI recommendations. Showing platform-based recommendations instead.'
            }];
        }
    }

    // Function to track user preferences based on search history
    async function trackUserPreferences(query) {
        const userPreferences = await getUserPreferences();
        
        // Add or increment the preference count for this query
        userPreferences[query] = (userPreferences[query] || 0) + 1;
        
        // Limit to top 20 preferences to avoid storage issues
        const sortedPreferences = Object.entries(userPreferences)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 20);
        
        const topPreferences = {};
        sortedPreferences.forEach(([key, value]) => {
            topPreferences[key] = value;
        });
        
        // Save updated preferences
        await saveUserPreferences(topPreferences);
    }
    
    // Function to track a user interaction (click, view, etc.)
    async function trackInteraction(title, action) {
        // Track this interaction in local storage
        const interactions = JSON.parse(localStorage.getItem('userInteractions') || '[]');
        
        // Add this interaction with timestamp
        interactions.push({
            title: title,
            timestamp: new Date().toISOString(),
            action: action
        });
        
        // Keep only the most recent 100 interactions
        if (interactions.length > 100) {
            interactions.shift(); // Remove the oldest interaction
        }
        
        localStorage.setItem('userInteractions', JSON.stringify(interactions));
        
        // If authenticated, send to backend
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        if (token) {
            try {
                await fetch('/api/track-interaction', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...getAuthHeader() // Use the new auth header function
                    },
                    body: JSON.stringify({
                        title: title,
                        action: action,
                        timestamp: new Date().toISOString()
                    })
                });
            } catch (error) {
                console.error('Error sending interaction to server:', error);
            }
        }
    }
    
    // Function to track a search action in user interactions
    async function trackSearch(query) {
        // Track this search in local storage
        const interactions = JSON.parse(localStorage.getItem('userInteractions') || '[]');
        
        // Add this search with timestamp
        interactions.push({
            title: query,
            timestamp: new Date().toISOString(),
            action: 'search'
        });
        
        // Keep only the most recent 100 interactions
        if (interactions.length > 100) {
            interactions.shift(); // Remove the oldest interaction
        }
        
        localStorage.setItem('userInteractions', JSON.stringify(interactions));
        
        // If authenticated, send to backend
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        if (token) {
            try {
                await fetch('/api/track-interaction', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...getAuthHeader() // Use the new auth header function
                    },
                    body: JSON.stringify({
                        title: query,
                        action: 'search',
                        timestamp: new Date().toISOString()
                    })
                });
            } catch (error) {
                console.error('Error sending search to server:', error);
            }
        }
    }
    
    // Function to add gradient animation to search input during loading
    function addSearchLoadingAnimation() {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            // Add animation class
            searchInput.classList.add('loading');
            
            // Add keyframe animation dynamically if not already present
            if (!document.getElementById('search-loading-animation')) {
                const style = document.createElement('style');
                style.id = 'search-loading-animation';
                style.textContent = `
                    @keyframes gradientShift {
                        0% { background-position: 0% 50%; }
                        50% { background-position: 100% 50%; }
                        100% { background-position: 0% 50%; }
                    }
                    .search-input.loading {
                        background: linear-gradient(90deg, #ff4500, #ff8c00, #ffd700, #ff4500);
                        background-size: 400% 400%;
                        animation: gradientShift 6s ease infinite;
                        border-color: #ff4500;
                        color: #333;
                    }
                `;
                document.head.appendChild(style);
            }
        }
    }
    
    // Function to remove gradient animation from search input
    function removeSearchLoadingAnimation() {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.classList.remove('loading');
        }
    }

    // Function to perform the actual search
    async function performSearch(query) {
        // Add to search history
        addToSearchHistory(query);
        
        // Track user preferences
        trackUserPreferences(query);
        
        // Track the search action for personalization
        trackSearch(query);
        
        // Add gradient animation to search input
        addSearchLoadingAnimation();
        
        // Clear the feed and add placeholders while searching
        if (feed) {
            // Use platform-specific placeholders when possible
            const selectedPlatforms = getSelectedPlatforms();
            if (selectedPlatforms.length > 0) {
                // Clear any existing content
                feed.innerHTML = '';
                
                // Add platform-specific placeholders
                for (let i = 0; i < 8; i++) {
                    // Cycle through selected platforms
                    const platform = selectedPlatforms[i % selectedPlatforms.length];
                    const placeholder = createPlaceholder(platform);
                    feed.appendChild(placeholder);
                }
            } else {
                // Use generic placeholders if no platforms selected
                initializeFeedWithPlaceholders(8);
            }
        }
        
        try {
            // Get AI recommendations based on the search query
            const aiRecommendations = await getAIRecommendations(query);
            
            // Add platform-based recommendations to the AI recommendations
            const platformRecommendations = await getPlatformRecommendations(query);
            const allRecommendations = [...aiRecommendations, ...platformRecommendations];
            
            // Remove placeholders and add actual results one by one
            if (feed) {
                // Remove all placeholders
                const placeholders = feed.querySelectorAll('.feed-item.placeholder');
                placeholders.forEach(placeholder => placeholder.remove());
                
                if (allRecommendations.length === 0) {
                    // Show message if no recommendations found
                    feed.innerHTML = `
                        <div class="no-results-message">
                            <h2>No recommendations found</h2>
                            <p>Try a different search query or connect more platforms.</p>
                        </div>
                    `;
                } else {
                    // Add recommendations one by one with a delay for smooth effect
                    // Filter out null items (skipped items)
                    for (let i = 0; i < allRecommendations.length; i++) {
                        const itemData = allRecommendations[i];
                        const feedItem = createFeedItem(itemData);
                        
                        // Skip null items (filtered out items like connect-prompts)
                        if (feedItem) {
                            // Add to feed
                            feed.appendChild(feedItem);
                            
                            // Add a slight delay between each item for smooth effect
                            await new Promise(resolve => setTimeout(resolve, 100));
                        }
                    }
                    
                    // Add additional placeholders at the bottom for infinite scroll
                    // Use platform-specific placeholders if possible
                    const selectedPlatforms = getSelectedPlatforms();
                    if (selectedPlatforms.length > 0) {
                        for (let i = 0; i < 5; i++) {
                            // Cycle through selected platforms
                            const platform = selectedPlatforms[i % selectedPlatforms.length];
                            const placeholder = createPlaceholder(platform);
                            placeholder.classList.add('loading-bottom');
                            feed.appendChild(placeholder);
                        }
                    } else {
                        // Add generic placeholders
                        addLoadingPlaceholders(5);
                    }
                }
            }
        } catch (error) {
            console.error('Error during search:', error);
            
            if (feed) {
                // Remove placeholders and show error
                const placeholders = feed.querySelectorAll('.feed-item.placeholder');
                placeholders.forEach(placeholder => placeholder.remove());
                
                feed.innerHTML = `
                    <div class="no-results-message">
                        <h2>Search error</h2>
                        <p>There was an issue with your search. Please try again later.</p>
                    </div>
                `;
            }
        }
        
        // Remove gradient animation from search input
        removeSearchLoadingAnimation();
        
        // Hide suggestions after search
        searchSuggestions.style.display = 'none';
    }
    
    // Function to add to search history
    function addToSearchHistory(query) {
        // Remove the query if it already exists in the history
        searchHistoryList = searchHistoryList.filter(item => item !== query);
        
        // Add the new query to the beginning
        searchHistoryList.unshift(query);
        
        // Keep only the 10 most recent searches
        if (searchHistoryList.length > 10) {
            searchHistoryList = searchHistoryList.slice(0, 10);
        }
        
        // Save to localStorage
        localStorage.setItem('searchHistory', JSON.stringify(searchHistoryList));
        
        // Refresh the display
        displaySearchHistory();
    }
    
    // Function to display search history
    function displaySearchHistory() {
        // Check if the historyItemsContainer element exists before trying to manipulate it
        const historyItemsContainer = document.getElementById('historyItems');
        if (!historyItemsContainer) {
            // If the element doesn't exist, skip search history functionality
            return;
        }
        
        historyItemsContainer.innerHTML = '';
        
        if (searchHistoryList.length === 0) {
            historyItemsContainer.innerHTML = '<div class="no-history">No search history yet</div>';
            return;
        }
        
        searchHistoryList.forEach((item, index) => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.textContent = item;
            historyItem.addEventListener('click', () => {
                searchInput.value = item;
                performSearch(item);
            });
            historyItemsContainer.appendChild(historyItem);
        });
    }
    
    // Initialize the search history display
    // (Removed search history visibility toggle since the HTML elements don't exist)
    displaySearchHistory();
    
    // Add search button event listener
    const searchButton = document.getElementById('searchButton');
    if (searchButton) {
        searchButton.addEventListener('click', () => {
            const query = searchInput.value.trim();
            if (query) {
                performSearch(query);
                searchSuggestions.style.display = 'none';
            }
        });
    }
});

// Add functionality to track user interactions with recommendations
document.addEventListener('DOMContentLoaded', () => {
    // Add event delegation for tracking clicks on recommendations
    document.getElementById('pinterest-feed').addEventListener('click', async (e) => {
        // Find the closest feed item to the clicked element
        const feedItem = e.target.closest('.feed-item');
        if (feedItem) {
            // Get the title of the recommendation
            const titleElement = feedItem.querySelector('.item-title');
            if (titleElement) {
                const title = titleElement.textContent;
                
                // Track this interaction in local storage
                const interactions = JSON.parse(localStorage.getItem('userInteractions') || '[]');
                
                // Add this interaction with timestamp
                interactions.push({
                    title: title,
                    timestamp: new Date().toISOString(),
                    action: 'click'
                });
                
                // Keep only the most recent 100 interactions
                if (interactions.length > 100) {
                    interactions.shift(); // Remove the oldest interaction
                }
                
                localStorage.setItem('userInteractions', JSON.stringify(interactions));
                
                // If authenticated, send to backend
                const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
                if (token) {
                    try {
                        await fetch('/api/track-interaction', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                ...getAuthHeader() // Use the new auth header function
                            },
                            body: JSON.stringify({
                                title: title,
                                action: 'click',
                                timestamp: new Date().toISOString()
                            })
                        });
                    } catch (error) {
                        console.error('Error sending interaction to server:', error);
                    }
                }
            }
        }
    });
});

// Add function to get user profile information
async function getUserProfile() {
    try {
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        if (!token) {
            return null;
        }
        
        const response = await fetch('/api/profile', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeader() // Use the new auth header function
            }
        });
        
        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }
        
        const data = await response.json();
        return data.user;
    } catch (error) {
        console.error('Error getting user profile:', error);
        return null;
    }
}