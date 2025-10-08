import api, { ApiResponse } from './api';

export type MatchStatus = 'scheduled' | 'live' | 'finished';

export interface FixtureDTO {
  _id: string;
  homeTeam: { _id: string; name: string; logo?: string } | string;
  awayTeam: { _id: string; name: string; logo?: string } | string;
  status: MatchStatus;
  score: { home: number; away: number };
  events: Array<{ minute: number; type: 'goal'|'yellow_card'|'red_card'|'foul'; team: 'home'|'away'; player?: string }>;
  isFinal: boolean;
  kickoffAt?: string;
  autoSimulate?: boolean;
  venueName?: string;
  isScheduled?: boolean;
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

export async function addEvent(id: string, event: { minute: number; type: 'goal'|'yellow_card'|'red_card'|'foul'; team: 'home'|'away'; player?: string }): Promise<FixtureDTO> {
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

