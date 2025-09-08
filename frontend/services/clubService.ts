import { Club } from '../types';
import api from './api';

export interface ClubsResponse {
  success: boolean;
  data: Club[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ClubResponse {
  success: boolean;
  data: Club;
  message?: string;
}

export interface ClubStatsResponse {
  success: boolean;
  data: {
    overview: {
      totalClubs: number;
      avgFounded: number;
      totalHonours: number;
    };
    byGroup: Array<{
      _id: string;
      count: number;
      clubs: string[];
    }>;
  };
}

export interface CreateClubData {
  name: string;
  logo: string;
  stadium: string;
  stadiumCapacity?: number;
  founded: number;
  website?: string;
  email?: string;
  phone?: string;
  city: string;
  country: string;
  colors?: {
    primary?: string;
    secondary?: string;
  };
  honours?: Array<{
    name: string;
    count: number;
    years?: number[];
  }>;
  group?: 'A' | 'B' | 'C' | 'D';
  description?: string;
  socialMedia?: {
    twitter?: string;
    facebook?: string;
    instagram?: string;
    youtube?: string;
  };
}

// Helper function to make API calls to club endpoints
const clubAPI = {
  get: (url: string, config?: any) => api.get(`/clubs${url}`, config),
  post: (url: string, data?: any, config?: any) => api.post(`/clubs${url}`, data, config),
  put: (url: string, data?: any, config?: any) => api.put(`/clubs${url}`, data, config),
  delete: (url: string, config?: any) => api.delete(`/clubs${url}`, config),
};

export const clubService = {
  // Get all clubs with optional filtering and pagination
  async getClubs(params?: {
    page?: number;
    limit?: number;
    search?: string;
    group?: string;
    city?: string;
  }): Promise<ClubsResponse> {
    const response = await clubAPI.get('/', { params });
    return response.data;
  },

  // Get single club by ID
  async getClub(id: string | number): Promise<ClubResponse> {
    const response = await clubAPI.get(`/${id}`);
    return response.data;
  },

  // Create new club
  async createClub(clubData: CreateClubData): Promise<ClubResponse> {
    const response = await clubAPI.post('/', clubData);
    return response.data;
  },

  // Update existing club
  async updateClub(id: string | number, clubData: Partial<CreateClubData>): Promise<ClubResponse> {
    const response = await clubAPI.put(`/${id}`, clubData);
    return response.data;
  },

  // Delete club (soft delete)
  async deleteClub(id: string | number): Promise<{ success: boolean; message: string }> {
    const response = await clubAPI.delete(`/${id}`);
    return response.data;
  },

  // Get club statistics
  async getClubStats(): Promise<ClubStatsResponse> {
    const response = await clubAPI.get('/stats');
    return response.data;
  },

  // Search clubs
  async searchClubs(searchTerm: string): Promise<ClubsResponse> {
    const response = await clubAPI.get('/', { 
      params: { search: searchTerm, limit: 50 } 
    });
    return response.data;
  },

  // Get clubs by group
  async getClubsByGroup(group: 'A' | 'B' | 'C' | 'D'): Promise<ClubsResponse> {
    const response = await clubAPI.get('/', { 
      params: { group, limit: 50 } 
    });
    return response.data;
  }
};

export default clubService;
