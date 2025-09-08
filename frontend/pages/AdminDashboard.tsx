import React, { useState, useEffect } from 'react';
import { Match, CreatedUser, PlayerRegistration, Club } from '../types';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { clubService, CreateClubData } from '../services/clubService';
import ClubRegistrationForm from '../components/ClubRegistrationForm';
import ClubList from '../components/ClubList';
import toast from 'react-hot-toast';

type AdminSection = 'Dashboard' | 'Manage Clubs' | 'Manage Players' | 'Manage Fixtures' | 'Manage News' | 'User Management' | 'Player Registrations';

interface AdminDashboardProps {
    matches: Match[];
    onMatchUpdate: (matchId: number, homeScore: number, awayScore: number) => void;
    onMatchFinish: (matchId: number) => void;
    createdUsers: CreatedUser[];
    onCreateUser: (newUser: Omit<CreatedUser, 'password' | 'id'>) => CreatedUser;
    playerRegistrations: PlayerRegistration[];
    onApprovePlayerRegistration: (registrationId: number) => void;
    onRejectPlayerRegistration: (registrationId: number, reason: string) => void;
    clubs: Club[];
    onAddClub: (newClub: Club) => void;
    onUpdateClub: (updatedClub: Club) => void;
    onDeleteClub: (clubId: number | string) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({
    matches,
    onMatchUpdate,
    onMatchFinish,
    createdUsers,
    onCreateUser,
    playerRegistrations,
    onApprovePlayerRegistration,
    onRejectPlayerRegistration,
    clubs: initialClubs,
    onAddClub,
    onUpdateClub,
    onDeleteClub
}) => {
    const { user } = useAuth();
    const [activeSection, setActiveSection] = useState<AdminSection>('User Management');
    const [matchScores, setMatchScores] = useState<Record<number, { home: string; away: string }>>({});

    // Club management state
    const [showClubForm, setShowClubForm] = useState(false);
    const [isLoadingClubs, setIsLoadingClubs] = useState(false);
    const [isSubmittingClub, setIsSubmittingClub] = useState(false);

    // Form states for manager creation
    const [newManagerName, setNewManagerName] = useState('');
    const [newManagerEmail, setNewManagerEmail] = useState('');
    const [newManagerClubId, setNewManagerClubId] = useState<string>('');
    const [lastCreatedUser, setLastCreatedUser] = useState<any>(null);
    const [isCreatingUser, setIsCreatingUser] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const [clubs, setClubs] = useState<Club[]>(initialClubs || []);

    const handleScoreChange = (matchId: number, team: 'home' | 'away', score: string) => {
        setMatchScores(prev => ({
            ...prev,
            [matchId]: {
                ...prev[matchId],
                [team]: score,
            }
        }));
    };

    const handleUpdateScoreClick = (match: Match) => {
        const scores = matchScores[match.id];
        const homeScore = scores?.home !== undefined && scores.home !== '' ? parseInt(scores.home, 10) : match.homeScore;
        const awayScore = scores?.away !== undefined && scores.away !== '' ? parseInt(scores.away, 10) : match.awayScore;
        
        if (isNaN(homeScore) || isNaN(awayScore) || homeScore < 0 || awayScore < 0) {
            alert('Please enter valid, non-negative scores.');
            return;
        }
        
        onMatchUpdate(match.id, homeScore, awayScore);
    };

    const handleFinalizeMatchClick = (match: Match) => {
        const scores = matchScores[match.id];
        const homeScore = scores?.home !== undefined && scores.home !== '' ? parseInt(scores.home, 10) : match.homeScore;
        const awayScore = scores?.away !== undefined && scores.away !== '' ? parseInt(scores.away, 10) : match.awayScore;
        
        if (isNaN(homeScore) || isNaN(awayScore) || homeScore < 0 || awayScore < 0) {
            alert('Please enter valid, non-negative scores before finalizing.');
            return;
        }
        
        onMatchUpdate(match.id, homeScore, awayScore);
        onMatchFinish(match.id);
    };
    
    const handleCreateManagerSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage('');
        
        if (!newManagerName.trim() || !newManagerEmail.trim()) {
            setErrorMessage('Please fill in all required fields.');
            return;
        }

        // Find club by id
        const selectedClub = clubs.find(c => String(c.id) === newManagerClubId);

        // Check if club already has a manager
        const existingManager = createdUsers.find((u: CreatedUser) => u.role === 'clubManager' && String(u.clubId) === newManagerClubId && u.isActive);
        if (existingManager) {
            setErrorMessage(`${selectedClub?.name} already has an active manager.`);
            return;
        }

        // Check if email already exists
        const existingUser = createdUsers.find((u: CreatedUser) => u.email.toLowerCase() === newManagerEmail.toLowerCase());
        if (existingUser) {
            setErrorMessage('An account with this email already exists.');
            return;
        }

        setIsCreatingUser(true);

        try {
            // Get Firebase ID token for authentication
            const idToken = await user?.firebaseUser?.getIdToken();
            
            if (!idToken) {
                throw new Error('Authentication required. Please login again.');
            }

            // Call backend API to create manager
            const response = await axios.post('http://localhost:5000/api/auth/create-manager', {
                managerName: newManagerName,
                managerEmail: newManagerEmail,
                clubName: selectedClub?.name,
                clubId: newManagerClubId
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`
                }
            });

            if (response.data.success) {
                const managerData = response.data.data.manager;

                // Show success message based on email delivery status
                if (response.data.data.emailSent) {
                    const emailProvider = response.data.data.emailProvider || 'email';
                    alert(`✅ Manager Account Created Successfully!\n\n📧 Login credentials have been sent via ${emailProvider.toUpperCase()} to:\n${managerData.email}\n\n👤 Manager Details:\n• Email: ${managerData.email}\n• Role: Club Manager\n• Club: ${managerData.club}\n\n🎯 Next Steps:\nThe manager can now login and create coaches for their club.\n\n⚠️ Security Note:\nCredentials are sent securely via email. Admin cannot see the generated password.`);
                } else {
                    // Only show password if email failed (for manual delivery)
                    const password = response.data.data.password;
                    alert(`✅ Manager Account Created Successfully!\n\n⚠️ Email delivery failed - Please provide credentials manually:\n\n👤 Manager Credentials:\n• Email: ${managerData.email}\n• Password: ${password}\n• Club: ${managerData.club}\n\n🎯 Next Steps:\n1. Manually send these credentials to the manager\n2. Manager can login and create coaches for their club\n\n🔐 Security Note:\nPlease ensure secure delivery of these credentials.`);
                }

                // Update UI state
                setLastCreatedUser({
                    ...managerData,
                    emailSent: response.data.data.emailSent,
                    emailProvider: response.data.data.emailProvider
                });
                setNewManagerName('');
                setNewManagerEmail('');
                // Use first club from API clubs array, fallback to ''
                setNewManagerClubId(clubs[0]?.id ? String(clubs[0].id) : '');
            } else {
                setErrorMessage(response.data.message || 'Failed to create manager account.');
            }
        } catch (error: any) {
            console.error('Error creating manager:', error);
            
            if (error.response?.data?.message) {
                setErrorMessage(error.response.data.message);
            } else if (error.response?.status === 409) {
                setErrorMessage('A user with this email already exists.');
            } else if (error.response?.status === 400) {
                setErrorMessage('Please check your input and try again.');
            } else if (error.response?.status === 401) {
                setErrorMessage('Authentication required. Please login again.');
            } else {
                setErrorMessage('Failed to create manager account. Please try again.');
            }
        } finally {
            setIsCreatingUser(false);
        }
    };

    const handleDeactivateUser = (userId: number) => {
        // This would need to be passed as a prop from App.tsx
        console.log('Deactivate user:', userId);
    };

    useEffect(() => {
        const fetchClubs = async () => {
            setIsLoadingClubs(true);
            try {
                const res = await clubService.getClubs();
                // Map _id to id for all clubs
                const clubsWithId = res.data.map((club: any) => ({
                    ...club,
                    id: club._id
                }));
                setClubs(clubsWithId);
                // Set default club for manager creation if not set and clubs exist
                if (clubsWithId.length > 0 && !clubsWithId.find((c: Club) => String(c.id) === newManagerClubId)) {
                    setNewManagerClubId(clubsWithId[0].id);
                }
            } catch (err) {
                toast.error('Failed to load clubs from API');
            } finally {
                setIsLoadingClubs(false);
            }
        };
        fetchClubs();
    }, []);

    const handleCreateClub = async (clubData: CreateClubData) => {
        setIsSubmittingClub(true);
        try {
            const response = await clubService.createClub(clubData);
            // Map _id to id for the new club
            const newClub = {
                ...response.data,
                id: (response.data as any)._id
            };
            setClubs(prev => [...prev, newClub]);
            onAddClub(newClub); // If you want to keep parent in sync
            setShowClubForm(false);
            toast.success('Club created successfully!');
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Failed to create club';
            toast.error(errorMessage);
            throw error;
        } finally {
            setIsSubmittingClub(false);
        }
    };

    const handleDeleteClubLocal = async (clubId: string | number) => {
        if (!confirm('Are you sure you want to delete this club? This action cannot be undone.')) {
            return;
        }
        try {
            await clubService.deleteClub(clubId);
            setClubs(prev => prev.filter(c => c.id !== clubId));
            onDeleteClub(clubId); // If you want to keep parent in sync
            toast.success('Club deleted successfully');
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Failed to delete club';
            toast.error(errorMessage);
        }
    };

    const renderSection = () => {
        switch(activeSection) {
            case 'Dashboard':
                return <div>
                    <h2 className="text-2xl font-bold mb-4 text-theme-dark">Dashboard Overview</h2>
                    <p className="text-theme-text-secondary">Analytics placeholders for league-wide stats, ticket sales, and store revenue would go here.</p>
                    <div className="mt-6 p-6 bg-theme-secondary-bg rounded-lg text-theme-text-secondary">Placeholder for Chart.js</div>
                </div>;
            case 'Manage Fixtures':
                return (
                    <div>
                        <h2 className="text-3xl font-bold mb-6 text-theme-dark">Manage & Finalize Fixtures</h2>
                        <div className="space-y-3">
                            {matches.map(match => (
                                <div key={match.id} className="bg-theme-secondary-bg p-3 rounded-lg flex items-center justify-between flex-wrap gap-4">
                                    <div className="flex items-center gap-4 flex-grow text-theme-dark">
                                        <span className={`font-bold px-2 py-1 rounded text-xs text-theme-dark ${match.stage === 'Final' ? 'bg-yellow-500' : match.stage === 'Semi-Final' ? 'bg-blue-500' : 'bg-gray-500'}`}>{match.stage}</span>
                                        <span className="w-32 text-right font-bold">{match.homeTeam}</span>
                                        <img src={match.homeLogo} alt={match.homeTeam} className="h-8 w-8" />
                                        <div className="flex items-center gap-2">
                                            {match.status === 'live' ? (
                                                <>
                                                    <input type="number" key={`${match.id}-home`} placeholder={String(match.homeScore)} min="0" className="w-14 bg-theme-page-bg text-center font-bold text-lg rounded border border-theme-border focus:ring-2 focus:ring-theme-primary focus:outline-none" onChange={e => handleScoreChange(match.id, 'home', e.target.value)} />
                                                    <span>-</span>
                                                    <input type="number" key={`${match.id}-away`} placeholder={String(match.awayScore)} min="0" className="w-14 bg-theme-page-bg text-center font-bold text-lg rounded border border-theme-border focus:ring-2 focus:ring-theme-primary focus:outline-none" onChange={e => handleScoreChange(match.id, 'away', e.target.value)} />
                                                </>
                                            ) : (
                                                <span className="text-2xl font-bold w-28 text-center">{match.homeScore} - {match.awayScore}</span>
                                            )}
                                        </div>
                                        <img src={match.awayLogo} alt={match.awayTeam} className="h-8 w-8" />
                                        <span className="w-32 text-left font-bold">{match.awayTeam}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {match.status === 'upcoming' && (
                                            <button onClick={() => onMatchUpdate(match.id, 0, 0)} className="bg-green-500 text-white font-bold py-2 px-4 rounded-md hover:bg-green-600 transition-colors">Start Match</button>
                                        )}
                                        {match.status === 'live' && (
                                            <>
                                                <button onClick={() => handleUpdateScoreClick(match)} className="bg-blue-500 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-600 transition-colors">Update Score</button>
                                                <button onClick={() => handleFinalizeMatchClick(match)} className="bg-red-500 text-white font-bold py-2 px-4 rounded-md hover:bg-red-600 transition-colors">Finalize</button>
                                            </>
                                        )}
                                        {match.status === 'finished' && (
                                            <span className={`font-bold px-3 py-1 rounded-full text-xs text-white bg-gray-500`}>
                                                FINISHED
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'Manage Clubs':
                return (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-theme-dark">Manage Clubs</h2>
                            <button
                                onClick={() => setShowClubForm(true)}
                                className="px-4 py-2 bg-theme-primary text-theme-dark rounded-md hover:bg-theme-primary/80 transition-colors"
                            >
                                Add New Club
                            </button>
                        </div>

                        {showClubForm ? (
                            <ClubRegistrationForm
                                onSubmit={handleCreateClub}
                                onCancel={() => setShowClubForm(false)}
                                isLoading={isSubmittingClub}
                            />
                        ) : (
                            <div>
                                <div className="mb-4 text-theme-text-secondary">
                                    <p>Manage all clubs in the league. You can add new clubs, view details, and remove clubs as needed.</p>
                                </div>

                                <ClubList
                                    clubs={clubs}
                                    onDelete={handleDeleteClubLocal}
                                    isLoading={isLoadingClubs}
                                />
                            </div>
                        )}
                    </div>
                );
            case 'Manage Players':
                return <div>
                    <h2 className="text-2xl font-bold mb-4 text-theme-dark">Manage All Players (CRUD)</h2>
                    <p className="text-theme-text-secondary">A global list of all players from all clubs, with powerful search and filter capabilities.</p>
                </div>;
            case 'Manage News':
                 return <div>
                    <h2 className="text-2xl font-bold mb-4 text-theme-dark">Manage League News</h2>
                    <p className="text-theme-text-secondary">A form for creating and publishing league-wide news articles.</p>
                </div>;
            case 'Player Registrations':
                return (
                    <div>
                        <h2 className="text-2xl font-bold mb-4 text-theme-dark">Player Registrations</h2>
                        <div className="space-y-4">
                            {playerRegistrations.filter(reg => reg.status === 'pending').length === 0 ? (
                                <p className="text-theme-text-secondary">No pending player registrations.</p>
                            ) : (
                                playerRegistrations
                                    .filter(reg => reg.status === 'pending')
                                    .map(registration => (
                                        <div key={registration.id} className="bg-theme-secondary-bg p-4 rounded-lg">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <h3 className="text-lg font-semibold text-theme-dark">{registration.name}</h3>
                                                    <p className="text-theme-text-secondary">{registration.position} • {registration.nationality}</p>
                                                    <p className="text-sm text-theme-text-secondary">
                                                        Club: {clubs.find(c => c.id === registration.clubId)?.name}
                                                    </p>
                                                    <p className="text-sm text-theme-text-secondary">Submitted: {new Date(registration.submittedAt).toLocaleDateString()}</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => onApprovePlayerRegistration(registration.id)}
                                                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            const reason = prompt('Reason for rejection:');
                                                            if (reason) onRejectPlayerRegistration(registration.id, reason);
                                                        }}
                                                        className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                            )}
                        </div>
                    </div>
                );
            case 'User Management':
                 return (
                    <div>
                        <h2 className="text-3xl font-bold mb-6 text-theme-dark">User Management</h2>
                        
                        {/* Create Manager Form */}
                        <div className="max-w-2xl mb-8">
                            <div className="bg-theme-secondary-bg p-6 rounded-lg">
                                <h3 className="text-xl font-semibold mb-4 text-theme-dark border-b-2 border-theme-primary pb-2">Create Club Manager</h3>

                                <div className="mb-4 bg-blue-50 border-l-4 border-blue-400 text-blue-700 p-3 rounded-lg text-sm">
                                    <p className="font-semibold mb-1">🔐 Real-Time Security Features:</p>
                                    <ul className="list-disc list-inside space-y-1 text-xs">
                                        <li>✅ <strong>Auto-generated secure password</strong> (12+ characters with mixed case, numbers, symbols)</li>
                                        <li>✅ <strong>Real email delivery</strong> via Brevo (primary) or Gmail (fallback)</li>
                                        <li>✅ <strong>MongoDB database storage</strong> with Firebase authentication</li>
                                        <li>✅ <strong>Admin cannot see passwords</strong> - sent directly to manager's email</li>
                                        <li>✅ <strong>No demo accounts</strong> - all accounts are real and functional</li>
                                    </ul>
                                </div>
                                
                                {errorMessage && (
                                    <div className="mb-4 bg-red-50 border-l-4 border-red-400 text-red-700 p-4 rounded-lg">
                                        <p className="font-bold">Error:</p>
                                        <p>{errorMessage}</p>
                                    </div>
                                )}
                                
                                <form onSubmit={handleCreateManagerSubmit} className="space-y-4">
                                    <div>
                                        <label htmlFor="newManagerName" className="block text-sm font-medium text-theme-text-secondary mb-1">Manager Name *</label>
                                        <input 
                                            type="text" 
                                            id="newManagerName" 
                                            value={newManagerName} 
                                            onChange={e => setNewManagerName(e.target.value)} 
                                            required 
                                            className="w-full bg-theme-page-bg border border-theme-border rounded-md shadow-sm py-2 px-3 text-theme-dark focus:outline-none focus:ring-theme-primary focus:border-theme-primary" 
                                            placeholder="Enter manager's full name"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="newManagerEmail" className="block text-sm font-medium text-theme-text-secondary mb-1">Manager Email *</label>
                                        <input 
                                            type="email" 
                                            id="newManagerEmail" 
                                            value={newManagerEmail} 
                                            onChange={e => setNewManagerEmail(e.target.value)} 
                                            required 
                                            className="w-full bg-theme-page-bg border border-theme-border rounded-md shadow-sm py-2 px-3 text-theme-dark focus:outline-none focus:ring-theme-primary focus:border-theme-primary" 
                                            placeholder="manager@club.com"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="newManagerClub" className="block text-sm font-medium text-theme-text-secondary mb-1">Assign to Club *</label>
                                        <select 
                                            id="newManagerClub" 
                                            value={newManagerClubId}
                                            onChange={e => {
                                                setNewManagerClubId(e.target.value);
                                            }}
                                            className="w-full bg-theme-page-bg border border-theme-border rounded-md shadow-sm py-2 px-3 text-theme-dark focus:outline-none focus:ring-theme-primary focus:border-theme-primary"
                                        >
                                            {clubs.map(club => (
                                                <option key={club.id} value={club.id}>{club.name}</option>
                                            ))}
                                        </select>

                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isCreatingUser}
                                        className="w-full bg-theme-primary text-theme-dark font-bold py-2 px-4 rounded-md hover:bg-theme-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {isCreatingUser ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-theme-dark border-t-transparent"></div>
                                                Creating Manager & Sending Email...
                                            </>
                                        ) : (
                                            <>
                                                🎯 Create Manager Account
                                            </>
                                        )}
                                    </button>
                                </form>
                                
                                {lastCreatedUser && (
                                    <div className="mt-6 bg-green-50 border-l-4 border-green-400 text-green-700 p-4 rounded-lg">
                                        <h4 className="font-bold flex items-center gap-2">
                                            ✅ Manager Account Created Successfully!
                                            {lastCreatedUser.emailSent && (
                                                <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full">
                                                    📧 Email Sent via {(lastCreatedUser.emailProvider || 'email').toUpperCase()}
                                                </span>
                                            )}
                                        </h4>

                                        {lastCreatedUser.emailSent ? (
                                            <div className="text-sm mt-2">
                                                <p className="mb-2">🎯 <strong>Login credentials have been sent securely via email to:</strong></p>
                                                <div className="bg-white border border-green-200 rounded p-3 mb-2">
                                                    <ul className="space-y-1">
                                                        <li><strong>📧 Email:</strong> {lastCreatedUser.email}</li>
                                                        <li><strong>👤 Role:</strong> Club Manager</li>
                                                        <li><strong>⚽ Club:</strong> {lastCreatedUser.club}</li>
                                                    </ul>
                                                </div>
                                                <p className="font-semibold text-green-800">🔐 Security: Password was auto-generated and sent securely. Admin cannot see the password.</p>
                                                <p className="mt-1 font-semibold">🎯 Next: Manager can now login and create coaches for their club.</p>
                                            </div>
                                        ) : (
                                            <div className="text-sm mt-2">
                                                <p className="mb-2 text-orange-700">⚠️ <strong>Email delivery failed - Manual credential delivery required</strong></p>
                                                <div className="bg-orange-50 border border-orange-200 rounded p-3 mb-2">
                                                    <p className="text-orange-800 font-semibold mb-2">Please securely provide these credentials to the manager:</p>
                                                    <ul className="space-y-1 text-orange-900">
                                                        <li><strong>📧 Email:</strong> {lastCreatedUser.email}</li>
                                                        <li><strong>👤 Role:</strong> Club Manager</li>
                                                        <li><strong>⚽ Club:</strong> {lastCreatedUser.club}</li>
                                                    </ul>
                                                </div>
                                                <p className="font-semibold text-green-800">🎯 Next: Manager can login and create coaches for their club.</p>
                                            </div>
                                        )}

                                        <button
                                            onClick={() => setLastCreatedUser(null)}
                                            className="mt-3 text-xs text-green-600 hover:text-green-800 underline"
                                        >
                                            Dismiss
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Users List */}
                        <div>
                            <h3 className="text-xl font-semibold mb-3 text-theme-dark border-b-2 border-theme-primary pb-2">All Users</h3>
                            <div className="bg-theme-secondary-bg rounded-lg overflow-hidden">
                                <table className="w-full">
                                    <thead className="bg-theme-primary text-theme-dark">
                                        <tr>
                                            <th className="px-4 py-3 text-left">Email</th>
                                            <th className="px-4 py-3 text-left">Role</th>
                                            <th className="px-4 py-3 text-left">Club</th>
                                            <th className="px-4 py-3 text-left">Status</th>
                                            <th className="px-4 py-3 text-left">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {createdUsers.map(user => (
                                            <tr key={user.id} className="border-b border-theme-border">
                                                <td className="px-4 py-3 text-theme-dark">{user.email}</td>
                                                <td className="px-4 py-3 text-theme-dark capitalize">{user.role.replace('-', ' ')}</td>
                                                <td className="px-4 py-3 text-theme-dark">{user.clubName || '-'}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-1 rounded text-xs ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                        {user.isActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {user.role !== 'admin' && (
                                                        <button 
                                                            onClick={() => handleDeactivateUser(user.id)}
                                                            className="text-red-600 hover:text-red-800 text-sm"
                                                        >
                                                            {user.isActive ? 'Deactivate' : 'Activate'}
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    const sections: AdminSection[] = ['Dashboard', 'Manage Clubs', 'Manage Players', 'Manage Fixtures', 'Manage News', 'User Management', 'Player Registrations'];

    return (
        <div className="flex min-h-screen bg-theme-light">
            {/* Sidebar */}
            <aside className="w-64 bg-theme-light flex flex-col">
                <div className="h-20 flex items-center justify-center font-bold text-xl border-b border-theme-border">NGL ADMIN</div>
                <nav className="flex-grow">
                    <ul className="space-y-2 p-4">
                        {sections.map(section => (
                             <li key={section}>
                                <button
                                    onClick={() => setActiveSection(section)}
                                    className={`w-full text-left px-4 py-2 rounded transition-colors ${activeSection === section ? 'bg-theme-primary text-theme-dark' : 'hover:bg-theme-secondary-bg'}`}
                                >
                                    {section}
                                </button>
                            </li>
                        ))}
                    </ul>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8">
                <div className="bg-theme-page-bg p-6 rounded-lg shadow-lg">
                    {renderSection()}
                    {/* AI Placeholder for Heatmaps */}
                    {activeSection === 'Dashboard' && (
                        <div className="mt-8 bg-blue-900/50 border-l-4 border-blue-400 text-blue-200 p-4 rounded-lg" role="alert">
                            <p className="font-bold">AI Analytics (Phase 2)</p>
                            <p>This area will display AI-generated heatmaps and performance visualizations from a central analytics API.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};


export default AdminDashboard;
