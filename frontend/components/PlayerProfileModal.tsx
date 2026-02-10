
import React, { useState } from 'react';
import { Player, LeaderStat } from '../types';
import SectionHeader from './SectionHeader';
import { CloseIcon } from './icons';

interface PlayerProfileModalProps {
    player: Player;
    onClose: () => void;
    leaderStats: LeaderStat[];
}

const PlayerProfileModal: React.FC<PlayerProfileModalProps> = ({ player, onClose, leaderStats }) => {
    const statCategories = {
        'Goals': 'GOALS',
        'Assists': 'ASSISTS',
        'Yellow Cards': 'YELLOW CARDS',
        'Red Cards': 'RED CARDS',
    } as const;

    const [activeStat, setActiveStat] = useState<string>('GOALS');

    if (!player) {
        return null;
    }

    const activeLeaderData = leaderStats.find(stat => stat.statUnit === activeStat);
    const leaders = activeLeaderData ? activeLeaderData.leaderboard : [];

    const getStatValue = (statLabel: string) => {
        const statKey = statLabel.toLowerCase().replace(' ', '') as keyof Player['stats'];
        return player.stats[statKey] ?? 0;
    };

    const seasonStats = [
        { label: 'Matches Played', value: player.stats.matches },
        { label: 'Goals', value: getStatValue('Goals') },
        { label: 'Assists', value: getStatValue('Assists') },
        { label: 'Yellow Cards', value: getStatValue('Yellow Cards') },
        { label: 'Red Cards', value: getStatValue('Red Cards') },
    ];

    return (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 animate-fadeInUp" style={{ animationDuration: '0.3s' }} onClick={onClose}>
            <div className="bg-theme-page-bg w-full max-w-4xl h-full max-h-[95vh] rounded-xl shadow-2xl overflow-y-auto relative scrollbar-hide" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="sticky top-4 right-4 float-right text-theme-text-secondary hover:text-theme-dark bg-theme-secondary-bg rounded-full p-2 z-10">
                    <CloseIcon className="w-6 h-6" />
                </button>
                <div className="p-4 sm:p-8 text-theme-dark">
                    {/* Player Header */}
                    <div className="flex flex-col md:flex-row items-center gap-8 mb-12">
                        <div className="md:w-1/3">
                            <img src={player.imageUrl} alt={player.name} className="rounded-lg shadow-2xl w-full h-auto object-cover border-4 border-theme-accent" />
                        </div>
                        <div className="md:w-2/3 text-center md:text-left">
                            <h1 className="text-5xl lg:text-7xl font-extrabold">{player.name}</h1>
                            <p className="text-2xl text-theme-primary font-semibold mt-2">{player.position}</p>
                            <p className="text-xl text-theme-text-secondary mt-1">{player.flag} {player.nationality}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column: Bio and Info */}
                        <div className="lg:col-span-2 space-y-8">
                            <div className="bg-theme-secondary-bg p-6 rounded-lg shadow-lg">
                                <h3 className="text-2xl font-bold mb-4 border-b-2 border-theme-primary pb-2">Biography</h3>
                                <p className="text-theme-text-secondary leading-relaxed">{player.bio}</p>
                            </div>

                            <div className="bg-theme-secondary-bg p-6 rounded-lg shadow-lg">
                                <h3 className="text-2xl font-bold mb-4 border-b-2 border-theme-primary pb-2">Personal & Contact Information</h3>
                                <ul className="space-y-3 text-theme-text-secondary">
                                    <li className="flex justify-between"><span className="font-semibold text-theme-dark">Date of Birth:</span> {player.dob}</li>
                                    <li className="flex justify-between"><span className="font-semibold text-theme-dark">Email:</span> {player.email}</li>
                                    <li className="flex justify-between"><span className="font-semibold text-theme-dark">Phone:</span> {player.phone}</li>
                                </ul>
                            </div>

                            <div className="bg-theme-secondary-bg p-6 rounded-lg shadow-lg">
                                <h3 className="text-2xl font-bold mb-4 border-b-2 border-theme-primary pb-2">Career History</h3>
                                <ul className="space-y-3 text-theme-text-secondary">
                                    <li className="flex justify-between"><span className="font-semibold text-theme-dark">Current Club:</span> {player.club}</li>
                                    <li className="flex justify-between"><span className="font-semibold text-theme-dark">Previous Club:</span> {player.previousClub}</li>
                                    <li className="flex justify-between"><span className="font-semibold text-theme-dark">Leagues Played:</span> {player.leaguesPlayed.join(', ') || 'N/A'}</li>
                                </ul>
                            </div>

                            <div className="bg-theme-secondary-bg p-6 rounded-lg shadow-lg">
                                <h3 className="text-2xl font-bold mb-4 border-b-2 border-theme-primary pb-2">Scouting & Medical Information</h3>
                                <ul className="space-y-3 text-theme-text-secondary">
                                    <li className="flex justify-between"><span className="font-semibold text-theme-dark">Fitness Status:</span> {player.fitnessStatus || 'Unknown'}</li>
                                    <li className="flex justify-between"><span className="font-semibold text-theme-dark">Injury History:</span> {player.hasInjuryHistory ? 'Yes' : 'None'}</li>
                                    {player.hasInjuryHistory && (
                                        <>
                                            <li className="flex justify-between"><span className="font-semibold text-theme-dark">Last Injury:</span> {player.lastInjuryDate || 'N/A'}</li>
                                            <li className="flex flex-col gap-1"><span className="font-semibold text-theme-dark">Nature of Injury:</span> <span className="text-sm italic">{player.injuryNature}</span></li>
                                        </>
                                    )}
                                    <li className="flex justify-between"><span className="font-semibold text-theme-dark">Min. Salary Expectation:</span> {player.minimumSalary ? `$${player.minimumSalary.toLocaleString()}` : 'Negotiable'}</li>
                                    {player.identityCardUrl && (
                                        <li className="mt-4 pt-2 border-t border-theme-border">
                                            <a href={player.identityCardUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                </svg>
                                                View Identity Document
                                            </a>
                                        </li>
                                    )}
                                </ul>
                            </div>
                        </div>

                        {/* Right Column: Stats */}
                        <div className="bg-theme-secondary-bg p-6 rounded-lg shadow-lg h-fit">
                            <h3 className="text-2xl font-bold mb-4 border-b-2 border-theme-primary pb-2">Season Stats</h3>
                            <ul className="space-y-4">
                                {seasonStats.map(stat => (
                                    <li key={stat.label} className="flex justify-between items-center border-b border-theme-border pb-2 last:border-b-0">
                                        <span className="text-theme-text-secondary font-medium">{stat.label}</span>
                                        <span className="font-bold text-xl text-theme-dark">{stat.value}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Top Performers Section */}
                    <div className="mt-20">
                        <SectionHeader
                            title="Top Performers"
                            subtitle="A look at the league's statistical leaders"
                        />

                        <div className="flex justify-center flex-wrap gap-2 mb-8 bg-theme-secondary-bg p-2 rounded-lg shadow-md max-w-lg mx-auto">
                            {Object.entries(statCategories).map(([label, key]) => (
                                <button
                                    key={key}
                                    onClick={() => setActiveStat(key)}
                                    className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${activeStat === key
                                        ? 'bg-theme-primary text-theme-dark shadow'
                                        : 'text-theme-text-secondary hover:bg-theme-border'
                                        }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>

                        <div className="bg-theme-secondary-bg rounded-lg shadow-lg p-4 sm:p-6 max-w-2xl mx-auto">
                            {leaders.length > 0 ? (
                                <ul className="space-y-3">
                                    {leaders.map((leader, index) => (
                                        <li key={leader.playerName} className="flex justify-between items-center py-2 border-b border-theme-border last:border-b-0">
                                            <div className="flex items-center gap-3">
                                                <span className="w-6 text-center font-bold text-theme-text-secondary">{index + 1}.</span>
                                                <img src={leader.clubLogo} alt="club" className="w-6 h-6" />
                                                <span className="font-semibold text-theme-dark uppercase">{leader.playerName}</span>
                                            </div>
                                            <span className="font-bold text-xl text-theme-primary">{leader.value}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-center text-theme-text-secondary py-4">No players have recorded this stat yet.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlayerProfileModal;