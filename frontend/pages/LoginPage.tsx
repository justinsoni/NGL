

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LeagueLogoIcon } from '../components/icons';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const LoginPage: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isGoogleUser, setIsGoogleUser] = useState(false);
    const [isCheckingGoogleUser, setIsCheckingGoogleUser] = useState(false);
    const [resetEmailSent, setResetEmailSent] = useState(false);
    const [emailVerificationSent, setEmailVerificationSent] = useState(false);
    const [pendingRegistration, setPendingRegistration] = useState<{ email: string; password: string; name: string } | null>(null);
    const [name, setName] = useState('');
    const navigate = useNavigate();

    // Firebase authentication hooks
    const { login: firebaseLogin, register: firebaseRegister, completeRegistration: firebaseCompleteRegistration, loginWithGoogle, registerWithGoogle, resetPassword, user } = useAuth();

    // Check if current user is Google user
    useEffect(() => {
        if (user) {
            // Check if current user signed up with Google
            const checkCurrentUserAuthMethod = async () => {
                try {
                    const response = await fetch('/api/auth/check-auth-method', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: user.email })
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        setIsGoogleUser(data.isGoogleUser);
                    } else if (response.status === 404) {
                        // User not found in backend - could be a Google user who hasn't been registered yet
                        // For security, we'll assume it's a Google user to prevent password reset abuse
                        console.warn('User not found in backend, assuming Google user for security');
                        setIsGoogleUser(true);
                    } else {
                        // Other API errors - assume email/password user
                        console.warn('Failed to check auth method, assuming email/password user');
                        setIsGoogleUser(false);
                    }
                } catch (error) {
                    console.error('Error checking current user auth method:', error);
                }
            };

            checkCurrentUserAuthMethod();
        }
    }, [user]);

    // Check if user is Google user when email changes
    useEffect(() => {
        const checkGoogleUser = async () => {
            if (email && email.includes('@')) {
                setIsCheckingGoogleUser(true);
                try {
                    // Add timeout to prevent hanging requests
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
                    
                    const response = await fetch('/api/auth/check-auth-method', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email }),
                        signal: controller.signal
                    });
                    
                    clearTimeout(timeoutId);
                    
                    if (response.ok) {
                        const data = await response.json();
                        setIsGoogleUser(data.isGoogleUser);
                    } else if (response.status === 404) {
                        // User not found in backend - could be a Google user who hasn't been registered yet
                        // For security, we'll assume it's a Google user to prevent password reset abuse
                        console.warn('User not found in backend, assuming Google user for security');
                        setIsGoogleUser(true);
                    } else {
                        // Other API errors - assume email/password user
                        console.warn('Failed to check auth method, assuming email/password user');
                        setIsGoogleUser(false);
                    }
                } catch (error: any) {
                    // If API call fails, assume it's not a Google user
                    if (error.name === 'AbortError') {
                        console.warn('Auth method check timed out, assuming email/password user');
                    } else {
                        console.warn('Error checking auth method, assuming email/password user:', error);
                    }
                    setIsGoogleUser(false);
                } finally {
                    setIsCheckingGoogleUser(false);
                }
            } else {
                setIsGoogleUser(false);
                setIsCheckingGoogleUser(false);
            }
        };

        // Add debounce to prevent too many API calls
        const timeoutId = setTimeout(checkGoogleUser, 500);
        return () => clearTimeout(timeoutId);
    }, [email]);

    const handlePlayerRegistrationClick = () => {
        navigate('/player-registration');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        // Basic validation
        if (!email) {
            setError('Please enter your email address to continue.');
            return;
        }
        
        if (!isForgotPassword && !password) {
            setError('Please enter your password to continue.');
            return;
        }
        
        if (!isLogin && !isForgotPassword && !confirmPassword) {
            setError('Please confirm your password to continue.');
            return;
        }

        if (!isForgotPassword && !name) {
            setError('Please enter your full name to continue.');
            return;
        }
        
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError('Please enter a valid email address (e.g., user@example.com).');
            return;
        }
        
        // Prevent multiple submissions
        if (loading) {
            return;
        }
        
        setLoading(true);

        const maxRetries = 2;
        let retryCount = 0;

        const attemptAuth = async (): Promise<void> => {
            try {
                if (isForgotPassword) {
                    // Email validation for forgot password
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(email)) {
                        setError('Please enter a valid email address (e.g., user@example.com).');
                        return;
                    }

                    // Check if user is Google user
                    if (isGoogleUser) {
                        setError('This account was created with Google. Please use "Continue with Google" to access your account, or contact support if you need assistance.');
                        return;
                    }

                    // Handle forgot password for email/password users
                    try {
                        setLoading(true); // Add loading state
                        
                        // Additional security check: Try to get user from Firebase
                        // If user exists in Firebase but not in backend, they're likely a Google user
                        try {
                            const { getAuth, fetchSignInMethodsForEmail } = await import('firebase/auth');
                            const auth = getAuth();
                            const methods = await fetchSignInMethodsForEmail(auth, email);
                            
                            // If user has Google sign-in method, prevent password reset
                            if (methods.includes('google.com')) {
                                setError('This account was created with Google. Please use "Continue with Google" to access your account, or contact support if you need assistance.');
                                return;
                            }
                        } catch (firebaseCheckError) {
                            // If Firebase check fails, proceed with backend check result
                            console.warn('Firebase auth method check failed:', firebaseCheckError);
                        }
                        
                        await resetPassword(email);
                        toast.success('Password reset email sent! Please check your inbox and follow the instructions.');
                        setResetEmailSent(true);
                        return;
                    } catch (resetError: any) {
                        if (resetError.message.includes('user-not-found')) {
                            setError('No account found with this email address. Please check your email or create a new account.');
                        } else if (resetError.message.includes('network') || resetError.message.includes('timeout')) {
                            throw new Error('network_error');
                        } else if (resetError.message.includes('too-many-requests')) {
                            setError('Too many password reset attempts. Please wait a few minutes before trying again.');
                        } else if (resetError.message.includes('invalid-email')) {
                            setError('Please enter a valid email address.');
                        } else {
                            setError('Unable to send reset email at this time. Please try again or contact support if the issue persists.');
                        }
                        return;
                    } finally {
                        setLoading(false); // Ensure loading state is reset
                    }
                }

                if (isLogin) {
                    // Firebase login for all users
                    try {
                        const user = await firebaseLogin({ email, password });
                        toast.success('Welcome back! You\'re now signed in successfully.');

                        // Navigate based on user role
                        if (user && user.role) {
                            const navigationPath = getNavigationPath(user.role);
                            navigate(navigationPath);
                        } else {
                            // Fallback navigation
                            navigate('/');
                        }
                        return;
                    } catch (firebaseError: any) {
                        console.error('Login error:', firebaseError);
                        
                        // Handle specific Firebase errors
                        if (firebaseError.message.includes('user-not-found') || firebaseError.message.includes('wrong-password')) {
                            setError('The email or password you entered is incorrect. Please check your credentials and try again.');
                        } else if (firebaseError.message.includes('too-many-requests')) {
                            setError('Too many failed login attempts. Please wait a few minutes before trying again.');
                        } else if (firebaseError.message.includes('network') || firebaseError.message.includes('timeout')) {
                            throw new Error('network_error');
                        } else if (firebaseError.message.includes('invalid-email')) {
                            setError('Please enter a valid email address.');
                        } else {
                            setError('We\'re having trouble signing you in. Please try again or contact support if the issue persists.');
                        }
                        return;
                    }
                } else {
                    // Registration - Only for Users (fans), not for Admin/Manager/Coach
                    if (password !== confirmPassword) {
                        setError('Passwords do not match. Please make sure both passwords are identical.');
                        return;
                    }
                    if (password.length < 6) {
                        setError('Password must be at least 6 characters long for security.');
                        return;
                    }

                    try {
                        // Firebase Registration with email verification requirement
                        const result = await firebaseRegister({
                            name,
                            email,
                            password,
                            role: 'registeredUser' // This maps to 'user' in the backend
                        });

                        if (result.requiresVerification) {
                            // Email verification required
                            setEmailVerificationSent(true);
                            setPendingRegistration({
                                email,
                                password,
                                name
                            });
                            toast.success('Registration email sent! Please check your inbox and verify your email to complete registration.');
                            return;
                        } else {
                            // Direct registration (for Google users or if verification is not required)
                            toast.success('Welcome to Football League Hub! Your account has been created successfully.');
                            navigate('/');
                        }
                    } catch (firebaseError: any) {
                        console.error('Registration error:', firebaseError);
                        
                        // Show specific Firebase error messages
                        if (firebaseError.message.includes('email-already-in-use')) {
                            setError('An account with this email already exists. Please use the "Sign in" option instead.');
                        } else if (firebaseError.message.includes('weak-password')) {
                            setError('Password should be at least 6 characters long for security.');
                        } else if (firebaseError.message.includes('invalid-email')) {
                            setError('Please enter a valid email address.');
                        } else if (firebaseError.message.includes('network') || firebaseError.message.includes('timeout')) {
                            throw new Error('network_error');
                        } else {
                            setError('Unable to create your account at this time. Please try again or contact support if the issue persists.');
                        }
                    }
                }
            } catch (error: any) {
                if (error.message === 'network_error') {
                    if (retryCount < maxRetries) {
                        retryCount++;
                        console.log(`Retrying auth attempt ${retryCount}/${maxRetries}`);
                        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)); // Exponential backoff
                        return attemptAuth();
                    } else {
                        setError('Connection issue detected. Please check your internet connection and try again.');
                        return;
                    }
                } else {
                    console.error('Authentication error:', error);
                    setError(error.message || 'Authentication failed. Please check your credentials and try again.');
                }
            }
        };

        try {
            await attemptAuth();
        } catch (error: any) {
            console.error('Final auth error:', error);
            setError('We\'re experiencing technical difficulties. Please try again or contact support if the issue persists.');
        } finally {
            setLoading(false);
        }
    };

    const handleCompleteRegistration = async () => {
        if (!pendingRegistration) {
            setError('No pending registration found.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const user = await firebaseCompleteRegistration({
                name: pendingRegistration.name,
                email: pendingRegistration.email,
                password: pendingRegistration.password,
                role: 'registeredUser'
            });

            toast.success('Welcome to Football League Hub! Your account has been created successfully.');
            setEmailVerificationSent(false);
            setPendingRegistration(null);
            navigate('/');
        } catch (error: any) {
            console.error('Complete registration error:', error);
            
            if (error.message.includes('verify your email')) {
                setError('Please verify your email address before completing registration. Check your inbox and click the verification link.');
            } else if (error.message.includes('network') || error.message.includes('timeout')) {
                setError('Connection issue detected. Please check your internet connection and try again.');
            } else {
                setError(error.message || 'Unable to complete registration. Please try again or contact support if the issue persists.');
            }
        } finally {
            setLoading(false);
        }
    };

    // Helper function to get navigation path based on role
    const getNavigationPath = (role: string): string => {
        switch (role) {
            case 'admin': 
                return '/admin';
            case 'clubManager': 
            case 'manager': 
                return '/club-manager';
            case 'coach': 
                return '/coach';
            case 'registeredUser': 
            case 'user': 
                return '/'; // users go home
            default: 
                console.warn(`Unknown role: ${role}, navigating to home`);
                return '/';
        }
    };

    const handleGoogleAuth = async () => {
        setLoading(true);
        setError('');
        
        const maxRetries = 2;
        let retryCount = 0;
        
        const attemptGoogleAuth = async (): Promise<any> => {
            try {
                let user;
                
                // Try to sign in with Google
                try {
                    user = await loginWithGoogle();
                    toast.success('Welcome back! You\'re now signed in successfully.');
                } catch (loginError: any) {
                    console.error('Google login error:', loginError);
                    
                    // The loginWithGoogle method will handle the logic internally
                    // If it fails, it means we need to register
                    try {
                        user = await registerWithGoogle();
                        toast.success('Welcome to Football League Hub! Your account has been created successfully.');
                    } catch (registerError: any) {
                        console.error('Google registration error:', registerError);
                        
                        // Handle specific registration errors
                        if (registerError.message.includes('already exists')) {
                            setError('An account with this email already exists. Please use the "Sign in" option instead.');
                        } else if (registerError.message.includes('network') || registerError.message.includes('timeout')) {
                            throw new Error('network_error');
                        } else {
                            setError('Unable to create your account at this time. Please try again or contact support if the issue persists.');
                        }
                        return null;
                    }
                }

                return user;
                
            } catch (error: any) {
                console.error('Google auth error:', error);
                
                // Handle specific error types
                if (error.message.includes('popup') || error.message.includes('cancelled')) {
                    setError('Google sign-in was cancelled. Please try again when you\'re ready.');
                    return null;
                } else if (error.message.includes('network') || error.message.includes('timeout') || error.message === 'network_error') {
                    if (retryCount < maxRetries) {
                        retryCount++;
                        console.log(`Retrying Google auth attempt ${retryCount}/${maxRetries}`);
                        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)); // Exponential backoff
                        return attemptGoogleAuth();
                    } else {
                        setError('Connection issue detected. Please check your internet connection and try again.');
                        return null;
                    }
                } else if (error.message.includes('already exists')) {
                    setError('An account with this email already exists. Please use the "Sign in" option instead.');
                    return null;
                } else {
                    setError('We\'re experiencing technical difficulties. Please try again or contact support if the issue persists.');
                    return null;
                }
            }
        };
        
        try {
            const user = await attemptGoogleAuth();
            
            if (user) {
                // Navigate based on user role
                if (user.role) {
                    const navigationPath = getNavigationPath(user.role);
                    navigate(navigationPath);
                } else {
                    // Fallback navigation for users without role
                    navigate('/');
                }
            }
            
        } catch (error: any) {
            console.error('Final Google auth error:', error);
            setError('We\'re experiencing technical difficulties. Please try again or contact support if the issue persists.');
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = () => {
        // Prevent action while checking Google user status
        if (isCheckingGoogleUser) {
            setError('Please wait while we check your account type...');
            return;
        }
        
        if (isGoogleUser) {
            setError('This account was created with Google. Please use "Continue with Google" to access your account, or contact support if you need assistance.');
            return;
        }
        setIsForgotPassword(true);
        setError('');
        setResetEmailSent(false);
        setLoading(false); // Fix: Reset loading state
    };

    const handleBackToLogin = () => {
        setIsForgotPassword(false);
        setError('');
        setResetEmailSent(false);
        setEmailVerificationSent(false);
        setPendingRegistration(null);
        // Don't clear email to preserve user input
    };
    
    const commonInputClasses = "appearance-none relative block w-full px-3 py-3 bg-theme-secondary-bg border border-theme-border placeholder-theme-text-secondary text-theme-dark rounded-md focus:outline-none focus:ring-theme-primary focus:border-theme-primary sm:text-sm";
    
    return (
        <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-theme-page-bg p-10 rounded-xl shadow-2xl">
                <div>
                    <LeagueLogoIcon className="mx-auto h-16 w-auto text-theme-primary" />
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-theme-dark">
                        {isForgotPassword ? (resetEmailSent ? 'Check Your Email' : 'Reset Password') : isLogin ? 'Sign in to your account' : 'Join as a User'}
                    </h2>
                     {!isLogin && !isForgotPassword && (
                        <p className="mt-2 text-center text-sm text-theme-text-secondary">
                           Create your user account to follow teams, view matches, and stay updated with the league.
                        </p>
                    )}
                    {isLogin && !isForgotPassword && (
                        <p className="mt-2 text-center text-sm text-theme-text-secondary">
                           Welcome back! Sign in to access your account.
                        </p>
                    )}
                    {isForgotPassword && !resetEmailSent && (
                        <p className="mt-2 text-center text-sm text-theme-text-secondary">
                           Enter your email address and we'll send you a password reset link.
                        </p>
                    )}
                    {isForgotPassword && resetEmailSent && (
                        <p className="mt-2 text-center text-sm text-theme-text-secondary">
                           We've sent a password reset link to your email address. Please check your inbox and follow the instructions.
                        </p>
                    )}
                </div>

                {!resetEmailSent && !emailVerificationSent ? (
                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        {/* Google Authentication Button - Available for both login and registration */}
                        {!isForgotPassword && (
                            <div className="space-y-4">
                                <button
                                    type="button"
                                    onClick={handleGoogleAuth}
                                    disabled={loading}
                                    className="w-full inline-flex justify-center py-3 px-4 border border-theme-border rounded-md shadow-sm bg-theme-secondary-bg text-sm font-medium text-theme-dark hover:bg-theme-border disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                                        <path
                                            fill="currentColor"
                                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                        />
                                        <path
                                            fill="currentColor"
                                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                        />
                                        <path
                                            fill="currentColor"
                                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                        />
                                        <path
                                            fill="currentColor"
                                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                        />
                                    </svg>
                                    {loading ? 'Signing in...' : `Continue with Google`}
                                </button>

                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-theme-border" />
                                    </div>
                                    <div className="relative flex justify-center text-sm">
                                        <span className="px-2 bg-theme-page-bg text-theme-text-secondary">Or continue with email</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="rounded-md shadow-sm space-y-4">
                            {/* Name field for both login and register */}
                            {(!isLogin || isLogin) && !isForgotPassword && (
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    required={!isLogin ? true : false}
                                    className={commonInputClasses}
                                    placeholder="Full Name"
                                />
                            )}
                            <input id="email-address" name="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required className={commonInputClasses} placeholder="Email address" />

                            {!isForgotPassword && (
                                <input id="password" name="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required className={commonInputClasses} placeholder="Password" />
                            )}

                            {!isLogin && !isForgotPassword && (
                                <input id="confirm-password" name="confirm-password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className={commonInputClasses} placeholder="Confirm Password" />
                            )}
                        </div>

                        {error && <p className="text-sm text-red-600 text-center bg-red-50 border border-red-200 rounded-md p-3">{error}</p>}

                        {/* Google User Warning */}
                        {isGoogleUser && isLogin && !isForgotPassword && (
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                                <p className="text-sm text-blue-700 text-center">
                                    <strong>Google Account Detected:</strong> This email is associated with a Google account. 
                                    Please use "Continue with Google" for a seamless sign-in experience.
                                </p>
                            </div>
                        )}

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-theme-dark bg-theme-primary hover:bg-theme-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-theme-page-bg focus:ring-theme-accent disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <div className="flex items-center">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-theme-dark mr-2"></div>
                                        {isForgotPassword ? 'Sending Reset Email...' : isLogin ? 'Signing in...' : 'Creating Account...'}
                                    </div>
                                ) : (
                                    isForgotPassword ? 'Send Reset Email' : isLogin ? 'Sign in' : 'Create Account'
                                )}
                            </button>
                        </div>
                    </form>
                ) : resetEmailSent ? (
                    /* Reset Email Sent Success Screen */
                    <div className="mt-8 space-y-6">
                        <div className="text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className="mt-2 text-sm font-medium text-theme-dark">Reset email sent successfully!</h3>
                            <p className="mt-1 text-sm text-theme-text-secondary">
                                We've sent a password reset link to <strong>{email}</strong>. Please check your inbox and follow the instructions to reset your password.
                            </p>
                        </div>
                        
                        <div className="space-y-3">
                            <button
                                onClick={handleBackToLogin}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-theme-dark bg-theme-primary hover:bg-theme-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-theme-accent"
                            >
                                Back to Sign In
                            </button>
                            
                            <button
                                onClick={() => {
                                    setResetEmailSent(false);
                                    setError('');
                                    setLoading(false);
                                }}
                                disabled={loading}
                                className="w-full flex justify-center py-3 px-4 border border-theme-border rounded-md shadow-sm text-sm font-medium text-theme-dark bg-theme-secondary-bg hover:bg-theme-border focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-theme-primary disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Sending...' : 'Send Another Email'}
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Email Verification Sent Success Screen */
                    <div className="mt-8 space-y-6">
                        <div className="text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
                                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h3 className="mt-2 text-sm font-medium text-theme-dark">Verification email sent!</h3>
                            <p className="mt-1 text-sm text-theme-text-secondary">
                                We've sent a verification email to <strong>{email}</strong>. Please check your inbox and click the verification link to complete your registration.
                            </p>
                        </div>
                        
                        <div className="space-y-3">
                            <button
                                onClick={handleCompleteRegistration}
                                disabled={loading}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-theme-dark bg-theme-primary hover:bg-theme-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-theme-accent disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <div className="flex items-center">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-theme-dark mr-2"></div>
                                        Completing Registration...
                                    </div>
                                ) : (
                                    'Complete Registration'
                                )}
                            </button>
                            
                            <button
                                onClick={handleBackToLogin}
                                className="w-full flex justify-center py-3 px-4 border border-theme-border rounded-md shadow-sm text-sm font-medium text-theme-dark bg-theme-secondary-bg hover:bg-theme-border focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-theme-primary"
                            >
                                Back to Sign In
                            </button>
                        </div>
                    </div>
                )}

                <div className="text-sm text-center space-y-2">
                    {!isForgotPassword ? (
                        <>
                            <button onClick={() => {setIsLogin(!isLogin); setError(''); setIsForgotPassword(false); setResetEmailSent(false);}} className="font-medium text-theme-primary hover:text-theme-primary-dark block w-full">
                                {isLogin ? 'Don\'t have an account? Sign up as a user' : 'Already have an account? Sign in'}
                            </button>
                            {isLogin && !isGoogleUser && (
                                <button
                                    onClick={handleForgotPassword}
                                    className="font-medium text-theme-primary hover:text-theme-primary-dark block w-full"
                                >
                                    Forgot your password?
                                </button>
                            )}
                            {isLogin && isGoogleUser && (
                                <div className="text-xs text-theme-text-secondary italic">
                                    Google account detected - use "Continue with Google" to sign in
                                </div>
                            )}
                            {isLogin && (
                                <button
                                    onClick={handlePlayerRegistrationClick}
                                    className="font-medium text-theme-primary hover:text-theme-primary-dark block w-full"
                                >
                                    Are you a player? Register here
                                </button>
                            )}
                        </>
                    ) : !resetEmailSent && (
                        <button
                            onClick={handleBackToLogin}
                            className="font-medium text-theme-primary hover:text-theme-primary-dark block w-full"
                        >
                            Back to Sign In
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LoginPage;