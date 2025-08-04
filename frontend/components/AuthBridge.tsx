import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

interface AuthBridgeProps {
  onAuthStateChange: (isLoggedIn: boolean, userRole: UserRole | null, userId?: number) => void;
}

/**
 * AuthBridge component that bridges the new Firebase authentication
 * with the existing local authentication system in App.tsx
 */
const AuthBridge: React.FC<AuthBridgeProps> = ({ onAuthStateChange }) => {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        // Map Firebase/API roles to local roles
        const roleMapping: Record<string, UserRole> = {
          'admin': 'admin',
          'clubManager': 'manager', // Map to manager role
          'coach': 'coach',
          'registeredUser': 'user', // Map to user role
          'player': 'user' // Map player to user for now
        };

        const mappedRole = roleMapping[user.role] || 'user';
        
        // Extract user ID from the API user object
        const userId = parseInt(user.id) || undefined;
        
        onAuthStateChange(true, mappedRole, userId);
      } else {
        onAuthStateChange(false, null);
      }
    }
  }, [user, loading, onAuthStateChange]);

  // This component doesn't render anything
  return null;
};

export default AuthBridge;
