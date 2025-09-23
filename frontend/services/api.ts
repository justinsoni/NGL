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
  role: 'admin' | 'clubManager' | 'coach' | 'registeredUser';
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
  role?: 'admin' | 'clubManager' | 'coach' | 'registeredUser';
  club?: string;
  authMethod?: 'email' | 'google';
}

export interface UpdateProfileData {
  name?: string;
  email?: string;
  role?: 'admin' | 'clubManager' | 'coach' | 'registeredUser';
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
  baseURL: (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5000/api',
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
    const message = error.response?.data?.message || error.message || 'Something went wrong. Please try again or contact support if the issue persists.';
    const url = error.config?.url || '';
    
    // Handle specific error cases
    if (error.response?.status === 401) {
      // Token expired or invalid
      toast.error('Session expired. Please login again.');
      // You might want to redirect to login here
    } else if (error.response?.status === 403) {
      toast.error('Access denied. You don\'t have permission for this action.');
    } else if (error.response?.status === 404) {
      // Provide context-aware 404 messages
      if (url.includes('/auth/users/')) {
        toast.error('User not found. The requested user account may have been deleted or does not exist.');
      } else if (url.includes('/auth/profile')) {
        // Don't show "Profile not found" for Google auth flows
        // This is expected behavior when checking if a new user exists during registration
        console.log('Profile not found - this is expected for new user registrations, not showing error');
        // Only show error for profile requests that are not part of auth flows
        // We'll let the auth service handle this gracefully
      } else if (url.includes('/auth/register')) {
        toast.error('Registration service unavailable. Please try again or contact support.');
      } else if (url.includes('/matches/')) {
        toast.error('Match not found. This match may have been removed or is no longer available.');
      } else if (url.includes('/clubs/')) {
        toast.error('Club not found. This club may have been removed or is no longer available.');
      } else if (url.includes('/players/')) {
        toast.error('Player not found. This player profile may have been removed or is no longer available.');
      } else if (url.includes('/tickets/')) {
        toast.error('Ticket not found. This ticket may have been cancelled or is no longer available.');
      } else if (url.includes('/store/')) {
        toast.error('Product not found. This item may have been removed from the store.');
      } else if (url.includes('/media/')) {
        toast.error('Media content not found. This content may have been removed or is no longer available.');
      } else if (url.includes('/table/')) {
        toast.error('League table not found. Please try refreshing the page.');
      } else if (url.includes('/news/')) {
        toast.error('News article not found. This content may have been removed or is no longer available.');
      } else {
        // Generic but more helpful 404 message
        toast.error('The requested information could not be found. It may have been removed or is temporarily unavailable.');
      }
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

  // Validate user credentials against MongoDB before login
  async validateUserForLogin(email: string, name?: string): Promise<{ success: boolean; user?: any; message: string }> {
    try {
      const response = await api.post<ApiResponse<{ user: any }>>('/auth/validate-user', {
        email,
        name
      });
      return {
        success: true,
        user: response.data.data?.user,
        message: response.data.message
      };
    } catch (error: any) {
      const axiosError = error as AxiosError<ApiResponse>;
      if (axiosError.response) {
        // Pass through the exact error message from the backend
        return {
          success: false,
          message: axiosError.response.data.message || 'User validation failed'
        };
      }
      return {
        success: false,
        message: 'Network error during user validation. Please check your connection and try again.'
      };
    }
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
