

import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Match } from '../types';
import PageBanner from '../components/PageBanner';
import LeagueTable from '../components/LeagueTable';
import FinalMatch from '../components/FinalMatch';
import ChampionDisplay from '../components/ChampionDisplay';
import { FixtureDTO, listFixtures } from '../services/fixturesService';
import { getSocket } from '../services/socket';
import LiveMatch from '../components/LiveMatch';

interface MatchesPageProps {
  matchesData: Match[];
}

type StageFilter = 'All' | 'League Stage' | 'Semi-Final' | 'Final';

const MatchesPage: React.FC<MatchesPageProps> = ({ matchesData }) => {
  const [stageFilter, setStageFilter] = useState<StageFilter>('All');
  const [liveFixtures, setLiveFixtures] = useState<FixtureDTO[]>([]);

  useEffect(() => {
    const load = async () => { try { const data = await listFixtures(); setLiveFixtures(data); } catch {} };
    load();
    const s = getSocket();
    const refresh = () => load();
    s.on('match:started', refresh);
    s.on('match:event', refresh);
    s.on('match:finished', refresh);
    s.on('final:created', refresh);
    s.on('final:finished', refresh);
    return () => {
      s.off('match:started', refresh);
      s.off('match:event', refresh);
      s.off('match:finished', refresh);
      s.off('final:created', refresh);
      s.off('final:finished', refresh);
    };
  }, []);

  const availableStages = useMemo(() => {
    const hasFinal = liveFixtures.some(f => f.isFinal);
    const result: StageFilter[] = ['League Stage'];
    if (hasFinal) result.push('Final');
    return result;
  }, [liveFixtures]);

  const displayedFixtures = useMemo(() => {
    const items = liveFixtures.filter(f => stageFilter === 'All' || (stageFilter === 'Final' ? f.isFinal : !f.isFinal));
    return items.sort((a,b) => {
      const ka = a.kickoffAt ? new Date(a.kickoffAt).getTime() : 0;
      const kb = b.kickoffAt ? new Date(b.kickoffAt).getTime() : 0;
      return ka - kb;
    });
  }, [liveFixtures, stageFilter]);


  const groupedByDate = displayedFixtures.reduce((acc, f) => {
    const d = f.kickoffAt ? new Date(f.kickoffAt) : null;
    const key = f.isFinal ? 'Final' : (d ? d.toLocaleDateString() : 'TBD');
    (acc[key] = acc[key] || []).push(f);
    return acc;
  }, {} as Record<string, FixtureDTO[]>);

  const FixtureRow = ({ f }: { f: FixtureDTO }) => {
    const home = typeof f.homeTeam === 'string' ? undefined : f.homeTeam;
    const away = typeof f.awayTeam === 'string' ? undefined : f.awayTeam;
    const kickoff = f.kickoffAt ? new Date(f.kickoffAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'TBD';
    return (
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center justify-end w-[40%]">
          <span className="text-sm sm:text-base font-bold text-right mr-4">{home?.name || 'Home'}</span>
          {home?.logo ? (<img src={home.logo} alt="home logo" className="h-8 w-8" />) : null}
        </div>
        <div className="w-[20%] text-center font-bold bg-theme-light py-2 px-1 rounded-md text-sm">
          {f.status === 'scheduled' && kickoff}
          {f.status === 'live' && (
            <div className="flex items-center justify-center gap-2">
              <span className="text-theme-accent animate-pulse font-bold text-xs">LIVE</span>
              <span>{f.score.home} - {f.score.away}</span>
            </div>
          )}
          {f.status === 'finished' && <span>{f.score.home} - {f.score.away}</span>}
        </div>
        <div className="flex items-center justify-start w-[40%]">
          {away?.logo ? (<img src={away.logo} alt="away logo" className="h-8 w-8" />) : null}
          <span className="text-sm sm:text-base font-bold text-left ml-4">{away?.name || 'Away'}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen">
      <PageBanner title="Matches" subtitle={stageFilter !== 'All' ? stageFilter : 'All Matches'} />
      <div className="container mx-auto p-4 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 space-y-4">
            {liveFixtures.filter(m=>!m.isFinal).slice(0,1).map(m => (
              <LiveMatch key={m._id} initial={m} />
            ))}
            <FinalMatch />
            <ChampionDisplay />
          </div>
          <div>
            <LeagueTable />
          </div>
        </div>
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
        
        {/* Fixture List */}
        {Object.keys(groupedByDate).length > 0 ? (
          <div className="space-y-6">
            {Object.entries(groupedByDate).map(([groupKey, fixtures], groupIdx) => (
              <div key={groupKey || `group-${groupIdx}`} className="bg-theme-page-bg p-4 rounded-lg shadow-lg">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-theme-dark">{groupKey}</h3>
                </div>
                <div className="space-y-2">
                  {fixtures.map((fx, index) => (
                    <React.Fragment key={fx._id ?? `${index}`}>
                      <FixtureRow f={fx} />
                      {index < fixtures.length - 1 && <hr className="border-theme-border" />}
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