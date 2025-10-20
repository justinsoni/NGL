import api from './api';

export interface PlayerStats {
  playerId?: string;
  playerName: string;
  position?: string;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  fouls: number;
  minutesPlayed: number;
}

export interface TeamStats {
  teamId: string;
  teamName: string;
  finalScore: number;
  possession?: number;
  shots: number;
  shotsOnTarget: number;
  corners: number;
  fouls: number;
  yellowCards: number;
  redCards: number;
  playerStats: PlayerStats[];
}

export interface MatchEvent {
  minute: number;
  type: 'goal' | 'yellow_card' | 'red_card' | 'foul' | 'substitution' | 'corner' | 'shot';
  team: 'home' | 'away';
  player?: string;
  assist?: string;
  goalType?: 'open_play' | 'penalty' | 'free_kick' | 'header' | 'volley';
  fieldSide?: 'mid' | 'rw' | 'lw';
  description?: string;
  playerOut?: string;
  playerIn?: string;
  timestamp?: string;
}

export interface MatchData {
  _id: string;
  fixtureId: string;
  homeTeam: {
    _id: string;
    name: string;
    logo?: string;
  };
  awayTeam: {
    _id: string;
    name: string;
    logo?: string;
  };
  homeTeamName: string;
  awayTeamName: string;
  stage: 'league' | 'semi' | 'final';
  venue?: string;
  kickoffTime: string;
  finalScore: {
    home: number;
    away: number;
  };
  matchDuration: number;
  attendance?: number;
  referee?: string;
  assistantReferee1?: string;
  assistantReferee2?: string;
  fourthOfficial?: string;
  weather?: 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'foggy';
  pitchCondition?: 'excellent' | 'good' | 'fair' | 'poor';
  temperature?: number;
  events: MatchEvent[];
  homeTeamStats: TeamStats;
  awayTeamStats: TeamStats;
  matchSummary?: string;
  keyMoments?: string[];
  isCompleted: boolean;
  completedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface MatchDataFilters {
  page?: number;
  limit?: number;
  stage?: string;
  team?: string;
}

export interface TeamMatchStats {
  totalMatches: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  winPercentage: string;
  recentMatches: MatchData[];
}

export interface PaginatedMatchData {
  success: boolean;
  data: MatchData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

class MatchDataService {
  // Get all match data with optional filtering
  async getAllMatchData(filters: MatchDataFilters = {}): Promise<PaginatedMatchData> {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.stage) params.append('stage', filters.stage);
    if (filters.team) params.append('team', filters.team);
    
    const queryString = params.toString();
    const url = queryString ? `/match-data?${queryString}` : '/match-data';
    
    const response = await api.get(url);
    return response.data;
  }

  // Get specific match data by ID
  async getMatchDataById(id: string): Promise<{ success: boolean; data: MatchData }> {
    const response = await api.get(`/match-data/${id}`);
    return response.data;
  }

  // Get match data by fixture ID
  async getMatchDataByFixture(fixtureId: string): Promise<{ success: boolean; data: MatchData }> {
    const response = await api.get(`/match-data/fixture/${fixtureId}`);
    return response.data;
  }

  // Create match data from completed fixture
  async createMatchData(fixtureId: string, additionalData?: Partial<MatchData>): Promise<{ success: boolean; data: MatchData }> {
    const response = await api.post('/match-data', {
      fixtureId,
      ...additionalData
    });
    return response.data;
  }

  // Update match data
  async updateMatchData(id: string, updateData: Partial<MatchData>): Promise<{ success: boolean; data: MatchData }> {
    const response = await api.put(`/match-data/${id}`, updateData);
    return response.data;
  }

