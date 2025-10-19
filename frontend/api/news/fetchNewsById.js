import axios from 'axios';

/**
 * Fetches all available news articles via backend API.
 * @param {string} idToken - Firebase ID token for authentication.
 * @returns {Promise<Object>} - The news article object.
 */
export async function fetchNewsById(id) {
    const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
    const response = await axios.get(`${baseURL}/news/${id}`);
    console.log('Fetched news article:', response.data.data);
    return response.data.data;
}