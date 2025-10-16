const cron = require('node-cron');
const Fixture = require('../models/Fixture');
const { updateTableForMatch, pickTopTwo, pickTopFour, ensureTableForSeason } = require('./leagueTable');

async function getSemiFinalWinners() {
  const semiFinals = await Fixture.find({ stage: 'semi', status: 'finished' }).populate('homeTeam awayTeam');
  const winners = [];
  
  for (const semi of semiFinals) {
    if (semi.score.home > semi.score.away) {
      winners.push(semi.homeTeam._id || semi.homeTeam);
    } else if (semi.score.away > semi.score.home) {
      winners.push(semi.awayTeam._id || semi.awayTeam);
    } else {
      // In case of a draw, we'll pick the home team (or implement penalty logic later)
      winners.push(semi.homeTeam._id || semi.homeTeam);
    }
  }
  
  return winners;
}

function startScheduler(io) {
  // Every minute, check scheduled and live matches
  cron.schedule('* * * * *', async () => {
    const now = new Date();
    try {
      // Start matches whose kickoff time has arrived AND are properly scheduled
      const toStart = await Fixture.find({ status: 'scheduled', isScheduled: true, kickoffAt: { $lte: now } });
      for (const m of toStart) {
        m.status = 'live';
        await m.save();
        const populated = await Fixture.findById(m._id).populate('homeTeam awayTeam');
        io.emit('match:started', populated);
      }

      // Auto-simulate and finish matches set to autoSimulate that are live for > 2 minutes (demo)
      const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000);
      const live = await Fixture.find({ status: 'live' });
      for (const m of live) {
        if (m.autoSimulate && (m.kickoffAt || m.updatedAt) <= twoMinAgo) {
          // simple fast simulation
          const numEvents = Math.floor(Math.random() * 5) + 1;
          for (let i = 0; i < numEvents; i++) {
            const minute = Math.floor(Math.random() * 90) + 1;
            const typePool = ['goal','yellow_card','foul'];
            const type = typePool[Math.floor(Math.random()*typePool.length)];
            const team = Math.random() < 0.5 ? 'home' : 'away';
            const player = `Auto Player ${Math.floor(Math.random()*30)+1}`;
            m.events.push({ minute, type, team, player });
            if (type==='goal') team==='home'? m.score.home++ : m.score.away++;
          }
          m.status = 'finished';
          m.finishedAt = new Date();
          await m.save();

          const table = await updateTableForMatch({
            season: '2025', name: 'Default League',
            homeClubId: m.homeTeam, awayClubId: m.awayTeam,
            homeGoals: m.score.home, awayGoals: m.score.away
          });
          const populated = await Fixture.findById(m._id).populate('homeTeam awayTeam');
          io.emit('match:finished', populated);
          io.emit('table:updated', table);
          
          // Emit final:finished event if this is a final match
          if (m.isFinal) {
            io.emit('final:finished', populated);
          }

          const remaining = await Fixture.countDocuments({ isFinal: false, status: { $ne: 'finished' } });
          const semiExists = await Fixture.findOne({ stage: 'semi' });
          const finalExists = await Fixture.findOne({ isFinal: true });
          
          // Semi-finals are now created by fixture controller, not scheduler
          // This prevents conflicts between scheduler and controller
          
          // Create final when semi-finals are finished
          const remainingSemis = await Fixture.countDocuments({ stage: 'semi', status: { $ne: 'finished' } });
          if (remainingSemis === 0 && semiExists && !finalExists) {
            const semiWinners = await getSemiFinalWinners();
            if (semiWinners.length >= 2) {
              const final = await Fixture.create({ 
                homeTeam: semiWinners[0], 
                awayTeam: semiWinners[1], 
                status: 'scheduled', 
                isFinal: true, 
                kickoffAt: new Date(Date.now() + 2*60*1000), 
                autoSimulate: true 
              });
              const finalPop = await Fixture.findById(final._id).populate('homeTeam awayTeam');
              io.emit('final:created', finalPop);
            }
          }
        }
      }
    } catch (e) {
      console.error('Scheduler error', e);
    }
  });
}

module.exports = { startScheduler };

