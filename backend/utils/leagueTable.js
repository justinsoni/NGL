const LeagueTable = require('../models/LeagueTable');

function calculatePointsFromScore(homeGoals, awayGoals) {
  if (homeGoals > awayGoals) return { home: 3, away: 0 };
  if (homeGoals < awayGoals) return { home: 0, away: 3 };
  return { home: 1, away: 1 };
}

async function ensureTableForSeason(season = '2025', name = 'Default League', clubIds = []) {
  let table = await LeagueTable.findOne({ season, name });
  if (!table) {
    table = await LeagueTable.create({ season, name, standings: clubIds.map(id => ({ club: id })) });
  } else if (clubIds.length) {
    const existingIds = new Set(table.standings.map(s => s.club.toString()));
    const toAdd = clubIds.filter(id => !existingIds.has(id.toString()));
    if (toAdd.length) {
      table.standings.push(...toAdd.map(id => ({ club: id })));
      await table.save();
    }
  }
  return table;
}

// Initialize table with all existing clubs
async function initializeTableWithAllClubs(season = '2025', name = 'Default League') {
  const Club = require('../models/Club');
  const clubs = await Club.find({});
  const clubIds = clubs.map(c => c._id);
  
  let table = await LeagueTable.findOne({ season, name });
  if (!table) {
    // Create new table with all clubs
    table = await LeagueTable.create({ 
      season, 
      name, 
      standings: clubIds.map(id => ({ club: id })) 
    });
  } else {
    // Add any missing clubs to existing table
    const existingIds = new Set(table.standings.map(s => s.club.toString()));
    const toAdd = clubIds.filter(id => !existingIds.has(id.toString()));
    if (toAdd.length) {
      table.standings.push(...toAdd.map(id => ({ club: id })));
      await table.save();
    }
  }
  
  return await sortTable(table._id);
}

async function updateTableForMatch({ season = '2025', name = 'Default League', homeClubId, awayClubId, homeGoals, awayGoals }) {
  const table = await ensureTableForSeason(season, name, [homeClubId, awayClubId]);

  const home = table.standings.find(s => s.club.toString() === homeClubId.toString());
  const away = table.standings.find(s => s.club.toString() === awayClubId.toString());

  home.played += 1; away.played += 1;
  home.gf += homeGoals; home.ga += awayGoals; home.gd = home.gf - home.ga;
  away.gf += awayGoals; away.ga += homeGoals; away.gd = away.gf - away.ga;

  if (homeGoals > awayGoals) { home.won += 1; away.lost += 1; }
  else if (homeGoals < awayGoals) { away.won += 1; home.lost += 1; }
  else { home.drawn += 1; away.drawn += 1; }

  const pts = calculatePointsFromScore(homeGoals, awayGoals);
  home.points += pts.home; away.points += pts.away;

  await table.save();
  return await sortTable(table._id);
}

async function sortTable(tableId) {
  const table = await LeagueTable.findById(tableId).populate('standings.club', 'name logo');
  table.standings.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.gd !== a.gd) return b.gd - a.gd;
    if (b.gf !== a.gf) return b.gf - a.gf;
    return a.club.name.localeCompare(b.club.name);
  });
  await table.save();
  return table;
}

function pickTopTwo(table) {
  const topTwo = table.standings.slice(0, 2).map(s => s.club._id || s.club);
  return topTwo;
}

function pickTopFour(table) {
  const topFour = table.standings.slice(0, 4).map(s => s.club._id || s.club);
  return topFour;
}

module.exports = {
  ensureTableForSeason,
  initializeTableWithAllClubs,
  updateTableForMatch,
  sortTable,
  pickTopTwo,
  pickTopFour
};

