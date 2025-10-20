import React from 'react';
import { Link } from 'react-router-dom';
import { Match } from '../types';
import { FixtureDTO } from '../services/fixturesService';

interface MatchTickerProps {
    matches: (Match | FixtureDTO)[];
}

const MatchTicker: React.FC<MatchTickerProps> = ({ matches }) => {
    const relevantMatches = [
        ...matches.filter(m => m.status === 'live'), // Show live matches first
        ...matches.filter(m => m.status === 'finished').slice(-4), 
        ...matches.filter(m => m.status === 'scheduled').slice(0, 4)
    ];
    
    // Duplicate for seamless scroll
    const tickerItems = [...relevantMatches, ...relevantMatches];

    if (relevantMatches.length === 0) {
        return null;
    }

    return (
        <div className="bg-theme-page-bg text-theme-dark overflow-hidden h-14 border-y border-theme-border">
            <div className="animate-ticker flex h-full">
                {tickerItems.map((match, index) => {
                    // Handle both Match and FixtureDTO types
                    const isFixture = '_id' in match;
                    const matchId = isFixture ? match._id : match.id;
                    
                    // Extract team names and logos
                    const homeTeam = isFixture 
                        ? (typeof match.homeTeam === 'string' ? 'Home' : match.homeTeam?.name || 'Home')
                        : match.homeTeam;
                    const awayTeam = isFixture 
                        ? (typeof match.awayTeam === 'string' ? 'Away' : match.awayTeam?.name || 'Away')
                        : match.awayTeam;
                    
                    const homeLogo = isFixture 
                        ? (typeof match.homeTeam === 'string' ? '' : match.homeTeam?.logo || '')
                        : match.homeLogo;
                    const awayLogo = isFixture 
                        ? (typeof match.awayTeam === 'string' ? '' : match.awayTeam?.logo || '')
                        : match.awayLogo;
                    
                    // Extract scores
                    const homeScore = isFixture ? match.score?.home || 0 : match.homeScore;
                    const awayScore = isFixture ? match.score?.away || 0 : match.awayScore;
                    
                    // Extract kickoff time
                    const kickoff = isFixture 
                        ? (match.kickoffAt ? new Date(match.kickoffAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'TBD')
                        : match.kickoff;

                    return (
                        <Link to={`/matches/${matchId}`} key={`${matchId}-${index}`} className={`flex items-center justify-center flex-shrink-0 w-80 h-full transition-colors duration-200 border-r border-theme-border ${match.status === 'live' ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-theme-primary'}`}>
                            <span className="font-semibold text-right w-2/5 truncate">{homeTeam}</span>
                            {homeLogo && <img src={homeLogo} alt={homeTeam} className="w-6 h-6 mx-2" onError={(e) => { e.currentTarget.style.display = 'none'; }} />}
                            <div className={`text-center font-bold w-16 rounded-md py-1 text-sm ${match.status === 'live' ? 'bg-red-600 text-white' : 'bg-black/30'}`}>
                                 {match.status === 'finished' ? `${homeScore} - ${awayScore}` : 
                                  match.status === 'live' ? `${homeScore} - ${awayScore}` : kickoff}
                            </div>
                            {awayLogo && <img src={awayLogo} alt={awayTeam} className="w-6 h-6 mx-2" onError={(e) => { e.currentTarget.style.display = 'none'; }} />}
                            <span className="font-semibold text-left w-2/5 truncate">{awayTeam}</span>
                            {match.status === 'live' && <span className="absolute top-1 right-1 text-red-600 text-xs font-bold animate-pulse">LIVE</span>}
                        </Link>
                    );
                })}
            </div>
        </div>
    );
};

export default MatchTicker;