  // Delete match data
  async deleteMatchData(id: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/match-data/${id}`);
    return response.data;
  }

  // Get team's match statistics
  async getTeamMatchStats(teamId: string, limit: number = 10): Promise<{ success: boolean; data: TeamMatchStats }> {
    const response = await api.get(`/match-data/stats/team/${teamId}?limit=${limit}`);
    return response.data;
  }

  // Get recent matches for a team
  async getTeamRecentMatches(teamId: string, limit: number = 5): Promise<MatchData[]> {
    const stats = await this.getTeamMatchStats(teamId, limit);
    return stats.data.recentMatches;
  }

  // Get match data for league stage
  async getLeagueMatchData(page: number = 1, limit: number = 20): Promise<PaginatedMatchData> {
    return this.getAllMatchData({ page, limit, stage: 'league' });
  }

  // Get match data for semi-finals
  async getSemiFinalMatchData(): Promise<MatchData[]> {
    const response = await this.getAllMatchData({ stage: 'semi' });
    return response.data;
  }

  // Get match data for final
  async getFinalMatchData(): Promise<MatchData[]> {
    const response = await this.getAllMatchData({ stage: 'final' });
    return response.data;
  }

  // Get top scorers from all match data
  async getTopScorers(limit: number = 10): Promise<Array<{ playerName: string; goals: number; assists: number; teamName: string }>> {
    const response = await this.getAllMatchData({ limit: 1000 }); // Get all matches
    const allMatches = response.data;
    
    const scorerMap = new Map<string, { goals: number; assists: number; teamName: string }>();
    
    allMatches.forEach(match => {
      // Process home team stats
      match.homeTeamStats.playerStats.forEach(player => {
        if (player.goals > 0 || player.assists > 0) {
          const key = player.playerName;
          if (!scorerMap.has(key)) {
            scorerMap.set(key, { goals: 0, assists: 0, teamName: match.homeTeamName });
          }
          const stats = scorerMap.get(key)!;
          stats.goals += player.goals;
          stats.assists += player.assists;
        }
      });
      
      // Process away team stats
      match.awayTeamStats.playerStats.forEach(player => {
        if (player.goals > 0 || player.assists > 0) {
          const key = player.playerName;
          if (!scorerMap.has(key)) {
            scorerMap.set(key, { goals: 0, assists: 0, teamName: match.awayTeamName });
          }
          const stats = scorerMap.get(key)!;
          stats.goals += player.goals;
          stats.assists += player.assists;
        }
      });
    });
    
    return Array.from(scorerMap.entries())
      .map(([playerName, stats]) => ({ playerName, ...stats }))
      .sort((a, b) => b.goals - a.goals || b.assists - a.assists)
      .slice(0, limit);
  }

  // Get match statistics summary
  async getMatchStatisticsSummary(): Promise<{
    totalMatches: number;
    totalGoals: number;
    totalCards: number;
    averageGoalsPerMatch: number;
    mostGoalsInMatch: number;
    mostCardsInMatch: number;
  }> {
    const response = await this.getAllMatchData({ limit: 1000 }); // Get all matches
    const allMatches = response.data;
    
    let totalGoals = 0;
    let totalCards = 0;
    let mostGoalsInMatch = 0;
    let mostCardsInMatch = 0;
    
    allMatches.forEach(match => {
      const matchGoals = match.finalScore.home + match.finalScore.away;
      const matchCards = match.homeTeamStats.yellowCards + match.homeTeamStats.redCards + 
                        match.awayTeamStats.yellowCards + match.awayTeamStats.redCards;
      
      totalGoals += matchGoals;
      totalCards += matchCards;
      
      if (matchGoals > mostGoalsInMatch) mostGoalsInMatch = matchGoals;
      if (matchCards > mostCardsInMatch) mostCardsInMatch = matchCards;
    });
    
    return {
      totalMatches: allMatches.length,
      totalGoals,
      totalCards,
      averageGoalsPerMatch: allMatches.length > 0 ? Number((totalGoals / allMatches.length).toFixed(2)) : 0,
      mostGoalsInMatch,
      mostCardsInMatch
    };
  }
}

export default new MatchDataService();
