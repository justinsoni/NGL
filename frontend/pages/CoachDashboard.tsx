import React, { useState } from 'react';
import { Player, Club } from '../types';

type CoachSection = 'Player Performance' | 'Training Materials' | 'AI Tools';

interface CoachDashboardProps {
    club: Club;
    players: Player[];
}

const CoachDashboard: React.FC<CoachDashboardProps> = ({ club, players }) => {
    const [activeSection, setActiveSection] = useState<CoachSection>('Player Performance');
    const clubPlayers = players.filter(p => p.club === club.name);
    
    const [playerToCompareA, setPlayerToCompareA] = useState<number | null>(clubPlayers.length > 0 ? clubPlayers[0].id : null);
    const [playerToCompareB, setPlayerToCompareB] = useState<number | null>(clubPlayers.length > 1 ? clubPlayers[1].id : null);


    const renderSection = () => {
        if (clubPlayers.length === 0 && activeSection !== 'Training Materials') {
            return (
                <div className="text-center py-10">
                    <h2 className="text-2xl font-bold mb-4 text-theme-dark">No Players Found</h2>
                    <p className="text-theme-text-secondary">There are no players assigned to {club.name} to display performance data.</p>
                </div>
            )
        }
        
        switch(activeSection) {
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
            default:
                return null;
        }
    };

    const sections: CoachSection[] = ['Player Performance', 'Training Materials', 'AI Tools'];

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