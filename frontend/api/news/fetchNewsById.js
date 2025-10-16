import axios from 'axios';

/**
 * Fetches all available news articles via backend API.
 * @param {string} idToken - Firebase ID token for authentication.
 * @returns {Promise<Object>} - The news article object.
 */
export async function fetchNewsById(id) {
    const response = await axios.get(`http://localhost:5000/api/news/${id}`);
    console.log('Fetched news article:', response.data.data);
    return response.data.data;
}