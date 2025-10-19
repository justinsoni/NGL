import api, { ApiResponse } from './api';

export type MatchStatus = 'scheduled' | 'live' | 'finished';

export interface FixtureDTO {
  _id: string;
  homeTeam: { _id: string; name: string; logo?: string } | string;
  awayTeam: { _id: string; name: string; logo?: string } | string;
  status: MatchStatus;
  score: { home: number; away: number };
  events: Array<{ 
    minute: number; 
    type: 'goal'|'yellow_card'|'red_card'|'foul'; 
    team: 'home'|'away'; 
    player?: string;
    assist?: string;
    goalType?: 'open_play'|'penalty'|'free_kick';
    fieldSide?: 'mid'|'rw'|'lw';
  }>;
  isFinal: boolean;
  stage?: 'league' | 'semi' | 'final';
  kickoffAt?: string;
  autoSimulate?: boolean;
  venueName?: string;
  isScheduled?: boolean;
  // Match time tracking - PES-style
  matchStartedAt?: string;
  currentMinute?: number;
  halfTime?: number;
  addedTime?: number;
  isHalfTime?: boolean;
  isFullTime?: boolean;
  currentTime?: { minute: number; display: string; phase?: string; stoppageTime?: number };
  // PES-style timing enhancements
  timeAcceleration?: number;
  matchPhase?: 'first_half' | 'half_time' | 'second_half' | 'extra_time' | 'full_time';
  halfTimeBreakDuration?: number;
  stoppageTimeAccumulated?: number;
  lastEventTime?: string;
}

export async function generateFixtures(): Promise<FixtureDTO[]> {
  const res = await api.post<ApiResponse<FixtureDTO[]>>('/fixtures/generate');
  return res.data.data!;
}

export async function listFixtures(): Promise<FixtureDTO[]> {
  const res = await api.get<ApiResponse<FixtureDTO[]>>('/fixtures');
  return res.data.data!;
}

export async function startMatch(id: string): Promise<FixtureDTO> {
  const res = await api.put<ApiResponse<{ data: FixtureDTO }>>(`/fixtures/${id}/start`);
  return (res.data as any).data;
}

export async function addEvent(id: string, event: { 
  minute: number; 
  type: 'goal'|'yellow_card'|'red_card'|'foul'; 
  team: 'home'|'away'; 
  player?: string;
  assist?: string;
  goalType?: 'open_play'|'penalty'|'free_kick';
  fieldSide?: 'mid'|'rw'|'lw';
}): Promise<FixtureDTO> {
  const res = await api.put<ApiResponse<{ data: FixtureDTO }>>(`/fixtures/${id}/event`, event);
  return (res.data as any).data;
}

export async function finishMatch(id: string): Promise<FixtureDTO> {
  const res = await api.put<ApiResponse<{ match: FixtureDTO }>>(`/fixtures/${id}/finish`);
  return (res.data as any).data?.match ?? (res.data as any).data;
}

export async function simulateMatch(id: string): Promise<FixtureDTO> {
  const res = await api.post<ApiResponse<{ match: FixtureDTO }>>(`/fixtures/${id}/simulate`);
  return (res.data as any).data?.match ?? (res.data as any).data;
}

export async function scheduleMatch(id: string, params: { kickoffAt?: string; autoSimulate?: boolean; venueName?: string; homeTeamId?: string; awayTeamId?: string }): Promise<FixtureDTO> {
  const res = await api.put<ApiResponse<FixtureDTO>>(`/fixtures/${id}/schedule`, params);
  return res.data.data!;
}

export async function resetLeague(): Promise<void> {
  await api.post<ApiResponse>('/fixtures/reset');
}

export async function updateTeams(id: string, params: { homeTeamId: string; awayTeamId: string }): Promise<FixtureDTO> {
  const res = await api.put<ApiResponse<FixtureDTO>>(`/fixtures/${id}/teams`, params);
  return res.data.data!;
}

export async function getMatchTime(id: string): Promise<{ minute: number; display: string; phase?: string; stoppageTime?: number }> {
  const res = await api.get<ApiResponse<{ minute: number; display: string; phase?: string; stoppageTime?: number }>>(`/fixtures/${id}/time`);
  return res.data.data!;
}

// PES-style timing controls
export async function setTimeAcceleration(id: string, acceleration: number): Promise<{ acceleration: number; phase: string }> {
  const res = await api.put<ApiResponse<{ acceleration: number; phase: string }>>(`/fixtures/${id}/time-acceleration`, { acceleration });
  return res.data.data!;
}

export async function setManualTime(id: string, minute: number, phase?: string): Promise<{ minute: number; display: string; phase: string }> {
  const res = await api.put<ApiResponse<{ minute: number; display: string; phase: string }>>(`/fixtures/${id}/manual-time`, { minute, phase });
  return res.data.data!;
}

