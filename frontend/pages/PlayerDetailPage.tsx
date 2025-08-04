import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import NotFoundPage from './NotFoundPage';
import SectionHeader from '../components/SectionHeader';
import { Player, LeaderStat } from '../types';

interface PlayerDetailPageProps {
    players: Player[];
    leaderStats: LeaderStat[];
}

const PlayerDetailPage: React.FC<PlayerDetailPageProps> = ({ players, leaderStats }) => {
  const { playerId } = useParams();
  const player = players.find(p => p.id === Number(playerId));

  const statCategories = {
    'Goals': 'GOALS',
    'Assists': 'ASSISTS',
    'Yellow Cards': 'YELLOW CARDS',
    'Red Cards': 'RED CARDS',
  } as const;
  
  const [activeStat, setActiveStat] = useState<string>('GOALS');

  if (!player) {
    return <NotFoundPage />;
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
    <div className="text-theme-dark min-h-screen">
      <div className="container mx-auto px-4 py-12">
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
            <div className="bg-theme-page-bg p-6 rounded-lg shadow-lg">
              <h3 className="text-2xl font-bold mb-4 border-b-2 border-theme-primary pb-2">Biography</h3>
              <p className="text-theme-text-secondary leading-relaxed">{player.bio}</p>
            </div>
            
            <div className="bg-theme-page-bg p-6 rounded-lg shadow-lg">
              <h3 className="text-2xl font-bold mb-4 border-b-2 border-theme-primary pb-2">Personal & Contact Information</h3>
              <ul className="space-y-3 text-theme-text-secondary">
                <li className="flex justify-between"><span className="font-semibold text-theme-dark">Date of Birth:</span> {player.dob}</li>
                <li className="flex justify-between"><span className="font-semibold text-theme-dark">Email:</span> {player.email}</li>
                <li className="flex justify-between"><span className="font-semibold text-theme-dark">Phone:</span> {player.phone}</li>
              </ul>
            </div>
            
            <div className="bg-theme-page-bg p-6 rounded-lg shadow-lg">
              <h3 className="text-2xl font-bold mb-4 border-b-2 border-theme-primary pb-2">Career History</h3>
               <ul className="space-y-3 text-theme-text-secondary">
                <li className="flex justify-between"><span className="font-semibold text-theme-dark">Previous Club:</span> {player.previousClub}</li>
                <li className="flex justify-between"><span className="font-semibold text-theme-dark">Leagues Played:</span> {player.leaguesPlayed.join(', ') || 'N/A'}</li>
              </ul>
            </div>
          </div>
          
          {/* Right Column: Stats */}
          <div className="bg-theme-page-bg p-6 rounded-lg shadow-lg h-fit">
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

            <div className="flex justify-center flex-wrap gap-2 mb-8 bg-theme-page-bg p-2 rounded-lg shadow-md max-w-lg mx-auto">
              {Object.entries(statCategories).map(([label, key]) => (
                <button
                  key={key}
                  onClick={() => setActiveStat(key)}
                  className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
                    activeStat === key
                      ? 'bg-theme-primary text-theme-dark shadow'
                      : 'text-theme-text-secondary hover:bg-theme-secondary-bg'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="bg-theme-page-bg rounded-lg shadow-lg p-4 sm:p-6 max-w-2xl mx-auto">
              {leaders.length > 0 ? (
                <ul className="space-y-3">
                  {leaders.map((leader, index) => (
                    <li key={leader.name} className="flex justify-between items-center py-2 border-b border-theme-border last:border-b-0">
                      <div className="flex items-center gap-3">
                        <span className="w-6 text-center font-bold text-theme-text-secondary">{index + 1}.</span>
                        <img src={leader.clubLogo} alt="club" className="w-6 h-6"/>
                        <span className="font-semibold text-theme-dark uppercase">{leader.name}</span>
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
  );
};

export default PlayerDetailPage;