import React, { useEffect, useState } from 'react';
import { getSocket } from '../services/socket';
import { FixtureDTO } from '../services/fixturesService';

export default function LiveMatch({ initial }: { initial: FixtureDTO }) {
  const [match, setMatch] = useState<FixtureDTO>(initial);

  useEffect(() => {
    const s = getSocket();
    const handler = (m: any) => {
      if (m._id === match._id) setMatch(m);
    };
    s.on('match:event', handler);
    s.on('match:finished', handler);
    s.on('match:started', handler);
    return () => {
      s.off('match:event', handler);
      s.off('match:finished', handler);
      s.off('match:started', handler);
    };
  }, [match._id]);

  const home = typeof match.homeTeam === 'string' ? undefined : match.homeTeam;
  const away = typeof match.awayTeam === 'string' ? undefined : match.awayTeam;

  return (
    <div className="bg-theme-page-bg p-4 rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {home?.logo && <img src={home.logo} className="h-8 w-8" />}
          <span className="font-bold">{home?.name || 'Home'}</span>
        </div>
        <div className="text-xl font-extrabold">
          {match.score.home} - {match.score.away}
        </div>
        <div className="flex items-center gap-2">
          {away?.logo && <img src={away.logo} className="h-8 w-8" />}
          <span className="font-bold">{away?.name || 'Away'}</span>
        </div>
      </div>
      <div className="mb-2">
        <span className={`px-2 py-1 rounded text-xs ${match.status === 'live' ? 'bg-red-500 text-white' : 'bg-gray-200'}`}>{match.status.toUpperCase()}</span>
        {match.isFinal && <span className="ml-2 px-2 py-1 rounded text-xs bg-yellow-400">FINAL</span>}
      </div>
      <div className="mt-4 max-h-64 overflow-auto">
        <div className="grid grid-cols-3 gap-2 text-sm font-semibold text-theme-text-secondary mb-2">
          <div className="text-left">{home?.name || 'Home'}</div>
          <div className="text-center">Time</div>
          <div className="text-right">{away?.name || 'Away'}</div>
        </div>
        <div className="space-y-2">
          {match.events
            .slice()
            .sort((a,b)=>a.minute-b.minute)
            .map((e, idx) => {
              const label = e.type.replace('_',' ');
              const content = `${label}${e.player ? ` — ${e.player}` : ''}`;
              return (
                <div key={`${e.minute}-${idx}`} className="grid grid-cols-3 items-center gap-2">
                  {/* Home column */}
                  <div className={`text-left ${e.team==='home' ? 'font-semibold text-theme-dark' : 'text-transparent'}`}>
                    {e.team==='home' ? content : '.'}
                  </div>
                  {/* Minute */}
                  <div className="text-center text-theme-text-secondary">{e.minute}'</div>
                  {/* Away column */}
                  <div className={`text-right ${e.team==='away' ? 'font-semibold text-theme-dark' : 'text-transparent'}`}>
                    {e.team==='away' ? content : '.'}
                  </div>
                </div>
              );
            })}
          {match.events.length === 0 && <div className="text-sm text-theme-text-secondary">No events yet.</div>}
        </div>
      </div>
    </div>
  );
}

