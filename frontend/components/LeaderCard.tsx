

import React from 'react';
import { LeaderStat } from '../types';

interface LeaderCardProps {
    statData: LeaderStat;
}

const LeaderCard: React.FC<LeaderCardProps> = ({ statData }) => {
    const cardBgColor = statData.topPlayer.card.cardTier === 'gold' 
        ? 'from-yellow-300 via-yellow-400 to-yellow-600'
        : 'from-gray-300 via-gray-400 to-gray-500';

    const cardTextColor = 'text-black';

    return (
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 flex flex-col justify-between h-full">
            <div>
                {/* Top Section: Stat Value & Player Card */}
                <div className="flex justify-between items-start mb-4">
                    {/* Left side: Stats */}
                    <div className="flex-1">
                        <h2 className="text-6xl font-bold text-theme-dark" style={{lineHeight: '1.1'}}>{statData.topPlayer.value}</h2>
                        <p className="font-semibold text-gray-500 tracking-wider text-sm mt-1">{statData.statUnit}</p>
                        <div className="mt-4">
                            <p className="text-gray-500 text-sm font-bold">1º</p>
                            <p className="text-xl font-extrabold text-black uppercase">{statData.topPlayer.name}</p>
                            <div className="flex items-center text-xs text-gray-600 font-semibold mt-1">
                                <img src={statData.topPlayer.clubLogo} alt={statData.topPlayer.club} className="w-4 h-4 mr-1.5" />
                                <span className="uppercase">{statData.topPlayer.club}</span>
                            </div>
                        </div>
                    </div>

                    {/* Right side: Player "Game" Card */}
                    <div className="relative w-32 h-44 flex-shrink-0 -mt-2 -mr-1">
                         {/* Cut-out Corner Shape */}
                        <div className="absolute top-0 right-0 w-8 h-8 bg-theme-secondary-bg" style={{ clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }}></div>
                        
                        {/* Main Card Background */}
                        <div className={`absolute top-1 right-1 w-[124px] h-[172px] bg-gradient-to-b ${cardBgColor} rounded-lg p-1 shadow-md`}>
                            <div className="relative w-full h-full">
                                {/* Player Image */}
                                <div 
                                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-[85%] bg-contain bg-no-repeat bg-bottom"
                                    style={{ backgroundImage: `url(${statData.topPlayer.card.imageUrl})`}}
                                ></div>
                                
                                {/* Player Info on Card */}
                                <div className={`absolute top-1 left-2 ${cardTextColor}`}>
                                    <p className="font-bold text-2xl">{statData.topPlayer.card.rating}</p>
                                    <p className="text-xs font-semibold">{statData.topPlayer.card.position}</p>
                                </div>
                                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-center w-full">
                                    <p className={`font-bold text-sm uppercase ${cardTextColor}`}>{statData.topPlayer.name}</p>
                                    <img src={statData.topPlayer.card.nationalityFlagUrl} alt="flag" className="w-5 mx-auto mt-0.5 rounded-sm"/>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Leaderboard List */}
                <div className="border-t-2 border-gray-200 pt-1">
                    <ul>
                        {statData.leaderboard.map(player => (
                            <li key={player.name + player.rank} className="flex items-center justify-between text-xs py-1.5 border-b border-gray-100 last:border-b-0">
                                <div className="flex items-center">
                                    <span className="w-5 text-center text-gray-500 font-semibold">{String(player.rank).padStart(2, '0')}</span>
                                    <img src={player.clubLogo} alt="club" className="w-4 h-4 mx-2" />
                                    <span className="font-semibold text-gray-800 uppercase">{player.name}</span>
                                </div>
                                <span className="font-bold text-gray-800">{player.value}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Footer Link */}
            <a href="#" className="text-theme-primary font-bold text-xs mt-4 block hover:underline">
                ALL LEADERS IN {statData.statUnit} ▸
            </a>
        </div>
    );
};

export default LeaderCard;