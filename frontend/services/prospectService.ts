import api from './api';
import { Player } from '../types';

export interface Prospect extends Omit<Player, 'id' | '_id'> {
    _id: string;
    id?: number;
    scoutReport?: string;
    strengths?: string[];
    weaknesses?: string[];
    potentialScore?: number;
    pace?: number;
    shooting?: number;
    passing?: number;
    dribbling?: number;
    defending?: number;
    physicality?: number;
}

export interface ProspectResponse {
    success: boolean;
    data: Prospect[];
    message?: string;
}

export const prospectService = {
    async getProspects(): Promise<ProspectResponse> {
        const response = await api.get('/scout/players');
        return response.data;
    },

    async rejectProspect(prospectId: string): Promise<{ success: boolean; message: string }> {
        const response = await api.post(`/scout/players/${prospectId}/reject`);
        return response.data;
    },

    async scoutProspect(prospectId: string, clubId: string): Promise<{ success: boolean; message: string; data?: Player }> {
        // This will create a real player from a prospect
        const response = await api.post(`/players/recruit-prospect`, { prospectId, clubId });
        return response.data;
    }
};

export default prospectService;
