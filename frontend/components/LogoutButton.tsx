import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface LogoutButtonProps {
  className?: string;
  onLocalLogout?: () => void;
  children?: React.ReactNode;
}

const LogoutButton: React.FC<LogoutButtonProps> = ({
  className = "bg-transparent border border-theme-primary text-theme-primary px-4 py-2 rounded-md font-semibold hover:bg-theme-primary hover:text-theme-dark transition-colors",
  onLocalLogout,
  children = "Logout"
}) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      if (user) {
        // Firebase user is logged in, use Firebase logout
        await logout();
        toast.success('Logged out successfully!');
      } else if (onLocalLogout) {
        // No Firebase user, use local logout
        onLocalLogout();
        toast.success('Logged out successfully!');
      }

      // Navigate to login page after successful logout
      navigate('/login');

    } catch (error: any) {
      console.error('Logout error:', error);
      toast.error('Unable to sign out at this time. Please try again or refresh the page.');

      // Fallback to local logout if Firebase logout fails
      if (onLocalLogout) {
        onLocalLogout();
      }

      // Still navigate to login page even if logout fails
      navigate('/login');
    }
  };

  return (
    <button onClick={handleLogout} className={className}>
      {children}
    </button>
  );
};

export default LogoutButton;
