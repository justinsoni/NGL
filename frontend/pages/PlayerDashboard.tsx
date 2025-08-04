import React, { useState } from 'react';
import { Player, Match } from '../types';
import { CLUBS } from '../constants';

interface PlayerDashboardProps {
    player: Player;
    matches: Match[];
    onUpdateProfile: (updatedPlayer: Player) => void;
}

type PlayerSection = 'Dashboard' | 'Profile' | 'Statistics' | 'Club Info' | 'Matches';

const PlayerDashboard: React.FC<PlayerDashboardProps> = ({ player, matches, onUpdateProfile }) => {
    const [activeSection, setActiveSection] = useState<PlayerSection>('Dashboard');
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [profileData, setProfileData] = useState({
        bio: player.bio,
        phone: player.phone,
        email: player.email
    });

    const playerClub = CLUBS.find(c => c.name === player.club);
    const clubMatches = matches.filter(m => 
        m.homeTeam === player.club || m.awayTeam === player.club
    );

    const handleProfileUpdate = () => {
        const updatedPlayer = {
            ...player,
            ...profileData
        };
        onUpdateProfile(updatedPlayer);
        setIsEditingProfile(false);
    };

    const renderDashboard = () => (
        <div>
            <h2 className="text-3xl font-bold mb-6 text-theme-dark">Welcome, {player.name}!</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-theme-secondary-bg p-6 rounded-lg shadow-lg text-center">
                    <h3 className="text-3xl font-bold text-theme-primary">{player.stats.matches}</h3>
                    <p className="text-theme-text-secondary mt-2">Matches Played</p>
                </div>
                <div className="bg-theme-secondary-bg p-6 rounded-lg shadow-lg text-center">
                    <h3 className="text-3xl font-bold text-theme-primary">{player.stats.goals}</h3>
                    <p className="text-theme-text-secondary mt-2">Goals</p>
                </div>
                <div className="bg-theme-secondary-bg p-6 rounded-lg shadow-lg text-center">
                    <h3 className="text-3xl font-bold text-theme-primary">{player.stats.assists}</h3>
                    <p className="text-theme-text-secondary mt-2">Assists</p>
                </div>
                <div className="bg-theme-secondary-bg p-6 rounded-lg shadow-lg text-center">
                    <h3 className="text-3xl font-bold text-theme-primary">{player.stats.yellowCards}</h3>
                    <p className="text-theme-text-secondary mt-2">Yellow Cards</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-theme-secondary-bg p-6 rounded-lg shadow-lg">
                    <h3 className="text-xl font-semibold mb-4 text-theme-dark">Club Information</h3>
                    <div className="flex items-center gap-4 mb-4">
                        <img src={player.clubLogo} alt={player.club} className="w-16 h-16 rounded-full" />
                        <div>
                            <h4 className="text-lg font-semibold text-theme-dark">{player.club}</h4>
                            <p className="text-theme-text-secondary">Your Current Club</p>
                        </div>
                    </div>
                    <div className="space-y-2 text-sm">
                        <p><span className="font-semibold">Position:</span> {player.position}</p>
                        <p><span className="font-semibold">Nationality:</span> {player.nationality}</p>
                        <p><span className="font-semibold">Status:</span> 
                            <span className={`ml-2 px-2 py-1 rounded text-xs ${player.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                {player.isVerified ? 'Verified Player' : 'Pending Verification'}
                            </span>
                        </p>
                    </div>
                </div>

                <div className="bg-theme-secondary-bg p-6 rounded-lg shadow-lg">
                    <h3 className="text-xl font-semibold mb-4 text-theme-dark">Recent Matches</h3>
                    <div className="space-y-3">
                        {clubMatches.slice(0, 3).map(match => (
                            <div key={match.id} className="flex justify-between items-center p-3 bg-theme-page-bg rounded">
                                <div className="text-sm">
                                    <p className="font-semibold">{match.homeTeam} vs {match.awayTeam}</p>
                                    <p className="text-theme-text-secondary">{match.date}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold">{match.homeScore} - {match.awayScore}</p>
                                    <span className={`text-xs px-2 py-1 rounded ${
                                        match.status === 'finished' ? 'bg-gray-100 text-gray-800' : 
                                        match.status === 'live' ? 'bg-green-100 text-green-800' : 
                                        'bg-blue-100 text-blue-800'
                                    }`}>
                                        {match.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {clubMatches.length === 0 && (
                            <p className="text-theme-text-secondary text-center py-4">No matches scheduled</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    const renderProfile = () => (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-theme-dark">Player Profile</h2>
                <button
                    onClick={() => setIsEditingProfile(!isEditingProfile)}
                    className="bg-theme-primary text-theme-dark px-4 py-2 rounded hover:bg-theme-primary-dark"
                >
                    {isEditingProfile ? 'Cancel' : 'Edit Profile'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <div className="bg-theme-secondary-bg p-6 rounded-lg shadow-lg text-center">
                        <img src={player.imageUrl} alt={player.name} className="w-32 h-32 rounded-full mx-auto mb-4 object-cover" />
                        <h3 className="text-xl font-bold text-theme-dark">{player.name}</h3>
                        <p className="text-theme-primary font-semibold">{player.position}</p>
                        <p className="text-theme-text-secondary">{player.nationality}</p>
                    </div>
                </div>

                <div className="lg:col-span-2">
                    <div className="bg-theme-secondary-bg p-6 rounded-lg shadow-lg">
                        <h3 className="text-xl font-semibold mb-4 text-theme-dark">Personal Information</h3>
                        {isEditingProfile ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-theme-dark mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={profileData.email}
                                        onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                                        className="w-full px-3 py-2 border border-theme-border rounded-md focus:outline-none focus:ring-2 focus:ring-theme-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-theme-dark mb-1">Phone</label>
                                    <input
                                        type="tel"
                                        value={profileData.phone}
                                        onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                                        className="w-full px-3 py-2 border border-theme-border rounded-md focus:outline-none focus:ring-2 focus:ring-theme-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-theme-dark mb-1">Bio</label>
                                    <textarea
                                        value={profileData.bio}
                                        onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                                        rows={4}
                                        className="w-full px-3 py-2 border border-theme-border rounded-md focus:outline-none focus:ring-2 focus:ring-theme-primary"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleProfileUpdate}
                                        className="bg-theme-primary text-theme-dark px-4 py-2 rounded hover:bg-theme-primary-dark"
                                    >
                                        Save Changes
                                    </button>
                                    <button
                                        onClick={() => setIsEditingProfile(false)}
                                        className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="font-semibold text-theme-dark">Date of Birth:</span>
                                    <span className="text-theme-text-secondary">{player.dob}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-semibold text-theme-dark">Email:</span>
                                    <span className="text-theme-text-secondary">{player.email}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-semibold text-theme-dark">Phone:</span>
                                    <span className="text-theme-text-secondary">{player.phone}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-semibold text-theme-dark">Previous Club:</span>
                                    <span className="text-theme-text-secondary">{player.previousClub || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-semibold text-theme-dark">Leagues Played:</span>
                                    <span className="text-theme-text-secondary">{player.leaguesPlayed.join(', ') || 'N/A'}</span>
                                </div>
                                <div className="mt-4">
                                    <span className="font-semibold text-theme-dark">Bio:</span>
                                    <p className="text-theme-text-secondary mt-2">{player.bio}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    const renderStatistics = () => (
        <div>
            <h2 className="text-2xl font-bold mb-6 text-theme-dark">Player Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-theme-secondary-bg p-6 rounded-lg shadow-lg text-center">
                    <h3 className="text-4xl font-bold text-theme-primary">{player.stats.matches}</h3>
                    <p className="text-theme-text-secondary mt-2">Total Matches</p>
                </div>
                <div className="bg-theme-secondary-bg p-6 rounded-lg shadow-lg text-center">
                    <h3 className="text-4xl font-bold text-theme-primary">{player.stats.goals}</h3>
                    <p className="text-theme-text-secondary mt-2">Goals Scored</p>
                </div>
                <div className="bg-theme-secondary-bg p-6 rounded-lg shadow-lg text-center">
                    <h3 className="text-4xl font-bold text-theme-primary">{player.stats.assists}</h3>
                    <p className="text-theme-text-secondary mt-2">Assists</p>
                </div>
                <div className="bg-theme-secondary-bg p-6 rounded-lg shadow-lg text-center">
                    <h3 className="text-4xl font-bold text-theme-primary">{player.stats.yellowCards}</h3>
                    <p className="text-theme-text-secondary mt-2">Yellow Cards</p>
                </div>
                <div className="bg-theme-secondary-bg p-6 rounded-lg shadow-lg text-center">
                    <h3 className="text-4xl font-bold text-theme-primary">{player.stats.redCards}</h3>
                    <p className="text-theme-text-secondary mt-2">Red Cards</p>
                </div>
                <div className="bg-theme-secondary-bg p-6 rounded-lg shadow-lg text-center">
                    <h3 className="text-4xl font-bold text-theme-primary">
                        {player.stats.matches > 0 ? (player.stats.goals / player.stats.matches).toFixed(2) : '0.00'}
                    </h3>
                    <p className="text-theme-text-secondary mt-2">Goals per Match</p>
                </div>
            </div>
        </div>
    );

    const renderClubInfo = () => (
        <div>
            <h2 className="text-2xl font-bold mb-6 text-theme-dark">Club Information</h2>
            {playerClub && (
                <div className="bg-theme-secondary-bg p-6 rounded-lg shadow-lg">
                    <div className="flex items-center gap-6 mb-6">
                        <img src={playerClub.logo} alt={playerClub.name} className="w-24 h-24 rounded-full" />
                        <div>
                            <h3 className="text-2xl font-bold text-theme-dark">{playerClub.name}</h3>
                            <p className="text-theme-text-secondary">Your Current Club</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <h4 className="font-semibold text-theme-dark mb-2">Club Details</h4>
                            <p className="text-theme-text-secondary">Founded: {playerClub.founded || 'N/A'}</p>
                            <p className="text-theme-text-secondary">Stadium: {playerClub.stadium || 'N/A'}</p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-theme-dark mb-2">Your Role</h4>
                            <p className="text-theme-text-secondary">Position: {player.position}</p>
                            <p className="text-theme-text-secondary">Status: {player.isVerified ? 'Verified Player' : 'Pending Verification'}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    const renderMatches = () => (
        <div>
            <h2 className="text-2xl font-bold mb-6 text-theme-dark">Club Matches</h2>
            <div className="space-y-4">
                {clubMatches.map(match => (
                    <div key={match.id} className="bg-theme-secondary-bg p-4 rounded-lg shadow-lg">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-semibold text-theme-dark">
                                    {match.homeTeam} vs {match.awayTeam}
                                </h3>
                                <p className="text-theme-text-secondary">{match.date} • {match.stage}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-bold text-theme-dark">{match.homeScore} - {match.awayScore}</p>
                                <span className={`text-xs px-2 py-1 rounded ${
                                    match.status === 'finished' ? 'bg-gray-100 text-gray-800' : 
                                    match.status === 'live' ? 'bg-green-100 text-green-800' : 
                                    'bg-blue-100 text-blue-800'
                                }`}>
                                    {match.status}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
                {clubMatches.length === 0 && (
                    <p className="text-theme-text-secondary text-center py-8">No matches found for your club</p>
                )}
            </div>
        </div>
    );

    const renderSection = () => {
        switch(activeSection) {
            case 'Dashboard': return renderDashboard();
            case 'Profile': return renderProfile();
            case 'Statistics': return renderStatistics();
            case 'Club Info': return renderClubInfo();
            case 'Matches': return renderMatches();
            default: return renderDashboard();
        }
    };

    const sections: PlayerSection[] = ['Dashboard', 'Profile', 'Statistics', 'Club Info', 'Matches'];

    return (
        <div className="flex min-h-screen bg-theme-light">
            <aside className="w-64 bg-theme-light text-theme-dark flex-col hidden lg:flex">
                <div className="h-20 flex items-center gap-4 px-6 border-b border-theme-border">
                    <img src={player.imageUrl} alt={player.name} className="h-10 w-10 rounded-full object-cover"/>
                    <span className="font-bold text-lg">{player.name}</span>
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

            <main className="flex-grow p-6">
                <div className="bg-theme-page-bg p-6 rounded-lg shadow-lg min-h-full">
                    {renderSection()}
                </div>
            </main>
        </div>
    );
};

export default PlayerDashboard;
