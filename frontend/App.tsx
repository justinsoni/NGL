

import { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { QueryProvider } from './contexts/QueryProvider';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import MatchesPage from './pages/MatchesPage';
import MatchDetailPage from './pages/MatchDetailPage';
import PlayersPage from './pages/PlayersPage';
import TablePage from './pages/TablePage';
import ClubsPage from './pages/ClubsPage';
import ClubDetailPage from './pages/ClubDetailPage';
import TicketsPage from './pages/TicketsPage';
import StorePage from './pages/StorePage';
import MediaPage from './pages/MediaPage';
import AdminDashboard from './pages/AdminDashboard';
import CoachDashboard from './pages/CoachDashboard';
import ClubManagerDashboard from './pages/ClubManagerDashboard';
import PlayerDashboard from './pages/PlayerDashboard';
import PlayerRegistrationPage from './pages/PlayerRegistrationPage';
import LoginPage from './pages/LoginPage';

import NotFoundPage from './pages/NotFoundPage';
import PlayerProfileModal from './components/PlayerProfileModal';
import AuthBridge from './components/AuthBridge';
import { UserRole, Club, Match as MatchType, TableEntry, GroupName, CreatedUser, Player, LeaderStat, Position, PlayerRegistration } from './types';
import { CLUBS, MATCHES, TABLE_DATA, PLAYERS } from './constants';
import { EmailService } from './utils/emailService';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [managedClub, setManagedClub] = useState<Club | null>(null);

  const [matchesData, setMatchesData] = useState<MatchType[]>(MATCHES);
  const [tableData, setTableData] = useState<Record<GroupName, TableEntry[]>>(TABLE_DATA);
  const [competitionStage, setCompetitionStage] = useState<'League Stage' | 'Semi-Finals' | 'Final' | 'Finished'>('League Stage');
  
  const [players, setPlayers] = useState<Player[]>(PLAYERS);
  const [leaderStats, setLeaderStats] = useState<LeaderStat[]>([]);
  const [viewingPlayer, setViewingPlayer] = useState<Player | null>(null);

  const [createdUsers, setCreatedUsers] = useState<CreatedUser[]>([
    { id: 1, email: 'admin@ngl.com', password: 'admin', role: 'admin', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
    { id: 2, email: 'manager@mancity.com', password: 'password', role: 'club-manager', clubId: 5, clubName: 'Manchester City', addedBy: 1, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
    { id: 3, email: 'coach@liverpool.com', password: 'password', role: 'coach', clubId: 1, clubName: 'Liverpool', addedBy: 2, isActive: true, createdAt: '2024-01-01T00:00:00Z' },
    { id: 4, email: 'fan@ngl.com', password: 'password', role: 'fan', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
    // Additional test accounts for easier testing
    { id: 5, email: 'test@test.com', password: 'test', role: 'club-manager', clubId: 2, clubName: 'Arsenal', addedBy: 1, isActive: true, createdAt: '2024-01-01T00:00:00Z' }
  ]);
  const [playerRegistrations, setPlayerRegistrations] = useState<PlayerRegistration[]>([]);

  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  // Handler for Firebase auth state changes
  const handleFirebaseAuthChange = (isLoggedIn: boolean, userRole: UserRole | null, userId?: number) => {
    setIsLoggedIn(isLoggedIn);
    setUserRole(userRole);
    setCurrentUserId(userId || null);

    // Set managed club based on role and user data
    if (userRole === 'club-manager' || userRole === 'coach') {
      // Find the club for this user
      const user = createdUsers.find(u => u.id === userId);
      if (user && user.clubId) {
        const club = CLUBS.find(c => c.id === user.clubId);
        setManagedClub(club || null);
      }
    } else {
      setManagedClub(null);
    }
  };

  const handleCreateUser = (newUser: Omit<CreatedUser, 'password' | 'id'>): CreatedUser => {
    const password = EmailService.generateSecurePassword();
    const userWithPassword = {
      ...newUser,
      id: Date.now(),
      password,
      addedBy: currentUserId || undefined,
      isActive: true,
      createdAt: new Date().toISOString()
    };
    setCreatedUsers(prev => [...prev, userWithPassword]);
    return userWithPassword;
  };

  const handleSubmitPlayerRegistration = (registration: Omit<PlayerRegistration, 'id' | 'status' | 'submittedAt'>) => {
    const newRegistration: PlayerRegistration = {
      ...registration,
      id: Date.now(),
      status: 'pending',
      submittedAt: new Date().toISOString()
    };
    setPlayerRegistrations(prev => [...prev, newRegistration]);
  };

  const handleApprovePlayerRegistration = async (registrationId: number) => {
    const registration = playerRegistrations.find(r => r.id === registrationId);
    if (!registration) return;

    // Create player account
    const newUser: Omit<CreatedUser, 'password' | 'id'> = {
      email: registration.email,
      role: 'player',
      clubId: registration.clubId,
      clubName: CLUBS.find(c => c.id === registration.clubId)?.name,
      isActive: true,
      createdAt: new Date().toISOString(),
      addedBy: currentUserId || undefined
    };

    const createdUser = handleCreateUser(newUser);

    // Create player profile
    const newPlayer: Player = {
      id: Date.now() + 1,
      name: registration.name,
      email: registration.email,
      phone: registration.phone,
      dob: registration.dob,
      position: registration.position,
      nationality: registration.nationality,
      flag: '🏳️',
      club: CLUBS.find(c => c.id === registration.clubId)?.name || 'Unknown',
      clubLogo: CLUBS.find(c => c.id === registration.clubId)?.logo || '',
      previousClub: registration.previousClub,
      leaguesPlayed: registration.leaguesPlayed,
      imageUrl: registration.imageUrl || `https://picsum.photos/seed/${registration.name}/400/400`,
      identityCardUrl: registration.identityCardUrl,
      bio: registration.bio,
      isVerified: true,
      addedBy: currentUserId || 0,
      stats: { matches: 0, goals: 0, assists: 0, yellowCards: 0, redCards: 0 }
    };

    setPlayers(prev => [...prev, newPlayer]);

    // Update registration status
    setPlayerRegistrations(prev =>
      prev.map(r => r.id === registrationId
        ? { ...r, status: 'approved' as const, reviewedAt: new Date().toISOString(), reviewedBy: currentUserId || undefined }
        : r
      )
    );

    // Send approval email
    try {
      await EmailService.sendPlayerApprovalNotification(
        registration.email,
        registration.name,
        CLUBS.find(c => c.id === registration.clubId)?.name || 'Unknown Club',
        { email: createdUser.email, password: createdUser.password }
      );
    } catch (error) {
      console.error('Failed to send approval email:', error);
    }
  };

  const handleRejectPlayerRegistration = async (registrationId: number, reason: string) => {
    const registration = playerRegistrations.find(r => r.id === registrationId);
    if (!registration) return;

    // Update registration status
    setPlayerRegistrations(prev =>
      prev.map(r => r.id === registrationId
        ? {
            ...r,
            status: 'rejected' as const,
            reviewedAt: new Date().toISOString(),
            reviewedBy: currentUserId || undefined,
            rejectionReason: reason
          }
        : r
      )
    );

    // Send rejection email
    try {
      await EmailService.sendPlayerRejectionNotification(
        registration.email,
        registration.name,
        CLUBS.find(c => c.id === registration.clubId)?.name || 'Unknown Club',
        reason
      );
    } catch (error) {
      console.error('Failed to send rejection email:', error);
    }
  };

  const handleRegister = (newUser: CreatedUser): { success: boolean; message: string } => {
    if (createdUsers.some(u => u.email.toLowerCase() === newUser.email.toLowerCase())) {
      return { success: false, message: 'An account with this email already exists.' };
    }
    setCreatedUsers(prev => [...prev, newUser]);
    return { success: true, message: 'Account created successfully!' };
  };

  const handleLogin = (role: UserRole, clubId?: number, userId?: number) => {
    setIsLoggedIn(true);
    setUserRole(role);
    setCurrentUserId(userId || null);
    if ((role === 'club-manager' || role === 'coach') && clubId) {
      const club = CLUBS.find(c => c.id === clubId);
      setManagedClub(club || null);
    }
  };

  const handleLogout = () => {
    // Clear local state - Firebase logout is handled by LogoutButton component
    setIsLoggedIn(false);
    setUserRole(null);
    setManagedClub(null);
    setCurrentUserId(null);
  };

  const handleMatchUpdate = (matchId: number, homeScore: number, awayScore: number) => {
    setMatchesData(prevMatches =>
      prevMatches.map(match =>
        match.id === matchId
          ? { ...match, homeScore, awayScore, status: match.status === 'upcoming' ? 'live' : match.status }
          : match
      )
    );
  };
  
  const generateSemiFinals = (currentTables: Record<GroupName, TableEntry[]>) => {
      if (matchesData.some(m => m.stage === 'Semi-Final')) return;

      const groupWinners = (Object.keys(currentTables) as GroupName[]).map(groupName => {
        return currentTables[groupName].sort((a,b) => a.pos - b.pos)[0];
      });

      if (groupWinners.length < 4) return;
      
      const [winnerA, winnerB, winnerC, winnerD] = groupWinners;

      const semiFinal1: MatchType = {
          id: matchesData.length + 1,
          date: 'TBD',
          kickoff: '20:00',
          homeTeam: winnerA.club,
          awayTeam: winnerC.club,
          homeLogo: winnerA.logo,
          awayLogo: winnerC.logo,
          venue: 'Wembley Stadium',
          status: 'upcoming',
          homeScore: 0,
          awayScore: 0,
          stage: 'Semi-Final'
      };
      
      const semiFinal2: MatchType = {
          id: matchesData.length + 2,
          date: 'TBD',
          kickoff: '20:00',
          homeTeam: winnerB.club,
          awayTeam: winnerD.club,
          homeLogo: winnerB.logo,
          awayLogo: winnerD.logo,
          venue: 'Wembley Stadium',
          status: 'upcoming',
          homeScore: 0,
          awayScore: 0,
          stage: 'Semi-Final'
      };

      setMatchesData(prev => [...prev, semiFinal1, semiFinal2]);
      setCompetitionStage('Semi-Finals');
  };
  
  const generateFinal = (semiFinals: MatchType[]) => {
      if (matchesData.some(m => m.stage === 'Final')) return;

      const getWinner = (match: MatchType) => match.homeScore > match.awayScore ? match.homeTeam : match.awayTeam;
      
      const winner1 = getWinner(semiFinals[0]);
      const winner2 = getWinner(semiFinals[1]);

      const winner1Club = CLUBS.find(c => c.name === winner1);
      const winner2Club = CLUBS.find(c => c.name === winner2);
      
      if(!winner1Club || !winner2Club) return;

      const finalMatch: MatchType = {
          id: matchesData.length + 1,
          date: 'TBD',
          kickoff: '19:00',
          homeTeam: winner1Club.name,
          awayTeam: winner2Club.name,
          homeLogo: winner1Club.logo,
          awayLogo: winner2Club.logo,
          venue: 'National Stadium',
          status: 'upcoming',
          homeScore: 0,
          awayScore: 0,
          stage: 'Final'
      };
      
      setMatchesData(prev => [...prev, finalMatch]);
      setCompetitionStage('Final');
  }

  const handleMatchFinish = (matchId: number) => {
    let finishedMatch = matchesData.find(m => m.id === matchId);
    if (!finishedMatch || finishedMatch.status === 'finished') return;
    
    finishedMatch = { ...finishedMatch, status: 'finished' };
    
    let newTableData = {...tableData};
    
    // Update table only for league stage matches
    if(finishedMatch.stage === 'League Stage' && finishedMatch.group) {
      const groupName = finishedMatch.group;
      const homeTeamName = finishedMatch.homeTeam;
      const awayTeamName = finishedMatch.awayTeam;
      
      const groupTable = [...newTableData[groupName]];
      const homeTeamIndex = groupTable.findIndex(t => t.club === homeTeamName);
      const awayTeamIndex = groupTable.findIndex(t => t.club === awayTeamName);
      
      if (homeTeamIndex !== -1 && awayTeamIndex !== -1) {
          const homeTeam = { ...groupTable[homeTeamIndex] };
          const awayTeam = { ...groupTable[awayTeamIndex] };
          
          let homeResult: 'W' | 'D' | 'L';
          let awayResult: 'W' | 'D' | 'L';

          homeTeam.p += 1;
          awayTeam.p += 1;
          
          if (finishedMatch.homeScore > finishedMatch.awayScore) { // Home win
              homeTeam.w += 1;
              homeTeam.pts += 3;
              awayTeam.l += 1;
              homeResult = 'W';
              awayResult = 'L';
          } else if (finishedMatch.homeScore < finishedMatch.awayScore) { // Away win
              awayTeam.w += 1;
              awayTeam.pts += 3;
              homeTeam.l += 1;
              homeResult = 'L';
              awayResult = 'W';
          } else { // Draw
              homeTeam.d += 1;
              homeTeam.pts += 1;
              awayTeam.d += 1;
              awayTeam.pts += 1;
              homeResult = 'D';
              awayResult = 'D';
          }

          homeTeam.gf += finishedMatch.homeScore;
          homeTeam.ga += finishedMatch.awayScore;
          homeTeam.gd = homeTeam.gf - homeTeam.ga;
          
          awayTeam.gf += finishedMatch.awayScore;
          awayTeam.ga += finishedMatch.homeScore;
          awayTeam.gd = awayTeam.gf - awayTeam.ga;
          
          const newHomeHistory = [...homeTeam.matchHistory, { matchId: finishedMatch.id, result: homeResult }];
          homeTeam.matchHistory = newHomeHistory;
          homeTeam.form = newHomeHistory.slice(-5).map(h => h.result);
          
          const newAwayHistory = [...awayTeam.matchHistory, { matchId: finishedMatch.id, result: awayResult }];
          awayTeam.matchHistory = newAwayHistory;
          awayTeam.form = newAwayHistory.slice(-5).map(h => h.result);
          
          groupTable[homeTeamIndex] = homeTeam;
          groupTable[awayTeamIndex] = awayTeam;

          const sortedGroupTable = groupTable.sort((a, b) => {
              if (b.pts !== a.pts) return b.pts - a.pts;
              if (b.gd !== a.gd) return b.gd - a.gd;
              if (b.gf !== a.gf) return b.gf - a.gf;
              return a.club.localeCompare(b.club);
          }).map((team, index) => ({ ...team, pos: index + 1 }));
          
          newTableData[groupName] = sortedGroupTable;
          setTableData(newTableData);
      }
    }
    
    const updatedMatches = matchesData.map(m => m.id === matchId ? finishedMatch! : m);
    setMatchesData(updatedMatches);

    // Check for competition stage progression
    const leagueStageMatches = updatedMatches.filter(m => m.stage === 'League Stage');
    const allLeagueMatchesFinished = leagueStageMatches.every(m => m.status === 'finished');

    if (competitionStage === 'League Stage' && allLeagueMatchesFinished && leagueStageMatches.length > 0) {
        generateSemiFinals(newTableData);
    }
    
    const semiFinalMatches = updatedMatches.filter(m => m.stage === 'Semi-Final');
    if (competitionStage === 'Semi-Finals' && semiFinalMatches.length > 0 && semiFinalMatches.every(m => m.status === 'finished')) {
        generateFinal(semiFinalMatches);
    }
    
    const finalMatch = updatedMatches.find(m => m.stage === 'Final');
    if (competitionStage === 'Final' && finalMatch?.status === 'finished') {
        setCompetitionStage('Finished');
    }
  };

  const handleAddPlayer = (newPlayer: Omit<Player, 'id'>) => {
    const playerWithId = {
      ...newPlayer,
      id: Date.now(),
      addedBy: currentUserId || 0,
      isVerified: false
    };
    setPlayers(prev => [...prev, playerWithId]);
  };
  
  const handleEditPlayer = (updatedPlayer: Player) => {
    setPlayers(prevPlayers => prevPlayers.map(p => p.id === updatedPlayer.id ? updatedPlayer : p));
  };

  const handleDeletePlayer = (playerId: number) => {
    setPlayers(prevPlayers => prevPlayers.filter(p => p.id !== playerId));
  };
  
  const handlePlayerSelect = (playerId: number) => {
    const player = players.find(p => p.id === playerId);
    if(player) setViewingPlayer(player);
  };
  
  const handleClosePlayerModal = () => {
      setViewingPlayer(null);
  }


  // --- Leader Stat Calculation ---
  useEffect(() => {
    const countryCodeMapping: { [key: string]: string } = {
        'Brazil': 'br', 'Netherlands': 'nl', 'Egypt': 'eg', 'Norway': 'no',
        'Belgium': 'be', 'England': 'gb-eng', 'South Korea': 'kr', 'Portugal': 'pt',
        'Bosnia and Herzegovina': 'ba', 'Switzerland': 'ch',
    };
    const getCountryCode = (nationality: string): string => countryCodeMapping[nationality] || 'xx';

    const getPositionAbbreviation = (position: Position): string => {
        switch (position) {
            case 'Goalkeeper': return 'GK';
            case 'Defender': return 'DEF';
            case 'Midfielder': return 'MID';
            case 'Forward': return 'FWD';
        }
    }

    const getCardTier = (statKey: keyof Player['stats'], value: number): 'gold' | 'silver' => {
        if (statKey === 'goals' && value >= 3) return 'gold';
        if (statKey === 'assists' && value >= 2) return 'gold';
        return 'silver';
    }

    const createLeaderStat = (playersList: Player[], statKey: keyof Player['stats'], unit: string): LeaderStat | null => {
        if (playersList.length === 0) return null;
        const sortedPlayers = [...playersList].filter(p => p.stats[statKey] > 0).sort((a, b) => b.stats[statKey] - a.stats[statKey]);
        if (sortedPlayers.length === 0) return null;
        
        const topPlayer = sortedPlayers[0];
        
        if (!topPlayer) return null;

        const leaderboard = sortedPlayers.slice(0, 4).map((p, index) => ({
            rank: index + 1,
            id: p.id,
            name: p.name.split(' ').pop()?.toUpperCase() ?? p.name.toUpperCase(),
            clubLogo: p.clubLogo,
            value: p.stats[statKey],
        }));

        return {
            statUnit: unit,
            topPlayer: {
                id: topPlayer.id,
                rank: 1,
                name: topPlayer.name.split(' ').pop()?.toUpperCase() ?? topPlayer.name.toUpperCase(),
                club: topPlayer.club.toUpperCase(),
                clubLogo: topPlayer.clubLogo,
                value: topPlayer.stats[statKey],
                card: {
                    rating: 80 + Math.floor(topPlayer.stats.goals * 2) + Math.floor(topPlayer.stats.assists),
                    position: getPositionAbbreviation(topPlayer.position),
                    imageUrl: topPlayer.imageUrl,
                    nationalityFlagUrl: `https://flagcdn.com/w40/${getCountryCode(topPlayer.nationality)}.png`,
                    cardTier: getCardTier(statKey, topPlayer.stats[statKey]),
                }
            },
            leaderboard,
        };
    };

    const newLeaderStats: LeaderStat[] = [
        createLeaderStat(players, 'goals', 'GOALS'),
        createLeaderStat(players, 'assists', 'ASSISTS'),
        createLeaderStat(players, 'yellowCards', 'YELLOW CARDS'),
        createLeaderStat(players, 'redCards', 'RED CARDS'),
    ].filter((stat): stat is LeaderStat => stat !== null);

    setLeaderStats(newLeaderStats);
  }, [players]);

  return (
    <QueryProvider>
      <AuthProvider>
        <HashRouter>
          <ScrollToTop />
          <AuthBridge onAuthStateChange={handleFirebaseAuthChange} />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
          {viewingPlayer && (
            <PlayerProfileModal
                player={viewingPlayer}
                leaderStats={leaderStats}
                onClose={handleClosePlayerModal}
            />
          )}
          <div className="text-theme-dark font-sans flex flex-col min-h-screen bg-theme-light">
            <Navbar isLoggedIn={isLoggedIn} userRole={userRole} onLogout={handleLogout} />
            <main className="flex-grow">
          <Routes>
            <Route path="/" element={<HomePage matchesData={matchesData} tableData={tableData} competitionStage={competitionStage} leaderStats={leaderStats} onPlayerSelect={handlePlayerSelect} />} />
            <Route path="/matches" element={<MatchesPage matchesData={matchesData} />} />
            <Route path="/matches/:matchId" element={<MatchDetailPage matchesData={matchesData} />} />
            <Route path="/players" element={<PlayersPage players={players} onPlayerSelect={handlePlayerSelect} />} />
            <Route path="/table" element={<TablePage tableData={tableData} />} />
            <Route path="/clubs" element={<ClubsPage />} />
            <Route path="/clubs/:clubId" element={<ClubDetailPage players={players} onPlayerSelect={handlePlayerSelect} />} />
            <Route path="/tickets" element={<TicketsPage />} />
            <Route path="/tickets/:matchId" element={<TicketsPage />} />
            <Route path="/store" element={<StorePage />} />
            <Route path="/media" element={<MediaPage />} />
            <Route path="/login" element={<LoginPage onLogin={handleLogin} onRegister={handleRegister} createdUsers={createdUsers} />} />
            <Route path="/player-registration" element={<PlayerRegistrationPage onSubmitRegistration={handleSubmitPlayerRegistration} />} />

            {isLoggedIn && userRole === 'admin' && (
              <Route path="/admin" element={
                <AdminDashboard
                  matches={matchesData}
                  onMatchUpdate={handleMatchUpdate}
                  onMatchFinish={handleMatchFinish}
                  createdUsers={createdUsers}
                  onCreateUser={handleCreateUser}
                  playerRegistrations={playerRegistrations}
                  onApprovePlayerRegistration={handleApprovePlayerRegistration}
                  onRejectPlayerRegistration={handleRejectPlayerRegistration}
                />
              } />
            )}
            {isLoggedIn && userRole === 'coach' && managedClub && (
              <Route path="/coach" element={<CoachDashboard club={managedClub} players={players} />} />
            )}
            {isLoggedIn && userRole === 'manager' && managedClub && (
              <Route path="/club-manager" element={
                <ClubManagerDashboard
                    club={managedClub}
                    players={players}
                    onAddPlayer={handleAddPlayer}
                    onEditPlayer={handleEditPlayer}
                    onDeletePlayer={handleDeletePlayer}
                    competitionStage={competitionStage}
                    onPlayerSelect={handlePlayerSelect}
                    coaches={createdUsers}
                    onCreateCoach={handleCreateUser}
                    playerRegistrations={playerRegistrations}
                    onApprovePlayerRegistration={handleApprovePlayerRegistration}
                    onRejectPlayerRegistration={handleRejectPlayerRegistration}
                />
              } />
            )}
            {isLoggedIn && userRole === 'player' && (
              <Route path="/player" element={
                <PlayerDashboard
                  player={players.find(p => p.email === createdUsers.find(u => u.id === currentUserId)?.email) || players[0]}
                  matches={matchesData}
                  onUpdateProfile={handleEditPlayer}
                />
              } />
            )}

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
            </main>
            <Footer />
          </div>
        </HashRouter>
      </AuthProvider>
    </QueryProvider>
  );
};

export default App;
