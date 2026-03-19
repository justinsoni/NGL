import api, { ApiResponse } from './api';
import { Player } from '../types';

export interface ScoutQueryResponse {
    answer: string;
    recommendedPlayers: Player[];
    query: string;
}

class ScoutService {
    /**
     * Send a natural language query to the AI Scout Advisor
     */
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

    /**
     * Get all players with scouting data
     */
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
}

export const scoutService = new ScoutService();
export default scoutService;
