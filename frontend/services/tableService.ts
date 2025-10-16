import api, { ApiResponse } from './api';

export interface StandingDTO {
  club: { _id: string; name: string; logo?: string } | string;
  played: number; won: number; drawn: number; lost: number; gf: number; ga: number; gd: number; points: number;
}

export interface LeagueTableDTO {
  standings: StandingDTO[];
}

export async function getLeagueTable(): Promise<LeagueTableDTO> {
  const res = await api.get<ApiResponse<LeagueTableDTO>>('/table');
  return res.data.data!;
}

export async function initializeLeagueTable(season = '2025', name = 'Default League'): Promise<LeagueTableDTO> {
  const res = await api.get<ApiResponse<LeagueTableDTO>>('/table/initialize', { params: { season, name } });
  return res.data.data!;
}

export async function initializeLeagueTableAdmin(season = '2025', name = 'Default League'): Promise<LeagueTableDTO> {
  const res = await api.post<ApiResponse<LeagueTableDTO>>('/table/initialize', { season, name });
  return res.data.data!;
}

