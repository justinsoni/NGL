import axios from 'axios';

/**
 * Fetches all available news articles via backend API.
 * @param {string} idToken - Firebase ID token for authentication.
 * @returns {Promise<Array>} - Array of news articles.
 */
export async function fetchNews() {
    const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
    const response = await axios.get(`${baseURL}/news`);
    console.log('Fetched news articles:', response.data.data);
    return response.data.data;
}