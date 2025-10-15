import axios from 'axios';

/**
 * Creates a news article via backend API.
 * @param {Object} article - News article data.
 * @param {string} idToken - Firebase ID token for authentication.
 * @returns {Promise<Object>} - Created article data.
 */
export async function createNews(article, idToken) {
    const response = await axios.post('http://localhost:5000/api/news', article, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
        }
    });
    return response.data;
}