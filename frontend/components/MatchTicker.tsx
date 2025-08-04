import React from 'react';
import { Link } from 'react-router-dom';
import { Match } from '../types';

interface MatchTickerProps {
    matches: Match[];
}

const MatchTicker: React.FC<MatchTickerProps> = ({ matches }) => {
    const relevantMatches = [...matches.filter(m => m.status === 'finished').slice(-4), ...matches.filter(m => m.status === 'upcoming').slice(0, 4)];
    
    // Duplicate for seamless scroll
    const tickerItems = [...relevantMatches, ...relevantMatches];

    if (relevantMatches.length === 0) {
        return null;
    }

    return (
        <div className="bg-theme-page-bg text-theme-dark overflow-hidden h-14 border-y border-theme-border">
            <div className="animate-ticker flex h-full">
                {tickerItems.map((match, index) => (
                    <Link to={`/matches/${match.id}`} key={`${match.id}-${index}`} className="flex items-center justify-center flex-shrink-0 w-80 h-full hover:bg-theme-primary transition-colors duration-200 border-r border-theme-border">
                        <span className="font-semibold text-right w-2/5 truncate">{match.homeTeam}</span>
                        <img src={match.homeLogo} alt={match.homeTeam} className="w-6 h-6 mx-2"/>
                        <div className="text-center font-bold w-16 bg-black/30 rounded-md py-1 text-sm">
                             {match.status === 'finished' ? `${match.homeScore} - ${match.awayScore}` : match.kickoff}
                        </div>
                        <img src={match.awayLogo} alt={match.awayTeam} className="w-6 h-6 mx-2"/>
                        <span className="font-semibold text-left w-2/5 truncate">{match.awayTeam}</span>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default MatchTicker;