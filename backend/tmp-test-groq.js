const Groq = require('groq-sdk');
require('dotenv').config({ path: './.env' });

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

async function testGroq() {
    try {
        console.log('Testing Groq with key:', process.env.GROQ_API_KEY ? 'Present' : 'Missing');
        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: 'Hello, are you working?' }],
            model: 'llama-3.3-70b-versatile',
        });
        console.log('Response:', chatCompletion.choices[0]?.message?.content);
    } catch (error) {
        console.error('Groq Error:', error.message);
    }
}

testGroq();
