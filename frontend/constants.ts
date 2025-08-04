import { Player, Match, NewsArticle, TableEntry, Product, Position, Club, GroupName } from './types';

export const GROUPS: GroupName[] = ['A', 'B', 'C', 'D'];

// --- CLUBS ---
export const CLUBS: Club[] = [
    // Group A
    { id: 5, name: 'Manchester City', group: 'A', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/e/eb/Manchester_City_FC_badge.svg/1200px-Manchester_City_FC_badge.svg.png', websiteUrl: '#', stadium: 'Etihad Stadium', founded: 1880, honours: [{ name: 'League Titles', count: 10 }, { name: 'Champions League', count: 1 }], videos: [] },
    { id: 2, name: 'Arsenal', group: 'A', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/5/53/Arsenal_FC.svg/1200px-Arsenal_FC.svg.png', websiteUrl: '#', stadium: 'Emirates Stadium', founded: 1886, honours: [{ name: 'League Titles', count: 13 }, { name: 'FA Cup', count: 14 }], videos: [] },
    { id: 8, name: 'Aston Villa', group: 'A', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f9/Aston_Villa_FC_crest_%282023%29.svg/1200px-Aston_Villa_FC_crest_%282023%29.svg.png', websiteUrl: '#', stadium: 'Villa Park', founded: 1874, honours: [{ name: 'League Titles', count: 7 }, { name: 'Champions League', count: 1 }], videos: [] },
    { id: 11, name: 'Crystal Palace', group: 'A', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/a/a2/Crystal_Palace_FC_logo_%282022%29.svg/1200px-Crystal_Palace_FC_logo_%282022%29.svg.png', websiteUrl: '#', stadium: 'Selhurst Park', founded: 1905, honours: [], videos: [] },
    { id: 20, name: 'Sheffield United', group: 'A', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/9/9c/Sheffield_United_FC_logo.svg/1200px-Sheffield_United_FC_logo.svg.png', websiteUrl: '#', stadium: 'Bramall Lane', founded: 1889, honours: [], videos: [] },
    
    // Group B
    { id: 1, name: 'Liverpool', group: 'B', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/0/0c/Liverpool_FC.svg/1200px-Liverpool_FC.svg.png', websiteUrl: '#', stadium: 'Anfield', founded: 1892, honours: [{ name: 'League Titles', count: 19 }, { name: 'Champions League', count: 6 }], videos: [] },
    { id: 7, name: 'Newcastle United', group: 'B', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/5/56/Newcastle_United_Logo.svg/1200px-Newcastle_United_Logo.svg.png', websiteUrl: '#', stadium: 'St James\' Park', founded: 1892, honours: [{ name: 'League Titles', count: 4 }], videos: [] },
    { id: 3, name: 'Manchester United', group: 'B', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/7/7a/Manchester_United_FC_crest.svg/1200px-Manchester_United_FC_crest.svg.png', websiteUrl: '#', stadium: 'Old Trafford', founded: 1878, honours: [{ name: 'League Titles', count: 20 }, { name: 'Champions League', count: 3 }], videos: [] },
    { id: 12, name: 'Fulham', group: 'B', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/e/eb/F.C._Fulham_crest.svg/1200px-F.C._Fulham_crest.svg.png', websiteUrl: '#', stadium: 'Craven Cottage', founded: 1879, honours: [], videos: [] },
    { id: 18, name: 'Burnley', group: 'B', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/0/02/Burnley_FC_logo.svg/1200px-Burnley_FC_logo.svg.png', websiteUrl: '#', stadium: 'Turf Moor', founded: 1882, honours: [], videos: [] },
    
    // Group C
    { id: 4, name: 'Tottenham Hotspur', group: 'C', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/b/b4/Tottenham_Hotspur.svg/1200px-Tottenham_Hotspur.svg.png', websiteUrl: '#', stadium: 'Tottenham Hotspur Stadium', founded: 1882, honours: [{ name: 'League Titles', count: 2 }, { name: 'FA Cup', count: 8 }], videos: [] },
    { id: 6, name: 'Chelsea', group: 'C', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/c/cc/Chelsea_FC.svg/1200px-Chelsea_FC.svg.png', websiteUrl: '#', stadium: 'Stamford Bridge', founded: 1905, honours: [{ name: 'League Titles', count: 6 }, { name: 'Champions League', count: 2 }], videos: [] },
    { id: 10, name: 'West Ham United', group: 'C', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/c/c2/West_Ham_United_FC_logo.svg/1200px-West_Ham_United_FC_logo.svg.png', websiteUrl: '#', stadium: 'London Stadium', founded: 1895, honours: [{ name: 'FA Cup', count: 3 }], videos: [] },
    { id: 9, name: 'Brighton & Hove Albion', group: 'C', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/fd/Brighton_%26_Hove_Albion_logo.svg/1200px-Brighton_%26_Hove_Albion_logo.svg.png', websiteUrl: '#', stadium: 'Amex Stadium', founded: 1901, honours: [], videos: [] },
    { id: 19, name: 'Luton Town', group: 'C', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/3/30/Luton_Town_FC_logo.svg/1200px-Luton_Town_FC_logo.svg.png', websiteUrl: '#', stadium: 'Kenilworth Road', founded: 1885, honours: [], videos: [] },

    // Group D
    { id: 13, name: 'Everton', group: 'D', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/7/7c/Everton_FC_logo.svg/1200px-Everton_FC_logo.svg.png', websiteUrl: '#', stadium: 'Goodison Park', founded: 1878, honours: [{ name: 'League Titles', count: 9 }], videos: [] },
    { id: 15, name: 'Wolverhampton Wanderers', group: 'D', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/fc/Wolverhampton_Wanderers.svg/1200px-Wolverhampton_Wanderers.svg.png', websiteUrl: '#', stadium: 'Molineux Stadium', founded: 1877, honours: [{ name: 'League Titles', count: 3 }], videos: [] },
    { id: 16, name: 'Brentford', group: 'D', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/2/2a/Brentford_FC_crest.svg/1200px-Brentford_FC_crest.svg.png', websiteUrl: '#', stadium: 'Gtech Community Stadium', founded: 1889, honours: [], videos: [] },
    { id: 14, name: 'Nottingham Forest', group: 'D', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/a/a2/Nottingham_Forest_F.C._logo.svg/1200px-Nottingham_Forest_F.C._logo.svg.png', websiteUrl: '#', stadium: 'City Ground', founded: 1865, honours: [{ name: 'Champions League', count: 2 }], videos: [] },
    { id: 17, name: 'AFC Bournemouth', group: 'D', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/e/e5/AFC_Bournemouth_logo.svg/1200px-AFC_Bournemouth_logo.svg.png', websiteUrl: '#', stadium: 'Vitality Stadium', founded: 1899, honours: [], videos: [] },
];


// --- PLAYERS ---
export const PLAYERS: Player[] = [
  // Group A Players
  { id: 6, name: 'Erling Haaland', email: 'e.haaland@mancity.com', phone: '111-222-3333', dob: '2000-07-21', position: 'Forward', nationality: 'Norway', flag: '🇳🇴', club: 'Manchester City', clubLogo: CLUBS[0].logo, previousClub: 'Borussia Dortmund', leaguesPlayed: ['Bundesliga', 'Eliteserien'], imageUrl: 'https://images.pexels.com/photos/4065137/pexels-photo-4065137.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1', bio: 'A generational talent.', stats: { matches: 3, goals: 4, assists: 0, yellowCards: 1, redCards: 0 } },
  { id: 7, name: 'Kevin De Bruyne', email: 'k.debruyne@mancity.com', phone: '111-222-3334', dob: '1991-06-28', position: 'Midfielder', nationality: 'Belgium', flag: '🇧🇪', club: 'Manchester City', clubLogo: CLUBS[0].logo, previousClub: 'VfL Wolfsburg', leaguesPlayed: ['Bundesliga', 'Belgian Pro League'], imageUrl: 'https://images.pexels.com/photos/6203517/pexels-photo-6203517.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1', bio: 'An exceptional playmaker.', stats: { matches: 3, goals: 1, assists: 2, yellowCards: 0, redCards: 0 } },
  { id: 4, name: 'Bukayo Saka', email: 'b.saka@arsenal.com', phone: '222-333-4444', dob: '2001-09-05', position: 'Forward', nationality: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', club: 'Arsenal', clubLogo: CLUBS[1].logo, previousClub: 'Arsenal Academy', leaguesPlayed: [], imageUrl: 'https://images.pexels.com/photos/6688537/pexels-photo-6688537.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1', bio: 'A dynamic and versatile winger.', stats: { matches: 3, goals: 2, assists: 1, yellowCards: 0, redCards: 0 } },
  { id: 5, name: 'Martin Ødegaard', email: 'm.odegaard@arsenal.com', phone: '222-333-4445', dob: '1998-12-17', position: 'Midfielder', nationality: 'Norway', flag: '🇳🇴', club: 'Arsenal', clubLogo: CLUBS[1].logo, previousClub: 'Real Madrid', leaguesPlayed: ['La Liga', 'Eredivisie'], imageUrl: 'https://images.pexels.com/photos/1080884/pexels-photo-1080884.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1', bio: 'Arsenal\'s creative captain.', stats: { matches: 3, goals: 1, assists: 1, yellowCards: 1, redCards: 0 } },
  { id: 21, name: 'Anel Ahmedhodžić', email: 'a.ahmedhodzic@sufc.com', phone: '333-444-5555', dob: '1999-03-26', position: 'Defender', nationality: 'Bosnia and Herzegovina', flag: '🇧🇦', club: 'Sheffield United', clubLogo: CLUBS[4].logo, previousClub: 'Malmö FF', leaguesPlayed: ['Allsvenskan'], imageUrl: 'https://images.pexels.com/photos/13172901/pexels-photo-13172901.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1', bio: 'A commanding central defender.', stats: { matches: 0, goals: 0, assists: 0, yellowCards: 0, redCards: 0 } },
  
  // Group B Players
  { id: 1, name: 'Alisson Becker', email: 'a.becker@liverpoolfc.com', phone: '444-555-6666', dob: '1992-10-02', position: 'Goalkeeper', nationality: 'Brazil', flag: '🇧🇷', club: 'Liverpool', clubLogo: CLUBS[5].logo, previousClub: 'AS Roma', leaguesPlayed: ['Serie A'], imageUrl: 'https://images.pexels.com/photos/2296277/pexels-photo-2296277.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1', bio: 'One of the world\'s best goalkeepers.', stats: { matches: 3, goals: 0, assists: 0, yellowCards: 0, redCards: 0 } },
  { id: 2, name: 'Virgil van Dijk', email: 'v.vandijk@liverpoolfc.com', phone: '444-555-6667', dob: '1991-07-08', position: 'Defender', nationality: 'Netherlands', flag: '🇳🇱', club: 'Liverpool', clubLogo: CLUBS[5].logo, previousClub: 'Southampton', leaguesPlayed: ['Eredivisie'], imageUrl: 'https://images.pexels.com/photos/7991584/pexels-photo-7991584.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1', bio: 'A commanding center-back.', stats: { matches: 3, goals: 1, assists: 0, yellowCards: 1, redCards: 1 } },
  { id: 3, name: 'Mohamed Salah', email: 'm.salah@liverpoolfc.com', phone: '444-555-6668', dob: '1992-06-15', position: 'Forward', nationality: 'Egypt', flag: '🇪🇬', club: 'Liverpool', clubLogo: CLUBS[5].logo, previousClub: 'AS Roma', leaguesPlayed: ['Serie A', 'Swiss Super League'], imageUrl: 'https://images.pexels.com/photos/7292850/pexels-photo-7292850.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1', bio: 'A prolific goalscorer.', stats: { matches: 3, goals: 2, assists: 1, yellowCards: 0, redCards: 0 } },
  { id: 9, name: 'Bruno Fernandes', email: 'b.fernandes@manutd.com', phone: '555-666-7777', dob: '1994-09-08', position: 'Midfielder', nationality: 'Portugal', flag: '🇵🇹', club: 'Manchester United', clubLogo: CLUBS[7].logo, previousClub: 'Sporting CP', leaguesPlayed: ['Primeira Liga', 'Serie A'], imageUrl: 'https://images.pexels.com/photos/7718641/pexels-photo-7718641.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1', bio: 'A key playmaker and leader for United.', stats: { matches: 3, goals: 1, assists: 2, yellowCards: 2, redCards: 0 } },
  { id: 10, name: 'Marcus Rashford', email: 'm.rashford@manutd.com', phone: '555-666-7778', dob: '1997-10-31', position: 'Forward', nationality: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', club: 'Manchester United', clubLogo: CLUBS[7].logo, previousClub: 'Manchester United Academy', leaguesPlayed: [], imageUrl: 'https://images.pexels.com/photos/10332856/pexels-photo-10332856.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1', bio: 'A pacy forward with a powerful shot.', stats: { matches: 3, goals: 2, assists: 0, yellowCards: 0, redCards: 0 } },
  { id: 22, name: 'Zeki Amdouni', email: 'z.amdouni@burnley.com', phone: '666-777-8888', dob: '2000-12-04', position: 'Forward', nationality: 'Switzerland', flag: '🇨🇭', club: 'Burnley', clubLogo: CLUBS[9].logo, previousClub: 'FC Basel', leaguesPlayed: ['Swiss Super League'], imageUrl: 'https://images.pexels.com/photos/8992923/pexels-photo-8992923.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1', bio: 'A versatile forward with an eye for goal.', stats: { matches: 0, goals: 0, assists: 0, yellowCards: 0, redCards: 0 } },
  
  // Group C Players
  { id: 11, name: 'Son Heung-min', email: 'hm.son@spurs.com', phone: '777-888-9999', dob: '1992-07-08', position: 'Forward', nationality: 'South Korea', flag: '🇰🇷', club: 'Tottenham Hotspur', clubLogo: CLUBS[10].logo, previousClub: 'Bayer Leverkusen', leaguesPlayed: ['Bundesliga'], imageUrl: 'https://images.pexels.com/photos/5412431/pexels-photo-5412431.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1', bio: 'Spurs captain and a world-class finisher.', stats: { matches: 3, goals: 3, assists: 1, yellowCards: 0, redCards: 0 } },
  { id: 12, name: 'James Maddison', email: 'j.maddison@spurs.com', phone: '777-888-9990', dob: '1996-11-23', position: 'Midfielder', nationality: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', club: 'Tottenham Hotspur', clubLogo: CLUBS[10].logo, previousClub: 'Leicester City', leaguesPlayed: [], imageUrl: 'https://images.pexels.com/photos/17692945/pexels-photo-17692945.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1', bio: 'A creative force in midfield, known for his assists.', stats: { matches: 3, goals: 1, assists: 2, yellowCards: 1, redCards: 0 } },
  { id: 8, name: 'Cole Palmer', email: 'c.palmer@chelsea.com', phone: '888-999-0000', dob: '2002-05-06', position: 'Midfielder', nationality: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', club: 'Chelsea', clubLogo: CLUBS[11].logo, previousClub: 'Manchester City', leaguesPlayed: [], imageUrl: 'https://images.pexels.com/photos/776314/pexels-photo-776314.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1', bio: 'A breakout star for Chelsea.', stats: { matches: 3, goals: 2, assists: 2, yellowCards: 0, redCards: 0 } },
  { id: 23, name: 'Carlton Morris', email: 'c.morris@luton.com', phone: '999-000-1111', dob: '1995-12-16', position: 'Forward', nationality: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', club: 'Luton Town', clubLogo: CLUBS[14].logo, previousClub: 'Barnsley', leaguesPlayed: [], imageUrl: 'https://images.pexels.com/photos/10904128/pexels-photo-10904128.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1', bio: 'Luton\'s top scorer and a powerful presence upfront.', stats: { matches: 0, goals: 0, assists: 0, yellowCards: 0, redCards: 0 } },
  
  // Group D Players
  { id: 24, name: 'Dominic Solanke', email: 'd.solanke@afcb.com', phone: '000-111-2222', dob: '1997-09-14', position: 'Forward', nationality: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', club: 'AFC Bournemouth', clubLogo: CLUBS[19].logo, previousClub: 'Liverpool', leaguesPlayed: [], imageUrl: 'https://images.pexels.com/photos/1029243/pexels-photo-1029243.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1', bio: 'A clinical striker and Bournemouth\'s key goal threat.', stats: { matches: 0, goals: 0, assists: 0, yellowCards: 0, redCards: 0 } },

];


// --- TABLE DATA ---
export const initializeTables = (clubs: Club[]): Record<GroupName, TableEntry[]> => {
    const tableData: Record<GroupName, TableEntry[]> = { A: [], B: [], C: [], D: [] };
    for (const club of clubs) {
        if (!tableData[club.group]) {
            tableData[club.group] = [];
        }
        tableData[club.group].push({
            id: club.id,
            pos: 0,
            club: club.name,
            logo: club.logo,
            p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0,
            form: [],
            matchHistory: [],
        });
    }
    // Set initial position
    for (const group of GROUPS) {
        tableData[group].forEach((team, index) => {
            team.pos = index + 1;
        });
    }
    return tableData;
};

export const TABLE_DATA = initializeTables(CLUBS);


// --- MATCHES ---
export const generateGroupStageMatches = (clubs: Club[]): Match[] => {
    const allMatches: Match[] = [];
    let matchId = 0;

    for (const groupName of GROUPS) {
        // Make a mutable copy for manipulation
        let groupClubs = [...clubs.filter(c => c.group === groupName)];

        if (groupClubs.length === 0) continue;
        
        const dummyTeamRequired = groupClubs.length % 2 !== 0;
        if (dummyTeamRequired) {
            // Add a dummy club to make team count even
            const dummyClub: Club = { id: -1, name: 'DUMMY', logo: '', group: groupName, websiteUrl: '', stadium: '', founded: 0, honours: [], videos: [] };
            groupClubs.push(dummyClub);
        }

        const numTeams = groupClubs.length;
        const numRounds = numTeams - 1;
        const matchesPerRound = numTeams / 2;
        const fixedTeam = groupClubs.shift()!; // Remove the first team to keep it fixed

        for (let round = 0; round < numRounds; round++) {
            // Match the fixed team with the first team in the rotating list
            const opponentForFixed = groupClubs[0];
            
            // Handle the match if it's not with a dummy team
            if (fixedTeam.name !== 'DUMMY' && opponentForFixed.name !== 'DUMMY') {
                 const [team1, team2] = Math.random() > 0.5 ? [fixedTeam, opponentForFixed] : [opponentForFixed, fixedTeam];
                 allMatches.push({
                    id: ++matchId,
                    date: `Week ${round + 1}`,
                    kickoff: '15:00',
                    homeTeam: team1.name,
                    awayTeam: team2.name,
                    homeLogo: team1.logo,
                    awayLogo: team2.logo,
                    venue: team1.stadium,
                    status: 'upcoming',
                    homeScore: 0,
                    awayScore: 0,
                    stage: 'Group Stage',
                    group: groupName,
                });
            }

            // Pair the rest of the teams
            for (let i = 1; i < matchesPerRound; i++) {
                const home = groupClubs[i];
                const away = groupClubs[numTeams - 1 - i];

                if (home.name !== 'DUMMY' && away.name !== 'DUMMY') {
                    const [team1, team2] = Math.random() > 0.5 ? [home, away] : [away, home];
                     allMatches.push({
                        id: ++matchId,
                        date: `Week ${round + 1}`,
                        kickoff: '15:00',
                        homeTeam: team1.name,
                        awayTeam: team2.name,
                        homeLogo: team1.logo,
                        awayLogo: team2.logo,
                        venue: team1.stadium,
                        status: 'upcoming',
                        homeScore: 0,
                        awayScore: 0,
                        stage: 'Group Stage',
                        group: groupName,
                    });
                }
            }
            
            // Rotate the array of clubs (excluding the fixed one)
            groupClubs.unshift(groupClubs.pop()!);
        }
        
        // Add the fixed team back to the start of the list for the next group
        groupClubs.unshift(fixedTeam);
    }
    return allMatches;
};


export const MATCHES = generateGroupStageMatches(CLUBS);


// --- OTHER CONSTANTS ---
export const NEWS: NewsArticle[] = [
  { id: 1, title: 'League Confirms Knockout Stage Dates', imageUrl: 'https://images.pexels.com/photos/270085/pexels-photo-270085.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1', summary: 'The highly anticipated semi-finals and final will take place next month.', date: 'July 20, 2024' },
  { id: 2, title: 'Star Player Commits Future to Club', imageUrl: 'https://images.pexels.com/photos/3621180/pexels-photo-3621180.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1', summary: 'The league\'s top scorer has committed his future to the club with a long-term deal.', date: 'July 18, 2024' },
  { id: 3, title: 'VAR Rule Changes for New Season', imageUrl: 'https://images.pexels.com/photos/776077/pexels-photo-776077.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1', summary: 'Several adjustments to the VAR protocol will be implemented this season.', date: 'July 15, 2024' },
  { id: 4, title: 'Manager of the Month Announced', imageUrl: 'https://images.pexels.com/photos/135623/pexels-photo-135623.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1', summary: 'A surprise winner for this month\'s managerial award.', date: 'July 14, 2024' },
  { id: 5, title: 'Transfer Window: Who Went Where?', imageUrl: 'https://images.pexels.com/photos/879629/pexels-photo-879629.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1', summary: 'A full recap of the summer transfer window deals.', date: 'July 12, 2024' },
];

export const PRODUCTS: Product[] = [
    { id: 1, name: 'Men\'s Home Jersey 25/26', price: 95.00, imageUrl: '', category: 'Kits', tags: ['home', '25/26', 'personalizable'] },
    { id: 2, name: 'Men\'s Home Shorts 25/26', price: 40.00, imageUrl: '', category: 'Kits', tags: ['shorts', '25/26'] },
    { id: 3, name: 'Men\'s Home & Away Socks 25/26', price: 18.00, imageUrl: '', category: 'Kits', tags: ['socks', '25/26'] },
    { id: 4, name: 'Women\'s Home Jersey 25/26', price: 95.00, imageUrl: '', category: 'Kits', tags: ['home', '25/26', 'personalizable', 'women'] },
    { id: 5, name: 'Kids Home Jersey 25/26', price: 75.00, imageUrl: '', category: 'Kits', tags: ['home', '25/26', 'kids'] },
    { id: 6, name: 'Men\'s Away Jersey 25/26', price: 95.00, imageUrl: '', category: 'Kits', tags: ['away', '25/26', 'personalizable'] },
    { id: 7, name: 'Men\'s Third Jersey 25/26', price: 95.00, imageUrl: '', category: 'Kits', tags: ['third', '25/26', 'personalizable'] },
    { id: 8, name: 'Training Jacket 25/26', price: 65.00, imageUrl: '', category: 'Training', tags: ['jacket', 'training', '25/26'] },
    { id: 9, name: 'Training Top 25/26', price: 45.00, imageUrl: '', category: 'Training', tags: ['top', 'training', '25/26'] },
    { id: 10, name: 'Training Pants 25/26', price: 55.00, imageUrl: '', category: 'Training', tags: ['pants', 'training', '25/26'] },
    { id: 11, name: 'Match Ball Official 25/26', price: 25.00, imageUrl: '', category: 'Equipment', tags: ['ball', 'official', '25/26'] },
    { id: 12, name: 'Goalkeeper Gloves 25/26', price: 35.00, imageUrl: '', category: 'Equipment', tags: ['gloves', 'goalkeeper', '25/26'] },
];

export const POSITIONS: Position[] = ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'];

export const LEAGUES: string[] = [
    'Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1', 
    'Eredivisie', 'Primeira Liga', 'Allsvenskan', 'Eliteserien', 
    'Swiss Super League', 'Belgian Pro League'
];

export const MEDIA_GALLERY: { id: number, type: 'image' | 'video', url: string, title: string, src: string }[] = [
    { id: 1, type: 'image', url: '#', title: 'Celebrating a goal', src: 'https://images.pexels.com/photos/14840714/pexels-photo-14840714.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1' },
    { id: 2, type: 'image', url: '#', title: 'Action from a night match', src: 'https://images.pexels.com/photos/2418486/pexels-photo-2418486.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1' },
    { id: 3, type: 'video', url: '#', title: 'Fan Chants Compilation', src: 'https://images.pexels.com/photos/1171084/pexels-photo-1171084.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1' },
    { id: 4, type: 'image', url: '#', title: 'Goalkeeper makes a save', src: 'https://images.pexels.com/photos/693652/pexels-photo-693652.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1' },
    { id: 5, type: 'image', url: '#', title: 'The ball on the pitch', src: 'https://images.pexels.com/photos/46798/the-ball-stadion-football-the-pitch-46798.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1' },
];