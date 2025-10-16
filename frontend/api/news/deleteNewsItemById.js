import axios from 'axios';

/**
 * Creates a delete article via backend API.
 * @param {Object} article - News article data.
 * @param {string} idToken - Firebase ID token for authentication.
 * @returns {Promise<Object>} - Created article data.
 */
export async function deleteNewsById(articleId, idToken) {
    const response = await axios.delete(`http://localhost:5000/api/news/${articleId}`, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
        }
    });
    return response.data;
}