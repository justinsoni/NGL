import axios from 'axios';

/**
 * Fetches all available news articles via backend API.
 * @param {string} idToken - Firebase ID token for authentication.
 * @returns {Promise<Array>} - Array of news articles.
 */
export async function fetchNews() {
    const response = await axios.get('http://localhost:5000/api/news');
    console.log('Fetched news articles:', response.data.data);
    return response.data.data;
}