

import React, { useState } from 'react';
import { Match, CreatedUser, PlayerRegistration } from '../types';
import { CLUBS } from '../constants';
import { EmailService } from '../utils/emailService';

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
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({
    matches,
    onMatchUpdate,
    onMatchFinish,
    createdUsers,
    onCreateUser,
    playerRegistrations,
    onApprovePlayerRegistration,
    onRejectPlayerRegistration
}) => {
    const [activeSection, setActiveSection] = useState<AdminSection>('User Management');
    const [matchScores, setMatchScores] = useState<Record<number, { home: string; away: string }>>({});

    // Form states for manager creation
    const [newManagerEmail, setNewManagerEmail] = useState('');
    const [newManagerClubId, setNewManagerClubId] = useState<number>(CLUBS[0].id);
    const [lastCreatedUser, setLastCreatedUser] = useState<CreatedUser | null>(null);

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
        const selectedClub = CLUBS.find(c => c.id === newManagerClubId);

        // Check if club already has a manager
        const existingManager = createdUsers.find((u: CreatedUser) => u.role === 'club-manager' && u.clubId === newManagerClubId && u.isActive);
        if (existingManager) {
            alert(`${selectedClub?.name} already has an active manager.`);
            return;
        }

        const newUser: Omit<CreatedUser, 'password' | 'id'> = {
            email: newManagerEmail,
            role: 'club-manager',
            clubId: newManagerClubId,
            clubName: selectedClub?.name,
            isActive: true,
            createdAt: new Date().toISOString()
        };

        const userWithPass = onCreateUser(newUser);

        // Send email notification to the new manager
        try {
            await EmailService.sendManagerCredentials(
                userWithPass.email,
                userWithPass.password,
                selectedClub?.name || 'Unknown Club',
                'System Administrator'
            );
            alert(`Manager account created successfully! Login credentials have been sent to ${userWithPass.email}`);
        } catch (error) {
            console.error('Failed to send email:', error);
            alert(`Manager account created successfully! Please provide these credentials manually:\nEmail: ${userWithPass.email}\nPassword: ${userWithPass.password}`);
        }

        setLastCreatedUser(userWithPass);
        setNewManagerEmail('');
    };

    const handleDeactivateUser = (userId: number) => {
        // This would need to be passed as a prop from App.tsx
        console.log('Deactivate user:', userId);
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
                 return <div>
                    <h2 className="text-2xl font-bold mb-4 text-theme-dark">Manage Clubs</h2>
                    <p className="text-theme-text-secondary">A table of all clubs in the league with options to edit details or onboard new clubs.</p>
                </div>;
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
                                                    <p className="text-sm text-theme-text-secondary">Club: {CLUBS.find(c => c.id === registration.clubId)?.name}</p>
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
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Create Manager Form */}
                            <div className="lg:col-span-1">
                                <h3 className="text-xl font-semibold mb-3 text-theme-dark border-b-2 border-theme-primary pb-2">Create Club Manager</h3>
                                <form onSubmit={handleCreateManagerSubmit} className="space-y-4 bg-theme-secondary-bg p-4 rounded-lg">
                                    <div>
                                        <label htmlFor="newManagerEmail" className="block text-sm font-medium text-theme-text-secondary">Manager Email</label>
                                        <input 
                                            type="email" 
                                            id="newManagerEmail" 
                                            value={newManagerEmail} 
                                            onChange={e => setNewManagerEmail(e.target.value)} 
                                            required 
                                            className="mt-1 block w-full bg-theme-page-bg border-theme-border rounded-md shadow-sm py-2 px-3 text-theme-dark focus:outline-none focus:ring-theme-primary focus:border-theme-primary" 
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="newManagerClub" className="block text-sm font-medium text-theme-text-secondary">Assign to Club</label>
                                        <select 
                                            id="newManagerClub" 
                                            value={newManagerClubId} 
                                            onChange={e => setNewManagerClubId(Number(e.target.value))} 
                                            className="mt-1 block w-full bg-theme-page-bg border-theme-border rounded-md shadow-sm py-2 px-3 text-theme-dark focus:outline-none focus:ring-theme-primary focus:border-theme-primary"
                                        >
                                            {CLUBS.map(club => <option key={club.id} value={club.id}>{club.name}</option>)}
                                        </select>
                                    </div>
                                    <button type="submit" className="w-full bg-theme-primary text-theme-dark font-bold py-2 px-4 rounded-md hover:bg-theme-primary-dark transition-colors">
                                        Create Manager Account
                                    </button>
                                </form>
                                
                                {lastCreatedUser && (
                                    <div className="mt-6 bg-theme-accent/10 border-l-4 border-theme-accent text-theme-accent p-4 rounded-lg">
                                        <h4 className="font-bold">Manager Account Created!</h4>
                                        <p className="text-sm mt-1">Provide these credentials:</p>
                                        <ul className="text-sm mt-2 list-disc list-inside">
                                            <li><strong>Email:</strong> {lastCreatedUser.email}</li>
                                            <li><strong>Password:</strong> {lastCreatedUser.password}</li>
                                            <li><strong>Club:</strong> {lastCreatedUser.clubName}</li>
                                        </ul>
                                    </div>
                                )}
                            </div>

                            {/* Users List */}
                            <div className="lg:col-span-2">
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
