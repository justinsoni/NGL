import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService, ApiUser, UpdateProfileData } from '../services/api';
import toast from 'react-hot-toast';

// Query keys
export const QUERY_KEYS = {
  USER_PROFILE: 'userProfile',
  ALL_USERS: 'allUsers',
  USER_BY_ID: 'userById',
  HEALTH_CHECK: 'healthCheck',
} as const;

// User profile hook
export const useUserProfile = () => {
  return useQuery<ApiUser, Error>(
    QUERY_KEYS.USER_PROFILE,
    () => apiService.getUserProfile(),
    {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
      onError: (error) => {
        console.error('Failed to fetch user profile:', error);
      }
    }
  );
};

// All users hook (admin only)
export const useAllUsers = (params?: {
  page?: number;
  limit?: number;
  sort?: string;
  search?: string;
  role?: string;
  club?: string;
}) => {
  return useQuery(
    [QUERY_KEYS.ALL_USERS, params],
    () => apiService.getAllUsers(params),
    {
      retry: 1,
      staleTime: 2 * 60 * 1000, // 2 minutes
      onError: (error) => {
        console.error('Failed to fetch users:', error);
      }
    }
  );
};

// User by ID hook
export const useUserById = (userId: string) => {
  return useQuery<ApiUser, Error>(
    [QUERY_KEYS.USER_BY_ID, userId],
    () => apiService.getUserById(userId),
    {
      enabled: !!userId,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
      onError: (error) => {
        console.error('Failed to fetch user:', error);
      }
    }
  );
};

// Health check hook
export const useHealthCheck = () => {
  return useQuery(
    QUERY_KEYS.HEALTH_CHECK,
    () => apiService.healthCheck(),
    {
      retry: 3,
      staleTime: 30 * 1000, // 30 seconds
      refetchInterval: 5 * 60 * 1000, // 5 minutes
      onError: (error) => {
        console.error('Health check failed:', error);
      }
    }
  );
};

// Update profile mutation
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation<ApiUser, Error, UpdateProfileData>(
    (updateData) => apiService.updateProfile(updateData),
    {
      onSuccess: (updatedUser) => {
        // Update the user profile cache
        queryClient.setQueryData(QUERY_KEYS.USER_PROFILE, updatedUser);
        
        // Update user in all users cache if it exists
        queryClient.setQueriesData(
          [QUERY_KEYS.ALL_USERS],
          (oldData: any) => {
            if (oldData?.users) {
              return {
                ...oldData,
                users: oldData.users.map((user: ApiUser) =>
                  user.id === updatedUser.id ? updatedUser : user
                )
              };
            }
            return oldData;
          }
        );

        toast.success('Profile updated successfully!');
      },
      onError: (error) => {
        console.error('Failed to update profile:', error);
        toast.error('Unable to update your profile at this time. Please try again or contact support if the issue persists.');
      }
    }
  );
};

// Update user role mutation (admin only)
export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();

  return useMutation<
    ApiUser,
    Error,
    { userId: string; role: string; club?: string }
  >(
    ({ userId, role, club }) => apiService.updateUserRole(userId, role, club),
    {
      onSuccess: (updatedUser, variables) => {
        // Update user in all users cache
        queryClient.setQueriesData(
          [QUERY_KEYS.ALL_USERS],
          (oldData: any) => {
            if (oldData?.users) {
              return {
                ...oldData,
                users: oldData.users.map((user: ApiUser) =>
                  user.id === variables.userId ? updatedUser : user
                )
              };
            }
            return oldData;
          }
        );

        // Update specific user cache
        queryClient.setQueryData(
          [QUERY_KEYS.USER_BY_ID, variables.userId],
          updatedUser
        );

        toast.success('User role updated successfully!');
      },
      onError: (error) => {
        console.error('Failed to update user role:', error);
        toast.error('Unable to update user role at this time. Please try again or contact support if the issue persists.');
      }
    }
  );
};

// Deactivate user mutation (admin only)
export const useDeactivateUser = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>(
    (userId) => apiService.deactivateUser(userId),
    {
      onSuccess: (_, userId) => {
        // Remove user from all users cache or mark as inactive
        queryClient.setQueriesData(
          [QUERY_KEYS.ALL_USERS],
          (oldData: any) => {
            if (oldData?.users) {
              return {
                ...oldData,
                users: oldData.users.filter((user: ApiUser) => user.id !== userId)
              };
            }
            return oldData;
          }
        );

        // Invalidate specific user cache
        queryClient.removeQueries([QUERY_KEYS.USER_BY_ID, userId]);

        toast.success('User deactivated successfully!');
      },
      onError: (error) => {
        console.error('Failed to deactivate user:', error);
        toast.error('Unable to deactivate user at this time. Please try again or contact support if the issue persists.');
      }
    }
  );
};

// Invalidate queries helper
export const useInvalidateQueries = () => {
  const queryClient = useQueryClient();

  return {
    invalidateUserProfile: () => {
      queryClient.invalidateQueries(QUERY_KEYS.USER_PROFILE);
    },
    invalidateAllUsers: () => {
      queryClient.invalidateQueries(QUERY_KEYS.ALL_USERS);
    },
    invalidateUserById: (userId: string) => {
      queryClient.invalidateQueries([QUERY_KEYS.USER_BY_ID, userId]);
    },
    invalidateAll: () => {
      queryClient.invalidateQueries();
    }
  };
};
