

import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Match } from '../types';
import PageBanner from '../components/PageBanner';

interface MatchesPageProps {
  matchesData: Match[];
}

type StageFilter = 'All' | 'Group Stage' | 'Semi-Final' | 'Final';

const MatchesPage: React.FC<MatchesPageProps> = ({ matchesData }) => {
  const [stageFilter, setStageFilter] = useState<StageFilter>('All');

  const availableStages = useMemo(() => {
    const stages = new Set(matchesData.map(m => m.stage));
    const result: StageFilter[] = ['Group Stage'];
    if (stages.has('Semi-Final')) result.push('Semi-Final');
    if (stages.has('Final')) result.push('Final');
    return result;
  }, [matchesData]);

  const filteredMatches = useMemo(() => {
    if (stageFilter === 'All') return matchesData;
    return matchesData.filter(m => m.stage === stageFilter);
  }, [matchesData, stageFilter]);


  const groupedMatches = filteredMatches.reduce((acc, match) => {
    const groupKey = match.stage === 'Group Stage' ? match.date : match.stage;
    (acc[groupKey] = acc[groupKey] || []).push(match);
    return acc;
  }, {} as Record<string, typeof matchesData>);

  const MatchRow = ({ match }: { match: Match }) => (
    <Link to={`/matches/${match.id}`} className="block w-full text-theme-dark hover:bg-theme-secondary-bg rounded-lg transition-colors duration-200">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center justify-end w-[40%]">
          <span className="text-sm sm:text-base font-bold text-right mr-4">{match.homeTeam}</span>
          <img src={match.homeLogo} alt={`${match.homeTeam} logo`} className="h-8 w-8" />
        </div>
        <div className="w-[20%] text-center font-bold bg-theme-light py-2 px-1 rounded-md text-sm">
          {match.status === 'upcoming' && (match.kickoff === 'TBD' ? 'TBD' : match.kickoff)}
          {match.status === 'live' && (
            <div className="flex items-center justify-center gap-2">
                <span className="text-theme-accent animate-pulse font-bold text-xs">LIVE</span>
                <span>{match.homeScore} - {match.awayScore}</span>
            </div>
          )}
          {match.status === 'finished' && <span>{match.homeScore} - {match.awayScore}</span>}
        </div>
        <div className="flex items-center justify-start w-[40%]">
          <img src={match.awayLogo} alt={`${match.awayTeam} logo`} className="h-8 w-8" />
          <span className="text-sm sm:text-base font-bold text-left ml-4">{match.awayTeam}</span>
        </div>
      </div>
    </Link>
  );

  return (
    <div className="min-h-screen">
      <PageBanner title="Matches" subtitle={stageFilter !== 'All' ? stageFilter : 'All Matches'} />
      <div className="container mx-auto p-4 md:p-6">
        {/* Filters and Controls */}
        <div className="bg-gradient-to-r from-theme-primary/10 to-theme-accent/10 rounded-lg p-3 mb-6 flex items-center justify-center flex-wrap gap-2 shadow-md border border-theme-primary/20">
          <div className="flex items-center bg-theme-secondary-bg p-1 rounded-lg">
             <button
                onClick={() => setStageFilter('All')}
                className={`px-4 py-1.5 text-sm font-semibold rounded-md ${stageFilter === 'All' ? 'bg-gradient-to-r from-theme-primary to-theme-accent text-white shadow' : 'text-theme-text-secondary hover:bg-theme-light'}`}
             >
                All
             </button>
             {availableStages.map(stage => (
              <button
                key={stage}
                onClick={() => setStageFilter(stage)}
                className={`px-4 py-1.5 text-sm font-semibold rounded-md ${stageFilter === stage ? 'bg-gradient-to-r from-theme-primary to-theme-accent text-white shadow' : 'text-theme-text-secondary hover:bg-theme-light'}`}
              >
                {stage}
              </button>
             ))}
           </div>
        </div>
        
        {/* Match List */}
        {Object.keys(groupedMatches).length > 0 ? (
          <div className="space-y-6">
            {Object.entries(groupedMatches).map(([groupKey, matches]) => (
              <div key={groupKey} className="bg-theme-page-bg p-4 rounded-lg shadow-lg">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-theme-dark">{groupKey}</h3>
                </div>
                <div className="space-y-2">
                  {matches.map((match, index) => (
                    <React.Fragment key={match.id}>
                      <MatchRow match={match} />
                      {index < matches.length - 1 && <hr className="border-theme-border" />}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-theme-page-bg rounded-lg shadow-lg">
            <p className="text-theme-text-secondary">No matches found for this stage yet.</p>
          </div>
        )}

      </div>
    </div>
  );
};

export default MatchesPage;