

import React from 'react';
import { Link } from 'react-router-dom';
import { Match } from '../types';

interface RoadToFinalProps {
    matches: Match[];
}

const MatchupCard: React.FC<{ match?: Match }> = ({ match }) => {
    if (!match) {
        return (
            <div className="bg-theme-secondary-bg/50 rounded-lg p-3 w-full text-center h-24 flex items-center justify-center">
                <span className="text-theme-text-secondary text-sm">Winner of Semi-Final</span>
            </div>
        );
    }
    
    const isFinished = match.status === 'finished';
    const homeWon = isFinished && match.homeScore > match.awayScore;
    const awayWon = isFinished && match.homeScore < match.awayScore;

    return (
        <Link to={`/matches/${match.id}`} className="block bg-theme-secondary-bg hover:bg-theme-border transition-colors rounded-lg p-3 w-full text-theme-dark">
            <div className={`flex justify-between items-center ${homeWon ? 'font-bold' : isFinished ? 'opacity-50' : ''}`}>
                <div className="flex items-center gap-2">
                    <img src={match.homeLogo} alt={match.homeTeam} className="w-6 h-6" />
                    <span>{match.homeTeam}</span>
                </div>
                <span className="font-bold">{isFinished ? match.homeScore : ''}</span>
            </div>
             <hr className="my-1 border-theme-border" />
            <div className={`flex justify-between items-center ${awayWon ? 'font-bold' : isFinished ? 'opacity-50' : ''}`}>
                <div className="flex items-center gap-2">
                    <img src={match.awayLogo} alt={match.awayTeam} className="w-6 h-6" />
                    <span>{match.awayTeam}</span>
                </div>
                <span className="font-bold">{isFinished ? match.awayScore : ''}</span>
            </div>
        </Link>
    );
};

const FinalCard: React.FC<{ match?: Match }> = ({ match }) => {
  if (!match) {
    return (
      <div className="bg-gradient-to-br from-theme-primary to-purple-600 p-4 rounded-lg w-full text-center h-32 flex flex-col items-center justify-center shadow-lg">
        <h3 className="text-2xl font-bold text-theme-dark">THE FINAL</h3>
        <p className="text-pink-200 text-sm">Match To Be Determined</p>
      </div>
    );
  }

  const isFinished = match.status === 'finished';
  const winner = isFinished ? (match.homeScore > match.awayScore ? match.homeTeam : match.awayTeam) : null;
  const winnerLogo = isFinished ? (match.homeScore > match.awayScore ? match.homeLogo : match.awayLogo) : null;

  if (isFinished && winner && winnerLogo) {
     return (
        <div className="bg-gradient-to-br from-theme-accent to-green-500 p-4 rounded-lg w-full text-center h-32 flex flex-col items-center justify-center shadow-lg">
            <p className="text-sm font-semibold text-gray-800">CHAMPION</p>
            <img src={winnerLogo} alt={winner} className="w-10 h-10 my-1"/>
            <h3 className="text-xl font-extrabold text-black uppercase">{winner}</h3>
        </div>
     );
  }

  return (
    <Link to={`/matches/${match.id}`} className="block bg-gradient-to-br from-theme-primary to-purple-600 p-4 rounded-lg w-full text-center h-32 flex flex-col items-center justify-center shadow-lg hover:from-theme-primary-dark hover:to-purple-700 transition-all">
        <h3 className="text-2xl font-bold text-theme-dark">THE FINAL</h3>
        <div className="flex items-center gap-4 mt-2">
            <div className="flex flex-col items-center">
                <img src={match.homeLogo} alt={match.homeTeam} className="w-8 h-8"/>
                <p className="text-theme-dark text-xs font-semibold">{match.homeTeam}</p>
            </div>
            <span className="text-pink-200 text-2xl font-light">VS</span>
            <div className="flex flex-col items-center">
                <img src={match.awayLogo} alt={match.awayTeam} className="w-8 h-8"/>
                <p className="text-theme-dark text-xs font-semibold">{match.awayTeam}</p>
            </div>
        </div>
    </Link>
  );
};


const RoadToFinal: React.FC<RoadToFinalProps> = ({ matches }) => {
    const semiFinals = matches.filter(m => m.stage === 'Semi-Final').sort((a,b) => a.id - b.id);
    const final = matches.find(m => m.stage === 'Final');

    return (
        <div className="flex flex-col lg:flex-row items-center justify-center gap-4 lg:gap-8">
            {/* Semi-Finals */}
            <div className="flex flex-col md:flex-row lg:flex-col gap-4 lg:gap-12 w-full lg:w-auto">
                <MatchupCard match={semiFinals[0]} />
                <MatchupCard match={semiFinals[1]} />
            </div>

            {/* Connecting Lines */}
            <div className="hidden lg:flex items-center h-48">
                <div className="w-12 h-full border-r-4 border-b-4 border-t-4 border-theme-border/50 rounded-r-2xl"></div>
                <div className="w-12 h-[2px] bg-theme-border/50"></div>
            </div>
            
            <div className="w-px h-8 lg:hidden bg-theme-border/50 my-2"></div>


            {/* Final */}
            <div className="w-full max-w-xs lg:w-64 flex-shrink-0">
                <FinalCard match={final} />
            </div>
        </div>
    );
};

export default RoadToFinal;