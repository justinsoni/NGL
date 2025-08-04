import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authService, AuthUser, LoginCredentials, RegisterCredentials } from '../services/authService';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthUser>;
  register: (credentials: RegisterCredentials) => Promise<{ firebaseUser: any; requiresVerification: boolean }>;
  completeRegistration: (credentials: RegisterCredentials) => Promise<AuthUser>;
  loginWithGoogle: () => Promise<AuthUser>;
  registerWithGoogle: () => Promise<AuthUser>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (updateData: any) => Promise<AuthUser>;
  hasRole: (role: string) => boolean;
  isAdmin: () => boolean;
  canManageClub: (clubName?: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = authService.onAuthStateChange((authUser) => {
      setUser(authUser);
      setLoading(false);
    });

    // Cleanup subscription
    return unsubscribe;
  }, []);

  const login = async (credentials: LoginCredentials): Promise<AuthUser> => {
    setLoading(true);
    try {
      const authUser = await authService.login(credentials);
      setUser(authUser);
      return authUser;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const register = async (credentials: RegisterCredentials): Promise<{ firebaseUser: any; requiresVerification: boolean }> => {
    setLoading(true);
    try {
      const { firebaseUser, requiresVerification } = await authService.register(credentials);
      setUser(firebaseUser);
      return { firebaseUser, requiresVerification };
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const completeRegistration = async (credentials: RegisterCredentials): Promise<AuthUser> => {
    setLoading(true);
    try {
      const authUser = await authService.completeRegistration(credentials);
      setUser(authUser);
      return authUser;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const loginWithGoogle = async (): Promise<AuthUser> => {
    setLoading(true);
    try {
      const authUser = await authService.loginWithGoogle();
      setUser(authUser);
      return authUser;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const registerWithGoogle = async (): Promise<AuthUser> => {
    setLoading(true);
    try {
      const authUser = await authService.registerWithGoogle();
      setUser(authUser);
      return authUser;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    setLoading(true);
    try {
      await authService.logout();
      setUser(null);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    return authService.resetPassword(email);
  };

  const updateProfile = async (updateData: any): Promise<AuthUser> => {
    try {
      const updatedUser = await authService.updateProfile(updateData);
      setUser(updatedUser);
      return updatedUser;
    } catch (error) {
      throw error;
    }
  };

  const hasRole = (role: string): boolean => {
    return authService.hasRole(role);
  };

  const isAdmin = (): boolean => {
    return authService.isAdmin();
  };

  const canManageClub = (clubName?: string): boolean => {
    return authService.canManageClub(clubName);
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    completeRegistration,
    loginWithGoogle,
    registerWithGoogle,
    logout,
    resetPassword,
    updateProfile,
    hasRole,
    isAdmin,
    canManageClub
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Higher-order component for protected routes
interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string;
  requiredRoles?: string[];
  fallback?: ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  requiredRoles,
  fallback = <div>Access denied. You don't have permission to view this page.</div>
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <p>Please log in to access this page.</p>
        </div>
      </div>
    );
  }

  // Check role requirements
  if (requiredRole && user.role !== requiredRole) {
    return <>{fallback}</>;
  }

  if (requiredRoles && !requiredRoles.includes(user.role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

// Hook for role-based access
export const useRoleAccess = () => {
  const { user } = useAuth();

  return {
    isAdmin: user?.role === 'admin',
    isClubManager: user?.role === 'clubManager',
    isCoach: user?.role === 'coach',
    isRegisteredUser: user?.role === 'registeredUser',
    hasRole: (role: string) => user?.role === role,
    hasAnyRole: (roles: string[]) => user ? roles.includes(user.role) : false,
    canManageClub: (clubName?: string) => {
      if (user?.role === 'admin') return true;
      if (user?.role === 'clubManager' && clubName) {
        return user.club === clubName;
      }
      return false;
    }
  };
};
