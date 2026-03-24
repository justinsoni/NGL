const Groq = require('groq-sdk');
const dotenv = require('dotenv');
dotenv.config();

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || 'REPLACE_WITH_YOUR_GROQ_API_KEY'
});

/**
 * Generates an AI response based on a user query and a set of player data.
 * RAG (Retrieval-Augmented Generation) implementation for the Scout Advisor.
 */
const generateScoutResponse = async (userQuery, playerData) => {
    try {
        if (!process.env.GROQ_API_KEY) {
            return "AI Scout Advisor is currently in offline mode. Please add your GROQ_API_KEY to the .env file to enable the brain.";
        }

        const playersContext = playerData.map(p => {
            const careerSummary = p.careerHistory?.map(c =>
                `${c.club} (${c.season}): ${c.appearances} apps, ${c.goals} goals, ${c.assists} assists`
            ).join(' | ') || 'No career history available';

            return `
Name: ${p.name}
Position: ${p.position}
Age: ${p.age}
Nationality: ${p.nationality}
Current Fitness: ${p.fitnessStatus}
Scout Opinion: ${p.scoutReport}
Key Strengths: ${(p.strengths || []).join(', ')}
Key Weaknesses: ${(p.weaknesses || []).join(', ')}
Potential: ${p.potentialScore}/100
Stats -> Pace: ${p.pace}, Shooting: ${p.shooting}, Passing: ${p.passing}, Dribbling: ${p.dribbling}, Defending: ${p.defending}, Physicality: ${p.physicality}
Career: ${careerSummary}
Total Goals: ${p.totalGoals || 0} | Total Assists: ${p.totalAssists || 0} | Total Appearances: ${p.totalAppearances || 0}
---`;
        }).join('\n');

        const systemPrompt = `
You are the "NGL Scout Advisor", a professional football (soccer) scouting assistant.
Your goal is to help Club Managers find the best players from their database.

Instructions:
1. Analyze the manager's query carefully.
2. Review the provided player data context.
3. Recommend the best fits (maximum 3 players).
4. For each recommended player, START their description with "RECOMMENDED_PLAYER: [Player Name]". This is CRITICAL.
5. Explain WHY they are recommended based on their scout reports, stats, and career history.
6. Be professional, concise, and insightful.
7. If no players match well, suggest the closest options but be honest.

CONTEXT (Available Players):
${playersContext}
`;

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userQuery }
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.7,
            max_tokens: 1024,
        });

        return chatCompletion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response.";
    } catch (error) {
        console.error("Groq AI Error:", error);
        return "The AI Scout Advisor is currently busy. Please try again later.";
    }
};

module.exports = { generateScoutResponse };