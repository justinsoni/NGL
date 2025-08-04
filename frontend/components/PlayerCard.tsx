
import React from 'react';
import { Player } from '../types';

interface PlayerCardProps {
  player: Player;
  onPlayerSelect: (playerId: number) => void;
}

const PlayerCard: React.FC<PlayerCardProps> = ({ player, onPlayerSelect }) => {
  return (
    <div onClick={() => onPlayerSelect(player.id)} className="group block bg-theme-secondary-bg rounded-lg shadow-lg overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer">
      <div className="relative h-80">
        <img src={player.imageUrl} alt={player.name} className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-110" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
        <div className="absolute bottom-0 left-0 p-4 text-white">
          <h3 className="font-bold text-2xl drop-shadow-lg">{player.name}</h3>
          <p className="text-md text-gray-200">{player.position}</p>
        </div>
        <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm p-2 rounded-md flex items-center space-x-2">
            <img src={player.clubLogo} alt={player.club} className="w-5 h-5"/>
            <span className="text-white text-xs font-semibold">{player.club}</span>
        </div>
      </div>
    </div>
  );
};

export default PlayerCard;