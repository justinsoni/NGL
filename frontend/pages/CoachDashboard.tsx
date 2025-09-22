import React, { useState } from 'react';
import { Player, Club } from '../types';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

type CoachSection = 'Players' | 'Player Performance' | 'Training Materials' | 'AI Tools' | 'Account Settings';

interface CoachDashboardProps {
    club: Club;
    players: Player[];
}

const CoachDashboard: React.FC<CoachDashboardProps> = ({ club, players }) => {
    const { user, resetPassword, changePassword } = useAuth();
    const [activeSection, setActiveSection] = useState<CoachSection>('Player Performance');
    const clubPlayers = players.filter(p => p.club === club.name);

    const [playerToCompareA, setPlayerToCompareA] = useState<number | null>(clubPlayers.length > 0 ? clubPlayers[0].id : null);
    const [playerToCompareB, setPlayerToCompareB] = useState<number | null>(clubPlayers.length > 1 ? clubPlayers[1].id : null);

    // Password change state
    const [showPasswordChange, setShowPasswordChange] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [isResettingPassword, setIsResettingPassword] = useState(false);

    // Password change handlers
    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            toast.error('New passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            toast.error('New password must be at least 6 characters long');
            return;
        }

        setIsChangingPassword(true);
        try {
            await changePassword(currentPassword, newPassword);
            toast.success('Password changed successfully!');
            setShowPasswordChange(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            toast.error(error.message || 'Failed to change password');
        } finally {
            setIsChangingPassword(false);
        }
    };

    const handlePasswordReset = async () => {
        if (!user?.email) {
            toast.error('No email address found');
            return;
        }

        setIsResettingPassword(true);
        try {
            await resetPassword(user.email);
            toast.success('Password reset email sent! Check your inbox.');
        } catch (error: any) {
            toast.error(error.message || 'Failed to send password reset email');
        } finally {
            setIsResettingPassword(false);
        }
    };

    const renderSection = () => {
        if (clubPlayers.length === 0 && (activeSection === 'Player Performance' || activeSection === 'Players')) {
            return (
                <div className="text-center py-10">
                    <h2 className="text-2xl font-bold mb-4 text-theme-dark">No Players Found</h2>
                    <p className="text-theme-text-secondary">There are no players assigned to {club.name} to display performance data.</p>
                </div>
            )
        }
        
        switch(activeSection) {
            case 'Players':
                return (
                    <div>
                        <h2 className="text-2xl font-bold mb-4 text-theme-dark">Players</h2>
                        <p className="mb-4 text-theme-text-secondary">All registered players for {club.name}.</p>
                        <div className="overflow-x-auto">
                            <table className="min-w-full bg-theme-page-bg">
                                <thead className="bg-theme-secondary-bg">
                                    <tr>
                                        <th className="py-2 px-4 text-left text-theme-dark">Player</th>
                                        <th className="py-2 px-4 text-left text-theme-dark">Position</th>
                                        <th className="py-2 px-4 text-left text-theme-dark">Email</th>
                                        <th className="py-2 px-4 text-left text-theme-dark">Phone</th>
                                        <th className="py-2 px-4 text-left text-theme-dark">Nationality</th>
                                        <th className="py-2 px-4 text-center text-theme-dark">Stats</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {clubPlayers.map(p => (
                                        <tr
                                            key={p.id}
                                            className="border-b border-theme-border hover:bg-theme-secondary-bg cursor-pointer"
                                            onClick={() => {
                                                // Surface player profile via global modal in App
                                                const event = new CustomEvent('player:select', { detail: { playerId: p.id } });
                                                window.dispatchEvent(event);
                                            }}
                                        >
                                            <td className="py-3 px-4 flex items-center gap-3">
                                                <img src={p.imageUrl} alt={p.name} className="h-10 w-10 rounded-full object-cover" />
                                                <div>
                                                    <div className="text-theme-dark font-medium">{p.name}</div>
                                                    <div className="text-xs text-theme-text-secondary">ID: {p.id}</div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-theme-text-secondary">{p.position}</td>
                                            <td className="py-3 px-4 text-theme-text-secondary">{p.email}</td>
                                            <td className="py-3 px-4 text-theme-text-secondary">{p.phone}</td>
                                            <td className="py-3 px-4 flex items-center gap-2 text-theme-text-secondary">
                                                {p.flag && (<img src={p.flag} alt={p.nationality} className="h-4 w-6 object-cover rounded-sm" />)}
                                                <span>{p.nationality}</span>
                                            </td>
                                            <td className="py-3 px-4 text-center text-theme-text-secondary">
                                                {p.stats.matches} M • {p.stats.goals} G • {p.stats.assists} A
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 'Player Performance':
                return (
                    <div>
                        <h2 className="text-2xl font-bold mb-4 text-theme-dark">Player Performance Data</h2>
                        <p className="mb-4 text-theme-text-secondary">View detailed match stats for each player, including assists, cards, tackles, and post-match ratings.</p>
                        <div className="overflow-x-auto">
                            <table className="min-w-full bg-theme-page-bg">
                                <thead className="bg-theme-secondary-bg">
                                    <tr>
                                        <th className="py-2 px-4 text-left text-theme-dark">Player</th>
                                        <th className="py-2 px-4 text-left text-theme-dark">Position</th>
                                        <th className="py-2 px-4 text-center text-theme-dark">Last Match Rating</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {clubPlayers.map(p => (
                                        <tr key={p.id} className="border-b border-theme-border">
                                            <td className="py-2 px-4 text-theme-dark">{p.name}</td>
                                            <td className="py-2 px-4 text-theme-text-secondary">{p.position}</td>
                                            <td className="py-2 px-4 text-center">
                                                <input type="number" min="1" max="10" defaultValue={Math.floor(Math.random() * 3) + 7} className="w-16 text-center border rounded bg-theme-secondary-bg text-theme-dark border-theme-border"/>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 'Training Materials':
                return (
                    <div>
                        <h2 className="text-2xl font-bold mb-4 text-theme-dark">Training Materials</h2>
                        <p className="mb-4 text-theme-text-secondary">Upload training videos and tactical PDFs for the squad.</p>
                        <div className="p-6 border-2 border-dashed border-theme-border rounded-lg text-center text-theme-text-secondary">
                            <p>Drag and drop files here or click to upload.</p>
                            <button className="mt-4 bg-theme-primary text-theme-dark px-4 py-2 rounded">Upload</button>
                        </div>
                    </div>
                );
            case 'AI Tools':
                 return (
                    <div>
                        <h2 className="text-2xl font-bold mb-4 text-theme-dark">AI-Powered Tools (Phase 2)</h2>
                        <p className="mb-6 text-theme-text-secondary">Leverage machine learning to gain a competitive edge. These features will be powered by our custom Flask API.</p>
                        
                        {/* Player Comparison */}
                        <div className="bg-blue-900/30 border border-blue-500/50 p-6 rounded-lg">
                            <h3 className="text-xl font-bold text-blue-300 mb-2">Player Comparison</h3>
                            <p className="text-blue-300/80 mb-4">Select two players to generate a detailed comparison based on fitness, stats, and current form.</p>
                            <div className="flex gap-4 mb-4">
                                <select value={playerToCompareA ?? ''} onChange={e => setPlayerToCompareA(Number(e.target.value))} className="w-full p-2 border rounded bg-theme-secondary-bg text-theme-dark border-theme-border">
                                    {clubPlayers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                                <select value={playerToCompareB ?? ''} onChange={e => setPlayerToCompareB(Number(e.target.value))} className="w-full p-2 border rounded bg-theme-secondary-bg text-theme-dark border-theme-border">
                                    {clubPlayers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">Compare</button>
                            <div className="mt-4 p-4 bg-theme-secondary-bg rounded">
                                <p className="font-semibold text-theme-dark">Comparison results will appear here.</p>
                                <p className="text-sm text-theme-text-secondary">e.g., "Based on recent performance, Player A has a higher work rate, but Player B is more clinical in front of goal."</p>
                                {/* Gemini could generate this text. Prompt: "Compare Player A ({statsA}) with Player B ({statsB}) and write a summary for a football coach." */}
                            </div>
                        </div>

                    </div>
                );
            case 'Account Settings':
                return (
                    <div>
                        <h2 className="text-2xl font-bold mb-4 text-theme-dark">Account Settings</h2>
                        <p className="mb-6 text-theme-text-secondary">Manage your account security and password settings.</p>

                        <div className="space-y-6">
                            {/* Password Change Section */}
                            <div className="bg-theme-secondary-bg p-6 rounded-lg border border-theme-border">
                                <h3 className="text-xl font-semibold mb-4 text-theme-dark">Change Password</h3>
                                <p className="text-theme-text-secondary mb-4">
                                    Since you're using an auto-generated password, we recommend changing it to something more memorable.
                                </p>

                                {!showPasswordChange ? (
                                    <button
                                        onClick={() => setShowPasswordChange(true)}
                                        className="bg-theme-primary hover:bg-theme-primary/80 text-theme-dark px-6 py-2 rounded-md font-medium transition-colors"
                                    >
                                        Change Password
                                    </button>
                                ) : (
                                    <form onSubmit={handlePasswordChange} className="space-y-4">
                                        <div>
                                            <label htmlFor="currentPassword" className="block text-sm font-medium text-theme-dark mb-1">
                                                Current Password
                                            </label>
                                            <input
                                                type="password"
                                                id="currentPassword"
                                                value={currentPassword}
                                                onChange={(e) => setCurrentPassword(e.target.value)}
                                                className="w-full p-3 border border-theme-border rounded-md bg-theme-page-bg text-theme-dark focus:ring-2 focus:ring-theme-primary focus:border-transparent"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="newPassword" className="block text-sm font-medium text-theme-dark mb-1">
                                                New Password
                                            </label>
                                            <input
                                                type="password"
                                                id="newPassword"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                className="w-full p-3 border border-theme-border rounded-md bg-theme-page-bg text-theme-dark focus:ring-2 focus:ring-theme-primary focus:border-transparent"
                                                minLength={6}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-theme-dark mb-1">
                                                Confirm New Password
                                            </label>
                                            <input
                                                type="password"
                                                id="confirmPassword"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="w-full p-3 border border-theme-border rounded-md bg-theme-page-bg text-theme-dark focus:ring-2 focus:ring-theme-primary focus:border-transparent"
                                                minLength={6}
                                                required
                                            />
                                        </div>
                                        <div className="flex gap-3">
                                            <button
                                                type="submit"
                                                disabled={isChangingPassword}
                                                className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-6 py-2 rounded-md font-medium transition-colors"
                                            >
                                                {isChangingPassword ? 'Changing...' : 'Change Password'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowPasswordChange(false);
                                                    setCurrentPassword('');
                                                    setNewPassword('');
                                                    setConfirmPassword('');
                                                }}
                                                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-md font-medium transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>

                            {/* Password Reset Section */}
                            <div className="bg-theme-secondary-bg p-6 rounded-lg border border-theme-border">
                                <h3 className="text-xl font-semibold mb-4 text-theme-dark">Password Reset via Email</h3>
                                <p className="text-theme-text-secondary mb-4">
                                    Alternatively, you can reset your password via email. This will send a reset link to your email address.
                                </p>
                                <button
                                    onClick={handlePasswordReset}
                                    disabled={isResettingPassword}
                                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-md font-medium transition-colors"
                                >
                                    {isResettingPassword ? 'Sending...' : 'Send Password Reset Email'}
                                </button>
                            </div>

                            {/* Account Info */}
                            <div className="bg-theme-secondary-bg p-6 rounded-lg border border-theme-border">
                                <h3 className="text-xl font-semibold mb-4 text-theme-dark">Account Information</h3>
                                <div className="space-y-2">
                                    <p className="text-theme-text-secondary">
                                        <span className="font-medium text-theme-dark">Email:</span> {user?.email}
                                    </p>
                                    <p className="text-theme-text-secondary">
                                        <span className="font-medium text-theme-dark">Role:</span> Coach
                                    </p>
                                    <p className="text-theme-text-secondary">
                                        <span className="font-medium text-theme-dark">Club:</span> {club.name}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    const sections: CoachSection[] = ['Players', 'Player Performance', 'Training Materials', 'AI Tools', 'Account Settings'];

    return (
        <div className="flex min-h-screen bg-theme-light">
            {/* Sidebar */}
            <aside className="w-72 bg-theme-light text-theme-dark flex-col hidden lg:flex">
                <div className="h-20 flex items-center gap-4 px-6 border-b border-theme-border">
                    <img src={club.logo} alt={club.name} className="h-10 w-10"/>
                    <div>
                        <p className="font-bold text-xl">{club.name}</p>
                        <p className="text-sm text-theme-text-secondary">Coach's Corner</p>
                    </div>
                </div>
                <nav className="flex-grow">
                    <ul className="space-y-2 p-4">
                       {sections.map(section => (
                             <li key={section}>
                                <button
                                    onClick={() => setActiveSection(section)}
                                    className={`w-full text-left px-4 py-3 rounded-md transition-colors text-lg ${activeSection === section ? 'bg-theme-primary text-theme-dark' : 'hover:bg-theme-secondary-bg'}`}
                                >
                                    {section}
                                </button>
                            </li>
                        ))}
                    </ul>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-6 md:p-8">
                <div className="bg-theme-page-bg p-6 rounded-lg shadow-lg min-h-full">
                    {renderSection()}
                </div>
            </main>
        </div>
    );
};

export default CoachDashboard;