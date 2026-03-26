require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/database');
const Prospect = require('./models/Prospect');

const STRENGTH_OPTIONS = ['Speed', 'Finishing', 'Aerial Duels', 'Leadership', 'Dribbling', 'Passing', 'Tackling', 'Stamina', 'Work rate', 'Vision', 'Aggression'];
const WEAKNESS_OPTIONS = ['Weak Foot', 'Injury Prone', 'Decision Making', 'Positioning', 'Crossing', 'Long Shots', 'Strength', 'Jumping', 'Composure'];

const SCOUT_REPORTS = [
    "Lightning-fast forward with smooth dribbling and great explosive power. He can beat any defender in a sprint.",
    "A rock-solid defensive organizer. Reads the game exceptionally well but lacks a bit of pace on the absolute turn.",
    "Creative central midfielder with incredible vision. Always looking for the progressive pass to break lines.",
    "Hard-working full-back who loves to bomb forward and swing in dangerous crosses, though sometimes caught out of position.",
    "Tall, physical striker who dominates in the air. Excellent target man to hold up play."
];

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomElements(arr, count) {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

const updateProspects = async () => {
    try {
        await connectDB();
        console.log('Connected to DB...');

        const prospects = await Prospect.find({});
        console.log(`Found ${prospects.length} prospects to update.`);

        let updatedCount = 0;

        for (const prospect of prospects) {
            // Stats
            prospect.pace = prospect.pace || getRandomInt(65, 95);
            prospect.shooting = prospect.shooting || getRandomInt(55, 90);
            prospect.passing = prospect.passing || getRandomInt(60, 92);
            prospect.dribbling = prospect.dribbling || getRandomInt(65, 94);
            prospect.defending = prospect.defending || getRandomInt(40, 92);
            prospect.physicality = prospect.physicality || getRandomInt(60, 90);

            // Bio
            prospect.height = prospect.height || getRandomInt(165, 195);
            prospect.weight = prospect.weight || getRandomInt(65, 90);
            prospect.preferredFoot = prospect.preferredFoot || (Math.random() > 0.7 ? 'Left' : 'Right');
            prospect.fitnessStatus = 'Fit';
            prospect.potentialScore = prospect.potentialScore || getRandomInt(75, 98);
            prospect.marketValue = prospect.marketValue || `€${(Math.random() * 20 + 0.5).toFixed(1)}M`;
            
            // Age if missing
            if (!prospect.age) {
                prospect.age = getRandomInt(18, 29);
            }

            // Strengths / Weaknesses
            if (!prospect.strengths || prospect.strengths.length === 0) {
                prospect.strengths = getRandomElements(STRENGTH_OPTIONS, 3);
            }
            if (!prospect.weaknesses || prospect.weaknesses.length === 0) {
                prospect.weaknesses = getRandomElements(WEAKNESS_OPTIONS, Math.min(getRandomInt(1, 2), 2));
            }

            // Scout Report
            if (!prospect.scoutReport) {
                prospect.scoutReport = SCOUT_REPORTS[getRandomInt(0, SCOUT_REPORTS.length - 1)];
            }

            // Career History
            if (!prospect.careerHistory || prospect.careerHistory.length === 0) {
                const numSeasons = getRandomInt(1, 3);
                const history = [];
                for (let i = 0; i < numSeasons; i++) {
                    const year = 2023 - i;
                    const clubName = prospect.previousClub || `Club ${String.fromCharCode(65 + i)}`;
                    history.push({
                        club: clubName,
                        season: `${year}/${(year + 1).toString().slice(-2)}`,
                        appearances: getRandomInt(10, 38),
                        goals: ['Forward', 'Winger', 'Attacker'].some(p => prospect.position?.includes(p)) ? getRandomInt(2, 20) : getRandomInt(0, 5),
                        assists: getRandomInt(1, 15),
                        role: prospect.position || 'Unknown'
                    });
                }
                prospect.careerHistory = history.reverse();
            }

            await prospect.save();
            updatedCount++;
        }

        console.log(`Successfully updated ${updatedCount} prospects with AI scout card data.`);
        process.exit(0);
    } catch (error) {
        console.error('Error updating prospects:', error);
        process.exit(1);
    }
};

updateProspects();
