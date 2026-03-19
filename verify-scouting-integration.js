const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend/.env') });

const Prospect = require('./backend/models/Prospect');
const Player = require('./backend/models/Player');

async function verifyCombinedPool() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Create a dummy club-less player if none exist
        const existingClubless = await Player.findOne({ clubId: null });
        if (!existingClubless) {
            console.log('Creating a dummy club-less player for testing...');
            await Player.create({
                name: 'Test Registrant',
                email: 'test.registrant@example.com',
                phone: '1234567890',
                dob: new Date('2000-01-01'),
                position: 'Forward',
                nationality: 'testland',
                identityCardUrl: 'http://example.com/id.jpg',
                status: 'pending',
                potentialScore: 85,
                pace: 90,
                shooting: 80
            });
        }

        const filter = {};
        const [prospects, players] = await Promise.all([
            Prospect.find(filter).lean(),
            Player.find({ ...filter, clubId: null, status: 'pending' }).lean()
        ]);

        console.log(`Found ${prospects.length} prospects`);
        console.log(`Found ${players.length} club-less players`);

        const combinedPool = [
            ...prospects.map(p => ({ ...p, source: 'prospect' })),
            ...players.map(p => ({ ...p, source: 'player' }))
        ];

        if (combinedPool.length === 0) {
            console.log('No candidates found to test rejection.');
            await mongoose.disconnect();
            return;
        }

        console.log('Combined Pool Samples:');
        combinedPool.slice(0, 5).forEach(p => {
            console.log(`- ${p.name} (${p.source}) ID: ${p._id}`);
        });

        // Test Rejection Logic (Simulated)
        const candidate = combinedPool[0];
        const testId = candidate._id;
        console.log(`\nTesting rejection for candidate: ${candidate.name} (${candidate.source})`);

        const dummyManagerId = new mongoose.Types.ObjectId();

        // This simulates the scoutController.rejectProspect logic
        let result = await Prospect.findByIdAndUpdate(testId, { $addToSet: { rejectedBy: dummyManagerId } });
        if (!result) {
            result = await Player.findByIdAndUpdate(testId, { $addToSet: { rejectedBy: dummyManagerId } });
        }
        console.log('Rejection result found:', !!result);

        await mongoose.disconnect();
        console.log('Done');
    } catch (error) {
        console.error('Verification failed:', error);
        await mongoose.disconnect();
    }
}

verifyCombinedPool();
