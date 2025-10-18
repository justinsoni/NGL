

import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Match } from '../types';
import NotFoundPage from './NotFoundPage';

interface MatchDetailPageProps {
  matchesData: Match[];
}

const MatchDetailPage: React.FC<MatchDetailPageProps> = ({ matchesData }) => {
  const { matchId } = useParams();
  const match = matchesData.find(m => m.id === Number(matchId));
  const [activeTab, setActiveTab] = useState('Preview');

  if (!match) {
    return <NotFoundPage />;
  }
  
  const TABS = ['Preview', 'Squads', 'Stats', 'Match Info'];

  return (
    <div className="pb-12">
      <div className="container mx-auto px-4">
        {/* Header Card */}
        <div className="bg-theme-secondary-bg text-theme-dark my-6 rounded-lg shadow-2xl p-4 relative overflow-hidden">
          <div className="absolute -left-10 -top-10 w-40 h-40 opacity-10 bg-theme-primary rounded-full"></div>
          <div className="absolute -right-12 -bottom-16 w-48 h-48 opacity-10 bg-theme-primary rounded-full"></div>
          <div className="relative flex justify-around items-center text-center">
            <div className="flex flex-col items-center w-1/3">
              <img src={match.homeLogo} alt={match.homeTeam} className="h-16 w-16 md:h-24 md:w-24 mb-2"/>
              <h2 className="text-lg md:text-3xl font-bold">{match.homeTeam}</h2>
            </div>
            <div className="w-1/3">
              {match.status === 'upcoming' ? (
                <>
                  <p className="text-3xl md:text-5xl font-bold">{match.kickoff}</p>
                  <p className="text-sm md:text-base">{match.date}</p>
                </>
              ) : (
                <p className="text-4xl md:text-6xl font-bold">{match.homeScore} - {match.awayScore}</p>
              )}
              {match.group && <p className="text-sm font-bold opacity-80 mt-1">GROUP {match.group}</p>}
               {match.status === 'live' && <p className="text-theme-accent animate-pulse font-bold mt-1">LIVE</p>}
               {match.status === 'finished' && <p className="text-theme-text-secondary font-bold mt-1">Finished</p>}
               {match.venue && (match.status === 'live' || match.status === 'finished') && <p className="text-sm font-medium text-theme-text-secondary mt-1">📍 {match.venue}</p>}
            </div>
            <div className="flex flex-col items-center w-1/3">
              <img src={match.awayLogo} alt={match.awayTeam} className="h-16 w-16 md:h-24 md:w-24 mb-2"/>
              <h2 className="text-lg md:text-3xl font-bold">{match.awayTeam}</h2>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-theme-page-bg rounded-lg mb-6 shadow-md">
          <div className="flex items-center justify-start overflow-x-auto border-b-2 border-theme-border">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3 px-4 sm:px-6 text-sm font-semibold whitespace-nowrap transition-colors duration-200 border-b-4 ${activeTab === tab ? 'text-theme-dark border-theme-primary' : 'text-theme-text-secondary border-transparent hover:text-theme-dark hover:border-theme-text-secondary'}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-theme-page-bg p-4 sm:p-6 rounded-lg shadow-lg">
          {activeTab === 'Preview' && <div className="text-center py-8 text-theme-text-secondary">Match preview will be displayed here.</div>}
          {activeTab === 'Squads' && <div className="text-center py-8 text-theme-text-secondary">Squad information will be displayed here.</div>}
          {activeTab === 'Stats' && <div className="text-center py-8 text-theme-text-secondary">Match statistics will be displayed here.</div>}
          {activeTab === 'Match Info' && <div className="text-center py-8 text-theme-text-secondary">Venue and other match information will be displayed here.</div>}
        </div>
        
        <div className="text-center mt-8">
          <Link to="/matches" className="bg-theme-secondary-bg hover:bg-opacity-80 text-theme-dark font-bold py-3 px-8 rounded-lg transition-transform duration-300 hover:scale-105">
            All Matches
          </Link>
        </div>

      </div>
    </div>
  );
};

export default MatchDetailPage;