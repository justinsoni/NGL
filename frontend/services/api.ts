import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { auth } from '../config/firebase';
import toast from 'react-hot-toast';

// API Response interface
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Array<{
    field: string;
    message: string;
    value?: any;
  }>;
  error?: string;
}

// User interfaces for API
export interface ApiUser {
  id: string;
  firebaseUid: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'coach' | 'registeredUser' | 'user';
  club?: string;
  profile?: {
    phone?: string;
    dateOfBirth?: string;
    nationality?: string;
    position?: string;
    bio?: string;
    avatar?: string;
  };
  programRegistrations?: Array<{
    programId: string;
    registrationDate: string;
    status: 'pending' | 'approved' | 'rejected' | 'completed';
    notes?: string;
  }>;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterUserData {
  firebaseUid: string;
  name: string;
  email: string;
  role?: 'admin' | 'manager' | 'coach' | 'registeredUser' | 'user';
  club?: string;
  authMethod?: 'email' | 'google';
}

export interface UpdateProfileData {
  name?: string;
  email?: string;
  role?: 'admin' | 'manager' | 'coach' | 'registeredUser' | 'user';
  club?: string;
  profile?: {
    phone?: string;
    dateOfBirth?: string;
    nationality?: string;
    position?: string;
    bio?: string;
    avatar?: string;
  };
}

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const user = auth.currentUser;
      if (user) {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError<ApiResponse>) => {
    const message = error.response?.data?.message || error.message || 'An error occurred';
    
    // Handle specific error cases
    if (error.response?.status === 401) {
      // Token expired or invalid
      toast.error('Session expired. Please login again.');
      // You might want to redirect to login here
    } else if (error.response?.status === 403) {
      toast.error('Access denied. You don\'t have permission for this action.');
    } else if (error.response?.status === 404) {
      toast.error('Resource not found.');
    } else if (error.response?.status >= 500) {
      toast.error('Server error. Please try again later.');
    } else {
      toast.error(message);
    }
    
    return Promise.reject(error);
  }
);

// API service class
class ApiService {
  // Auth endpoints
  async registerUser(userData: RegisterUserData): Promise<ApiUser> {
    const response = await api.post<ApiResponse<{ user: ApiUser }>>('/auth/register', userData);
    return response.data.data!.user;
  }

  async getUserProfile(): Promise<ApiUser> {
    const response = await api.get<ApiResponse<{ user: ApiUser }>>('/auth/profile');
    return response.data.data!.user;
  }

  async updateProfile(updateData: UpdateProfileData): Promise<ApiUser> {
    const response = await api.put<ApiResponse<{ user: ApiUser }>>('/auth/update-profile', updateData);
    return response.data.data!.user;
  }

  async getAllUsers(params?: {
    page?: number;
    limit?: number;
    sort?: string;
    search?: string;
    role?: string;
    club?: string;
  }): Promise<{
    users: ApiUser[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    const response = await api.get<ApiResponse<{
      users: ApiUser[];
      pagination: any;
    }>>('/auth/users', { params });
    return response.data.data!;
  }

  async getUserById(userId: string): Promise<ApiUser> {
    const response = await api.get<ApiResponse<{ user: ApiUser }>>(`/auth/users/${userId}`);
    return response.data.data!.user;
  }

  async updateUserRole(userId: string, role: string, club?: string): Promise<ApiUser> {
    const response = await api.put<ApiResponse<{ user: ApiUser }>>(`/auth/users/${userId}/role`, {
      role,
      club
    });
    return response.data.data!.user;
  }

  async deactivateUser(userId: string): Promise<void> {
    await api.delete(`/auth/users/${userId}`);
  }

  // Health check
  async healthCheck(): Promise<any> {
    const response = await api.get('/health');
    return response.data;
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default api;
