const axios = require('axios');
require('dotenv').config({ path: './backend/.env' });

const API_BASE_URL = `http://localhost:${process.env.PORT || 5001}/api`;

async function testScoutApi() {
    try {
        console.log(`Testing Scout Advisor API at: ${API_BASE_URL}/scout/ask`);

        const response = await axios.post(`${API_BASE_URL}/scout/ask`, {
            query: "I need a fast winger."
        });

        console.log('Response status:', response.status);
        console.log('Response structure:', JSON.stringify(response.data, null, 2));

        if (response.data.success && response.data.data && typeof response.data.data.answer === 'string') {
            console.log('✅ Success: API returned expected structure.');
        } else {
            console.error('❌ Failure: API response structure is incorrect.');
        }
    } catch (error) {
        console.error('❌ API Error:', error.response?.data || error.message);
    }
}

testScoutApi();
