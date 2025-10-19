import axios from 'axios';

/**
 * Creates a news article via backend API.
 * @param {Object} article - News article data.
 * @param {string} idToken - Firebase ID token for authentication.
 * @returns {Promise<Object>} - Created article data.
 */
export async function updateNewsById(id, article, idToken) {
    const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
    const response = await axios.put(`${baseURL}/news/${id}`, article, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
        }
    });
    return response.data;
}