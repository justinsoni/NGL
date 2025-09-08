import { auth } from '../config/firebase';

// Use the same base URL as other services
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export interface CreateCoachData {
  name: string;
  email: string;
  phone: string;
  clubId: string;
  dateOfBirth?: string;
  nationality?: string;
  bio?: string;
  coachingLicense?: string;
  licenseExpiryDate?: string;
  specializations?: string;
  languages?: string;
  yearsOfExperience?: string;
  position?: string;
  contractStartDate?: string;
  contractEndDate?: string;
  salary?: string;
  previousClubs?: Array<{
    clubName: string;
    startDate: string;
    endDate: string;
    achievements: string;
  }>;
  trophies?: Array<{
    name: string;
    year: string;
    club: string;
    level: string;
  }>;
  documents?: Array<{
    type: string;
    name: string;
    url: string;
  }>;
}

export interface CoachResponse {
  success: boolean;
  message: string;
  data?: {
    coach: {
      id: string;
      firebaseUid: string;
      name: string;
      email: string;
      role: string;
      club: string;
      profile: any;
      createdAt: string;
    };
  };
}

class CoachService {
  private async getAuthHeaders(): Promise<HeadersInit> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    try {
      const user = auth.currentUser;
      if (user) {
        const token = await user.getIdToken();
        headers['Authorization'] = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }

    return headers;
  }

  async createCoach(coachData: CreateCoachData): Promise<CoachResponse> {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(`${API_BASE_URL}/auth/create-coach`, {
        method: 'POST',
        headers,
        body: JSON.stringify(coachData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create coach account');
      }

      return data;
    } catch (error) {
      console.error('Create coach error:', error);
      throw error;
    }
  }

  async getCoaches(clubId?: string): Promise<any> {
    try {
      const url = clubId
        ? `${API_BASE_URL}/coaches?clubId=${clubId}`
        : `${API_BASE_URL}/coaches`;

      const headers = await this.getAuthHeaders();

      const response = await fetch(url, {
        method: 'GET',
        headers
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch coaches');
      }

      return data;
    } catch (error) {
      console.error('Get coaches error:', error);
      throw error;
    }
  }

  async updateCoach(coachId: string, updateData: Partial<CreateCoachData>): Promise<any> {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(`${API_BASE_URL}/coaches/${coachId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updateData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update coach');
      }

      return data;
    } catch (error) {
      console.error('Update coach error:', error);
      throw error;
    }
  }

  async deleteCoach(coachId: string): Promise<any> {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(`${API_BASE_URL}/coaches/${coachId}`, {
        method: 'DELETE',
        headers
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete coach');
      }

      return data;
    } catch (error) {
      console.error('Delete coach error:', error);
      throw error;
    }
  }
}

export const coachService = new CoachService();
export default coachService;
