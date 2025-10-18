

import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Match } from '../types';
import PageBanner from '../components/PageBanner';
import FinalMatch from '../components/FinalMatch';
import ChampionDisplay from '../components/ChampionDisplay';
import { FixtureDTO, listFixtures } from '../services/fixturesService';
import { getSocket } from '../services/socket';
import { getLeagueConfig, LeagueConfigDTO } from '../services/leagueConfigService';
import LiveMatch from '../components/LiveMatch';
import ChampionCelebration from '../components/ChampionCelebration';

interface MatchesPageProps {
  matchesData: Match[];
}

type StageFilter = 'All' | 'Semi-Final' | 'Final';

const MatchesPage: React.FC<MatchesPageProps> = ({ matchesData }) => {
  const [stageFilter, setStageFilter] = useState<StageFilter>('All');
  const [liveFixtures, setLiveFixtures] = useState<FixtureDTO[]>([]);
  const [leagueConfig, setLeagueConfig] = useState<LeagueConfigDTO | null>(null);
  const [showChampionCelebration, setShowChampionCelebration] = useState(false);
  const [championTeam, setChampionTeam] = useState<{ name: string; logo?: string } | null>(null);

  useEffect(() => {
    const load = async () => { try { const data = await listFixtures(); setLiveFixtures(data); } catch {} };
    const loadLeagueConfig = async () => { try { const config = await getLeagueConfig(); setLeagueConfig(config); } catch {} };
    
    load();
    loadLeagueConfig();
    
    const s = getSocket();
    const refresh = () => load();
    
    // Handle final match completion for champion celebration
    const handleFinalFinished = (finalMatch: any) => {
      // Check both isFinal and stage for final matches
      const isFinalMatch = (finalMatch?.isFinal === true) || (finalMatch?.stage === 'final');
      
      if (finalMatch && isFinalMatch && finalMatch.status === 'finished') {
        console.log('🏆 Final match finished! Triggering celebration...');
        // Determine the winner
        let winner;
        if (finalMatch.score.home > finalMatch.score.away) {
          winner = finalMatch.homeTeam;
        } else if (finalMatch.score.away > finalMatch.score.home) {
          winner = finalMatch.awayTeam;
        } else {
          // In case of a draw, we'll show the home team (or implement penalty logic later)
          winner = finalMatch.homeTeam;
        }
        
        // Set champion team data
        const championData = {
          name: typeof winner === 'string' ? 'Champion Team' : (winner?.name || 'Champion Team'),
          logo: typeof winner === 'string' ? undefined : winner?.logo
        };
        
        setChampionTeam(championData);
        setShowChampionCelebration(true);
      }
    };
    
    s.on('match:started', refresh);
    s.on('match:event', refresh);
    s.on('match:finished', (match) => {
      refresh();
      // Check if this is a final match that just finished
      const isFinalMatch = (match?.isFinal === true) || (match?.stage === 'final');
      if (match && isFinalMatch && match.status === 'finished') {
        console.log('🏆 Final match detected! Triggering celebration...');
        handleFinalFinished(match);
      }
    });
    s.on('semi:created', refresh);
    s.on('final:created', refresh);
    s.on('final:finished', handleFinalFinished);
    
    // Update live match times every 30 seconds
    const timeInterval = setInterval(() => {
      const hasLiveMatches = liveFixtures.some(f => f.status === 'live');
      if (hasLiveMatches) {
        load(); // Refresh fixtures to get updated match times
      }
    }, 30000);
    
    return () => {
      s.off('match:started', refresh);
      s.off('match:event', refresh);
      s.off('match:finished', refresh);
      s.off('semi:created', refresh);
      s.off('final:created', refresh);
      s.off('final:finished', handleFinalFinished);
      clearInterval(timeInterval);
    };
  }, []);

  const availableStages = useMemo(() => {
    const hasSemiFinal = liveFixtures.some(f => f.stage === 'semi');
    const hasFinal = liveFixtures.some(f => f.isFinal);
    const result: StageFilter[] = ['All'];
    if (hasSemiFinal) result.push('Semi-Final');
    if (hasFinal) result.push('Final');
    
    
    return result;
  }, [liveFixtures]);

  // Split fixtures into live (top) and the rest (scheduled + finished)
  const liveNow = useMemo(() => {
    return liveFixtures
      .filter(f => {
        if (f.status !== 'live') return false;
        if (stageFilter === 'All') return true;
        if (stageFilter === 'Semi-Final') return f.stage === 'semi';
        if (stageFilter === 'Final') return f.isFinal;
        return false;
      })
      .sort((a,b) => {
        const ka = a.kickoffAt ? new Date(a.kickoffAt).getTime() : 0;
        const kb = b.kickoffAt ? new Date(b.kickoffAt).getTime() : 0;
        return ka - kb; // earliest kickoff first among live
      });
  }, [liveFixtures, stageFilter]);

  const displayedFixtures = useMemo(() => {
    const items = liveFixtures.filter(f => {
      if (f.status === 'live') return false; // Live matches are handled separately
      if (stageFilter === 'All') return true;
      if (stageFilter === 'Semi-Final') return f.stage === 'semi';
      if (stageFilter === 'Final') return f.isFinal;
      return false;
    });
    
    
    return items.sort((a,b) => {
      // Priority: scheduled matches first, then finished matches
      const getPriority = (f: FixtureDTO) => {
        if (f.status === 'scheduled' && f.isScheduled) return 1; // Properly scheduled matches first
        if (f.status === 'scheduled' && !f.isScheduled) return 2; // Unscheduled matches second
        if (f.status === 'finished') return 3; // Finished matches last
        return 4;
      };
      
      const priorityA = getPriority(a);
      const priorityB = getPriority(b);
      
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      // Within same priority, sort by kickoff time
      const ka = a.kickoffAt ? new Date(a.kickoffAt).getTime() : 0;
      const kb = b.kickoffAt ? new Date(b.kickoffAt).getTime() : 0;
      
      if (ka !== kb) {
        // For scheduled matches, earliest kickoff first
        // For finished matches, most recent first
        if (priorityA === 1 || priorityA === 2) return ka - kb;
        return kb - ka;
      }
      
      // If no kickoff time, sort by creation time (newest first)
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
  }, [liveFixtures, stageFilter]);


  const groupedByDate = displayedFixtures.reduce((acc, f) => {
    const d = f.kickoffAt ? new Date(f.kickoffAt) : null;
    let key: string;
    if (f.isFinal) {
      key = 'Final';
    } else if (f.stage === 'semi') {
      key = 'Semi-Final';
    } else {
      key = d ? d.toLocaleDateString() : 'TBD';
    }
    (acc[key] = acc[key] || []).push(f);
    return acc;
  }, {} as Record<string, FixtureDTO[]>);

  const FixtureRow = ({ f }: { f: FixtureDTO }) => {
    const home = typeof f.homeTeam === 'string' ? undefined : f.homeTeam;
    const away = typeof f.awayTeam === 'string' ? undefined : f.awayTeam;
    const kickoff = f.kickoffAt ? new Date(f.kickoffAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'TBD';
    
    // Stage badge logic
    const isFinalStage = (f.stage === 'final') || (!!f.isFinal);
    const isSemi = f.stage === 'semi';
    const stageLabel = isFinalStage ? 'FINAL' : (isSemi ? 'SEMI-FINAL' : 'LEAGUE');
    const stageClass = isFinalStage ? 'bg-yellow-500 text-white' : (isSemi ? 'bg-purple-600 text-white' : 'bg-gray-300 text-gray-700');
    
    return (
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center justify-end w-[40%]">
          <div className="flex flex-col items-end gap-1">
            <span className="text-sm sm:text-base font-bold text-right mr-4">{home?.name || 'Home'}</span>
            <span className={`px-2 py-1 rounded text-xs whitespace-nowrap ${stageClass}`}>{stageLabel}</span>
          </div>
          {home?.logo ? (<img src={home.logo} alt="home logo" className="h-8 w-8" onError={(e) => { e.currentTarget.style.display = 'none'; }} />) : null}
        </div>
        <div className="w-[20%] text-center font-bold bg-theme-light py-2 px-1 rounded-md text-sm">
          {f.status === 'scheduled' && (
            <div className="flex flex-col items-center gap-0.5">
              <span>{kickoff}</span>
              {f.venueName && <span className="text-[11px] font-normal text-theme-text-secondary">{f.venueName}</span>}
            </div>
          )}
          {f.status === 'live' && (
            <div className="flex flex-col items-center gap-0.5">
              <div className="flex items-center justify-center gap-2">
                <span className="text-theme-accent animate-pulse font-bold text-xs">LIVE</span>
                <span>{f.score.home} - {f.score.away}</span>
              </div>
              {f.currentTime && <span className="text-[11px] font-semibold text-theme-accent">{f.currentTime.display}</span>}
              {f.venueName && <span className="text-[11px] font-normal text-theme-text-secondary">{f.venueName}</span>}
            </div>
          )}
          {f.status === 'finished' && (
            <div className="flex flex-col items-center gap-0.5">
              <span>{f.score.home} - {f.score.away}</span>
              <span className="text-[11px] font-semibold text-theme-text-secondary">FULL TIME</span>
            </div>
          )}
        </div>
        <div className="flex items-center justify-start w-[40%]">
          {away?.logo ? (<img src={away.logo} alt="away logo" className="h-8 w-8" onError={(e) => { e.currentTarget.style.display = 'none'; }} />) : null}
          <span className="text-sm sm:text-base font-bold text-left ml-4">{away?.name || 'Away'}</span>
        </div>
      </div>
    );
  };


  return (
    <div className="min-h-screen">
      {/* Champion Celebration Modal */}
      {showChampionCelebration && championTeam && (
        <ChampionCelebration
          championTeam={championTeam}
          onClose={() => {
            setShowChampionCelebration(false);
            setChampionTeam(null);
          }}
        />
      )}
      
      <PageBanner title="Matches" subtitle={stageFilter !== 'All' ? stageFilter : 'All Matches'} />
      
      {/* League Period Display */}
      {leagueConfig && (
        <div className="bg-gradient-to-r from-theme-primary to-theme-accent text-white p-6 rounded-lg shadow-lg mx-4 md:mx-6 mb-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">{leagueConfig.name}</h2>
            <p className="text-lg opacity-90">
              League runs from{' '}
              <span className="font-semibold">
                {new Date(leagueConfig.startDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit'
                })}
              </span>
              {' '}to{' '}
              <span className="font-semibold">
                {new Date(leagueConfig.endDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit'
                })}
              </span>
            </p>
            {leagueConfig.description && (
              <p className="text-sm opacity-75 mt-2">{leagueConfig.description}</p>
            )}
          </div>
        </div>
      )}
      
      {/* Recent Match Results */}
      {(() => {
        const finishedMatches = liveFixtures
          .filter(f => f.status === 'finished')
          .sort((a, b) => {
            // Sort by finish time (most recent first)
            const timeA = a.finishedAt ? new Date(a.finishedAt).getTime() : 0;
            const timeB = b.finishedAt ? new Date(b.finishedAt).getTime() : 0;
            return timeB - timeA;
          })
          .slice(0, 4); // Show only the 4 most recent finished matches

        if (finishedMatches.length === 0) return null;

        return (
          <div className="mx-4 md:mx-6 mb-8">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-theme-dark flex items-center gap-2">
                  <span className="text-2xl">🏆</span>
                  Recent Results
                </h3>
                <span className="text-sm text-theme-text-secondary">Latest match outcomes</span>
              </div>
              
              <div className="flex flex-col items-center space-y-3 max-w-4xl mx-auto">
                {finishedMatches.map(match => {
                  const home = typeof match.homeTeam === 'string' ? undefined : match.homeTeam;
                  const away = typeof match.awayTeam === 'string' ? undefined : match.awayTeam;
                  const isFinalStage = (match.stage === 'final') || (!!match.isFinal);
                  const isSemi = match.stage === 'semi';
                  const stageLabel = isFinalStage ? 'FINAL' : (isSemi ? 'SEMI' : 'LEAGUE');
                  const stageClass = isFinalStage ? 'bg-yellow-500 text-white' : (isSemi ? 'bg-purple-600 text-white' : 'bg-gray-300 text-gray-700');
                  
                  return (
                    <div key={match._id} className="bg-theme-secondary-bg rounded-lg p-4 hover:shadow-md transition-shadow w-full max-w-2xl">
                      <div className="flex items-center justify-center">
                        <div className="flex items-center gap-4 flex-1 justify-center">
                          <div className="flex items-center gap-2">
                            {home?.logo && (
                              <img 
                                src={home.logo} 
                                alt={home.name} 
                                className="h-8 w-8 flex-shrink-0" 
                                onError={(e) => { e.currentTarget.style.display = 'none'; }} 
                              />
                            )}
                            <span className="font-semibold text-base">{home?.name || 'Home'}</span>
                          </div>
                          
                          <span className="font-bold text-xl mx-4">
                            {match.score.home} - {match.score.away}
                          </span>
                          
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-base">{away?.name || 'Away'}</span>
                            {away?.logo && (
                              <img 
                                src={away.logo} 
                                alt={away.name} 
                                className="h-8 w-8 flex-shrink-0" 
                                onError={(e) => { e.currentTarget.style.display = 'none'; }} 
                              />
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-center gap-1 ml-4">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${stageClass}`}>
                            {stageLabel}
                          </span>
                          <span className="text-xs text-theme-text-secondary font-semibold">
                            FULL TIME
                          </span>
                          {match.venueName && (
                            <p className="text-xs text-theme-text-secondary truncate text-center">
                              📍 {match.venueName}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}
      
      <div className="container mx-auto p-4 md:p-6">
        <div className="space-y-4 mb-6">
          {liveNow.filter(m=>!m.isFinal).map(m => (
            <LiveMatch key={m._id} initial={m} />
          ))}
          <FinalMatch />
          <ChampionDisplay />
        </div>
        {/* Filters and Controls */}
        <div className="bg-gradient-to-r from-theme-primary/10 to-theme-accent/10 rounded-lg p-3 mb-6 flex items-center justify-center flex-wrap gap-2 shadow-md border border-theme-primary/20">
                        <div className="flex items-center bg-theme-secondary-bg p-1 rounded-lg">
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
                    <React.Fragment key={fx._id || `fixture-${groupIdx}-${index}`}>
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