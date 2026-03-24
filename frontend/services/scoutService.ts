import api, { ApiResponse } from './api';
import { Player } from '../types';

export interface ScoutQueryResponse {
    answer: string;
    recommendedPlayers: Player[];
    query: string;
}

export interface CareerEntry {
    club: string;
    season: string;
    appearances: number;
    goals: number;
    assists: number;
    yellowCards: number;
    redCards: number;
    minutesPlayed: number;
    role: string;
    logoUrl?: string;
}

export interface PlayerDetail extends Omit<Player, 'email' | 'phone' | 'dob'> {
    avatarUrl?: string;
    videoUrls?: string[];
    galleryImages?: string[];
    careerHistory?: CareerEntry[];
    totalGoals?: number;
    totalAssists?: number;
    totalAppearances?: number;
    marketValue?: string;
    preferredFoot?: string;
    height?: number;
    weight?: number;
    fitnessStatus?: string;
    dob?: string;
    phone?: string;
    email?: string;
}

class ScoutService {
    async askAdvisor(query: string): Promise<ApiResponse<ScoutQueryResponse>> {
        try {
            const response = await api.post<ApiResponse<ScoutQueryResponse>>('/scout/ask', { query });
            return response.data;
        } catch (error: any) {
            console.error('Error calling Scout Advisor:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to get response from AI Scout Advisor',
                error: error.message
            };
        }
    }

    async getScoutingPlayers(): Promise<ApiResponse<Player[]>> {
        try {
            const response = await api.get<ApiResponse<Player[]>>('/scout/players');
            return response.data;
        } catch (error: any) {
            console.error('Error fetching scouting players:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to fetch scouting players',
                error: error.message
            };
        }
    }

    async getPlayerDetail(id: string): Promise<ApiResponse<PlayerDetail>> {
        try {
            const response = await api.get<ApiResponse<PlayerDetail>>(`/scout/players/${id}`);
            return response.data;
        } catch (error: any) {
            console.error('Error fetching player detail:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to fetch player detail',
                error: error.message
            };
        }
    }
}

export const scoutService = new ScoutService();
export default scoutService;