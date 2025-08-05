import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { apiService, ApiUser, RegisterUserData } from './api';
import toast from 'react-hot-toast';

export interface AuthUser extends ApiUser {
  firebaseUser: FirebaseUser;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  name: string;
  role?: 'admin' | 'registeredUser' | 'clubManager' | 'coach';
  club?: string;
}

class AuthService {
  private currentUser: AuthUser | null = null;
  private authStateListeners: Array<(user: AuthUser | null) => void> = [];

  constructor() {
    // Listen to Firebase auth state changes
    onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Get user profile from backend
          const apiUser = await apiService.getUserProfile();
          this.currentUser = { ...apiUser, firebaseUser };
        } catch (error) {
          console.error('Error fetching user profile:', error);
          // If profile doesn't exist, user needs to complete registration
          this.currentUser = null;
        }
      } else {
        this.currentUser = null;
      }
      
      // Notify all listeners
      this.authStateListeners.forEach(listener => listener(this.currentUser));
    });
  }

  // Subscribe to auth state changes
  onAuthStateChange(callback: (user: AuthUser | null) => void): () => void {
    this.authStateListeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.authStateListeners.indexOf(callback);
      if (index > -1) {
        this.authStateListeners.splice(index, 1);
      }
    };
  }

  // Get current user
  getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  // Register new user (requires email verification)
  async register(credentials: RegisterCredentials): Promise<{ firebaseUser: any; requiresVerification: boolean }> {
    try {
      // Create Firebase user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password
      );

      const firebaseUser = userCredential.user;

      // Update Firebase profile
      await updateProfile(firebaseUser, {
        displayName: credentials.name
      });

      // Send email verification
      await sendEmailVerification(firebaseUser);

      // Don't register in backend yet - wait for email verification
      // Sign out the user until they verify their email
      await signOut(auth);

      return { 
        firebaseUser, 
        requiresVerification: true 
      };

    } catch (error: any) {
      console.error('Registration error:', error);
      
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('An account with this email already exists. Please try logging in instead.');
      } else if (error.code === 'auth/weak-password') {
        throw new Error('Password should be at least 6 characters long.');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Please enter a valid email address.');
      }
      
      throw new Error(error.message || 'Registration failed. Please try again.');
    }
  }

  // Complete registration after email verification
  async completeRegistration(credentials: RegisterCredentials): Promise<AuthUser> {
    try {
      // Sign in with the credentials
      const userCredential = await signInWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password
      );

      const firebaseUser = userCredential.user;

      // Check if email is verified
      if (!firebaseUser.emailVerified) {
        await signOut(auth);
        throw new Error('Please verify your email address before completing registration.');
      }

      // Register user profile in backend with proper role
      const registerData: RegisterUserData = {
        firebaseUid: firebaseUser.uid,
        name: credentials.name,
        email: credentials.email,
        role: credentials.role || 'registeredUser',
        authMethod: 'email'
      };

      const apiUser = await apiService.registerUser(registerData);
      const authUser: AuthUser = { ...apiUser, firebaseUser };
      this.currentUser = authUser;
      
      return authUser;

    } catch (error: any) {
      console.error('Complete registration error:', error);
      
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        throw new Error('Invalid email or password.');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Please enter a valid email address.');
      }
      
      throw new Error(error.message || 'Registration completion failed. Please try again.');
    }
  }

  // Login user
  async login(credentials: LoginCredentials): Promise<AuthUser> {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password
      );

      const firebaseUser = userCredential.user;

      // Get user profile from backend
      const apiUser = await apiService.getUserProfile();
      
      const authUser: AuthUser = { ...apiUser, firebaseUser };
      this.currentUser = authUser;

      return authUser;

    } catch (error: any) {
      console.error('Login error:', error);
      
      // Handle Firebase errors
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        throw new Error('Invalid email or password.');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Please enter a valid email address.');
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('Too many failed login attempts. Please try again later.');
      }
      
      throw new Error(error.message || 'Login failed. Please try again.');
    }
  }

  // Check if user exists by email
  async checkUserExists(email: string): Promise<boolean> {
    try {
      const response = await fetch('/api/auth/check-user-exists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (response.ok) {
        const data = await response.json();
        return data.exists;
      }
      return false;
    } catch (error) {
      console.error('Error checking user existence:', error);
      return false;
    }
  }

  // Register with Google (for new users)
  async registerWithGoogle(): Promise<AuthUser> {
    try {
      // First, we need to get the email before authentication
      // We'll use a temporary approach to check if user exists
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      const userCredential = await signInWithPopup(auth, provider);
      const firebaseUser = userCredential.user;

      // Check if user already exists in our database
      const userExists = await this.checkUserExists(firebaseUser.email!);
      
      if (userExists) {
        // User exists, sign out from Firebase and throw error
        await signOut(auth);
        throw new Error('An account with this email already exists. Please use email/password login instead.');
      }

      // User doesn't exist, create new profile
      const registerData: RegisterUserData = {
        firebaseUid: firebaseUser.uid,
        name: firebaseUser.displayName || 'User',
        email: firebaseUser.email!,
        role: 'registeredUser',
        authMethod: 'google'
      };

      const apiUser = await apiService.registerUser(registerData);
      const authUser: AuthUser = { ...apiUser, firebaseUser };
      this.currentUser = authUser;
      
      return authUser;

    } catch (error: any) {
      console.error('Google registration error:', error);
      
      // Handle specific error for existing email
      if (error.message.includes('already exists')) {
        throw new Error('An account with this email already exists. Please use email/password login instead.');
      }
      
      throw new Error(error.message || 'Google registration failed. Please try again.');
    }
  }

  // Login with Google (for existing users)
  async loginWithGoogle(): Promise<AuthUser> {
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const firebaseUser = userCredential.user;

      // Check if user profile exists in backend
      try {
        const apiUser = await apiService.getUserProfile();
        const authUser: AuthUser = { ...apiUser, firebaseUser };
        this.currentUser = authUser;
        return authUser;
      } catch (error: any) {
        // Check if this is a 404 error (user not found) or other error
        if (error.response?.status === 404) {
          // User doesn't exist in backend, check if this is a new registration or existing user
          // First, try to check if user exists with this email in our database
          const userExists = await this.checkUserExists(firebaseUser.email!);
          
          if (userExists) {
            // User exists but not linked to Firebase account
            await signOut(auth);
            throw new Error('An account with this email already exists. Please use email/password login instead.');
          }

          // User doesn't exist, create new profile
          const registerData: RegisterUserData = {
            firebaseUid: firebaseUser.uid,
            name: firebaseUser.displayName || 'User',
            email: firebaseUser.email!,
            role: 'registeredUser',
            authMethod: 'google'
          };

          const apiUser = await apiService.registerUser(registerData);
          const authUser: AuthUser = { ...apiUser, firebaseUser };
          this.currentUser = authUser;
          
          return authUser;
        } else {
          // Other error (not 404), re-throw it
          throw error;
        }
      }

    } catch (error: any) {
      console.error('Google login error:', error);
      
      // Handle specific error for existing email
      if (error.message.includes('already exists')) {
        throw new Error('An account with this email already exists. Please use email/password login instead.');
      }
      
      throw new Error(error.message || 'Google login failed. Please try again.');
    }
  }

  // Logout user
  async logout(): Promise<void> {
    try {
      await signOut(auth);
      this.currentUser = null;
    } catch (error: any) {
      console.error('Logout error:', error);
      throw new Error('Logout failed. Please try again.');
    }
  }

  // Reset password
  async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      console.error('Password reset error:', error);
      
      if (error.code === 'auth/user-not-found') {
        throw new Error('No account found with this email address.');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Please enter a valid email address.');
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('Too many password reset attempts. Please wait a few minutes before trying again.');
      } else if (error.code === 'auth/network-request-failed') {
        throw new Error('Network error. Please check your connection and try again.');
      } else if (error.code === 'auth/operation-not-allowed') {
        throw new Error('Password reset is not enabled for this application. Please contact support.');
      } else if (error.code === 'auth/quota-exceeded') {
        throw new Error('Service temporarily unavailable. Please try again later.');
      }
      
      throw new Error(error.message || 'Unable to send password reset email. Please try again or contact support if the issue persists.');
    }
  }

  // Update user profile
  async updateProfile(updateData: {
    name?: string;
    email?: string;
    role?: string;
    club?: string;
    profile?: any;
  }): Promise<AuthUser> {
    try {
      if (!this.currentUser) {
        throw new Error('No user logged in');
      }

      // Update backend profile
      const updatedApiUser = await apiService.updateProfile(updateData);

      // Update Firebase profile if name changed
      if (updateData.name && updateData.name !== this.currentUser.firebaseUser.displayName) {
        await updateProfile(this.currentUser.firebaseUser, {
          displayName: updateData.name
        });
      }

      // Update current user
      this.currentUser = { ...updatedApiUser, firebaseUser: this.currentUser.firebaseUser };
      
      toast.success('Profile updated successfully!');
      return this.currentUser;

    } catch (error: any) {
      console.error('Profile update error:', error);
      throw new Error(error.message || 'Unable to update your profile at this time. Please try again or contact support if the issue persists.');
    }
  }

  // Check if user has specific role
  hasRole(role: string): boolean {
    return this.currentUser?.role === role;
  }

  // Check if user is admin
  isAdmin(): boolean {
    return this.hasRole('admin');
  }

  // Check if user can manage club
  canManageClub(clubName?: string): boolean {
    if (this.isAdmin()) return true;
    if (this.hasRole('clubManager') && clubName) {
      return this.currentUser?.club === clubName;
    }
    return false;
  }

  // Get Firebase ID token
  async getIdToken(): Promise<string | null> {
    try {
      if (auth.currentUser) {
        return await auth.currentUser.getIdToken();
      }
      return null;
    } catch (error) {
      console.error('Error getting ID token:', error);
      return null;
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;
