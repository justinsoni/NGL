
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { CLUBS } from '../constants';
import NotFoundPage from './NotFoundPage';
import { Player } from '../types';

interface ClubDetailPageProps {
    players: Player[];
    onPlayerSelect: (playerId: number) => void;
}

const PlayerListRow: React.FC<{ player: Player; onPlayerSelect: (playerId: number) => void; }> = ({ player, onPlayerSelect }) => (
    <div onClick={() => onPlayerSelect(player.id)} className="flex items-center p-3 hover:bg-theme-secondary-bg rounded-lg transition-colors duration-200 cursor-pointer">
        <img src={player.imageUrl} alt={player.name} className="w-12 h-12 rounded-full mr-4 object-cover" />
        <div>
            <p className="font-bold text-theme-dark">{player.name}</p>
            <p className="text-sm text-theme-text-secondary">{player.position}</p>
        </div>
    </div>
);


const ClubDetailPage: React.FC<ClubDetailPageProps> = ({ players, onPlayerSelect }) => {
    const { clubId } = useParams();
    const club = CLUBS.find(c => c.id === Number(clubId));
    const squad = players.filter(p => p.club === club?.name);

    if (!club) {
        return <NotFoundPage />;
    }

    return (
        <div className="min-h-screen">
            {/* Header */}
            <div className="bg-theme-page-bg pt-8 pb-4">
                <div className="container mx-auto px-4 text-center">
                    <img src={club.logo} alt={`${club.name} logo`} className="h-24 w-24 mx-auto mb-4" />
                    <h1 className="text-4xl md:text-5xl font-extrabold text-theme-dark">{club.name}</h1>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Info & Honours */}
                    <div className="lg:col-span-1 space-y-8">
                        <div className="bg-theme-page-bg p-6 rounded-lg shadow-lg">
                            <h3 className="text-xl font-bold mb-4 border-b-2 border-theme-primary pb-2 text-theme-dark">Club Details</h3>
                            <div className="space-y-3 text-theme-text-secondary">
                                <div className="flex justify-between">
                                    <span className="font-semibold">Founded:</span>
                                    <span>{club.founded}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-semibold">Stadium:</span>
                                    <span>{club.stadium}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-theme-page-bg p-6 rounded-lg shadow-lg">
                            <h3 className="text-xl font-bold mb-4 border-b-2 border-theme-primary pb-2 text-theme-dark">Honours</h3>
                            {club.honours.length > 0 ? (
                                <div className="space-y-3">
                                    {club.honours.map(honour => (
                                        <div key={honour.name} className="flex justify-between items-center">
                                            <span className="text-theme-text-secondary">{honour.name}</span>
                                            <span className="font-bold text-xl text-theme-primary">{honour.count}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-theme-text-secondary">No major honours recorded.</p>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Squad */}
                    <div className="lg:col-span-2 bg-theme-page-bg p-6 rounded-lg shadow-lg">
                         <h3 className="text-xl font-bold mb-4 border-b-2 border-theme-primary pb-2 text-theme-dark">Squad</h3>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {squad.length > 0 ? (
                                squad.map(player => <PlayerListRow key={player.id} player={player} onPlayerSelect={onPlayerSelect} />)
                            ) : (
                                <p className="col-span-full text-center text-theme-text-secondary p-8">No player data available for this club.</p>
                            )}
                         </div>
                    </div>
                </div>

                 <div className="text-center mt-12">
                    <Link to="/clubs" className="bg-theme-secondary-bg hover:bg-opacity-80 text-theme-dark font-bold py-3 px-8 rounded-lg transition-transform duration-300 hover:scale-105">
                        Back to All Clubs
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ClubDetailPage;