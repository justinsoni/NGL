
import React, { useState, useMemo } from 'react';
import { POSITIONS } from '../constants';
import { Position, Player } from '../types';
import PageBanner from '../components/PageBanner';
import { SearchIcon, ChevronRightIcon } from '../components/icons';

interface PlayersPageProps {
  players: Player[];
  onPlayerSelect: (playerId: number) => void;
}

const PlayersPage: React.FC<PlayersPageProps> = ({ players, onPlayerSelect }) => {
  const [positionFilter, setPositionFilter] = useState<Position | 'All'>('All');
  const [clubFilter, setClubFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const clubs = useMemo(() => ['All', ...Array.from(new Set(players.map(p => p.club)))], [players]);

  const filteredPlayers = useMemo(() => {
    return players.filter(player => {
      const positionMatch = positionFilter === 'All' || player.position === positionFilter;
      const clubMatch = clubFilter === 'All' || player.club === clubFilter;
      const searchMatch = player.name.toLowerCase().includes(searchQuery.toLowerCase());
      return positionMatch && clubMatch && searchMatch;
    });
  }, [players, positionFilter, clubFilter, searchQuery]);
  
  const PlayerRow = ({ player }: { player: Player }) => (
    <div onClick={() => onPlayerSelect(player.id)} className="flex items-center p-3 text-theme-dark hover:bg-theme-secondary-bg rounded-lg transition-colors duration-200 cursor-pointer">
      <div className="w-1/3 flex items-center">
        <img src={player.imageUrl} alt={player.name} className="w-12 h-12 rounded-full mr-4 object-cover" />
        <span className="font-bold">{player.name}</span>
      </div>
      <div className="w-1/6 flex items-center">
        <img src={player.clubLogo} alt={player.club} className="w-6 h-6 mr-2" />
        <span className="hidden md:inline">{player.club}</span>
      </div>
      <div className="w-1/6 text-theme-text-secondary">{player.position}</div>
      <div className="w-1/6 text-theme-text-secondary">{player.flag} {player.nationality}</div>
      <div className="w-1/12 text-right"><ChevronRightIcon className="w-5 h-5 inline text-theme-primary"/></div>
    </div>
  );

  return (
    <div className="min-h-screen">
      <PageBanner title="Players" />
       <div className="container mx-auto p-4 md:p-6">
        {/* Filters */}
        <div className="bg-theme-page-bg rounded-lg p-3 mb-6 flex flex-col md:flex-row items-center gap-4 shadow-md">
          <div className="relative w-full md:flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-theme-text-secondary"/>
            <input 
              type="text"
              placeholder="Search for a player..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-theme-secondary-bg w-full p-2 pl-10 rounded-md focus:ring-2 focus:ring-theme-primary outline-none text-theme-dark placeholder-theme-text-secondary border border-theme-border"
            />
          </div>
          <div className="flex gap-4 w-full md:w-auto">
             <select
              value={positionFilter}
              onChange={(e) => setPositionFilter(e.target.value as Position | 'All')}
              className="bg-theme-secondary-bg text-theme-dark w-full p-2 border border-theme-border rounded-md focus:ring-2 focus:ring-theme-primary outline-none appearance-none text-center"
            >
              <option value="All">All Positions</option>
              {POSITIONS.map(pos => <option key={pos} value={pos}>{pos}</option>)}
            </select>
            <select
              value={clubFilter}
              onChange={(e) => setClubFilter(e.target.value)}
              className="bg-theme-secondary-bg text-theme-dark w-full p-2 border border-theme-border rounded-md focus:ring-2 focus:ring-theme-primary outline-none appearance-none text-center"
            >
              {clubs.map(club => <option key={club} value={club}>{club}</option>)}
            </select>
          </div>
        </div>

        {/* Player List */}
        <div className="bg-theme-page-bg p-2 md:p-4 rounded-lg shadow-lg">
          {/* Header */}
          <div className="flex items-center p-3 text-sm text-theme-text-secondary font-semibold border-b border-theme-border">
            <div className="w-1/3">Player</div>
            <div className="w-1/6">Club</div>
            <div className="w-1/6">Position</div>
            <div className="w-1/6">Nationality</div>
          </div>
          {/* Rows */}
          <div className="space-y-1 mt-2">
            {filteredPlayers.length > 0 ? (
              filteredPlayers.map(player => <PlayerRow key={player.id} player={player} />)
            ) : (
              <p className="text-center col-span-full text-theme-text-secondary p-8">No players match the current filters.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayersPage;