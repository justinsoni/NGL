import api, { ApiResponse } from './api';

export interface LeagueConfigDTO {
  _id: string;
  season: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateLeagueConfigData {
  startDate: string;
  endDate: string;
  name?: string;
  description?: string;
}

export async function getLeagueConfig(): Promise<LeagueConfigDTO> {
  const res = await api.get<ApiResponse<LeagueConfigDTO>>('/league-config');
  return res.data.data!;
}

export async function updateLeagueConfig(data: UpdateLeagueConfigData): Promise<LeagueConfigDTO> {
  const res = await api.put<ApiResponse<LeagueConfigDTO>>('/league-config', data);
  return res.data.data!;
}

export async function resetLeagueConfig(): Promise<LeagueConfigDTO> {
  const res = await api.post<ApiResponse<LeagueConfigDTO>>('/league-config/reset');
  return res.data.data!;
}
