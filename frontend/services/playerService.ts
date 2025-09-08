import api from './api';
import { Player } from '../types';

export interface PlayersResponse {
  success: boolean;
  data: Player[];
  message?: string;
}

export const playerService = {
  async getPendingPlayers(clubId?: string, clubName?: string): Promise<PlayersResponse> {
    const params: any = { status: 'pending' };
    if (clubId) params.clubId = clubId;
    if (clubName) params.clubName = clubName;
    const response = await api.get('/players', { params });
    return response.data;
  },

  async approve(registrationId: number) {
    const response = await api.post(`/players/${registrationId}/approve`);
    return response.data;
  },

  async reject(registrationId: number, reason: string) {
    const response = await api.post(`/players/${registrationId}/reject`, { reason });
    return response.data;
  },

  async getApprovedPlayers(clubId?: string, clubName?: string): Promise<PlayersResponse> {
    const params: any = { status: 'approved' };
    if (clubId) params.clubId = clubId;
    if (clubName) params.clubName = clubName;
    const response = await api.get('/players/approved', { params });
    return response.data;
},
};

export default playerService;