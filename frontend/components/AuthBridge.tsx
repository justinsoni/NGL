import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

interface AuthBridgeProps {
  onAuthStateChange: (isLoggedIn: boolean, userRole: UserRole | null, userId?: number, userClub?: string) => void;
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
          'clubManager': 'clubManager', // Keep clubManager role consistent
          'coach': 'coach',
          'registeredUser': 'user', // Map to user role
          'player': 'player' // Map player to player role
        };

        const mappedRole = roleMapping[user.role] || 'user';

        // Extract user ID from the API user object
        const userId = parseInt(user.id) || undefined;

        // Extract club information for managers and coaches
        const userClub = user.club || undefined;

        console.log('🔍 AuthBridge - User authenticated:', {
          originalRole: user.role,
          mappedRole,
          userId,
          userClub,
          userEmail: user.email
        });

        onAuthStateChange(true, mappedRole, userId, userClub);
      } else {
        onAuthStateChange(false, null);
      }
    }
  }, [user, loading, onAuthStateChange]);

  // This component doesn't render anything
  return null;
};

export default AuthBridge;
