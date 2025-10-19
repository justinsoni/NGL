import axios from 'axios';

/**
 * Creates a news article via backend API.
 * @param {Object} article - News article data.
 * @param {string} idToken - Firebase ID token for authentication.
 * @returns {Promise<Object>} - Created article data.
 */
export async function createNews(article, idToken) {
    console.log('🔍 Creating news article:', article);
    console.log('🔍 Using token:', idToken ? 'Present' : 'Missing');
    
    try {
        const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
        const response = await axios.post(`${baseURL}/news`, article, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`
            }
        });
        console.log('✅ News created successfully:', response.data);
        return response.data;
    } catch (error) {
        console.error('❌ Error creating news:', error);
        console.error('❌ Error response:', error.response?.data);
        console.error('❌ Error status:', error.response?.status);
        throw error;
    }
}